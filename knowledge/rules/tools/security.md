# 安全规则

## 密钥防护

**禁止**硬编码密钥、密码、Token。使用环境变量或 secrets manager。

具体检测模式见 `~/.claude/hooks/secret-guard.js`。

## 文件写入防护

禁止在用户主目录根下创建垃圾文件。允许写入项目目录和 `~/.claude/` 系统目录。

具体规则见 `~/.claude/hooks/write-guard.js`。

## C# 代码检查

写入 `.cs` 文件后自动检查语法和异步问题。

具体检查项见 `~/.claude/hooks/cs-guard.js`。

## 通用安全原则

- 不信任客户端输入
- 敏感操作需确认
- 日志中不记录密码/Token
