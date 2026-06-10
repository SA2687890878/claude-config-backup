# SQL Server 最佳实践

## 查询性能

- `datetime2` 优于 `datetime`（精度更高、存储更省）
- `nvarchar` 优于 `varchar`（Unicode 支持）
- `SCOPE_IDENTITY()` 优于 `@@IDENTITY`（避免触发器干扰）
- 避免盲目使用 `NOLOCK`（脏读风险，只在明确可接受时用）
- `MERGE` 语句注意并发安全（加 HOLDLOCK）

## 索引

- 聚簇索引选窄列（减少非聚簇索引大小）
- 覆盖索引（INCLUDE）减少 Key Lookup
- 索引碎片 > 30% 时 REBUILD，10-30% 时 REORGANIZE
- 统计信息保持更新（AUTO_UPDATE_STATISTICS ON）

## 连接管理

- 连接池默认开启，注意 `Max Pool Size`
- 长事务会阻塞连接池回收
- 用 `using` 确保连接释放

## EF Core 特有

- `AsNoTracking()` 用于只读查询
- `Include()` 避免 N+1，但注意过度加载
- 批量操作用 `EFCore.BulkExtensions` 或原生 SQL
- 迁移前备份数据库

## 常见陷阱

| 陷阱 | 说明 | 解决 |
|------|------|------|
| `NOLOCK` 脏读 | 读到未提交数据 | 只在报表等场景用 |
| `@@IDENTITY` 触发器 | 返回触发器产生的 ID | 用 `SCOPE_IDENTITY()` |
| `datetime` 精度 | 3.33ms 精度 | 改用 `datetime2` |
| 隐式转换 | varchar→nvarchar 导致索引失效 | 类型一致 |
| 参数嗅探 | 缓存了差的执行计划 | `OPTION (RECOMPILE)` 或 `OPTIMIZE FOR` |
