# Harness Engineering 文档中心

## 文档总览

本文档中心包含 Claude Code 全自动工作流的完整配置和说明。

---

## 文档结构

```
docs/
├── README.md                         # 本文档（导航中心）
├── SETUP.md                          # 复用指南（换电脑/分享给同事）
├── workflow.md                       # 完整工作流说明
├── agent-roles.md                    # Agent 角色定义
├── cross-project.md                  # 跨项目工作流
├── review-audit.md                   # 审查审计机制
├── iteration.md                      # 自动迭代机制
├── CLAUDE-template.md                # 全局 CLAUDE.md 模板
└── templates/
    └── interface-contract.md         # 接口契约模板
```

---

## 快速开始

### 1. 换电脑/分享给同事

阅读 [SETUP.md](SETUP.md) 了解如何复用本配置

### 2. 更新全局 CLAUDE.md

将 [CLAUDE-template.md](CLAUDE-template.md) 的内容复制到 `C:\Users\admin\.claude\CLAUDE.md`

### 3. 了解工作流

阅读 [workflow.md](workflow.md) 了解完整工作流

### 4. 了解 Agent 角色

阅读 [agent-roles.md](agent-roles.md) 了解各 Agent 职责

---

## 快速开始

### 1. 更新全局 CLAUDE.md

将 [CLAUDE-template.md](CLAUDE-template.md) 的内容复制到 `C:\Users\admin\.claude\CLAUDE.md`

### 2. 了解工作流

阅读 [workflow.md](workflow.md) 了解完整工作流

### 3. 了解 Agent 角色

阅读 [agent-roles.md](agent-roles.md) 了解各 Agent 职责

### 4. 跨项目开发

阅读 [cross-project.md](cross-project.md) 了解跨项目工作流

---

## 核心概念

### 工作流

| 工作流 | 触发词 | Agent 数量 |
|--------|--------|-----------|
| 功能开发 | 开发/添加/实现 | 6 |
| Bug 修复 | 修复/bug/报错 | 3 |
| 性能优化 | 优化/慢/性能 | 2-3 |
| 代码审查 | 审查/review | 1-2 |
| 跨项目 | 跨项目/联动开发 | N+2 |

### Agent 角色

| Agent | 职责 | Skill |
|-------|------|-------|
| 需求分析师 | 逼问清晰需求 | /requirements |
| 架构师 | 审查技术方案 | /arch-review |
| 实现者 | 写代码 | /subagent-driven-development |
| 审查员 | 两阶段审查 | /dotnet-review |
| 调试专家 | 定位问题 | /systematic-debugging |
| 性能工程师 | 先量后优 | /perf-tune |

### 审查层次

| 层次 | 时机 | 内容 |
|------|------|------|
| Level 1 | 每次代码变更 | Agent 自检 + 规格审查 + 质量审查 |
| Level 2 | 每个工作流完成 | 流程执行检查 |
| Level 3 | 每周/每月 | 周期审计 + 改进 |

### 迭代循环

```
Plan → Do → Check → Act → 循环
```

---

## 使用场景

### 场景 1：开发新功能

```
你: 开发一个设备点检功能
我: [自动进入功能开发流程]
    → 需求分析师：5 问逼出清晰需求
    → 架构师：审查技术方案
    → 实现者：Entity → DTO → Service → Controller
    → 审查员：两阶段审查
    → 最终审查员：整体验证
```

### 场景 2：修复 Bug

```
你: 这个接口报错了
我: [自动进入 Bug 修复流程]
    → 调试专家：定位根因
    → 实现者：最小改动修复
    → 审查员：检查修复质量
```

### 场景 3：跨项目开发

```
你: 前后端一起改，添加设备管理功能
我: [自动进入跨项目流程]
    → 项目发现：扫描目录识别项目
    → 需求分析：拆分任务，定义接口契约
    → 并行实现：各项目独立 Agent 同时工作
    → 集成验证：检查接口对接
```

---

## 最佳实践

### 1. 全局 CLAUDE.md 保持精简

- 全局 CLAUDE.md < 80 行
- 详细文档放在 docs/ 目录
- 通过链接引用详细文档

### 2. 接口契约优先

- 跨项目开发必须先定义接口契约
- 接口契约是各项目 Agent 的输入
- 接口契约就是最好的 API 文档

### 3. 审查审计分层次

- Level 1：自动审查（每次代码变更）
- Level 2：流程审查（每个工作流完成）
- Level 3：周期审计（每周/每月）

### 4. 持续迭代

- Plan → Do → Check → Act 循环
- 小步快跑，快速验证
- 数据驱动，持续改进

---

## 常见问题

### Q: 切换项目目录后，工作流还生效吗？

A: 如果更新了全局 CLAUDE.md，工作流在任何目录都生效。项目级 CLAUDE.md 只在该项目目录生效。

### Q: 如何自定义 Agent 角色？

A: 编辑 `docs/agent-roles.md`，然后更新全局 CLAUDE.md 中的 Agent 角色列表。

### Q: 如何添加新的工作流？

A: 编辑 `docs/workflow.md`，添加新的工作流说明，然后更新全局 CLAUDE.md 中的触发词表。

### Q: 接口契约模板在哪里？

A: `docs/templates/interface-contract.md`，跨项目开发时使用。

---

## 更新记录

| 日期 | 版本 | 内容 |
|------|------|------|
| 2026-06-07 | 1.1 | 添加 Hook 防护层（Impact/Quality/Build Guard）、SETUP.md |
| 2026-06-04 | 1.0 | 初始版本，建立完整工作流体系 |
