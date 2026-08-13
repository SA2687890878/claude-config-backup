# Harness 迭代升级计划

> 基于 GitHub 收藏仓库深度调研（2026-08-13）+ 现有 harness 现状核查（同日）得出的迭代升级路线。
> 上游调研报告：`skills/research/reports/harness-star-review/REPORT.md`
> 现有架构规划：[HARNESS-ENGINEERING-PLAN.md](HARNESS-ENGINEERING-PLAN.md)

## 背景：北极星目标

所有迭代围绕 4 个目标（评估任何工具/流程是否值得引入的验收标准）：

| # | 目标 | 含义 |
|---|------|------|
| 1 | 消除重复工作 | 自动化所有确定性操作 |
| 2 | 降低认知负荷 | 流程标准化，减少决策点 |
| 3 | 加速反馈循环 | 快速验证，及时发现问题 |
| 4 | 积累工程知识 | 经验沉淀，跨项目复用 |

**核心目标：高质量完成工作 → 节省 Token → 早点下班**

> 判定规则：候选只命中 ≤1 个目标 → "值得考虑"而非"该做"。落地优先级 = 跨目标命中率 × 集成成本。

## 前置诊断：规划 vs 现实差距

现状核查（2026-08-13，settings.local.json + hooks/ 目录）与 ENGINEERING-PLAN 的规划不一致，**差距本身就是最高优先级迭代项**：

| 规划说了什么 | 实际是什么 |
|---|---|
| hooks 26→6 裁剪 | settings.local.json 实际在跑 ~25 个用户 hook + 5 个 context-mode hook |
| cs-guard 合并版已含 quality/logic，删重复注册 | cs-guard / vue-guard / logic-guard / quality-guard 仍分开挂在 PostToolUse |
| artifact-index-update 是坏的，标记删除 | 仍挂在 PostToolUse |
| context-mode 已覆盖记忆/压缩层 | 5 个生命周期 hook 都在跑（sessionstart/userpromptsubmit/posttooluse/stop/precompact） |

**含义**：hook 是"每次事件必执行"机制，与省 token 目标冲突，30 个 hook 是当前最大负担。**先收敛现状、再吸收外部理念**——否则吸收 = 重复叠加。本计划据此将「现状收敛」排为 P0。

## 调研结论摘要（10 仓库）

| 仓库 | verdict | 对 harness 的意义 |
|------|---------|------------------|
| skill-based-architecture | ⭐ 4/4 | 经验→规则→skill 激活闭环 |
| planning-with-files | ⭐ 4/4 | 计划持久化 + 崩溃恢复（但回合级注入与渐进披露冲突，降级吸收） |
| SkillOpt-Sleep | ✅ 3/4 | 验证门禁自动优化 skill（收益偏保守 +6.0） |
| Aegis | ✅ 2.5/4 | 证据槽标准化验证 |
| Trellis | ✅ 2/4 | per-turn 状态注入（AGPL 借理念） |
| claude-mem | ⚪ 2/4 | 与 context-mode 三层重叠，仅自动注入增量 |
| claude-reflect-system | ⚪ 2/4 | 理念好但实现半残+不支持中文 |
| headroom | ⚪ 1/4 | 直省 Token，增量在 history 压缩 |
| claude-code-book | ⚪ 1/4 | 架构认知（零成本，备读） |
| ECC | ⚪ 1/4 | 蓝图分层，star 数不可信，不整体装 |

## 迭代升级计划

> 排序原则：先清理后吸收。每阶段含目标 / 动作 / 收益 / 验收 / 风险。

### P0 现状收敛 — 已执行（2026-08-13）

**目标**：消除 hook 重复执行与失效条目，直接省 token + 降认知负荷。

**已执行**：
1. ✅ 删除 `artifact-index-update.js`（坏的：读 `input.tool`/`input.params`，实际字段是 `tool_name`/`tool_input`，条件永假，从未生效）——从 settings.local.json 移除注册 + 删文件
2. ✅ 确认 `cs-guard.js` 已是合并版（合并 cs+quality+logic 三合一），删除孤儿文件 `quality-guard.js` / `logic-guard.js`（未注册、逻辑已被合并版覆盖）

**确认决策**：
- **加密专用 3 个（encrypted-write-guard/sqlite-index-update/source-sync-update）保留**——本机未装加密软件，但 harness 跨电脑复用、其他电脑可能装加密软件，是 code-access 铁律落地机制。已更正 ENGINEERING-PLAN 10.6 过时假设
- **转规则/技能 12 个暂缓**——这些 hook 当前正常工作，转规则需改 CLAUDE.md+多 skill，回归风险高，留后续迭代逐个验证

**验收**：settings.local.json hooks 数量收敛；坏/孤儿 hook 清除（剩余未做的是行为改造类，非清理类）。

### P1 认知底座 — 已执行（2026-08-13）

**目标**：补 harness 架构认知，让后续决策有依据。

**已执行**：
1. ✅ 精读 claude-code-book Ch04 权限 / Ch07 上下文 / Ch08 钩子 / Ch14 Plan / Ch15 自建 harness
2. ✅ 提炼决策检查清单 → 落成 `docs/HARNESS-DECISION-CHECKLIST.md`（20 项，按需加载，含状态图例）
3. ✅ 补精读 Ch05 设置 / Ch06 记忆 / Ch11 技能 → 清单扩展至 31 项（#21-31）
4. ✅ 与 ENGINEERING-PLAN 第 1 节设计原则对照，无冲突；ENGINEERING-PLAN 头部已挂引用

**关键收获**（待后续迭代消化）：
- 上下文管理"断路器必须真的会触发"（#8）、"80% 主动压缩"（#5）→ 补主动压缩规则
- Plan 模式"计划三层恢复"（#13）→ 佐证 dev-workflow 持久化层必要性
- "派发子任务最小上下文"（#15）→ 佐证 Trellis 字节预算采纳
- "可观测性四层 + 钩子耗时"（#19）→ 钩子成本审计
- 记忆系统"只存不可推导"（#24）、"记忆是线索非结论"（#25）→ learnings 审查标准
- "缓存感知的派生约束"（#27）→ 子任务工具集保持一致（省 prompt cache）

**验收**：✅ 清单产出（31 项）+ ENGINEERING-PLAN 对照修订完成。

### P2 验证增强 — 已执行（2026-08-13）

**目标**：把"完成"从主观声称变成附新鲜证据的收据。

**已执行**（三处最小改动，不新增 hook）：
1. ✅ `rules/quality/gates.md` Task Contract 加 `baseline` 字段（首次写文件前记录 git HEAD/分支/脏状态，缺基线暂停）——TaskStartSnapshot 理念
2. ✅ `rules/quality/verification.md` 验证纪律加"收据必须完整"（证据槽 = action/result/scope/uncovered/residual/confidence A|B|C）
3. ✅ `skills/verification-before-completion/SKILL.md` 加"完成收据"输出格式 + confidence 判定依据

**验收**：✅ 一次任务完成后产出带 scope/residual 的验证收据（规则已生效，待真实任务验证）。

### P3 学习激活闭环 — 已执行（2026-08-13）

**目标**：解决"经验沉淀后不被激活、同类 bug 再踩"。现有 learnings.md 无激活环节。

**已执行**（SBA rule-update 三件套，复刻进 dev-workflow 收尾 + learnings.md 头部）：
1. ✅ `skills/dev-workflow/SKILL.md` B 执行计划完成标准后加"经验沉淀（收尾，SBA 三件套）"小节：
   - Recording Threshold（可重复/代价高/代码看不出 ≥2 条）
   - verified-failure 直写（红转绿教训直写最近规则 owner，不等重复）
   - activate 校验（每条经验必须落在任务路径上改变下一步动作，同根因再犯提示升级门禁）
2. ✅ `learnings.md` 头部加沉淀标准（SBA 三件套 + 记忆是线索非结论 + 时间写绝对日期）

**收益**：积累知识 + 消除重复（目标 1/4），是现有 learnings.md 上的增量。
**验收**：✅ 机制已落位；真实"纠错→下次行为改变"闭环待后续任务验证。

### P4 按需补充 — 已评估（2026-08-13，两项跳过一项备选）

**目标**：补齐小件可选项。

**评估结论**：

| 小件 | 结论 | 依据 |
|------|------|------|
| UTF-8 hook 模板（Trellis） | **跳过** | 该模板解决 Python hook 在 Windows GBK 代码页下的乱码；本 harness 25 个 hooks 全是 node.js 且已显式 `setEncoding('utf8')`，无此问题 |
| PreCompact 落盘（planning-with-files 理念） | **跳过** | context-mode 的 precompact.mjs 已实现同一机制（PreCompact 时读会话事件→构建 <2KB resume snapshot→存盘供压缩后注入），再建是重复建设、同事件双写 |
| SkillOpt-Sleep | **备选**（暂不启动） | 唯一有增量者：自动 harvest→门禁验证 skill 文案，是 P3 的验证门禁升级版。但收益偏保守（强模型 +6.0/弱模型 +11.9，deepseek 代理居中间）、真实后端会上传会话需 mock。与 P3 互补非替代——先让 P3 的 learnings 激活闭环跑一段真实数据再评估。随时可 `/skillopt-sleep dry-run`（mock 零花费）试管道 |

**结论**：P4 整体收掉，不作为独立迭代阶段。UTF-8 / PreCompact 跳过，SkillOpt-Sleep 标记为"随时可试 dry-run 的备选"。

### 明确不做（红线）

- **claude-mem**：与 context-mode 三层重叠（捕获/存储/检索），SessionStart 强塞 50 条索引反渐进披露
- **headroom 整体**：常驻代理 + 数百 MB 模型，工具输出已被 context-mode 压到 2%，净增量只在 history 侧
- **Trellis / ECC / reflect-system 原版**：AGPL 或刷量嫌疑或实现半残 + 中文无效；只借理念不整体装
- **planning-with-files 插件整体**：回合级 ~330 token 注入 + KV 缓存破坏风险；其 PreCompact 落盘理念经评估由 context-mode precompact.mjs 已覆盖，不另建（见 P4）

## 阶段验收标准汇总

| 阶段 | 完成标志 |
|------|---------|
| P0 | ✅ hooks 数量收敛；坏/孤儿 hook 清除；加密 hook 保留决策落文档 |
| P1 | ✅ 决策检查清单产出（31 项）+ ENGINEERING-PLAN 对照修订 |
| P2 | ✅ 证据槽收据规则生效（gates/verification/skill 三处落位） |
| P3 | ✅ SBA 三件套落位 dev-workflow 收尾 + learnings 头部标准 |
| P4 | ✅ 评估完成：UTF-8/PreCompact 跳过，SkillOpt-Sleep 备选 |

## 关联文档

- 调研报告：`skills/research/reports/harness-star-review/REPORT.md`（含 10 仓库 agents/ 原始评估）
- 北极星目标记忆：`~/.claude/projects/*/memory/harness-core-goals.md`
- 现有架构规划：[HARNESS-ENGINEERING-PLAN.md](HARNESS-ENGINEERING-PLAN.md)

---

**创建**：2026-08-13
**状态**：P0-P3 已执行，P4 已评估收掉（UTF-8/PreCompact 跳过，SkillOpt-Sleep 备选）。迭代主线完成，进入观察验证期。

**补充吸收（2026-08-13）**——来源：腾讯 TAB Harness 实战文章：
- P1 ✅ 新增 `/design` skill（技术方案产出，补"架构设计/功能设计"缺口，衔接 requirements→design→arch-review→dev-workflow）
- P2 ✅ `gates.md` 防自欺节加两行：连续打回 ≥3 次熔断暂停；下游不改上游、只提阻塞项
- 备选（等真实任务数据再评估）：软/硬门禁分级、门禁基线差集（B−A）

**补充吸收（2026-08-13 第二轮）**——来源：5 篇 AI Coding/Harness 文章（企业微信 Skill 94% / Harness 落地规范 / Vibe→AI 原生 / Graph Engineering / 老项目上下文）：
- ✅ `code-access.md` 加定位漏斗（意图消歧→模块定位→脚本搜索→调用链→确认）
- ✅ `learnings.md` 加漂移检测（被引用源变化→复核条目时效）
- ✅ `verification.md` 加落盘判定；`gates.md` 加红线分级 + 触发即停 + 工作图/角色图
- ✅ `/design` 加方案状态流转（draft/ready/done）；`dev-workflow` 加并行三把尺子
- 备选：audit 自检 skill（决策清单固化为打分审计，偏重，延后评估）