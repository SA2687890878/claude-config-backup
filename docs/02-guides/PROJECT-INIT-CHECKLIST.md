# 项目启动 Checklist

> 新项目启动时的初始化检查清单，确保 Harness Engineering 机制正常运转。

---

## 第一步：创建项目级 CLAUDE.md

**位置**：`<project-root>/.claude/CLAUDE.md`

**操作**：
```bash
# 复制模板
cp ~/.claude/docs/templates/CLAUDE.md.template <project-root>/.claude/CLAUDE.md
```

**填写内容**：
- [ ] 技术栈（后端框架、前端框架、数据库、测试工具）
- [ ] 关键约束（业务约束、性能约束、安全约束）
- [ ] 架构决策（分层架构、关键模式、命名约定）
- [ ] 数据库设计（核心表、索引策略、数据迁移）
- [ ] API 约定（RESTful 设计、响应格式、错误码）
- [ ] 常见操作（编译命令、测试命令、前端开发命令）
- [ ] 源码保护（加密状态、访问方式）

---

## 第二步：初始化 Memory 目录

**位置**：`~/.claude/projects/<project-name>/memory/`

**操作**：
```bash
# 创建目录
mkdir -p ~/.claude/projects/<project-name>/memory/

# 创建 MEMORY.md
cat > ~/.claude/projects/<project-name>/memory/MEMORY.md << 'EOF'
# Memory 索引

## 项目经验
- [经验记录](learnings.md) — 自动记录每次会话的修改

## 任务状态
- [当前任务](task-state.md) — 手动维护的任务进度
EOF

# 创建 learnings.md
cat > ~/.claude/projects/<project-name>/memory/learnings.md << 'EOF'
# 项目经验记录

> 自动记录每次会话的修改，供后续会话参考。
EOF

# 创建 task-state.md
cat > ~/.claude/projects/<project-name>/memory/task-state.md << 'EOF'
# 当前任务状态

## 基本信息
- 项目：[项目名]
- 分支：[当前分支]
- 开始时间：[开始时间]

## 任务列表
- [ ] 任务 1
- [ ] 任务 2

## 进度记录
- HH:MM - 完成了什么
EOF
```

**检查**：
- [ ] `memory/MEMORY.md` 已创建
- [ ] `memory/learnings.md` 已创建
- [ ] `memory/task-state.md` 已创建

---

## 第三步：初始化 Artifacts 目录

**位置**：`<project-root>/.claude/artifacts/`

**操作**：
```bash
# 创建目录
mkdir -p <project-root>/.claude/artifacts/
mkdir -p <project-root>/.claude/artifacts/archive/

# 创建 README.md
cat > <project-root>/.claude/artifacts/README.md << 'EOF'
# Artifacts 产物目录

此目录存储项目的所有产物文档：
- Requirement.md — 需求文档
- Architecture.md — 架构设计
- Design.md — 详细设计
- TestPlan.md — 测试计划
- CodeReview.md — 代码审查
- RCA.md — 根因分析

完成的功能分支产物归档到 `archive/` 目录。
EOF
```

**检查**：
- [ ] `artifacts/` 目录已创建
- [ ] `artifacts/archive/` 目录已创建
- [ ] `artifacts/README.md` 已创建

---

## 第四步：初始化 Knowledge project/

**位置**：`~/.claude/knowledge/project/<project-name>/`

**操作**：
```bash
# 创建目录
mkdir -p ~/.claude/knowledge/project/<project-name>/

# 复制模板
cp ~/.claude/docs/templates/api-contract.md.template \
   ~/.claude/knowledge/project/<project-name>/api-contract.md

cp ~/.claude/docs/templates/database-schema.md.template \
   ~/.claude/knowledge/project/<project-name>/database-schema.md

cp ~/.claude/docs/templates/common-patterns.md.template \
   ~/.claude/knowledge/project/<project-name>/common-patterns.md
```

**填写内容**：
- [ ] `api-contract.md` — API 设计规范
- [ ] `database-schema.md` — 数据库 Schema
- [ ] `common-patterns.md` — 常用模式

---

## 第五步：配置 Git

**操作**：
```bash
# .gitignore 中添加（如果需要）
echo ".claude/artifacts/archive/" >> .gitignore

# 提交初始化
git add .claude/
git commit -m "[配置] 初始化 Claude Harness Engineering 配置"
```

**检查**：
- [ ] `.claude/CLAUDE.md` 已提交
- [ ] `.claude/artifacts/` 已提交（或已忽略 archive/）

---

## 第六步：验证 Hook 集成

**操作**：
```bash
# 检查 session-start.js 是否能识别项目
# 会话启动时应该看到项目信息注入
```

**检查**：
- [ ] SessionStart 时加载了项目信息
- [ ] SessionStart 时加载了 learnings.md（如有）
- [ ] Git 状态摘要正确显示

---

## 第七步：测试 Workflow

**操作**：
1. 触发 `pipeline-executor` 需求阶段 — 检查是否生成 Requirement.md
2. 触发 `pipeline-executor` 设计阶段 — 检查是否生成 Architecture.md
3. 修改代码 — 检查 learning-recorder.js 是否记录到 learnings.md

**检查**：
- [ ] `pipeline-executor` 需求阶段生成 Requirement.md 到 artifacts/
- [ ] `pipeline-executor` 设计阶段生成 Architecture.md 到 artifacts/
- [ ] 代码修改后 learnings.md 有新增记录

---

## 完整目录结构（初始化后）

```
<project-root>/
├── .claude/
│   ├── CLAUDE.md                          # 项目 Context
│   └── artifacts/                         # 产物目录
│       ├── README.md
│       └── archive/                       # 已完成功能的产物归档

~/.claude/projects/<project-name>/
├── memory/
│   ├── MEMORY.md                          # auto-memory 索引
│   ├── learnings.md                       # 项目经验
│   └── task-state.md                      # 任务状态
└── archive/                               # 任务归档

~/.claude/knowledge/project/<project-name>/
├── api-contract.md                        # API 约定
├── database-schema.md                     # 数据库 Schema
└── common-patterns.md                     # 常用模式
```

---

## 常见问题

### Q: 项目名称如何确定？
**A**: 路径转换规则：`C:\Users\admin\project` → `C--Users-admin-project`

### Q: 如果项目已存在，需要补初始化吗？
**A**: 是的。按此 Checklist 补齐缺失的目录和文件。

### Q: CLAUDE.md 必须填写完整吗？
**A**: 最低要求：技术栈、关键约束、常见操作。其他可后续补充。

### Q: Knowledge project/ 必须立即填写吗？
**A**: 不必。可以从模板开始，随着项目推进逐步完善。

---

## 自动化脚本（可选）

创建 `~/.claude/scripts/init-project.sh`：

```bash
#!/bin/bash

PROJECT_ROOT=$1
PROJECT_NAME=$(basename "$PROJECT_ROOT" | tr '/:' '--')

echo "初始化项目: $PROJECT_NAME"

# 1. 创建项目级 CLAUDE.md
mkdir -p "$PROJECT_ROOT/.claude"
cp ~/.claude/docs/templates/CLAUDE.md.template "$PROJECT_ROOT/.claude/CLAUDE.md"

# 2. 创建 Memory 目录
mkdir -p ~/.claude/projects/"$PROJECT_NAME"/memory/
cp ~/.claude/docs/templates/MEMORY.md.template ~/.claude/projects/"$PROJECT_NAME"/memory/MEMORY.md

# 3. 创建 Artifacts 目录
mkdir -p "$PROJECT_ROOT/.claude/artifacts/archive"

# 4. 创建 Knowledge project/
mkdir -p ~/.claude/knowledge/project/"$PROJECT_NAME"/
cp ~/.claude/docs/templates/*.md.template ~/.claude/knowledge/project/"$PROJECT_NAME"/

echo "✅ 项目初始化完成: $PROJECT_NAME"
```

**使用**：
```bash
bash ~/.claude/scripts/init-project.sh /path/to/project
```

---

## 总结

**完成此 Checklist 后，项目将具备**：
- ✅ 项目级 Context（CLAUDE.md）
- ✅ Memory 三层机制（MEMORY.md + learnings.md + task-state.md）
- ✅ Artifact 产物管理（artifacts/ + archive/）
- ✅ Knowledge 项目知识库（knowledge/project/<project-name>/）
- ✅ 完整的 Harness Engineering 机制

**理想状态**：
- 新项目启动 5 分钟内完成初始化
- 所有机制自动运转
- 经验自动沉淀，知识可复用
