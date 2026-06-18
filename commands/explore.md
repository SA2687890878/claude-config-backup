---
description: 需求探索 — 需求沟通、澄清、技术调研、方案比较
allowed-tools: Read, Grep, Glob, Bash, Agent
---

需求探索流程。帮助用户理清需求、设计方案。

## 执行方式

收到此命令后，使用 Skill 工具调用 `/requirements`。

```
Skill({ skill: "requirements" })
```

## 参数

- 用户输入的文本作为需求描述传递给 skill
- 如果用户没有提供问题，先询问用户想探索什么，再调用 Skill
