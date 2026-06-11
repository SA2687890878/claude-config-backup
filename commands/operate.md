---
description: 问题排查 — 问题定位、根因分析、性能调优、日志分析
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
---

问题排查流程。快速定位问题根因、分析性能瓶颈。

## 执行方式

使用 Workflow 工具执行：

```
Workflow({scriptPath: "~/.claude/workflows/operate.js"})
```

## 参数

- `issueTitle` — 问题标题（必需）
- `issueDescription` — 问题描述（可选）
- `errorLog` — 错误日志（可选）
- `type` — 问题类型：bug / performance / data（默认 bug）
