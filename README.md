# dsh-skills-settings_sl

DSH（DeepSeek Harness）Web 客户端插件：在**设置（Settings）界面**中新增一个「技能」分区，用于查看和管理已安装的 DSH 技能（Skills）。

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

## 安装

> 建议采用**本地链接模式**安装（`file:` 指向本地源码目录），避免依赖 GitHub 安装链路导致插件无法加载。

1. 将本仓库克隆或下载到本机任意位置：

   ```bash
   git clone https://github.com/sun-gift/dsh-skills-settings_sl.git
   ```

2. 在 DSH 的 Web profile 配置 `C:\Users\sunny\.dsh\profiles\web\package.json` 中注册插件：

   ```jsonc
   {
     "dependencies": {
       "dsh-skills-settings_sl": "file:D:/MyResearch/dsh-skills-settings_sl"
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

3. 在 profile 目录执行依赖安装（`pnpm install` 或 `npm install`）。
4. 重启 DSH 服务（`dsh --profile web`），刷新页面即可在设置界面看到「技能」分区。

## 文件结构

```
dsh-skills-settings_sl/
├── lib/
│   ├── index.js      # host 端插件（cordis），提供 /plugins/skills-admin/* 路由
│   └── client.js     # 客户端 bundle（设置界面 UI）
├── cordis.patch.yml  # 组合树补丁
├── package.json
└── pnpm-lock.yaml
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

技能存放位置为项目根目录（向上查找 `.git`，无则回退当前目录）下的 `.dsh/skills/`。

## 开发注意事项

- `package.json` 的 `exports` **必须同时导出 `./client` 与 `./package.json`**，否则客户端插件会被静默跳过（路由 404）
- 客户端 UI 改动刷新页面即生效；host 端代码改动需重启 DSH 服务
- 停用技能请使用 frontmatter `disable-model-invocation: true`，不要修改文件后缀

## License

[MIT](./LICENSE)
