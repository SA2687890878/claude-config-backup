# 测试最佳实践

## 测试命名规范

### .NET 测试命名
```csharp
// 格式：方法名_场景_预期结果
[Fact]
public void GetUser_ExistingId_ReturnsUser() { }

[Fact]
public void GetUser_NonExistingId_ThrowsNotFoundException() { }

[Fact]
public void GetUser_EmptyId_ThrowsArgumentException() { }
```

### 前端测试命名
```javascript
// 格式：should 期望行为 when 场景
describe('UserService', () => {
  test('should return user when id exists', () => { });
  test('should throw error when id is invalid', () => { });
  test('should return null when user not found', () => { });
});
```

## 测试结构

### AAA 模式
```csharp
[Fact]
public void GetUser_ExistingId_ReturnsUser()
{
    // Arrange - 准备测试数据
    var service = new UserService();
    var userId = 1;
    
    // Act - 执行被测试操作
    var user = service.GetUser(userId);
    
    // Assert - 验证结果
    Assert.NotNull(user);
    Assert.Equal(userId, user.Id);
}
```

### Given-When-Then 模式
```gherkin
Given 用户ID为1
When 调用GetUser方法
Then 返回用户对象
And 用户ID为1
```

## 测试数据管理

### 使用 Fixture
```csharp
public class UserServiceTests : IDisposable
{
    private readonly UserService _service;
    private readonly List<User> _testUsers;
    
    public UserServiceTests()
    {
        _service = new UserService();
        _testUsers = new List<User>
        {
            new User { Id = 1, Name = "John" },
            new User { Id = 2, Name = "Jane" }
        };
    }
    
    public void Dispose()
    {
        // 清理测试数据
    }
}
```

### 使用 Builder 模式
```csharp
public class UserBuilder
{
    private int _id = 1;
    private string _name = "TestUser";
    
    public UserBuilder WithId(int id) { _id = id; return this; }
    public UserBuilder WithName(string name) { _name = name; return this; }
    public User Build() => new User { Id = _id, Name = _name };
}

// 使用
var user = new UserBuilder().WithId(1).WithName("John").Build();
```

## Mock 使用

### Moq（.NET）
```csharp
[Fact]
public void GetUser_ExistingId_ReturnsUser()
{
    // Arrange
    var mockRepository = new Mock<IUserRepository>();
    mockRepository.Setup(r => r.GetById(1))
        .Returns(new User { Id = 1, Name = "John" });
    
    var service = new UserService(mockRepository.Object);
    
    // Act
    var user = service.GetUser(1);
    
    // Assert
    Assert.NotNull(user);
    Assert.Equal("John", user.Name);
    mockRepository.Verify(r => r.GetById(1), Times.Once);
}
```

### Jest Mock（前端）
```javascript
test('getUser returns user for valid id', async () => {
  // Arrange
  const mockFetch = jest.fn().mockResolvedValue({
    json: () => Promise.resolve({ id: 1, name: 'John' })
  });
  global.fetch = mockFetch;
  
  // Act
  const user = await getUser(1);
  
  // Assert
  expect(user).toEqual({ id: 1, name: 'John' });
  expect(mockFetch).toHaveBeenCalledWith('/api/users/1');
});
```

## 测试隔离

### 原则
1. **测试之间独立** — 不依赖执行顺序
2. **不共享状态** — 每个测试有自己的数据
3. **清理资源** — 测试后清理创建的资源

### 示例
```csharp
public class UserServiceTests : IDisposable
{
    private readonly UserService _service;
    private readonly string _testDirectory;
    
    public UserServiceTests()
    {
        _service = new UserService();
        _testDirectory = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        Directory.CreateDirectory(_testDirectory);
    }
    
    public void Dispose()
    {
        if (Directory.Exists(_testDirectory))
            Directory.Delete(_testDirectory, true);
    }
}
```
