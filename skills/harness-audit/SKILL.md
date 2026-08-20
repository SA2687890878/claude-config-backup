---
name: harness-audit
description: "该技能用于审计 Harness 规则、Skills、MCP、流程门禁和工程规范，并输出分级问题。触发：Harness 体检、体系审计、技能库体检、规范检查、audit harness、/harness-audit。"
version: 1.0.0
---

# Harness 审计

> 来源:腾讯《驾驭AI Coding:一份面向团队的Harness Engineering落地规范》的
> harness-audit 实践——"规范写完容易、执行下去难",本 skill 把规范固化成可执行体检。
> 只读审计,不修改任何文件;问题清单交主会话决策修复。

## 触发

- 季度例行体检(推荐)
- skill/规则大版本升级后
- 感觉体系"不管用"或 token 消耗异常时

## 审计维度(7 项)

| # | 维度 | 检查什么 |
|---|------|---------|
| 1 | 规则根(AGENTS.md/根文件) | 是否渐进式披露(根文件 ~100 行索引,细节按需读);有无超长文件该拆 |
| 2 | Rules | 是否被 skill 实际引用;有无过时/冲突规则;红线是否可执行(不是口号) |
| 3 | Skills | description 触发是否准确;有无职责混杂/孤儿文件/重复 skill;引用是否断链 |
| 4 | MCP/工具 | 是否过度接入;低频 MCP 是否该砍;工具输出是否浪费 token(原始 JSON vs 摘要) |
| 5 | 流程门禁 | pipeline-phases 各 Gate 是否被跳过;落盘判定是否执行;提交是否有证据 |
| 6 | 工程规范 | DB 变更四级分级、commit 格式、代码红线是否一致落地 |
| 7 | Commit 质量 | 有无 "update"/"fix bug" 模糊提交;commit-msg hook 是否配置 |

## 流程

1. 读 `~/.claude/skills/` 目录清单,统计 skill 数
2. 机器检查:frontmatter 合法性、references 断链、孤儿文件、超长 SKILL.md(>500 行)
3. 抽查 3-5 个核心 skill(pipeline-phases/requirements/review 等)的引用与描述质量
4. 检查规则库(`~/.claude/rules/`)与 knowledge 的引用关系
5. 逐维度打分 + 输出报告

## 新增第8维（可选，不计总体）

**8. 代码健康分**：如文件存在则读 `../review/references/brooks-essence.md`，按 `HealthScore Arch30/Debt25/PR25/Test20 + Pain×Spread表` 快算；文件缺失时跳过并记录未覆盖项，落 `{product_path}/health.md` 仅作参考，由 `active.json` 关联。

## 打分与输出

每维度 S/A/B/C/D,总体取加权;输出:

```markdown
## Harness 体检报告
### 总体评级: [S/A/B/C/D]
### 维度得分
| 维度 | 得分 | 主要问题 |
### P0 问题(必改,影响工作质量)
### P1 问题(该改,影响效率)
### Quick Wins(低投入高回报,每条标注预计耗时)
### 上次体检遗留(如有)
```

## 约束

- 只读审计,不修改任何文件
- 结论必须带证据(文件路径/行号/计数),不凭印象
- 报告末尾建议修复优先级,由用户拍板后另行执行

## 完成标准

- [ ] 7 个维度逐项审计完成（规则根 / Rules / Skills / MCP / 流程门禁 / 工程规范 / Commit），无漏项
- [ ] 每维度给出 S/A/B/C/D 得分,总体取加权
- [ ] 技能库检查完成:frontmatter 合法性、references 断链、孤儿文件、超长 SKILL.md(>500 行)
- [ ] 抽查 3-5 个核心 skill(描述/引用质量)完成
- [ ] 报告含 P0(必改) / P1(该改) / Quick Wins(标注预计耗时)
- [ ] 结论全部带证据,只读审计未修改任何文件
