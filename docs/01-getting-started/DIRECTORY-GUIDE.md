# 目录结构指南

> 详细说明 Claude Code 全局配置中各文件夹、分类的作用，以及整体如何协调实现 Harness Engineering 工程。

**版本**：v1.1.0 | **最后更新**：2026-06-16

---

## 目录结构总览

```
~/.claude/
├── rules/                    # 核心规则（自动加载）
│   ├── tools/               # 工具规则
│   └── quality/             # 质量规则
│
├── knowledge/               # 知识库（按需加载）
│   ├── rules/               # 按需加载的 rules
│   ├── engineering/         # 工程知识
│   ├── project/             # 项目知识
│   └── business/            # 业务知识
│
├── memory/                  # 记忆（会话级）
├── docs/                    # 文档（给人看的）
├── skills/                  # 技能（按需调用）
├── agents/                  # Agent（按需调用）
├── hooks/                   # 钩子（自动触发）
└── projects/                # 项目级数据
```

---

## 一、rules/ 目录（核心规则）

### 位置
```
~/.claude/rules/
├── tools/
│   ├── code-access.md          # 代码访问规则（26 行）
│   └── token-optimization.md   # Token 优化规则（21 行）
└── quality/
    ├── gates.md                # 质量门禁规则（33 行）
    └── verification.md         # 验证规则（24 行）
```

### 作用
- **自动加载**：每次会话启动时自动加载到上下文
- **核心规则**：只包含最关键的规则，精简到 104 行
- **强制遵守**：这些规则必须遵守，不可跳过

### 内容
| 文件 | 行数 | 内容 |
|------|------|------|
| code-access.md | 26 | 加密项目代码访问决策树、反模式 |
| token-optimization.md | 21 | RTK 使用、工具选择、Think-in-Code |
| gates.md | 33 | 5 个质量门禁概览、执行规则 |
| verification.md | 24 | PASS/FAIL 条件、验证纪律 |

### 加载方式
- **自动加载**：Claude Code 启动时自动扫描并加载
- **每次会话**：都会加载到上下文中
- **Token 消耗**：约 1.5k tokens

---

## 二、knowledge/ 目录（知识库）

### 位置
```
~/.claude/knowledge/
├── MEMORY.md                    # 总索引（链接到各分类索引）
├── rules/                       # 按需加载的 rules
│   ├── INDEX.md                 # 规则索引
│   ├── code-access/             # 代码访问规则详细说明
│   ├── gates/                   # 质量门禁详细说明
│   ├── verification/            # 验证规则详细说明
│   ├── token-optimization/      # Token 优化详细说明
│   ├── workflows/               # 已废弃，保留为空目录
│   ├── quality/                 # 质量规则
│   ├── tools/                   # 工具规则
│   └── languages/               # 语言规则
├── engineering/                 # 工程知识
│   ├── INDEX.md                 # 工程知识索引
│   └── *.md                     # 具体知识文件
├── project/                     # 项目知识
│   ├── INDEX.md                 # 项目知识索引
│   └── *.md                     # 具体知识文件
└── business/                    # 业务知识
    ├── INDEX.md                 # 业务知识索引
    └── *.md                     # 具体知识文件
```

### 作用
- **按需加载**：需要时再读取，不自动加载
- **详细说明**：包含完整的说明、示例、最佳实践
- **层次化索引**：总索引 → 分类索引 → 具体文件

### 子目录说明

#### 2.1 rules/ 目录（按需加载的 rules）
**与 `~/.claude/rules/` 的区别**：

| 特性 | `~/.claude/rules/` | `~/.claude/knowledge/rules/` |
|------|-------------------|------------------------------|
| 加载方式 | 自动加载 | 按需加载 |
| 内容 | 核心规则（精简） | 详细说明（完整） |
| Token 消耗 | 每次都消耗 | 需要时才消耗 |
| 用途 | 强制遵守 | 参考学习 |

**包含的规则**：
- **code-access/**：DGClient 加密机制、三套索引系统、写入规则、决策树
- **gates/**：5 个质量门禁的详细检查项
- **verification/**：验证流程、验证纪律
- **token-optimization/**：RTK 使用、工具选择、Think-in-Code
- **workflows/**：已废弃，保留为空目录
- **quality/**：审查清单、Hooks 标准
- **tools/**：模型策略、安全规则
- **languages/**：C#、JavaScript、Vue、SQL Server、PostgreSQL 规范

#### 2.2 engineering/ 目录（工程知识）
**包含的内容**：
- **工程知识**：DGClient 加密机制、索引系统分工、Agent 使用原则等
- **Claude Code 配置**：Rules 架构设计、知识同步方法、索引设计原则
- **.NET 知识**：异步约束、Options 模式陷阱

#### 2.3 project/ 目录（项目知识）
**包含的内容**：
- 项目特定的知识（待添加）

#### 2.4 business/ 目录（业务知识）
**包含的内容**：
- 业务流程、业务规则、术语表（待添加）

### 加载方式
- **按需加载**：需要时再读取
- **通过索引**：先读取 INDEX.md，再读取具体文件
- **通过 ctx_search**：语义搜索知识库
- **通过手动读取**：`cat ~/.claude/knowledge/xxx/xxx.md`

---

## 三、memory/ 目录（记忆）

### 位置
```
~/.claude/memory/
├── MEMORY.md                          # 记忆索引
├── harness-engineering-lessons.md     # Harness Engineering 建设教训
├── long-conversation-pitfalls.md      # 长对话陷阱
├── encrypted-file-editing.md          # 加密文件编辑
├── encrypted-file-git-blob-workflow.md # 加密文件 Git 工作流
├── git-status-encrypted-diff.md       # Git 状态加密差异
└── vue2-i18n-rules.md                 # Vue 2 国际化规则
```

### 作用
- **会话级**：每次会话都会加载
- **经验沉淀**：记录决策、约束、技术经验
- **自动加载**：Claude Code 启动时自动加载

### 内容
| 文件 | 类型 | 内容 |
|------|------|------|
| harness-engineering-lessons.md | feedback | Harness Engineering 建设教训 |
| long-conversation-pitfalls.md | reference | 长对话陷阱与解决方案 |
| encrypted-file-editing.md | reference | DGClient 加密文件编辑规则 |
| encrypted-file-git-blob-workflow.md | reference | 加密文件 Git 工作流 |
| git-status-encrypted-diff.md | reference | Git 状态加密差异处理 |
| vue2-i18n-rules.md | reference | Vue 2 + Element UI 国际化规则 |

### 加载方式
- **自动加载**：Claude Code 启动时自动加载
- **每次会话**：都会加载到上下文中
- **Token 消耗**：约 2-3k tokens

---

## 四、docs/ 目录（文档中心）

### 位置
```
~/.claude/docs/
├── README.md                         # 导航中心
├── DIRECTORY-GUIDE.md                # 目录结构指南（本文件）
├── HARNESS-ENGINEERING.md            # Harness Engineering 理念与设计
├── SETUP.md                          # 复用指南
├── USAGE.md                          # 日常使用指南
├── QUICK-REFERENCE.md                # 一页纸速查表
├── SETTINGS-GUIDE.md                 # settings.json 配置详解
├── LONG-CONVERSATION-PITFALLS.md     # 长对话陷阱与解决方案
├── claude-code-commands.md           # Claude Code 命令完整参考
├── ARCHITECTURE.md                   # 架构图 + 组件关系 + 数据流
├── HOOKS.md                          # Hook 工作原理 + 触发时机
├── TOKEN-SAVINGS.md                  # Token 节省机制说明
├── workflow.md                       # 完整工作流说明
├── agent-roles.md                    # Agent 角色定义
├── cross-project.md                  # 跨项目工作流
├── review-audit.md                   # 审查审计机制
├── iteration.md                      # 自动迭代机制
├── MEMORY.md                         # Memory 机制说明
├── PROJECTS.md                       # 项目管理说明
├── PROJECT-INIT-CHECKLIST.md         # 项目启动清单
├── CLAUDE-template.md                # 全局 CLAUDE.md 模板
└── templates/                        # 模板文件
```

### 作用
- **给人看的文档**：帮助用户理解和使用系统
- **不自动加载**：不会被 Claude Code 自动扫描
- **详细说明**：包含完整的说明、示例、最佳实践

### 与 knowledge/ 的区别

| 特性 | docs/ | knowledge/ |
|------|-------|-----------|
| 目标受众 | 人 | Claude |
| 加载方式 | 不自动加载 | 按需加载 |
| 内容 | 详细说明、使用指南 | 索引、规则、知识 |
| 格式 | Markdown（丰富） | Markdown（简洁） |

---

## 五、skills/ 目录（技能）

### 位置
```
~/.claude/skills/
├── INDEX.md                      # Skills 索引
├── requirements/                 # 需求分析
├── research/                     # 深度调研
├── arch-review/                  # 架构审查
├── dev-workflow/                 # 开发工作流
├── review/                       # 代码审查与深度审计
├── test/                         # 测试管理
├── sync/                         # 同步管理
├── systematic-debugging/         # 系统化调试
├── perf-tune/                    # 性能调优
├── sql-best-practices/           # SQL 最佳实践
├── docs/                         # 文档生成
├── commit/                       # Git 提交
├── verification-before-completion/ # 验证门禁
└── skill-manager/                # 技能管理
```

### 作用
- **按需调用**：用户输入 `/skill-name` 时调用
- **封装流程**：每个 Skill 封装一个完整的工作流程
- **可复用**：多个项目可以共享同一套 Skills
- **智能路由**：用户说意图，agent 自动决定策略

### Skills 分类

| 类别 | Skills | 用途 |
|------|--------|------|
| 需求 | requirements, research | 需求分析、深度调研 |
| 设计 | arch-review, sql-best-practices | 架构审查、SQL 最佳实践 |
| 开发 | dev-workflow, commit, sync, test | 开发、提交、同步、测试 |
| 审查 | review | 代码审查与深度审计 |
| 验证 | verification-before-completion | 验证门禁 |
| 调试 | systematic-debugging, perf-tune | 调试、性能调优 |
| 文档 | docs | 文档生成 |
| 管理 | skill-manager | 技能管理 |

### 调用方式
- **斜杠命令**：用户输入 `/skill-name`
- **触发词**：hook 自动检测触发词并注入上下文
- **智能路由**：用户说意图，agent 自动决定策略

---

## 六、agents/ 目录（Agent）

### 位置
```
~/.claude/agents/
├── builder-agent.md    # 设计/开发/测试 Agent
└── operator-agent.md   # 排查/优化/运维 Agent
```

### 作用
- **按需调用**：被 Skills 调用
- **执行单元**：负责具体的执行任务
- **角色分离**：不同角色负责不同任务

### Agent 分类

| Agent | 职责 | 颜色 |
|-------|------|------|
| builder-agent | 设计、开发、测试 | green |
| operator-agent | 排查、优化、运维 | red |

### 调用方式
- **被 Skills 调用**：Skills 内部调用 Agent 执行任务
- **被 Skills 调用**：Skills 内部调用 Agent 执行任务
- **手动调用**：Claude 根据上下文自动选择

---

## 七、hooks/ 目录（钩子）

### 位置
```
~/.claude/hooks/
├── session-start.js              # SessionStart: 加载项目知识
├── project-knowledge.js          # SessionStart: 加载项目经验
├── context-injector.js           # UserPromptSubmit: 智能注入规则
├── skill-router.js            # UserPromptSubmit: 工作流路由
├── secret-guard.js               # PreToolUse: 密钥防护
├── write-guard.js                # PreToolUse: 文件写入防护
├── bash-guard.js                 # PreToolUse: Bash 安全检查
├── impact-guard.js               # PreToolUse: 修改前影响分析
├── encrypted-write-guard.js      # PreToolUse: 加密文件写入防护
├── cs-guard.js                   # PostToolUse: C# 语法检查
├── quality-guard.js              # PostToolUse: 质量检查
├── logic-guard.js                # PostToolUse: 逻辑错误检查
├── vue-guard.js                  # PostToolUse: Vue 代码检查
├── test-reminder.js              # PostToolUse: 测试提醒
├── sqlite-index-update.js        # PostToolUse: SQLite 索引更新
├── git-commit-review.js          # PostToolUse: Git 提交审查
├── review-trigger.js             # PostToolUse: 代码审查提醒
├── artifact-index-update.js      # PostToolUse: Artifact 索引更新
├── build-verify.js               # Stop: 编译验证
├── metrics-collector.js          # PostToolUse: 度量收集
├── metrics-report.js             # Stop: 度量报告
├── notify.ps1                    # Notification: Windows 通知
└── learning-recorder.js          # PostToolUse: 经验记录
```

### 作用
- **自动触发**：在特定事件发生时自动执行
- **质量保证**：自动检查代码质量、安全性
- **流程自动化**：自动注入规则、路由工作流

### Hook 分类

| 类别 | Hooks | 触发时机 |
|------|-------|---------|
| 会话启动 | session-start.js, project-knowledge.js | 会话启动时 |
| 用户输入 | context-injector.js, skill-router.js | 用户输入时 |
| 工具使用前 | secret-guard.js, write-guard.js, bash-guard.js 等 | 工具使用前 |
| 工具使用后 | cs-guard.js, quality-guard.js, test-reminder.js 等 | 工具使用后 |
| 会话结束 | build-verify.js, metrics-report.js | 会话结束时 |
| 通知 | notify.ps1 | 任务完成时 |

### 配置位置
- **配置文件**：`~/.claude/settings.json`
- **Hook 文件**：`~/.claude/hooks/`

---

## 八、projects/ 目录（项目级数据）

### 位置
```
~/.claude/projects/
├── F--Code-WorkSpace-pcs-crontabservice/
│   └── memory/
│       ├── MEMORY.md              # 项目记忆索引
│       └── *.md                   # 项目经验文件
├── F--Code-WorkSpace-pcs-webbackend/
│   └── memory/
│       ├── MEMORY.md              # 项目记忆索引
│       └── *.md                   # 项目经验文件
└── ...
```

### 作用
- **项目特定**：每个项目有自己的记忆和经验
- **自动加载**：会话启动时自动加载项目级经验
- **经验沉淀**：记录项目特定的经验和教训

### 目录命名规则
- 路径转换：`C:\Users\admin` → `C--Users-admin`
- 路径分隔：`/` 或 `\` → `-`
- 示例：`F:/Code WorkSpace/pcs.crontabservice` → `F--Code-WorkSpace-pcs-crontabservice`

### 加载方式
- **自动加载**：`project-knowledge.js` hook 自动加载
- **加载内容**：`memory/learnings.md`（最近 20 行）
- **加载时机**：会话启动时

---

## 九、整体协调：如何实现 Harness Engineering

### 9.1 架构设计

```
用户输入
  ↓
hooks 自动注入规则（context-injector.js）
  ↓
Claude 根据规则执行任务
  ↓
生成高质量代码
  ↓
质量门禁验证（gates.md + verification.md）
  ↓
经验沉淀到 knowledge（project-knowledge.js）
  ↓
下次会话自动加载经验
```

### 9.2 核心原则

#### 1. Context First（最小上下文）
- **核心规则**：自动加载（104 行，1.5k tokens）
- **参考规则**：按需加载（需要时再读取）
- **知识库**：按需加载（通过索引查找）

#### 2. Artifact First（围绕交付物）
- **每个阶段有产物**：需求、设计、代码、测试、RCA
- **产物可追溯**：版本控制、归档
- **产物可复用**：下次类似功能可参考

#### 3. Evidence First（所有结论必须有证据）
- **验证规则**：退出码为王
- **必须运行命令**：不能声称成功但没有实际运行
- **必须给出证据**：实际运行的命令和返回内容

#### 4. Verification First（生成不等于正确）
- **质量门禁**：5 个 Gate 的检查项
- **验证流程**：编译验证 + 测试验证
- **验证纪律**：退出码为王，不主观放宽

#### 5. Quality Gate First（围绕质量门建设）
- **Requirement Gate**：需求探索完成后
- **Design Gate**：设计完成后
- **Code Gate**：编码完成后
- **Test Gate**：测试完成后
- **Release Gate**：发布前

#### 6. Automation First（能 Hook 的不要交给 AI）
- **自动注入规则**：context-injector.js
- **自动质量检查**：cs-guard.js, quality-guard.js
- **自动验证**：build-verify.js
- **自动路由**：skill-router.js

### 9.3 工作流程

#### 需求沟通
```
用户输入需求
  ↓
/requirements（需求分析 Skill）
  ↓
生成 Requirement.md
  ↓
Requirement Gate 验证
```

#### 架构设计
```
/arch-review（架构审查 Skill）
  ↓
生成 Architecture.md
  ↓
Design Gate 验证
```

#### 功能开发
```
/dev-workflow（开发工作流 Skill）
  ↓
生成代码
  ↓
Code Gate 验证（编译 + 审查）
```

#### 功能测试
```
/test（测试管理 Skill）
  ↓
自动判断生成还是执行测试
  ↓
Test Gate 验证（所有测试通过）
```

#### 问题排查
```
/systematic-debugging（系统化调试 Skill）
  ↓
定位问题
  ↓
修复问题
  ↓
Code Gate 验证
```

### 9.4 Token 节省机制

#### 核心规则精简
- **修改前**：574 行（~5.7k tokens）
- **修改后**：104 行（~1.5k tokens）
- **节省**：82%

#### 按需加载
- **核心规则**：自动加载（每次会话）
- **参考规则**：按需加载（需要时再读取）
- **知识库**：按需加载（通过索引查找）

#### RTK 自动压缩
- **自动压缩**：每次 Bash 调用前自动压缩输出
- **节省比例**：平均 47%

### 9.5 质量保证机制

#### 自动检查
- **代码质量**：cs-guard.js, quality-guard.js
- **逻辑错误**：logic-guard.js
- **安全性**：secret-guard.js
- **Vue 代码**：vue-guard.js

#### 自动验证
- **编译验证**：build-verify.js（会话结束时）
- **测试验证**：test-reminder.js（代码修改后）

#### 自动记录
- **经验记录**：learning-recorder.js
- **SQLite 索引更新**：sqlite-index-update.js

---

## 十、最佳实践

### 10.1 新增规则

**核心规则**（放在 `~/.claude/rules/`）：
- 只包含最关键的规则
- 精简到 50 行以内
- 包含决策树和反模式

**参考规则**（放在 `~/.claude/knowledge/rules/`）：
- 包含完整的说明、示例、最佳实践
- 可以很长
- 通过索引查找

### 10.2 新增知识

**工程知识**（放在 `~/.claude/knowledge/engineering/`）：
- 通用的工程规范
- 工具使用技巧
- 编码规范

**项目知识**（放在 `~/.claude/knowledge/project/`）：
- 项目特定的知识
- API 约定
- 数据库设计

**业务知识**（放在 `~/.claude/knowledge/business/`）：
- 业务流程
- 业务规则
- 术语表

### 10.3 新增 Skill

**位置**：`~/.claude/skills/skill-name/`

**文件结构**：
```
skill-name/
├── SKILL.md          # Skill 定义
└── references/       # 参考文档
```

**SKILL.md 内容**：
- 触发词
- 输入参数
- 执行流程
- 输出格式

### 10.4 新增 Hook

**位置**：`~/.claude/hooks/hook-name.js`

**配置位置**：`~/.claude/settings.json`

**Hook 类型**：
- SessionStart：会话启动时
- UserPromptSubmit：用户输入时
- PreToolUse：工具使用前
- PostToolUse：工具使用后
- Stop：会话结束时

---

## 十一、常见问题

### Q1: 为什么有两个 rules 目录？

**A**: 因为加载方式不同：
- `~/.claude/rules/`：自动加载（核心规则）
- `~/.claude/knowledge/rules/`：按需加载（参考规则）

### Q2: 如何选择放在哪个目录？

**A**: 根据使用频率：
- **每次都用**：放在 `~/.claude/rules/`
- **偶尔用到**：放在 `~/.claude/knowledge/rules/`

### Q3: 如何新增规则？

**A**: 
1. 判断是否为核心规则
2. 核心规则：放在 `~/.claude/rules/`，精简到 50 行以内
3. 参考规则：放在 `~/.claude/knowledge/rules/`，可以详细

### Q4: 如何新增知识？

**A**:
1. 判断知识类型（工程/项目/业务）
2. 放在对应的目录
3. 更新 INDEX.md 索引

### Q5: 如何新增 Skill？

**A**:
1. 在 `~/.claude/skills/` 下创建目录
2. 创建 SKILL.md 文件
3. 更新 skills/INDEX.md 索引

---

## 十二、总结

### 本次优化的成果

| 成果 | 量化 |
|------|------|
| Token 节省 | 82%（574 行 → 104 行） |
| 知识库结构 | 层次化索引（总索引 → 分类索引 → 具体文件） |
| 规则架构 | 核心规则 + 参考规则分离 |
| 沉淀文件 | 3 个（rules-architecture、knowledge-sync-method、index-design） |
| 路径一致性 | 100%（0 个旧路径） |

### Harness Engineering 的实现

1. **Context First**：最小上下文，最大有效信息密度
2. **Artifact First**：所有工作围绕交付物展开
3. **Evidence First**：所有结论必须有证据
4. **Verification First**：生成不等于正确，必须验证
5. **Quality Gate First**：围绕质量门建设 Harness
6. **Automation First**：能 Hook 的不要交给 AI

**现在可以开始高质量工作了！**
