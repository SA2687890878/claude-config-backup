# 项目文档模板

## README.md 模板

```markdown
# [项目名称] - 项目概述

## 项目简介
[一句话描述]

## 技术栈
- **后端**：[框架版本]
- **前端**：[框架版本]
- **数据库**：[数据库类型]

## 项目结构
[目录树 + 说明]

## 核心模块
[模块列表 + 简述]

## 快速开始
[开发环境搭建步骤]
```

## architecture.md 模板

```markdown
# 架构设计

## 整体架构
[架构图描述]

## 分层架构
- API 层 (Controllers) — [职责]
- 业务层 (Services) — [职责]
- 数据层 (Entities/DbContexts) — [职责]

## 依赖关系
[模块间依赖]

## 关键设计决策
[重要技术选型和原因]
```

## tech-stack.md 模板

```markdown
# 技术栈说明

## 后端技术
| 技术 | 版本 | 用途 |
|------|------|------|
| .NET | 8.0 | Web API 框架 |
| EF Core | x.x | ORM |
| Npgsql | x.x | PostgreSQL 驱动 |

## 前端技术
| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 2.x | 前端框架 |

## 开发工具
[工具列表]
```

## conventions.md 模板

```markdown
# 开发规范

## 命名规范
- 控制器：[XxxController]
- 服务：[XxxService]
- 接口：[IXxxInterface]

## 代码规范
[代码风格要求]

## Git 规范
- 分支：`前缀/名称`
- 提交：`[类型] 描述`

## 文档规范
[文档要求]
```

## database.md 模板

```markdown
# 数据库设计

## 数据库概述
[数据库类型、版本]

## 核心表结构
| 表名 | 用途 | 主要字段 |
|------|------|---------|
| [表名] | [用途] | [字段] |

## ER 关系
[表关系说明]

## 索引策略
[索引设计]
```

---

## 链接模板

### 项目根目录 README.md 链接模板

在项目根目录的 `README.md` 末尾添加：

```markdown
---

## 📚 项目文档

**完整文档请访问 → [项目文档中心](./docs/project/README.md)**

| 文档 | 说明 |
|------|------|
| [项目概述](./docs/project/README.md) | 项目简介、技术栈、核心模块 |
| [架构设计](./docs/project/architecture.md) | 系统架构、分层设计、依赖关系 |
| [技术栈说明](./docs/project/tech-stack.md) | 框架版本、第三方库、工具链 |
| [开发规范](./docs/project/conventions.md) | 命名规范、代码规范、Git 规范 |
| [数据库设计](./docs/project/database.md) | 数据库结构、核心表设计 |
```

### 文档中心 README.md 链接模板

在 `docs/project/README.md` 末尾添加：

```markdown
## 相关文档

| 文档 | 说明 |
|------|------|
| [架构设计](./architecture.md) | 系统架构、分层设计、依赖关系 |
| [技术栈说明](./tech-stack.md) | 框架版本、第三方库、工具链 |
| [开发规范](./conventions.md) | 命名规范、代码规范、Git 规范 |
| [数据库设计](./database.md) | 数据库结构、核心表设计 |

## 功能文档

| 功能 | 文档 |
|------|------|
| {功能名称} | [需求](../features/{name}/01-requirement.md) · [分析](../features/{name}/02-analysis.md) · [设计](../features/{name}/03-design.md) · [任务](../features/{name}/04-tasks.md) |

## 问题排查

- [排查记录](../issues/) — 问题排查文档存放目录
```

**动态生成规则**：
1. 扫描 `docs/features/` 目录下的所有子目录
2. 每个子目录生成一行功能文档链接
3. 子目录名作为 `{name}`，首字母大写作为 `{功能名称}`
