# 宪法（Harness 宪法）

> **定位**：一页收口全文的不可违背原则。按需加载，不每次注入。谁违反，谁返工。
> **关联**：`rules/quality/gates.md` 5门禁 + `quality/checklist.md` 10行自检 + `workflows/task-management.md`

## 宪法三禁（做之前先过）

1. **不猜需求** — 模糊词（优化/最好/合适）或缺范围/验收，必须先澄清再动（见 question-bank 5阶段）。
2. **不硬上复杂度** — 能用现有模块/简单方案解决的，不新造抽象；非加不可的写例外理由。
3. **不带病过门禁** — 无新鲜验证证据（build 0 / test 0）不许宣称完成，下游不改上游。

## 宪法三必须（做完必有）

1. **意图先行** — 复杂/多人/高改动需求，先写半页 `intent`（约束/非目标/安全各1行，见 requirements intent 模板）。
2. **产物落盘** — 需求/设计/代码/测试每阶段产物写入 `active.json` 的 `product_path`，阶段结束即提 Gate。
3. **证据收口** — 完成声明附 6槽收据：action/result/scope/uncovered/residual/confidence。

## 三 Gates（编译期挡返工）

| Gate | 拦什么 | 过不了怎么办 |
|------|--------|-------------|
| Simplicity | 不必要抽象/过度设计 | 删抽象或写 Complexity Tracking 例外 |
| Anti-Abstraction | 重复造已有能力 | 复用现有或说明为何不能复用 |
| Integration-First | 不可集成/不可验证 | 补集成路径与验证命令 |

> 例外：确需复杂度时，在 Design 阶段 `Complexity Tracking` 一节写“为什么必须+代价+回退”。

## 违宪处理

- 任一 Gate 未过 → Design Gate 打回。
- 连续打回 ≥3 次 → 熔断，人工介入（见 gates.md 铁律）。
