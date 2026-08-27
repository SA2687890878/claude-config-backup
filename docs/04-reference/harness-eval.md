# Harness 评测三件套（P0 落地）

> 用途：让 Harness 体系自己可被度量、可进化（"评测→记忆→落地→控制"飞轮的**评测齿**）。
> 原则：**不进日常 prompt、不改主流程**；需要时手动/事件触发跑，省 token。

---

## 1. 门禁可执行化 — `scripts/eval-gates.mjs`

把 5 道门禁（requirement/design/code/test/release）中"可自动断言"的检查项变成脚本，复用"退出码为王"。

```bash
node scripts/eval-gates.mjs <gate|all> --dir <项目目录> [--run-build] [--report <审查报告>] ...
```

- **退出码**：`0` 全部自动项 PASS（放行）· `1` 有 FAIL（阻断，回对应阶段修）· `2` 自动项过了但有人工项（SKIP 必须人审）· `3` 用法错
- 自动项示例：需求文档含验收/边界、无模糊措辞；csproj 存在、无硬编码密钥、dotnet build/test 退出码；审计报告无 CRITICAL/HIGH、CHANGELOG 更新
- **SKIP(manual) 不假装自动化**：脚本显式列出必须人审的项
- 接入：pipeline-executor 各门禁阶段调用对应 gate

## 2. 元评测 Judge — `scripts/judge.mjs`

给 Harness 产出打分（**正确性/规范性/简洁性** 三维独立），结果带 evidence 溯源。

```bash
node scripts/judge.mjs score <file>                    # 单文件打分
node scripts/judge.mjs batch <dir> --ext .md --limit 50 # 批量，报告→evals/judge-report.jsonl
node scripts/judge.mjs check [meta-eval.jsonl] --threshold 90  # 校准评测集（judge 自身准不准）
```

- **触发**：仅 `knowledge/**` + `skills/**` + `learnings.md` + `CLAUDE.md` 变更后手动/CI 跑
- **上岗门槛**：meta-eval 准确率 > 90% 才认为 judge 可信；月人工抽 5 条复核
- 依赖环境变量：`ANTHROPIC_AUTH_TOKEN` / `ANTHROPIC_BASE_URL` / `JUDGE_MODEL`(可选)

## 3. 黄金对齐集 — `evals/golden-align.jsonl`

10 题（用户高频场景的黄金答案要点 + 检查点 + 漂移信号）。**月跑一次，偏 >1 题告警**。

防"对齐漂移"：每步评测分上涨但百步累积偏离人类意图（如奖励详细 → 越来越啰嗦）。技术门控只查局部回归，这个查全局方向。

## 数据集

| 文件 | 内容 | 用途 |
|------|------|------|
| `evals/meta-eval.jsonl` | 20 条（10 正 + 10 负），覆盖格式对逻辑错 / 逻辑对但啰嗦 / 假证据 / 空话等边界 | 评测 judge 本身是否可靠 |
| `evals/golden-align.jsonl` | 10 题黄金对齐 | 月跑防漂移 |

## 不过度原则

- judge 只在上述 4 类文件变更时跑，不进日常 prompt
- eval-gates 只在流水线门禁 / 发布时跑
- golden-align 月一次
- **刻意不做**：全量向量库、每回合 Judge、重型多 Agent 编排、模型微调（都违背省 token）
