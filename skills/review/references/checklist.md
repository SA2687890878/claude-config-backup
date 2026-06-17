# .NET 代码审查清单

## C# 核心

### 异步/并发
- [ ] async/await 全链路一致，没有 `.Result`、`.Wait()`、`.GetAwaiter().GetResult()`
- [ ] 异步方法命名以 `Async` 结尾
- [ ] `CancellationToken` 正确传递
- [ ] 没有 `async void`（除了事件处理器）
- [ ] `SemaphoreSlim` / `lock` 用于保护共享状态
- [ ] `Task.WhenAll` 用于并行，不是循环 await
- [ ] 没有在 `using` 块内 await 已释放的资源

### 资源管理
- [ ] `IDisposable` 对象在 `using` 块内使用
- [ ] 自定义类实现 `IDisposable` 时包含 `Dispose(bool)` 模式
- [ ] 数据库连接、HTTP 客户端、文件流正确释放
- [ ] `HttpClient` 使用 `IHttpClientFactory` 或单例，不 new

### 类型安全
- [ ] 可空引用类型正确使用（`?` 标记、null 检查）
- [ ] 没有不必要的装箱/拆箱
- [ ] 枚举处理了未定义值（switch 有 default）
- [ ] 字符串比较使用 `StringComparison.Ordinal` 或 `InvariantCulture`
- [ ] 数值转换没有溢出风险（checked/unchecked）

### 错误处理
- [ ] 异常不被吞掉（空 catch 块）
- [ ] 异常类型精确（不 catch `Exception` 然后忽略）
- [ ] `finally` 块或 `using` 保证资源释放
- [ ] 自定义异常有意义的 Message
- [ ] 不用异常做流程控制

### 设计模式
- [ ] 单一职责 — 类不承担过多职责
- [ ] 依赖注入 — 不在业务代码里 new 服务
- [ ] 接口隔离 — 接口不臃肿
- [ ] 魔法数字用常量或枚举替代
- [ ] 方法参数不超过 4 个（多了用对象封装）

## 数据访问 (EF/Npgsql)

### 查询安全
- [ ] 没有 SQL 注入（用参数化查询，不用字符串拼接）
- [ ] LINQ 查询不会导致 N+1（检查循环内的数据库调用）
- [ ] `Include()` 正确使用，避免过度加载
- [ ] `AsNoReadOnly()` / `AsNoTracking()` 用于只读查询
- [ ] 大量数据查询有分页（`Skip/Take`）
- [ ] `Any()` 替代 `Count() > 0`

### 事务
- [ ] 事务边界明确（多表写入在同一事务内）
- [ ] 事务不要太长（避免锁表）
- [ ] 死锁风险评估（多个事务以不同顺序访问表）

### 连接管理
- [ ] 连接字符串通过配置注入，不硬编码
- [ ] 连接池配置合理（MaxPoolSize、ConnectionIdleLifetime）
- [ ] 长时间操作不持有连接

## PostgreSQL

### Schema
- [ ] 外键有索引
- [ ] 常用查询字段有索引
- [ ] 数据类型正确（不用 varchar(255) 存所有字符串）
- [ ] 时间字段用 `timestamp with time zone`
- [ ] 枚举值用 `integer` 或 `text`，不用自定义 type（除非有充分理由）

### 查询
- [ ] `EXPLAIN ANALYZE` 验证过复杂查询的执行计划
- [ ] 没有 `SELECT *`（只查需要的列）
- [ ] `ILIKE` 走不了索引，考虑 `pg_trgm` 或全文搜索
- [ ] `OR` 条件可能导致全表扫描，考虑 `UNION`
- [ ] 聚合查询没有在大表上做全表扫描

## 安全

- [ ] 用户输入在入口层验证
- [ ] 敏感数据不记入日志
- [ ] API 端点有认证/授权检查
- [ ] 密钥/密码不硬编码在代码中
- [ ] CORS 配置不是 `*`
- [ ] 文件上传有大小和类型限制

## WPF 特有 (4.5.2)

- [ ] MVVM — View 不直接访问 Model
- [ ] `INotifyPropertyChanged` 正确实现
- [ ] 数据绑定路径正确（调试输出检查绑定错误）
- [ ] 长时间操作用 `BackgroundWorker` 或 `Task.Run` + `Dispatcher`
- [ ] 不在 UI 线程做数据库/网络调用
- [ ] `ICommand` 替代事件处理
- [ ] `ObservableCollection` 用于列表绑定
- [ ] 控件模板不硬编码尺寸

## Vue 2 前端

- [ ] `v-for` 有 `:key`
- [ ] 不在 `computed` 里做副作用
- [ ] 事件监听在 `beforeDestroy` 中移除
- [ ] API 调用有错误处理
- [ ] 用户输入有 XSS 防护
- [ ] 大列表使用虚拟滚动
