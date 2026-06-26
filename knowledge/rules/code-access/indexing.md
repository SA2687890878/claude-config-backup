# 三套索引系统分工

## 系统 1：SQLite 符号索引（`search.ps1`）

**定位：快速符号导航**

| 特性 | 说明 |
|------|------|
| **速度** | 毫秒级（本地 SQLite 查询） |
| **用途** | 类/方法/接口/属性/调用链定位 |
| **加密项目** | 通过 Roslyn 编译期提取 |
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

## 系统 2：CodeGraph（`mcp__codegraph__*`）

**定位：代码图谱 + 源码读取**

| 特性 | 说明 |
|------|------|
| **速度** | 需要初始化（首次约 30 秒） |
| **用途** | 代码结构图谱、源码读取、完整调用链 |
| **加密项目** | 通过 node.exe 白名单读明文 |
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

## 系统 3：context-mode（`ctx_*`）

**定位：文档索引 + 语义搜索 + 批量命令**

| 特性 | 说明 |
|------|------|
| **速度** | 需要索引（首次） |
| **用途** | 文档索引、语义搜索、批量命令执行 |
| **加密项目** | JavaScript 沙箱读乱码，Shell 模式读明文 |
| **优势** | 支持语义搜索、可索引任意内容、批量执行 |
| **劣势** | JavaScript 沙箱不能读加密文件 |

**适用场景：**
- 索引和搜索文档（README、设计文档、API 文档）
- 索引和搜索代码片段
- 获取网页内容并索引
- 批量执行命令并分析结果

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
```

## How to apply

- 快速定位符号：用 SQLite 索引
- 查看源码/调用链：用 CodeGraph
- 索引文档/语义搜索：用 context-mode
- 判断方法：先试 codegraph_files，返回空则源码加密，切换 SQLite 索引
