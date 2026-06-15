# .NET 代码审查清单

## CRITICAL — 生产必炸

### 空指针引用
- [ ] Find/FirstOrDefault/SingleOrDefault 返回后是否检查 null
- [ ] 字符串操作前是否检查 null
- [ ] 集合操作前是否检查 null/Empty
- [ ] 可空类型是否正确使用（?.、??、.HasValue）
- [ ] 字典 TryGetValue 后是否检查返回值

### 资源泄露
- [ ] IDisposable 对象是否在 using 块内使用
- [ ] 数据库连接是否正确释放
- [ ] 文件流是否正确关闭
- [ ] HttpClient 是否使用工厂模式（不 new）
- [ ] 自定义 Dispose 是否正确实现 Dispose(bool) 模式

### SQL 注入
- [ ] 是否使用参数化查询
- [ ] 是否有字符串拼接 SQL
- [ ] EF Core 的 FromSqlRaw/ExecuteSqlRaw 是否正确传参
- [ ] 动态 SQL 是否安全

### 并发死锁
- [ ] 共享状态是否有锁保护
- [ ] 锁的粒度是否合适
- [ ] 是否有死锁风险（多个锁顺序不一致）
- [ ] SemaphoreSlim / lock 使用是否正确

## HIGH — 很可能出问题

### 异步阻塞
- [ ] 没有 .Result / .Wait() / .GetAwaiter().GetResult()
- [ ] async/await 全链路一致
- [ ] 没有 async void（除了事件处理器）
- [ ] CancellationToken 正确传递

### 异常处理
- [ ] 异常不被吞掉（空 catch 块）
- [ ] 异常类型精确（不 catch Exception 然后忽略）
- [ ] finally 块或 using 保证资源释放
- [ ] 不用异常做流程控制

### 边界条件
- [ ] 集合为空时是否处理
- [ ] 字符串为空/null 时是否处理
- [ ] 数值为 0 时是否处理（除法）
- [ ] 枚举未定义值时是否处理（switch 有 default）

## MEDIUM — 可能出问题

### 数据访问
- [ ] LINQ 查询不会导致 N+1
- [ ] Include() 正确使用，避免过度加载
- [ ] AsNoReadOnly() / AsNoTracking() 用于只读查询
- [ ] 大量数据查询有分页
- [ ] Any() 替代 Count() > 0

### 事务
- [ ] 事务边界明确
- [ ] 事务不要太长
- [ ] 死锁风险评估

### 设计
- [ ] 单一职责 — 类不承担过多职责
- [ ] 依赖注入 — 不在业务代码里 new 服务
- [ ] 魔法数字用常量或枚举替代
- [ ] 方法参数不超过 4 个

## LOW — 代码质量

- [ ] 异步方法命名以 Async 结尾
- [ ] 注释清晰
- [ ] 方法长度合理（<50 行）
- [ ] 命名有意义
