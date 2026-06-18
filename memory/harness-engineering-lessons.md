---
name: harness-engineering-lessons
description: Harness建设教训——不要重复建设skills/agents，先理解现有系统再动手
metadata:
  type: feedback
---

## Harness Engineering 建设教训

### 错误 1：创建的 agents 与已有的 skills 重复
- 用户已有 `test-runner` skill → 又创建了 `test-runner` agent
- 用户已有 `code-review-workflow` skill → 又创建了 `code-reviewer` agent

### 错误 2：agents 里没有引用用户已有的策略
- 用户的 `investigator` agent 已经写清楚了索引系统
- 新建的 agents 完全没引用，重复写了一遍

### 错误 3：没有理清 skills → agents 的调用关系
Claude 的分层：
- **skills** = 用户输入的快捷方式（`/test`）和可复用的流程指令
- **agents** = 内部委派的执行单元（被 skill 调用，运行在独立上下文中）
- **hooks** = 事件触发的自动化（确定性，零例外）

### 错误 4：预定义 Workflow 用于小规模任务
- 预定义 Workflow（.js 脚本）适合"几十到几百个 agent"的大规模编排
- 3-5 agent 的任务用 Skill + Subagent 更高效
- 中间结果通过 `log()` 送回主上下文会抵消 Workflow 的隔离优势
- 如果需要复杂编排，用 Ultracode 让 Claude 动态生成 workflow

### 正确做法
1. **先查看已有的 skills、agents**，再决定是否新建
2. **agents 是执行单元**，应该被 skills 调用
3. **agents 应该引用已有的策略**（索引系统、Token 优化）
4. **不能重复建设**，要复用已有的

## Why:
重复建设导致资源浪费和维护负担。

## How to apply:
建设 harness engineering 时，先 `Glob("~/.claude/skills/*")` 和 `Glob("~/.claude/agents/*")` 查看已有内容。
