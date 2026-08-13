---
paths:
  - "**/*.cs"
  - "**/*.csproj"
  - "**/*.vue"
  - "**/*.js"
---

# 代码访问规则（铁律）

> 探索代码时**先索引、最后 Read**。直接 Read 整文件是最浪费 token 的路径。

## 核心规则

1. **加密项目**：用 SQLite 索引 + CodeGraph，不要用 bash/head
2. **写入加密文件**：必须用 PowerShell，禁止用 node.exe
3. **决策树**：找符号→SQLite，看源码→CodeGraph，搜文档→context-mode

## 定位漏斗（先窄后宽，每步只喂必要输入）

1. **意图消歧** — 只看项目索引 / MEMORY / knowledge + 需求原话，产出 2-4 种技术解读
2. **模块定位** — 只看目录树 / CodeGraph 模块，锁定 2-3 个候选文件
3. **关键词搜索** — 脚本执行（SQLite 索引 / rg / ctx_search），不进 LLM，产出文件 + 行号
4. **调用链追踪** — 读单个文件相关片段（~10K），梳理调用链
5. **验证确认** — 读最终函数实现片段，确认改动点

原则：前 2 步不读代码，第 3 步脚本定位，第 4 步才真正 Read——不让 LLM 被整个库淹没。

## 详细参考

- 加密机制：`~/.claude/knowledge/rules/code-access/encryption.md`
- 索引系统：`~/.claude/knowledge/rules/code-access/indexing.md`
- 写入规则：`~/.claude/knowledge/rules/code-access/write-rules.md`
- 决策树：`~/.claude/knowledge/rules/code-access/decision-tree.md`

## 反模式（禁止）

- ❌ 直接 Read 整个 .cs 文件
- ❌ 用 bash/head 读取加密文件
- ❌ 用 node.exe 写入加密文件
