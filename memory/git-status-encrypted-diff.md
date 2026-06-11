---
name: git-status-encrypted-diff
description: 加密项目中git status的insertions/deletions数字是加密vs明文的假象
metadata:
  type: reference
---

## 现象

加密项目的 .cs 文件通过 git blob 写入明文后，`git status` 显示的 insertions/deletions 数字会非常大（如 826+/750-），因为比较的是**磁盘加密文件 vs 暂存区明文blob**。

## 正确查看方式

```bash
git diff HEAD~1..HEAD --shortstat   # 真实修改量
```

## Why:
加密文件和明文文件格式完全不同，git 认为几乎所有行都变了。但 commit 存储的是正确的明文代码。

## How to apply:
向用户报告修改量时，用 `git diff HEAD~1..HEAD --shortstat`，不要用 `git status` 的数字。
