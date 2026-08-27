# 工作流触发规则

> 触发词映射唯一定义处。CLAUDE.md 引用此文件。详细流程见各 command 文件。

## 铁律（现行单轨）

**收到 `pipeline-executor` 或单点 Skill 调用时，必须第一步走对应 Skill，禁止跳过直接编码。**

跳过 Skill 会：
- 跳过 Requirement Gate → 需求理解不充分
- 跳过 Design Gate → 没有检查已有代码
- 跳过 Code Gate → 没有参考已有模块风格
- 导致重复返工、浪费 token

## 路由机制

**路由由 `skill-router.js` hook 自动处理。** 用户输入包含触发词时，hook 自动注入路由上下文，LLM 遵循注入的提示调用对应 Skill。

LLM 不需要记住触发词表——hook 会告诉它该走哪个流程。

## 新会话启动

`session-start.js` hook 自动注入：
1. Git 状态摘要（分支、上次提交、未提交改动）
2. 当前项目信息（技术栈、数据库）
3. 未完成任务进度（如有 task-state.md）

用户意图"继续工作"时，`skill-router.js` 自动恢复 task-state.md。

## 触发条件

用户明确要求执行操作时触发。讨论/分析/了解时不触发。

## 触发词 → Skill 映射

### Commands（现行单轨）

| 触发词 | 命令 | 对应 Skill | 说明 |
|--------|------|-----------|------|
| 开发XX/一键开发/全流程 | `/pipeline-executor` | 编排五阶段 | 唯一总入口，自动过 Requirement→Design→Code→Test→Release |
| 讨论/需求/方案 | `/requirements` | `/requirements` | 需求探索与澄清 |
| 技术方案/怎么实现 | `/design` | `/design` | 方案设计 |
| 修复/bug/报错 | `/systematic-debugging` | `/systematic-debugging` | 问题排查、根因分析 |
| 审查/review | `/review` | `/review` | 多维度代码审查 |
| 测试/跑测试 | `/test` | `/test` | 测试执行、失败修复 |

### Skills（技能）

| 触发词 | 命令 | 说明 |
|--------|------|------|
| 需求分析/需求澄清 | `/requirements` | 需求质询、用户故事 |
| 架构审查 | `/arch-review` | 架构设计审查 |
| 开发工作流 | `/dev-workflow` | 写计划、执行计划、并行派发 |
| 性能调优 | `/perf-tune` | 性能诊断与优化 |
| 数据库设计 | `/sql-best-practices` | SQL 最佳实践 |
| 文档生成 | `/docs` | 项目/功能/问题文档 |
| 系统化调试 | `/systematic-debugging` | 四阶段调试流程 |
| 验证门禁 | `/verification-before-completion` | 验证与进度保存 |
| 技能管理 | `/skill-manager` | 技能注册与管理 |
| 提交/commit | `/commit` | Git 提交与工作空间管理 |

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

## Hooks 状态

> Hook 文件位于 `~/.claude/hooks/`。实际激活取决于 harness 配置。
> 已确认激活：settings.json 中注册的。其余文件存在但需确认是否被 harness 加载。

### 已确认激活

| Hook | 事件 | 功能 |
|------|------|------|
| codegraph prompt-hook | UserPromptSubmit | CodeGraph 代码索引（settings.json 注册） |

### 核心流程 Hook（文件存在，需确认激活状态）

| Hook | 事件 | 功能 |
|------|------|------|
| skill-router.js | UserPromptSubmit | 自动路由到对应 Skill |
| session-start.js | SessionStart | 注入 git 状态 + 项目信息 + 任务进度 |
| context-injector.js | UserPromptSubmit | 关键词匹配注入规则 |

### 安全防护 Hook

| Hook | 事件 | 功能 |
|------|------|------|
| secret-guard.js | PreToolUse | 拦截硬编码密钥 |
| write-guard.js | PreToolUse | 拦截主目录垃圾文件 |
| bash-guard.js | PreToolUse | Bash 命令安全检查 |
| commit-gate.js | PreToolUse | 提交前强制编译和测试验证 |
| encrypted-write-guard.js | PreToolUse | 加密 .cs 文件写入防护 |
| impact-guard.js | PreToolUse | .cs 修改前提示查看调用链 |
| git-commit-review.js | PostToolUse | 阻止 force push、密钥泄露 |

### 质量检查 Hook

| Hook | 事件 | 功能 |
|------|------|------|
| cs-guard.js | PostToolUse | C# 语法检查 |
| quality-guard.js | PostToolUse | SQL 注入、null 安全、资源释放检查 |
| logic-guard.js | PostToolUse | 逻辑错误检查 |
| vue-guard.js | PostToolUse | Vue 代码检查 |
| test-reminder.js | PostToolUse | 提示运行测试 |
| review-trigger.js | PostToolUse | 代码审查提醒 |

### 索引/通知 Hook

| Hook | 事件 | 功能 |
|------|------|------|
| sqlite-index-update.js | PostToolUse | 自动增量更新 SQLite 索引 |
| artifact-index-update.js | PostToolUse | 自动更新 Artifact INDEX.md |
| project-knowledge.js | SessionStart | 加载项目 learnings |
| learning-recorder.js | PostToolUse | 记录修改到 learnings.md |
| knowledge-sync-reminder.js | SessionStart | Memory → Knowledge 同步提醒 |
| metrics-collector.js | PostToolUse | 只记录高成本/质量工具 |
| metrics-report.js | Stop | 输出简化度量报告 |
| build-verify.js | Stop | 编译验证报告（非阻断） |
| notify.ps1 | Stop | Windows Toast 通知 |
