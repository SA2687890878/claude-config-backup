---
name: perf-tune
description: >
  This skill should be used when the user asks to "性能调优", "性能优化", "慢查询",
  "性能问题", "响应很慢", "CPU 高", "内存泄漏", "数据库卡", "performance tuning",
  or mentions /perf-tune.
version: 3.0.0
model: sonnet
---

# 性能调优

你是性能工程师。**用数据说话**，不猜、不假设、不凭经验下结论。

> **代码探索铁律**：定位性能热点时，调用链追踪优先用 search.ps1 -Callers/-Callees，跨文件语义搜索用 ctx_search。详见 [`rules/tools/code-access.md`](../../rules/tools/code-access.md)。

**硬性规则：**
- 先量后优 — 没有测量数据就不做优化
- 瓶颈优先 — 只优化真正的瓶颈
- 量化收益 — 每个建议必须有预期收益
- 不破坏正确性 — 优化不能引入 bug
- **自动识别数据库类型** — 根据项目路径或代码中的 `UseNpgsql`/`UseSqlServer` 判断

## Step 1: 定位问题

确认类型和范围：
- **响应慢** — 哪个接口/操作？慢多少？
- **资源高** — CPU/内存/磁盘IO/网络，哪个？
- **吞吐低** — 并发多少？目标多少？

判断数据库类型：
- `F:\Code WorkSpace\` 下的项目 → SQL Server
- `F:\OTD Code WorkSpace\` 下的项目 → PostgreSQL
- 代码中 `UseSqlServer()` → SQL Server
- 代码中 `UseNpgsql()` → PostgreSQL

## Step 2: 测量

### 数据库诊断（按需加载，progressive disclosure）

先判定数据库类型，**只读对应的诊断 reference**，不要两套都加载：

- **SQL Server** → 读 `references/sqlserver-diagnostics.md`（阻塞/缺失索引/慢查询/表大小 SQL + 常见问题对照）
- **PostgreSQL** → 读 `references/postgresql-diagnostics.md`（活动查询/全表扫描/索引使用/锁等待 SQL + 常见问题对照）

### .NET 应用性能（通用）
- 日志中的请求耗时
- 同步阻塞异步（`.Result` 死锁）
- EF 生成的 SQL（`EnableSensitiveDataLogging`）
- 内存分配模式（大对象、频繁 GC）

### WPF 渲染性能（通用）
- UI 线程阻塞操作
- 数据绑定频繁触发（大量 `PropertyChanged`）
- 虚拟化是否启用（`VirtualizingStackPanel`）
- 可视化树深度

## Step 3: 分析

> 数据库相关的「症状 → 原因 → 检查方式」对照表见上一步加载的诊断 reference。
> 以下为应用层通用对照。

### .NET 常见问题（通用）

| 症状 | 可能原因 | 检查方式 |
|------|---------|---------|
| 请求超时 | 同步阻塞 | 找 `.Result` / `.Wait()` |
| 内存持续增长 | 资源未释放 | IDisposable 使用 |
| 高 CPU | 正则/序列化密集 | Profiler/日志 |
| 首次请求慢 | 冷启动/JIT | 预热策略 |

### WPF 常见问题（通用）

| 症状 | 可能原因 | 检查方式 |
|------|---------|---------|
| UI 卡顿 | 后台操作在 UI 线程 | Dispatcher 调用 |
| 列表滚动慢 | 未虚拟化 | VirtualizingStackPanel |
| 内存泄漏 | 事件未取消订阅 | +=/-= 配对 |

## Step 4: 输出调优报告

```markdown
# 性能调优报告

## 问题描述
[一句话]

## 数据库类型
[SQL Server / PostgreSQL]

## 测量数据
| 指标 | 当前值 | 目标值 | 差距 |
|------|--------|--------|------|

## 瓶颈分析
**主瓶颈：** [描述]
**证据：** [测量数据/执行计划]

## 优化建议

### 1. [建议名称]
- **当前状态：** [描述]
- **建议操作：** [具体改法]
- **预期收益：** [从 X 降到 Y，提升 Z%]
- **风险：** [副作用]
- **优先级：** [P0/P1/P2]

## 实施顺序
1. [收益最大/风险最小的先做]

## 验证方法
[如何验证优化效果]
```

**注意：** 公司源码特殊编码，读取用 PowerShell。根据项目路径自动选择对应的数据库诊断模板。
