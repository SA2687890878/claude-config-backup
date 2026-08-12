# Think-in-Code

## 原则

能在代码中处理的数据不要读入上下文。

## 工具选择

| 场景 | 工具 |
|------|------|
| 大文件/日志分析 | `ctx_execute_file` |
| 多文件处理 | `ctx_execute` |
| 多命令批量 + 就地检索 | `ctx_batch_execute`(传 `queries`,`concurrency` 2-8) |
| 持久化文档 | `ctx_index` + `ctx_search` |
| 跨会话回忆(代码/文档/先前决策) | `ctx_search`(需历史时可加 `sort: "timeline"`) |

## 输出压缩

- 构建/测试输出 → 只看 ERROR/FAIL
- 日志文件 → 用 `ctx_execute_file` 过滤异常行

## 会话事件自动记忆(ctx_stats)

- hooks 会自动捕获会话事件(决策/错误/计划),但**目前价值不大,不依赖它**
- 跨会话知识以 memory 文件 / learnings.md 为准(有结构、主动维护)
- `ctx_stats` 仅用于查看使用率,不当作主记忆系统

## Token Budget

复杂任务设置 token 预算上限。当剩余 token 不足时跳过低优先级步骤，返回部分结果。
