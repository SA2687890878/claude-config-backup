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
| [workflow.md](03-architecture/workflow.md) | 交付流水（现行单轨 pipeline-executor，旧三流已归档） |
| [agent-roles.md](03-architecture/agent-roles.md) | Agent 角色定义 |
| [cross-project.md](03-architecture/cross-project.md) | 跨项目工作流 |
| [review-audit.md](03-architecture/review-audit.md) | 审查审计机制 |
| [iteration.md](03-architecture/iteration.md) | 自动迭代机制 |
| [REASONIX-MIGRATION.md](REASONIX-MIGRATION.md) | Reasonix 迁移评估备忘录（4 宿主兼容矩阵、勘误记录、证据等级说明） |
| [HARNESS-ENGINEERING-PLAN.md](HARNESS-ENGINEERING-PLAN.md) | 通用 Harness 规划（4 宿主版：七阶段覆盖、分层架构、落地路径） |
| [HARNESS-ITERATION-PLAN.md](HARNESS-ITERATION-PLAN.md) | Harness 迭代升级计划（北极星目标 + 三阶段落地路线：learnings 激活闭环 / 计划持久化 / SkillOpt 试点） |
| [HARNESS-OPTIMIZATION-DETAILED.md](03-architecture/HARNESS-OPTIMIZATION-DETAILED.md) | ⭐ Harness 优化详细方案（v2.0 已完成：少入口·单协议·强验证·按需加载） |
| [HARNESS-SKILLS-OPTIMIZATION.md](03-architecture/HARNESS-SKILLS-OPTIMIZATION.md) | ⭐ 技能层优化方案（v2.1 已完成：审查/家族/调研去重·超长瘦身·薄弱补强） |
| [HARNESS-FUSION-DETAILED.md](03-architecture/HARNESS-FUSION-DETAILED.md) | ⭐ 融合改进方案（v2.2 已完成：Brooks×OpenCLI 二层化·中文门面·主链路挂点） |
| [HARNESS-ESSENCE-EXTRACTION-DETAILED.md](03-architecture/HARNESS-ESSENCE-EXTRACTION-DETAILED.md) | ⭐ 精华萃取方案（v2.4 超详细当前执行：附录A/B证据表+逐文件diff+Token账+验收脚本） |
| [HARNESS-AUDIT-2026-08-20.md](HARNESS-AUDIT-2026-08-20.md) | ⭐ 体检与修复方案（v2.5 审计：7维打分 B+·P0/P1+22分钟施工清单） |

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
| 参考文档 | 11 个 | 查询 |
| 系统文档 | 3 个 | 维护 |
| 模板文档 | 5 个 | 复用 |
| **总计** | **25 个** | |

---

**最后更新**：2026-08-27（v2.0 瘦身：HARNESS-ENGINEERING 759→78 行；workflow 归档；QUICK/gates 现行单轨；RTK 按需化）
