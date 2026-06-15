# 多项目支持机制

> 单一全局配置管理多个项目

## 架构概览

Claude 全局配置支持管理多个项目，每个项目有独立的会话状态和知识沉淀：

```
~/.claude/
├── rules/                           # 全局规则（所有项目共享）
├── hooks/                           # 全局 Hook（所有项目共享）
├── skills/                          # 全局 Skill（所有项目共享）
└── projects/                        # 项目级数据（项目隔离）
    ├── C--Users-admin-project-a/
    │   ├── memory/                  # 项目 A 的知识
    │   └── archive/                 # 项目 A 的任务归档
    ├── C--Users-admin-project-b/
    │   ├── memory/
    │   └── archive/
    └── C--Users-admin--claude/      # 当前项目
        ├── memory/
        └── archive/
```

---

## 项目识别机制

### 路径转换规则

**规则**：将项目根目录路径转换为 `projects/` 下的目录名

```
C:\Users\admin\project-a
  ↓ 转换
C--Users-admin-project-a

F:\OTD Code WorkSpace\otd.pcs.webbackend
  ↓ 转换
F--OTD-Code-WorkSpace-otd.pcs.webbackend
```

**转换逻辑**（JavaScript）：
```javascript
// 实现位置：session-start.js, learning-recorder.js 等
const projectPath = dir.replace(/:/g, '-').replace(/[\/\\]/g, '-');
```

**原因**：
- ✅ 避免文件系统路径分隔符冲突
- ✅ 支持跨平台（Windows/Linux/Mac）
- ✅ 相同项目名不同位置也能区分

---

### 项目检测流程

**由 `session-start.js` 执行**（SessionStart 事件）

```
用户打开项目（CWD = /path/to/project）
  ↓
session-start.js 向上查找项目根目录
  ↓
检查以下标志（优先级从高到低）：
  1. .git 目录（Git 仓库）
  2. .sln 文件（Visual Studio 解决方案）
  3. *.csproj 文件（.NET 项目）
  ↓
找到项目根后，计算 projects/ 目录名
  ↓
检查 ~/.claude/projects/<project-name>/ 是否存在
  ↓
如果不存在，创建目录结构
  ↓
加载项目级数据（CLAUDE.md、memory/、archive/）
```

**查找逻辑**（pseudocode）：
```javascript
function findProjectRoot(cwd) {
  let dir = cwd;
  for (let i = 0; i < 10; i++) {  // 向上最多 10 层
    if (existsSync(path.join(dir, '.git'))) return dir;     // Git 优先
    if (existsSync(path.join(dir, '.sln'))) return dir;     // VS 解决方案
    if (readdirSync(dir).some(f => f.endsWith('.csproj'))) return dir;
    
    const parent = path.dirname(dir);
    if (parent === dir) return null;  // 到达根目录
    dir = parent;
  }
  return null;
}
```

---

## 配置优先级

### 三层优先级机制

```
优先级 1（最高）: 项目级 .claude/
  ├── .claude/CLAUDE.md                    # 项目 Context
  ├── .claude/rules/languages/             # 项目特定的语言规则
  └── .claude/settings.json                # 项目特定的 Hook 配置

优先级 2（中）: 全局 ~/.claude/rules/
  ├── rules/tools/                         # 全局工具规则
  ├── rules/quality/                       # 全局质量规则
  ├── rules/workflows/                     # 全局工作流规则
  └── rules/languages/                     # 全局语言规则

优先级 3（最低）: 全局 ~/.claude/CLAUDE.md
  └── 兜底配置（当前两层都不存在时）
```

### 优先级解析规则

**场景1：加载代码访问规则**
```
1. 检查 <project>/.claude/rules/tools/code-access.md
2. 如果不存在，使用 ~/.claude/rules/tools/code-access.md
3. 如果都不存在，使用 ~/.claude/CLAUDE.md 中的建议
```

**场景2：加载语言规则**
```
# C# 开发
1. <project>/.claude/rules/languages/csharp.md（项目特定）
2. ~/.claude/rules/languages/csharp.md（全局）

# JavaScript 开发
1. <project>/.claude/rules/languages/javascript.md
2. ~/.claude/rules/languages/javascript.md
```

**场景3：Hook 配置**
```
# 编译验证
1. <project>/.claude/settings.json 中的 hooks.PreToolUse
2. ~/.claude/settings.json 中的 hooks.PreToolUse
3. Hook 默认配置
```

---

## 项目特定配置示例

### 示例1：.NET 项目

**<project>/.claude/CLAUDE.md**：
```markdown
# OTD.PCS.WebBackend

## 技术栈
- 框架：.NET 8.0（需要 .NET SDK 8.0+）
- 数据库：SQL Server 2019
- ORM：Entity Framework Core
- 测试：xUnit + Moq

## 编译命令
dotnet build --configuration Release

## 测试命令
dotnet test --configuration Release --no-build

## 源码加密
.cs 文件加密。使用 SQLite 索引：
search.ps1 -Query "ClassName" -ProjectPath "F:\OTD Code WorkSpace\otd.pcs.webbackend"
```

### 示例2：Node.js 项目

**<project>/.claude/CLAUDE.md**：
```markdown
# frontend-app

## 技术栈
- 框架：Next.js 14
- 前端：React 18 + TypeScript
- 样式：Tailwind CSS
- 包管理：pnpm

## 开发命令
pnpm dev      # 启动开发服务器
pnpm build    # 构建生产版本
pnpm test     # 运行测试

## 关键约定
- 组件目录：src/components/
- API 路由：src/app/api/
- 工具函数：src/utils/
- 类型定义：src/types/

## 源码保护
源码未加密。可直接 Read。
```

### 示例3：多技术栈项目

**<project>/.claude/rules/languages/typescript.md**：
```markdown
# TypeScript 项目规范（本项目定制）

## 版本要求
TypeScript 5.0+

## 编译选项（tsconfig.json）
- target: ES2020
- module: ESNext
- strict: true

## 禁止事项
- 不要使用 `any`
- 不要使用 `Object` 作为类型
- 不要在生产代码中输出调试日志
```

---

## 会话流程

### 完整的多项目会话流程

```
用户打开项目 A（CWD = F:\OTD Code WorkSpace\otd.pcs.webbackend）
  ↓ SessionStart 事件
session-start.js 运行
  ↓
1. 检测项目根（向上查找 .git/.sln/.csproj）
   结果：F:\OTD Code WorkSpace\otd.pcs.webbackend
  ↓
2. 计算 projects/ 目录名
   转换：F--OTD-Code-WorkSpace-otd.pcs.webbackend
  ↓
3. 尝试加载项目级数据
   检查：~/.claude/projects/F--OTD-.../CLAUDE.md
   检查：~/.claude/projects/F--OTD-.../memory/
  ↓
4. 注入到 Claude 上下文
   - Git 状态摘要
   - 项目级 CLAUDE.md 内容
   - learnings.md 内容（如有）
   - task-state.md 内容（如有）
  ↓
Claude 根据项目 Context 调整推理
  ↓
用户：开发一个新功能
  ↓
Claude 优先使用项目特定规则
  ├─ 编码规范：<project>/.claude/rules/languages/csharp.md
  ├─ 工具规则：~/.claude/rules/tools/code-access.md（如果项目未覆盖）
  ├─ 质量门禁：~/.claude/rules/quality/gates.md
  └─ 工作流规则：~/.claude/rules/workflows/workflows.md
  ↓
用户完成功能，执行 git commit
  ↓
commit-gate.js 运行
  ↓
learning-recorder.js 记录修改
  ↓
经验沉淀到 ~/.claude/projects/F--OTD-.../memory/learnings.md
  ↓
用户中断（关闭编辑器）
  ↓
用户在另一天重新打开项目 A
  ↓
SessionStart 再次运行
  ↓
加载 task-state.md，Claude 提醒："上次还有这些未完成的任务"
  ↓
用户可以继续
```

---

## 切换项目

### 场景：从项目 A 切换到项目 B

```
用户在项目 A（.NET）工作
  ↓
用户打开项目 B（Node.js）
  ↓
CWD 变更
  ↓
SessionStart 事件触发（或下一个 Claude 会话）
  ↓
session-start.js 重新检测项目根
  ↓
加载项目 B 的配置
  ↓
Claude 使用项目 B 的规则和 Memory
  ↓
项目 A 的 Memory 保留在 ~/.claude/projects/F--OTD-.../ 
项目 B 的 Memory 保留在 ~/.claude/projects/<project-b-name>/
```

**无冲突**：
- ✅ 项目 A 和 B 的 Memory 互不影响
- ✅ 切换项目时自动加载正确的配置
- ✅ 即使几个月后回到项目 A，learnings.md 仍然保留

---

## 最佳实践

### DO ✅

- **每个项目创建 .claude/CLAUDE.md** — 记录项目特定 Context
- **定期更新 learnings.md** — 记录项目特定经验
- **维护 task-state.md** — 特别是跨天工作时
- **充分利用优先级机制** — 项目级规则覆盖全局规则
- **使用一致的项目结构** — 便于自动检测

### DON'T ❌

- **不要复制全局规则到项目** — 除非有特殊原因
- **不要混乱项目结构** — 避免自动检测失败
- **不要在 Memory 中存储敏感信息** — 特别是 API Key
- **不要硬编码项目路径** — 使用相对路径或环境变量
- **不要遗弃旧项目的 Memory** — 也许某天还会用到

---

## 常见问题

### Q: 项目太多，Memory 会不会太膨胀？
**A**: 不会。每个项目独立存储，只在切换到该项目时加载。建议：
- learnings.md 只记录非显而易见的经验（不要冗长）
- 完成大型项目后，考虑归档旧 Memory 到 archive/

### Q: 能否在两个项目之间共享 Memory？
**A**: 目前没有自动机制。建议：
- 通用经验记录到全局 rules/ 中
- 特定经验保留在各自的 learnings.md

### Q: 如果检测项目失败怎么办？
**A**: session-start.js 会输出警告。检查：
- 是否存在 .git/.sln/.csproj？
- 是否在项目根目录打开？
- 手动创建 ~/.claude/projects/<project-name>/ 目录

### Q: 项目路径变更后，Memory 会丢失吗？
**A**: 会。路径变更会导致项目名变化。建议：
- 移动项目前，备份 Memory 目录
- 或使用 Git 的工作树（git worktree）避免路径变更

---

## 与全局配置的关系

| 层级 | 位置 | 共享范围 | 何时加载 |
|------|------|---------|---------|
| 全局规则 | ~/.claude/rules/ | 所有项目 | SessionStart 自动加载 |
| 全局 Hook | ~/.claude/hooks/ | 所有项目 | 每个工具调用时 |
| 项目规则 | <project>/.claude/rules/ | 仅此项目 | SessionStart 检查，有则覆盖 |
| 项目 Memory | <project>/.../memory/ | 仅此项目 | SessionStart 加载到 Context |
| 全局 CLAUDE.md | ~/.claude/CLAUDE.md | 所有项目 | 兜底参考 |

---

## 总结

**多项目支持的核心**：
1. **自动检测** — session-start.js 根据 .git/.sln/.csproj 识别项目
2. **路径转换** — 统一管理不同位置的项目
3. **优先级隔离** — 项目级配置优先，避免冲突
4. **独立 Memory** — 每个项目有独立的知识沉淀
5. **无缝切换** — 切换项目时自动加载正确的配置

**理想状态**：
- 可管理无限多个项目
- 每个项目有独立的 Context 和 Memory
- 切换项目时自动适配规则
- 几个月后回到旧项目，所有经验都还在
