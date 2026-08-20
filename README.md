# dsh-skills-settings_sl

English | [中文](README.zh.md)

A DSH (DeepSeek Harness) web client plugin that adds a **Skills** section to the
**Settings** shell, for browsing and managing the DSH skills installed on the
current machine.

## Features

- **Skill list** — icon + name + installed badge + description cards, with keyword search and hover lift
- **Category filter** — pill filters (All / Local / GitHub / User-created / Memory); the category is read from the skill's `SKILL.md` frontmatter `category` field
- **Create skill** — three sources:
  - Upload a skill package (`.zip` / `.md`) → category `local`
  - Generate via dsh → category `user`
  - Import from a GitHub repository → category `github`
- **Skill details** — Markdown preview, category dropdown (saves on change), edit and save
- **Disable / enable** — toggles the frontmatter `disable-model-invocation` key (the skill stays registered and visible; the file suffix is never renamed)
- **Delete** — with confirmation
- **Use now** — writes the skill into the current session's input draft (does not send)

## Requirements

- DSH web profile (`dsh --profile web`)
- Node.js >= 20

## Install (remote — no local files needed)

The plugin is published to the npm registry, so you can install it straight from
the registry — no cloning, no `file:` links, no manual copying.

### Option A — one command (recommended)

```sh
dsh plugin --profile web add dsh-skills-settings_sl
```

This runs `pnpm add dsh-skills-settings_sl` inside your web profile and
automatically appends the package to the profile's `dsh.profile.bundles` layer
stack (the package declares `dsh.bundle.patch`).

### Option B — manual

Add the dependency and the bundle entry to your profile's `package.json`
(`C:\Users\<you>\.dsh\profiles\web\package.json` on Windows,
`~/.dsh/profiles/web/package.json` elsewhere):

```jsonc
{
  "dependencies": {
    "dsh-skills-settings_sl": "^0.2.0"
  },
  "dsh": {
    "profile": {
      "bundles": [
        // ... your existing bundles ...
        "dsh-skills-settings_sl"
      ]
    }
  }
}
```

then run `pnpm install` (or `npm install`) inside the profile directory.

### Fallback — GitHub tarball

If the npm registry is unreachable, install from the GitHub tag archive instead
(using the same package name in dependencies and bundles):

```
https://github.com/sun-gift/dsh-skills-settings_sl/archive/refs/tags/v0.2.0.tar.gz
```

## Update (remote)

When a new version is published:

```sh
dsh plugin --profile web update dsh-skills-settings_sl
```

or change the version in your profile's `package.json` and run `pnpm install`.

> **Restart required.** The host half and the plugin set are fixed at startup.
> After installing, updating, or renaming a plugin you must restart the DSH
> service (`dsh --profile web`) and refresh the page. (The browser half is
> re-read from disk on request, so UI-only tweaks show up on refresh.)

## File structure

```
dsh-skills-settings_sl/
├── lib/
│   ├── index.js      # host half (cordis plugin): /plugins/skills-admin/* routes
│   └── client.js     # client bundle (Settings UI)
├── cordis.patch.yml  # composition-tree patch (bundle layer)
├── package.json
└── README.md / README.zh.md / LICENSE
```

## Host routes

Prefix `/plugins/skills-admin`:

| Method | Path | Description |
|---|---|---|
| GET/PUT/POST/DELETE | `/skill` | skill detail / edit / create / delete |
| POST | `/toggle` | disable / enable (frontmatter `disable-model-invocation`) |
| POST | `/upload` | upload `.zip` / `.md` skill package |
| POST | `/import` | import from a GitHub repository |
| POST | `/category` | change a skill's category |
| GET | `/list` | merged skill list (category + disabled state) |

Skills live under `<project-root>/.dsh/skills/` (project root = nearest `.git`
ancestor, else the session cwd).

## Development notes

- `package.json` `exports` must export both `./client` and `./package.json`, or
  the client half is silently skipped (route 404)
- UI changes apply on page refresh; host changes require a DSH restart
- Disabling a skill uses the frontmatter `disable-model-invocation: true`, never
  a file-suffix rename

## License

[MIT](./LICENSE)
