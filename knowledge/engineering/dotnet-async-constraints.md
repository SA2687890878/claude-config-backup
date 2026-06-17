# .NET 异步约束

## EF Core SqlNullValueException

### 场景

EF Core 查询时报错：
```
System.Data.SqlTypes.SqlNullValueException: Data is Null. This method or property cannot be called on Null values.
   at Microsoft.Data.SqlClient.SqlBuffer.get_String()
```

### 根因

EF 实体属性声明为 `string`（非空），但数据库对应列存在 NULL 值。EF Core 内部用 `SqlDataReader.GetString()` 读取，遇到 NULL 直接抛异常。

### 修复

将实体属性从 `string` 改为 `string?`：
```csharp
// 修复前
public string DefaultProductionWhId { get; set; } = string.Empty;

// 修复后
public string? DefaultProductionWhId { get; set; }
```

### 排查步骤

1. 看堆栈找到出错的 Service 方法和行号
2. 检查该方法的 LINQ 查询 `.Select()` 映射了哪些实体属性
3. 对比实体属性类型与数据库列是否允许 NULL
4. 将不匹配的属性改为 `string?`

### 注意

- 新增字段时，如果数据库列允许 NULL，实体属性必须声明为 `string?`
- DTO 的可空类型要与实体保持一致

### Why

数据库列允许 NULL 是常见情况，实体属性不匹配会导致查询直接崩溃。

### How to apply

新增 EF 实体字段时，先确认数据库列的 NULL 约束，再决定属性是否可空。
