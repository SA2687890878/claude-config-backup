# Harness 架构优化方案（已归档）

> **已归档：以 `HARNESS-OPTIMIZATION-DETAILED.md` 为准**，本文仅保留历史参考。

## 目标
把现有 Claude harness 收敛成一套少入口、单协议、强验证、按需加载的工作机器，兼顾高质量交付、token 节省、自动化闭环和日常工作覆盖。

## 现状判断
### 已成立
- 入口层已经有分工：需求、设计、开发、测试、审查、排障、验证、沉淀、同步。
- 核心规则已经薄化，`rules/` 与 `knowledge/rules/` 分层方向正确。
- 代码访问、验证、任务流转这些关键约束已经机制化。

### 主要问题
- 开发主入口重复：`dev-pipeline`、`pipeline-executor`、`dev-workflow` 三套并存。
- 任务协议双轨：`tasks/active.json` 已是主线，但 `task-state.md` 仍在多处被当主路径。
- 索引层开始混入说明、统计、迁移历史，削弱渐进披露。
- 旧宿主口径、旧 hooks 叙述仍影响心智模型。

## 目标架构
### 1. 唯一入口层
保留一级入口：
- `requirements`
- `design`
- `pipeline-executor`
- `review`
- `test`
- `systematic-debugging`
- `verification-before-completion`
- `save-memory`
- `knowledge-index`
- `harness-rules`
- `harness-audit`

降级为内部能力：
- `dev-workflow`
- `dev-pipeline`
- `parallel-review`
- `sql-best-practices`
- `perf-tune`
- `sync`
- `docs`
- `research`
- `opencli-*`
- `brooks-*`

### 2. 协议层
- 主任务协议：`tasks/active.json`
- 历史索引：`tasks/.index.json`
- `task-state.md` 仅作遗留兼容，不再是主恢复入口

### 3. 索引层
索引文件只做三件事：
- 告诉 agent 有哪些资源
- 告诉 agent 什么时候读
- 告诉 agent 去哪读

索引层不承载：
- 统计
- 迁移历史
- 长篇说明
- 教程性内容

### 4. 知识层
长内容、解释内容、迁移内容统一下沉到 `docs/`、`knowledge/`、`references/`。

## 迁移原则
1. 先统一协议，再收入口。
2. 先收一级暴露，再整理二级能力。
3. 先清索引纯度，再补文档细节。
4. 先保留兼容，再逐步退役旧口径。

## 推荐演进顺序
### 阶段 1：协议收口
- 统一 `active.json` 为唯一主状态源。
- 全面把 `task-state.md` 改成兼容层叙述。
- 同步更新 `save-memory`、`task-management`、`knowledge-sync`。

### 阶段 2：入口收敛
- 把 `pipeline-executor` 定为唯一开发总入口。
- 把 `dev-pipeline` 合并或内化。
- 把 `dev-workflow` 收缩为执行层。

### 阶段 3：索引瘦身
- `skills/INDEX.md` 只留触发词 + 一句话。
- `knowledge/MEMORY.md` 只留分类导航。
- `knowledge/rules/INDEX.md` 只留路径映射。

### 阶段 4：兼容清理
- 清理旧 hooks 叙述中的主职责表述。
- 清理 docs 中对旧任务协议的主路径叙述。
- 统一“自动加载 / 按需加载”的口径。

## 验收标准
- 用户说“开发 XX”时稳定只进一个一级入口。
- 任务恢复只认新协议，不再抢解释权。
- 索引文件不再承载教程性内容。
- 日常流程无需手工解释即可继续推进。
- token 波动明显下降。

## 结论
这套体系不是缺能力，而是需要收口。当前最值钱的优化不是扩张，而是让入口更少、协议更单、索引更纯。