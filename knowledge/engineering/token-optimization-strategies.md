---
name: token-optimization-strategies
description: Token优化策略——基于V2EX讨论的最佳实践
metadata:
  type: reference
---

## Token 优化策略

### 基于 V2EX 讨论的最佳实践

#### 1. 模型选择策略

| 场景 | 推荐模型 | 原因 |
|------|---------|------|
| 需求分析 | Opus | 需要深度推理 |
| 代码实现 | Sonnet | 平衡速度和质量 |
| 代码审查 | Opus | 需要全面分析 |
| 测试生成 | Sonnet | 标准任务 |
| 调试 | Sonnet | 需要快速定位 |
| 简单任务 | Haiku | 节省 token |

#### 2. Token 节省技巧

1. **使用 RTK**：自动压缩输出，节省 60-90% token
2. **Think-in-Code**：在代码中处理数据，不要读入上下文
3. **context-mode**：使用语义搜索，避免重复读取文件
4. **批量处理**：使用 ctx_batch_execute 并行执行命令
5. **索引优先**：先索引、后 Read，避免浪费 token

#### 3. 避免的反模式

1. **直接 Read 整文件**：最浪费 token 的路径
2. **重复搜索**：使用 ctx_search 而不是重复 grep
3. **不必要的 Agent**：简单任务直接用工具
4. **长对话**：及时压缩对话，保留关键信息
5. **重复代码**：使用复用，避免重复编写

#### 4. 监控和优化

1. **使用 metrics-collector.js**：跟踪关键工具调用
2. **使用 metrics-report.js**：查看会话统计
3. **使用 session-start.js**：查看度量优化建议
4. **定期审查**：每周审查 token 消耗

### 与 Harness Engineering 集成

#### 1. 技能优化

- `/requirements`：使用 Opus，但限制输出长度
- `/dev-workflow`：使用 Sonnet，批量处理任务
- `/review`：使用 Opus，但只审查关键文件
- `/test`：使用 Sonnet，批量生成测试

#### 2. 工作流优化

- **并行处理**：使用 parallel() 同时处理多个任务
- **流水线处理**：使用 pipeline() 处理多阶段任务
- **条件跳过**：根据条件跳过不必要的步骤
- **缓存结果**：使用 ctx_search 缓存搜索结果

#### 3. 代码优化

- **使用 CodeGraph**：快速定位代码，避免全文搜索
- **使用 SQLite 索引**：毫秒级符号定位
- **使用 context-mode**：语义搜索文档
- **使用 openCli**：快速获取外部信息

## Why:
Token 是 Claude Code 的核心资源，优化 Token 消耗可以提升效率、降低成本。

## How to apply:
根据场景选择合适的模型和工具，避免不必要的 token 消耗。
