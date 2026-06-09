# Token 优化规则

## RTK 自动压缩（已启用）

`rtk hook claude` 已配置，每次 Bash 调用前自动压缩输出。需绕过时用 `rtk proxy <cmd>`。

## 代码分析工具选择

项目源码经过加密，Read 工具和 CodeGraph **均无法直接读取**。必须通过 SQLite 本地索引查询。

### SQLite 索引（加密源码项目）

| 场景 | 命令 |
|------|------|
| 查找类/接口/方法/属性 | `search.ps1 -Query "pattern" -ProjectPath "项目根路径"` |
| 按类型查找 | `search.ps1 -Query "pattern" -Type class -ProjectPath "项目根路径"` |
| 谁调用了某方法 | `search.ps1 -Callers "Class.Method" -ProjectPath "项目根路径"` |
| 某方法调用了谁 | `search.ps1 -Callees "Class.Method" -ProjectPath "项目根路径"` |
| 索引统计 | `search.ps1 -Stats -ProjectPath "项目根路径"` |

> **注意**：`-ProjectPath` 必须是项目的 `.csproj` 所在目录，不是源码根目录。
> 例如 `F:\OTD Code WorkSpace\otd.pcs.webbackend\src\otd.pcs.webbackend`

脚本路径：`C:\Users\admin\.claude\tools\sqlite-index\`

### CodeGraph（如果可用）

对可读项目优先使用 CodeGraph：
- 理解结构/调用流程 → `codegraph_explore`
- 精确定位符号 → `codegraph_search`
- 读单个符号源码 → `codegraph_node(includeCode: true)`
- 调用链 → `codegraph_callers` / `codegraph_callees`
- 改动影响 → `codegraph_impact`

**判断方法**：先试 `codegraph_files`，返回空或报错则源码加密，切换 SQLite 索引。

**禁止**：Read 整个 .cs 文件来理解结构。

## Think-in-Code

能在代码中处理的数据不要读入上下文。大文件用 `ctx_execute_file`，多文件用 `ctx_execute`，持久化文档用 `ctx_index` + `ctx_search`。

## 输出压缩

- 构建/测试输出 → 只看 ERROR/FAIL
- 日志文件 → 用 `ctx_execute_file` 过滤异常行

## Workflow Budget

每个 workflow 设置 budget 上限。当剩余 token 不足时跳过低优先级阶段，返回 PARTIAL 结果。
