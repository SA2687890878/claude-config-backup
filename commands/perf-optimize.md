<!-- Command: 人类可读的流程文档（详细步骤 + 决策点 + 自检清单）
     对应 Workflow: ~/.claude/workflows/performance-optimization.js（机器可执行编排） -->
性能优化流程。先量后优，用数据说话。

## 标准流程

```
/perf-tune（分析） → 方案确认 → 优化实施
→ /perf-tune（复测） → /verification-before-completion
```

---

## Phase 1: 性能分析（perf-tune）

调用 /perf-tune，收集信息：
- **慢在哪里？** 接口响应慢 / 页面加载慢 / 批量操作慢 / 启动慢
- **慢了多少？** 具体数字（响应时间、吞吐量）
- **什么时候开始慢的？** 一直慢 / 最近变慢 / 特定条件慢
- **数据量？** 多少条记录、多大的表

瓶颈分类：

| 瓶颈类型 | 分析工具 |
|---------|---------|
| 数据库查询 | `EXPLAIN ANALYZE` / pg_stat_activity |
| 代码逻辑 | 日志计时 / codegraph_explore 调用链 |
| N+1 查询 | EF Core 日志 / SQL 抓包 |
| 内存泄漏 | GC 日志 / 对象生命周期 |
| 并发阻塞 | 查找 `.Result`/`.Wait()` |

**PostgreSQL 慢查询诊断：**
```sql
-- 执行计划（不要在生产跑 ANALYZE）
EXPLAIN (BUFFERS, FORMAT TEXT) <SQL>;

-- 全表扫描检测
SELECT relname, seq_scan, idx_scan FROM pg_stat_user_tables
ORDER BY seq_tup_read DESC LIMIT 20;
```

**输出**：量化基线数据 + 瓶颈定位

---

## Phase 2: 优化方案

基于分析结果制定策略。每个优化点评估：
- **预期收益**：响应时间/吞吐量提升幅度
- **改动风险**：可能影响的数据一致性/兼容性
- **工作量**：需要修改的文件数量

常见手段：
- 索引优化 → `EXPLAIN` 验证
- 消除 N+1 → `Include()`/`Join()` 替代循环查询
- `AsNoTracking()` 用于只读查询
- 引入缓存（MemoryCache/Redis）
- 异步化 IO 操作

**决策点**：用户确认方案 → Phase 3

---

## Phase 3: 优化实施

按确认方案实施。执行：
```bash
dotnet build
```

---

## Phase 4: 复测验证（perf-tune）

重新调用 /perf-tune 复测，对比优化前后指标：
- 响应时间变化
- 吞吐量变化
- 资源使用变化

确认无功能回归：`dotnet test`

---

## Phase 5: 完成验证（verification-before-completion）

调用 /verification-before-completion，确认可以提交。

调用 `/commit` 提交优化。
