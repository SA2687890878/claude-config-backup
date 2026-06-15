# 任务管理规则

> 经验沉淀和任务归档的详细规则。CLAUDE.md 引用此文件。

## 路径设计（Claude Code 的 projects 目录结构）

所有项目级数据存储在 Claude Code 的 projects 目录下：
```
~/.claude/projects/<project-path>/
├── memory/
│   ├── MEMORY.md          # auto-memory 索引
│   ├── learnings.md       # 项目经验（自动+手动写入）
│   └── task-state.md      # 任务状态
└── archive/               # 任务归档
    └── YYYY-MM-DD-分支名.md
```

路径转换规则：`C:\Users\admin` → `C--Users-admin`

---

## 经验沉淀（借鉴 ralph 的 progress.txt 模式）

**每次完成一个功能或修复一个 bug 后，必须追加到项目级 `memory/learnings.md`：**

```markdown
## YYYY-MM-DD HH:MM - [做了什么]

### 修改的文件
- `文件路径` - 改了什么

### 学到的模式（可复用）
- 这个项目用 XxxTemplate 做聚合
- 修改 X 时必须同时更新 Y

### 踩坑记录（下次避免）
- 不要忘记在迁移脚本中加 IF NOT EXISTS
- 这个项目的 Vue 组件都用 xxx 命名

### 有用的上下文
- 评估面板在 component X 中
- Settings 表的字段必须匹配模板
```

**规则：**
1. 存储位置：`~/.claude/projects/<project-path>/memory/learnings.md`
2. 只记录**非显而易见的、可复用的**经验
3. 不记录常规操作（如"添加了一个属性"）
4. `Learnings for future iterations` 是最重要的——下次会话要先看这些
5. `project-knowledge.js` 会在 SessionStart 时自动加载

---

## 任务状态管理

### 任务状态文件

位置：`~/.claude/projects/<project-path>/memory/task-state.md`

```markdown
# 当前任务状态

## 基本信息
- 项目：[项目名]
- 分支：[当前分支]
- 开始时间：[开始时间]

## 任务列表
- [ ] 任务 1
- [ ] 任务 2
- [x] 任务 3（已完成）

## 进度记录
- HH:MM - 完成了什么
```

### 任务归档（借鉴 ralph 的自动归档）

完成一个功能分支时（/commit 的"完成分支"流程），自动归档：

1. 把 `memory/task-state.md` 移动到 `archive/YYYY-MM-DD-分支名.md`
2. 清空 `memory/task-state.md`（保留模板）
3. 在归档文件头部添加完成时间

### 恢复任务

新会话启动时，如果用户说"继续工作"：
1. 读取 `memory/task-state.md`
2. 报告给用户并询问是否继续

> **注意**：`task-state.md` 需要用户或 Claude 手动创建和更新，不会自动生成。这是设计意图——避免自动保存导致数据丢失。
