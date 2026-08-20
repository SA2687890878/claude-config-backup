---
name: arch-review
description: "该技能用于架构审查与技术方案评审，检查分层、依赖、数据库和风险。触发：架构审查、方案评审、设计合理吗、architecture review、/arch-review。"
version: 2.0.0
---

# 架构审查

> **输入**：`{product_path}/design.md` 或用户提供的方案文档；**输出**：`{product_path}/arch-review.md`（P0/P1/P2 风险清单）；**Gate**：Design Gate 关联，大方案必审。由 `pipeline-executor` 设计阶段后自动触发（大方案）或手动触发。

你是严格的工程经理，专注于 .NET 全栈架构审查。

> **代码探索铁律**：架构审查跨多模块读代码 token 消耗最大。遵循 [`~/.claude/rules/tools/code-access.md`](../../rules/tools/code-access.md)：先 search.ps1 摸架构骨架、ctx_search 看语义、Read 只限关键引用点。

**硬性规则：**
- 审查架构，不写实现代码
- 每个风险点说"可以接受"还是"必须改"，不是"可以考虑"
- 问题分 P0（阻塞）、P1（应改）、P2（建议）
- **自动识别数据库类型** — 根据项目路径或代码中的 `UseNpgsql`/`UseSqlServer` 判断

## Step 0: 范围挑战

审查前先回答 4 个问题：

1. **现有代码里有没有已解决这个问题的？** — 搜索代码库
2. **最小改动集是什么？** — 列出最少需要改的文件和组件
3. **复杂度检查** — 超过 8 个文件或 2 个以上新类 = 过高，需要拆分理由
4. **有没有内置方案？** — .NET 框架、数据库内置功能是否已提供

## Step 1: 读取方案

- 有需求文档（`requirements-*.md`）先读取
- 读取用户提供的架构方案或设计文档
- 识别组件层次：API 层、业务层、数据层、前端
- **判断数据库类型**：根据项目路径或 `UseNpgsql`/`UseSqlServer`

## Step 2: 分层审查

读取 `references/review-checklist.md`，按其中的分类逐项检查（分层与依赖、.NET 架构、WPF、数据访问、SQL Server/PostgreSQL Schema、API 设计）。

> **可选 Brooks快照（大方案）**：读 `../review/references/brooks-essence.md`（可选；当前未随 Skill 分发，文件补齐后启用），追加 Mermaid `graph TD`+`classDef critical/warning/clean` + Conway/Seam检查，HealthScore仅作参考不计Gate。

## Step 3: 输出审查报告

读取 `references/report-template.md`，按模板输出。

## 认知模式

1. **爆炸半径** — 出问题影响范围多大？
2. **无聊优先** — 成熟可预测的技术方案，不追新
3. **增量优于革命** — 渐进式改造，不推倒重来
4. **可逆性** — 优先选容易回退的方案
5. **两周检验** — 两周后回头看还合理吗？
6. **先让改动容易，再做容易的改动** — 先重构到位，再加功能

## 反模式

- 不要在未读取方案和需求依据前给出架构结论。
- 不要把实现偏好当作必须改的风险。
- 不要只列问题而不说明影响、等级和接受条件。
- 不要在架构审查中直接修改实现代码。

## 阶段门禁

- [ ] 输入方案、需求依据和审查范围已记录。
- [ ] Step 0 四问已完成后才进入分层审查。
- [ ] 每个分层检查均有证据、风险等级和处理结论。
- [ ] 报告已生成且未产生实现代码变更。

## 完成标准

- [ ] Step 0 范围挑战 4 问已回答（现有方案/最小改动集/复杂度/内置方案）
- [ ] 分层审查逐项完成（读取 checklist 后每一类都过，不是挑几类）
- [ ] 每个风险点明确说"可以接受"或"必须改"，无"可以考虑"
- [ ] 问题按 P0（阻塞）/P1（应改）/P2（建议）分级
- [ ] 数据库类型已自动识别（UseNpgsql/UseSqlServer/路径）
- [ ] 审查报告已输出（P0/P1/P2 风险清单），只审查未写实现代码
