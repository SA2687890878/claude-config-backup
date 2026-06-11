---
description: 需求探索 — 需求沟通、澄清、技术调研、方案比较
allowed-tools: Read, Grep, Glob, Bash
---

需求探索流程。帮助用户理清需求、设计方案。

## 执行方式

使用 Workflow 工具执行：

```
Workflow({scriptPath: "~/.claude/workflows/explore.js"})
```

## 参数

- `question` — 需求描述或问题
- `context` — 业务上下文（可选）
- `domain` — 领域（可选）
