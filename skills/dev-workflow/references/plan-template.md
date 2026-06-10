# 计划文档模板

````markdown
# [功能名] 实现计划

**目标:** [一句话描述构建什么]
**架构:** [2-3 句话描述方案]
**技术栈:** [关键技术/库]

---

### Task N: [组件名]

**文件：**
- 创建: `exact/path/to/file.cs`
- 修改: `exact/path/to/existing.cs:123-145`
- 测试: `tests/exact/path/to/test.cs`

- [ ] **Step 1: 写失败的测试**

```csharp
[Test]
public void SpecificBehavior_ShouldReturnExpected()
{
    var result = Function(input);
    Assert.AreEqual(expected, result);
}
```

- [ ] **Step 2: 运行确认失败**

运行: `dotnet test --filter "SpecificBehavior"`
预期: FAIL

- [ ] **Step 3: 写最小实现**

```csharp
public Result Function(Input input) => expected;
```

- [ ] **Step 4: 运行确认通过**

运行: `dotnet test --filter "SpecificBehavior"`
预期: PASS

- [ ] **Step 5: 提交**

```bash
git add src/path/file.cs tests/path/test.cs
git commit -m "feat: add specific feature"
```
````
