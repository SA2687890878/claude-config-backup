# 全局规则

## 环境
- 简体中文 | Windows + PowerShell
- .NET 8.0（Web）+ .NET Framework 4.5.2（WPF）| Vue 2
- SQL Server（老项目）| PostgreSQL（新项目）

## 项目速查
| 项目 | 路径 | 数据库 |
|------|------|--------|
| pcs.webbackend | `F:/Code WorkSpace/pcs.webbackend/` | SQL Server |
| pcs.crontabservice | `F:/Code WorkSpace/pcs.crontabservice/` | SQL Server |
| OTD-* | `F:/OTD Code WorkSpace/` | PostgreSQL |

## 行为原则
- 多种解释时选最符合上下文的，更简单的方法直接用，真正不确定才问
- 最少代码解决问题，不做未请求的抽象和灵活性
- 只改必须改的，匹配现有风格，每行改动追溯到用户请求
- 多步骤任务列出计划，循环直到验证通过
- 回答技术问题前先查阅文档/源码，不确定时明确说明
- 必须使用简体中文回答和思考，编写代码注释和文档也使用简体中文

## 核心禁止
- 禁止 .Result / .Wait()（同步阻塞）
- 禁止直接 push 到 main/develop
- 禁止硬编码密钥/密码/token

## 代码探索（加密项目）
- **先索引、后 Read** — 直接 Read 整个 .cs 文件是最浪费 token 的路径
- 加密 .cs 文件：SQLite 索引定位 → CodeGraph 看源码
- 非加密文件：直接 Read/Grep
- 影响分析：CodeGraph
- 详细规则：见 `@rules/tools/code-access.md`

## 规则优先级
项目级 `.claude/` > 全局 `rules/*.md` > 本文件

## 压缩保留
当压缩对话时，始终保留：
- 修改文件列表、测试命令、验证结果
- 关键决策和理由（如果有）
- 需求偏差记录（如果有）
- 未解决的问题（如果有）
- 当前 active.json 的内容（task_id / stage / product_path）

## 任务追踪（产物定位、阶段流转）
- **开始新任务** → 写入 `~/.claude/tasks/active.json`（task_id / stage / product_path / baseline）
- **推进阶段** → 更新 active.json 的 stage（requirements→design→development→testing→done）
- **完成/切换** → 从 active.json 移入 `~/.claude/tasks/.index.json`（历史索引）
- **产物路径** → 始终写入 `{product_path}/`（skill 从 active.json 动态取）
- **读取** → 优先读 active.json（当前任务）；查历史用 glob `.index.json` 或按 task_id 搜索
- **全流程编排** → 说"开发XX"自动走五阶段 → skill: `/pipeline-executor`
- **细节**：见 `~/.claude/rules/quality/gates.md`（Task Contract 模板）
- **经验沉淀**：项目级 `.claude/learnings.md`，跨项目到 `~/.claude/memory/learnings.md`
- **模型选择**：见 `~/.claude/knowledge/rules/tools/model-strategy.md`

## 任务流转（自动串联）
- 每个 skill 完成后，自动加载下一阶段的 skill，不等用户确认
- 用户明确说"先停"、"等一下"、"pause"时暂停
- 暂停时：更新 active.json 加 stage=paused + paused_at="当前步骤"
- 恢复时：读 active.json，从 paused_at 处继续
- 切换任务：存档当前任务（stage=paused），开新任务
- 写 daily/project 日志时，附带当前 active.json 的 task_id（如有）

## 核心规则（每次加载）
@rules/tools/code-access.md
@rules/quality/gates.md
@rules/quality/verification.md

## 按需规则（场景触发时加载）
- Token 优化：见 @rules/tools/token-optimization.md
- 问题澄清：需求不明确时，读取 `~/.claude/knowledge/rules/quality/question-bank.md`

## 知识库索引
@knowledge/MEMORY.md

@RTK.md
