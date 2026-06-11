---
description: Git 提交 — 自动生成提交信息、管理工作区、完成分支
allowed-tools: Bash(git:*)
---

Git 提交与工作空间管理。

## 执行方式

调用 `/commit` skill 执行。

## 功能

1. **提交代码** — 根据 git diff 自动生成符合规范的提交信息
2. **创建工作区** — 优先用 native worktree 工具
3. **完成分支** — 验证测试 → 检测环境 → 呈现选项 → 执行 → 清理
