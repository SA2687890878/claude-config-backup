# Harness Engineering 文档中心

## 文档总览

Claude Code 全自动工作流配置，覆盖需求→设计→开发→测试→排查→审查全流程。
核心理念：**Hook 自动路由 + 确定性验证门禁 + Token 极致节省**。

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

## 系统架构

```
┌─────────────────────────────────────────────────────┐
│                   用户输入                            │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│              UserPromptSubmit Hooks                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │inject-git    │ │inject-token  │ │workflow-     │ │
│  │-rules.js     │ │-rules.js     │ │router.js     │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│              PreToolUse Hooks                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │secret-guard  │ │write-guard   │ │impact-guard  │ │
│  │.js           │ │.js           │ │.js           │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│              PostToolUse Hooks                        │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────────┐  │
│  │cs-guard│ │quality-│ │test-   │ │sqlite-index- │  │
│  │.js     │ │guard.js│ │reminder│ │update.js     │  │
│  └────────┘ └────────┘ └────────┘ └──────────────┘  │
│  ┌──────────────────────┐                            │
│  │git-commit-review.js  │ (Bash)                     │
│  └──────────────────────┘                            │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│              Stop Hook                                │
│  ┌──────────────────────────────────────────────┐   │
│  │build-verify.js — 编译 + 测试双门禁             │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 已注册 Hooks（13 个）

| 事件 | Hook | 触发条件 | 功能 |
|------|------|---------|------|
| **SessionStart** | session-start.js | 会话启动 | git 状态 + 项目检测 + task-state 恢复 |
| **UserPromptSubmit** | inject-git-rules.js | git 关键词 | 注入 git.md 规则 |
| **UserPromptSubmit** | inject-token-rules.js | 代码分析关键词 | 注入 token-optimization.md |
| **UserPromptSubmit** | workflow-router.js | 触发词匹配 | **自动路由到对应 workflow** |
| **PreToolUse** | secret-guard.js | Write\|Edit | 拦截硬编码密钥 |
| **PreToolUse** | write-guard.js | Write\|Edit | 拦截主目录垃圾文件 |
| **PreToolUse** | impact-guard.js | Edit (*.cs) | 修改前提示查看调用链 |
| **PostToolUse** | cs-guard.js | Write\|Edit (*.cs) | C# 语法检查 |
| **PostToolUse** | quality-guard.js | Write\|Edit (*.cs) | SQL 注入/null 安全/资源释放 |
| **PostToolUse** | test-reminder.js | Write\|Edit (*.cs) | 提示运行测试 |
| **PostToolUse** | sqlite-index-update.js | Write\|Edit (*.cs) | 自动增量更新 SQLite 索引 |
| **PostToolUse** | git-commit-review.js | Bash | 阻止 force push、密钥泄露 |
| **Stop** | build-verify.js | 会话结束 | **编译 + 测试双门禁** |

---

## 工作流体系

### 自动路由

**workflow-router.js** hook 自动检测用户输入中的触发词，注入路由上下文。LLM 不需要记住关键词。

| 触发词 | 自动路由到 | 说明 |
|--------|-----------|------|
| 讨论/设计/方案/头脑风暴 | `/requirements` | 需求探索 → 设计规格 |
| 开发/添加/实现 | `/feature-development` | 功能开发全流程 |
| 修复/bug/报错 | `/bug-fix` | Bug 修复流程 |
| 优化/慢/性能 | `/perf-optimize` | 性能调优流程 |
| 审查/review | `/code-review` | 代码审查流程 |
| 测试/跑测试 | `/test-runner` | 测试执行闭环 |
| 数据库/表/字段 | `/sql-best-practices` | 数据库变更 |
| 保存经验/进度 | `/memory-save` | 经验保存 |
| 继续工作 | 自动恢复 | 读取 task-state.md |
| 提交/commit | `/commit` | 提交信息生成 |
| 文档/doc | `/docs` | 文档生成 |

### 机器可执行 Workflow（5 个）

| Workflow | 文件 | 阶段 | Token 预估 |
|----------|------|------|-----------|
| 功能开发 | feature-development.js | 文档生成→架构审查→代码审查→完成验证 | ~80-150k |
| Bug 修复 | bug-fix.js | 问题定位→根因分析→修复实施→验证审查 | ~50-100k |
| 代码审查 | code-review.js | 变更收集→并行审查(5维度)→问题汇总→修复建议 | ~60-100k |
| 性能优化 | perf-optimize.js | 性能分析→优化方案→实施→回测验证 | ~60-120k |
| 测试执行 | test-runner.js | 执行测试→分析结果→失败修复循环 | ~30-60k |

---

## Token 节省机制

| 机制 | 节省率 | 说明 |
|------|--------|------|
| RTK 代理 | ~61% | Bash 输出自动压缩 |
| SQLite 符号索引 | ~95% | 类/方法/调用链查询，避免全文 Read |
| context-mode | ~95% | 语义搜索，按需检索 |
| CodeGraph | ~80% | 结构图谱（仅可读项目） |
| workflow-router | ~10% | 避免 LLM 迷路，减少无效探索 |

---

## 项目检测

| 路径 | 项目 | 数据库 | 技术栈 |
|------|------|--------|--------|
| `F:\OTD Code WorkSpace\*` | OTD | PostgreSQL | .NET 8.0 + Vue 2 |
| `F:\Code WorkSpace\*` | 旧项目 | SQL Server | .NET 8.0 / .NET Framework 4.5.2 + Vue 2 |

session-start.js 自动检测当前目录所属项目，注入对应技术栈提示。

---

## 验证门禁

**build-verify.js**（Stop hook）在会话结束时自动执行：

```
会话结束 → git status 找改动的 .cs 文件
         → dotnet build（编译验证）
         → 找到 *.Tests.csproj → dotnet test（测试验证）
         → 任一失败 → 阻断会话结束
         → 全部通过 → 提示 commit
```

铁律：**没有新鲜的验证证据，不许宣称完成。**

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
| 2026-06-10 | 2.0 | Harness 重大升级：workflow-router 自动路由；session-start 增强（项目检测+task-state恢复）；build-verify 升级为编译+测试双门禁；新增 test-runner.js workflow；激活 quality-guard/sqlite-index-update/git-commit-review/impact-guard 四个 hook |
| 2026-06-09 | 1.2 | 修复 4 个 workflow 脚本；新增 SQLite 索引系统 + 自动更新 hook；新增 Git Commit Review hook |
| 2026-06-07 | 1.1 | 添加 Hook 防护层（Impact/Quality/Build Guard）、SETUP.md |
| 2026-06-04 | 1.0 | 初始版本，建立完整工作流体系 |
