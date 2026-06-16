# Harness Engineering 架构

> 基于《Harness Engineering 建设指南（个人研发效能版）》构建的系统架构

---

## 整体架构（符合指南运行模型）

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户输入                                  │
│                   "开发一个设备管理功能"                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Commands（斜杠命令）                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ /explore │ │ /build   │ │ /operate │ │ /review  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐                                     │
│  │ /test    │ │ /commit  │                                     │
│  └──────────┘ └──────────┘                                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Context Router                               │
│              workflow-router.js (Hook)                          │
│              自动检测触发词 → 注入路由上下文                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Workflows（工作流）                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │  explore.js  │ │  build.js    │ │  operate.js  │            │
│  │  需求探索    │ │  功能开发    │ │  问题排查    │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Decision Framework                           │
│                    Agents（角色）                                │
│  ┌────────────────────────┐ ┌────────────────────────┐          │
│  │   builder-agent.md     │ │   operator-agent.md    │          │
│  │   设计/开发/测试        │ │   排查/优化/运维        │          │
│  │   color: green         │ │   color: red           │          │
│  └────────────────────────┘ └────────────────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Artifact Generation                          │
│                    Skills（技能）                                │
│                                                                  │
│  Requirement    Design        Coding        Testing              │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │requirements│ │arch-review│ │code-review│ │generate-  │       │
│  │           │ │sql-best-  │ │-workflow  │ │tests      │       │
│  │           │ │practices  │ │dev-workflow│ │test-runner│       │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
│                                                                  │
│  Troubleshooting   Shared                                       │
│  ┌───────────┐ ┌───────────────────────────────────┐            │
│  │systematic-│ │docs                               │            │
│  │debugging  │ │commit                             │            │
│  │perf-tune  │ │verification-before-completion     │            │
│  └───────────┘ └───────────────────────────────────┘            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Evidence Collection                          │
│              实际命令输出（dotnet build/test）                    │
│              日志、SQL、代码、配置、监控数据                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Verification                                 │
│              build-verify.js (Stop Hook)                        │
│              编译验证 + 测试验证 = 双门禁                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Quality Gate                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │Require- │ │ Design  │ │  Code   │ │  Test   │ │Release  │  │
│  │ment Gate│ │  Gate   │ │  Gate   │ │  Gate   │ │  Gate   │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Delivery                                     │
│              输出交付物（Requirement.md, Code, RCA.md 等）       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 组件关系

```
.claude/
├── CLAUDE.md（全局指令）
│   └── 引用 rules/ 和 RTK.md
│
├── commands/（斜杠命令 - 简单入口）
│   ├── explore.md      → /explore（需求探索）
│   ├── build.md        → /build（功能开发）
│   ├── operate.md      → /operate（问题排查）
│   ├── review.md       → /review（代码审查）
│   ├── test.md         → /test（测试执行）
│   └── commit.md       → /commit（Git 提交）
│
├── workflows/（工作流 - 复杂编排）
│   ├── explore.js      → 需求探索流程
│   ├── build.js        → 功能开发流程
│   └── operate.js      → 问题排查流程
│
├── agents/（角色 - 执行单元）
│   ├── builder-agent.md   → 设计、开发、测试
│   └── operator-agent.md  → 排查、优化、运维
│
├── skills/（技能 - 专业能力）
│   ├── requirements/      → Requirement
│   ├── arch-review/       → Design
│   ├── sql-best-practices/→ Design
│   ├── code-review-workflow/ → Coding
│   ├── dev-workflow/      → Coding
│   ├── generate-tests/    → Testing
│   ├── test-runner/       → Testing
│   ├── systematic-debugging/ → Troubleshooting
│   ├── perf-tune/         → Troubleshooting
│   ├── docs/              → Shared
│   ├── commit/            → Shared
│   └── verification-before-completion/ → Shared
│
├── rules/（核心规则 - 自动加载）
│   ├── quality/
│   │   ├── gates.md       → 5 级质量门禁（33 行）
│   │   └── verification.md → 验证规则（24 行）
│   └── tools/
│       ├── code-access.md → 代码访问规则（26 行）
│       └── token-optimization.md → Token 优化（21 行）
│
├── knowledge/（知识库 - 按需加载）
│   ├── rules/              → 按需加载的 rules（详细说明）
│   │   ├── INDEX.md        → 规则索引
│   │   ├── code-access/    → 代码访问规则详细说明
│   │   ├── gates/          → 质量门禁详细说明
│   │   ├── verification/   → 验证规则详细说明
│   │   ├── token-optimization/ → Token 优化详细说明
│   │   ├── workflows/      → 工作流规则
│   │   ├── quality/        → 质量规则
│   │   ├── tools/          → 工具规则
│   │   └── languages/      → 语言规则
│   ├── engineering/        → 工程知识
│   │   ├── INDEX.md        → 工程知识索引
│   │   └── *.md            → 具体知识文件
│   ├── project/            → 项目知识
│   │   ├── INDEX.md        → 项目知识索引
│   │   └── *.md            → 具体知识文件
│   └── business/           → 业务知识
│       ├── INDEX.md        → 业务知识索引
│       └── *.md            → 具体知识文件
│
├── hooks/（自动化）
│   ├── PreToolUse: secret-guard, write-guard, impact-guard
│   ├── PostToolUse: cs-guard, quality-guard, test-reminder, sqlite-index-update, git-commit-review
│   ├── UserPromptSubmit: workflow-router, inject-git-rules, inject-token-rules
│   ├── SessionStart: session-start
│   └── Stop: build-verify
│
├── memory/（决策/约束/进度 - 自动加载）
│   ├── MEMORY.md              → 记忆索引
│   ├── harness-engineering-lessons.md → Harness Engineering 建设教训
│   ├── long-conversation-pitfalls.md → 长对话陷阱
│   └── *.md                   → 其他经验文件
│
├── docs/（文档中心 - 给人看的）
│   ├── README.md              → 导航中心
│   ├── DIRECTORY-GUIDE.md     → 目录结构指南
│   ├── HARNESS-ENGINEERING.md → Harness Engineering 理念与设计
│   └── *.md                   → 其他文档
│
├── skills/（技能 - 按需调用）
│   ├── INDEX.md               → Skills 索引
│   ├── requirements/          → 需求分析
│   ├── arch-review/           → 架构审查
│   ├── dev-workflow/          → 开发工作流
│   ├── code-review-workflow/  → 代码审查
│   ├── generate-tests/        → 生成测试
│   ├── test-runner/           → 测试执行
│   ├── systematic-debugging/  → 系统化调试
│   ├── perf-tune/             → 性能调优
│   ├── sql-best-practices/    → SQL 最佳实践
│   ├── docs/                  → 文档生成
│   ├── commit/                → Git 提交
│   ├── adversarial-review/    → 对抗审查
│   ├── verification-before-completion/ → 验证门禁
│   ├── sync-knowledge/        → 知识同步
│   ├── skill-manager/         → 技能管理
│   └── sync-source-index/     → 源码索引同步
│
├── agents/（Agent - 按需调用）
│   ├── builder-agent.md       → 设计/开发/测试 Agent
│   └── operator-agent.md      → 排查/优化/运维 Agent
│
└── projects/（项目级数据）
    └── <project-path>/
        └── memory/
            ├── MEMORY.md      → 项目记忆索引
            └── *.md           → 项目经验文件
```

---

## 数据流

```
用户输入 "开发一个设备管理功能"
    │
    ├─→ workflow-router.js 检测到"开发"关键词
    │   └─→ 注入路由上下文：建议使用 /build
    │
    ├─→ /build 命令触发 build.js 工作流
    │   ├─→ Phase 1: 需求探索（调用 requirements skill）
    │   │   └─→ 输出 Requirement.md
    │   │
    │   ├─→ Phase 2: 设计（调用 arch-review skill）
    │   │   └─→ Design Gate 检查
    │   │   └─→ 输出 Architecture.md, Design.md
    │   │
    │   ├─→ Phase 3: 编码（调用 builder-agent）
    │   │   └─→ Code Gate 检查（dotnet build）
    │   │   └─→ 输出 Code
    │   │
    │   ├─→ Phase 4: 测试（调用 test-runner skill）
    │   │   └─→ Test Gate 检查（dotnet test）
    │   │   └─→ 输出 TestPlan.md
    │   │
    │   └─→ Phase 5: 验证（verification-before-completion）
    │       └─→ Release Gate 检查
    │       └─→ 输出交付物
    │
    └─→ build-verify.js (Stop Hook)
        └─→ 编译 + 测试双门禁
        └─→ 通过 → 允许结束
        └─→ 失败 → 阻断会话
```

---

## 组件职责矩阵

| 组件 | 职责 | 触发方式 | 输出 |
|------|------|---------|------|
| **Commands** | 用户入口 | `/命令` | 调用 Workflow |
| **Workflows** | 流程编排 | Command 触发 | 阶段性交付物 |
| **Agents** | 任务执行 | Workflow 调用 | 分析结果 |
| **Skills** | 专业能力 | Agent/Workflow 调用 | 专业输出 |
| **Quality Gates** | 质量把关 | 阶段完成时 | 通过/不通过 |
| **Hooks** | 自动化 | 生命周期事件 | 拦截/注入/验证 |
| **Rules** | 规范约束 | 条件加载 | 指导性规则 |
| **Memory** | 决策记录 | 会话中 | 经验沉淀 |
| **Knowledge** | 技术知识 | 按需加载 | 参考资料 |

---

## 核心设计原则

### 1. Context First（最小上下文）
- Skills 拆分为 SKILL.md + references/
- SKILL.md 只包含核心流程指令
- 详细材料放在 references/ 按需加载

### 2. Artifact First（交付物驱动）
- 每个 Workflow 有明确的输入/输出
- 输出必须是具体交付物（.md, .code, .test）

### 3. Evidence First（证据优先）
- 所有结论必须有实际命令输出作为证据
- 不能声称成功但没有实际验证

### 4. Verification First（验证优先）
- verification-before-completion skill
- build-verify.js Stop Hook

### 5. Quality Gate First（质量门禁）
- 5 级门禁体系
- 每个阶段必须通过门禁

### 6. Automation First（自动化优先）
- 17 个 Hooks 覆盖确定性验证
- 能 Hook 的不交给 AI

---

## 更新记录

| 日期 | 版本 | 内容 |
|------|------|------|
| 2026-06-16 | 4.0 | 本次优化：核心规则+参考规则分离、knowledge层次化索引、路径修正 |
| 2026-06-11 | 3.0 | 重构架构图，符合《建设指南》运行模型；新增组件关系图和数据流图 |
| 2026-06-10 | 2.0 | 添加 workflow-router、session-start、build-verify |
| 2026-06-04 | 1.0 | 初始版本 |

---

## 本次优化（v4.0）

### 优化内容

#### 1. 核心规则 + 参考规则分离

**问题**：Claude Code 会递归扫描 `~/.claude/rules/` 目录，所有规则都会被自动加载。

**解决方案**：
- **核心规则**（`~/.claude/rules/`）：自动加载，只保留最关键的规则（104 行）
- **参考规则**（`~/.claude/knowledge/rules/`）：按需加载，包含完整的说明、示例、最佳实践

**效果**：
- Token 节省 82%（574 行 → 104 行）
- 核心规则精简到 1.5k tokens

#### 2. knowledge 层次化索引

**问题**：`knowledge/MEMORY.md` 直接链接到所有文件，内容太长。

**解决方案**：
- **总索引**（`knowledge/MEMORY.md`）：只链接到各分类索引
- **分类索引**（`knowledge/*/INDEX.md`）：链接到该分类下的具体文件
- **具体文件**：实际的知识内容

**效果**：
- 层次清晰：总索引 → 分类索引 → 具体文件
- 易于维护：每个分类有自己的索引
- 按需加载：可以只加载某个分类的索引

#### 3. 路径修正

**问题**：rules 从 `engineering/rules/` 移动到 `knowledge/rules/`，需要更新所有引用路径。

**解决方案**：
- 更新了所有引用 `knowledge/engineering/rules/` 的地方
- 检查了所有引用 rules 的地方，确保路径正确

**效果**：
- 路径一致性 100%（0 个旧路径）
- 所有配置文件路径正确

#### 4. 知识同步方法

**问题**：项目经验如何正确提炼到全局知识库？

**解决方案**：
- 不能直接复制项目经验
- 要先读取内容、判断是否过时、分析通用性
- 只提炼真正有价值的通用知识

**效果**：
- 创建了 2 个高价值知识文件
- 建立了知识同步方法论

#### 5. 索引设计原则

**问题**：索引文件应该包含什么内容？

**解决方案**：
- 给 Claude 读取的索引：只保留索引内容（名称、路径、简短说明）
- 给人看的文档：放在 docs/ 目录，包含详细说明、示例、使用方法

**效果**：
- 区分了两种不同的文档类型
- 索引文件更加简洁

### 优化成果

| 成果 | 量化 |
|------|------|
| Token 节省 | 82%（574 行 → 104 行） |
| 知识库结构 | 层次化索引（总索引 → 分类索引 → 具体文件） |
| 规则架构 | 核心规则 + 参考规则分离 |
| 沉淀文件 | 3 个（rules-architecture、knowledge-sync-method、index-design） |
| 路径一致性 | 100%（0 个旧路径） |

### 详细说明

详见 [DIRECTORY-GUIDE.md](DIRECTORY-GUIDE.md)（目录结构指南）。
