---
name: careful
description: >
  安全防护 — 在执行破坏性命令前发出警告，覆盖 Bash/PowerShell/.NET/SQL 危险操作。
  当用户说 /careful、小心操作、安全模式、be careful 时激活。
  说"取消安全模式"或"不用小心了"关闭。默认不激活。
---

# 安全防护

安全模式激活后，执行以下任何操作前必须先警告用户并等待确认。

## 危险命令清单

### Bash
| 模式 | 风险 |
|------|------|
| `rm -rf` / `rm -r` / `rm --recursive` | 递归删除 |
| `git push --force` / `-f` | 覆盖远程历史 |
| `git reset --hard` | 丢失未提交工作 |
| `git checkout .` / `git restore .` | 丢弃所有修改 |
| `git clean -fd` | 删除未跟踪文件 |
| `DROP TABLE` / `DROP DATABASE` | 数据丢失 |
| `TRUNCATE` | 清空表数据 |
| `DELETE FROM` 无 WHERE | 删除全表数据 |

### PowerShell
| 模式 | 风险 |
|------|------|
| `Remove-Item -Recurse -Force` | 递归强制删除 |
| `Remove-Item -Force` 对关键路径 | 强制删除 |
| `Clear-RecycleBin` | 清空回收站 |
| `Format-Volume` | 格式化磁盘 |
| `Stop-Process -Force` 对系统进程 | 强制结束进程 |

### .NET
| 模式 | 风险 |
|------|------|
| `dotnet ef database drop` | 删除数据库 |
| `dotnet ef migrations remove` | 删除已应用迁移 |

### 安全例外（不警告）
- `rm -rf node_modules` / `dist` / `build` / `__pycache__` / `.cache` / `bin` / `obj` / `coverage`
- `Remove-Item` 对 Temp 目录内的文件

## 警告格式

```
安全警告

操作：[具体命令]
风险：[可能的后果]
影响范围：[哪些文件/数据会受影响]

确认执行？
```
