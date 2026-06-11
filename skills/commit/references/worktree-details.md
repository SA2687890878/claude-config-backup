# 创建工作区详细流程

## 检测已有隔离

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

## 创建

优先用平台 native worktree 工具（`EnterWorktree`、`/worktree` 等）。没有才用 `git worktree add` fallback。

## 项目设置 + 验证

```bash
# .NET
if [ -f *.sln ] || [ -f *.csproj ]; then dotnet restore; fi
# 测试
dotnet test / npm test
```

测试失败：报告，问是否继续。测试通过：报告就绪。
