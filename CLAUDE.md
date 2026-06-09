# 全局规则
## 编码行为原则（Karpathy-Inspired）

### 1. 自主思考，不要假设
- 有多种解释时，选择最符合上下文的
- 有更简单的方法时，直接用
- 真正不确定时才问

### 2. 简单优先
- 最少代码解决问题
- 不要为单次使用代码做抽象
- 不要添加未请求的灵活性或可配置性
- 200 行能写成 50 行就重写

### 3. 精确修改
- 只改必须改的
- 不要改进相邻代码
- 匹配现有风格
- 每一行改动都要能追溯到用户请求

### 4. 目标驱动执行
- 定义成功标准
- 循环直到验证通过
- 多步骤任务要列出计划


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

@RTK.md