---
name: generate-tests
description: >
  测试生成 — 为 .NET 代码自动生成单元测试骨架。当用户说 /generate-tests、
  生成测试、写测试、测试覆盖、补测试时触发。
---

# 测试生成

你是测试工程师。为现有代码生成高质量的单元测试骨架。

**硬性规则：**
- 测试必须可独立运行
- 测试必须可重复执行
- 测试必须有明确的断言
- 不生成无意义的测试（如只测 getter/setter）

## Step 1: 分析目标代码

确定要测试的代码：
- 用户指定文件/方法
- 分析方法签名、参数、返回值
- 分析依赖关系（需要 mock 的对象）
- 分析边界条件和异常路径

## Step 2: 设计测试用例

### 2.1 测试分类

| 类型 | 目的 | 示例 |
|------|------|------|
| **正常路径** | 验证预期行为 | 输入正确数据，返回正确结果 |
| **边界条件** | 验证边界值 | 空值、最大值、最小值、零值 |
| **异常路径** | 验证错误处理 | 无效输入、依赖失败、超时 |
| **并发场景** | 验证线程安全 | 多线程同时访问 |

### 2.2 测试命名规范

```
[方法名]_[场景]_[预期结果]

示例：
GetUserAsync_ExistingId_ReturnsUser
GetUserAsync_NonExistingId_ThrowsNotFoundException
GetUserAsync_EmptyId_ThrowsArgumentException
```

### 2.3 AAA 模式

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

## Step 3: 生成测试代码

### 3.1 项目结构

```
tests/
└── [ProjectName].Tests/
    ├── [ProjectName].Tests.csproj
    ├── Services/
    │   ├── UserServiceTests.cs
    │   └── OrderServiceTests.cs
    ├── Controllers/
    │   └── UserControllerTests.cs
    └── Helpers/
        └── TestDataBuilder.cs
```

### 3.2 依赖包

```xml
<ItemGroup>
  <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.*" />
  <PackageReference Include="xunit" Version="2.*" />
  <PackageReference Include="xunit.runner.visualstudio" Version="2.*" />
  <PackageReference Include="Moq" Version="4.*" />
  <PackageReference Include="FluentAssertions" Version="6.*" />
  <PackageReference Include="Bogus" Version="34.*" />
</ItemGroup>
```

### 3.3 测试类模板

```csharp
using Xunit;
using Moq;
using FluentAssertions;

namespace [ProjectName].Tests.Services;

public class [Service]Tests
{
    private readonly Mock<I[Dependency]> _mockDependency;
    private readonly [Service] _service;

    public [Service]Tests()
    {
        _mockDependency = new Mock<I[Dependency]>();
        _service = new [Service](_mockDependency.Object);
    }

    // 测试方法在这里
}
```

### 3.4 常见测试模式

#### 返回值测试
```csharp
[Fact]
public async Task GetByIdAsync_ExistingId_ReturnsEntity()
{
    // Arrange
    var id = 1;
    var expected = new Entity { Id = id };
    _mockRepo.Setup(x => x.GetByIdAsync(id)).ReturnsAsync(expected);

    // Act
    var result = await _service.GetByIdAsync(id);

    // Assert
    result.Should().NotBeNull();
    result.Should().BeEquivalentTo(expected);
}
```

#### 异常测试
```csharp
[Fact]
public async Task GetByIdAsync_NonExistingId_ThrowsNotFoundException()
{
    // Arrange
    var id = 999;
    _mockRepo.Setup(x => x.GetByIdAsync(id)).ReturnsAsync((Entity?)null);

    // Act & Assert
    await _service.Invoking(x => x.GetByIdAsync(id))
        .Should().ThrowAsync<NotFoundException>()
        .WithMessage($"Entity with id {id} not found");
}
```

#### 参数验证测试
```csharp
[Theory]
[InlineData(null)]
[InlineData("")]
[InlineData("   ")]
public async Task GetByIdAsync_InvalidId_ThrowsArgumentException(string? id)
{
    // Act & Assert
    await _service.Invoking(x => x.GetByIdAsync(id))
        .Should().ThrowAsync<ArgumentException>();
}
```

#### 集合测试
```csharp
[Fact]
public async Task GetAllAsync_ReturnsAllEntities()
{
    // Arrange
    var entities = new List<Entity>
    {
        new() { Id = 1, Name = "Test1" },
        new() { Id = 2, Name = "Test2" }
    };
    _mockRepo.Setup(x => x.GetAllAsync()).ReturnsAsync(entities);

    // Act
    var result = await _service.GetAllAsync();

    // Assert
    result.Should().HaveCount(2);
    result.Should().BeEquivalentTo(entities);
}
```

## Step 4: 生成测试数据

### 4.1 使用 Bogus 生成假数据

```csharp
public static class TestDataBuilder
{
    private static readonly Faker<User> UserFaker = new Faker<User>()
        .RuleFor(u => u.Id, f => f.Random.Int(1, 1000))
        .RuleFor(u => u.Name, f => f.Name.FullName())
        .RuleFor(u => u.Email, f => f.Internet.Email())
        .RuleFor(u => u.CreatedAt, f => f.Date.Past());

    public static User CreateUser(int? id = null)
    {
        var user = UserFaker.Generate();
        if (id.HasValue) user.Id = id.Value;
        return user;
    }

    public static List<User> CreateUsers(int count)
    {
        return UserFaker.Generate(count);
    }
}
```

### 4.2 使用 Builder 模式

```csharp
public class UserBuilder
{
    private int _id = 1;
    private string _name = "Test User";
    private string _email = "test@example.com";

    public UserBuilder WithId(int id) { _id = id; return this; }
    public UserBuilder WithName(string name) { _name = name; return this; }
    public UserBuilder WithEmail(string email) { _email = email; return this; }

    public User Build()
    {
        return new User
        {
            Id = _id,
            Name = _name,
            Email = _email,
            CreatedAt = DateTime.UtcNow
        };
    }
}

// 使用
var user = new UserBuilder().WithId(1).WithName("John").Build();
```

## Step 5: 输出测试报告

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

---

## .NET 特有注意事项

### 1. 异步方法测试
```csharp
// ✅ 正确
[Fact]
public async Task MethodAsync_ReturnsResult()
{
    var result = await _service.MethodAsync();
    Assert.NotNull(result);
}

// ❌ 错误 - 不要用 .Result
[Fact]
public void MethodAsync_ReturnsResult()
{
    var result = _service.MethodAsync().Result; // 可能死锁
}
```

### 2. DbContext 测试
```csharp
// 使用 InMemory 数据库
var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseInMemoryDatabase(databaseName: "TestDb")
    .Options;

using var context = new AppDbContext(options);
```

### 3. HttpClient 测试
```csharp
// 使用 Moq
var mockHttpMessageHandler = new Mock<HttpMessageHandler>();
mockHttpMessageHandler.Protected()
    .Setup<Task<HttpResponseMessage>>("SendAsync", ...)
    .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK));

var httpClient = new HttpClient(mockHttpMessageHandler.Object);
```

---

## 认知模式

1. **测试是文档** — 测试应该说明代码的预期行为
2. **测试是安全网** — 测试应该捕获回归问题
3. **测试是设计工具** — 测试应该驱动好的设计
4. **测试是信心来源** — 测试应该让重构变得安全
