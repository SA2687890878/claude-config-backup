---
description: 功能开发 — 写计划、执行计划、并行派发
allowed-tools: Read, Grep, Glob, Bash, Edit, Write, Agent
---

功能开发流程。从计划到交付的完整开发流程。

## 执行方式

收到此命令后，使用 Skill 工具调用 `/dev-workflow`。

```
Skill({ skill: "dev-workflow" })
```

## 参数

- 用户输入的文本作为功能描述传递给 skill
- 如果用户没有提供功能描述，先询问再调用 Skill
