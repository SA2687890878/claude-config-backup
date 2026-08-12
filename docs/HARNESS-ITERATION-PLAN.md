# Harness 迭代升级计划

> 基于 GitHub 收藏仓库深度调研（2026-08-13）得出的迭代升级路线。
> 上游调研报告：`skills/research/reports/harness-star-review/REPORT.md`

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

## 调研结论摘要（10 仓库）

| 仓库 | verdict | 对 harness 的意义 |
|------|---------|------------------|
| skill-based-architecture | ⭐ 4/4 | 经验→规则→skill 激活闭环 |
| planning-with-files | ⭐ 4/4 | 计划持久化 + 崩溃恢复 |
| SkillOpt-Sleep | ✅ 3/4 | 验证门禁自动优化 skill |
| Aegis | ✅ 2.5/4 | 证据槽标准化验证 |
| Trellis | ✅ 2/4 | per-turn 状态注入（AGPL 借理念） |
| claude-mem | ⚪ 2/4 | 与 context-mode 三层重叠，仅自动注入增量 |
| claude-reflect-system | ⚪ 2/4 | 理念好但实现半残+不支持中文 |
| headroom | ⚪ 1/4 | 直省 Token，增量在 history 压缩 |
| claude-code-book | ⚪ 1/4 | 架构认知（零成本，备读） |
| ECC | ⚪ 1/4 | 蓝图分层，star 数不可信，不整体装 |

## 迭代升级计划

### 阶段 1：learnings 激活闭环（主，明天先做）

**目标**：解决"经验沉淀后不被激活、同类 bug 再踩"。

**做法**：把 skill-based-architecture 的 rule-update 流程复刻成自建机制，接入 dev-workflow 收尾环节：
- **Recording Threshold（2/3 门槛）**：只有满足 可重复 / 代价高 / 代码看不出 中 ≥2 条的经验才值得沉淀 → 写入 learnings.md
- **verified-failure 直写**：故障红转绿后，教训直写最近的规则 owner（`rules/*.md` 或对应 skill），并立即激活，不等重复发生
- **activate 校验**：每条经验必须落在任务路径上改变下一步动作；同根因再犯 → 触发"激活修复或升级为机器门禁"
- 落点：项目级 `learnings.md` + 全局 `~/.claude/memory/learnings.md` 的现有机制之上，加"激活"环节

**验收**：一次真实的"纠错→下次行为改变"闭环跑通。

### 阶段 2：计划持久化试点（次）

**目标**：dev-workflow 的计划不再随 /clear 或压缩丢失。

**做法**：装 planning-with-files（plugin 路线），与 dev-workflow 接缝：
1. `/plugin marketplace add OthmanAdi/planning-with-files` + `/plugin install`（必须 plugin 路线，skill-only 静默无钩子）
2. 跑 `/plan-doctor` 验证三项 PASS
3. dev-workflow 计划模板输出对齐 `### Phase N` + 英文 Status token
4. 划清与 task-state.md 职责（激活任务归三文件，归档走 task-management）
5. ⚠️ **先实测**：deepseek 代理下回合级注入对 KV 缓存的影响，必要时 `PWF_INJECT=smart`

**验收**：`/clear` 后能恢复计划。

### 阶段 3：SkillOpt-Sleep 试点（可选）

**目标**：让 skill 文案优化也自动化。

**做法**：官方 Claude Code 插件，先 `/skillopt-sleep dry-run`（mock 零花费）验证管道 → `--backend handoff` 小规模试跑 → 检查 report.md 后手动 adopt。

**验收**：1 个自建 skill 文案被门禁验证地改进。

### 暂缓 / 不装

- **ECC / Trellis 整体**：借理念（五类分层 / per-turn 注入 / UTF-8 hook 模板 / 子代理上下文预算），不整体装
- **claude-mem**：与 context-mode 三层重复，除非明确痛点是"自动注入"
- **headroom**：工具输出已被 context-mode 压到 2%，仅当长会话 history 成为瓶颈再考虑
- **claude-reflect-system**：理念可抄（Stop hook 纠错回写），但需补中文正则 + 修复 auto 模式 EOF 缺陷，优先级低于阶段 1

## 关联文档

- 调研报告：`skills/research/reports/harness-star-review/REPORT.md`（含 10 仓库 agents/ 原始评估）
- 北极星目标记忆：`~/.claude/projects/*/memory/harness-core-goals.md`
- 现有规划：[HARNESS-ENGINEERING-PLAN.md](HARNESS-ENGINEERING-PLAN.md)

---

**创建**：2026-08-13
**状态**：待落地（阶段 1 优先）
