---
name: workflow-agent-usage-principles
description: 工作流中何时用agent、何时直接用工具——避免浪费token的原则
metadata:
  type: feedback
---

## 核心原则

Agent 有推理能力，适合**需要判断、分析、决策**的任务。简单确定性操作直接用工具。

## ✅ 应该用 Agent

| 场景 | 原因 |
|------|------|
| 代码审查（架构/质量/安全/性能/最佳实践） | 需要独立上下文看diff+推理，5个并行是正确设计 |
| 根因分析 | 大量代码分析，需要多工具协作推理 |
| 需求分析/架构设计 | 需要复杂推理和结构化输出 |
| 失败测试修复 | 需要理解错误、定位代码、编写修复 |
| 解析非结构化文本为JSON | 需要推理能力 |

## ❌ 不应该用 Agent

| 场景 | 问题 | 替代方案 |
|------|------|----------|
| 保存文档（Write文件） | agent只调Write工具，无需推理 | 直接 `Write()` |
| 生成排查文档（拼Markdown） | 模板拼接，无需推理 | 直接 `Write()` |
| 运行命令读退出码（build/test） | 确定性判断 | 直接 `Bash()` |
| 运行命令返回完整输出 | prompt说"不要分析" | 直接 `Bash()` |
| 变更收集（git status/diff） | 简单命令 | 直接 `Bash()` |

## ⚠️ 可合并的 Agent

| 场景 | 当前 | 优化 |
|------|------|------|
| 编译验证 + 回归测试 | 2个agent各运行一条命令 | 合并为1个，一次运行build+test |
| 编译测试验证 + 完成验证 | 2个agent都运行dotnet test | 合并为1个，同时检查编译+测试+转绿+回归 |
| test-executor + final-verify | 2个agent执行完全相同的命令 | 用Bash替代或合并 |

## 判断标准

```
任务是否需要"判断/分析/决策"？
  ├─ 是 → 用 Agent（隔离上下文+推理）
  └─ 否 → 直接用工具（Bash/Write/Read）
```

## Why:
Agent 调用消耗 5-15k token（prompt+上下文+响应）。6个不必要的agent = ~60k token浪费。

## How to apply:
编写workflow时，对每个agent()调用问自己："这个任务需要推理能力吗？"如果只是"运行命令+读结果"或"写文件"，直接用Bash/Write。
