# Token 优化规则

## RTK 自动压缩

`rtk hook claude` 已配置，每次 Bash 调用前自动压缩输出。需绕过时用 `rtk proxy <cmd>`。

## 代码分析工具选择

- **加密项目**：SQLite 索引 + CodeGraph
- **可读项目**：优先 CodeGraph
- **判断方法**：先试 codegraph_files，返回空则切换 SQLite 索引

## Think-in-Code

能在代码中处理的数据不要读入上下文。大文件/日志用 `ctx_execute_file`，多文件用 `ctx_execute`，多命令批量+检索用 `ctx_batch_execute`，持久化文档用 `ctx_index` + `ctx_search`。会话事件自动记忆（ctx_stats）价值不大，跨会话知识以 memory/learnings.md 为准。

## 详细参考

- RTK 使用：`~/.claude/RTK.md`
- 工具选择：`~/.claude/knowledge/rules/token-optimization/tools.md`
- Think-in-Code：`~/.claude/knowledge/rules/token-optimization/thinking.md`
