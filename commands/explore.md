---
description: 需求探索 — 需求沟通、澄清、技术调研、方案比较
allowed-tools: Read, Grep, Glob, Bash, Agent, Workflow
---

需求探索流程。帮助用户理清需求、设计方案。

## ⚠️ 强制要求

**必须使用 Workflow 工具执行，禁止手动执行！**

收到此命令后，第一步必须调用：

```
Workflow({scriptPath: "~/.claude/workflows/explore.js"})
```

**禁止跳过 Workflow 直接分析。**

## 执行方式

```
Workflow({
  scriptPath: "~/.claude/workflows/explore.js",
  args: {
    question: "<需求描述>",
    context: "<业务上下文>"
  }
})
```

## 参数

- `question` — 需求描述或问题（必需）
- `context` — 业务上下文（可选）
- `domain` — 领域（可选）
