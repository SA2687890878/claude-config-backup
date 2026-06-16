---
applyTo: "**/*.cs, **/*.csproj, **/*.vue, **/*.js"
---

# 代码访问规则（铁律）

> 探索代码时**先索引、最后 Read**。直接 Read 整文件是最浪费 token 的路径。

## 核心规则

1. **加密项目**：用 SQLite 索引 + CodeGraph，不要用 bash/head
2. **写入加密文件**：必须用 PowerShell，禁止用 node.exe
3. **决策树**：找符号→SQLite，看源码→CodeGraph，搜文档→context-mode

## 详细参考

- 加密机制：`~/.claude/knowledge/rules/code-access/encryption.md`
- 索引系统：`~/.claude/knowledge/rules/code-access/indexing.md`
- 写入规则：`~/.claude/knowledge/rules/code-access/write-rules.md`
- 决策树：`~/.claude/knowledge/rules/code-access/decision-tree.md`

## 反模式（禁止）

- ❌ 直接 Read 整个 .cs 文件
- ❌ 用 bash/head 读取加密文件
- ❌ 用 node.exe 写入加密文件
