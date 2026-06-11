---
name: settings-json-paths
description: settings.json中hook路径必须用正斜杠，反斜杠会被吞掉导致MODULE_NOT_FOUND
metadata:
  type: feedback
---

## 问题

settings.json 中 hook 命令的路径如果用反斜杠：
```json
"command": "node C:\\Users\\admin\\.claude\\hooks\\secret-guard.js"
```

JSON 解析后变成 `C:\Users\admin\.claude\hooks\secret-guard.js`，传给 shell 时反斜杠被当作转义字符，实际路径变成 `C:Usersadmin.claudehookssecret-guard.js`，导致 `MODULE_NOT_FOUND`。

## 正确写法

```json
"command": "node C:/Users/admin/.claude/hooks/secret-guard.js"
```

正斜杠在 Windows 和 Unix 都有效，不会有转义问题。

## Why:
JSON 中 `\\` 解析为 `\`，而 shell（cmd/bash）中 `\` 是转义前缀。正斜杠无此问题。

## How to apply:
所有 settings.json 中的文件路径统一使用正斜杠 `/`。
