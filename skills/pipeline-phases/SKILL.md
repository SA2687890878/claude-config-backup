---
name: pipeline-phases
description: >
  [内部协议] 五阶段内部逻辑定义:需求→设计→开发→测试→验证提交,每阶段过门禁。由 pipeline-executor 调度，不直接对外触发。
version: 1.0.0
---

# 开发全链路 Pipeline（内部协议）

> **内部协议：由 `/pipeline-executor` 调度，不直接对外触发。** 本文件定义五阶段内部逻辑（你怎么走）；调度策略（谁先走、谁接谁、什么时候等确认）见 `pipeline-executor`。
> 对外说"开发 XX"请走 `/pipeline-executor`。**每阶段必须过门禁**,不允许跳过或"应该没问题"。

## 先读任务栈

**Pipeline 启动时先确认当前任务：**

1. 读 `~/.claude/tasks/active.json`
2. 如果 active 为空 → 新建任务写入 active.json（stage=requirements）
3. 如果 active 非空 → 从当前 stage 继续，不跳阶段
4. 每个阶段产物写入 `{product_path}/`

## 流程总览

```
需求 → Gate → 设计 → Gate → 开发 → Gate → 测试 → Gate → 验证+提交 → 收尾
```

## 阶段契约(每阶段:加载 skill → 产出 → 过门禁)

### 1. 需求
- 加载 `requirements`
- 产出:需求清单 + **Task Contract**(task_id / product_path / baseline / acceptance / forbidden / verify_commands)
- 写入: `{product_path}/requirements.md`，更新 active.json（stage=design）
- 🔒 **Gate**:需求与用户确认一致;需求不清必须先澄清,不许带着模糊开工

### 2. 设计
- 加载 `design`(+需要时 `sql-best-practices`)
- 输入: 从 `{product_path}/requirements.md` 读需求
- 产出:技术方案(模块/接口/数据流/风险/边界)，写入 `{product_path}/design.md`
- 更新 active.json（stage=development）
- 🔒 **Gate**:方案自查三问——架构是否合理、安全红线是否触碰、性能是否明显有坑;大方案走 `arch-review`

### 3. 开发
- 加载 `dev-workflow` + `harness-rules`(代码访问/禁令)
- 输入: 从 `{product_path}/design.md` 读技术方案
- 小步实现:先计划 → 写码 → 逐段验证,不做未请求的抽象
- 更新 active.json（stage=development）
- 🔒 **Gate**:`build` 退出码 == 0,附实际命令证据(不自述)

### 4. 测试
- 加载 `test`
- 输入: 当前代码 + `{product_path}/design.md`（验证验收条件）
- 产出:测试用例 + 运行结果
- 更新 active.json（stage=testing）
- 🔒 **Gate**:`test` 退出码 == 0;禁止为通过测试而改测试

### 5. 验证 + 提交
- 加载 `verification-before-completion`:证据栈(action / result / scope / uncovered / residual / confidence)
- **用户确认后才算完成**;然后加载 `commit` 规范提交
- 更新 active.json（stage=done），条目移入 `.index.json`，active 清空
- 🔒 **Gate**:改动文件清单与用户请求一致(无"顺手改")

### 6. 收尾(三件事,必做)
1. **同步**:加载 `sync` 刷新代码索引 + 同步经验(DSH 改的代码要回写索引)
2. **沉淀**:verified-failure 直写 learnings;新经验按 SBA 标准落盘——统一走 `save-memory` skill("保存经验"),并更新 `knowledge-index`
3. **反馈**:报告本次 token 消耗与最贵环节,沉淀"下次怎么省"

> 收尾 = 经验飞轮:验收通过即沉淀,换掉任何 AI 都对人有价值。

## 红线机制(Critical,违反即停)

| 红线 | 判定 |
|------|------|
| 禁止跳阶段 | 任一 Gate 未过不得进入下一阶段 |
| 构建必须过 | Gate 3 以 `build` 退出码 0 为证,不自述 |
| 禁止为通过测试改测试 | Gate 4 以 `test` 退出码 0 为证 |
| commit 以证据为准 | 提交后用 `git log -1` 核验,不凭"应该提交了" |
| 落盘判定 | 每阶段产出必须真实落盘(文件存在),不靠 stdout |

## 自动化提示
- 跨阶段长任务 → 用 goal 工具持续跟踪,中断后从当前阶段恢复
- 调研/多路验证 → subagent 并行
- 变更较大(>100 行)→ 完成后触发 `parallel-review`
- 明确禁止:跳过门禁、用部分验证代替完整验证、下游改上游产物(需求/设计/计划)
