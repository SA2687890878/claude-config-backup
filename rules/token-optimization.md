# Token 优化规则

## RTK 自动压缩（已启用）

`rtk hook claude` 已作为 PreToolUse hook 配置，每次 Bash 调用前**自动**重写命令并压缩输出。无需手动加 `rtk` 前缀。

需要绕过 hook 时，显式使用 `rtk proxy <cmd>` 执行原始命令。

## CodeGraph 优先级（按场景选择）

```
理解结构 → codegraph_explore（一次调用，多文件摘要）
精确查找 → Grep / Glob（按文件名/内容搜索）
读取代码 → codegraph_node(includeCode: true)（单符号完整源码）
调用链路 → codegraph_callers / codegraph_callees
```

**禁止**：Read 整个 .cs 文件来理解结构（浪费 token）。

## context-mode 用法

| 场景 | 工具 | 说明 |
|------|------|------|
| 分析大文件 | `ctx_execute_file` | 在沙箱中处理，只输出摘要 |
| 多文件分析 | `ctx_execute` | 用代码遍历，只输出结论 |
| 持久化文档 | `ctx_index` | 索引后用 `ctx_search` 按需检索 |
| 抓取网页 | `ctx_fetch_and_index` | 自动索引，支持搜索 |

**Think-in-Code**：能在代码中处理的数据不要读入上下文。

## 输出压缩

- 构建/测试输出 → 只看 ERROR/FAIL，跳过 WARN/INFO
- 日志文件 → 用 `ctx_execute_file` 过滤，只输出异常行

## Workflow Budget 控制

大型 workflow 必须设置 budget 上限，防止 token 失控：

| Workflow | 建议 Budget | 说明 |
|----------|------------|------|
| `feature-development` | 200k | 4 份文档 + 3 次审查 |
| `code-review` | 100k | 5 维度并行审查 |
| `perf-optimize` | 120k | 分析 + 实施 + 复测 |
| `bug-fix` | 80k | 定位 + 修复 + 验证 |

在 workflow 中通过 `args` 传入 budget：
```javascript
// workflow 调用时
const result = await Workflow({
  script: workflowScript,
  args: { ..., budget: { total: 100000 } }
})
```

在 workflow 内部使用 `budget.remaining()` 动态控制：
```javascript
// 当剩余 token 不足时跳过低优先级阶段
if (budget.total && budget.remaining() < 30000) {
  log('⚠️ token 不足，跳过修复建议阶段')
  return { status: 'PARTIAL', findings: allFindings }
}
```

## 文件操作

- 已知文件 → `Read`（精确读取）
- 搜索文件 → `Glob` / `Grep`（快速定位）
- 理解结构 → `codegraph_explore`（一次调用覆盖多文件）
