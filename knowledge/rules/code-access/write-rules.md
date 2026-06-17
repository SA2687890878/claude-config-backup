# 写入规则（铁律）

## 规则

**编辑加密 .cs 文件时，必须用 PowerShell 脚本写入，禁止用 node.exe 写入。**

| 操作 | node.exe | PowerShell | bash |
|------|---------|------------|------|
| 读取 | ✅ 明文 | ✅ 明文 | ❌ 乱码 |
| 写入 | ❌ 破坏格式 | ✅ 保持加密 | ❌ 不可用 |

## 正确写入方式

```javascript
const psScript = `
$filePath = Join-Path '<项目路径>' '相对路径'
$content = Get-Content -Path $filePath -Raw
$content = $content.Replace('旧内容', '新内容')
[System.IO.File]::WriteAllText($filePath, $content)
`;
execSync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`);
```

## 禁止

```javascript
// ❌ node.exe 写入会破坏加密格式
fs.writeFileSync(path, content, 'utf8');
```

## How to apply

- 编辑加密 .cs 文件时，必须使用 PowerShell 脚本
- 不要使用 node.exe 或 bash 写入加密文件
