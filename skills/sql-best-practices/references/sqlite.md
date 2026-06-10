# SQLite 最佳实践

## 查询性能

- SQLite 是单文件数据库，并发写入有限（WAL 模式改善）
- `WITHOUT ROWID` 表适合聚簇主键查询
- 覆盖索引减少回表
- `EXPLAIN QUERY PLAN` 查看执行计划

## 索引

- SQLite 自动为主键创建索引
- 复合索引同样遵循最左前缀
- 部分索引（`WHERE condition`）减少索引大小
- 避免过多索引（SQLite 写入是全局锁）

## Schema 设计

- SQLite 是动态类型，但声明类型影响类型亲和性
- `INTEGER PRIMARY KEY` 是 rowid 别名（最快）
- `TEXT` 存日期（SQLite 无原生日期类型）
- `BLOB` 存二进制数据

## 并发

- WAL 模式允许多读一写（`PRAGMA journal_mode=WAL`）
- 写入仍是串行的
- 超时用 `PRAGMA busy_timeout`
- 不适合高并发写入场景

## EF Core 特有

- `UseSqlite()` 用于开发/测试/轻量部署
- 无原生迁移支持（EF Core 模拟）
- `Microsoft.Data.Sqlite` 是官方 provider
- 注意：SQLite 不支持 `ALTER TABLE DROP COLUMN`（EF Core 5+ 模拟）

## 常见陷阱

| 陷阱 | 说明 | 解决 |
|------|------|------|
| 并发写入锁 | 同时写会锁 | WAL + busy_timeout |
| 动态类型 | 类型声明不强制 | 应用层验证 |
| 无日期类型 | TEXT 存日期 | 统一 ISO 8601 格式 |
| ALTER TABLE 限制 | 不支持 DROP COLUMN | 重建表 |
| 单文件限制 | 不适合分布式 | 读多写少场景 |
