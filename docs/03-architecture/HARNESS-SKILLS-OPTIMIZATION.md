# Harness 技能优化方案

> 阶段：v2.1 技能层收口 | 前置：`HARNESS-OPTIMIZATION-DETAILED.md v2.0` 已完成（单协议·单入口·索引瘦身）
> 目标：39→28 一级对外，零超长主文件，触发词零重叠，家族层级化
> 原则：对外少入口 · 内部多能力 · 索引只导航 · 家族不平铺

---

## 1. 诊断

| 问题 | 证据 | 影响 |
|------|------|------|
| **审查三重** | `review 131行` 已含规模分级（50-200×1子代理/>200×2对抗），`parallel-review 33行` 被覆盖，`brooks-review 30行` 同抢 `review` | 说"审查"三选一 |
| **调研三重** | `research 148` 联网 / `smart-search 108` 路由 / `deep-analysis 66` 纯分析 | 说"调研"三选一 |
| **家族平铺** | `brooks×6` + `opencli×5` =11 个一级 | 心智负担最大 |
| **超长 8 个** | `adapter-author 221`/`autofix 215`/`browser 211`/`debugging 190`/`manager 167`/`research 148`/`review 131`/`usage 122` | 主文件承载教程，违背渐进披露 |
| **过薄 3 个** | `arch-review 37`/`docs 50`/`_shared 0` | 高质量环节缺保障，孤儿目录 |
| **索引 1 个** | `knowledge-index 73行` | 导航不应超 40 行 |

---

## 2. 目标分层

| 层 | 成员 | 数量 | 说明 |
|----|------|------|------|
| **一级对外** | `requirements`/`design`/`pipeline-executor★`/`review`/`test`/`systematic-debugging`/`verification`/`commit`/`sync`/`arch-review`/`perf-tune`/`sql-best`/`docs`/`research` 等 | 28 | 用户可直接触发 |
| **内部能力** | `dev-pipeline`/`dev-workflow`/`parallel-review` | 3 | 由 `pipeline-executor`/`review` 内部调度 |
| **侧挂能力** | `brooks-*` 单项/`opencli-*` 子能力/`smart-search`→`search-router` | 5+ | 由 `brooks-health`/`opencli-usage` 统一入口 |
| **元能力** | `harness-*`/`skill-manager`/`knowledge-index`/`save-memory` | 6 | 维护态，末尾分组 |

---

## 3. 施工清单

### P0-1 审查收口

| # | 文件 | 改动 |
|---|------|------|
| 1 | `skills/parallel-review/SKILL.md` | 头部加 `> 已内化：由 review 按规模自动调度，不直接对外`；description 改 `已内化→见 review` |
| 2 | `skills/review/SKILL.md` | 补充"规模分级已含 parallel-review 逻辑"说明，明确 `>100行` 边界由本 skill 自动判断 |
| 3 | `skills/brooks-review/SKILL.md` | description 触发词改 `brooks审查/十二原则审查`，去 `review` 泛词 |
| 4 | `skills/INDEX.md` | 审查阶段只留 `review`，`parallel-review`/`brooks-review` 移入子行 `内部/侧挂` 注释 |
| 5 | `knowledge/rules/quality/review-checklist.md` | 补充 review 规模分级引用 |

### P0-2 家族层级化

| # | 文件 | 改动 |
|---|------|------|
| 1 | `skills/INDEX.md` | 新增分组：`Brooks 家族` 单独段，`brooks-health★总入口（一键体检）→ audit/debt/review/test 单项`，`sweep=health+自动修复` |
| 2 | `skills/INDEX.md` | `OpenCLI 家族` 单独段，只留 `opencli-usage★入口`，其余 4 个标 `内部：由 usage 调度` |
| 3 | `skills/brooks-*/SKILL.md` (4个) | description 统一加 `brooks` 前缀，`Do NOT trigger` 保留防误触 |
| 4 | `skills/opencli-usage/SKILL.md` | 补充"家族入口：adapter-author/autofix/browser/sitemap 由本 skill 路由" |
| 5 | `skills/smart-search/SKILL.md` | description 触发词改 `search-router/搜索路由`，去 `调研` 泛词；INDEX 中标 `research 前置` |

### P0-3 调研边界

| # | 文件 | 改动 |
|---|------|------|
| 1 | `skills/research/SKILL.md` | description 补 `联网多agent深度调研`，与 deep-analysis 区分 |
| 2 | `skills/deep-analysis/SKILL.md` | description 补 `基于已有材料不联网·对比矩阵` |
| 3 | `skills/INDEX.md` | 需求/调研段补充括号说明：`research(联网重型)` / `deep-analysis(离线分析)` |

### P1-1 超长瘦身（主文件压 120 内）

| Skill | 现行 | 目标 | 动作 |
|-------|------|------|------|
| `opencli-adapter-author 221` | 221 | <120 | 表格/模板移 `references/`，主文件只留路由+输入输出 |
| `opencli-autofix 215` | 215 | <80 | 同上，收为 adapter 子流程 |
| `opencli-browser 211` | 211 | <120 | 命令参考已在 `references/command-reference.md`，主文件删重复 |
| `systematic-debugging 190` | 190 | <120 | 故障模式/安全扫描移 refs，主文件只留三阶段流程 |
| `research 148` | 148 | <120 | 三档模式/19语言/数据源表格移 `references/modes.md` |
| `review 131` | 131 | <120 | checklist 明细移 refs，主文件只留规模分级+路由 |
| `opencli-usage 122` | 122 | <100 | 家族地图精简，只留入口路由表 |
| `knowledge-index 73` | 73 | <40 | 删解释段落，只留 `分类|索引|说明` |

> 检验：`Get-ChildItem skills/*/SKILL.md | Measure Lines` 无 >120

### P1-2 过薄补强

| # | 文件 | 改动 |
|---|------|------|
| 1 | `skills/arch-review/SKILL.md 37` | 若保持独立则补 `输入(设计文档)→输出(评审报告)` 契约+Gate 关联；或在 `pipeline-executor` 设计阶段后加 `大方案自动触发 arch-review` |
| 2 | `skills/docs/SKILL.md 50` | 补充 `从 {product_path}/requirements.md + design.md 自动生成` 链路，打通 pipeline 产物 |
| 3 | `skills/requirements/SKILL.md 71` | 增加 `quick` 轻量分支：`我有个想法帮我梳理→快速讨论不建 Task`，与重型 `需求清单+Task Contract` 区分 |
| 4 | `skills/_shared/` | 0行孤儿，删除或补 `README.md` 说明共享片段用途 |

---

## 4. 验收

| # | 标准 | 验证 |
|---|------|------|
| 1 | 说"审查"只进 `review` | `grep description.*review` 仅 review 含泛词，brooks 含前缀 |
| 2 | 说"调研"按需分流 | `research` 含 `联网`，`deep-analysis` 含 `不联网`，`smart-search` 不含 `调研` |
| 3 | Brooks/OpenCLI 不平铺 | `skills/INDEX.md` 家族独立段，`health/usage` 标 ★ |
| 4 | 无超长主文件 | `SKILL.md >120行` 0 个 |
| 5 | 索引只导航 | `knowledge-index` <40 行 |
| 6 | 薄技能补强 | `arch-review` 有输入输出契约或被 pipeline 自动触发 |

---

## 5. 执行顺序

```
P0-1 审查 → P0-2 家族 → P0-3 调研边界 → 验收触发词
→ P1-1 超长瘦身 → P1-2 补强 → 最终验收
```

---

## 6. 关联

- 前置：`HARNESS-OPTIMIZATION-DETAILED.md v2.0`（协议·入口·索引）
- 本阶段：技能层收口（家族·重叠·超长·薄弱）
- 产物：`skills/INDEX.md` 为单一导航真源

> 更新：2026-08-20 v2.1 新增
