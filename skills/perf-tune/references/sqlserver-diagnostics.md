# SQL Server 性能诊断

> 仅当目标项目是 SQL Server（`F:\Code WorkSpace\` 或代码含 `UseSqlServer()`）时读取本文件。

## 诊断 SQL

```sql
-- 当前阻塞
SELECT r.session_id, r.blocking_session_id, r.wait_type, r.wait_time,
       t.text AS query_text
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.blocking_session_id > 0;

-- 索引缺失
SELECT TOP 20
  d.statement AS table_name,
  d.equality_columns, d.inequality_columns, d.included_columns,
  s.user_seeks, s.user_scans
FROM sys.dm_db_missing_index_details d
JOIN sys.dm_db_missing_index_groups g ON d.index_handle = g.index_handle
JOIN sys.dm_db_missing_index_group_stats s ON g.index_handle = s.group_handle
ORDER BY s.user_seeks DESC;

-- 慢查询（Top 10 by elapsed time）
SELECT TOP 10
  qs.total_elapsed_time / qs.execution_count AS avg_elapsed_time,
  qs.execution_count,
  SUBSTRING(qt.text, (qs.statement_start_offset/2)+1,
    ((CASE qs.statement_end_offset WHEN -1 THEN DATALENGTH(qt.text)
      ELSE qs.statement_end_offset END - qs.statement_start_offset)/2)+1) AS query_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
ORDER BY avg_elapsed_time DESC;

-- 表大小
SELECT t.NAME AS TableName, p.rows AS RowCounts,
       SUM(a.total_pages) * 8 AS TotalSpaceKB
FROM sys.tables t
INNER JOIN sys.indexes i ON t.OBJECT_ID = i.object_id
INNER JOIN sys.partitions p ON i.OBJECT_ID = p.OBJECT_ID AND i.index_id = p.index_id
INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
WHERE t.is_ms_shipped = 0 AND i.OBJECT_ID > 255
GROUP BY t.Name, p.Rows
ORDER BY TotalSpaceKB DESC;

-- 执行计划（SSMS 中使用）
SET STATISTICS IO ON;
-- 执行查询后查看 Messages 标签页的逻辑读取数
```

## 常见问题对照

| 症状 | 可能原因 | 检查方式 |
|------|---------|---------|
| 全表扫描 | 缺少索引 | 执行计划 Index Scan vs Table Scan |
| 索引未使用 | 列顺序不对/数据类型不匹配 | sys.dm_db_missing_index_details |
| N+1 查询 | ORM 循环查询 | 日志大量相似 SELECT |
| 锁等待 | 长事务/死锁 | sp_who2 / sys.dm_exec_requests |
| 连接耗尽 | 连接池配置不当 | sys.dm_exec_sessions |
| 参数嗅探 | 执行计划缓存问题 | OPTION (RECOMPILE) 测试 |
