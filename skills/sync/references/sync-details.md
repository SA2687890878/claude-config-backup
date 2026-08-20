# 知识同步实现细节

> 核心流程与输出格式见 SKILL.md A 分支。本文件只提供实现细节（路径/分类/边界）。

## Learnings 文件路径（按优先级）

1. `~/.claude/memory/learnings.md` — 跨项目经验（权威源）
2. `~/.claude/learnings.md` — 项目经验（如 pcs.webbackend）
3. `~/.claude/projects/${projectName}/memory/learnings.md` — 历史会话布局，存在才读

## 分类策略

对每条经验用关键词自归类：

| 类别 | 关键词 | 写入路径 |
|------|--------|----------|
| **工程** | 性能/内存/流式/索引/缓存/异步/测试/重构/设计模式 | `knowledge/engineering/` |
| **项目** | API/接口/数据库/schema/实体/DTO/导出/报表 | `knowledge/project/<项目名>/` |
| **业务** | 订单/用户/支付/审批/流程/状态机/租户 | `knowledge/business/` |

未命中任何关键词 → 默认归入项目知识。

## 错误处理

- **learnings.md 不存在** → 提示用户先初始化 Memory 目录
- **knowledge/ 目录不存在** → 自动创建目录结构
- **经验格式不规范** → 跳过该条目并提示检查格式