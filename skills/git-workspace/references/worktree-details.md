# 工作区创建细节

## 目录选择优先级

1. 用户指定的工作目录
2. 已存在的项目本地目录（`.worktrees` > `worktrees`）
3. 已存在的全局目录
4. 默认 `.worktrees/` 在项目根目录

## 安全验证（项目本地目录）

```bash
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

未被忽略：先加到 .gitignore，提交，再继续。防止 worktree 内容被意外提交。

## 创建命令

```bash
git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

## Sandbox fallback

如果 `git worktree add` 因权限失败，告知用户 sandbox 阻止了 worktree 创建，在当前目录继续。
