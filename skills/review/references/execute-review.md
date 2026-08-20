# A. 执行审查 — 操作细节

> 审查策略选择与文件类型映射见 SKILL.md。本文件只提供执行层面的操作细节。

## Step 1: 确定审查范围

- git 仓库：`git diff` 获取变更
- 非 git 仓库：用 glob 查找最近修改的文件

## Step 2: 执行审查

1. 读取对应检查清单（SKILL.md 按文件类型路由）
2. 按清单逐项检查
3. 记录发现的问题（代码位置 + 规范来源）
4. 按严重程度分级（CRITICAL / HIGH / MEDIUM / LOW）

## Step 3: 输出报告

读取 `templates/audit-report.md` 获取标准报告格式。