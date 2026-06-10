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
| 需求分析 | 最强（opus） | /brainstorming, /requirements |
| 代码实现 | 标准（sonnet） | /feature-development, subagent-driven |
| 代码审查 | 最强（opus） | /arch-review, /dotnet-review |
