---
description: 深度调研 — 行业研究、竞品分析、技术选型、市场调研
allowed-tools: Read, Grep, Glob, Bash, Edit, Write, Agent, WebSearch, WebFetch, mcp__context-mode__ctx_search, mcp__context-mode__ctx_fetch_and_index, mcp__context-mode__ctx_index, mcp__context-mode__ctx_execute, mcp__context-mode__ctx_execute_file
---

深度调研流程。生成专业级研究报告。

## 执行方式

收到此命令后，使用 Skill 工具调用 `/research`。

```
Skill({ skill: "research" })
```

## 参数

- 用户输入的文本作为调研主题传递给 skill
- 支持模式参数：`--mode quick`、`--mode deep`
- 如果用户没有提供主题，先询问再调用 Skill
