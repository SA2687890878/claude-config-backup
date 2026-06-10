# 代码模板

## 项目结构

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

## 依赖包

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

## 测试类模板

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

## Bogus 数据生成

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

## Builder 模式

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
