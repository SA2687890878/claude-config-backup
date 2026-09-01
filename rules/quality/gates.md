# Quality Gate 体系

## 门禁概览

| 门禁 | 时机 | 详细检查项 |
|------|------|-----------|
| Requirement Gate | 需求探索完成后 | `knowledge/rules/gates/requirement.md` |
| Design Gate | 设计完成后 | `knowledge/rules/gates/design.md` |
| Code Gate | 编码完成后 | `knowledge/rules/gates/code.md` |
| Test Gate | 测试完成后 | `knowledge/rules/gates/test.md` |
| Release Gate | 发布前 | `knowledge/rules/gates/release.md` |

## 工作流集成（现行单轨）

- `pipeline-executor`：requirements → Requirement Gate → design → Design Gate → dev-workflow → Code Gate → test → Test Gate → verification → Release Gate
- 单点排查：`/systematic-debugging` / `/perf-tune` → Code/Test Gate

## 铁律

1. **没有新鲜的验证证据，不许宣称完成**
2. **下游不改上游**：需改只提阻塞项
3. **熔断**：连续打回 ≥3 次 → 暂停，人工介入
4. **范围漂移即停**：实施中发现合同外的新路由/字段/操作/权限 → 立即停止，重新确认后再继续，不得静默扩展

## 详细参考

- Task Contract 模板 + 偏差检测 + R1-R6 根因：`knowledge/rules/gates/task-contract.md`
- 验证纪律：`rules/quality/verification.md`
- 需求澄清问题库：`knowledge/rules/quality/question-bank.md`
