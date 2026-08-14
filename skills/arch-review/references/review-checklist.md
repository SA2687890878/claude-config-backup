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

## 2.5 SQL Server Schema（老项目，如本机 `F:\Code WorkSpace\`）

- [ ] 表设计满足第三范式（除非有明确反范式理由）
- [ ] 索引策略合理（主键、外键、常用查询字段）
- [ ] 数据类型正确（`datetime2` 优于 `datetime`，`nvarchar` 优于 `varchar`）
- [ ] 考虑数据量增长（分区策略、归档方案）
- [ ] 排序规则一致（Collation 设置）
- [ ] IDENTITY 列使用 `SCOPE_IDENTITY()`
- [ ] 避免盲目使用 `NOLOCK` 提示

## 2.6 PostgreSQL Schema（新项目，如本机 `F:\OTD Code WorkSpace\`）

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

## 2.8 设计深度检查

> 借鉴 mattpocock/skills 的 codebase-design 词汇，适配 .NET 场景。

对每个新增/修改的模块，问三个问题：

### Depth（深度）

接口是否比实现简单？

```
✅ 深度好：IOrderService 只有 3 个方法，内部封装了复杂的业务逻辑
❌ 浅模块：IOrderHelper 有 15 个方法，每个方法只有 1-2 行
```

**判断标准**：接口方法数 ≤ 实现复杂度的 1/3。如果接口和实现一样复杂，考虑合并或重构。

### Deletion test（删除测试）

删掉这个模块，复杂度是消失了还是转移了？

```
✅ 值得存在：删掉 OrderValidator，所有调用方都要自己写验证逻辑
❌ pass-through：删掉 OrderHelper，调用方直接调底层方法反而更清楚
```

**判断标准**：如果删掉后复杂度转移到 N 个调用方，模块在赚回票价。如果删掉后复杂度消失了，它是多余的。

### Seam（接缝）

这个模块是否有可替换的能力？

```
✅ 真正的 seam：IPaymentGateway 有 StripeAdapter 和 MockAdapter
❌ 假设性 seam：IConfigReader 只有一个实现，可能过度设计
```

**判断标准**：有 2+ 个 adapter（生产+测试）= 真正的 seam。只有 1 个 = 假设性 seam，除非明确计划要加第二个。
