# 验证流程

## 验证流程

1. **运行编译**：`dotnet build --configuration Release`
2. **运行测试**：`dotnet test`
3. **记录退出码**：每条命令的真实退出码
4. **返回结果**：确定性的 PASS/FAIL

## 输出格式

```
## 验证结果：PASS/FAIL

### 编译验证
- 命令：dotnet build --configuration Release
- 退出码：0/1
- 输出：（只保留错误信息）

### 测试验证
- 命令：dotnet test
- 退出码：0/1
- 统计：通过 N / 失败 N / 跳过 N
- 失败详情：（只保留失败测试名和错误）

### 证据
- [实际运行的命令]
- [实际返回的内容]
```

## How to apply

- 每次验证必须按照这个流程执行
- 必须记录实际的退出码和输出
- 不能声称成功但没有实际运行
