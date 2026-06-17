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
- [ ] 是否有死锁风险
- [ ] 异步操作是否正确处理

## HIGH — 很可能出问题

### 异步阻塞
- [ ] 是否有 .Result、.Wait()、.GetAwaiter().GetResult()
- [ ] 异步方法是否正确使用 async/await
- [ ] CancellationToken 是否正确传递
- [ ] Task.WhenAll 是否正确使用

### 异常处理
- [ ] 异常是否被吞掉
- [ ] 异常类型是否精确
- [ ] 资源释放是否在 finally 块
- [ ] 是否用异常做流程控制

## MEDIUM — 可能出问题

### N+1 查询
- [ ] 是否有循环查询数据库
- [ ] 是否正确使用 Include/ThenInclude
- [ ] 是否使用批量操作
- [ ] 是否使用缓存

### 代码质量
- [ ] 方法是否过长（>50行）
- [ ] 类是否过大（>500行）
- [ ] 是否有重复代码
- [ ] 命名是否规范
