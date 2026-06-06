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
