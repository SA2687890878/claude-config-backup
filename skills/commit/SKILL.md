---
name: commit
description: >
  Git 提交与工作空间管理 — 自动生成提交信息、管理工作区、完成分支。
  当用户说 /commit、提交、git commit、创建工作区、worktree、完成分支时触发。
version: 2.0.0
---

# Git 提交与工作空间管理

## 路由

| 意图 | 分支 |
|------|------|
| 提交代码（"提交"、"commit"） | → A. 生成提交信息 |
| 创建隔离工作区（"创建工作区"、"worktree"） | → B. 创建工作区 |
| 完成开发分支（"完成"、"merge"、"PR"） | → C. 完成分支 |
| 不确定 | → 问用户 |

---

## A. 生成提交信息

根据当前 git diff 自动生成符合公司规范的提交信息。

**核心流程：**
1. 收集变更：`git status` + `git diff`
2. 分析变更内容，判断类型（新增/修复/文档/重构/优化/测试/配置/回滚）
3. 生成提交信息：`[类型] 简短描述` + 详细描述
4. 确认后执行：`git commit -m "..." -m "..."`

读取 `references/commit-details.md` 了解完整规则和示例。

---

## B. 创建工作区

核心原则：先检测已有隔离 → 再用 native 工具 → 再 fallback git worktree。

**核心流程：**
1. 检测已有隔离：`GIT_DIR != GIT_COMMON`
2. 创建工作区：优先用 native 工具
3. 项目设置 + 验证：`dotnet restore` + `dotnet test`

读取 `references/worktree-details.md` 了解详细流程。

---

## C. 完成分支

核心原则：验证测试 → 检测环境 → 呈现选项 → 执行 → 清理。

**选项：**
| 选项 | 合并 | 推送 | 保留 Worktree | 清理分支 |
|------|------|------|---------------|---------|
| 1. 本地合并 | 是 | - | - | 是 |
| 2. 创建 PR | - | 是 | 是 | - |
| 3. 保持现状 | - | - | 是 | - |
| 4. 丢弃 | - | - | - | 是（force） |

读取 `references/finish-branch-details.md` 了解详细流程。
