# 数据库变更模式

## 安全检查清单

每次数据库变更前必须确认：

- [ ] 已备份数据库
- [ ] 变更脚本已 review
- [ ] 确认影响的行数（大表变更需要评估时间）
- [ ] 有回滚方案
- [ ] 测试环境先验证

## 常见变更模式

### 加字段

```sql
-- SQL Server
ALTER TABLE [dbo].[Users] ADD [PhoneNumber] nvarchar(20) NULL;

-- PostgreSQL
ALTER TABLE users ADD COLUMN phone_number varchar(20);
```

建议先加 NULLABLE 字段，回填数据后再改 NOT NULL。

### 改字段类型

```sql
-- SQL Server
ALTER TABLE [dbo].[Users] ALTER COLUMN [Name] nvarchar(200) NOT NULL;

-- PostgreSQL
ALTER TABLE users ALTER COLUMN name TYPE varchar(200);
```

⚠️ 可能数据转换失败。先检查现有数据是否兼容新类型。

### 加索引

```sql
-- SQL Server
CREATE INDEX [IX_Users_Email] ON [dbo].[Users] ([Email]);

-- PostgreSQL（不锁表）
CREATE INDEX CONCURRENTLY idx_users_email ON users (email);
```

### 建表

```sql
-- SQL Server
CREATE TABLE [dbo].[Orders] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [UserId] int NOT NULL,
    [Amount] decimal(18,2) NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_Orders] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Orders_Users] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id])
);

-- PostgreSQL
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id),
    amount numeric(18,2) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
```

## 危险操作

| 操作 | 风险 | 安全做法 |
|------|------|---------|
| `DROP COLUMN` | 数据永久丢失 | 先确认无代码引用，备份，再删 |
| `DROP TABLE` | 数据永久丢失 | 先 rename，观察一段时间再删 |
| `ALTER COLUMN` 改类型 | 转换失败 | 先检查数据兼容性 |
| `TRUNCATE` | 清空全表 | 确认不需要数据 |
| `DELETE FROM` 无 WHERE | 删除全表 | 必须加 WHERE |

## DB-first Scaffold 命令

```bash
# SQL Server
dotnet ef dbcontext scaffold \
  "Server=localhost;Database=MyDb;Trusted_Connection=True;TrustServerCertificate=True" \
  Microsoft.EntityFrameworkCore.SqlServer \
  --output-dir Models \
  --context AppDbContext \
  --force

# PostgreSQL
dotnet ef dbcontext scaffold \
  "Host=localhost;Database=MyDb;Username=user;Password=pass" \
  Npgsql.EntityFrameworkCore.PostgreSQL \
  --output-dir Models \
  --context AppDbContext \
  --force
```

常用选项：
- `--force` — 覆盖已有文件
- `--output-dir` — 指定输出目录
- `--context` — 指定 DbContext 名称
- `--schema` — 只 scaffold 指定 schema
- `--table` — 只 scaffold 指定表（`--table Users --table Orders`）
- `--no-onconfiguring` — 不生成 OnConfiguring 方法
- `--no-pluralize` — 不自动复数化表名
