# Reasonix 迁移评估备忘录

> 评估日期：2026-07-27 前后
> 状态：**结论已记录，暂不行动**（用户选择先记结论）
> 评估方式：26 个注册 hooks + 33 个 rules + 20 个 skills 全部逐行精读；Reasonix v1.20 官方文档核对；RTK 0.42.4 本地实测
> 证据等级：本备忘录每条结论标注来源——【精读】逐行读代码 /【官方文档】宿主官方文档 /【实测】本机运行验证 /【未验证】需实测确认

---

## 一、总体结论

**值得搭配 Reasonix，但正确形态是"内容层整体迁移当主力，Claude 退为只读备份"，不是长期双轨。**

理由四句话：
1. harness 约 1/4（7 个 hooks）是给 Claude 补机制短板，Reasonix 原生就有 → 白赚
2. harness 真正价值（方法论 + 领域知识 + 护栏）100% 工具无关 → 内容可整体搬
3. 这台电脑没装加密软件 → 最大的定制块（SQLite 索引工具链）可整体退役
4. harness 在 Claude 下已带病运行（3 个真实 bug）→ 迁移是重建干净的机会

唯一实质损失：RTK 透明自动改写降级为半自动（可替代，不是死穴）。

**诚实边界**：实际收益量化、模型质量差异，需要真实项目实测 1-2 周才有数据。机制对比不能替代实测。

---

## 二、Hooks 迁移清单（26 个注册 hooks）

### ✅ 完全兼容：直接可用（10 个）

| Hook | 说明 |
|---|---|
| secret-guard.js | 读 tool_name/tool_input，exit 2 阻断，Claude 契约 |
| write-guard.js | 同上 |
| impact-guard.js | stderr 警告 |
| encrypted-write-guard.js | stderr 警告（加密专用，本机不需要） |
| cs-guard.js | stderr 警告；⚠️ 合并版已含 quality+logic 全部检查 |
| vue-guard.js | stderr 警告 |
| test-reminder.js | stderr 建议 |
| review-trigger.js | stderr 建议 |
| build-verify.js | Stop 非阻塞，Reasonix Stop 同为非阻塞 |
| git-commit-review.js | PostToolUse 非阻塞警告 |

### ⚠️ 需适配（9 个）

| Hook | 差异 | 处理 |
|---|---|---|
| bash-guard.js | stdout `{decision:"block"}`，Reasonix 识别的是 hookSpecificOutput.permissionDecision | 实测失败改 exit 2 |
| commit-gate.js | 同上 | 同上 |
| session-start.js | SessionStart stdout 注入 ✅；但 task-state 读 ~/.claude/projects/ 路径、项目检测硬编码 F:\ | 保留 git 状态部分，记忆路径改 Reasonix |
| project-knowledge.js | 读 ~/.claude/projects/.../learnings.md | 换 Reasonix 记忆或停用 |
| learning-recorder.js | 写 ~/.claude/projects/.../learnings.md | Reasonix 用 remember 替代，停用 |
| sqlite-index-update.js | 加密专用，F:\ 根检查 | 本机不触发，可留可删 |
| source-sync-update.js | 加密专用 | 同上 |
| notify.ps1 | Stop PowerShell Toast | 换原生 Notification 事件 |
| 10 个带 if 条件的 hook | Reasonix 不求值 if 字段 | hook 内部自带 .cs 检查，只是多跑进程，不阻塞正确性 |

### ❌ 应停用（8 个）

| Hook | 原因 |
|---|---|
| skill-router.js | UserPromptSubmit stdout 注入在 Reasonix 无特殊作用，失效；内置 skill 发现替代 |
| context-injector.js | 同上；Context Engine v2 替代 |
| metrics-collector.js | 无 matcher 全量触发 + 记录 Claude 工具名；内置用量面板替代 |
| metrics-report.js | 内置面板替代 |
| knowledge-sync-reminder.js | Claude memory 体系专属 |
| quality-guard.js | 旧版，cs-guard 合并版已含 |
| logic-guard.js | 同上 |
| artifact-index-update.js | **坏的**：读 input.tool/input.params，实际是 tool_name/tool_input，从未生效 |

### 🐛 发现 harness 现有 bug（Claude 下也一直存在）

1. cs-guard 合并后 quality-guard/logic-guard 未删 → 每次写 .cs 跑 3 遍检查
2. artifact-index-update.js 字段名错误 → 永失效
3. metrics-collector 无 matcher → 每次工具调用空跑写 JSON

---

## 三、Rules 迁移清单（5 核心 + 28 知识规则）

### 🏆 直接保留（16 个，工具无关）

- languages 5 个：csharp / vue / sqlserver / postgresql / javascript（.NET 异步规范、Vue2 i18n 铁律、SQL 陷阱——领域知识，最高价值）
- gates 5 个：requirement / design / code / test / release（五门禁检查项）
- quality 3 个：question-bank（高信号问题库）、review-checklist（含多租户 ComId）、hooks-standards（JS 规范）
- workflows/git.md、workflows/artifact-management.md
- rules/quality/gates.md、rules/quality/verification.md（核心规则）

### ✂️ 裁剪保留（5 个，去掉 Claude 专属部分）

- rules/tools/token-optimization.md：删 rtk hook claude、ctx_*，保留 Think-in-Code
- knowledge/rules/token-optimization/thinking.md：工具名改 Reasonix 对应
- knowledge/rules/workflows/task-management.md：去掉 ~/.claude/projects/ 路径，保留经验沉淀格式
- knowledge/rules/workflows/knowledge-sync.md：保留三层知识体系，路径换 Reasonix
- knowledge/rules/tools/model-strategy.md：Claude 模型名映射 Reasonix

### 🗑️ 不迁（10 个，Claude 专属 / 加密专用）

- code-access 4 个（encryption / indexing / write-rules / decision-tree）：加密专用
- rules/tools/code-access.md、rules/tools/rtk.md：加密规则 + RTK 使用
- knowledge/rules/token-optimization/tools.md：SQLite 索引命令模板
- knowledge/rules/workflows/workflows.md：触发词表绑 skill-router hook
- knowledge/rules/quality/hooks-standards.md：Claude hook 编写规范

---

## 四、Skills 分类（20 个）

| 类别 | 数量 | 说明 |
|---|---|---|
| 自研 .NET 方法论 | 12 | review（双轴对抗审查 25 维度）、systematic-debugging（失败模式检测）、requirements（反谄媚五问）、perf-tune、sql-best-practices、test、arch-review、dev-workflow、commit、docs、verification-before-completion、skill-manager |
| opencli 配套手册 | 6 | opencli-usage/browser/adapter-author/autofix/browser-sitemap + smart-search —— 第三方 CLI @jackwener/opencli 使用手册，**宿主无关，原样可用** |
| 第三方工具链 | 1 | research（hoolulu/deep-research，外部开源项目） |
| 自研工具 | 1 | sync（经验同步 + 加密索引） |

迁移要点：SKILL.md 格式两边兼容；需整体搬 references/prompts/rubrics/templates 目录；至少 4 个 skill 交叉引用 rules/tools/code-access.md（需一并处理）；2 个 skill 带 model: sonnet（需映射）。

---

## 五、加密工具链（本机退役）

- tools/sqlite-index/ 全套（search/update/read-file/build，约 120KB PowerShell）
- 3 个加密 hooks：encrypted-write-guard / sqlite-index-update / source-sync-update
- 4 个 code-access 规则

本机无透明加密软件，源码明文，read/grep/LSP/code_index 直接可用。**这些在 Claude 下是刚需，在 Reasonix 下是死代码。**

---

## 六、RTK 专项（0.42.4 实测）

### 事实

- rtk 在 `E:\开发工具\rtk.exe`，不在 PATH
- 自带 5 个宿主 hook：claude / cursor / gemini / copilot / droid —— **无 Reasonix**【实测 `rtk hook --help`】
- Copilot 的 PreToolUse 支持 `modifiedArgs` 改写工具参数【官方文档 hooks-reference】→ RTK 在 Copilot 下可透明自动改写（`rtk hook copilot` 即为此设计）
- `rtk rewrite "git status"` → `rtk git status`（命令改写单点原语）
- `rtk dotnet build/test/restore/format` 可用（核心场景）
- Reasonix Bash 工具 = `powershell.exe -NoProfile -NonInteractive -Command`（实测进程参数）→ **profile 包装判死**
- Reasonix PreToolUse 无 updatedInput → 标准 hook 改写判死

### 可用层

| 方案 | 透明 | 成本 |
|---|---|---|
| PATH + 手动 `rtk` 前缀 | ❌ | 一条 setx |
| `cmd \| rtk pipe` | ❌ | 记住加管道 |
| SessionStart 注入纪律规则 | 🔶 半自动 | 写一条规则 |
| runtime 扩展拦截 tool.before（v1 Manifest） | ✅ | 写 JSON-RPC sidecar + FULL TRUST |

**建议**：未定 Reasonix 主力前不投入 runtime 扩展；先 PATH + 纪律规则。RTK 是可后置的优化项，不是迁移阻塞项。

---

## 七、跨宿主兼容性矩阵（官方文档核实）

> **2026-07-27 勘误**：早前对话曾断言"Copilot 没有 hooks"，经查 GitHub 官方文档（docs.github.com/en/copilot/reference/hooks-reference）为**错误结论**。Copilot（CLI 与 cloud agent）hooks 事件集与 Claude 高度同构，且兼容 Claude 配置格式。错误成因：凭旧知识断言外部事实，未查证官网。
> **2026-07-27 补充**：Codex hooks 机制已按官方文档（learn.chatgpt.com/codex/hooks）核实，见下表。

| 能力 | Claude | Codex | Copilot (CLI / cloud agent) | Reasonix |
|---|---|---|---|---|
| hooks 事件集 | ✅ SessionStart/UserPromptSubmit/PreToolUse/PostToolUse/Stop【官方文档】 | ✅ 同上 + PreCompact/PostCompact/SubagentStart/SubagentStop/SessionEnd/PermissionRequest【官方文档】 | ✅ 同上 + Subagent*/ErrorOccurred/PreCompact + CLI 专属 PermissionRequest/Notification【官方文档】 | ✅ 同名事件 + PostLLMCall/Notification/PreCompact/SubagentStop【官方文档】 |
| hooks 配置格式 | settings.json 原生 | hooks.json / config.toml（`~/.codex/`、`<repo>/.codex/`）【官方文档】 | .github/hooks/*.json + settings.json【官方文档】 | 兼容 Claude 格式（.claude/settings.json 命令映射）【官方文档】 |
| stdin payload | snake_case（tool_name/tool_input） | snake_case（hook_event_name/tool_name/tool_input）**同构**【官方文档】 | snake_case 兼容（VS Code compatible 格式）【官方文档】 | Claude 兼容 snake_case【官方文档】 |
| PreToolUse 改写参数 | ✅ updatedInput | ✅ updatedInput（permissionDecision:allow + updatedInput）【官方文档】 | ✅ **modifiedArgs**【官方文档】 | ❌ 暂不支持（需 runtime 扩展）【官方文档】 |
| UserPromptSubmit 注入 | ✅ additionalContext | ✅ stdout 纯文本即注入【官方文档】 | ✅ additionalContext【官方文档】 | ❌ stdout 无特殊作用【官方文档】 |
| PostToolUse 注入上下文 | ✅ additionalContext | ✅ additionalContext（+ decision block）【官方文档】 | ✅ additionalContext（含 modifiedResult）【官方文档】 | ⚠️ 仅 SessionStart；其余事件 stdout 无特殊作用【官方文档】 |
| 指令文件 | CLAUDE.md | AGENTS.md（原生规范）【官方文档】 | 自定义指令 | REASONIX.md / AGENTS.md / CLAUDE.md |
| MCP | ✅ | ✅【官方文档】 | ✅【官方文档】 | ✅【官方文档】 |
| 插件生态 | 原生 | 兼容 Claude 插件（设 CLAUDE_PLUGIN_ROOT 变量）【官方文档】 | 有插件系统 | 兼容 Claude 插件（.claude-plugin 映射）【官方文档】 |
| RTK 透明改写 | ✅ | ✅（updatedInput）【官方文档 + 实测 rewrite】 | ✅（modifiedArgs + rtk hook copilot）【实测】 | ❌ 手动/扩展【实测】 |

**结论修正（2026-07-27）**：4 个目标宿主中 **3 个（Claude / Codex / Copilot）的 hooks 协议完全同构**——snake_case stdin payload、PreToolUse 参数改写（updatedInput/modifiedArgs）、上下文注入（additionalContext）全部一致，且配置格式互认（Codex 兼容 Claude 插件生态，Copilot 兼容 Claude 格式）。**Reasonix 是唯一不完整兼容项**（无 PreToolUse 改写、UserPromptSubmit stdout 无效）。

**通用 harness 设计含义**：hooks 脚本可以**写一套、3 个宿主直接吃**（以 Claude 契约为基准：snake_case stdin + exit 2 阻断 + hookSpecificOutput/additionalContext 输出）；Reasonix 单独做降级适配（UserPromptSubmit 注入改 SessionStart 或停用、PreToolUse 改写只能走 runtime 扩展）。

### 体系其余组件兼容矩阵（2026-07-27 补充，官方文档核实）

| 组件 | Claude | Codex | Copilot (CLI / cloud agent) | Reasonix |
|---|---|---|---|---|
| 指令文件 | CLAUDE.md | AGENTS.md 原生；`project_doc_fallback_filenames` 可加 CLAUDE.md【官方文档 agents-md】 | **AGENTS.md / CLAUDE.md / GEMINI.md 全部支持**【官方文档 custom-instructions-support】 | REASONIX.md / AGENTS.md / CLAUDE.md |
| skills | `~/.claude/skills/`、`.claude/skills/` | `~/.agents/skills/`、`<repo>/.agents/skills/`（SKILL.md 开放标准 agentskills.io）【官方文档 build-skills】 | **`.github/skills`、`.claude/skills`、`.agents/skills`、`~/.copilot/skills`、`~/.agents/skills`**【官方文档 about-agent-skills】 | skills/（SKILL.md） |
| MCP | ✅ | ✅ | ✅ | ✅ |
| agents | agents/*.md | subagents（自有格式） | custom agents（自有格式） | subagent profiles（自有格式） |
| commands | commands/*.md | slash commands（自有格式） | prompt files（自有格式） | commands/*.md（兼容 Claude 格式） |
| memory / 任务状态 | ~/.claude/projects/ | 自有 | Copilot Memory | 自有（remember） |
| RTK 透明改写 | ✅ | ✅（updatedInput 机制可自写 hook 调 rtk rewrite，无官方处理器） | ✅（modifiedArgs + rtk hook copilot） | ❌（手动/扩展） |

**技能位置收敛点（重大利好）**：
- `.claude/skills` 被 **Claude + Copilot** 共同识别
- `~/.agents/skills` 被 **Codex + Copilot** 共同识别
- 技能内容（SKILL.md）4 宿主格式全同构（Agent Skills 开放标准）——**零改动，只需复制/symlink 分发到上述目录**

**指令文件收敛点**：CLAUDE.md 一份，Claude / Reasonix / Copilot 直接读，Codex 加一行 `project_doc_fallback_filenames = ["CLAUDE.md"]` 即可。

**真正不兼容的只有外围层**：agents 格式、memory/任务状态、commands 格式（各宿主自有），而这恰好是体系里最薄的部分（用户仅 2 个 agents，memory 可用外部文件替代）。

---

## 八、关键风险点（迁移前需实测）

1. bash-guard / commit-gate 的 stdout `decision:block` 格式，Reasonix 是否识别（不识别则改 exit 2）
2. Reasonix matcher 是否接受 `Write|Edit` 管道语法
3. 带 `model:` frontmatter 的 skill 模型别名映射
4. **模型质量**：Reasonix 配置的 provider 在真实项目中的代码能力（最终决策权重最大项）
5. 实际 token 节省 / 体验差异量化

---

## 九、决策建议

1. **不建议长期双轨**：违背 harness-engineering-lessons.md"不要重复建设"教训
2. **推荐路径**：内容层（16 规则 + 12 方法论 skills + 10 护栏 hooks）整体搬 Reasonix → 真实项目验证 1-2 周 → 数据决定去留
3. 迁移工作量：26 hooks 实际要动手的只有 4-5 个；rules/skills 是复制 + 少量裁剪
4. 顺带修复 harness 现有 3 个 bug

---

*此备忘录由评估对话整理。2026-07-27 经用户指正，勘误"Copilot 无 hooks"错误结论（见第七节）；其余结论均有【精读】/【官方文档】/【实测】证据支撑，见对话记录。*
