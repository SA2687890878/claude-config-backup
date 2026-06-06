# PostgreSQL 专项规则

## 连接与配置
- 使用 `Npgsql` / `Npgsql.EntityFrameworkCore.PostgreSQL`
- `Include Error Detail=true` 仅用于开发环境
- 连接池默认 20，高并发调整 `Maximum Pool Size`

## 查询优化速查
- 执行计划：`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)` — 不要在生产跑 ANALYZE
- 索引使用：`pg_stat_user_indexes`
- 全表扫描：`pg_stat_user_tables` 的 `seq_scan` vs `idx_scan`
- 慢查询：`pg_stat_statements` 扩展（需启用）

> 完整 SQL 诊断脚本已索引：`ctx_search(source: "postgresql-snippets")`

## EF Core
- `UseNpgsql()` 在 `AddDbContext` 中配置
- 支持 `ILike`：`EF.Functions.ILike(x.Name, "%keyword%")`
- 分页：`OFFSET...LIMIT`
- JSONB：`HasColumnType("jsonb")` + `NpgsqlDbType.Jsonb`
- 数组：`HasColumnType("integer[]")`
- 只读查询必须 `AsNoTracking()`
- `ComId` 多租户字段每个查询必须包含

## 高级特性
- JSONB（GIN 索引）、全文搜索（tsvector）、数组类型、枚举、分区表、递归 CTE

## 常见陷阱
- `NULL` 排序需显式 `NULLS LAST` / `NULLS FIRST`
- 未加引号的标识符自动转小写
- 用 `GENERATED ALWAYS AS IDENTITY`（不用 `SERIAL`）
- 连接池耗尽：检查未释放的 DbContext
