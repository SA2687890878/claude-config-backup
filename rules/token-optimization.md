# Token 优化规则

## RTK 自动压缩（已启用）

`rtk hook claude` 已配置，每次 Bash 调用前自动压缩输出。需绕过时用 `rtk proxy <cmd>`。

## CodeGraph 优先级

- 理解结构 → `codegraph_explore`
- 精确查找 → `Grep` / `Glob`
- 读单符号 → `codegraph_node(includeCode: true)`
- 调用链 → `codegraph_callers` / `codegraph_callees`

**禁止**：Read 整个 .cs 文件来理解结构。

## Think-in-Code

能在代码中处理的数据不要读入上下文。大文件用 `ctx_execute_file`，多文件用 `ctx_execute`，持久化文档用 `ctx_index` + `ctx_search`。

## 输出压缩

- 构建/测试输出 → 只看 ERROR/FAIL
- 日志文件 → 用 `ctx_execute_file` 过滤异常行

## Workflow Budget

每个 workflow 设置 budget 上限。当剩余 token 不足时跳过低优先级阶段，返回 PARTIAL 结果。
