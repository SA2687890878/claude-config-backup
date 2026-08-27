# research 安装配置

## 前置条件

- Python 3.10+
- Scrapling（可选，自动安装）
- Playwright（可选，JS 渲染）

## Scrapling MCP 注册

运行 `/research` 时自动检测和安装。手动注册格式：

```json
{
  "mcp": {
    "scrapling": {
      "type": "local",
      "command": ["<python-path>", "<mcp-server-script-path>"],
      "enabled": true
    }
  }
}
```
