# Think-in-Code

## 原则

能在代码中处理的数据不要读入上下文。

## 工具选择

| 场景 | 工具 |
|------|------|
| 大文件处理 | `ctx_execute_file` |
| 多文件处理 | `ctx_execute` |
| 持久化文档 | `ctx_index` + `ctx_search` |

## 输出压缩

- 构建/测试输出 → 只看 ERROR/FAIL
- 日志文件 → 用 `ctx_execute_file` 过滤异常行

## Token Budget

复杂任务设置 token 预算上限。当剩余 token 不足时跳过低优先级步骤，返回部分结果。

## How to apply

- 处理大量数据时，优先在代码中处理
- 使用 ctx_execute_file 处理大文件
- 使用 ctx_execute 处理多文件
- 使用 ctx_index + ctx_search 持久化文档
