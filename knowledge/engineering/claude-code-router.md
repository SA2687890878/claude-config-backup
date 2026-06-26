---
name: claude-code-router
description: Claude Code Router集成——多模型路由管理，优化Token消耗
metadata:
  type: reference
---

## Claude Code Router 集成

### 什么是 Claude Code Router

Claude Code Router 是一个本地 UI 界面，用于管理多个 AI 模型供应商。它解决了以下问题：

1. **切模型需要 resume session**：中途切模型需要重新加载 settings.json
2. **供应商 429 限流**：经常卡住，无法并发
3. **多供应商 coding plan 切换**：token 用完时可以切到其他供应商
4. **根据任务选择不同模型**：plan 用 opus，implement 用 qwen

### 已知的 Claude Code Router

1. **官方 Claude Code Router**：Anthropic 官方提供
2. **第三方实现**：https://github.com/leaf-llm/llmadmin-ui

### 与 Harness Engineering 集成

#### 1. 模型选择策略

```markdown
| 阶段 | 模型偏好 | 适用场景 |
|------|---------|---------|
| 需求分析 | 最强（opus） | /requirements |
| 代码实现 | 标准（sonnet） | /dev-workflow, subagent-driven |
| 代码审查 | 最强（opus） | /arch-review, /review |
| 测试生成 | 标准（sonnet） | /test |
| 调试 | 标准（sonnet） | /systematic-debugging, /perf-tune |
```

#### 2. 集成到 skills

在 skills 中使用不同的模型：
- `/requirements`：使用 opus 模型
- `/dev-workflow`：使用 sonnet 模型
- `/review`：使用 opus 模型
- `/test`：使用 sonnet 模型

#### 3. 集成到 agents

在 agents 中指定模型：
- builder-agent：使用 sonnet 模型
- operator-agent：使用 sonnet 模型

### 最佳实践

1. **根据任务选择模型**：不要一味使用最强模型
2. **监控 Token 消耗**：使用 metrics-collector.js 跟踪
3. **及时切换供应商**：token 用完时切换到其他供应商
4. **避免并发限流**：不要同时使用多个供应商的同一个模型

## Why:
Claude Code Router 帮助管理多个模型供应商，优化 Token 消耗，避免限流问题。

## How to apply:
根据任务类型选择合适的模型，使用 Claude Code Router 管理多个供应商。
