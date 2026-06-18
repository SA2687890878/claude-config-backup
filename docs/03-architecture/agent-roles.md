# Agent 角色定义

> 基于《Harness Engineering 建设指南》构建的角色体系

---

## 概述

根据指南要求，最终只保留 2 个角色：

| 角色 | 职责 | 文件 | 颜色 |
|------|------|------|------|
| **Builder** | 设计、开发、测试 | builder-agent.md | green |
| **Operator** | 排查、优化、运维分析 | operator-agent.md | red |

---

## Builder（设计、开发、测试）

### 职责
- 需求分析
- 架构设计
- 编码实现
- 代码审查
- 测试验证
- 文档生成

### 何时调用
- **新功能实现** — 用户要求实现新功能或模块
- **代码审查请求** — 用户要求审查代码变更
- **测试生成或验证** — 用户需要编写测试或验证测试是否通过
- **文档生成** — 用户需要技术文档

### 角色切换

| 任务类型 | 角色 | 职责 |
|---------|------|------|
| 需求分析 | 需求分析师 | 5W1H 分析、用户故事、验收标准 |
| 架构设计 | 架构师 | 模块划分、依赖分析、技术选型 |
| 编码实现 | 开发者 | 按规格写代码、TDD、最小改动 |
| 代码审查 | 审查员 | 多维度审查、问题分级、改进建议 |
| 测试验证 | 测试工程师 | 运行测试、分析失败、修复验证 |
| 文档生成 | 文档工程师 | 需求文档、设计文档、排查文档 |

### 工作流程
1. 理解任务需求
2. 使用索引系统收集上下文
3. 执行对应角色
4. 用实际命令验证结果
5. 基于证据给出结论

### 配置

```yaml
name: builder
description: 当用户需要设计、开发、测试、代码审查或文档生成时使用此 agent
model: inherit
color: green
tools: Read, Grep, Glob, Bash, Edit, Write, mcp__context-mode__ctx_search
```

---

## Operator（排查、优化、运维分析）

### 职责
- Bug 排查
- 性能优化
- 代码探索
- 日志分析

### 何时调用
- **Bug 排查** — 用户报告 bug、测试失败或异常行为
- **性能优化** — 用户报告响应慢、资源高或吞吐低
- **代码探索** — 用户需要理解代码结构、调用链或模块关系
- **日志分析** — 用户需要分析错误日志或排查线上问题

### 角色切换

| 任务类型 | 角色 | 职责 |
|---------|------|------|
| Bug 排查 | 调试专家 | 收集信息、定位代码、分析根因 |
| 性能优化 | 性能工程师 | 测量基线、定位瓶颈、制定方案 |
| 代码探索 | 代码侦探 | 快速定位代码、梳理调用链、理解结构 |
| 日志分析 | 运维工程师 | 分析日志、识别异常、定位问题 |

### 工作流程
1. 收集问题信息
2. 使用索引系统定位代码
3. 分析调用链和数据流
4. 确定根本原因
5. 提供修复建议

### 配置

```yaml
name: operator
description: 当用户需要排查问题、分析性能、探索代码或分析日志时使用此 agent
model: inherit
color: red
tools: Read, Grep, Glob, Bash, Edit, Write, mcp__context-mode__ctx_search
```

---

## 与旧角色的对比

| 旧角色 | 新角色 | 变化 |
|--------|--------|------|
| architect | Builder | 合并 |
| builder | Builder | 合并 |
| code-reviewer | Builder | 合并 |
| doc-writer | Builder | 合并 |
| requirement-analyst | Builder | 合并 |
| test | Builder | 合并 |
| verifier | Builder | 合并 |
| debugger | Operator | 合并 |
| investigator | Operator | 合并 |

---

## 角色调用方式

### 在 Skills 中调用

```javascript
// build.js 中调用 Builder
const result = await agent(
  '实现这个功能...',
  { label: '编码实现', phase: '编码实现', agentType: 'Builder' }
)

// operate.js 中调用 Operator
const diagnosis = await agent(
  '分析这个问题...',
  { label: '问题诊断', phase: '问题定位', agentType: 'Operator' }
)
```

### 直接调用

```
用户：帮我分析一下这个 bug
Claude：[调用 Operator agent]
```

---

## 更新记录

| 日期 | 版本 | 内容 |
|------|------|------|
| 2026-06-11 | 3.0 | 重构为 2 个角色，符合《建设指南》要求 |
| 2026-06-10 | 2.0 | 添加 8 个角色 |
| 2026-06-04 | 1.0 | 初始版本 |
