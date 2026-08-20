/**
 * Host half of dsh-skills-settings: a small HTTP admin surface for skills
 * filesystem operations that the browser bundle cannot reach through the
 * client RPC surface (which only exposes `skill.list`).
 *
 * Routes (all JSON, same-origin, prefix `/plugins/skills-admin`):
 *   GET    /skill?name=&sessionId=&cwd= -> { ok, skill: {content,path,description,whenToUse,source,disabled} }
 *   PUT    /skill                       -> { ok, path }  (body: {name, sessionId, cwd?, content})
 *   POST   /skill                       -> { ok, path }  (body: {name, description, whenToUse, body, sessionId, cwd?})
 *   DELETE /skill                       -> { ok }        (body: {name, sessionId, cwd?})
 *   POST   /toggle                      -> { ok, disabled } (body: {name, sessionId, cwd?})
 *   POST   /upload                      -> { ok, name, path } (body: {fileName, dataBase64, sessionId, cwd?})
 *   POST   /import                      -> { ok, name, path } (body: {url, sessionId, cwd?})
 *
 * `cwd` is an explicit workspace override (this is a loopback-local admin
 * surface); otherwise the cwd comes from the named session, or the first
 * session with a cwd. Skill locations are resolved through the `skills`
 * registry (winning candidate path), never from raw user path input; new
 * skills are created under `<cwd>/.dsh/skills/<kebab-name>/SKILL.md`. The
 * filesystem provider watches these roots, so mutations invalidate the
 * catalog automatically.
 */
import { readFile, writeFile, mkdir, rm, rename } from "node:fs/promises";
import { join, dirname, basename } from "node:path";
import * as fflate from "fflate";
import * as yaml from "yaml";
import { isSkillName, isUserInvocable } from "@deepseek-ai/dsh-skill";

const name = "skills-admin";
const inject = ["webServer", "skills", "sessions"];
const MAX_BODY_BYTES = 8 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 256;
const MAX_ZIP_TOTAL = 20 * 1024 * 1024;

//#region helpers
function json(res, status, value) {
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store"
	});
	res.end(JSON.stringify(value));
}
async function readBody(req, limit = MAX_BODY_BYTES) {
	const chunks = [];
	let size = 0;
	for await (const chunk of req) {
		size += chunk.length;
		if (size > limit) throw Object.assign(new Error("request body too large"), { status: 413 });
		chunks.push(chunk);
	}
	return Buffer.concat(chunks).toString("utf8");
}
async function readJson(req) {
	const text = await readBody(req);
	if (text === "") return {};
	try {
		return JSON.parse(text);
	} catch (error) {
		throw Object.assign(new Error(`invalid JSON body: ${String(error && error.message ? error.message : error)}`), { status: 400 });
	}
}
/** Resolve the cwd for skill lookups: explicit override, the named session, else the first session with a cwd. */
function resolveCwd(ctx, sessionId, explicit) {
	if (typeof explicit === "string" && explicit !== "") return explicit;
	if (sessionId !== void 0) {
		const session = ctx.sessions.get(sessionId);
		if (session?.header?.cwd) return session.header.cwd;
	}
	for (const session of ctx.sessions.list()) {
		if (session.header?.cwd) return session.header.cwd;
	}
	return void 0;
}
function kebabFrom(value) {
	return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function extnameOf(filePath) {
	const index = filePath.lastIndexOf(".");
	return index <= 0 ? "" : filePath.slice(index);
}
function parseFrontmatter(text) {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
	if (match === null) return { front: {}, body: text };
	let front = {};
	try {
		const parsed = yaml.parse(match[1]);
		if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) front = parsed;
	} catch {
		/* malformed frontmatter -> treat as empty */
	}
	return { front, body: text.slice(match[0].length) };
}
function renderSkillFile(fields) {
	const front = { name: fields.name };
	if (fields.description) front.description = fields.description;
	if (fields.whenToUse) front.whenToUse = fields.whenToUse;
	if (fields.category) front.category = fields.category;
	return `---\n${yaml.stringify(front).trimEnd()}\n---\n\n${fields.body || ""}`;
}
/** Project skills root for a cwd. */
function projectRoot(cwd) {
	if (!cwd) throw Object.assign(new Error("cannot resolve a workspace cwd for this session"), { status: 400 });
	return join(cwd, ".dsh", "skills");
}
/** Skill categories: storage keys in SKILL.md frontmatter `category`. */
const CATEGORIES = /* @__PURE__ */ new Set(["local", "github", "user", "memory"]);
const DEFAULT_CATEGORY = "local";
function normalizeCategory(value) {
	return typeof value === "string" && CATEGORIES.has(value) ? value : DEFAULT_CATEGORY;
}
/** Read a skill file's frontmatter category (defaults to the default category). */
function categoryOf(content) {
	const value = parseFrontmatter(content).front["category"];
	return typeof value === "string" && CATEGORIES.has(value) ? value : DEFAULT_CATEGORY;
}
/** Set (or remove when `category` is null) the frontmatter category of a SKILL.md file. */
async function setSkillCategory(path, category) {
	let content = await readFile(path, "utf8");
	const parsed = parseFrontmatter(content);
	if (category === null || category === void 0) delete parsed.front["category"];
	else parsed.front["category"] = normalizeCategory(category);
	content = `---\n${yaml.stringify(parsed.front).trimEnd()}\n---\n\n${parsed.body}`;
	await writeFile(path, content, "utf8");
}
/**
 * Resolve the skills registry the way the api-proxy skill.list does: a live
 * session's agent preset may mount its own scoped registry (with the
 * filesystem provider in that layer), falling back to the host-global one.
 */
async function resolveSkillContext(ctx, sessionId) {
	let session;
	if (sessionId !== void 0) {
		try {
			session = ctx.sessions.get(sessionId);
		} catch {
			session = void 0;
		}
	}
	let registry = ctx.get("skills");
	let scope;
	if (session !== void 0) {
		try {
			const live = ctx.get("agents")?.get(sessionId);
			const presets = ctx.get("agentPresets");
			if (live !== void 0 && presets !== void 0) {
				const scoped = presets.serviceFor(live, "skills");
				if (scoped !== void 0) registry = scoped;
				scope = live;
			}
		} catch {
			/* keep the global registry */
		}
	}
	return { registry, scope };
}
/** Locate the winning skill's SKILL.md path via the (session-scoped) registry. */
async function locateSkill(ctx, cwd, sessionId, skillName) {
	const { registry, scope } = await resolveSkillContext(ctx, sessionId);
	const skill = await registry.get(skillName, { cwd, scope });
	if (skill === void 0 || skill.path === void 0) return void 0;
	return skill;
}
function skillDirOf(skill) {
	return skill.resourceBase && skill.resourceBase.kind === "directory" ? skill.resourceBase.path : dirname(skill.path);
}
/** Create a directory skill from raw SKILL.md text; returns the written path. */
async function createDirSkill(root, rawName, content) {
	const parsed = parseFrontmatter(content);
	const name = typeof parsed.front.name === "string" && parsed.front.name !== "" ? parsed.front.name : rawName;
	if (!isSkillName(name)) throw Object.assign(new Error(`skill name ${JSON.stringify(name)} is not valid kebab-case`), { status: 400 });
	const dir = join(root, name);
	await mkdir(dir, { recursive: true });
	const path = join(dir, "SKILL.md");
	await writeFile(path, content, "utf8");
	return { name, path };
}
/** Extract a zip skill package: requires a SKILL.md (or a root *.md) entry. */
function zipSkillNameAndFiles(buffer) {
	let files;
	try {
		files = fflate.unzipSync(new Uint8Array(buffer));
	} catch (error) {
		throw Object.assign(new Error(`not a valid zip archive: ${String(error && error.message ? error.message : error)}`), { status: 400 });
	}
	const entries = Object.entries(files);
	if (entries.length === 0) throw Object.assign(new Error("zip archive is empty"), { status: 400 });
	if (entries.length > MAX_ZIP_ENTRIES) throw Object.assign(new Error(`zip archive has too many entries (${entries.length})`), { status: 400 });
	let total = 0;
	for (const [, data] of entries) {
		total += data.length;
		if (total > MAX_ZIP_TOTAL) throw Object.assign(new Error("zip archive expands beyond the size limit"), { status: 400 });
	}
	const skillEntry = entries.find(([entryName]) => basename(entryName).toLowerCase() === "skill.md");
	const fallback = entries.find(([entryName]) => !entryName.includes("/") && !entryName.includes("\\") && /\.md$/i.test(entryName));
	const chosen = skillEntry ?? fallback;
	if (chosen === void 0) throw Object.assign(new Error("技能包必须包含 SKILL.md 文件"), { status: 400 });
	const [chosenPath, chosenData] = chosen;
	const parsed = parseFrontmatter(new TextDecoder().decode(chosenData));
	const name = typeof parsed.front.name === "string" && parsed.front.name !== "" ? parsed.front.name : kebabFrom(basename(chosenPath, extnameOf(chosenPath)));
	if (!isSkillName(name)) throw Object.assign(new Error(`无法从技能包确定有效的技能名（${JSON.stringify(name)}）`), { status: 400 });
	return { name, chosenPath, chosenData };
}
/** Strip a base directory prefix from zip entry names (guard against ".." escapes). */
function safeRelPath(entryName) {
	const normalized = entryName.replace(/\\/g, "/");
	const parts = normalized.split("/").filter((part) => part !== "" && part !== "." && part !== "..");
	return parts.join("/");
}
//#endregion

//#region route handlers
async function handleGetSkill(ctx, url, res) {
	const skillName = url.searchParams.get("name") ?? "";
	const sessionId = url.searchParams.get("sessionId") ?? void 0;
	const cwd = resolveCwd(ctx, sessionId, url.searchParams.get("cwd") ?? void 0);
	const skill = await locateSkill(ctx, cwd, sessionId, skillName);
	if (skill === void 0) return json(res, 404, { ok: false, error: `技能 ${JSON.stringify(skillName)} 不存在` });
	let content;
	try {
		content = await readFile(skill.path, "utf8");
	} catch (error) {
		return json(res, 500, { ok: false, error: `读取失败: ${String(error && error.message ? error.message : error)}` });
	}
	json(res, 200, {
		ok: true,
		skill: {
			name: skill.name,
			description: skill.description,
			whenToUse: skill.whenToUse,
			source: skill.source,
			path: skill.path,
			disabled: parseFrontmatter(content).front["disable-model-invocation"] === true,
			category: categoryOf(content),
			content
		}
	});
}
async function handlePutSkill(ctx, body, res) {
	const { name: skillName, sessionId, content } = body;
	if (typeof skillName !== "string" || skillName === "") return json(res, 400, { ok: false, error: "缺少技能名" });
	if (typeof content !== "string") return json(res, 400, { ok: false, error: "缺少 content" });
	const cwd = resolveCwd(ctx, sessionId, body.cwd);
	const skill = await locateSkill(ctx, cwd, sessionId, skillName);
	if (skill === void 0) return json(res, 404, { ok: false, error: `技能 ${JSON.stringify(skillName)} 不存在` });
	try {
		await writeFile(skill.path, content, "utf8");
	} catch (error) {
		return json(res, 500, { ok: false, error: `写入失败: ${String(error && error.message ? error.message : error)}` });
	}
	json(res, 200, { ok: true, path: skill.path });
}
async function handlePostSkill(ctx, body, res) {
	const { name: rawName, description, whenToUse, body: skillBody, sessionId } = body;
	const name = kebabFrom(typeof rawName === "string" ? rawName : "");
	if (!isSkillName(name)) return json(res, 400, { ok: false, error: "技能名必须是合法的 kebab-case（小写字母、数字、连字符）" });
	const cwd = resolveCwd(ctx, sessionId, body.cwd);
	const root = projectRoot(cwd);
	const content = renderSkillFile({
		name,
		description: typeof description === "string" ? description : "",
		whenToUse: typeof whenToUse === "string" ? whenToUse : "",
		category: normalizeCategory(body.category ?? "user"),
		body: typeof skillBody === "string" ? skillBody : ""
	});
	try {
		const dir = join(root, name);
		await mkdir(dir, { recursive: true });
		const path = join(dir, "SKILL.md");
		await writeFile(path, content, "utf8");
		json(res, 200, { ok: true, name, path });
	} catch (error) {
		json(res, 500, { ok: false, error: `创建失败: ${String(error && error.message ? error.message : error)}` });
	}
}
async function handleDeleteSkill(ctx, body, res) {
	const { name: skillName, sessionId } = body;
	if (typeof skillName !== "string" || skillName === "") return json(res, 400, { ok: false, error: "缺少技能名" });
	const cwd = resolveCwd(ctx, sessionId, body.cwd);
	const skill = await locateSkill(ctx, cwd, sessionId, skillName);
	if (skill === void 0) return json(res, 404, { ok: false, error: `技能 ${JSON.stringify(skillName)} 不存在` });
	try {
		await rm(skillDirOf(skill), { recursive: true, force: true });
		json(res, 200, { ok: true });
	} catch (error) {
		json(res, 500, { ok: false, error: `删除失败: ${String(error && error.message ? error.message : error)}` });
	}
}
async function handleToggleSkill(ctx, body, res) {
	const { name: skillName, sessionId } = body;
	if (typeof skillName !== "string" || skillName === "") return json(res, 400, { ok: false, error: "缺少技能名" });
	const cwd = resolveCwd(ctx, sessionId, body.cwd);
	const skill = await locateSkill(ctx, cwd, sessionId, skillName);
	if (skill === void 0) return json(res, 404, { ok: false, error: `技能 ${JSON.stringify(skillName)} 不存在` });
	try {
		let content = await readFile(skill.path, "utf8");
		const parsed = parseFrontmatter(content);
		const disabled = parsed.front["disable-model-invocation"] === true;
		if (disabled) delete parsed.front["disable-model-invocation"];
		else parsed.front["disable-model-invocation"] = true;
		content = `---\n${yaml.stringify(parsed.front).trimEnd()}\n---\n\n${parsed.body}`;
		await writeFile(skill.path, content, "utf8");
		json(res, 200, { ok: true, disabled: !disabled });
	} catch (error) {
		json(res, 500, { ok: false, error: `操作失败: ${String(error && error.message ? error.message : error)}` });
	}
}
async function handleUploadSkill(ctx, body, res) {
	const { fileName, dataBase64, sessionId } = body;
	if (typeof fileName !== "string" || fileName === "") return json(res, 400, { ok: false, error: "缺少文件名" });
	if (typeof dataBase64 !== "string" || dataBase64 === "") return json(res, 400, { ok: false, error: "缺少文件内容" });
	let buffer;
	try {
		buffer = Buffer.from(dataBase64, "base64");
	} catch (error) {
		return json(res, 400, { ok: false, error: `文件内容解码失败: ${String(error && error.message ? error.message : error)}` });
	}
	const cwd = resolveCwd(ctx, sessionId, body.cwd);
	const root = projectRoot(cwd);
	try {
		const lower = fileName.toLowerCase();
		if (lower.endsWith(".zip")) {
			const { name, chosenPath, chosenData } = zipSkillNameAndFiles(buffer);
			const dir = join(root, name);
			await mkdir(dir, { recursive: true });
			const skillRel = safeRelPath(chosenPath);
			const target = join(dir, skillRel);
			await mkdir(dirname(target), { recursive: true });
			await writeFile(target, Buffer.from(chosenData), "utf8");
			const all = fflate.unzipSync(new Uint8Array(buffer));
			for (const [entryName, data] of Object.entries(all)) {
				const rel = safeRelPath(entryName);
				if (rel === "" || rel === skillRel) continue;
				const out = join(dir, rel);
				await mkdir(dirname(out), { recursive: true });
				await writeFile(out, Buffer.from(data), "utf8");
			}
			await setSkillCategory(target, "local");
			json(res, 200, { ok: true, name, path: target, category: "local" });
		} else if (lower.endsWith(".md") || lower.endsWith(".markdown") || lower.endsWith(".txt")) {
			const text = buffer.toString("utf8");
			const { name, path } = await createDirSkill(root, kebabFrom(basename(fileName, extnameOf(fileName))), text);
			await setSkillCategory(path, "local");
			json(res, 200, { ok: true, name, path, category: "local" });
		} else {
			json(res, 400, { ok: false, error: "仅支持 .zip 技能包或 .md/.markdown/.txt 文件（必须含 SKILL.md）" });
		}
	} catch (error) {
		json(res, error?.status ?? 500, { ok: false, error: String(error && error.message ? error.message : error) });
	}
}
async function handleImportSkill(ctx, body, res) {
	const { url, sessionId } = body;
	if (typeof url !== "string" || url.trim() === "") return json(res, 400, { ok: false, error: "缺少仓库链接" });
	const cwd = resolveCwd(ctx, sessionId, body.cwd);
	const root = projectRoot(cwd);
	try {
		const trimmed = url.trim();
		let rawUrl;
		let repoName = "";
		const githubRepo = /^https?:\/\/(?:www\.)?github\.com\/([^/\s]+\/[^/\s]+?)(?:\/|$)/.exec(trimmed);
		if (githubRepo !== null) {
			repoName = githubRepo[1].split("/")[1] ?? "";
			rawUrl = `https://raw.githubusercontent.com/${githubRepo[1]}/HEAD/SKILL.md`;
		} else if (/^https?:\/\/raw\.githubusercontent\.com\//.test(trimmed)) {
			rawUrl = trimmed;
		} else {
			return json(res, 400, { ok: false, error: "无法识别的链接，请输入 GitHub 仓库链接（如 https://github.com/user/repo）或 raw 文件链接" });
		}
		const response = await fetch(rawUrl, { signal: AbortSignal.timeout(15000) });
		if (!response.ok) {
			return json(res, 400, { ok: false, error: `无法获取 SKILL.md（${response.status}）。请确认仓库根目录包含 SKILL.md 文件` });
		}
		const text = await response.text();
		if (text.trim() === "") return json(res, 400, { ok: false, error: "远程 SKILL.md 为空" });
		const { name, path } = await createDirSkill(root, kebabFrom(repoName || "imported-skill"), text);
		await setSkillCategory(path, "github");
		json(res, 200, { ok: true, name, path, category: "github" });
	} catch (error) {
		json(res, 500, { ok: false, error: `导入失败: ${String(error && error.message ? error.message : error)}` });
	}
}
/** Change a skill's category (frontmatter `category`). */
async function handleCategorySkill(ctx, body, res) {
	const { name: skillName, category, sessionId } = body;
	if (typeof skillName !== "string" || skillName === "") return json(res, 400, { ok: false, error: "缺少技能名" });
	const cwd = resolveCwd(ctx, sessionId, body.cwd);
	const skill = await locateSkill(ctx, cwd, sessionId, skillName);
	if (skill === void 0) return json(res, 404, { ok: false, error: `技能 ${JSON.stringify(skillName)} 不存在` });
	try {
		const normalized = normalizeCategory(category);
		await setSkillCategory(skill.path, normalized);
		json(res, 200, { ok: true, name: skillName, category: normalized });
	} catch (error) {
		json(res, 500, { ok: false, error: `分类更新失败: ${String(error && error.message ? error.message : error)}` });
	}
}
/** List skills merged with per-skill frontmatter category + disabled state. */
async function handleListSkills(ctx, url, res) {
	const sessionId = url.searchParams.get("sessionId") ?? void 0;
	const cwd = resolveCwd(ctx, sessionId, url.searchParams.get("cwd") ?? void 0);
	const { registry, scope } = await resolveSkillContext(ctx, sessionId);
	const summaries = await registry.list({ cwd, scope });
	const out = [];
	for (const summary of summaries) {
		if (!isUserInvocable(summary)) continue;
		let category = DEFAULT_CATEGORY;
		let disabled = false;
		let path;
		try {
			const skill = await registry.get(summary.name, { cwd, scope });
			path = skill?.path;
			if (path) {
				const content = await readFile(path, "utf8");
				category = categoryOf(content);
				disabled = parseFrontmatter(content).front["disable-model-invocation"] === true;
			}
		} catch {
			/* keep defaults */
		}
		out.push({
			name: summary.name,
			description: summary.description,
			...summary.whenToUse === void 0 ? {} : { whenToUse: summary.whenToUse },
			modelInvocable: summary.invocation.modelInvocable,
			category,
			disabled
		});
	}
	json(res, 200, { ok: true, skills: out });
}
//#endregion

/** Route dispatch over the composed handler. */
async function route(ctx, req, res) {
	const url = new URL(req.url ?? "/", "http://x");
	const pathname = url.pathname;
	const prefix = "/plugins/skills-admin";
	const sub = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
	if (sub === "/skill" && req.method === "GET") return handleGetSkill(ctx, url, res);
	if (sub === "/skill" && req.method === "PUT") return handlePutSkill(ctx, await readJson(req), res);
	if (sub === "/skill" && req.method === "POST") return handlePostSkill(ctx, await readJson(req), res);
	if (sub === "/skill" && req.method === "DELETE") return handleDeleteSkill(ctx, await readJson(req), res);
	if (sub === "/toggle" && req.method === "POST") return handleToggleSkill(ctx, await readJson(req), res);
	if (sub === "/upload" && req.method === "POST") return handleUploadSkill(ctx, await readJson(req), res);
	if (sub === "/import" && req.method === "POST") return handleImportSkill(ctx, await readJson(req), res);
	if (sub === "/category" && req.method === "POST") return handleCategorySkill(ctx, await readJson(req), res);
	if (sub === "/list" && req.method === "GET") return handleListSkills(ctx, url, res);
	return json(res, 404, { ok: false, error: `未知操作 ${req.method} ${sub}` });
}

/** Host plugin body: mount the admin routes on the shared webserver. */
function apply(ctx) {
	ctx.webServer.register({
		kind: "prefix",
		path: "/plugins/skills-admin",
		handler: async (req, res) => {
			try {
				await route(ctx, req, res);
			} catch (error) {
				json(res, error?.status ?? 500, { ok: false, error: String(error && error.message ? error.message : error) });
			}
		}
	});
}

export { apply, inject, name };
