# Rules 索引

> 按需加载的 rules，存放在 `~/.claude/knowledge/rules/`。
> 与 `~/.claude/rules/`（自动加载的核心规则）不同，需要时再读取。

## 核心规则（自动加载）

| Rule | 路径 |
|------|------|
| 代码访问 | `~/.claude/rules/tools/code-access.md` |
| 质量门禁 | `~/.claude/rules/quality/gates.md` |
| 验证规则 | `~/.claude/rules/quality/verification.md` |
| Token 优化 | `~/.claude/rules/tools/token-optimization.md` |
| 对话严谨标准 | `~/.claude/rules/interaction/rigor-standards.md` |
| 置信度标注规范 | `~/.claude/rules/interaction/confidence-reporting.md` |
| 前端 UI 红线 | `~/.claude/rules/frontend/ui-redlines.md` |

## 参考规则（按需加载）

### 代码访问
| Rule | 路径 |
|------|------|
| 加密机制 | `~/.claude/knowledge/engineering/dgclient-encryption-mechanism.md` |
| 索引系统 | `code-access/indexing.md` |
| 写入规则 | `code-access/write-rules.md` |
| 决策树 | `code-access/decision-tree.md` |

### 质量门禁
| Rule | 路径 |
|------|------|
| Requirement Gate | `gates/requirement.md` |
| Design Gate | `gates/design.md` |
| Code Gate | `gates/code.md` |
| Test Gate | `gates/test.md` |
| Release Gate | `gates/release.md` |

### Token 优化
| Rule | 路径 |
|------|------|
| 完整策略 | `token-optimization/overview.md`（合并 tools.md + thinking.md，单一真源） |

### 工作流
| Rule | 路径 |
|------|------|
| 任务管理 | `workflows/task-management.md` |
| Artifact 管理 | `workflows/artifact-management.md` |
| 触发规则 | `workflows/workflows.md` |
| Git 规范 | `workflows/git.md` |
| 知识同步 | `workflows/knowledge-sync.md` |
| **记忆生命周期** | `workflows/memory-lifecycle.md` — 进-留-出，防记忆膨胀省 token |

### 质量
| Rule | 路径 |
|------|------|
| 日志与可观测性 | `quality/logging-observability.md` |
| 需求澄清问题库 | `quality/question-bank.md` |
| 审查清单 | `quality/review-checklist.md` |
| Hooks 标准 | `quality/hooks-standards.md` |
| **宪法（一页收口）** | `quality/constitution.md` — 三禁三必须 + 三Gates，按需 |
| **微清单** | `quality/checklist.md` — Requirement 10行自检，按需 |

### 工具
| Rule | 路径 |
|------|------|
| RTK（按需） | `tools/rtk.md` — 重输出/Bash 调试，`rtk gain/proxy` |
| 模型策略 | `tools/model-strategy.md` |
| 安全规则 | `tools/security.md` |

### 语言
| Rule | 路径 |
|------|------|
| C# | `languages/csharp.md` |
| WPF | `languages/wpf.md` |
| JavaScript | `languages/javascript.md` |
| Vue | `languages/vue.md` |
| SQL Server | `languages/sqlserver.md` |
| PostgreSQL | `languages/postgresql.md` |

### 前端 UI
| Rule | 路径 | 触发词 |
|------|------|--------|
| UI 查证清单 | `frontend/ui-rules.md` | 前端 / UI / 页面 / 组件 / Vue / 弹窗 / 表格 / 表单 / 交互 / 视觉 |
| 设计分级 | `frontend/design-taste.md` | 设计 / 风格 / 效果图 / 美化 / 视觉风格 / Design Taste |
| 追溯平台前端 | `../project/pcs-web-frontend.md` | **追溯平台前端 / PCS 前端 / 客户选择器 / 物品选择器 / 部门产线工位 / Element Plus** |

### 需求
| Rule | 路径 | 触发词 |
|------|------|--------|
| 需求评审方法论 | `requirements/requirements-analysis.md` | 需求评审 / 需求梳理 / 需求讨论 / 方案取舍 / 影响分析 / 验收条件 |
