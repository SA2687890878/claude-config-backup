# 测试框架参考

## .NET 测试框架

### xUnit
```csharp
// 安装
dotnet add package xunit
dotnet add package xunit.runner.visualstudio

// 基本用法
public class UserServiceTests
{
    [Fact]
    public void GetUser_ExistingId_ReturnsUser()
    {
        // Arrange
        var service = new UserService();
        
        // Act
        var user = service.GetUser(1);
        
        // Assert
        Assert.NotNull(user);
        Assert.Equal("John", user.Name);
    }
    
    [Theory]
    [InlineData(1, "John")]
    [InlineData(2, "Jane")]
    public void GetUser_ValidId_ReturnsUser(int id, string expectedName)
    {
        // Arrange
        var service = new UserService();
        
        // Act
        var user = service.GetUser(id);
        
        // Assert
        Assert.NotNull(user);
        Assert.Equal(expectedName, user.Name);
    }
}
```

### NUnit
```csharp
// 安装
dotnet add package NUnit
dotnet add package NUnit3TestAdapter

// 基本用法
[TestFixture]
public class UserServiceTests
{
    [Test]
    public void GetUser_ExistingId_ReturnsUser()
    {
        // Arrange
        var service = new UserService();
        
        // Act
        var user = service.GetUser(1);
        
        // Assert
        Assert.That(user, Is.Not.Null);
        Assert.That(user.Name, Is.EqualTo("John"));
    }
}
```

## 前端测试框架

### Jest
```javascript
// 安装
npm install --save-dev jest

// 基本用法
describe('UserService', () => {
  test('getUser returns user for valid id', async () => {
    // Arrange
    const service = new UserService();
    
    // Act
    const user = await service.getUser(1);
    
    // Assert
    expect(user).toBeDefined();
    expect(user.name).toBe('John');
  });
  
  test('getUser throws for invalid id', async () => {
    // Arrange
    const service = new UserService();
    
    // Act & Assert
    await expect(service.getUser(-1)).rejects.toThrow();
  });
});
```

### Vitest
```javascript
// 安装
npm install --save-dev vitest

// 基本用法
import { describe, test, expect } from 'vitest';

describe('UserService', () => {
  test('getUser returns user for valid id', async () => {
    // Arrange
    const service = new UserService();
    
    // Act
    const user = await service.getUser(1);
    
    // Assert
    expect(user).toBeDefined();
    expect(user.name).toBe('John');
  });
});
```
