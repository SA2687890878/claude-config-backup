# 测试模式参考

## 测试分类

| 类型 | 目的 | 示例 |
|------|------|------|
| **正常路径** | 验证预期行为 | 输入正确数据，返回正确结果 |
| **边界条件** | 验证边界值 | 空值、最大值、最小值、零值 |
| **异常路径** | 验证错误处理 | 无效输入、依赖失败、超时 |
| **并发场景** | 验证线程安全 | 多线程同时访问 |

## 命名规范

```
[方法名]_[场景]_[预期结果]

示例：
GetUserAsync_ExistingId_ReturnsUser
GetUserAsync_NonExistingId_ThrowsNotFoundException
GetUserAsync_EmptyId_ThrowsArgumentException
```

## AAA 模式

```csharp
[Fact]
public async Task GetUserAsync_ExistingId_ReturnsUser()
{
    // Arrange - 准备测试数据和 mock
    var userId = 1;
    var expectedUser = new User { Id = userId, Name = "Test" };
    _mockRepository.Setup(x => x.GetByIdAsync(userId))
        .ReturnsAsync(expectedUser);

    // Act - 执行被测试的方法
    var result = await _userService.GetUserAsync(userId);

    // Assert - 验证结果
    Assert.NotNull(result);
    Assert.Equal(expectedUser.Id, result.Id);
    Assert.Equal(expectedUser.Name, result.Name);
}
```

## 常见测试模式

### 返回值测试

```csharp
[Fact]
public async Task GetByIdAsync_ExistingId_ReturnsEntity()
{
    var id = 1;
    var expected = new Entity { Id = id };
    _mockRepo.Setup(x => x.GetByIdAsync(id)).ReturnsAsync(expected);

    var result = await _service.GetByIdAsync(id);

    result.Should().NotBeNull();
    result.Should().BeEquivalentTo(expected);
}
```

### 异常测试

```csharp
[Fact]
public async Task GetByIdAsync_NonExistingId_ThrowsNotFoundException()
{
    var id = 999;
    _mockRepo.Setup(x => x.GetByIdAsync(id)).ReturnsAsync((Entity?)null);

    await _service.Invoking(x => x.GetByIdAsync(id))
        .Should().ThrowAsync<NotFoundException>()
        .WithMessage($"Entity with id {id} not found");
}
```

### 参数验证测试

```csharp
[Theory]
[InlineData(null)]
[InlineData("")]
[InlineData("   ")]
public async Task GetByIdAsync_InvalidId_ThrowsArgumentException(string? id)
{
    await _service.Invoking(x => x.GetByIdAsync(id))
        .Should().ThrowAsync<ArgumentException>();
}
```

### 集合测试

```csharp
[Fact]
public async Task GetAllAsync_ReturnsAllEntities()
{
    var entities = new List<Entity>
    {
        new() { Id = 1, Name = "Test1" },
        new() { Id = 2, Name = "Test2" }
    };
    _mockRepo.Setup(x => x.GetAllAsync()).ReturnsAsync(entities);

    var result = await _service.GetAllAsync();

    result.Should().HaveCount(2);
    result.Should().BeEquivalentTo(entities);
}
```

## .NET 特有注意事项

### 异步方法测试

```csharp
// ✅ 正确
[Fact]
public async Task MethodAsync_ReturnsResult()
{
    var result = await _service.MethodAsync();
    Assert.NotNull(result);
}

// ❌ 错误 - 不要用 .Result（可能死锁）
[Fact]
public void MethodAsync_ReturnsResult()
{
    var result = _service.MethodAsync().Result;
}
```

### DbContext 测试

```csharp
var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseInMemoryDatabase(databaseName: "TestDb")
    .Options;
using var context = new AppDbContext(options);
```

### HttpClient 测试

```csharp
var mockHttpMessageHandler = new Mock<HttpMessageHandler>();
mockHttpMessageHandler.Protected()
    .Setup<Task<HttpResponseMessage>>("SendAsync", ...)
    .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK));
var httpClient = new HttpClient(mockHttpMessageHandler.Object);
```
