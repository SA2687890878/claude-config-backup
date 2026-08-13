# pcs.webbackend 项目经验

> 沉淀标准（SBA 三件套，见 dev-workflow skill 收尾环节）：
> - Recording Threshold：可重复 / 代价高 / 代码看不出 ≥2 条才写入
> - verified-failure：本次故障红转绿（修好）的教训，直写最近规则 owner，不等重复
> - activate：每条经验必须落在任务路径上改变下一步动作，答不上来不沉淀
> - 记忆是线索非结论：引用前验证（grep/codegraph 确认仍存在）；时间写绝对日期
> - 漂移检测：被引用的规则/skill/代码变化时，主动复核相关 learnings 条目是否仍准确；发现过期即更新或删除

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
