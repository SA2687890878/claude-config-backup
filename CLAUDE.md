# 全局规则

## 语言与环境
- 全程简体中文（包括思考和输出）
- Windows + PowerShell

## 技术栈
- 后端：.NET 8.0（Web）+ .NET Framework 4.5.2（WPF）
- 前端：Vue 2
- 数据库：SQL Server（老项目）+ PostgreSQL（新项目）
- 领域：数据采集追溯平台、WPF 数采软件

## 项目路径
- 老项目：`F:\Code WorkSpace\` — SQL Server
- 新项目：`F:\OTD Code WorkSpace\` — PostgreSQL

## 项目速查

| 项目 | 路径前缀 | 数据库 |
|------|---------|--------|
| pcs.webbackend | `F:/Code WorkSpace/pcs.webbackend/` | SQL Server |
| OTD-* | `F:/OTD Code WorkSpace/` | PostgreSQL |

## 规则优先级
项目级 `.claude/` > 全局 `rules/*.md` > 本文件

## 工作流
触发词映射**唯一定义处**：`rules/workflows.md`。禁止在此文件或其他 rules 中重复定义触发词映射。
详细流程见各 command 文件（`~/.claude/commands/*.md`）。

## Token 优化
详见 `rules/token-optimization.md`

## 禁止操作
- 禁止在 rules/ 中重复定义触发词映射（唯一定义在 workflows.md）
- 禁止直接修改 settings.json 的 env 块（用环境变量）
- 禁止在 .cs 文件中使用 .Result / .Wait()（cs-guard 会检查）
- 禁止直接 push 到 main/develop 分支
- 禁止 Read 整个 .cs 文件来理解结构（用 codegraph_explore）
- 禁止在代码中硬编码密钥/密码/token（secret-guard 会拦截）
