---
description: 需求探索 — 需求沟通、澄清、技术调研、方案比较
allowed-tools: Read, Grep, Glob, Bash, Agent, Workflow
---

需求探索流程。帮助用户理清需求、设计方案。

## ⚠️ 强制要求

**必须使用 Workflow 工具执行，禁止手动执行！**

收到此命令后，第一步必须调用 Workflow 工具，将用户的消息文本作为参数传递。

## 参数传递规则

**关键：必须把用户的问题描述传递给工作流！**

- 用户输入 `/explore 帮我评估小米V2数据推送方案` → `args: "帮我评估小米V2数据推送方案"`
- 用户输入 `/explore` 后单独描述问题 → 把用户的问题文本作为 `args` 传入
- 如果用户没有提供问题，先询问用户想探索什么，再调用 Workflow

## 执行方式

```
Workflow({
  scriptPath: "~/.claude/workflows/explore.js",
  args: "<用户的问题描述文本>"
})
```

或者使用对象形式：

```
Workflow({
  scriptPath: "~/.claude/workflows/explore.js",
  args: {
    question: "<需求描述>",
    context: "<业务上下文>",
    domain: "<领域>"
  }
})
```

## 参数

- `question` / 直接字符串 — 需求描述或问题（必需）
- `context` — 业务上下文（可选）
- `domain` — 领域（可选）
