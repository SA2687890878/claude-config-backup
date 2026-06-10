# 架构审查清单

## 2.1 分层与依赖（通用）

- [ ] 依赖方向正确（上层依赖下层，不反向）
- [ ] 无循环依赖
- [ ] 业务逻辑未泄漏到 Controller/前端
- [ ] 数据访问限制在 Repository/数据层

## 2.2 .NET 架构（通用）

- [ ] 依赖注入正确使用（构造函数注入，不 new）
- [ ] 异步模型一致（async/await 全链路，不混用 .Result/.Wait()）
- [ ] 接口设计合理（ISP、依赖抽象不依赖具体）
- [ ] 配置管理（IOptions 模式、环境变量、密钥管理）
- [ ] 日志和可观测性（ILogger、结构化日志）

## 2.3 .NET Framework 4.5.2 (WPF) 特有

- [ ] MVVM 模式正确（View 不直接访问 Model）
- [ ] 数据绑定双向正确使用
- [ ] INotifyPropertyChanged 正确实现
- [ ] ICommand 替代事件处理
- [ ] 线程模型正确（UI 线程 vs 后台线程、Dispatcher）

## 2.4 数据访问（通用）

- [ ] EF 查询无 N+1 问题
- [ ] 延迟加载正确使用
- [ ] 事务边界明确
- [ ] 连接池配置合理
- [ ] 大数据量查询有分页

## 2.5 SQL Server Schema（老项目 `F:\Code WorkSpace\`）

- [ ] 表设计满足第三范式（除非有明确反范式理由）
- [ ] 索引策略合理（主键、外键、常用查询字段）
- [ ] 数据类型正确（`datetime2` 优于 `datetime`，`nvarchar` 优于 `varchar`）
- [ ] 考虑数据量增长（分区策略、归档方案）
- [ ] 排序规则一致（Collation 设置）
- [ ] IDENTITY 列使用 `SCOPE_IDENTITY()`
- [ ] 避免盲目使用 `NOLOCK` 提示

## 2.6 PostgreSQL Schema（新项目 `F:\OTD Code WorkSpace\`）

- [ ] 表设计满足第三范式（除非有明确反范式理由）
- [ ] 索引策略合理（主键、外键、常用查询字段）
- [ ] 数据类型正确（不用 varchar 存 JSON、不用 text 存枚举）
- [ ] 考虑数据量增长（分区策略、归档方案）
- [ ] JSONB 使用是否合理（是否需要 GIN 索引）
- [ ] `SERIAL` vs `GENERATED ALWAYS AS IDENTITY`（推荐后者）
- [ ] 大小写处理（标识符自动转小写）

## 2.7 API 设计（通用）

- [ ] RESTful 规范一致
- [ ] 错误处理统一（全局异常过滤器）
- [ ] 输入验证在入口层完成
- [ ] 幂等性考虑（POST vs PUT）
