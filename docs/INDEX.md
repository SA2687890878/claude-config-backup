# Harness Engineering 文档中心索引

> 所有文档的导航索引，便于快速查找

---

## 文档分类

### 核心理念（⭐ 必读）

| 文档 | 用途 | 字数 | 推荐阅读时间 |
|------|------|------|-------------|
| [HARNESS-ENGINEERING.md](01-getting-started/HARNESS-ENGINEERING.md) | 理念与设计、6 原则、架构、生命周期 | 1224 | 15 分钟 |

### 使用指南（📖 实操）

| 文档 | 用途 | 字数 | 推荐阅读时间 |
|------|------|------|-------------|
| [SETUP.md](02-guides/SETUP.md) | 复用指南、换电脑、分享给同事 | 983 | 30 分钟 |
| [USAGE.md](02-guides/USAGE.md) | 日常使用指南、10 个场景、最佳实践 | 1131 | 15 分钟 |
| [QUICK-REFERENCE.md](01-getting-started/QUICK-REFERENCE.md) | 一页纸速查表（命令/Skills/Hooks） | 800+ | 5 分钟 |
| [SETTINGS-GUIDE.md](04-reference/SETTINGS-GUIDE.md) | settings.json 配置详解 | 600+ | 10 分钟 |

### 避坑指南

| 文档 | 用途 | 字数 | 推荐阅读时间 |
|------|------|------|-------------|
| [LONG-CONVERSATION-PITFALLS.md](04-reference/LONG-CONVERSATION-PITFALLS.md) | 长对话陷阱与解决方案 | 570+ | 10 分钟 |

### 参考文档（🔍 查询）

| 文档 | 用途 |
|------|------|
| [ARCHITECTURE.md](03-architecture/ARCHITECTURE.md) | 系统架构图 + 组件关系 + 数据流 |
| [HOOKS.md](03-architecture/HOOKS.md) | Hook 工作原理 + 触发时机 |
| [TOKEN-SAVINGS.md](03-architecture/TOKEN-SAVINGS.md) | Token 节省机制说明 |
| [workflow.md](03-architecture/workflow.md) | 完整工作流说明 |
| [agent-roles.md](03-architecture/agent-roles.md) | Agent 角色定义 |
| [cross-project.md](03-architecture/cross-project.md) | 跨项目工作流 |
| [review-audit.md](03-architecture/review-audit.md) | 审查审计机制 |
| [iteration.md](03-architecture/iteration.md) | 自动迭代机制 |

### 系统文档（🔧 维护）

| 文档 | 用途 |
|------|------|
| [MEMORY.md](03-architecture/MEMORY.md) | Memory 机制说明 |
| [PROJECTS.md](03-architecture/PROJECTS.md) | 项目管理说明 |
| [PROJECT-INIT-CHECKLIST.md](02-guides/PROJECT-INIT-CHECKLIST.md) | 项目启动清单 |

### 模板文档（📝 复用）

| 文档 | 用途 |
|------|------|
| [CLAUDE-template.md](CLAUDE-template.md) | 全局 CLAUDE.md 模板 |
| [templates/CLAUDE.md.template](templates/CLAUDE.md.template) | 项目级 CLAUDE.md 模板 |
| [templates/api-contract.md.template](templates/api-contract.md.template) | API 契约模板 |
| [templates/database-schema.md.template](templates/database-schema.md.template) | 数据库设计模板 |
| [templates/common-patterns.md.template](templates/common-patterns.md.template) | 常见模式模板 |

---

## 推荐阅读顺序

### 第一次使用（1 小时）

1. **HARNESS-ENGINEERING.md**（15 分钟）
   - 理解为什么这样设计
   - 6 个核心原则
   - 系统架构全景

2. **SETUP.md**（30 分钟）
   - 本地复用
   - 迁移到新电脑

3. **QUICK-REFERENCE.md**（5 分钟）
   - 快速查找命令
   - 一页纸速查

4. **USAGE.md**（10 分钟）
   - 对应场景使用

### 日常参考

| 需求 | 查看文档 |
|------|---------|
| 快速查找命令 | QUICK-REFERENCE.md |
| 详细使用方法 | USAGE.md |
| 配置修改 | SETTINGS-GUIDE.md |
| 问题排查 | LONG-CONVERSATION-PITFALLS.md |
| 系统架构 | ARCHITECTURE.md |
| Hook 工作原理 | HOOKS.md |
| Token 节省 | TOKEN-SAVINGS.md |
| 复用/迁移 | SETUP.md |
| 理念/设计 | HARNESS-ENGINEERING.md |

---

## 交叉引用

### 从 QUICK-REFERENCE.md

- 详细使用 → [USAGE.md](02-guides/USAGE.md)
- 配置修改 → [SETTINGS-GUIDE.md](04-reference/SETTINGS-GUIDE.md)
- 迁移/复用 → [SETUP.md](02-guides/SETUP.md)
- 问题排查 → [LONG-CONVERSATION-PITFALLS.md](04-reference/LONG-CONVERSATION-PITFALLS.md)
- 系统架构 → [ARCHITECTURE.md](03-architecture/ARCHITECTURE.md)
- Hook 工作原理 → [HOOKS.md](03-architecture/HOOKS.md)

### 从 USAGE.md

- 快速查找 → [QUICK-REFERENCE.md](01-getting-started/QUICK-REFERENCE.md)
- 配置说明 → [SETTINGS-GUIDE.md](04-reference/SETTINGS-GUIDE.md)
- 长对话避坑 → [LONG-CONVERSATION-PITFALLS.md](04-reference/LONG-CONVERSATION-PITFALLS.md)
- 复用/迁移 → [SETUP.md](02-guides/SETUP.md)
- 理念设计 → [HARNESS-ENGINEERING.md](01-getting-started/HARNESS-ENGINEERING.md)
- Skills 详细说明 → [../skills/INDEX.md](../skills/INDEX.md)
- Hooks 详细说明 → [HOOKS.md](03-architecture/HOOKS.md)

### 从 SETUP.md

- 日常使用 → [USAGE.md](02-guides/USAGE.md)
- 快速查找 → [QUICK-REFERENCE.md](01-getting-started/QUICK-REFERENCE.md)
- 配置说明 → [SETTINGS-GUIDE.md](04-reference/SETTINGS-GUIDE.md)
- 理念设计 → [HARNESS-ENGINEERING.md](01-getting-started/HARNESS-ENGINEERING.md)

### 从 SETTINGS-GUIDE.md

- 快速查找 → [QUICK-REFERENCE.md](01-getting-started/QUICK-REFERENCE.md)
- 日常使用 → [USAGE.md](02-guides/USAGE.md)
- 复用/迁移 → [SETUP.md](02-guides/SETUP.md)
- Hook 工作原理 → [HOOKS.md](03-architecture/HOOKS.md)

### 从 LONG-CONVERSATION-PITFALLS.md

- 快速查找 → [QUICK-REFERENCE.md](01-getting-started/QUICK-REFERENCE.md)
- 日常使用 → [USAGE.md](02-guides/USAGE.md)
- Token 节省 → [TOKEN-SAVINGS.md](03-architecture/TOKEN-SAVINGS.md)

### 从 HARNESS-ENGINEERING.md

- 快速查找 → [QUICK-REFERENCE.md](01-getting-started/QUICK-REFERENCE.md)
- 日常使用 → [USAGE.md](02-guides/USAGE.md)
- 配置修改 → [SETTINGS-GUIDE.md](04-reference/SETTINGS-GUIDE.md)
- 迁移/复用 → [SETUP.md](02-guides/SETUP.md)
- 问题排查 → [LONG-CONVERSATION-PITFALLS.md](04-reference/LONG-CONVERSATION-PITFALLS.md)

---

## 文档统计

| 分类 | 数量 | 说明 |
|------|------|------|
| 核心理念 | 1 个 | 必读 |
| 使用指南 | 4 个 | 实操 |
| 避坑指南 | 1 个 | 避坑 |
| 参考文档 | 8 个 | 查询 |
| 系统文档 | 3 个 | 维护 |
| 模板文档 | 5 个 | 复用 |
| **总计** | **22 个** | |

---

**最后更新**：2026-06-17
