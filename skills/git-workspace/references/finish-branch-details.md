# 完成分支细节

## 检测环境

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
```

| 状态 | 菜单 | 清理 |
|------|------|------|
| `GIT_DIR == GIT_COMMON`（正常 repo） | 4 选项 | 无 worktree 清理 |
| `GIT_DIR != GIT_COMMON`，命名分支 | 4 选项 | 基于来源清理 |
| `GIT_DIR != GIT_COMMON`，detached HEAD | 3 选项（无 merge） | 无清理 |

## 确定基线分支

```bash
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

## 呈现选项

**正常 repo — 4 选项：**
1. 本地合并回 `<base-branch>`
2. 推送并创建 Pull Request
3. 保持现状
4. 丢弃这个工作

**Detached HEAD — 3 选项：** 去掉选项 1。

## 执行逻辑

### 选项 1：本地合并

```bash
git checkout <base-branch>
git pull
git merge <feature-branch>
<test command>  # 验证合并结果
# 成功后清理 worktree，删分支
git branch -d <feature-branch>
```

### 选项 2：推送并创建 PR

```bash
git push -u origin <feature-branch>
gh pr create --title "<title>" --body "..."
```

不要清理 worktree — 用户需要它迭代 PR 反馈。

### 选项 3：保持现状

报告分支名和 worktree 路径。

### 选项 4：丢弃

先确认（输入 'discard'），然后 `git branch -D <feature-branch>`。

## 清理规则

仅选项 1 和 4 执行清理。

```bash
# 在 worktree 外执行
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"
git worktree remove "$WORKTREE_PATH"
git worktree prune
```

**只清理我们创建的 worktree**（路径在 `.worktrees/`、`worktrees/` 下）。其他路径是主机环境拥有，不删。

## 常见错误

- 删除分支前没移除 worktree → `git branch -d` 失败
- 在 worktree 内执行 `git worktree remove` → 静默失败
- 清理主机环境的 worktree → 幽灵状态
- 选项 4 不确认 → 误删工作
