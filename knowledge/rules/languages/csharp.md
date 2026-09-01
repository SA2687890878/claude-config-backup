---
paths:
  - "**/*.cs"
  - "**/*.csproj"
---

# C# / .NET 编码规范

## 源码读取（公司加密编码）

```powershell
[System.IO.File]::ReadAllText('路径', [System.Text.Encoding]::UTF8)
```
UTF-8 BOM（EF BB BF）是正常文本，不是乱码。

## 异步规范
- async/await 全链路一致，禁止 `.Result`/`.Wait()`
- 异步方法必须以 `Async` 结尾
- 禁止 `async void`（事件处理器除外）

## 依赖注入
- 构造函数注入，禁止在业务代码里 `new` 服务
- 使用 `IXxxService` 接口，不直接依赖具体实现

## 数据访问
- 只读查询用 `AsNoTracking()`
- 禁止循环内数据库调用（N+1）
- 大量数据查询必须分页（`Skip/Take`）
- 多租户字段 `ComId` 每个查询必须包含

## EF Core 实体
- 数据库列允许 NULL → 属性必须 `string?`（非 `string`）
- 新增字段时先确认数据库 NULL 约束

## 文件编码保护
- Read/Grep 返回乱码 → 先用 `xxd file | head -3` 检查编码
- 写 .cs 文件用 `[IO.File]::WriteAllText` 指定编码，不用 `Set-Content`
- 从 git 恢复编码损坏文件：`git cat-file -p HEAD:path/file.cs > path/file.cs`
- **DGClient 加密文件写入规则** → 详见 `rules/tools/code-access.md`

## 工程纪律
- 控制器薄层：业务逻辑放单一职责 Service，Controller 只做参数绑定与响应
- 多表写入 / 状态切换：明确事务与幂等；异常走统一响应与日志
- 外部 HTTP、SDK、设备和数据库调用：定义超时、取消和必要的重试/降级，不无限等待
- 外部输入和返回数据：明确校验、空值、异常格式和失败路径
- 组织级查询 / 写入必须绑定已验证用户 `com_id`，不信任客户端覆盖（见上"多租户"）
- 日志不泄露敏感信息（密钥 / Token / 密码 / 连接字符串）；输入输出按白名单记录
- 文件流、数据库连接、网络响应和句柄必须正常释放

## 注释

只为复杂业务规则、外部约束、兼容性决策和非显然的 Why 添加注释；不以注释比例衡量质量。
