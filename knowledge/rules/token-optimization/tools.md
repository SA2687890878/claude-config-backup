# 代码分析工具选择

## SQLite 索引（加密源码项目）

| 场景 | 命令 |
|------|------|
| 查找类/接口/方法/属性 | `search.ps1 -Query "pattern" -ProjectPath "项目根路径"` |
| 按类型查找 | `search.ps1 -Query "pattern" -Type class -ProjectPath "项目根路径"` |
| 谁调用了某方法 | `search.ps1 -Callers "Class.Method" -ProjectPath "项目根路径"` |
| 某方法调用了谁 | `search.ps1 -Callees "Class.Method" -ProjectPath "项目根路径"` |
| 索引统计 | `search.ps1 -Stats -ProjectPath "项目根路径"` |

> **注意**：`-ProjectPath` 的**末级目录名**决定用哪个索引库（库名 = 末级目录名）。
> 传索引建立时用的同一路径，例如 `F:\OTD Code WorkSpace\otd.pcs.webbackend`。

脚本路径：`C:\Users\admin\.claude\tools\sqlite-index\`

## CodeGraph（如果可用）

对可读项目优先使用 CodeGraph：
- 理解结构/调用流程 → `codegraph_explore`
- 精确定位符号 → `codegraph_search`
- 读单个符号源码 → `codegraph_node(includeCode: true)`
- 调用链 → `codegraph_callers` / `codegraph_callees`
- 改动影响 → `codegraph_impact`

**判断方法**：先试 `codegraph_files`，返回空或报错则源码加密，切换 SQLite 索引。

**禁止**：Read 整个 .cs 文件来理解结构。
