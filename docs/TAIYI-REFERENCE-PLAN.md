# Claude Code 系统借鉴方案

> 基于三个仓库的源码分析：
> - 太一元系统：https://github.com/dctx479/claude-code-instruction-system（840 文件）
> - Claudest：https://github.com/gupsammy/Claudest（8 个插件）
> - Comet：https://github.com/rpamis/comet（5 阶段流水线）
> 日期：2026-06-26

## 背景

经 10 个子代理并行分析三个仓库的源码：

| 仓库 | 定位 | 子代理数 |
|------|------|---------|
| 太一元系统 | 840 文件的指令体系，面向 AI/ML 科研 | 4（Agent、Skills、Memory、Hooks） |
| Claudest | 8 个插件的精选市场，作者亲测 | 4（memory、thinking、coding、skills） |
| Comet | 5 阶段流水线（OpenSpec + Superpowers） | 2（SKILL.md + 脚本/Guard/Schema） |

筛选出 11 个适合你现有系统借鉴的原则（不复制实现）。

## 你现有的系统

| 模块 | 现状 | 太一元系统对比 | Claudest 对比 | Comet 对比 |
|------|------|---------------|--------------|-----------|
| CLAUDE.md | 62 行，精简 | 782 行，庞大 | 插件化，按需加载 | 无（通过插件管理） |
| Skills | 20+ 个，按工作流分 | 58 个，按领域分 | 8 个插件，精选市场 | 8 个 skill（5 阶段） |
| Memory | memory/MEMORY.md 静态索引 | 有去重 + 案例引用 | 5 层记忆 + SQLite FTS5 | 无（依赖对话上下文） |
| 工作流 | dev-workflow skill | 自主循环 + Autopilot | 无 | 脚本化状态机 + Guard |
| 需求探索 | requirements skill | brainstorming + demand-detective | brainstorm（多校准模式） | comet-open（PRD 分片） |
| 设计阶段 | requirements 的头脑风暴 | brainstorming | brainstorm | comet-design（handoff 脚本化） |
| 构建执行 | dev-workflow skill | Ralph Loop | 无 | comet-build（子代理 offload） |
| 验证收尾 | verification-before-completion | QA 评分体系 | 无 | comet-verify（轻量/完整双路径） |
| 归档 | 无 | 无 | 无 | comet-archive（自动 spec 合并） |
| 快速修复 | 无预设路径 | 无 | 无 | comet-hotfix（升级机制） |
| 偏差检测 | gates.md 有防自欺机制 | R1-R6 根因框架 | repair-skill 7 维审计 | 三层防御（软/中/硬） |
| 自主决策 | question-bank.md 问澄清问题 | 授权矩阵（自主/确认/禁止） | 无 | 决策阻塞点（9 个节点） |

---

## 借鉴项 1：R1-R6 根因框架

### 目的

替代现有偏差检测，增加"什么时候该加规则"的判定框架，防止 rules 无限膨胀。

### 实施

在 `rules/quality/gates.md` 中新增一个 section：

```markdown
## R1-R6 根因框架

每次任务偏差必须归因后再决定是否改规范：

| 根因 | 含义 | 动作 |
|------|------|------|
| R1 规范缺失 | 该情况没有对应约定 | 补充 Skill / rules |
| R2 规范冗余 | 规则太多互相矛盾 | 精简 / 合并条目 |
| R3 规范过时 | 工具/环境已变但规则未更新 | 同步更新，旧版加废弃标记 |
| R4 Review 漏洞 | 检查项不完整导致问题流出 | 补 review 清单项 |
| R5 代码 bug | 代码逻辑错误，非规范问题 | 修代码，不动规范 |
| R6 外部因素 | 网络/API/第三方变更 | 记录，不一定改规范 |

**铁律**：R5 / R6 不触发规范进化；R1-R4 才是补规则的合法依据。
```

### 文件变更

- 修改：`~/.claude/rules/quality/gates.md`（新增 ~20 行）

---

## 借鉴项 2：自主决策授权矩阵

### 目的

明确"哪些事我可以直接做"，减少不必要的确认，提升效率。

### 实施

在 `CLAUDE.md` 中新增一个 section：

```markdown
## 自主决策授权

### ✅ 完全自主（无需确认）
- 代码实现/优化
- Bug 修复（不影响公共 API）
- 测试编写
- 配置文件更新
- 文档更新
- 依赖版本升级（小版本）

### ⚠️ 需要确认
- 删除现有功能
- 修改公共 API 签名
- 引入新依赖（大版本或新库）
- 数据库 Schema 变更
- 生产环境操作
- P0/P1 问题修复策略

### 🔴 绝对禁止
- 批量删除文件（必须逐个确认）
- 静默吞掉错误（必须有 WARNING 日志）
- 直接 push 到 main/develop
```

### 文件变更

- 修改：`~/.claude/CLAUDE.md`（新增 ~25 行）

---

## 借鉴项 3：经验沉淀格式升级

### 目的

增加案例引用和去重检查，让经验更可复用。

### 实施

升级 `memory/learnings.md` 的格式：

```markdown
## [日期] 经验条目 #ID

### 问题描述
（一句话描述）

### 根因分析
（为什么出问题）

### 解决方案
（怎么解决的）

### 案例引用（必填）
- commit: <hash> 或 文件: <path> 或 错误日志: <片段>
- 不允许无案例引用的经验

### 验证方法
（如何确认解决了）

### 复用条件
（什么场景下可以复用这个经验）
```

### 去重检查

写入新经验前，先搜索已有条目：
1. 搜索 Pattern-Key（问题关键词）
2. 匹配则更新 Recurrence-Count，不匹配则新建
3. 避免重复记录同一个问题

### 反模式（禁止）

- ❌ 无案例引用的经验
- ❌ "要注意配置文件格式"（太泛化）
- ❌ "可能会遇到路径问题"（无具体场景）

### 文件变更

- 修改：`~/.claude/projects/C--Users-admin--claude/memory/learnings.md`（格式升级）

---

## 借鉴项 4：Skills 核心流程链

### 目的

用户已有 `requirements` skill（头脑风暴 + 需求质询），但可以增强流程链的连贯性。

### 现状

你的 `requirements` skill 已包含：
- A. 头脑风暴（发散探索）
- B. 需求质询（五问质询）

太一元系统的类似 skill：
- brainstorming（发散探索 + 思考伙伴）
- demand-detective（业务决策清单）

### 建议

**不需要新增 skill**，你的 `requirements` 已覆盖。但可以增强：

1. 在 `requirements` 的完成标准中增加"业务决策清单"
2. 确保头脑风暴 → 需求质询 → 设计文档的流程更清晰

### 文件变更

- 可选修改：`~/.claude/skills/requirements/SKILL.md`（增强完成标准）

---

## 借鉴项 5：Intent Detector 思路（轻量级）

### 目的

根据用户输入自动路由到合适的 skill，减少手动调用。

### 实施

太一元系统的实现是 bash 脚本（依赖 Git Bash），不适合你的 Windows 环境。

**轻量级替代方案**：在 `settings.json` 的 `hooks` 中加一个 `UserPromptSubmit` hook，
用 JavaScript 实现关键词匹配。

但这需要：
1. 修改 `settings.json` 配置 hooks
2. 编写一个轻量级的意图检测脚本
3. 处理 Windows 兼容性

### 建议

**优先级 P2**，可以先不做。原因：
- 你已有 `/skill` 命令和自然语言触发词
- 自动路由的收益有限，但增加了复杂度
- 你的 CLAUDE.md 保持精简的原则更重要

### 文件变更

- 暂不实施

---

## 借鉴项 6：5 层记忆层次（来自 Claudest）

### 目的

升级你的 memory 系统，从静态索引变为分层按需加载。

### 现状

你的 `memory/MEMORY.md` 是扁平索引，每次会话都加载全部内容。

Claudest 的 claude-memory 插件设计了 5 层记忆：

| 层级 | 文件 | 加载时机 | 用途 |
|------|------|----------|------|
| L0 | `~/.claude/CLAUDE.md` | 每个会话，所有项目 | 通用行为偏好 |
| L1 | `<repo>/CLAUDE.md` | 每个会话，当前项目 | 架构、约定、陷阱 |
| L2 | `memory/MEMORY.md` | 每个会话，代理管理 | 工作笔记索引 |
| L2c | `memory/clusters/*.md` | 按需（段落溢出时） | 段落子索引 |
| L3 | `memory/*.md` | 按需 | 详细参考资料 |

### 实施

你已有 L0（CLAUDE.md）、L1（项目级 CLAUDE.md）、L2（memory/MEMORY.md）。

需要补充的是 **L2c（clusters 段落子索引）**：

当 `memory/MEMORY.md` 超过 50 行时，拆分为子索引：

```
memory/
├── MEMORY.md          # 主索引（< 50 行）
├── clusters/
│   ├── engineering.md  # 工程经验子索引
│   ├── project.md      # 项目经验子索引
│   └── learnings.md    # 踩坑记录子索引
```

### 文件变更

- 可选重构：`~/.claude/projects/C--Users-admin--claude/memory/` 目录结构

---

## 借鉴项 7：council 多人格辩论（来自 Claudest）

### 目的

在 brainstorming 时引入多视角辩论，避免单一视角盲区。

### 现状

你的 `requirements` skill 有头脑风暴，但只有单视角探索。

Claudest 的 council 机制设计了 6 个认知人格：

| 人格 | 视角 | 典型问题 |
|------|------|---------|
| Architect | 系统性 | "这个设计能扩展吗？" |
| Skeptic | 质疑性 | "证据在哪？假设对吗？" |
| Pragmatist | 务实性 | "能按时交付吗？成本多少？" |
| Innovator | 创新性 | "有更优雅的方案吗？" |
| Advocate | 用户性 | "用户真的需要这个吗？" |
| Strategist | 战略性 | "这和长期目标一致吗？" |

### 实施

**不需要新增 skill**，可以在 `requirements` 的头脑风暴阶段加入辩论机制：

```markdown
## A. 头脑风暴（增强版）

### 辩论阶段（可选）

当用户说"讨论一下"、"辩论一下"、"多角度分析"时触发：

1. **独立提案**：为每个相关人格生成独立方案
2. **轮询批评**：每个人格批评其他人的方案
3. **综合总结**：提取共识和关键分歧，给出推荐

触发词："讨论"、"辩论"、"多角度"、"council"
```

### 文件变更

- 可选修改：`~/.claude/skills/requirements/SKILL.md`（新增辩论阶段）

---

## 借鉴项 8：7 维 Skill 审计（来自 Claudest）

### 目的

系统化审查 skill 质量，替代你现有的 skill-manager。

### 现状

你有 `skill-manager` skill，但没有系统化的审计维度。

Claudest 的 repair-skill 定义了 7 个审计维度：

| 维度 | 名称 | 核心关注点 |
|------|------|-----------|
| D1 | Frontmatter Quality | 描述第三人称、触发短语真实性、Token 密度 |
| D2 | Execution Modifiers | 模型选择、上下文配置、工具配置 |
| D3 | Intensional vs Extensional | 规则带推理说明，而非仅示例 |
| D4 | Agentic vs Deterministic | 脚本机会识别、模糊引用 |
| D5 | Verbosity and Context Efficiency | 重述标题、模糊语言、层级深度 |
| D6 | Workflow Clarity | 阶段划分、退出条件、输出格式 |
| D7 | Anatomy Completeness | 目录结构与复杂度匹配、缺失资源 |

### 实施

在 `skill-manager` 中引用这 7 个维度作为审计清单：

```markdown
## 审计维度

审查 skill 时检查：

1. **Frontmatter** — 描述是否第三人称？触发短语是否真实？
2. **执行配置** — 模型选择合理吗？工具权限匹配吗？
3. **指令质量** — 规则带推理说明吗？还是只有示例？
4. **代理分离** — 能用脚本的部分分离出来了吗？
5. **冗余度** — 有重述标题、模糊语言吗？
6. **工作流** — 阶段清晰吗？有退出条件吗？
7. **完整性** — 目录结构与复杂度匹配吗？
```

### 文件变更

- 修改：`~/.claude/skills/skill-manager/SKILL.md`（新增审计维度）

---

## 借鉴项 9：预设路径 + 升级机制（来自 Comet）

### 目的

为 dev-workflow 增加快捷路径，让 bug 修复和微调不用走完整流程。

### 现状

你的 dev-workflow 每次都要走完整流程（plan → caveman → execution），没有快捷方式。

Comet 设计了 2 个预设路径：

| 预设路径 | 触发条件 | 升级条件 |
|---------|---------|---------|
| **hotfix** | bug 修复、≤2 文件、无架构变更 | 涉及 3+ 文件、架构变更、DB schema 变更 |
| **tweak** | 无新功能、≤3 任务、文案/配置/文档 | 涉及 5+ 文件、跨模块、需要新功能 |

### 实施

在 `dev-workflow` 中新增 2 个分支：

```markdown
## D. 快速修复（hotfix）

触发词："修复 bug"、"hotfix"、"紧急修复"

流程：
1. 跳过头脑风暴
2. 直接进入执行
3. 根因检查（必须验证根因消除）
4. 验证 + 收尾

升级条件（满足任一 → 走完整流程）：
- 涉及 3+ 文件
- 架构变更
- 数据库 Schema 变更
- 引入新 public API

---

## E. 微调（tweak）

触发词："改个配置"、"调一下"、"tweak"、"文案优化"

流程：
1. 跳过头脑风暴
2. 轻量计划
3. 直接执行
4. 轻量验证

升级条件（满足任一 → 走完整流程）：
- 涉及 5+ 文件
- 跨模块协调
- 需要新功能
- 配置项新增或删除
```

### 文件变更

- 修改：`~/.claude/skills/dev-workflow/SKILL.md`（新增 hotfix/tweak 分支）

---

## 借鉴项 10：三层防御体系（来自 Comet）

### 目的

升级质量门禁，从单一"软防线"变为三层防御。

### 现状

你的 gates.md 只有规则提醒（软防线），没有脚本验证和 Hook 拦截。

Comet 的三层防御体系：

| 防御层 | 机制 | 作用 |
|--------|------|------|
| **软防线** | 规则每轮注入 agent 上下文 | 防漂移（提醒） |
| **中防线** | 脚本验证退出条件 | 防跳过（验证） |
| **硬防线** | Hook 拦截非法操作 | 防违规（拦截） |

### 实施

在 `rules/quality/gates.md` 中新增防御分层概念：

```markdown
## 三层防御体系

### 软防线（规则提醒）
- 每轮对话注入关键规则
- 适用于：所有场景
- 示例：禁止 .Result / .Wait()

### 中防线（脚本验证）
- 通过脚本验证退出条件
- 适用于：build 完成后、test 完成后
- 示例：dotnet build 退出码 == 0

### 硬防线（Hook 拦截）
- 通过 Hook 拦截非法操作
- 适用于：禁止直接 push 到 main
- 示例：pre-push hook 拦截

### 当前状态
- ✅ 软防线：已有（rules 注入）
- ⚠️ 中防线：部分有（build/test 验证）
- ❌ 硬防线：无（可选，优先级 P2）
```

### 文件变更

- 修改：`~/.claude/rules/quality/gates.md`（新增防御分层 ~15 行）

---

## 借鉴项 11：阶段权限控制（来自 Comet）

### 目的

在工作流的不同阶段限制允许的操作，防止 agent 跳阶段。

### 现状

你的 dev-workflow 没有阶段权限控制，agent 可以在任何时候写代码。

Comet 的阶段权限矩阵：

| 阶段 | 允许 | 禁止 |
|------|------|------|
| open | 创建 proposal/design/tasks | 写源代码 |
| design | brainstorming、创建 Design Doc | 写源代码 |
| build | 写源代码、测试、执行计划 | 跳过用户确认点 |
| verify | 验证、branch handling | 跳过失败处理 |
| archive | 确认归档 | 写源代码 |

### 实施

在 `dev-workflow` 的每个阶段增加权限检查：

```markdown
## 阶段权限

### Plan 阶段
- ✅ 允许：需求分析、方案设计、计划编写
- ❌ 禁止：写源代码、修改配置、执行构建

### Execution 阶段
- ✅ 允许：写源代码、测试、构建
- ⚠️ 需确认：删除功能、修改公共 API

### Verification 阶段
- ✅ 允许：运行测试、构建验证、代码审查
- ❌ 禁止：写新功能代码（除非修复验证发现的问题）
```

### 文件变更

- 修改：`~/.claude/skills/dev-workflow/SKILL.md`（新增阶段权限 ~10 行）

---

## 实施计划

| 阶段 | 借鉴项 | 来源 | 工作量 | 优先级 |
|------|--------|------|--------|--------|
| 1 | R1-R6 根因框架 | 太一元 | 20 行 | P0 |
| 2 | 自主决策授权矩阵 | 太一元 | 25 行 | P0 |
| 3 | 预设路径 + 升级机制 | Comet | 30 行 | P1 |
| 4 | 三层防御体系 | Comet | 15 行 | P1 |
| 5 | 阶段权限控制 | Comet | 10 行 | P1 |
| 6 | 经验沉淀格式升级 | 太一元 | 格式变更 | P1 |
| 7 | 7 维 Skill 审计 | Claudest | 15 行 | P1 |
| 8 | 5 层记忆层次 | Claudest | 目录重构 | P1 |
| 9 | council 多人格辩论 | Claudest | 可选增强 | P2 |
| 10 | Skills 核心流程链 | 太一元 | 可选增强 | P2 |
| 11 | Intent Detector | 太一元 | 暂不实施 | P2 |

### 预计总改动

- 新增 ~115 行规则（CLAUDE.md + gates.md + skill-manager + dev-workflow）
- 格式变更 2 个文件（learnings.md + memory 目录）
- 可选增强 1 个文件（requirements SKILL.md）
- 总计：~115 行改动

### 验证方法

1. 修改后运行 `/context` 检查 token 增量
2. 下次任务时测试 R1-R6 框架是否生效
3. 下次经验沉淀时测试新格式
4. 下次 skill 审计时测试 7 维检查
5. 下次 bug 修复时测试 hotfix 快捷路径
6. 下次构建时验证三层防御体系

---

## 不借鉴的部分

| 部分 | 来源 | 原因 |
|------|------|------|
| 22 个 AI/ML/科研 Agent | 太一元 | 你不做这些 |
| Ralph Loop + Autopilot | 太一元 | 你已有 CronCreate + ScheduleWakeup |
| HUD Statusline | 太一元 | Windows 兼容性差 |
| 端口管理系统 | 太一元 | 过度设计 |
| 大量 bash 脚本 | 太一元 | 你的环境是 Windows + PowerShell |
| 782 行 CLAUDE.md | 太一元 | 违反 SNR 原则 |
| claude-coding 插件 | Claudest | 你已有 dev-workflow + commit + review |
| claude-research 插件 | Claudest | 你不做跨平台研究 |
| claude-content 插件 | Claudest | 你不做视频/图像处理 |
| OpenSpec + Superpowers 生态 | Comet | 和你现有系统不兼容 |
| 29 个平台支持 | Comet | 你只用 Claude Code |
| 完整归档脚本 | Comet | 你的项目规模不需要 |

---

## 总结

这个方案的核心是**借鉴原则，不复制实现**：

### 来自太一元系统

1. **R1-R6** — 防止 rules 膨胀
2. **授权矩阵** — 提升自主效率
3. **经验格式** — 提升可复用性

### 来自 Claudest

4. **5 层记忆层次** — 按需加载，节省 token
5. **7 维 Skill 审计** — 系统化质量检查
6. **council 多人格辩论** — 多视角探索

### 来自 Comet

7. **预设路径 + 升级机制** — hotfix/tweak 快捷方式
8. **三层防御体系** — 软/中/硬防线分层
9. **阶段权限控制** — 防止 agent 跳阶段

### 可选/暂不实施

10. **Skills 核心流程链** — 你已有 requirements
11. **Intent Detector** — Windows 兼容性问题

预计改动 ~115 行，保持 CLAUDE.md 精简的原则。
