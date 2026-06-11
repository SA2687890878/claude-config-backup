---
name: dgclient-encryption-mechanism
description: DGClient加密机制——进程级白名单，不同工具读取结果不同
metadata:
  type: reference
---

## DGClient 加密机制

DGClient 对**进程级别**做白名单，不是文件级别：

| 进程 | 读取结果 |
|------|----------|
| **bash/head/grep** | ❌ 乱码（加密） |
| **node.exe** | ✅ 明文（解密） |
| **PowerShell** | ✅ 明文（解密） |
| **CodeGraph**（用 node.exe） | ✅ 明文（解密） |
| **context-mode JavaScript 沙箱** | ❌ 乱码（未白名单） |
| **context-mode Shell 模式** | ✅ 明文（调用系统进程） |

### 应用

- 用 CodeGraph 读取加密项目源码（`codegraph_explore`）
- 用 PowerShell/context-mode Shell 执行命令读取加密文件
- 不要用 bash/head/cat 读取加密项目的 .cs 文件
- 修改加密 .cs 文件用 git blob 三步曲

## Why:
DGClient 的白名单机制决定了哪些工具能读明文。选错工具会读到乱码，浪费时间排查。

## How to apply:
遇到加密项目时，优先用 CodeGraph/PowerShell 读取源码，不要用 bash。
