# Quality Gate 体系

## 门禁概览

| 门禁 | 时机 | 详细检查项 |
|------|------|-----------|
| Requirement Gate | 需求探索完成后 | `knowledge/rules/gates/requirement.md` |
| Design Gate | 设计完成后 | `knowledge/rules/gates/design.md` |
| Code Gate | 编码完成后 | `knowledge/rules/gates/code.md` |
| Test Gate | 测试完成后 | `knowledge/rules/gates/test.md` |
| Release Gate | 发布前 | `knowledge/rules/gates/release.md` |

## 工作流集成

- `/explore` → Requirement Gate
- `/build` → Design → Code → Test Gate
- `/operate` → Code → Test Gate

## 铁律

1. **没有新鲜的验证证据，不许宣称完成**
2. **下游不改上游**：需改只提阻塞项
3. **熔断**：连续打回 ≥3 次 → 暂停，人工介入

## 详细参考

- Task Contract 模板 + 偏差检测 + R1-R6 根因：`knowledge/rules/gates/task-contract.md`
- 验证纪律：`rules/quality/verification.md`
- 需求澄清问题库：`knowledge/rules/quality/question-bank.md`
