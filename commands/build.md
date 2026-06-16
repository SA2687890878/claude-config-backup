---
description: 功能开发 — 架构设计、功能设计、数据库设计、编码、测试
allowed-tools: Read, Grep, Glob, Bash, Edit, Write, Agent, Workflow
---

功能开发流程。从需求到交付的完整开发流程。

## ⚠️ 强制要求

**必须使用 Workflow 工具执行，禁止手动执行！**

收到此命令后，第一步必须调用 Workflow 工具，将用户的消息文本作为参数传递。

## 参数传递规则

**关键：必须把用户的功能描述传递给工作流！**

- 用户输入 `/build 用户导出功能` → `args: "用户导出功能"`
- 用户输入 `/build` 后单独描述 → 把用户的问题文本作为 `args` 传入
- 如果用户没有提供功能描述，先询问再调用 Workflow

## 执行方式

```
Workflow({
  scriptPath: "~/.claude/workflows/build.js",
  args: "<用户的功能描述文本>"
})
```

或者使用对象形式：

```
Workflow({
  scriptPath: "~/.claude/workflows/build.js",
  args: {
    featureName: "<功能名称>",
    requirementDoc: "<需求文档路径>"
  }
})
```

## 参数

- `featureName` / 直接字符串 — 功能名称（必需）
- `requirementDoc` — 需求文档路径（可选）
- `decisionDoc` — 决策记录路径（可选）

## 用户输入解析

从用户的命令参数中提取：
- 前端项目路径、后端项目路径 → 作为项目上下文
- 需求文档/原型路径 → 作为 `requirementDoc` 参数
- 功能名称 → 从需求文档推断或询问用户
