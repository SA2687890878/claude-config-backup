# 安全扫描模式（执行时加载）

> 本文件是 security-scan 的具体扫描命令与检查项。SKILL.md 触发后，
> 进入「执行扫描」步骤时再读取本文件，按需逐类执行。

## 1. 依赖漏洞检查

```bash
# .NET 项目
dotnet list package --vulnerable --include-transitive
# 检查过期依赖
dotnet list package --outdated
```

## 2. 硬编码密钥检测

扫描关键词：`password`/`passwd`/`pwd`、`secret`/`token`/`apikey`/`api_key`、
`connectionstring`/`connstr`、`private_key`/`privatekey`、`access_key`/`accesskey`、
Base64 长字符串（>50 字符）。

```bash
grep -rn "password\s*=" --include="*.cs" --include="*.json" --include="*.config"
grep -rn "secret\s*=" --include="*.cs" --include="*.json"
grep -rn "token\s*=" --include="*.cs" --include="*.json"
grep -rn "connectionstring\s*=" --include="*.cs" --include="*.json"
```

## 3. SQL 注入检测

检查项：
- [ ] 字符串拼接 SQL（`$"SELECT * FROM {table}"`）
- [ ] 动态表名/列名未验证
- [ ] 原始 SQL 未参数化（`FromSqlRaw` 无参数）
- [ ] 存储过程调用未参数化

```bash
grep -rn 'FromSqlRaw\|ExecuteSqlRaw' --include="*.cs"
grep -rn '\$".*SELECT\|INSERT\|UPDATE\|DELETE' --include="*.cs"
grep -rn 'string\.Format.*SELECT\|INSERT\|UPDATE\|DELETE' --include="*.cs"
```

## 4. XSS 检测

检查项：
- [ ] 用户输入直接输出到 HTML
- [ ] 未转义的 Razor 变量（`@Html.Raw`）
- [ ] JavaScript 中的未转义数据

```bash
grep -rn 'Html\.Raw\|@Html.Raw' --include="*.cshtml"
```

## 5. 认证授权检查

检查项：
- [ ] API 端点是否有 `[Authorize]` 或 `[AllowAnonymous]`
- [ ] 敏感操作是否有权限验证
- [ ] JWT Token 配置是否安全
- [ ] CORS 配置是否过于宽松

```bash
grep -rn 'ApiController\|Controller' --include="*.cs" -l | \
  xargs grep -L 'Authorize'
```

## 6. 敏感数据泄露检查

检查项：
- [ ] 日志中是否记录敏感信息
- [ ] 错误响应是否暴露内部细节
- [ ] 数据库连接字符串是否明文
- [ ] 异常堆栈是否返回给客户端

```bash
grep -rn 'Log.*password\|Log.*token\|Log.*secret' --include="*.cs"
```
