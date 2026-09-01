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

如 `settings.json` 已注册 `session-start.js`，它会注入：
1. Git 状态摘要（分支、上次提交、未提交改动）
2. 当前项目信息（技术栈、数据库）
3. `tasks/active.json` 中的当前任务

用户意图“继续工作”时，只有在 `settings.json` 已注册 `skill-router.js` 的前提下才会自动路由；恢复依据为 `tasks/active.json`，旧 `task-state.md` 不再作为主协议。

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
| codegraph prompt-hook | UserPromptSubmit | CodeGraph 代码索引 |
| session-start.js | SessionStart | Git、项目和 active.json 任务摘要 |
| skill-router.js | UserPromptSubmit | 自然语言路由到 pipeline/专项 Skill |
| context-injector.js | UserPromptSubmit | 规则按需注入并按会话去重 |
| secret-guard.js / write-guard.js | PreToolUse | 写入密钥和主目录文档防护 |
| bash-guard.js / commit-gate.js | PreToolUse | 危险命令和 C# 提交前验证 |
| completion-reminder.js / index-updater.js | PostToolUse | 大变更完成提醒与索引/经验更新 |

### 保留但未接线的 Hook

| Hook | 事件 | 功能 |
|------|------|------|
| encrypted-write-guard.js | PreToolUse | 加密源码写入防护 |
| impact-guard.js | PreToolUse | C# 修改影响提醒 |
| cs-guard.js / quality-guard.js | PostToolUse | C# 语法和质量检查 |
| metrics-report.js | Stop | 度量报告 |
| build-verify.js | Stop | 构建/测试提醒（当前非阻断） |

### 其他 Hook 说明

未接线脚本只作为候选实现，不代表运行时会执行。启用前必须先验证输入协议、成本、误报和失败行为。
