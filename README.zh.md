# dsh-skills-settings_sl

[English](README.md) | 中文

DSH（DeepSeek Harness）Web 客户端插件：在**设置（Settings）界面**中新增一个「技能」分区，用于查看和管理当前机器上已安装的 DSH 技能（Skills）。

## 功能

- **技能列表**：图标 + 名称 + 已安装标记 + 描述卡片，支持关键字搜索、悬停上浮效果
- **分类筛选**：胶囊式筛选（全部 / 本地导入 / GitHub 导入 / 用户创建 / 记忆），分类信息读取自技能 `SKILL.md` frontmatter 的 `category` 字段
- **创建技能**：三种来源
  - 上传技能包（`.zip` / `.md`）→ 分类 `local`
  - 通过 dsh 生成 → 分类 `user`
  - 从 GitHub 仓库导入 → 分类 `github`
- **技能详情**：Markdown 预览、分类下拉（改选即存）、编辑保存
- **停用 / 启用**：通过 frontmatter 的 `disable-model-invocation` 切换（技能保持注册、列表可见，不修改文件后缀）
- **删除**：二次确认
- **立即使用**：将技能写入当前会话的对话输入框草稿（不直接发送）

## 环境要求

- DSH Web profile（`dsh --profile web`）
- Node.js >= 20

## 安装（远程安装，无需本地文件）

插件已发布到 npm registry，可直接从远程 registry 安装——无需克隆仓库、无需 `file:` 链接、无需手动拷贝目录。

### 方式 A：一条命令（推荐）

```sh
dsh plugin --profile web add dsh-skills-settings_sl
```

该命令会在你的 web profile 目录执行 `pnpm add dsh-skills-settings_sl`，并自动把该包追加到 profile 的 `dsh.profile.bundles` 层栈（本包声明了 `dsh.bundle.patch`）。

### 方式 B：手动配置

在 profile 的 `package.json`（Windows 为 `C:\Users\<你>\.dsh\profiles\web\package.json`，其他平台为 `~/.dsh/profiles/web/package.json`）中添加依赖与 bundle 条目：

```jsonc
{
  "dependencies": {
    "dsh-skills-settings_sl": "^0.2.0"
  },
  "dsh": {
    "profile": {
      "bundles": [
        // ... 原有 bundle ...
        "dsh-skills-settings_sl"
      ]
    }
  }
}
```

然后在 profile 目录执行 `pnpm install`（或 `npm install`）。

### 备用方式：GitHub tarball

若 npm registry 不可达，可改用 GitHub tag 归档安装（依赖名与 bundles 名仍为 `dsh-skills-settings_sl`）：

```
https://github.com/sun-gift/dsh-skills-settings_sl/archive/refs/tags/v0.2.0.tar.gz
```

## 更新（远程更新）

当作者发布新版本后：

```sh
dsh plugin --profile web update dsh-skills-settings_sl
```

或修改 profile `package.json` 中的版本号后执行 `pnpm install`。

> **需要重启**：host 端插件与插件集合在启动时固定。安装、更新、改名插件后必须重启 DSH 服务（`dsh --profile web`）并刷新页面。（浏览器端 bundle 是请求时从磁盘读取的，纯 UI 改动刷新即生效。）

## 文件结构

```
dsh-skills-settings_sl/
├── lib/
│   ├── index.js      # host 端插件（cordis），提供 /plugins/skills-admin/* 路由
│   └── client.js     # 客户端 bundle（设置界面 UI）
├── cordis.patch.yml  # 组合树补丁（bundle 层）
├── package.json
└── README.md / README.zh.md / LICENSE
```

## Host 端路由

前缀 `/plugins/skills-admin`：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET/PUT/POST/DELETE | `/skill` | 技能详情 / 编辑 / 创建 / 删除 |
| POST | `/toggle` | 停用 / 启用（frontmatter `disable-model-invocation`） |
| POST | `/upload` | 上传 `.zip` / `.md` 技能包 |
| POST | `/import` | 从 GitHub 仓库导入 |
| POST | `/category` | 修改技能分类 |
| GET | `/list` | 合并分类 + 停用状态的技能列表 |

技能存放位置为项目根目录（向上查找 `.git`，无则回退会话 cwd）下的 `.dsh/skills/`。

## 开发注意事项

- `package.json` 的 `exports` **必须同时导出 `./client` 与 `./package.json`**，否则客户端插件会被静默跳过（路由 404）
- 客户端 UI 改动刷新页面即生效；host 端代码改动需重启 DSH 服务
- 停用技能请使用 frontmatter `disable-model-invocation: true`，不要修改文件后缀

## License

[MIT](./LICENSE)
