# Harness 精华萃取详细方案 — Brooks × OpenCLI 溶进策略树

> 版本 v2.4 超详细 | 前置 v2.3 可执行版已定 | 本版：展开全量证据表+逐文件diff+Token账+验收脚本，精华仍<70行/族，二线按需Read
> 北极星：高质量·省token·全链路·早下班·按需加载·中文

---

## 1. 现有策略树（萃取前）

```
用户说"开发XX" → /pipeline-executor（唯一入口，三模式 auto/review/manual）
 ├─ requirements（头脑风暴/质询）→ Gate
 ├─ design → Gate
 ├─ arch-review（.NET三问+爆炸半径，52行）→ 仅大方案
 ├─ development（/dev-workflow 并行派发）
 ├─ review（规模分级：<50 quick / 50-200×1对抗 / >200×2对抗 双轴Standards/Spec）→ Gate
 ├─ test（生成/执行）
 └─ verification-before-completion → done
       product_path → {product_path}/  active.json → .index.json

外围：
 research[联网重型]（SearXNG四层链，198行）↔ deep-analysis[离线]（102行）——调研双轨已立
 smart-search[搜索路由]（158行，限频AI1/非AI2）——独立路由
 knowledge-index 27行，harness-audit 7维审流程
```

**问题**：`review`只审规则/需求，不审概念完整性/深模块；`arch-review`只审方案不画依赖图；`harness-audit`审流程不给健康分；`research`搜全网但不分策略拿垂直源；`test`诊覆盖不诊脆性。

---

## 2. 萃取什么（精华卡，<40行/族）

### Brooks 精华卡（原4.5万→1页，<40行）→ `review/references/brooks-essence.md`

| 精华 | 来源 | 去哪 |
|------|------|------|
| **Iron Law 四段式**：Symptom→Source→Consequence→Remedy（每条必含） | `pr-review-guide:7` + `common:134` Report Template | `review` Findings模板 |
| **R1-R6/T1-T6 症状表**：见附录A全表 | `decay-risks:7` 272行 + `test-decay:7` 239行 | 同上 1表 |
| **Pain×Spread 优先级**：Pain1-3×Spread1-3=9分，intentional/accidental | `debt-guide:54` | `harness-audit` 债务维 |
| **HealthScore 加权**：Arch30/Debt25/PR25/Test20（无PR重分配40/33/27），Critical-15 | `health-guide:46` + `common:211` | `harness-audit` 健康分 |
| **Conceptual Integrity/Deep Module** | `source-coverage:2` Brooks/Martin | `arch-review` 认知模式 |

**丢**：12本书溯源英文、`sweep`自治迭代环、`onboarding`解说模式、`.brooks-lint.yaml`独立账本。

#### 附录A：R1-R6/T1-T6 全量精华表（溶进时按此1表check）

| Code | 症状一句话 | 在`pcs.webbackend`的典型 | 严重度默认 |
|------|------------|--------------------------|------------|
| **R1 认知过载** | 命名乱/嵌套深/函数>50行跨多模块 | `OrderService.cs:1200行 + 7层if` | Warning |
| **R2 变更传播** | 改1处牵N处，无深模块封装 | `Pricing`改动牵`Order/Voucher/Report` | Critical |
| **R3 知识重复** | 同逻辑3处拷贝，未抽深模块 | `Vue2`表单校验3处copy | Warning |
| **R4 偶发复杂度** | 为用而用框架，无简化 | `UseNpgsql`/`UseSqlServer`混用未收敛 | Suggestion |
| **R5 依赖错乱** | 循环/不稳定依赖/上游依赖实现 | `pcs.webbackend` Service互引 | Critical |
| **R6 领域失真** | 代码不贴业务，贫血模型 | `DTO`满`if status==1` | Warning |
| **T1 脆** | 改实现就崩 | `test`硬编码`DateTime.Now` | Warning |
| **T2 mock滥用** | 1测mock 5对象 | `xUnit`过度mock | Warning |
| **T3 覆盖幻觉** | 覆盖高但断言弱 | `Assert.True(true)` | Suggestion |
| **T4 慢** | 单测>1s/套件>5min | `E2E`全量跑10min | Suggestion |
| **T5 不可读** | 无Given-When-Then | `test` 200行无分段 | Suggestion |
| **T6 金字塔失真** | E2E多单元少 | `test`无金字塔 | Suggestion |

### OpenCLI 精华卡（原19k+25k→1页，<30行）→ `research/references/strategy-ladder.md`

| 精华 | 来源 | 去哪 |
|------|------|------|
| **策略梯子**：见附录B证据表 | `strategy-selection:65` 8885字 | `research` Layer0-2 选源 |
| **双层记忆**：`~/.opencli/sites/<site>/sitemap/` overlay + `endpoints/field-map/fixtures` | `site-memory:232` 10494字 | `research` 产物双写 |
| **Verify证据门禁**：`--trace`+`keep-tab`+`matches_n/match_level` | `browser:95` + `author:122` | `research` Layer2-3 校验 |
| **限频台账**：单题AI1/非AI2，第3次禁；跨agent共享`search-budget.json` | `smart-search:42` | `smart-search` 保留 |

**丢**：293行recipes/pitfalls、298行6步修复链+gh模板、259行ASCII图+50行runbook。

#### 附录B：策略梯子证据表（837 adapter 30天 2026-04-20~05-20）

| Strategy | 契约级别 | fixes/adapter-year | N | 选源优先级 | 实例 |
|----------|----------|--------------------|---|------------|------|
| `PUBLIC_API` | stable | **1.18** | 410 | 1首选 | 文档化API |
| `COOKIE_API` | stable | 2.01 | 89 | 2 | 官方web+cookie |
| `UI_SELECTOR` | visible-ui | 1.92 | 293 | 2平级 | a11y/semantic |
| `DOM_STATE` | visible-ui | 0.91 | 11 | 2平级（小样本） | hydration JSON |
| `PAGE_FETCH` | internal-unstable | **8.41** | 32 | 3末选 | 未文档化endpoint |
| `INTERCEPT` | internal-unstable | **8.69** | 9 | 3末选 | 拦截XHR签名 |

> 结论：能用契约层不用无契约层，`PAGE_FETCH/INTERCEPT`维护成本7-8倍；`UI_SELECTOR≈COOKIE`不是最漂的。`DOM_STATE`小样本待二期校正。

---

## 3. 优化后策略树（萃取后）

```
                    /pipeline-executor（唯一入口，不变）
                     ├─ requirements → Gate（Requirement Gate不可跳，auto亦禁）
                     ├─ design → Gate
                     │   └─ **新增健康分支**：大方案(>8文件/2类/跨模块) → 提示"Brooks快照？→ review --brooks"（可选，不阻塞）
                     ├─ development（/dev-workflow，不变）
                     ├─ **review（升级）**
                     │   ├─ <50 quick（不变）
                     │   ├─ 50-200 标准×1对抗（不变）
                     │   └─ >200 深度×2对抗 **+ Brooks快照**：R1-R6/T1-T2 6+2条快扫（cap3/维），Iron Law四段式追加（可选开关 --brooks）
                     ├─ test（不变，生成/执行）
                     │   └─ **新增脆性分支**：测试目录→ T1脆/T2 mock滥用快扫（harness-audit时）
                     ├─ **harness-audit（升级）**
                     │   ├─ 原7维审流程（不变）
                     │   └─ **新增代码健康分**：HealthScore四维加权 + Pain×Spread债务表，落 {product_path}/health.md
                     └─ verification → done
                           product_path 统一：{product_path}/brooks-*.md / health.md / opencli-artifacts/

外围（调研策略树优化）：
 smart-search（唯一搜索路由，保留158行，台账下沉跨agent）
   └─ research（联网重型，198行→ Layer0 PUBLIC / Layer1 COOKIE / Layer2 INTERCEPT 按梯子选源，trace verify）
        └─ deep-analysis（离线，102行，不变，只读不执行）
```

**决策表**：

| 输入 | 原策略 | 新策略 |
|------|--------|--------|
| `帮我审下PR 30行` | review quick | review quick（不变，不触发Brooks） |
| `审下PR 300行` | review 深度×2对抗 | review 深度×2对抗 **+ 可选 --brooks 快照**（用户说"十二原则/概念完整性"才加） |
| `发版前体检` | harness-audit 7维 | harness-audit 7维 **+ 健康分四维** |
| `联网调研Vue3` | research SearXNG Layer0-3 | research Layer0 PUBLIC→ Layer1 COOKIE→ Layer2 INTERCEPT 梯子选源+trace验 |
| `小仓PR` | 无健康分 | 无（按需，不预加载） |

---

## 4. 文件级施工清单（含逐文件diff）

### P0 萃取产物（20min）

| # | 产出 | 路径 | 行数 |
|---|------|------|------|
| 1 | Brooks精华卡 | `C:\Users\admin\.claude\skills\review\references\brooks-essence.md` | <40 表：附录A 1表+Iron Law+Pain×Spread |
| 2 | OpenCLI梯子卡 | `C:\Users\admin\.claude\skills\research\references\strategy-ladder.md` | <30 梯子+记忆+verify+限频+附录B |

### P1 溶进5主skill（30min，逐文件diff）

| # | 文件 | diff（+新增） |
|---|------|------|
| 1 | `C:\Users\admin\.claude\skills\review\SKILL.md` | `>200`段后 `+ 可选 --brooks：读brooks-essence.md快扫R1-R6/T1-T2，Findings按Iron Law四段式`；报告模板追加`+ Brooks段（可选）` |
| 2 | `C:\Users\admin\.claude\skills\arch-review\SKILL.md` | `Steps2`后 `+ 可选依赖图：Mermaid graph TD + classDef critical/warning/clean + Conway检查（读brooks-essence.md HealthScore段）` |
| 3 | `C:\Users\admin\.claude\skills\harness-audit\SKILL.md` | `7维`后 `+ 8. 代码健康分：HealthScore加权Arch30/Debt25/PR25/Test20 + Pain×Spread表，落{product_path}/health.md` |
| 4 | `C:\Users\admin\.claude\skills\research\SKILL.md` | 搜索链路 `Layer0-3` → `Layer0 PUBLIC → Layer1 COOKIE → Layer2 INTERCEPT 按strategy-ladder.md选源，--trace verify` |
| 5 | `C:\Users\admin\.claude\skills\smart-search\SKILL.md` | `site/query/count/status` 台账路径 `→ ~/.opencli/search-budget.json` 跨agent，research章节共享 |

### P2 归档原家族（10min）

| # | 动作 | 路径 |
|---|------|------|
| 1 | `mkdir skills/archive` | `C:\Users\admin\.claude\skills\archive\` |
| 2 | `move brooks-* (6) + opencli-adapter-author/autofix/browser/sitemap (4)` | 同上 |
| 3 | 保留 `smart-search/research/deep-analysis/review/arch-review/harness-audit` 5+2 | 主链路28不变 |
| 4 | `_shared/` 随brooks归档（精华已抽） | `archive/_shared/` |
| 5 | `skills/INDEX.md` 家族段改为"已溶：Brooks→review/arch-review/harness-audit；OpenCLI→research/smart-search（详见精华卡）" | |

---

## 5. Token账（实测 4B≈1Token）

| Skill | 改前行/字节/Token | 改后行/Token | 节省 |
|-------|-------------------|--------------|------|
| `review` | 177/—/— | 185/+8 | +8（+1精华引用） |
| `research` | 198/6930/1732 | 205/+30 | +30（+梯子引用） |
| `opencli-browser` | 293/18562/**4640** | 112/**~700**（Recipes已移） | **-3940** |
| `opencli-autofix` | 298/12928/**3232** | 120/**~850** | **-2382** |
| `opencli-adapter-author` | 259/23418/**5854** | 147/**~1100** | **-4754** |
| `brooks-* 6` | 均44/≈2k + _shared 4.5万 (~11k) | 0（归档，按需Read） | **-11k**预加载 |
| **合计预加载** | **~19k +11k=30k** | **~4k** | **-26k（-87%）** |

> 精华卡<70行仅在`--brooks`或`research`时按需Read，冷启动不计。

---

## 6. 验收（可执行脚本）

```powershell
# 1. 11原家族0个一级
Get-ChildItem C:\Users\admin\.claude\skills\brooks-*,C:\Users\admin\.claude\skills\opencli-adapter* | Measure-Object | % Count # 期望 0
# 2. 说十二原则只进review
Select-String -Path C:\Users\admin\.claude\skills\*\SKILL.md -Pattern "十二原则" | Select Path # 期望仅 review
# 3. >200 PR可选Brooks
Select-String -Path C:\Users\admin\.claude\skills\review\SKILL.md -Pattern "--brooks" | Measure-Object # 期望 1
# 4. 健康分可追溯
Select-String -Path C:\Users\admin\.claude\skills\harness-audit\SKILL.md -Pattern "health\.md" | Measure-Object # 期望 1
# 5. 调研按梯子
Select-String -Path C:\Users\admin\.claude\skills\research\SKILL.md -Pattern "strategy-ladder" | Measure-Object # 期望 1
# 6. 无超长
Get-ChildItem C:\Users\admin\.claude\skills\*\SKILL.md | Where-Object {(Get-Content $_.FullName | Measure-Object -Line).Lines -gt 150} | Measure-Object # 期望 0
```

---

## 7. 执行顺序与风险

```
P0 精华卡 → P1 溶进5主 → P2 归档 → 验收（6脚本）
```

风险：精华卡<40行需压200+页英文→只保留附录A/B表+公式，12本书溯源删，首次按需Read；`legacy-friendly`三档暂不溶，待老库分期再补。

---

> 更新：2026-08-20 v2.4 超详细（展开证据表+diff+Token账）  关联 v2.3可执行 + v2.2二层化 + v2.1单入口
