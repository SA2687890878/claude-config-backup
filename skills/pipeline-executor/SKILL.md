---
name: pipeline-executor
description: >
  ★唯一总入口★ 全链路编排调度:自动串联需求→设计→开发→测试→提交,中间可打断审查,说一次"开发 XX"跑到底。
  触发:开发XX、一键开发、全流程、帮我开发、按计划执行、编排、pipeline、联动、自动跑完。
version: 1.0.0
---

# 全链路编排调度（★唯一总入口）

> **唯一对外总入口：用户说"开发XX"必进本 skill。** `dev-pipeline` 定义五阶段内部逻辑（怎么走），`dev-workflow` 为 development 阶段执行器；本 skill 负责阶段间调度（谁先走、谁接谁、什么时候等你确认）。

## 调度契约

每次阶段切换时自动做 3 件事：

1. **存档当前产物** — 写入 `{product_path}/` 对应文件
2. **更新任务栈** — 推进 active.json 的 stage
3. **选择下一阶段模式**（见下文）

## 三种编排模式

| 模式 | 行为 | 适用场景 |
|------|------|---------|
| **auto** | 自动推进，各阶段 subagent 并行或串行，最后一次性汇报 | 紧急、确定的需求、赶进度 |
| **review**（默认） | 每阶段完成→暂停→等你确认→再推进下一阶段 | 正常开发，中间要审查需求/设计 |
| **manual** | 每阶段只产出不进，停在你手里 | 需求不明确、需要反复讨论 |

### auto 模式

```
subagent: /requirements（输出需求文档）
  → 主 agent 读需求文档，走 Gate 确认
  → 如果门禁通过: subagent: /design（输出设计文档）
  → 主 agent 读设计，走 Gate 确认
  → ...
  → 最后一次性汇报五阶段完成+产物路径
```

### review 模式（默认）

```
1. subagent: /requirements → 输出 {product_path}/requirements.md
2. 主 agent 读产物 + 汇报给用户 + 等待确认
3. 用户确认后: subagent: /design → 输出 {product_path}/design.md
4. 主 agent 读产物 + 汇报 + 等待确认
5. ...
```

### manual 模式

每阶段只产出文件，全部由你手动决定下一步。

## 决策规则

| 你的输入 | 自动判断的模式 |
|---------|--------------|
| "帮我开发个XX"、"全流程"、"一键" | auto（快） |
| "开发个XX，中途我要看"、"帮我做XX" | review（默认） |
| "我有个想法，帮我走一遍"、"梳理一下XX" | manual（停在你手里） |
| 不确定 | review（默认） |

## 门禁约束（auto 模式亦不可跳过）

- Requirement Gate 未通过（需求模糊）→ 禁止进入 design，无论 auto/review/manual
- 每阶段 Gate 未过 → 禁止进入下一阶段，以证据为准（build/test 退出码）

## 深度挂点（可选，不预加载）

- **大方案**（>8文件/2类/跨模块）→ 设计完成后提示 `需 Brooks 深度？→ /brooks-audit`（二层，不自动触发）
- 调研需联网 → 内部调 `research`（其内部透明调 `opencli`）

## 完成标准

- [ ] 所有阶段已执行完毕
- [ ] 每个 Gate 已通过（未跳过，含 auto 模式）
- [ ] 产物路径已归档（active.json 清空或移入 .index.json）
- [ ] 用户已收到编排结果汇报（产物路径 + 各阶段摘要）

## 反模式

❌ 跳过 Gate 说"应该没问题"（含 auto 模式）
❌ auto 模式下不给用户任何中间汇报就默默跑完
❌ 用户说"实现XX"时，先切到 `/dev-workflow` 而不是启动本编排——**本 skill 先看意图，需要单步时才路由到单 skill**