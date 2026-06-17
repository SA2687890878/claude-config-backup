# Quality Gate 体系

> 所有工作流必须通过对应的质量门禁。门禁是强制的，不可跳过。

## 门禁概览

| 门禁 | 时机 | 通过条件 |
|------|------|---------|
| Requirement Gate | 需求探索完成后 | 所有检查项通过 |
| Design Gate | 设计完成后 | 所有检查项通过 |
| Code Gate | 编码完成后 | 编译通过 + 审查通过 |
| Test Gate | 测试完成后 | 所有测试通过 |
| Release Gate | 发布前 | 所有检查项通过 |

## 详细参考

- Requirement Gate：`~/.claude/knowledge/rules/gates/requirement.md`
- Design Gate：`~/.claude/knowledge/rules/gates/design.md`
- Code Gate：`~/.claude/knowledge/rules/gates/code.md`
- Test Gate：`~/.claude/knowledge/rules/gates/test.md`
- Release Gate：`~/.claude/knowledge/rules/gates/release.md`

## 门禁执行规则

- 门禁是强制的，不可跳过
- 必须有实际运行的命令和输出
- 退出码是唯一的判定标准

## 工作流集成

- **explore** → Requirement Gate
- **build** → Design Gate → Code Gate → Test Gate
- **operate** → Code Gate → Test Gate
