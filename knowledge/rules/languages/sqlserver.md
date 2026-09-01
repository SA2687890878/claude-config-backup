---
paths:
  - "F:/Code WorkSpace/**"
---

# SQL Server 专项规则

## 连接与配置
- 使用 `Microsoft.Data.SqlClient`（非 `System.Data.SqlClient`）
- 连接字符串通过 `SqlConnectionStringBuilder` 构建
- `TrustServerCertificate=True` 仅用于开发环境

## 查询优化速查
- 执行计划：`SET STATISTICS IO ON` + SSMS
- 索引缺失：`sys.dm_db_missing_index_details`
- 阻塞检测：`sp_who2` 或 `sys.dm_exec_requests`
- 参数嗅探：`OPTION (RECOMPILE)` 或 `OPTIMIZE FOR UNKNOWN`

## EF Core
- `UseSqlServer()` 在 `AddDbContext` 中配置
- 不支持 `ILike`，用 `LIKE` + `EF.Functions.Collate`
- 分页：`OFFSET...FETCH NEXT`（SQL Server 2012+）
- `datetime2` 优于 `datetime`
- 只读查询必须 `AsNoTracking()`

## 常见陷阱
- `NOLOCK` 可能脏读，不要盲目使用
- `IDENTITY` 列用 `SCOPE_IDENTITY()`，不用 `@@IDENTITY`
- 高并发考虑 `SNAPSHOT` 隔离级别
- 参数化查询防 SQL 注入；外部输入必须校验，禁止拼接 SQL
- 更新操作优先使用明确的 UPDATE/UPSERT 语义，不以“先删除再插入”替代更新
- 多表写入、状态切换和批量变更明确事务边界、幂等性和失败回滚
- 批量写入优先集合操作；避免无必要的游标和循环内查询

## 工程纪律
- **未授权禁止连接 / 执行数据库**；"测试 / 只读 / 幂等"都不是执行理由，只有用户对具体环境 + 具体操作明确授权才可执行
- 升级脚本必须幂等（可重复执行）；新增 / 更新扩展属性，明确失败回滚与兼容风险
- 表 / 字段维护中文 `MS_Description`
- 删除 / 重命名 / 收窄字段 / 重建索引 / 历史数据迁移必须有已确认策略
- 默认不在建表脚本插入菜单数据、不自动授权角色
