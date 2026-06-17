---
name: sync-source-index
description: >
  同步加密源码到可读副本并重建 context-mode 索引。
  当用户说 同步源码、刷新索引、sync source、重新索引时触发。
  转换加密文件为可读格式，清除旧索引，重建新索引，验证可搜索性。
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Agent, mcp__context-mode__ctx_index, mcp__context-mode__ctx_purge, mcp__context-mode__ctx_search
version: 1.0.0
---

# 源码同步与索引

公司源码文件使用特殊编码，标准工具读不了，必须用 PowerShell `-Encoding UTF8` 转换后才能被 context-mode 索引。

转换脚本位于 `${CLAUDE_SKILL_DIR}/scripts/convert-source.ps1`。

## 步骤

### 1. 发现项目

扫描 `$ARGUMENTS` 指定的目录（或当前工作目录的父级），找：
- .NET 项目：含 `.sln` 或 `.csproj` 的目录
- Vue 前端：`package.json` 中依赖含 `vue` 的目录

排除 `node_modules`、`bin`、`obj`、`dist`、`.git`。

对每个项目提取：
- **项目名**：目录名，`.` → `-`（如 `otd.pcs.webbackend` → `otd-pcs-backend`）
- **源码目录**：项目下的 `src/`
- **临时目录**：`$env:TEMP\<项目名>-decoded`
- **索引标签**：`<项目名>-src`
- **扩展名**：.NET → `*.cs`，Vue → `*.vue,*.js,*.ts`

### 2. 转换源码

对每个项目执行 PowerShell 脚本：

```bash
powershell.exe -ExecutionPolicy Bypass -File "${CLAUDE_SKILL_DIR}/scripts/convert-source.ps1" \
  -SrcDir "<项目src路径>" -DstDir "<临时目录>" -Extensions "*.cs"
```

**注意**：Bash 中 `$` 会被吃掉，不要内联 PowerShell 代码，必须用脚本文件。

### 3. 重建索引

用 `ctx_index` 索引每个项目的临时目录。同标签已有旧索引时先 `ctx_purge` 清除。

### 4. 验证

`ctx_search` 搜一个源码中的类名，确认非乱码。
