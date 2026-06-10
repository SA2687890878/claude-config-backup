# 测试生成报告模板

```markdown
# 测试生成报告

## 生成范围
- 测试文件数：N
- 测试用例数：N
- 覆盖方法数：N

## 测试用例汇总

| 方法 | 正常路径 | 边界条件 | 异常路径 | 总计 |
|------|----------|----------|----------|------|
| GetUserAsync | 3 | 2 | 2 | 7 |
| CreateUserAsync | 2 | 1 | 3 | 6 |

## 生成的文件

- `tests/[Project].Tests/Services/UserServiceTests.cs`
- `tests/[Project].Tests/Helpers/TestDataBuilder.cs`

## 运行测试

```bash
dotnet test tests/[Project].Tests/
```

## 覆盖率目标

- 行覆盖率：>80%
- 分支覆盖率：>70%
- 方法覆盖率：>90%

## 注意事项

- [需要手动补充的测试]
- [需要外部依赖的测试]
- [需要集成测试的场景]
```
