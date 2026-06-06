# 工作流触发规则

> 触发词映射的**唯一定义处**。CLAUDE.md 引用此文件，不重复定义。
> 详细流程见各 command 文件（`~/.claude/commands/*.md`）。

## 新会话启动

检查 memory，回忆上次进度。当用户意图是"继续工作"或"开始/继续"时，执行 `git status` 输出状态摘要。

## 触发条件

触发词仅在用户**明确要求执行操作**时生效。日常对话中提到这些词（讨论、分析、了解）时**不触发**。

**判断标准**：用户意图是"执行这个流程" → 触发；用户意图是"讨论/了解/分析" → 不触发。

### 正例（触发）
- "帮我开发一个导出功能" → `/feature-development`
- "修复登录报错的bug" → `/bug-fix`
- "提交代码" → `/commit`

### 反例（不触发）
- "这个 bug 是什么原因？" → 讨论，不触发
- "我们讨论下导出方案" → 讨论，不触发
- "帮我看看这段代码" → 代码理解，不触发
- "性能优化有哪些思路？" → 咨询，不触发

## 触发词 → 命令映射

| 触发词 | 命令 | 说明 |
|--------|------|------|
| 开发/添加/实现 | `/feature-development` | 功能开发全流程 |
| 修复/bug/报错 | `/bug-fix` | Bug 修复流程 |
| 优化/慢/性能 | `/perf-optimize` | 性能优化流程 |
| 审查/review | `/code-review` | 代码审查流程 |
| 讨论/方案 | 直接对话 | 需求讨论，不触发流程 |
| 提交 | `/commit` | Git 提交信息生成 |
| 开始/继续 | 直接触发 | git status + task list |
| 文档（项目/功能/排查） | `docs` skill | 文档中心 — scope 路由到项目/功能/问题级，触发词须显式带"文档/记录"语义 |

## 创建 / 修改 Skill 的规约

新建或重大修改 skill 时，**以官方 `skill-creator` 为主流程**（Anthropic 出品，与 Claude 实际触发机制对齐，含 eval/benchmark/description 自动优化）。

- **新建 / 重大改** → 走 `skill-creator` 完整流程（写草稿 → 跑 eval → benchmark → 迭代）
- **日常微调** → 手动按 `skill-creator` 写作标准改即可，不必每次跑 benchmark
- **description 哲学冲突以官方为准**：`skill-creator` 要求 description 同时写 **what + when 且略带 pushy**（对抗 Claude undertrigger）；与 `writing-skills`"只写 when"的主张冲突时，**采用 skill-creator**。
- `writing-skills`（superpowers 套件）作为**补充参考**：它的 TDD-for-docs 思维和 `anthropic-best-practices.md` 可借鉴，但其 description 规范不覆盖官方。

## 完成检查点

每个流程结束后输出：
- **变更文件**: [列表]
- **变更内容**: [一句话]
- **下一步**: [建议]
