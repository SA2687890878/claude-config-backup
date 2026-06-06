# SQL Server 专项规则

## 连接与配置
- 使用 `Microsoft.Data.SqlClient`（非 `System.Data.SqlClient`）
- 连接字符串通过 `SqlConnectionStringBuilder` 构建
- `TrustServerCertificate=True` 仅用于开发环境

## 查询优化速查
- 执行计划：`SET STATISTICS IO ON` + SSMS
- 索引缺失：`sys.dm_db_missing_index_details`
- 阻塞检测：`sp_who2` 或 `sys.dm_exec_requests`
- 参数嗅探：`OPTION (RECOMPILE)` 或 `OPTIMIZE FOR UNKNOWN`

> 完整 SQL 诊断脚本已索引：`ctx_search(source: "sqlserver-snippets")`

## EF Core
- `UseSqlServer()` 在 `AddDbContext` 中配置
- 不支持 `ILike`，用 `LIKE` + `EF.Functions.Collate`
- 分页：`OFFSET...FETCH NEXT`（SQL Server 2012+）
- `datetime2` 优于 `datetime`
- 只读查询必须 `AsNoTracking()`

## 常见陷阱
- `NOLOCK` 可能脏读，不要盲目使用
- `IDENTITY` 列用 `SCOPE_IDENTITY()`，不用 `@@IDENTITY`
- 高并发考虑 `SNAPSHOT` 隔离级别
- 参数化查询防 SQL 注入
