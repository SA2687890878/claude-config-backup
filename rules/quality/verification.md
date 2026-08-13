# 验证规则（确定性标准）

> 所有验证（agent、workflow、skill）引用此文件，不重复定义。

## PASS 条件
- build 退出码 == 0
- test 退出码 == 0
- 无测试失败

## FAIL 条件
- 任一退出码 != 0
- 有测试失败
- 有编译错误

## 验证纪律

- **退出码为王**：只看退出码，不看 agent 自述
- **必须运行命令**：不能声称成功但没有实际运行
- **必须给出证据**：实际运行的命令和返回内容
- **收据必须完整**：完成声明附 证据槽 = action/result/scope/uncovered/residual/confidence(A|B|C)
  - action：跑了什么命令；result：结果是什么
  - scope：验证覆盖了什么；uncovered：没覆盖什么（诚实列出）
  - residual：剩余风险；confidence：对结论的信心等级
  - 缺 scope/uncovered = 只报结果不报覆盖范围，视为不完整

## 详细参考

- 验证流程：`~/.claude/knowledge/rules/verification/flow.md`
- 验证纪律：`~/.claude/knowledge/rules/verification/discipline.md`
