# Token 优化规则

## 核心

能在代码中处理的数据不要读入上下文。

## 工具选择

- **加密项目**：SQLite 索引 + CodeGraph
- **可读项目**：优先 CodeGraph
- **大文件/日志**：ctx_execute_file / ctx_execute
- **批量命令**：ctx_batch_execute

## 详细参考

- 完整策略：`knowledge/rules/token-optimization/overview.md`
- RTK 使用：`~/.claude/RTK.md`
