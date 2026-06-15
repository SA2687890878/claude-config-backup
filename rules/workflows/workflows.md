# 工作流触发规则

> 触发词映射唯一定义处。CLAUDE.md 引用此文件。详细流程见各 command 文件。

## ⚠️ 铁律

**收到 `/build`、`/explore`、`/operate` 命令时，必须第一步调用 Workflow 工具，禁止跳过直接编码。**

跳过 Workflow 会：
- 跳过 Requirement Gate → 需求理解不充分
- 跳过 Design Gate → 没有检查已有代码
- 跳过 Code Gate → 没有参考已有模块风格
- 导致重复返工、浪费 token

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

### Commands（斜杠命令）

| 触发词 | 命令 | 说明 |
|--------|------|------|
| 讨论/设计/方案/探索 | `/explore` | 需求探索、技术调研、方案比较 |
| 开发/添加/实现/构建 | `/build` | 功能开发全流程（架构→设计→编码→测试） |
| 修复/bug/报错/排查 | `/operate` | 问题排查、根因分析、性能调优 |
| 审查/review | `/review` | 多维度代码审查 |
| 测试/跑测试 | `/test` | 测试执行、失败修复 |

### Skills（技能）

| 触发词 | 命令 | 说明 |
|--------|------|------|
| 需求分析/需求澄清 | `/requirements` | 需求质询、用户故事 |
| 架构审查 | `/arch-review` | 架构设计审查 |
| 代码审查详细流程 | `/code-review-workflow` | 完整代码审查流程 |
| 开发工作流 | `/dev-workflow` | 写计划、执行计划、并行派发 |
| 生成测试 | `/generate-tests` | 自动生成测试用例 |
| 性能调优 | `/perf-tune` | 性能诊断与优化 |
| 数据库设计 | `/sql-best-practices` | SQL 最佳实践 |
| 文档生成 | `/docs` | 项目/功能/问题文档 |
| 系统化调试 | `/systematic-debugging` | 四阶段调试流程 |
| 测试执行 | `/test-runner` | 测试执行闭环 |
| 验证门禁 | `/verification-before-completion` | 验证与进度保存 |
| 对抗审查 | `/adversarial-review` | 多角度对抗性代码审查 |
| 技能管理 | `/skill-manager` | 技能注册与管理 |
| 提交/commit/创建工作区/完成分支 | `/commit` | Git 提交与工作空间管理 |

### 自动触发

| 场景 | 触发方式 | 说明 |
|------|---------|------|
| 继续工作 | hook 自动恢复 | 检查 memory/task-state.md 恢复进度 |
| 会话开始 | hook 自动触发 | git status + 项目检测 |

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
| session-start.js | SessionStart | 会话启动 | 注入 git 状态 + 项目信息 + 任务进度 + 初始化检测 |
| context-injector.js | UserPromptSubmit | 关键词匹配 | 智能注入 git/token/security 规则 |
| secret-guard.js | PreToolUse | Write\|Edit | 拦截硬编码密钥 |
| write-guard.js | PreToolUse | Write\|Edit | 拦截主目录垃圾文件 |
| bash-guard.js | PreToolUse | Bash | Bash 命令安全检查 |
| commit-gate.js | PreToolUse | Bash(git commit) | 提交前强制编译和测试验证 |
| encrypted-write-guard.js | PreToolUse | Write\|Edit(*.cs) | 加密文件写入防护 |
| impact-guard.js | PreToolUse | Edit(*.cs) | 修改前提示查看调用链 |
| cs-guard.js | PostToolUse | Write\|Edit(*.cs) | C# 语法检查 |
| quality-guard.js | PostToolUse | Write\|Edit(*.cs) | SQL 注入、null 安全、资源释放检查 |
| logic-guard.js | PostToolUse | Write\|Edit(*.cs) | 逻辑错误检查 |
| vue-guard.js | PostToolUse | Write\|Edit(*.vue) | Vue 代码检查 |
| test-reminder.js | PostToolUse | Write\|Edit(*.cs) | 提示运行测试 |
| sqlite-index-update.js | PostToolUse | Write\|Edit(*.cs) | 自动增量更新 SQLite 索引 |
| git-commit-review.js | PostToolUse | Bash | 阻止 force push、密钥泄露 |
| review-trigger.js | PostToolUse | Write\|Edit | 代码审查提醒 |
| artifact-index-update.js | PostToolUse | Write | 自动更新 Artifact INDEX.md |
| build-verify.js | Stop | 会话结束 | 编译验证报告（非阻断） |
| notify.ps1 | Stop | 任务完成/等待输入 | Windows Toast 通知 |
| project-knowledge.js | SessionStart | 会话启动 | 加载项目 learnings |
| learning-recorder.js | PostToolUse | Write\|Edit | 记录修改到 learnings.md |
| knowledge-sync-reminder.js | SessionStart | 会话启动 | Memory → Knowledge 同步提醒 |
| metrics-collector.js | PostToolUse | 关键工具 | 只记录高成本/质量工具 |
| metrics-report.js | Stop | 会话结束 | 输出简化的度量报告 |
