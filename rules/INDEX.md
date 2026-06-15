# Rules 索引

> 所有已注册的 Rules，按类别分组。

## 工具规则

| Rule | 文件 | 说明 |
|------|------|------|
| 代码访问 | `tools/code-access.md` | 加密源码的读取规则 |
| 模型策略 | `tools/model-strategy.md` | Agent 模型选择策略 |
| 安全规则 | `tools/security.md` | 密钥防护、文件写入防护 |
| Token 优化 | `tools/token-optimization.md` | RTK 自动压缩、代码分析工具选择 |

## 质量规则

| Rule | 文件 | 说明 |
|------|------|------|
| 质量门禁 | `quality/gates.md` | 5 个 Gate 的检查项和通过条件 |
| 审查清单 | `quality/review-checklist.md` | 代码审查维度和严重级别 |
| 验证规则 | `quality/verification.md` | 确定性验证标准（退出码为王） |
| Hooks 标准 | `quality/hooks-standards.md` | Hook 代码质量标准、闭环设计 |

## 工作流规则

| Rule | 文件 | 说明 |
|------|------|------|
| Git 规范 | `workflows/git.md` | 分支命名、提交信息格式 |
| 触发规则 | `workflows/workflows.md` | 触发词映射、路由机制 |
| 任务管理 | `workflows/task-management.md` | 经验沉淀和任务归档规则 |

## 语言规则

| Rule | 文件 | 说明 |
|------|------|------|
| C# 规则 | `languages/csharp.md` | .NET 8.0 / Framework 4.5.2 开发规范 |
| SQL Server | `languages/sqlserver.md` | SQL Server 数据库规范 |
| PostgreSQL | `languages/postgresql.md` | PostgreSQL 数据库规范 |
| Vue | `languages/vue.md` | Vue 2 开发规范 |
| JavaScript/TypeScript | `languages/javascript.md` | JS/TS 编码规范、Hook 规范 |

---

## Rules 统计

- **总计**：16 个 Rules
- **工具**：4 个
- **质量**：4 个
- **工作流**：3 个
- **语言**：5 个

## 优先级

```
项目级 .claude/ > 全局 rules/*.md > CLAUDE.md
```
