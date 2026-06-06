# PostgreSQL 性能诊断

> 仅当目标项目是 PostgreSQL（`F:\OTD Code WorkSpace\` 或代码含 `UseNpgsql()`）时读取本文件。

## 诊断 SQL

```sql
-- 当前活动查询（运行超 5 秒）
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity WHERE state != 'idle'
  AND now() - pg_stat_activity.query_start > interval '5 seconds'
ORDER BY duration DESC;

-- 全表扫描检测
SELECT schemaname, relname, seq_scan, seq_tup_read, idx_scan
FROM pg_stat_user_tables ORDER BY seq_tup_read DESC LIMIT 20;

-- 索引使用情况
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes ORDER BY idx_scan ASC;

-- 表大小
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size
FROM pg_tables WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 锁等待
SELECT blocked_locks.pid AS blocked_pid,
       blocking_locks.pid AS blocking_pid,
       blocked_activity.query AS blocked_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks
  ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
  AND blocking_locks.pid != blocked_locks.pid
WHERE NOT blocked_locks.granted;

-- 执行计划（不要在生产跑 ANALYZE）
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) <SQL>;
```

## 常见问题对照

| 症状 | 可能原因 | 检查方式 |
|------|---------|---------|
| 全表扫描 | 缺少索引 | EXPLAIN Seq Scan |
| 索引未使用 | 条件不匹配索引 | Index Scan rows 很多 |
| N+1 查询 | ORM 循环查询 | 日志大量相似 SELECT |
| 锁等待 | 长事务/死锁 | pg_locks |
| 连接耗尽 | 连接池配置不当 | pg_stat_activity |
| 序列耗尽 | SERIAL 接近上限 | pg_sequences |
