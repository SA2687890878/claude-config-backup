# 数据库变更 SQL 示例

> 通用安全检查与风险分级见 SKILL.md D 分支。本文件只提供 SQL Server / PostgreSQL 双语法对照。

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