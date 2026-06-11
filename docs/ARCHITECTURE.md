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
├── rules/（规则）
│   ├── quality/
│   │   ├── gates.md       → 5 级质量门禁
│   │   ├── review-checklist.md → 审查清单
│   │   └── verification.md → 验证规则
│   ├── tools/
│   │   ├── code-access.md → 代码访问规则
│   │   ├── model-strategy.md → 模型策略
│   │   ├── security.md    → 安全规则
│   │   └── token-optimization.md → Token 优化
│   └── workflows/
│       ├── git.md         → Git 规范
│       └── workflows.md   → 工作流触发规则
│
├── hooks/（自动化）
│   ├── PreToolUse: secret-guard, write-guard, impact-guard
│   ├── PostToolUse: cs-guard, quality-guard, test-reminder, sqlite-index-update, git-commit-review
│   ├── UserPromptSubmit: workflow-router, inject-git-rules, inject-token-rules
│   ├── SessionStart: session-start
│   └── Stop: build-verify
│
├── memory/（决策/约束/进度）
│   ├── harness-engineering-lessons.md
│   └── long-conversation-pitfalls.md
│
└── knowledge/（技术知识）
    ├── engineering/  → 工程规范
    ├── project/      → 项目知识
    └── business/     → 业务知识
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
| 2026-06-11 | 3.0 | 重构架构图，符合《建设指南》运行模型；新增组件关系图和数据流图 |
| 2026-06-10 | 2.0 | 添加 workflow-router、session-start、build-verify |
| 2026-06-04 | 1.0 | 初始版本 |
