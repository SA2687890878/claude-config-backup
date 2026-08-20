---
name: github-star-organizer
description: "该技能用于整理 GitHub 收藏仓库并自动归类到 Starred Lists。触发：整理 GitHub 收藏、star 归类、starred lists、收藏仓库分类、/github-star-organizer。"
version: 1.0.0
---

# GitHub Star 归类整理器

把用户 GitHub 账号的收藏（starred repos）自动归类到 Starred Lists，保持收藏有序。
目标账号：SA2687890878（github.com/SA2687890878?tab=stars）。
完整工具链与文档在工作区 `github-star-organizer/` 目录（classify.js / build_mutations.js / README.md）。

## 分类体系（6 个 List，ID 见 README）

| 分类 | 判定依据 | 现有数量 |
|---|---|---|
| `harness` harness体系方法论 | harness 系统本体、agent 技能框架、方法论、skills 集合、CLAUDE.md 配置、plugin 生态 | 46 |
| `dsh` deepseek harness插件收藏 | topics 含 dsh-plugin 且主体是 DSH 插件（dsh-* 命名） | 3 |
| `ai` AI编码工具与Agent | 编码 Agent、CLI、LLM 网关、多智能体编排、MCP 服务器、IDE 工具 | 56 |
| `dev` 开发工具与框架 | 通用开发工具、.NET/Web 框架、爬虫、开发库 | 21 |
| `learn` 学习资源与书籍 | 书籍、教程、awesome 清单、速查表 | 20 |
| `misc` 生活效率与杂项 | 翻译插件、VPN、桌面应用、日常工具 | 10 |

## 前置（本机环境）

1. 代理：`$env:HTTPS_PROXY="http://127.0.0.1:17890"; $env:HTTP_PROXY="http://127.0.0.1:17890"`（一分机场 clash；核心卡死修复见 README 坑 1）
2. gh 登录：`$env:GH_CONFIG_DIR="D:\deepseekHarness工作区\.gh"; gh auth login --hostname github.com --git-protocol https --web --scopes "user,repo,gist,read:org"` —— 设备码流程：后台任务跑，把码+URL 给用户输入；**必须带 user scope**（建 List 需要）
3. 验证：`gh auth status` 显示 token scopes 含 'user'
4. 环境硬约束：**HTTPS 一律用 gh 或 node**（schannel 在本会话失效，curl/Invoke-WebRequest 不可用）

## 流程

### 1. 拉全部 star（REST 分页）
```powershell
gh api "user/starred?per_page=100&page=$p" --jq '[.[] | {name: .full_name, desc: .description, topics: .topics, lang: .language}]'
```
- 循环到空页；输出存 `stars_all.json`
- **jq 表达式用单引号整包**，内部不要出现双引号（PS 5.1 会截断）

### 2. 拉仓库 GraphQL ID
```json
{"query":"query { viewer { starredRepositories(first: 100, orderBy: {field: STARRED_AT, direction: DESC}) { nodes { id nameWithOwner } pageInfo { hasNextPage endCursor } } } }"}
```
- 循环 after=cursor 直到 hasNextPage=false；存 nameWithOwner → id 映射到 `repo_ids.json`

### 3. 更新分类映射
编辑 `github-star-organizer/classify.js` 的 CAT 表：新仓库按判定依据加进对应数组。
判断规则：`dsh-plugin` topic → dsh；描述含 harness/agent 方法论/skill 框架/CLAUDE.md → harness；编码 Agent/CLI/网关/编排 → ai；框架/库/爬虫 → dev；书/清单/教程 → learn；翻译/VPN/日常应用 → misc。无描述的仓库先查 README（`gh api repos/{owner}/{name}/readme --jq ".content"` 后 base64 解码，用 node 解）。

### 4. 校验并生成批次
```powershell
node github-star-organizer/classify.js stars_all.json classification.json   # 校验：无未分类、无幽灵
node github-star-organizer/build_mutations.js                               # 生成 mut_batch_0..N.json
```

### 5. 执行 mutation（每批 30 个 alias，PowerShell 循环）
```powershell
foreach ($i in 0..$n) { gh api graphql --input "mut_batch_${i}.json" }   # 注意 ${i} 不能写 $i:
```
- `updateUserListsForItem(input:{itemId, listIds:[...]})` 是**整体替换**语义：已在列表的仓库必须带上原有 listId
- 一个仓库可进多个列表（listIds 传多个）

### 6. 验证
```json
{"query":"query { viewer { lists(first: 100) { nodes { id name items(first: 100) { totalCount } } } } }"}
```
- 各列表 totalCount 之和必须等于 star 总数；抽查代表性仓库归属（如 deepseek-ai/deepseek-harness ∈ harness、openclaw ∈ ai）

## 关键 API

- Lists 无 REST 端点（/user/lists 404），全走 GraphQL：`viewer { lists }` / `createUserList` / `deleteUserList` / `updateUserList` / `updateUserListsForItem`
- 列表成员节点是 UNION `UserListItems`，唯一成员类型 `Repository`，用 `... on Repository { nameWithOwner }` 展开
- 查询以文件方式传：`gh api graphql --input query.json`（避免引号地狱）
- 列表全局 ID 稳定，记录在 README.md 对照表

## 常见坑

1. clash 核心卡死（节点测速通但 CONNECT 秒断）：本地 API `http://127.0.0.1:8765` 诊断；`PUT /configs?force=true` 重载无效时，UAC 提权杀进程（`Start-Process taskkill -ArgumentList "/F","/PID",PID -Verb RunAs`），一分机场会自动拉起新核心
2. schannel 失效：curl/Invoke-WebRequest HTTPS 全挂；全用 gh + node
3. PS 5.1：`$i:` 写成 `${i}`；Out-File 带 BOM（node 读 JSON 先 strip `\uFEFF`）；大 JSON 用 node 解析
4. GH_CONFIG_DIR 必须重定向（AppData\Roaming\GitHub CLI 无写权限）
5. 设备码轮询网络中断会 EOF——重跑登录即可，每次是新码

## 验证完成标准

- 分类脚本 0 未分类 / 0 幽灵
- 全部批次 mutation 返回 data 无 errors
- 列表 totalCount 之和 = star 总数，抽查归属 OK
- 向用户汇报各列表数量与归类规则，并提示以后可随时用本技能重跑
