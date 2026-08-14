# 收藏仓库 × Harness 建设评估报告

> 基于 10 个 GitHub 收藏仓库的深度调研（每个由独立 agent 或主 agent 亲自读源码/文档/元数据完成）。
> 评估口径：对**现有 harness**（RTK + context-mode + codegraph + opencli + 20+ 自建 skills + hooks + learnings 沉淀）的增量价值、集成难度、风险。

## 一、总览表

| # | 仓库 | verdict | 性质 | 集成成本 | 一句话结论 |
|---|------|---------|------|---------|-----------|
| 1 | **claude-code-book** | ⭐ strongly-recommend | 认知 | 零（纯阅读） | 中文最系统的 Claude Code 架构剖析，精读 4 章补认知底座 |
| 2 | **planning-with-files** | ⭐ strongly-recommend | 机制 | medium | 补 dev-workflow 缺失的「计划持久化+崩溃恢复」层 |
| 3 | **SkillOpt** | worth-considering | 机制 | medium | SkillOpt-Sleep 用留出验证门禁自动优化 skill 文案，先 dry-run |
| 4 | **skill-based-architecture** | worth-considering | 机制 | medium | 经验→规则→skill 的激活闭环，解决 learnings 沉淀后不被激活 |
| 5 | **Trellis** | worth-considering | 理念 | medium | 不整体装，借鉴 per-turn 状态注入+子代理上下文预算 |
| 6 | **Aegis** | worth-considering | 理念 | medium | baseline/evidence/drift 与你的 gates 同构但更操作化，摘三件套 |
| 7 | **ECC** | worth-considering | 蓝图 | medium | star 数不可信但五类分层+token 参数可借鉴，不整体装 |
| 8 | **headroom** | worth-considering | 机制 | medium | 第三层压缩，净增量在 history 与模型回写侧，可对比选型 |
| 9 | **claude-mem** | worth-considering | 机制 | medium | 与 context-mode 三层重叠，唯一增量是 SessionStart 自动注入 |
| 10 | **claude-reflect-system** | worth-considering | 理念 | medium | 理念正中靶心（纠错→写回 skill），但实现半残+不支持中文，需重写 |

## 二、分档

### 第一档：直接采纳（2 个）

**claude-code-book** — 零成本认知投资
- 选择性精读 Ch04 权限管线 / Ch07 上下文压缩 / Ch08 钩子 / Ch14 Plan / Ch15 自建 harness
- 每章只吃透「设计决策分析」+「反模式警告」两节
- 落地：把反模式提炼成一张 harness 决策检查清单 → 对照更新 `HARNESS-ENGINEERING-PLAN.md`

**planning-with-files** — 补 dev-workflow 持久化层
- 3 文件（task_plan/findings/progress）+ 5 钩子（UserPromptSubmit/PreToolUse/PostToolUse/Stop/PreCompact 强制落盘）
- 接缝：dev-workflow 负责「把计划写对」，它负责「让计划活着」
- 安装必须走 plugin 路线（skill-only 会静默无钩子），装完跑 `/plan-doctor`
- 与 task-state.md 划清职责（激活任务归三文件，归档仍走 task-management）
- ⚠️ deepseek 代理下先测回合级注入对 KV 缓存的破坏，必要时 PWF_INJECT=smart

### 第二档：借理念重写（5 个）— 都别整体装

| 仓库 | 借什么 | 怎么用 |
|------|--------|--------|
| **Trellis** | per-turn `<workflow-state>` 注入 | 用你现有 hooks 加 UserPromptSubmit 注入状态文件 |
| **Trellis** | 子代理上下文字节预算 | 32KB/file / 128KB/total，超限降级 index lines |
| **Trellis** | Windows UTF-8 hook 模板 | `stdin/stdout/stderr reconfigure(utf-8)` 直接抄 |
| **Aegis** | TaskStartSnapshot 基线 | 首次写文件前记录 git HEAD/分支/脏状态，缺基线暂停 |
| **Aegis** | 证据槽收据 | action/result/scope/uncovered/residual/confidence A\|B\|C |
| **ECC** | 五类组件分层 | Skills/Agents/Rules/Hooks/Instincts 职责划分对照 plan |
| **ECC** | token 参数 | CLAUDE_CODE_SUBAGENT_MODEL=haiku、AUTOCOMPACT_PCT、MAX_THINKING_TOKENS |
| **claude-reflect-system** | Stop hook 纠错回写闭环 | 但中文正则自补，修复 auto 模式 EOF 缺陷后才有用 |
| **headroom** | 对话历史压缩 | RTK/context-mode 都不处理 history，headroom 可压 56-81% |

### 第三档：试用验证（2 个）

- **SkillOpt**：官方 Claude Code 插件，`/skillopt-sleep dry-run`（mock 零花费）验证管道 → handoff 后端小规模试跑 → 检查 report.md 后手动 adopt。收益偏保守（强模型 +6.0）
- **claude-mem**：只有痛点是「新会话自动感知上次决策」才值得。试点用 Gemini 免费 key 控成本，1-2 周用 viewer 看成本

### 暂缓 / 跳过

- **ECC 整体装**：49MB + 287 skills + 刷量嫌疑 + 商业 Pro 导向，只借蓝图
- **headroom 整体引入**：三层压缩叠加收益递减，工具输出已被 context-mode 压到 2%，增量有限
- **claude-mem**：与 context-mode 三层重复，除非明确要自动注入

## 三、与现有 stack 的关系矩阵

| 你已有的 | 对应的外部方案 | 结论 |
|---------|--------------|------|
| RTK（bash 输出压缩） | headroom | 分层不同可共存，history 是 headroom 独有增量 |
| context-mode（工具沙箱+记忆+检索） | claude-mem / headroom | 记忆/压缩高度重叠，claude-mem 仅「自动注入」是增量 |
| learnings.md（手动沉淀） | SBA / SkillOpt / reflect-system | 三者都是「自动化+验证」升级，互不冲突 |
| dev-workflow（计划+派发） | planning-with-files | 正交互补，非竞争 |
| gates/verification（防自欺） | Aegis | 同构但 Aegis 更操作化，可增强 |
| HARNESS-ENGINEERING-PLAN | claude-code-book / ECC | 书补认知，ECC 补分层框架 |

## 四、建议行动路线

**阶段 1（今天，零成本）**：git clone claude-code-book → 精读 Ch04/07/08/14/15 → 提炼决策检查清单 → 更新 HARNESS-ENGINEERING-PLAN.md

**阶段 2（机制补强）**：装 planning-with-files（plugin 路线 + /plan-doctor）→ 与 dev-workflow 对齐计划模板格式 → 划清与 task-state.md 职责

**阶段 3（自动学习闭环）**：二选一启动 ——
- 轻量：把 SBA 的 rule-update 流程（2/3 门槛 + verified-failure 直写 + activate 校验）复刻进 dev-workflow
- 或：SkillOpt-Sleep dry-run 验证后试点优化 1 个自建 skill 文案

**阶段 4（按需）**：Trellis 的 per-turn 状态注入（如需每轮感知当前步骤）→ Aegis 证据槽增强 gates → headroom history 压缩（如长会话历史成为瓶颈）

**红线**：ECC / claude-mem / headroom / Trellis 都只借理念不整体装；AGPL 仓库（Trellis）只重写不复制。
