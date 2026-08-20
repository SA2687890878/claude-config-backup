# Harness 融合改进详细方案 — Brooks × OpenCLI 二层化

> 版本 v2.2 | 前置 v2.1（单入口·单协议·家族初分组）已完成 | 本阶段：二层化+中文门面+主链路挂点+超长瘦身
> 北极星不变：高质量·省 token·全链路·早下班·按需加载

---

## 1. 两大家族在解决什么（穿透体检结论）

### Brooks 家族（6 技能 + _shared 共享框架）

| 技能 | 职责 | 输入→输出 | 英文触发现状 |
|------|------|-----------|--------------|
| `brooks-audit` 34行 | 架构CT：模块依赖图(Mermaid)、分层违背、循环引用 | 目录/文件→依赖图+分层报告 | `does this follow clean architecture?` |
| `brooks-debt` 28行 | 债务CT：Pain×Spread 优先级、重构路线 | 代码库→债务清单P0-P3 | `why is this so hard to change?` |
| `brooks-test` 29行 | 测试CT：脆/ mock滥用/覆盖幻觉/慢 | 测试目录→测试坏味道报告 | `tests keep breaking` |
| `brooks-review` 30行 | PR审查：Symptom→Source→Consequence→Remedy | diff/文件→PR报告 | `does this look right?` |
| `brooks-health` 30行 | 一键体检：四维度加权 Health Score | 项目→Dashboard | `how healthy is this codebase?` |
| `brooks-sweep` 32行 | 体检+自动修复（安全改自动，风险改确认） | 项目→Fix diff+残留报告 | `fix everything` |
| `_shared/` 6文件 4.5万行 | 共享框架：Iron Law、decay-risks、source-coverage、Health Score | — | 全英文 |

**层级**：`health = audit+debt+review+test` 聚合；`sweep = health+fix`。Iron Law：先诊断后修复，每条发现必含四段式。

**与现有重叠**：`review(131行, .NET规则)` vs `brooks-review(哲学)` 互补；`test` vs `brooks-test` 互补；`arch-review(52行)` vs `brooks-audit` 部分重叠（前者 .NET三问+爆炸半径，后者 12本书分层）。

### OpenCLI 家族（5 技能 + smart-search/research 协作）

| 技能 | 职责 | 超长原因 | 触发 |
|------|------|----------|------|
| `opencli-usage` 122行 | 顶层地图：100+站、strategy(PUBLIC/COOKIE/INTERCEPT/UI/LOCAL)、通用flag | 全量站点说明+doctor表 | `opencli` |
| `opencli-browser` 211行 | 驱动真 Chrome：open/state/click/type/extract，session/bind 模型 | session生命周期+信封结构+错误码 | `浏览器操作` |
| `opencli-browser-sitemap` 66行 | Sitemap 懒加载巡航 | — | `sitemap` |
| `opencli-adapter-author` 221行 | 为新站写 adapter：strategy决策→verify闭环 | 6种strategy+证据链+trace | `adapter` |
| `opencli-autofix` 215行 | 适配器坏了自动修：trace→patch→retry | 3种失败模式+重试矩阵 | `opencli报错` |
| `smart-search` 108行 | 搜索路由：话题→最佳 opencli 源，含限频台账 | 路由+预算+汇报 | `搜索路由` |
| `research` 198行 | 联网重型调研：SearXNG+SearX+Scrapling 四层链路 | 三档模式+qa | `联网调研` |

**协作链**：`research/smart-search → opencli list -f json → opencli <site> -h → opencli <site> <cmd> -f json`。超长因把策略/证据/窗口模型全塞主文件。

---

## 2. 现状诊断（为什么要融）

| 痛点 | 证据 | 影响 |
|------|------|------|
| **平铺 11 个一级** | `skills/INDEX.md` 曾 11 行平铺，`_shared` 被误判孤儿 | 说"审查/体检"路由抖动，索引污染 |
| **全英文门面** | `Brooks-Lint — Architecture Audit` / `Drive a real Chrome window` | 违背全局中文原则，新人看不懂 |
| **超长 6 个** | `adapter-author 221`/`autofix 215`/`browser 211`/`research 198`/`review 131`/`usage 122` | 主文件当教程，token 浪费 |
| **无主链路挂点** | `brooks` 未挂 `pipeline` Gate，`opencli` 未挂 `research` | 侧挂闲置，价值不显 |
| **触发词泛化** | `audit/test/review` 英文泛词易误触 infra 健康检查 | 误命中率高 |

**已完成**：v2.1 已收为 `health★/usage★` 单入口，家族段注释，`research[联网重型]/deep-analysis[离线]` 边界已立。

---

## 3. 目标架构

### 3.1 分层

| 层 | 成员 | 对外可见 | 加载时机 |
|----|------|----------|----------|
| L1 主链路 | `requirements/design/pipeline-executor/review/test/...` 28个 | ★一级 | 日常每次 |
| L2 深度能力 | `brooks-health★` 单入口，`audit/debt/test/review/sweep` 为子模式 | 家族段内 | 大重构/发版体检时 |
| L3 基础设施 | `opencli-usage★` 单入口，`browser/adapter-*` 为子能力；`research` 内部调 `opencli` | 家族段内 | 联网调研时 |
| L0 共享 | `_shared/` 6文件 | 不可见 | brooks 调度时按需读 |

### 3.2 中文门面

| 原英文 | 中文别名（新增触发） |
|--------|----------------------|
| `Architecture audit` | `brooks体检/架构体检/依赖体检` |
| `Tech debt assessment` | `债务盘点/重构路线` |
| `Test quality review` | `测试体检/脆测试` |
| `PR code review` | `brooks审查/十二原则审查` |
| `Combined health dashboard` | `一键体检/健康分` |
| `Full-sweep` | `一键修复/扫一遍` |
| `Drive a real Chrome` | `浏览器操作/真机操作` |
| `Write OpenCLI adapters` | `写适配器/新站接入` |

### 3.3 主链路挂点

```
pipeline-executor 设计后
  ├─ 小方案 → arch-review(52行, .NET三问)
  └─ 大方案(>8文件/2类) → 提示"需 Brooks 深度？→ /brooks-audit"

review 完成 >200行
  └─ 报告末尾追加"需十二原则复核？→ /brooks-review"

research 启动
  └─ 内部先 opencli list -f json → opencli <site> -h → 执行（对用户透明）

harness-audit
  └─ 调 brooks-health 取 Health Score 作体检证据
```

### 3.4 Token 策略

- 主文件压 120 内：策略/表格/模板全移 `references/`，主文件只留路由+输入输出+挂点
- _shared 4.5万行不进主文件，按需 `../_shared/common.md` 四步读
- L2/L3 不预加载，INDEX 家族段仅一行注释，不占冷启动

---

## 4. 施工清单

### P0 中文门面 + 挂点（30min）

| # | 文件 | 改动 |
|---|------|------|
| 1 | `skills/brooks-*/SKILL.md` ×6 | description 首行加 `[Brooks 十二原则]` 中文别名，触发词补中文（见 3.2） |
| 2 | `skills/opencli-*/SKILL.md` ×5 | description 首行加 `[内部]` 前缀（已做 usage 除外），触发词补中文别名 |
| 3 | `skills/pipeline-executor/SKILL.md` | 设计阶段后加分支：大方案提示 `→ /brooks-audit` |
| 4 | `skills/review/SKILL.md` | 报告模板末尾加"需 Brooks 复核？→ /brooks-review" 可选段 |
| 5 | `skills/research/SKILL.md` | 内部链路注明"对用户透明，内部调 opencli" |
| 6 | `skills/harness-audit/SKILL.md` | 体检时调 `brooks-health` 取分作证据 |

### P1 超长瘦身（主文件<120，40min）

| 技能 | 现行 | 动作 |
|------|------|------|
| `opencli-adapter-author 221` | 表格+证据链移 `references/adapter-strategy.md` |
| `opencli-autofix 215` | 失败矩阵移 `references/fix-matrix.md` |
| `opencli-browser 211` | session/bind 模型移 `references/session-lifecycle.md` |
| `research 198` | 三档模式/数据源移 `references/modes.md` |
| `review 131` | checklist 明细移 refs（已 12 个） |
| `opencli-usage 122` | 站点全表删，只留 `opencli list` 指令 |
| `systematic-debugging 190` | 已有 5refs，再压主文件删重复 |
| `skill-manager 167` | 标维护态，删示例 |

检验：`Get-ChildItem skills/*/SKILL.md | where Lines>120` 0 个

### P2 说明补强（15min）

| # | 文件 | 改动 |
|---|------|------|
| 1 | `skills/_shared/README.md` | 已建，保留 |
| 2 | `skills/knowledge-index/SKILL.md` | 已 98→27 行，保留 |
| 3 | `docs/INDEX.md` | 已注册双方案，追加本方案 |

---

## 5. 验收

| # | 标准 | 验证 |
|---|------|------|
| 1 | 说"体检"只进 `brooks-health` | `grep description.*体检` 仅 health 含泛词 |
| 2 | 说"调研"不进 opencli | `opencli-*` description 含 `[内部]` |
| 3 | 大方案有挂点 | `pipeline-executor` 含 `brooks-audit` 分支 |
| 4 | 无超长 | `SKILL.md>120` 0 个 |
| 5 | 中文可用 | `brooks体检/一键体检/浏览器操作` 触发 |
| 6 | Token | 冷启动仍 77+按需，_shared 不预加载 |

---

## 6. 执行顺序与风险

```
P0 中文+挂点 → 验收触发词
→ P1 瘦身 → 验收无超长
→ P2 说明
```

风险：Brooks 全英文共享框架翻译成本高→不翻译框架，只加中文门面，框架按需读。

---

## 7. 关联

- 前置：`HARNESS-OPTIMIZATION-DETAILED.md v2.0` + `HARNESS-SKILLS-OPTIMIZATION.md v2.1`
- 本阶段：家族二层化
- 索引真源：`skills/INDEX.md`

> 更新：2026-08-20 v2.2 家族融合
