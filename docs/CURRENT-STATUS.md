# Harness 当前状态

> 仅记录当前实现与已验证事实；设计方案、示例和历史记录不作为运行依据。

## 当前已确认

- 主配置：`settings.json`。
- 已注册 Hook：`UserPromptSubmit → codegraph prompt-hook`。
- 自定义 Hook 脚本是否生效，以 `settings.json` 实际注册为准。
- Skill 由宿主按需发现/调用；自然语言自动路由需以实际 Hook 注册和现场验证为准。
- 任务主协议：`tasks/active.json`；历史索引：`tasks/.index.json`。
- 规则分层：根 `rules/` 放核心约束，`knowledge/rules/` 放按需参考，`knowledge/*/INDEX.md` 负责导航。
- 业务代码项目规则优先使用项目级 `.claude/`；全局只放跨项目约束。

## 当前已接线

当前 `settings.json` 已注册以下精简 Hook：

- `SessionStart → hooks/session-start.js`
- `UserPromptSubmit → codegraph prompt-hook + hooks/skill-router.js + hooks/context-injector.js`
- `PreToolUse(Write/Edit) → hooks/secret-guard.js + hooks/write-guard.js`
- `PreToolUse(Bash) → hooks/bash-guard.js + hooks/commit-gate.js`
- `PostToolUse(Write/Edit) → hooks/completion-reminder.js + hooks/index-updater.js`

本轮已完成脚本语法、配置结构、自然语言路由、规则注入、任务读取和安全判定样例验证。

## 当前未接线

以下脚本存在，但未注册到当前 `settings.json`：

- `hooks/impact-guard.js`
- `hooks/encrypted-write-guard.js`
- `hooks/cs-guard.js`
- `hooks/quality-guard.js`
- `hooks/metrics-report.js`
- `hooks/build-verify.js`

`build-verify.js` 当前失败时输出 warning 并退出 0，不能作为阻断式 Gate；因此未接入 Stop，避免制造“已阻断”的假象。

## 精简原则

已接线 Hook 只承担低成本、确定性、与用户目标直接相关的工作：路由、按需规则去重、安全防护、提交前验证、完成提醒和索引更新。未接线的细粒度语法/质量扫描和会话结束构建，待证明误报率、耗时与收益后再决定，不为“看起来自动化”而启用。

## 当前主链路

能力层面覆盖：

```text
需求讨论 → 需求分析 → 架构/功能设计 → 开发 → 测试 → 排查 → 审查/验证
```

完整功能开发的设计入口为 `/pipeline-executor`。阶段协议位于：

- `skills/pipeline-executor/SKILL.md`
- `skills/pipeline-phases/SKILL.md`
- `rules/quality/gates.md`
- `rules/quality/verification.md`

这些文件是流程说明，不等于宿主已经提供确定性状态机或阻断执行器。

## 当前已知治理项

- 任务恢复、产物目录、经验路径存在历史文档/规则口径差异，统一前不可新增第二套协议。
- 深度审查、文档和旧 Hook 说明需区分“当前实现 / 示例配置 / 历史记录”。
- `settings.json` 中认证配置属于运行备份内容，不在此文档复制或展示。

## 文档使用规则

- 查当前运行事实：先读本文，再核对 `settings.json` 和实际脚本。
- 查流程：读对应 Skill 和 Gate。
- 查项目约束：读项目级 `.claude/` 或 `knowledge/project/` 索引。
- 查历史原因：再读 `docs/` 中标明历史/归档的文档。
- 若文档与配置冲突，以实际配置和现场验证为准，并更新本文。

## 三花规范吸收边界

三花/PCS 规范不直接复制到全局。后续按以下顺序处理：

1. 通用且可验证的质量原则，归入已有 Rule、Gate 或 Review 检查卡；
2. WPF、日志、设备通信等技术细节，进入按需 reference；
3. PCS 字段、协议、设备、时区和发布流程，进入项目级知识；
4. 能机器判定的规则，只有在 Hook/执行器接线并验证后，才声明为自动门禁。

不吸收固定注释比例、固定文件/方法行数、默认完整 JSON 入日志、本地时间无时区等不可泛化或高风险表述。
