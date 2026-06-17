# .NET 8 Options 模式陷阱

## 陷阱 1：services.Configure\<T\>(IConfiguration) 不自动按类型名找 section

在 .NET 8 中，`services.Configure<T>(configuration)` **不会**自动去取 `configuration.GetSection(typeof(T).Name)`。它绑定到传入的 IConfiguration 的根节点。

```csharp
// ❌ 错误：ComId/TenantId 在 "Appsettings" 子节点下，根节点找不到
services.Configure<Appsettings>(configuration);

// ✅ 正确：显式指定 section
services.Configure<Appsettings>(configuration.GetSection("Appsettings"));
```

如果 appsettings.json 结构是 `{ "Appsettings": { "ComId": "SH12" } }`，必须用 `GetSection("Appsettings")`。

## 陷阱 2：UseStartup 的 ActivatorUtilities 不走 host 级 DI

`webBuilder.UseStartup<Startup>()` 内部通过 `ActivatorUtilities.CreateInstance` 创建 Startup 实例。这**不走** host 级别的 `ConfigureServices` 注册的服务。

```csharp
// Program.cs
Host.CreateDefaultBuilder(args)
    .ConfigureServices(services => services.Configure<Appsettings>(...))  // host 级
    .ConfigureWebHostDefaults(webBuilder => {
        webBuilder.UseStartup<Startup>();  // Startup 从这里创建
    });
```

Startup 构造函数中注入 `IOptions<Appsettings>` 会抛 `InvalidOperationException`，因为 host 级注册的服务在 `ActivatorUtilities` 解析时不可用。

**解决方案**：Startup 构造函数只注入 `IConfiguration`，手动 Bind：

```csharp
public Startup(IConfiguration configuration)
{
    Configuration = configuration;
    Appsettings = new Appsettings();
    configuration.GetSection("Appsettings").Bind(Appsettings);
}
```

## How to apply

- 使用 `services.Configure<T>()` 时，必须显式指定 `GetSection()`
- 使用 `UseStartup<T>()` 时，Startup 构造函数只注入 `IConfiguration`，手动 Bind
