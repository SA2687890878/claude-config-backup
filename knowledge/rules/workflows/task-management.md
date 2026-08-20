# 任务管理规则

> 核心任务管理规则。CLAUDE.md 引用此文件。

## 协议（唯一真源）

| 协议 | 路径 | 用途 |
|------|------|------|
| 主协议 | `~/.claude/tasks/active.json` | 当前任务唯一真源（task_id / stage / product_path / baseline） |
| 历史索引 | `~/.claude/tasks/.index.json` | 已完成任务索引 |
| 遗留兼容 | `~/.claude/projects/<path>/memory/task-state.md` | 仅兼容旧会话，不再作为主恢复入口 |

路径转换：`C:\Users\admin` → `C--Users-admin`

---

## 任务流转

- **开始** → 写入 `active.json`（stage=requirements）
- **推进** → 更新 `active.json` 的 stage（requirements→design→development→testing→done）
- **完成** → 从 `active.json` 移入 `.index.json`，清空 active
- **产物** → 始终写入 `{product_path}/`（skill 从 active.json 动态取）
- **恢复** → 只认 `active.json`；历史查 `.index.json`；`task-state.md` 仅当两者皆空时兼容读取
- **全流程** → 说"开发XX" → 唯一入口 `/pipeline-executor`

---

## 经验沉淀

**每次完成一个功能或修复一个 bug 后，追加到项目级 `memory/learnings.md`：**

```markdown
## YYYY-MM-DD HH:MM - [做了什么]

### 修改的文件
- `文件路径` - 改了什么

### 学到的模式（可复用）
- 这个项目用 XxxTemplate 做聚合
- 修改 X 时必须同时更新 Y

### 踩坑记录（下次避免）
- 不要忘记在迁移脚本中加 IF NOT EXISTS
```

**规则：**
1. 存储位置：`~/.claude/projects/<project-path>/memory/learnings.md`
2. 只记录**非显而易见的、可复用的**经验
3. 不记录常规操作（如"添加了一个属性"）
4. `Learnings for future iterations` 是最重要的——下次会话要先看这些

---

## 遗留兼容（task-state.md）

> 旧协议，保留兼容，新任务不再以此为主路径。

位置：`~/.claude/projects/<project-path>/memory/task-state.md`（模板保留）

旧归档：`archive/YYYY-MM-DD-分支名.md`（历史任务归档，已由 `.index.json` 替代）

---

## Session 总结规则

> 在对话压缩或结束时结构化总结，方便跨会话延续。

### 什么时候使用

- 对话即将压缩时
- 长会话结束时
- 需要跨会话延续工作时

### 总结内容（必须保留）

1. **修改文件列表** — 文件路径 + 改了什么
2. **测试命令和验证结果** — 命令 + 通过/失败
3. **关键决策和理由** — 选择了什么 + 为什么
4. **需求偏差记录** — 用户要求 vs 实际做了什么
5. **未解决的问题** — 待确认/待调查的事项

### 不需要保留

- 完整的对话历史
- 重复的信息
- 已经解决且没有后续影响的问题

### 总结格式

```markdown
## Session 总结 [YYYY-MM-DD]

### 完成的工作
- [任务]: [简述]

### 修改的文件
- file: [改了什么]

### 测试结果
- 命令: [测试命令]
- 结果: [通过/失败]

### 关键决策
- [决策]: [理由]

### 偏差记录（如果有）
- [偏差]: [说明]

### 待解决
- [ ] [问题]
```

---

## 详细参考

- Memory → Knowledge 同步机制：`~/.claude/knowledge/rules/workflows/knowledge-sync.md`
- 质量门禁：`~/.claude/rules/quality/gates.md`
