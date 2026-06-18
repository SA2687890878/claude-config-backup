# pcs.webbackend 项目经验

## 加密文件修改

### 禁止的操作
- ❌ 用 sed/PowerShell 修改加密 .cs 文件（会破坏加密结构）
- ❌ 用 node.exe 修改加密文件

### 正确的方式
1. **跨分支移植**：优先使用 `git cherry-pick <commit-hash> --no-commit`
2. **必须手动修改时**：用 PowerShell（根据 `~/.claude/rules/tools/code-access.md`）
3. **查找代码**：用 SQLite 索引 + CodeGraph，不要直接 Read

### cherry-pick 流程
```bash
# 1. 暂存本地修改
git stash push -m "暂存本地修改"

# 2. cherry-pick（保留原始提交格式和加密机制）
git cherry-pick <commit-hash> --no-commit

# 3. 验证编译
dotnet build --no-restore

# 4. 提交
git commit -m "..."

# 5. 恢复 stash
git stash pop
```

## switch-case 插入新分支

**易错点**：添加新 `case` 时，容易把代码放到上一个 case 的末尾，而不是独立的 case 分支。

**检查方法**：
1. 新 case 必须有独立的 `break`
2. 检查前后 case 的 break 位置是否正确
3. 编译验证语法

---

> 最后更新：2026-06-18
