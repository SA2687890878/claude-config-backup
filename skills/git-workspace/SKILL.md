---
name: git-workspace
description: >
  Git 工作空间管理 — 路由到"创建工作区"、"完成分支"两条分支。
  创建时优先 native worktree 工具，fallback 到 git worktree；
  完成时验证测试 → 检测环境 → 呈现选项 → 执行 → 清理。
  当用户说 /git-workspace、创建工作区、worktree、完成分支、
  merge、创建 PR、结束开发时触发。
version: 1.0.0
---

# Git 工作空间管理

## 路由

| 意图 | 分支 |
|------|------|
| 创建隔离工作区（"创建工作区"、"worktree"、"隔离"） | → A. 创建工作区 |
| 完成开发分支（"完成"、"merge"、"PR"、"结束"） | → B. 完成分支 |
| 不确定 | → 问用户 |

---

## A. 创建工作区

核心原则：先检测已有隔离 → 再用 native 工具 → 再 fallback git worktree。

### 检测已有隔离

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
```

Submodule 守卫：`GIT_DIR != GIT_COMMON` 在 submodule 里也成立。验证：

```bash
git rev-parse --show-superproject-working-tree 2>/dev/null
```

- `GIT_DIR != GIT_COMMON`（非 submodule）→ 已在 worktree，跳到项目设置
- `GIT_DIR == GIT_COMMON` → 正常 repo，继续创建

### 创建

优先用平台 native worktree 工具（`EnterWorktree`、`/worktree` 等）。没有才用 `git worktree add` fallback。

读取 `references/worktree-details.md` 了解目录选择、安全验证、sandbox fallback 等细节。

### 项目设置 + 验证

```bash
# .NET
if [ -f *.sln ] || [ -f *.csproj ]; then dotnet restore; fi
# 测试
dotnet test / npm test
```

测试失败：报告，问是否继续。测试通过：报告就绪。

---

## B. 完成分支

核心原则：验证测试 → 检测环境 → 呈现选项 → 执行 → 清理。

### 验证测试

```bash
dotnet test / npm test
```

测试失败：停下，不继续。

### 检测环境 + 呈现选项

读取 `references/finish-branch-details.md` 了解环境检测、选项呈现、执行逻辑和清理规则。

### 快速参考

| 选项 | 合并 | 推送 | 保留 Worktree | 清理分支 |
|------|------|------|---------------|---------|
| 1. 本地合并 | 是 | - | - | 是 |
| 2. 创建 PR | - | 是 | 是 | - |
| 3. 保持现状 | - | - | 是 | - |
| 4. 丢弃 | - | - | - | 是（force） |
