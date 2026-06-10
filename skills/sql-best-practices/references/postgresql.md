# PostgreSQL 最佳实践

## 查询性能

- `GENERATED ALWAYS AS IDENTITY` 优于 `SERIAL`（SQL 标准）
- JSONB 查询用 GIN 索引
- `ILIKE` 不走普通 B-tree 索引，需要 `pg_trgm`
- `VACUUM` 和 `ANALYZE` 保持统计信息准确
- `EXPLAIN (ANALYZE, BUFFERS)` 看实际执行

## 索引

- 部分索引（`WHERE condition`）减少索引大小
- 表达式索引（`ON (lower(name))`）支持函数查询
- BRIN 索引适合时间序列等有序数据
- 并发建索引（`CREATE INDEX CONCURRENTLY`）不锁表

## Schema 设计

- 标识符自动转小写，用双引号保留大小写
- `text` 类型和 `varchar` 性能一样，优先用 `text`
- `uuid` 主键 vs `bigint` 主键：uuid 分布更好但更大
- 分区表用 `PARTITION BY`（PG 10+）

## 连接管理

- PgBouncer 做连接池（应用直接连 PG 会耗尽连接）
- `statement_timeout` 防止长查询
- `idle_in_transaction_session_timeout` 回收空闲事务

## EF Core 特有

- `UseNpgsql()` 注意大小写（Npgsql 默认小写）
- `NpgsqlDataSourceBuilder` 配置连接池
- 枚举映射：`MapEnum<T>()` 对应 PG 的 ENUM 类型
- 批量操作用 `NpgsqlBinaryImporter`

## 常见陷阱

| 陷阱 | 说明 | 解决 |
|------|------|------|
| 大小写问题 | 标识符自动转小写 | 统一用小写或双引号 |
| `SERIAL` 非标准 | 不是 SQL 标准 | 用 `GENERATED ALWAYS AS IDENTITY` |
| 连接耗尽 | 应用直连 PG | 用 PgBouncer |
| `varchar(n)` 限制 | 无性能优势，只有限制 | 用 `text` |
| 死锁 | 并发更新同表 | 统一更新顺序 |
