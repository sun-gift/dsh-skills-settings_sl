window.__ModuleLoader__.load({
	id: "dsh-skills-settings_sl",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		/** Skills Settings section: a "技能" nav row in the DSH Settings shell.
		 * List view: title + subtitle, search, 全部/模型可调用/仅用户触发 pills,
		 * a 创建技能 dropdown (上传技能 / 通过 dsh 生成 / 从 GitHub 导入), and a
		 * grid of skill cards. Detail view: SKILL.md rendered as markdown with
		 * actions 编辑 / 停用(启用) / 删除 / 立即使用. Filesystem operations go
		 * through the host routes under /plugins/skills-admin (served by the
		 * plugin's host half); the skill list itself comes from `skill.list`. */
		//#region styles
		const css = [
			".dss_section{flex-direction:column;gap:14px;width:100%;max-width:880px;display:flex}",
			".dss_title{margin:0;padding:0 2px;font-size:20px;line-height:28px;font-weight:600;color:var(--dsw-alias-label-primary)}",
			".dss_intro{margin:0;padding:0 2px;font-size:13px;line-height:20px;color:var(--dsw-alias-label-tertiary)}",
			".dss_toolbar{flex-direction:row;gap:10px;align-items:center;display:flex}",
			".dss_search{flex:1;min-width:0;flex-direction:row;gap:6px;align-items:center;padding:6px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-3);display:flex;transition:border-color .12s ease}",
			".dss_search:focus-within{border-color:var(--dsw-alias-label-dimmed)}",
			".dss_searchIcon{color:var(--dsw-alias-label-tertiary);flex:none}",
			".dss_searchInput{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px}",
			".dss_searchInput::placeholder{color:var(--dsw-alias-label-tertiary)}",
			".dss_count{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;white-space:nowrap}",
			".dss_btnDanger{color:var(--dsw-alias-state-error-primary)!important;border-color:var(--dsw-alias-state-error-primary)!important}",
			".dss_btnDanger:hover{background:var(--dsw-alias-state-error-primary)!important;color:var(--dsw-alias-bg-base)!important}",
			".dss_menuWrap{position:relative;flex:none}",
			".dss_menu{position:absolute;top:calc(100% + 6px);right:0;min-width:320px;flex-direction:column;gap:2px;padding:6px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-3);box-shadow:0 8px 28px rgb(0 0 0 / 35%);z-index:60;display:flex}",
			".dss_menuItem{flex-direction:row;gap:10px;align-items:center;padding:8px 10px;border:0;border-radius:10px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;display:flex;transition:background .12s ease}",
			".dss_menuItem:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".dss_menuIcon{width:36px;height:36px;border-radius:50%;flex:none;align-items:center;justify-content:center;background:var(--dsw-alias-bg-layer-1,#444);color:var(--dsw-alias-label-primary);display:inline-flex}",
			".dss_menuTexts{flex-direction:column;gap:1px;min-width:0;display:flex}",
			".dss_menuTitle{font-size:13.5px;line-height:20px;font-weight:600;color:var(--dsw-alias-label-primary)}",
			".dss_menuDesc{font-size:12px;line-height:17px;color:var(--dsw-alias-label-tertiary)}",
			".dss_pills{flex-direction:row;gap:8px;flex-wrap:wrap;display:flex}",
			".dss_pill{padding:4px 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:18px;cursor:pointer;transition:background .12s ease,border-color .12s ease,color .12s ease}",
			".dss_pill:hover{border-color:var(--dsw-alias-label-dimmed);background:var(--dsw-alias-interactive-bg-hover)}",
			".dss_pillOn{background:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base)}",
			".dss_grid{grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;display:grid}",
			".dss_card{flex-direction:column;gap:8px;padding:14px;border:1px solid var(--dsw-alias-border-l2);border-radius:14px;background:var(--dsw-alias-bg-layer-3);display:flex;cursor:pointer;transition:transform .16s ease,box-shadow .16s ease,background .12s ease,border-color .12s ease}",
			".dss_card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgb(0 0 0 / 18%);border-color:var(--dsw-alias-label-dimmed);background:var(--dsw-alias-interactive-bg-hover)}",
			".dss_cardTop{flex-direction:row;gap:10px;align-items:center;min-width:0;display:flex}",
			".dss_icon{width:36px;height:36px;border-radius:50%;flex:none;align-items:center;justify-content:center;color:#fff;display:inline-flex}",
			".dss_name{flex:1;min-width:0;font-size:14px;line-height:20px;font-weight:600;color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}",
			".dss_check{flex:none;color:var(--dsw-alias-state-success-primary,#3fb68b);display:inline-flex}",
			".dss_desc{margin:0;font-size:12.5px;line-height:18px;color:var(--dsw-alias-label-tertiary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
			".dss_tag{flex:none;align-self:flex-start;padding:1px 8px;border-radius:999px;font-size:11px;line-height:16px;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary)}",
			".dss_tagModel{color:var(--dsw-alias-state-success-primary,#3fb68b);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary,#3fb68b) 45%,transparent)}",
			".dss_state{padding:28px 0;font-size:13px;line-height:20px;color:var(--dsw-alias-label-tertiary);text-align:center}",
			".dss_status{padding:8px 12px;border-radius:8px;font-size:12.5px;line-height:18px}",
			".dss_statusOk{background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#3fb68b) 12%,transparent);color:var(--dsw-alias-state-success-primary,#3fb68b)}",
			".dss_statusErr{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent);color:var(--dsw-alias-state-error-primary)}",
			".dss_detailHeader{flex-direction:row;gap:10px;align-items:center;min-width:0;display:flex}",
			".dss_detailTitle{flex:1;min-width:0;margin:0;font-size:17px;line-height:24px;font-weight:600;color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}",
			".dss_md{padding:14px 16px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-3);overflow-x:auto}",
			".dss_editor{flex-direction:column;gap:8px;display:flex}",
			".dss_textarea{width:100%;box-sizing:border-box;min-height:340px;padding:12px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);font:13px/1.6 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;resize:vertical;outline:0}",
			".dss_textarea:focus{border-color:var(--dsw-alias-label-dimmed)}",
			".dss_actions{flex-direction:row;gap:8px;flex-wrap:wrap;align-items:center;display:flex}",
			".dss_actionsSpacer{flex:1}",
			".dss_overlay{position:fixed;inset:0;z-index:200;align-items:flex-start;justify-content:center;padding:80px 24px 24px;background:rgb(0 0 0 / 45%);display:flex;overflow:auto}",
			".dss_modal{width:100%;max-width:520px;flex-direction:column;gap:12px;padding:18px 20px;border:1px solid var(--dsw-alias-border-l2);border-radius:16px;background:var(--dsw-alias-bg-layer-2,#222);box-shadow:0 12px 40px rgb(0 0 0 / 45%);display:flex}",
			".dss_modalHeader{flex-direction:row;gap:10px;align-items:center;display:flex}",
			".dss_modalTitle{flex:1;margin:0;font-size:15px;line-height:22px;font-weight:600;color:var(--dsw-alias-label-primary)}",
			".dss_field{flex-direction:column;gap:4px;display:flex}",
			".dss_label{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}",
			".dss_input{box-sizing:border-box;width:100%;padding:7px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;outline:0}",
			".dss_input:focus{border-color:var(--dsw-alias-label-dimmed)}",
			".dss_inputSmall{width:auto;flex:1;min-width:0}",
			".dss_hint{font-size:12px;line-height:17px;color:var(--dsw-alias-label-tertiary)}",
			".dss_confirmRow{flex-direction:row;gap:8px;align-items:center;display:flex}",
			".dss_disabledCard{opacity:.55}"
		].join("");
		const tagId = "dsh-skills-settings_sl/SkillsSection.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-skills-settings_sl";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		const C = {
			section: "dss_section", title: "dss_title", intro: "dss_intro", toolbar: "dss_toolbar",
			search: "dss_search", searchIcon: "dss_searchIcon", searchInput: "dss_searchInput", count: "dss_count",
			btnDanger: "dss_btnDanger",
			menuWrap: "dss_menuWrap", menu: "dss_menu", menuItem: "dss_menuItem", menuIcon: "dss_menuIcon",
			menuTexts: "dss_menuTexts", menuTitle: "dss_menuTitle", menuDesc: "dss_menuDesc",
			pills: "dss_pills", pill: "dss_pill", pillOn: "dss_pillOn",
			grid: "dss_grid", card: "dss_card", cardTop: "dss_cardTop", icon: "dss_icon", name: "dss_name",
			check: "dss_check", desc: "dss_desc", tag: "dss_tag", tagModel: "dss_tagModel", state: "dss_state",
			status: "dss_status", statusOk: "dss_statusOk", statusErr: "dss_statusErr",
			detailHeader: "dss_detailHeader", detailTitle: "dss_detailTitle", md: "dss_md",
			editor: "dss_editor", textarea: "dss_textarea", actions: "dss_actions", actionsSpacer: "dss_actionsSpacer",
			overlay: "dss_overlay", modal: "dss_modal", modalHeader: "dss_modalHeader", modalTitle: "dss_modalTitle",
			field: "dss_field", label: "dss_label", input: "dss_input", inputSmall: "dss_inputSmall", hint: "dss_hint",
			confirmRow: "dss_confirmRow", disabledCard: "dss_disabledCard"
		};
		//#endregion
		//#region locale
		const NS = "skills-settings";
		const zh = {
			nav: "技能", title: "技能",
			intro: "为您的智能体提供预封装且可复用的最佳实践与工具",
			searchPlaceholder: "搜索技能",
			all: "全部", catAll: "全部", catLocal: "本地导入", catGithub: "GitHub导入", catUser: "用户创建", catMemory: "记忆",
			categoryLabel: "分类", categorySaved: "分类已更新",
			installed: "已安装", count: "共 {count} 个",
			loading: "加载中…", error: "加载失败", noSession: "暂无会话，请先开始一个对话", empty: "没有匹配的技能",
			create: "创建技能", uploadSkill: "上传技能", uploadSkillDesc: "上传技能包，必须含SKILL.md文件",
			generate: "通过 dsh 生成", generateDesc: "通过 dsh 生成技能文件",
			importGithub: "从 GitHub 导入", importGithubDesc: "粘贴一个仓库链接以开始",
			back: "返回", edit: "编辑", save: "保存", cancel: "取消", delete: "删除", confirmDelete: "确认删除「{name}」？此操作不可恢复。",
			disable: "停用", enable: "启用", useNow: "立即使用", useNowSent: "已选择 {name}.skill，请在对话中继续输入指令",
			disabledTag: "已停用",
			createTitle: "通过 dsh 生成新技能", nameLabel: "技能名（kebab-case，如 my-skill）",
			descLabel: "描述（一句话说明用途）", whenLabel: "使用时机（whenToUse，可选）",
			bodyLabel: "技能内容（SKILL.md 正文，可稍后编辑）", generateCreate: "生成并创建",
			importTitle: "从 GitHub 导入技能", importPlaceholder: "https://github.com/user/repo",
			importHint: "将读取仓库根目录的 SKILL.md 并安装为技能。",
			importGo: "导入", uploading: "正在上传…",
			busy: "处理中…", noSkill: "技能不存在或已被删除",
			copy: "复制", copied: "已复制", footnotes: "脚注",
			renderError: "技能详情渲染失败"
		};
		const en = {
			nav: "Skills", title: "Skills",
			intro: "Pre-packaged best practices and tools for your agent",
			searchPlaceholder: "Search skills",
			all: "All", catAll: "All", catLocal: "Local", catGithub: "GitHub", catUser: "User-created", catMemory: "Memory",
			categoryLabel: "Category", categorySaved: "Category updated",
			installed: "Installed", count: "{count} total",
			loading: "Loading…", error: "Failed to load", noSession: "No session yet — start a conversation first", empty: "No matching skills",
			create: "Create skill", uploadSkill: "Upload skill", uploadSkillDesc: "Upload a skill package; must contain SKILL.md",
			generate: "Generate via dsh", generateDesc: "Generate a skill file via dsh",
			importGithub: "Import from GitHub", importGithubDesc: "Paste a repository link to start",
			back: "Back", edit: "Edit", save: "Save", cancel: "Cancel", delete: "Delete", confirmDelete: "Delete \"{name}\"? This cannot be undone.",
			disable: "Disable", enable: "Enable", useNow: "Use now", useNowSent: "Selected {name}.skill — continue typing your instructions",
			disabledTag: "Disabled",
			createTitle: "Generate a new skill via dsh", nameLabel: "Skill name (kebab-case, e.g. my-skill)",
			descLabel: "Description (one line)", whenLabel: "When to use (whenToUse, optional)",
			bodyLabel: "Skill body (SKILL.md content; editable later)", generateCreate: "Generate & create",
			importTitle: "Import a skill from GitHub", importPlaceholder: "https://github.com/user/repo",
			importHint: "Reads SKILL.md from the repository root and installs it as a skill.",
			importGo: "Import", uploading: "Uploading…",
			busy: "Working…", noSkill: "Skill not found or already deleted",
			copy: "Copy", copied: "Copied", footnotes: "Footnotes",
			renderError: "Failed to render skill details"
		};
		//#endregion
		//#region helpers
		const PALETTE = ["#e5484d", "#f76b15", "#ffb224", "#46a758", "#12a594", "#0091ff", "#6e56cf", "#ab4aba", "#e93d82", "#3b82f6"];
		function colorFor(name) {
			let h = 0;
			for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
			return PALETTE[Math.abs(h) % PALETTE.length];
		}
		function useSnapshot(store) {
			return react.useSyncExternalStore((cb) => store.subscribe(cb), () => store.getSnapshot(), () => store.getSnapshot());
		}
		function h(type, props, key) {
			return react_jsx_runtime.jsx(type, props, key);
		}
		async function adminApi(path, options) {
			const res = await fetch(path, options);
			let data = null;
			try { data = await res.json(); } catch { /* non-JSON */ }
			if (!res.ok || data === null || data.ok !== true) {
				throw new Error((data && data.error) ? data.error : ("HTTP " + res.status));
			}
			return data;
		}
		function cls(...names) {
			return names.filter(Boolean).join(" ");
		}
		/** Map a category key to its display label. */
		function categoryLabel(t, category) {
			switch (category) {
				case "github": return t("catGithub");
				case "user": return t("catUser");
				case "memory": return t("catMemory");
				default: return t("catLocal");
			}
		}
		//#endregion
		//#region components
		function StatusLine({ status }) {
			if (status === null) return null;
			return h("div", {
				className: cls(C.status, status.kind === "ok" ? C.statusOk : C.statusErr),
				children: status.text
			});
		}
		/** Render guard: a section crash (e.g. a primitives API drift) must not blank the whole Settings shell. */
		class RenderGuard extends react.Component {
			constructor(props) {
				super(props);
				this.state = { error: null };
			}
			static getDerivedStateFromError(error) {
				return { error: error instanceof Error ? error.message : String(error) };
			}
			render() {
				if (this.state.error !== null) {
					return h("div", {
						className: C.state,
						children: [
							h("div", { children: (this.props.label || "") + "：" + this.state.error }),
							h(primitives.Button, {
								variant: "outline",
								onClick: () => { this.setState({ error: null }); this.props.onBack && this.props.onBack(); },
								children: this.props.backLabel || "←"
							})
						]
					});
				}
				return this.props.children;
			}
		}
		function SkillCard({ skill, t, onOpen }) {
			const disabled = skill.disabled === true;
			return h("div", {
				className: cls(C.card, disabled ? C.disabledCard : null),
				onClick: () => onOpen(skill.name),
				children: [
					h("div", {
						className: C.cardTop,
						children: [
							h("span", { className: C.icon, style: { background: colorFor(skill.name) }, children: h(primitives.IconSkillOutline16, { size: 18 }) }),
							h("span", { className: C.name, title: skill.name, children: skill.name }),
							h("span", { className: C.check, title: t("installed"), children: h(primitives.IconCheckOutline16, { size: 14 }) })
						]
					}),
					h("p", { className: C.desc, children: skill.description || "" }),
					h("span", {
						className: disabled ? C.tag : C.tag,
						children: disabled ? t("disabledTag") : categoryLabel(t, skill.category)
					})
				]
			});
		}
		function Overlay({ title, onClose, children, t }) {
			return h("div", {
				className: C.overlay,
				onClick: onClose,
				children: h("div", {
					className: C.modal,
					onClick: (e) => e.stopPropagation(),
					children: [
						h("div", { className: C.modalHeader, children: [
							h("h3", { className: C.modalTitle, children: title }),
							h(primitives.Button, { variant: "ghost", onClick: onClose, title: t("cancel"), children: h(primitives.IconCloseOutline16, { size: 16 }) })
						] }),
						children
					]
				})
			});
		}
		function CreateForm({ t, busy, onSubmit, onClose }) {
			const [name, setName] = react.useState("");
			const [description, setDescription] = react.useState("");
			const [whenToUse, setWhenToUse] = react.useState("");
			const [body, setBody] = react.useState("# 技能说明\n\n在这里描述技能的工作方式…");
			const valid = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name.trim());
			return h(Overlay, {
				t, title: t("createTitle"), onClose,
				children: [
					h("div", { className: C.field, children: [
						h("label", { className: C.label, children: t("nameLabel") }),
						h("input", { className: C.input, value: name, placeholder: "my-skill", onChange: (e) => setName(e.target.value) })
					] }),
					h("div", { className: C.field, children: [
						h("label", { className: C.label, children: t("descLabel") }),
						h("input", { className: C.input, value: description, onChange: (e) => setDescription(e.target.value) })
					] }),
					h("div", { className: C.field, children: [
						h("label", { className: C.label, children: t("whenLabel") }),
						h("input", { className: C.input, value: whenToUse, onChange: (e) => setWhenToUse(e.target.value) })
					] }),
					h("div", { className: C.field, children: [
						h("label", { className: C.label, children: t("bodyLabel") }),
						h("textarea", { className: cls(C.textarea, "dss_createBody"), style: { minHeight: "160px" }, value: body, onChange: (e) => setBody(e.target.value) })
					] }),
					h("div", { className: C.actions, children: [
						h("span", { className: C.actionsSpacer }),
						h(primitives.Button, { variant: "outline", onClick: onClose, children: t("cancel") }),
						h(primitives.Button, {
							variant: "primary",
							disabled: busy || !valid,
							onClick: () => onSubmit({ name: name.trim(), description: description.trim(), whenToUse: whenToUse.trim(), body }),
							children: busy ? t("busy") : t("generateCreate")
						})
					] })
				]
			});
		}
		function ImportForm({ t, busy, onSubmit, onClose }) {
			const [url, setUrl] = react.useState("");
			return h(Overlay, {
				t, title: t("importTitle"), onClose,
				children: [
					h("div", { className: C.field, children: [
						h("label", { className: C.label, children: "GitHub" }),
						h("input", { className: C.input, value: url, placeholder: t("importPlaceholder"), onChange: (e) => setUrl(e.target.value) })
					] }),
					h("p", { className: C.hint, children: t("importHint") }),
					h("div", { className: C.actions, children: [
						h("span", { className: C.actionsSpacer }),
						h(primitives.Button, { variant: "outline", onClick: onClose, children: t("cancel") }),
						h(primitives.Button, {
							variant: "primary",
							disabled: busy || url.trim() === "",
							onClick: () => onSubmit(url.trim()),
							children: busy ? t("busy") : t("importGo")
						})
					] })
				]
			});
		}
		function SkillDetail({ t, detail, editing, editContent, onEditChange, busy, confirmDelete, status, onBack, onEdit, onSaveEdit, onCancelEdit, onToggle, onDelete, onConfirmDelete, onCancelDelete, onUseNow, onCategoryChange }) {
			const markdownLabels = react.useMemo(() => ({
				code: { copyLabel: t("copy"), copiedLabel: t("copied") },
				footnotes: t("footnotes")
			}), [t]);
			const header = h("div", {
				className: C.detailHeader,
				children: [
					h(primitives.Button, { variant: "ghost", onClick: onBack, title: t("back"), icon: h(primitives.IconChevronLeftOutline14, { size: 16 }) }),
					h("h3", { className: C.detailTitle, title: detail.name, children: detail.name }),
					detail.disabled === true ? h("span", { className: C.tag, children: t("disabledTag") }) : null
				]
			});
			const categoryRow = h("div", {
				className: C.field,
				style: { flexDirection: "row", alignItems: "center", gap: 8 },
				children: [
					h("label", { className: C.label, children: t("categoryLabel") }),
					h("select", {
						className: cls(C.input, "dss_catSelect"),
						style: { width: "auto", flex: "none" },
						value: detail.category ?? "local",
						disabled: busy,
						onChange: (e) => onCategoryChange(e.target.value),
						children: [
							["local", t("catLocal")],
							["github", t("catGithub")],
							["user", t("catUser")],
							["memory", t("catMemory")]
						].map(([key, label]) => h("option", { value: key, children: label }, key))
					})
				]
			});
			const actions = h("div", {
				className: C.actions,
				children: [
					editing ? null : h(primitives.Button, { variant: "outline", onClick: onEdit, icon: h(primitives.IconEditOutline16, { size: 16 }), children: t("edit") }),
					editing ? null : h(primitives.Button, {
						variant: "outline",
						onClick: onToggle,
						disabled: busy,
						icon: h(primitives.IconPauseOutline16, { size: 16 }),
						children: (detail.disabled === true ? t("enable") : t("disable"))
					}),
					editing ? null : (confirmDelete
						? h("span", { className: C.confirmRow, children: [
							h("span", { className: C.hint, children: t("confirmDelete", { name: detail.name }) }),
							h(primitives.Button, { variant: "outline", className: C.btnDanger, disabled: busy, onClick: onDelete, children: t("delete") }),
							h(primitives.Button, { variant: "outline", onClick: onCancelDelete, children: t("cancel") })
						] })
						: h(primitives.Button, { variant: "outline", className: C.btnDanger, onClick: onConfirmDelete, icon: h(primitives.IconTrashOutline16, { size: 16 }), children: t("delete") })),
					h("span", { className: C.actionsSpacer }),
					editing ? null : h(primitives.Button, { variant: "primary", disabled: busy, onClick: onUseNow, icon: h(primitives.IconSendOutline16, { size: 16 }), children: t("useNow") }),
					editing ? h(primitives.Button, { variant: "outline", onClick: onCancelEdit, children: t("cancel") }) : null,
					editing ? h(primitives.Button, { variant: "primary", disabled: busy, onClick: onSaveEdit, children: t("save") }) : null
				]
			});
			const body = editing
				? h("div", { className: C.editor, children: h("textarea", { className: C.textarea, value: editContent, onChange: (e) => onEditChange(e.target.value), spellCheck: false }) })
				: h("div", { className: C.md, children: h(primitives.MarkdownText, { text: detail.content || "", labels: markdownLabels }) });
			return h("div", { className: C.section, children: [header, categoryRow, actions, h(StatusLine, { status }), body] });
		}
		/** Local editing dispatcher (kept outside the render tree to avoid stale closures). */
		function SkillsSettingsSection(props) {
			const { t, connection, sessions, conversation } = props;
			const [query, setQuery] = react.useState("");
			const [filter, setFilter] = react.useState("all");
			const [skills, setSkills] = react.useState(null);
			const [error, setError] = react.useState(null);
			const [refreshTick, setRefreshTick] = react.useState(0);
			const [view, setView] = react.useState("list");
			const [detail, setDetail] = react.useState(null);
			const [editing, setEditing] = react.useState(false);
			const [confirmDelete, setConfirmDelete] = react.useState(false);
			const [dropdownOpen, setDropdownOpen] = react.useState(false);
			const [modal, setModal] = react.useState(null);
			const [busy, setBusy] = react.useState(false);
			const [status, setStatus] = react.useState(null);
			const list = useSnapshot(sessions.list);
			const current = list.current;
			const [editContent, setEditContent] = react.useState("");
			react.useEffect(() => {
				let cancelled = false;
				if (current === void 0) {
					setSkills([]);
					setError(null);
					return;
				}
				setError(null);
				adminApi("/plugins/skills-admin/list?sessionId=" + encodeURIComponent(current)).then((data) => {
					if (cancelled) return;
					setSkills(data.skills);
				}, (failure) => {
					if (cancelled) return;
					setError(String(failure && failure.message ? failure.message : failure));
				});
				return () => { cancelled = true; };
			}, [current, refreshTick]);
			react.useEffect(() => {
				if (!dropdownOpen) return;
				const handler = () => setDropdownOpen(false);
				document.addEventListener("mousedown", handler);
				return () => document.removeEventListener("mousedown", handler);
			}, [dropdownOpen]);
			const filtered = react.useMemo(() => {
				if (skills === null) return null;
				const q = query.trim().toLowerCase();
				return skills.filter((skill) => {
					if (filter !== "all" && (skill.category ?? "local") !== filter) return false;
					if (q !== "" && !(skill.name.toLowerCase().includes(q) || (skill.description || "").toLowerCase().includes(q))) return false;
					return true;
				});
			}, [skills, query, filter]);
			const refreshList = () => setRefreshTick((v) => v + 1);
			const fail = (message) => setStatus({ kind: "err", text: message });
			const run = async (fn, successText) => {
				setBusy(true);
				setStatus(null);
				try {
					await fn();
					if (successText !== void 0) setStatus({ kind: "ok", text: successText });
				} catch (err) {
					fail(String(err && err.message ? err.message : err));
				} finally {
					setBusy(false);
				}
			};
			const openSkill = async (name) => {
				await run(async () => {
					if (current === void 0) throw new Error(t("noSession"));
					const data = await adminApi("/plugins/skills-admin/skill?name=" + encodeURIComponent(name) + "&sessionId=" + encodeURIComponent(current));
					setDetail(data.skill);
					setEditing(false);
					setConfirmDelete(false);
					setView("detail");
				});
			};
			const backToList = () => {
				setView("list");
				setDetail(null);
				setEditing(false);
				setConfirmDelete(false);
				setStatus(null);
			};
			const saveEdit = async () => {
				await run(async () => {
					await adminApi("/plugins/skills-admin/skill", {
						method: "PUT",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({ name: detail.name, sessionId: current, content: editContent })
					});
					setDetail({ ...detail, content: editContent });
					setEditing(false);
					refreshList();
				}, "已保存");
			};
			const toggleSkill = async () => {
				await run(async () => {
					const data = await adminApi("/plugins/skills-admin/toggle", {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({ name: detail.name, sessionId: current })
					});
					setDetail({ ...detail, disabled: data.disabled === true });
					refreshList();
				});
			};
			const deleteSkill = async () => {
				await run(async () => {
					await adminApi("/plugins/skills-admin/skill", {
						method: "DELETE",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({ name: detail.name, sessionId: current })
					});
					refreshList();
					backToList();
				}, "已删除");
			};
			const changeCategory = async (category) => {
				await run(async () => {
					const data = await adminApi("/plugins/skills-admin/category", {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({ name: detail.name, category, sessionId: current })
					});
					setDetail({ ...detail, category: data.category });
					refreshList();
				}, t("categorySaved"));
			};
			const useNow = () => {
				if (current === void 0) {
					fail(t("noSession"));
					return;
				}
				try {
					const actx = sessions.scope(current);
					const input = conversation !== void 0 && actx !== void 0 ? conversation.input.for(actx) : void 0;
					if (input === void 0) throw new Error("conversation input unavailable");
					const existing = input.state.getSnapshot().draft || "";
					const text = "已选择 " + detail.name + ".skill，";
					input.setDraft(existing.trim() === "" ? text : existing.trimEnd() + " " + text);
					setStatus({ kind: "ok", text: t("useNowSent", { name: detail.name }) });
				} catch (error) {
					fail(String(error && error.message ? error.message : error));
				}
			};
			const createSkill = async (fields) => {
				setModal(null);
				await run(async () => {
					const data = await adminApi("/plugins/skills-admin/skill", {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({ ...fields, sessionId: current })
					});
					refreshList();
					await openSkill(data.name);
					setEditing(true);
				}, "已创建");
			};
			const uploadSkill = (file) => {
				const reader = new FileReader();
				reader.onload = () => {
					const base64 = String(reader.result).split(",")[1] || "";
					run(async () => {
						const data = await adminApi("/plugins/skills-admin/upload", {
							method: "POST",
							headers: { "content-type": "application/json" },
							body: JSON.stringify({ fileName: file.name, dataBase64: base64, sessionId: current })
						});
						refreshList();
						await openSkill(data.name);
					}, "已上传");
				};
				reader.readAsDataURL(file);
			};
			const importSkill = async (url) => {
				setModal(null);
				await run(async () => {
					const data = await adminApi("/plugins/skills-admin/import", {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({ url, sessionId: current })
					});
					refreshList();
					await openSkill(data.name);
				}, "已导入");
			};
			const onFileChosen = (e) => {
				const file = e.target.files && e.target.files[0];
				if (file) uploadSkill(file);
				e.target.value = "";
			};
			// detail view
			if (view === "detail" && detail !== null) {
				return h(RenderGuard, { label: t("renderError"), backLabel: t("back"), onBack: backToList }, h(SkillDetail, {
					t, detail, editing, editContent, busy, confirmDelete, status,
					connection, current,
					onEditChange: (value) => setEditContent(value),
					onBack: backToList,
					onEdit: () => { setEditContent(detail.content); setEditing(true); },
					onSaveEdit: saveEdit,
					onCancelEdit: () => setEditing(false),
					onToggle: toggleSkill,
					onDelete: deleteSkill,
					onConfirmDelete: () => setConfirmDelete(true),
					onCancelDelete: () => setConfirmDelete(false),
					onUseNow: useNow,
					onCategoryChange: changeCategory
				}));
			}
			// list view
			let body;
			if (error !== null) body = h("div", { className: C.state, children: t("error") + "：" + error });
			else if (skills === null) body = h("div", { className: C.state, children: t("loading") });
			else if (current === void 0) body = h("div", { className: C.state, children: t("noSession") });
			else if (filtered.length === 0) body = h("div", { className: C.state, children: t("empty") });
			else body = h("div", { className: C.grid, children: filtered.map((skill) => h(SkillCard, { skill, t, onOpen: openSkill }, skill.name)) });
			return h("section", {
				className: C.section,
				children: [
					h("h2", { className: C.title, children: t("title") }),
					h("p", { className: C.intro, children: t("intro") }),
					h("div", {
						className: C.toolbar,
						children: [
							h("label", {
								className: C.search,
								children: [
									h(primitives.IconSearchOutline16, { className: C.searchIcon }),
									h("input", {
										className: C.searchInput,
										type: "search",
										placeholder: t("searchPlaceholder"),
										value: query,
										onChange: (e) => setQuery(e.target.value)
									})
								]
							}),
							h("span", { className: C.count, children: t("count", { count: skills === null ? "…" : String(skills.length) }) }),
							h("div", {
								className: C.menuWrap,
								children: [
									h(primitives.Button, {
										variant: "primary",
										onClick: (e) => { e.stopPropagation(); setDropdownOpen((v) => !v); },
										icon: h(primitives.IconPlusOutline16, { size: 16 }),
										children: [t("create"), " ", h(primitives.IconChevronDownOutline14, { size: 12 })]
									}),
									dropdownOpen ? h("div", {
										className: C.menu,
										onMouseDown: (e) => e.stopPropagation(),
										children: [
											h("button", {
												className: C.menuItem,
												onClick: () => { setDropdownOpen(false); document.getElementById("dsh-skills-upload-input")?.click(); },
												children: [
													h("span", { className: C.menuIcon, children: h(primitives.IconRightUpOutline16, { size: 16 }) }),
													h("span", { className: C.menuTexts, children: [
														h("span", { className: C.menuTitle, children: t("uploadSkill") }),
														h("span", { className: C.menuDesc, children: t("uploadSkillDesc") })
													] })
												]
											}),
											h("button", {
												className: C.menuItem,
												onClick: () => { setDropdownOpen(false); setModal("create"); },
												children: [
													h("span", { className: C.menuIcon, children: h(primitives.IconSparkle16, { size: 16 }) }),
													h("span", { className: C.menuTexts, children: [
														h("span", { className: C.menuTitle, children: t("generate") }),
														h("span", { className: C.menuDesc, children: t("generateDesc") })
													] })
												]
											}),
											h("button", {
												className: C.menuItem,
												onClick: () => { setDropdownOpen(false); setModal("import"); },
												children: [
													h("span", { className: C.menuIcon, children: h(primitives.IconDownloadOutline16, { size: 16 }) }),
													h("span", { className: C.menuTexts, children: [
														h("span", { className: C.menuTitle, children: t("importGithub") }),
														h("span", { className: C.menuDesc, children: t("importGithubDesc") })
													] })
												]
											}),
											h("input", {
												id: "dsh-skills-upload-input",
												type: "file",
												accept: ".zip,.md,.markdown,.txt",
												style: { display: "none" },
												onChange: onFileChosen
											})
										]
									}) : null
								]
							})
						]
					}),
					h("div", {
						className: C.pills,
						children: [
							["all", t("catAll")],
							["local", t("catLocal")],
							["github", t("catGithub")],
							["user", t("catUser")],
							["memory", t("catMemory")]
						].map(([key, label]) => h("button", {
							type: "button",
							className: filter === key ? cls(C.pill, C.pillOn) : C.pill,
							onClick: () => setFilter(key),
							children: label
						}, key))
					}),
					h(StatusLine, { status }),
					body,
					modal === "create" ? h(CreateForm, { t, busy, onClose: () => setModal(null), onSubmit: createSkill }) : null,
					modal === "import" ? h(ImportForm, { t, busy, onClose: () => setModal(null), onSubmit: importSkill }) : null
				]
			});
		}
		//#endregion
		/** Required services (cordis fiber inject). */
		const inject = ["slots", "locale", "connection", "sessions"];
		/** Client plugin body. */
		function apply(ctx) {
			ctx.effect(() => {
				const offZh = ctx.locale.register(NS, "zh", zh);
				const offEn = ctx.locale.register(NS, "en", en);
				return () => {
					offZh();
					offEn();
				};
			}, "dsh-skills-settings_sl: dictionaries");
			const t = ctx.locale.bind(NS);
			const connection = ctx.get("connection");
			const sessions = ctx.get("sessions");
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "skills",
				order: 20,
				label: () => t("nav"),
				locale: NS,
				inject: () => ({ connection, sessions, conversation: ctx.get("conversation") })
			}, SkillsSettingsSection));
		}
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
