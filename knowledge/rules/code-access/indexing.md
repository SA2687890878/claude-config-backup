# 三套索引系统分工

| 系统 | 定位 | 优点 | 适用 |
|------|------|------|------|
| SQLite 符号索引（search.ps1） | 快速符号导航 | 毫秒级、精准、轻量 | 定位类/方法/调用链、类型过滤 |
| CodeGraph | 代码图谱 + 源码读取 | 能读源码、支持影响分析 | 看方法体、完整调用链 |
| context-mode（ctx_*） | 文档索引 + 语义搜索 | 语义搜索、可索引任意内容、批量执行 | 搜文档/代码片段/网页 |

## 判断方法
- 定位符号/调用链 → SQLite（快、轻）
- 看源码/影响分析 → CodeGraph
- 搜文档/语义 → context-mode
- 加密项目：先试 codegraph_files，返回空则源码加密，切 SQLite

## 核心命令
- **SQLite**：`search.ps1 -Query "Pattern" -ProjectPath "<根>"`；`-Type class` 过滤；`-Callers/-Callees "类.方法"` 调用链；`build.ps1` 建索引
- **CodeGraph**：`codegraph_explore` / `codegraph_node(symbol, includeCode:true)` / `codegraph_callers` / `codegraph_impact`
- **context-mode**：`ctx_index` / `ctx_search` / `ctx_fetch_and_index` / `ctx_batch_execute`
