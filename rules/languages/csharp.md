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
- Read/Grep 返回乱码 → 先用 `xxd file | head -3` 检查编码（FF FE = UTF-16LE，EF BB BF = UTF-8 BOM）
- 写 .cs 文件用 `[IO.File]::WriteAllText` 指定编码，不用 `Set-Content`（会改变编码）
- 从 git 恢复编码损坏文件：`git cat-file -p HEAD:path/file.cs > path/file.cs`
