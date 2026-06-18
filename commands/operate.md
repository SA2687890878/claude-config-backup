---
description: 问题排查 — 问题定位、根因分析、性能调优、日志分析
allowed-tools: Read, Grep, Glob, Bash, Edit, Write, Agent
---

问题排查流程。快速定位问题根因、分析性能瓶颈。

## 执行方式

收到此命令后，使用 Skill 工具调用 `/systematic-debugging`。

```
Skill({ skill: "systematic-debugging" })
```

## 参数

- 用户输入的文本作为问题描述传递给 skill
- 如果用户没有提供问题描述，先询问再调用 Skill
