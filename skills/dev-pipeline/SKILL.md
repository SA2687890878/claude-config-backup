---
name: dev-pipeline
description: >
  新功能开发全链路:需求→设计→开发→测试→验证提交,每阶段过门禁。触发:新功能、开发全流程、一键开发、pipeline。
version: 1.0.0
---

# 开发全链路 Pipeline

> 用户说"开发 XX"→ 按本流程走完五阶段。**每阶段必须过门禁**,不允许跳过或"应该没问题"。

## 流程总览

```
需求 → Gate → 设计 → Gate → 开发 → Gate → 测试 → Gate → 验证+提交 → 收尾
```

## 阶段契约(每阶段:加载 skill → 产出 → 过门禁)

### 1. 需求
- 加载 `requirements`
- 产出:需求清单 + **Task Contract**(intent / acceptance / forbidden / verify_commands / baseline)
- 🔒 **Gate**:需求与用户确认一致;需求不清必须先澄清,不许带着模糊开工

### 2. 设计
- 加载 `design`(+需要时 `sql-best-practices`)
- 产出:技术方案(模块/接口/数据流/风险/边界)
- 🔒 **Gate**:方案自查三问——架构是否合理、安全红线是否触碰、性能是否明显有坑;大方案走 `arch-review`

### 3. 开发
- 加载 `dev-workflow` + `harness-rules`(代码访问/禁令)
- 小步实现:先计划 → 写码 → 逐段验证,不做未请求的抽象
- 🔒 **Gate**:`build` 退出码 == 0,附实际命令证据(不自述)

### 4. 测试
- 加载 `test`
- 产出:测试用例 + 运行结果
- 🔒 **Gate**:`test` 退出码 == 0;禁止为通过测试而改测试

### 5. 验证 + 提交
- 加载 `verification-before-completion`:证据栈(action / result / scope / uncovered / residual / confidence)
- **用户确认后才算完成**;然后加载 `commit` 规范提交
- 🔒 **Gate**:改动文件清单与用户请求一致(无"顺手改")

### 6. 收尾(三件事,必做)
1. **同步**:加载 `sync` 刷新代码索引 + 同步经验(DSH 改的代码要回写索引)
2. **沉淀**:verified-failure 直写 learnings;新经验按 SBA 标准落盘
3. **反馈**:报告本次 token 消耗与最贵环节,沉淀"下次怎么省"

## 自动化提示
- 跨阶段长任务 → 用 goal 工具持续跟踪,中断后从当前阶段恢复
- 调研/多路验证 → subagent 并行
- 变更较大(>100 行)→ 完成后触发 `parallel-review`
- 明确禁止:跳过门禁、用部分验证代替完整验证、下游改上游产物(需求/设计/计划)
