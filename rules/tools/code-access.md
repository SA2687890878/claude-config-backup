---
applyTo: "**/*.cs, **/*.csproj, **/*.vue, **/*.js"
---

# 代码访问规则（铁律）

> 探索代码时**先索引、最后 Read**。直接 Read 整文件是最浪费 token 的路径。

## DGClient 加密机制（重要发现）

DGClient 对**进程级别**做白名单，不是文件级别：

| 进程 | 读取结果 |
|------|----------|
| **bash/head** | ❌ 乱码（加密） |
| **node.exe** | ✅ 明文（解密） |
| **PowerShell** | ✅ 明文（解密） |
| **CodeGraph**（用 node.exe） | ✅ 明文（解密） |
| **context-mode JavaScript 沙箱** | ❌ 乱码（未白名单） |
| **context-mode Shell 模式** | ✅ 明文（调用系统进程） |

---

## 三套索引系统分工

### 系统 1：SQLite 符号索引（`search.ps1`）

**定位：快速符号导航**

| 特性 | 说明 |
|------|------|
| **速度** | ⚡ 毫秒级（本地 SQLite 查询） |
| **用途** | 类/方法/接口/属性/调用链定位 |
| **加密项目** | ✅ 通过 Roslyn 编译期提取 |
| **优势** | 快、精准、资源消耗小 |
| **劣势** | 不存储源码、只存储符号信息 |

**适用场景：**
- 快速定位类/方法在哪个文件、哪一行
- 查找谁调用了某个方法（Callers）
- 查找某个方法调用了谁（Callees）
- 类型过滤（class/interface/method/property）

**命令模板：**
```bash
# 符号搜索
powershell -ExecutionPolicy Bypass -File "C:\Users\admin\.claude\tools\sqlite-index\search.ps1" -Query "Pattern" -ProjectPath "<项目根>"

# 类型过滤
powershell -ExecutionPolicy Bypass -File "C:\Users\admin\.claude\tools\sqlite-index\search.ps1" -Query "Pattern" -ProjectPath "<项目根>" -Type class

# 调用链
powershell -ExecutionPolicy Bypass -File "C:\Users\admin\.claude\tools\sqlite-index\search.ps1" -Callers "Class.Method" -ProjectPath "<项目根>"
powershell -ExecutionPolicy Bypass -File "C:\Users\admin\.claude\tools\sqlite-index\search.ps1" -Callees "Class.Method" -ProjectPath "<项目根>"

# 索引不存在时建
powershell -ExecutionPolicy Bypass -File "C:\Users\admin\.claude\tools\sqlite-index\build.ps1" -ProjectPath "<项目根>"
```

---

### 系统 2：CodeGraph（`mcp__codegraph__*`）

**定位：代码图谱 + 源码读取**

| 特性 | 说明 |
|------|------|
| **速度** | 🐌 需要初始化（首次约 30 秒） |
| **用途** | 代码结构图谱、源码读取、完整调用链 |
| **加密项目** | ✅ 通过 node.exe 白名单读明文 |
| **优势** | 能读源码、图谱完整、支持影响分析 |
| **劣势** | 资源消耗大、需要初始化 |

**适用场景：**
- 查看方法体源码（codegraph_node）
- 分析模块结构和依赖关系（codegraph_explore）
- 影响分析（codegraph_impact）
- 完整调用链追踪

**命令模板：**
```javascript
// 搜索符号
mcp__codegraph__codegraph_search({ query: "ClassName", kind: "class" })

// 查看源码
mcp__codegraph__codegraph_node({ symbol: "ClassName.MethodName", includeCode: true })

// 调用链
mcp__codegraph__codegraph_callers({ symbol: "ClassName.MethodName" })
mcp__codegraph__codegraph_callees({ symbol: "ClassName.MethodName" })

// 影响分析
mcp__codegraph__codegraph_impact({ symbol: "ClassName" })

// 项目结构
mcp__codegraph__codegraph_files({ path: "src/..." })
```

---

### 系统 3：context-mode（`ctx_*`）

**定位：文档索引 + 语义搜索 + 批量命令**

| 特性 | 说明 |
|------|------|
| **速度** | 🐌 需要索引（首次） |
| **用途** | 文档索引、语义搜索、批量命令执行 |
| **加密项目** | ⚠️ JavaScript 沙箱读乱码，Shell 模式读明文 |
| **优势** | 支持语义搜索、可索引任意内容、批量执行 |
| **劣势** | JavaScript 沙箱不能读加密文件 |

**适用场景：**
- 索引和搜索文档（README、设计文档、API 文档）
- 索引和搜索代码片段
- 获取网页内容并索引
- 批量执行命令并分析结果
- 语义搜索（比 SQLite 索引更智能）

**命令模板：**
```javascript
// 索引内容
mcp__context-mode__ctx_index({ content: "...", source: "label" })

// 语义搜索
mcp__context-mode__ctx_search({ queries: ["query1", "query2"], source: "label" })

// 获取网页并索引
mcp__context-mode__ctx_fetch_and_index({ url: "...", source: "label" })

// 批量执行命令（用 Shell 模式读加密文件）
mcp__context-mode__ctx_batch_execute({
  commands: [
    { label: "read", command: "node -e \"...\"" }
  ],
  queries: ["search term"]
})

// 执行命令（用 Shell 模式）
mcp__context-mode__ctx_execute({ language: "shell", code: "node -e \"...\"" })
```

---

## 决策树

```
找符号（类/方法/接口/调用关系/谁调用谁）?
  → SQLite 索引（快速定位行号）
  → 然后用 CodeGraph 查看源码

看具体方法体逻辑?
  → CodeGraph codegraph_node（能读明文）
  → 或用 node.exe 读取
  → 不要用 bash/head（会读到乱码）

理解模块结构/影响分析?
  → CodeGraph（图谱更完整）

找注释/字符串/配置/语义关键词?
  → READABLE: ctx_search(source: "<项目名>-src", query: "...")
  → ENCRYPTED: 用 Shell 模式的 ctx_execute

索引和搜索文档?
  → context-mode ctx_index + ctx_search

批量执行命令并分析结果?
  → context-mode ctx_batch_execute（用 Shell 模式）

非 .cs 文件（.vue/.js/.json/.md/.sql/.csproj/.xml）?
  → 永远不加密。优先 ctx_search 已建索引；否则 Glob+Grep+Read
```

---

## 最佳实践工作流

```
1. SQLite 索引：快速定位符号位置（行号）
   ↓
2. CodeGraph：查看方法体源码、完整调用链
   ↓
3. context-mode：索引和搜索相关文档
   ↓
4. node.exe/PowerShell：临时读取特定文件
```

---

## 反模式（禁止）

- ❌ 直接 Read 整个 .cs 文件来理解结构（用 search.ps1）
- ❌ 用 Glob+Grep 替代符号搜索（grep 不知道作用域，索引知道）
- ❌ 凭路径假设加密状态（用探针）
- ❌ 用 bash/head 读取加密项目的 .cs 文件（会读到乱码）
- ❌ 用 context-mode JavaScript 沙箱读加密项目的 .cs（会读到乱码）
- ❌ 用 ctx_search 查加密项目的 .cs（需要先索引，且不支持源码搜索）
- ❌ 在 workflows 中写死提示词（用专门的 agents）
