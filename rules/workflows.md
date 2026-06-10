# 工作流触发规则

> 触发词映射唯一定义处。CLAUDE.md 引用此文件。详细流程见各 command 文件。

## 路由机制

**路由由 `workflow-router.js` hook 自动处理。** 用户输入包含触发词时，hook 自动注入路由上下文，LLM 遵循注入的提示调用对应 Skill。

LLM 不需要记住触发词表——hook 会告诉它该走哪个流程。

## 新会话启动

`session-start.js` hook 自动注入：
1. Git 状态摘要（分支、上次提交、未提交改动）
2. 当前项目信息（技术栈、数据库）
3. 未完成任务进度（如有 task-state.md）

用户意图"继续工作"时，`workflow-router.js` 自动恢复 task-state.md。

## 触发条件

用户明确要求执行操作时触发。讨论/分析/了解时不触发。

## 触发词 → 命令映射

| 触发词 | 命令 | 说明 |
|--------|------|------|
| 讨论/设计/方案/头脑风暴 | `/requirements` | 需求探索 → 设计规格（不写代码） |
| 开发/添加/实现 | `/feature-development` | 功能开发全流程（含需求探索） |
| 修复/bug/报错 | `/bug-fix` | Bug 修复流程 |
| 优化/慢/性能 | `/perf-optimize` | 性能调优流程 |
| 审查/review | `/code-review` | 代码审查流程 |
| 提交 | `/commit` | Git 提交信息生成 |
| 测试/跑测试 | `/test-runner` | 测试执行闭环 |
| 数据库/表/字段/scaffold | `/sql-best-practices` | SQL 最佳实践 + 数据库变更 |
| 保存经验/进度 | `/memory-save` | 经验积累与进度保存 |
| 继续工作 | hook 自动恢复 | 检查 memory/task-state.md 恢复进度 |
| 开始 | hook 自动触发 | git status + 项目检测 |
| 文档（项目/功能/排查） | `/docs` | scope 路由到项目/功能/问题级 |

## 完成检查点

每个流程结束后，**必须先运行验证命令**，再输出：
- **验证结果**: `dotnet build` / `dotnet test` 的实际输出（不是"应该通过"）
- **变更文件**: [列表]
- **变更内容**: [一句话]
- **下一步**: [建议]

> 铁律：没有新鲜的验证证据，不许宣称完成。详见 `/verification-before-completion`。

## 激活的 Hooks

| Hook | 事件 | 触发条件 | 功能 |
|------|------|---------|------|
| workflow-router.js | UserPromptSubmit | 所有输入 | 自动路由到对应 workflow |
| session-start.js | SessionStart | 会话启动 | 注入 git 状态 + 项目信息 + 任务进度 |
| secret-guard.js | PreToolUse | Write\|Edit | 拦截硬编码密钥 |
| write-guard.js | PreToolUse | Write\|Edit | 拦截主目录垃圾文件 |
| impact-guard.js | PreToolUse | Edit (*.cs) | 修改前提示查看调用链 |
| cs-guard.js | PostToolUse | Write\|Edit (*.cs) | C# 语法检查 |
| quality-guard.js | PostToolUse | Write\|Edit (*.cs) | SQL 注入、null 安全、资源释放检查 |
| test-reminder.js | PostToolUse | Write\|Edit (*.cs) | 提示运行测试 |
| sqlite-index-update.js | PostToolUse | Write\|Edit (*.cs) | 自动增量更新 SQLite 索引 |
| git-commit-review.js | PostToolUse | Bash | 阻止 force push、密钥泄露 |
| inject-git-rules.js | UserPromptSubmit | git 关键词 | 注入 git 规则 |
| inject-token-rules.js | UserPromptSubmit | 代码分析关键词 | 注入 token 优化规则 |
| build-verify.js | Stop | 会话结束 | 编译验证，失败则阻断 |
