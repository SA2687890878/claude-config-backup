---
paths:
  - ".claude/skills/**"
  - ".claude/commands/**"
  - ".claude/agents/**"
---

# 模型使用策略

subagent 和 prompt hook 的 model 字段选择参考：

| 阶段 | 模型偏好 | 适用场景 |
|------|---------|---------|
| 需求分析 | 最强（opus） | /requirements |
| 代码实现 | 标准（sonnet） | /dev-workflow, subagent-driven |
| 代码审查 | 最强（opus） | /arch-review, /code-review-workflow |
| 测试生成 | 标准（sonnet） | /generate-tests, /test-runner |
| 调试 | 标准（sonnet） | /systematic-debugging, /perf-tune |
