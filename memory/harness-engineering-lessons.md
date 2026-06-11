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

### 错误 3：没有理清 skills → agents → workflows 的调用关系
Claude 的分层：
- **skills** = 用户输入的快捷方式（`/test-runner`）
- **agents** = 内部委派的执行单元（被 skill/workflow 调用）
- **workflows** = 多阶段编排（自动调度 agents）
- **hooks** = 事件触发的自动化

### 正确做法
1. **先查看已有的 skills、agents、workflows**，再决定是否新建
2. **agents 是执行单元**，应该被 skills/workflows 调用
3. **agents 应该引用已有的策略**（索引系统、Token 优化）
4. **不能重复建设**，要复用已有的

## Why:
重复建设导致资源浪费和维护负担。

## How to apply:
建设 harness engineering 时，先 `Glob("~/.claude/skills/*")` 和 `Glob("~/.claude/workflows/*")` 查看已有内容。
