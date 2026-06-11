# Harness Engineering 文档中心

> 基于《Harness Engineering 建设指南（个人研发效能版）》构建的个人研发效能系统

## 文档总览

Claude Code 全自动工作流配置，覆盖需求→设计→开发→测试→排查→审查全流程。

**核心理念：**
- Context First — 最小上下文，最大有效信息密度
- Artifact First — 所有工作围绕交付物展开
- Evidence First — 所有结论必须有证据
- Verification First — 生成不等于正确，必须验证
- Quality Gate First — 围绕质量门建设 Harness
- Automation First — 能 Hook 的不要交给 AI

---

## 文档结构

```
docs/
├── README.md                         # 本文档（导航中心）
├── claude-code-commands.md           # Claude Code 命令完整参考
├── SETUP.md                          # 复用指南（换电脑/分享给同事）
├── ARCHITECTURE.md                   # 架构图 + 组件关系 + 数据流
├── USAGE.md                          # 日常使用指南 + 工作流示例
├── HOOKS.md                          # Hook 工作原理 + 触发时机
├── TOKEN-SAVINGS.md                  # Token 节省机制说明
├── workflow.md                       # 完整工作流说明
├── agent-roles.md                    # Agent 角色定义
├── cross-project.md                  # 跨项目工作流
├── review-audit.md                   # 审查审计机制
├── iteration.md                      # 自动迭代机制
├── CLAUDE-template.md                # 全局 CLAUDE.md 模板
└── templates/
    └── interface-contract.md         # 接口契约模板
```

---

## 系统架构（符合指南）

```
┌─────────────────────────────────────────────────────┐
│                   用户输入                            │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│              Commands（斜杠命令）                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ /explore │ │ /build   │ │ /operate │             │
│  └──────────┘ └──────────┘ └──────────┘             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ /review  │ │ /test    │ │ /commit  │             │
│  └──────────┘ └──────────┘ └──────────┘             │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│              Workflows（工作流）                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ explore  │ │ build    │ │ operate  │             │
│  │ .js      │ │ .js      │ │ .js      │             │
│  └──────────┘ └──────────┘ └──────────┘             │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│              Agents（角色）                           │
│  ┌──────────────────┐ ┌──────────────────┐          │
│  │ builder-agent    │ │ operator-agent   │          │
│  │ 设计/开发/测试    │ │ 排查/优化/运维    │          │
│  └──────────────────┘ └──────────────────┘          │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│              Skills（技能）                           │
│  Requirement │ Design │ Coding │ Testing │ Debug    │
│  requirements│ arch-  │ dev-   │ generate│systematic│
│              │ review │ workflow│ -tests │-debugging│
│              │ sql-   │ code-  │ test-  │ perf-    │
│              │ best   │ review │ runner │ tune     │
│              │-practic│-workflow│       │          │
│  Shared: docs, commit, verification-before-completion│
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│              Quality Gates（质量门禁）                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │Require- │ │ Design  │ │  Code   │               │
│  │ment Gate│ │  Gate   │ │  Gate   │               │
│  └─────────┘ └─────────┘ └─────────┘               │
│  ┌─────────┐ ┌─────────┐                            │
│  │  Test   │ │Release  │                            │
│  │  Gate   │ │  Gate   │                            │
│  └─────────┘ └─────────┘                            │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│              Hooks（自动化）                          │
│  确定性验证 │ 代码质量 │ 安全防护 │ 索引更新          │
└─────────────────────────────────────────────────────┘
```

---

## 组件统计（符合指南要求）

| 组件 | 指南要求 | 实际状态 | 符合度 |
|------|---------|---------|--------|
| **Workflows** | 3 个 | 3 个 | ✅ 100% |
| **Agents** | 2 个 | 2 个 | ✅ 100% |
| **Skills** | ≤15 个 | 12 个 | ✅ 100% |
| **Quality Gates** | 5 级 | 5 级 | ✅ 100% |
| **Commands** | - | 6 个 | ✅ |
| **Hooks** | 确定性验证 | 17 个 | ✅ 100% |

---

## 工作流体系

### Commands（斜杠命令）

| 命令 | 说明 | 对应 Workflow |
|------|------|--------------|
| `/explore` | 需求探索、技术调研、方案比较 | explore.js |
| `/build` | 功能开发全流程 | build.js |
| `/operate` | 问题排查、性能调优 | operate.js |
| `/review` | 多维度代码审查 | - |
| `/test` | 测试执行、失败修复 | - |
| `/commit` | Git 提交与工作空间管理 | - |

### Workflows（工作流）

| 工作流 | 职责 | 输入 | 输出 |
|--------|------|------|------|
| **explore.js** | 需求沟通、澄清、技术调研 | 问题 | Requirement.md, Decision.md |
| **build.js** | 架构设计、功能设计、编码、测试 | Requirement | Architecture.md, Design.md, Code |
| **operate.js** | 问题排查、日志分析、性能分析 | 故障 | RCA.md, Improvement.md |

### Agents（角色）

| 角色 | 职责 | 颜色 |
|------|------|------|
| **Builder** | 设计、开发、测试、代码审查、文档生成 | green |
| **Operator** | 排查问题、分析性能、探索代码、分析日志 | red |

### Skills（技能）

| 分类 | Skills | 数量 |
|------|--------|------|
| **Requirement** | requirements | 1 |
| **Design** | arch-review, sql-best-practices | 2 |
| **Coding** | code-review-workflow, dev-workflow | 2 |
| **Testing** | generate-tests, test-runner | 2 |
| **Troubleshooting** | systematic-debugging, perf-tune | 2 |
| **Shared** | docs, commit, verification-before-completion | 3 |
| **总计** | | **12** |

---

## Quality Gates（质量门禁）

| 门禁 | 时机 | 检查内容 | 通过条件 |
|------|------|---------|---------|
| **Requirement Gate** | 需求探索完成后 | 完整性、无歧义、可验收 | 所有检查项通过 |
| **Design Gate** | 设计完成后 | 满足需求、可扩展、风险 | 所有检查项通过 |
| **Code Gate** | 编码完成后 | 编译通过、审查通过 | 编译+审查通过 |
| **Test Gate** | 测试完成后 | 测试通过、覆盖率、回归 | 所有测试通过 |
| **Release Gate** | 发布前 | 风险评估、回滚方案 | 所有检查项通过 |

---

## Hooks（自动化）

| 事件 | Hook | 功能 |
|------|------|------|
| **SessionStart** | session-start.js | git 状态 + 项目检测 + task-state 恢复 |
| **UserPromptSubmit** | workflow-router.js | 自动路由到对应 workflow |
| **UserPromptSubmit** | inject-git-rules.js | 注入 git 规则 |
| **UserPromptSubmit** | inject-token-rules.js | 注入 token 优化规则 |
| **PreToolUse** | secret-guard.js | 拦截硬编码密钥 |
| **PreToolUse** | write-guard.js | 拦截主目录垃圾文件 |
| **PreToolUse** | impact-guard.js | 修改前提示查看调用链 |
| **PostToolUse** | cs-guard.js | C# 语法检查 |
| **PostToolUse** | quality-guard.js | SQL 注入/null 安全/资源释放 |
| **PostToolUse** | test-reminder.js | 提示运行测试 |
| **PostToolUse** | sqlite-index-update.js | 自动增量更新 SQLite 索引 |
| **PostToolUse** | git-commit-review.js | 阻止 force push、密钥泄露 |
| **Stop** | build-verify.js | 编译 + 测试双门禁 |

---

## Memory 与 Knowledge

### Memory（决策/约束/进度）

| 文件 | 类型 | 内容 |
|------|------|------|
| harness-engineering-lessons.md | feedback | Harness 建设教训 |
| long-conversation-pitfalls.md | feedback | 长对话陷阱 |

### Knowledge（技术知识）

| 目录 | 内容 | 文件数 |
|------|------|--------|
| knowledge/engineering/ | 工程规范、工具使用 | 5 |
| knowledge/project/ | 项目知识 | 0（待添加） |
| knowledge/business/ | 业务知识 | 1（README） |

---

## Token 节省机制

| 机制 | 节省率 | 说明 |
|------|--------|------|
| RTK 代理 | ~61% | Bash 输出自动压缩 |
| SQLite 符号索引 | ~95% | 类/方法/调用链查询 |
| context-mode | ~95% | 语义搜索，按需检索 |
| Skills 拆分 | ~70% | SKILL.md + references 分离 |
| Hooks 自动化 | ~30% | 确定性验证不交给 AI |

---

## 最终运行模型（符合指南）

```
Request
    ↓
Context Router (workflow-router.js)
    ↓
Workflow (explore / build / operate)
    ↓
Decision Framework (Agents: Builder / Operator)
    ↓
Artifact Generation (Skills: 12 个专业技能)
    ↓
Evidence Collection (实际命令输出)
    ↓
Verification (build-verify.js)
    ↓
Quality Gate (5 级门禁)
    ↓
Delivery (输出交付物)
```

---

## 最终衡量指标（符合指南）

| 指标 | 定义 | 支持方式 |
|------|------|---------|
| **Lead Time** | 需求到交付时间 | Workflows 缩短流程 |
| **Defect Rate** | 缺陷率 | Quality Gates 降低缺陷 |
| **Context Cost** | 平均 Token 消耗 | Skills 拆分 + RTK 压缩 |

---

## 快速开始

1. 阅读 [SETUP.md](SETUP.md) 了解如何复用本配置
2. 阅读 [ARCHITECTURE.md](ARCHITECTURE.md) 了解组件关系
3. 阅读 [USAGE.md](USAGE.md) 了解日常工作流
4. 阅读 [HOOKS.md](HOOKS.md) 了解 Hook 工作原理

---

## 更新记录

| 日期 | 版本 | 内容 |
|------|------|------|
| 2026-06-11 | 3.0 | Harness Engineering 重大重构：符合《建设指南》要求；Workflows 5→3；Agents 9→2；Skills 17→12；新增 Quality Gates 5 级门禁；Memory 与 Knowledge 分离 |
| 2026-06-10 | 2.0 | Harness 升级：workflow-router 自动路由；session-start 增强；build-verify 升级为编译+测试双门禁 |
| 2026-06-09 | 1.2 | 修复 4 个 workflow 脚本；新增 SQLite 索引系统 |
| 2026-06-07 | 1.1 | 添加 Hook 防护层、SETUP.md |
| 2026-06-04 | 1.0 | 初始版本 |
