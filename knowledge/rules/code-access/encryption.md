# DGClient 加密机制

## 重要发现

DGClient 对**进程级别**做白名单，不是文件级别：

| 进程 | 读取结果 |
|------|----------|
| **bash/head** | ❌ 乱码（加密） |
| **node.exe** | ✅ 明文（解密） |
| **PowerShell** | ✅ 明文（解密） |
| **CodeGraph**（用 node.exe） | ✅ 明文（解密） |
| **context-mode JavaScript 沙箱** | ❌ 乱码（未白名单） |
| **context-mode Shell 模式** | ✅ 明文（调用系统进程） |

## How to apply

- 读取加密文件时，优先使用 node.exe 或 PowerShell
- 避免使用 bash/head 读取加密文件
- CodeGraph 可以读取加密文件（通过 node.exe）
