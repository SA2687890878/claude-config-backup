# Token 优化策略（完整版）

> 合并自 tools.md + thinking.md + token-optimization-strategies.md，单一真源。

## 核心原则

能在代码中处理的数据不要读入上下文。

## 工具选择决策树

| 场景 | 工具 | 原因 |
|------|------|------|
| 大文件/日志分析 | `ctx_execute_file` | 沙箱内处理，不灌上下文 |
| 多文件处理 | `ctx_execute` | 批量分析，只输出摘要 |
| 多命令批量+就地检索 | `ctx_batch_execute`(concurrency 2-8) | 并行 I/O + 内联查询 |
| 持久化文档索引 | `ctx_index` + `ctx_search` | 语义搜索，避免重复读 |
| 跨会话回忆 | `ctx_search`(sort:"timeline") | 检索历史决策/代码 |
| 代码定位(加密) | SQLite 索引 `search.ps1` | 毫秒级符号定位 |
| 代码定位(可读) | CodeGraph `codegraph_explore` | 图谱+源码 |
| 符号搜索 | `codegraph_search` | 精确匹配 |

## 代码访问五步漏斗

1. **意图消歧** — 只看索引/MEMORY/需求原话，产出 2-4 种解读
2. **模块定位** — 目录树/CodeGraph，锁定 2-3 候选文件
3. **关键词搜索** — 脚本执行(SQLite/rg/ctx_search)，产出文件+行号
4. **调用链追踪** — 读单文件相关片段(~10K)
5. **验证确认** — 读最终函数实现片段

前 2 步不读代码，第 3 步脚本定位，第 4 步才 Read。

## 输出压缩

- 构建/测试输出 → 只看 ERROR/FAIL
- 日志文件 → `ctx_execute_file` 过滤异常行
- RTK hook 自动压缩 Bash 输出（需绕过时用 `rtk proxy <cmd>`）

## 反模式（禁止）

- ❌ 直 Read 整个 .cs 文件
- ❌ 重复搜索（用 ctx_search 而非重复 grep）
- ❌ 简单任务用 agent（运行命令/写文件直接用工具）
- ❌ 长对话不压缩（及时保留关键信息，丢弃已解决内容）

## 模型选择参考

| 场景 | 推荐 | 原因 |
|------|------|------|
| 需求分析/架构设计/代码审查 | 重推理模型 | 需要深度推理 |
| 代码实现/测试生成/调试 | 平衡模型 | 速度+质量 |
| 简单任务/批量处理 | 轻量模型 | 节省 token |
