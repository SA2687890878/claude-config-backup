---
name: sql-best-practices
description: >
  This skill should be used when the user asks to "SQL 最佳实践", "数据库优化",
  "查询优化", "索引优化", "慢查询", "数据库性能", "数据库变更", "迁移",
  "migration", "scaffold", "改表", "加字段", "建表", or mentions /sql-best-practices.
version: 3.0.0
---

# SQL 最佳实践

## 路由

根据项目自动识别数据库类型，或由用户指定。

| 判断依据 | 数据库 |
|---------|--------|
| 项目路径含 `F:\Code WorkSpace` 或代码用 `UseSqlServer` | → A. SQL Server |
| 项目路径含 `F:\OTD Code WorkSpace` 或代码用 `UseNpgsql` | → B. PostgreSQL |
| 代码用 `UseSqlite` 或 `.db` 文件 | → C. SQLite |
| 涉及表结构变更、字段增删、建表 | → D. 数据库变更 |
| 不确定 | → 问用户 |

---

## 通用原则（所有数据库共用）

### 查询性能

- 避免 `SELECT *`，只查需要的列
- 大数据量查询必须分页
- `EXISTS` 优于 `IN`（子查询场景）
- `COUNT(*)` 只在必要时用，`Any()` 替代 `Count() > 0`
- 避免在 WHERE 中对列做函数调用（导致索引失效）

### 索引策略

- 主键自动聚簇（SQL Server）或有序（PG）
- 外键、常用查询字段建索引
- 复合索引注意列顺序（高选择性在前）
- 避免过度索引（影响写入性能）

### Schema 设计

- 满足第三范式（除非有明确反范式理由）
- 数据类型选最小够用的
- NOT NULL 优先于 NULL
- 时间戳用数据库原生类型

### 安全

- **必须参数化查询**，禁止字符串拼接 SQL
- 最小权限原则
- 敏感数据加密存储

读取对应分支的 reference 文件了解数据库特有最佳实践。

---

## A. SQL Server

读取 `references/sqlserver.md` 了解 SQL Server 特有的优化规则和陷阱。

---

## B. PostgreSQL

读取 `references/postgresql.md` 了解 PostgreSQL 特有的优化规则和陷阱。

---

## C. SQLite

读取 `references/sqlite.md` 了解 SQLite 特有的优化规则和陷阱。

---

## D. 数据库变更

你们的代码混用 **EF Core（DB-first）** 和 **原生 SQL**。变更流程：

### 流程

```
1. 在数据库中直接修改表结构（SQL Server Management Studio / pgAdmin / 原生 SQL）
2. Scaffold 更新模型（dotnet ef dbcontext scaffold）
3. 验证模型与数据库一致
4. 更新业务代码适配模型变化
5. 运行测试确认无回归
```

### Step 1: 数据库端变更

读取 `references/db-change-patterns.md` 了解变更模式和安全检查清单。

直接在数据库中执行 DDL：
- 加字段：`ALTER TABLE ... ADD ...`
- 改字段：`ALTER TABLE ... ALTER COLUMN ...`
- 加索引：`CREATE INDEX ...`
- 建表：`CREATE TABLE ...`

**危险操作（必须先备份）：**
- `DROP COLUMN` — 数据永久丢失
- `ALTER COLUMN` 改类型 — 可能数据转换失败
- `DROP TABLE` — 数据永久丢失

### Step 2: Scaffold 更新模型

```bash
# SQL Server
dotnet ef dbcontext scaffold "Server=...;Database=..." Microsoft.EntityFrameworkCore.SqlServer --output-dir Models --force

# PostgreSQL
dotnet ef dbcontext scaffold "Host=...;Database=..." Npgsql.EntityFrameworkCore.PostgreSQL --output-dir Models --force
```

`--force` 覆盖已有模型文件。注意检查生成的模型是否正确。

### Step 3: 验证

- 对比生成的模型和数据库实际结构
- 检查导航关系是否正确
- 检查数据类型映射是否合理
- 运行 `dotnet build` 确认编译通过

### Step 4: 适配业务代码

模型变化后，检查引用旧字段/表的代码，更新适配。

### Step 5: 测试

```bash
dotnet test
```
