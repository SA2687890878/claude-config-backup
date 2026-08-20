---
name: dev-workflow
description: "该技能用于 development 阶段编写开发计划、执行计划和并行派发。触发：写计划、执行计划、并行派发、开发计划、implementation plan、/dev-workflow。"
version: 3.0.0
---

# 开发工作流（内部执行层）

> **内部执行层：development 阶段专用，由 `/pipeline-executor` 调度。** 对外说"开发XX"请走 `/pipeline-executor`，本 skill 仅在 development 阶段内部执行。

## 先读任务栈

**执行开发前先确认当前任务阶段和设计输入：**

1. 读 `~/.claude/tasks/active.json`
2. 确认 active 非空且 stage >= design（如 stage=requirements，提示先走 `/design`）
3. 从 `{product_path}/design.md` 读取技术方案作为开发输入
4. 如果设计了数据库变更，同时读 `sql-best-practices` 参考
5. 更新 active.json 的 stage=development

## 路由

| 意图 | 分支 |
|------|------|
| 写实现计划（"写计划"、"做个计划"、"plan"） | → A. 写计划 |
| 执行已有计划（"执行计划"、"按计划开发"） | → B. 执行计划 |
| 并行解决独立问题（"并行"、"同时处理"、多个独立 bug） | → C. 并行派发 |
| 切换压缩模式（"caveman mode"、"be brief"、"less tokens"、"压缩模式"） | → D. 压缩模式 |
| 不确定 | → 问用户 |

---

## A. 写计划

产出全面的实现计划，假设执行者对代码库零上下文。DRY. YAGNI. 频繁提交。

**核心原则：**
- Phase 0 必须先做：文档发现，确认 API 真实存在
- 范围检查：多个独立子系统 → 拆成多个计划
- 文件结构映射：定义 task 前先规划文件
- 粒度：每个步骤是一个动作（2-5 分钟）
- 禁止占位符：绝不写 TBD、TODO
- Subagent 报告契约：每个发现必须有来源引用

读取 `references/plan-details.md` 了解完整流程和自检清单，`references/plan-template.md` 为计划文档模板。

### 完成标准

- [ ] Phase 0 文档发现已完成（API 真实存在已确认）
- [ ] 每个 task 有明确的输入/输出和预期行为
- [ ] 每个 task 粒度为 2-5 分钟
- [ ] 无 TBD/TODO 占位符
- [ ] 文件结构映射已完成

### 反模式

❌ 不要在没有确认 API 存在的情况下写 task。
❌ 不要写超过 10 分钟粒度的 task。
❌ 不要在计划里写实现细节（代码）——只写行为。

---

## B. 执行计划

**核心流程：**
1. 加载并审查计划文件
2. 逐 task 执行：标记 in_progress → 执行 → 验证 → 标记 completed
3. 每阶段验证：反模式扫描 + 代码质量快查，通过才进入下一 task
4. 连续执行，不在 task 之间暂停
5. 碰到阻塞立即停下求助

读取 `references/execution-details.md` 了解 subagent 模式、每阶段验证和模型选择。

### 完成标准

- [ ] 所有 task 标记为 completed
- [ ] 每个 task 的验证已通过（编译 + 测试）
- [ ] dotnet build 退出码 == 0
- [ ] dotnet test 退出码 == 0
- [ ] 无回归（现有测试全部通过）

### 产物移交

开发完成后更新 active.json 的 stage=testing。

### 经验沉淀（收尾，SBA 三件套）

任务完成、结果验证后，按三件套决定是否沉淀经验到 `learnings.md`：

1. **Recording Threshold（2/3 门槛）**——只有满足 ≥2 条才沉淀：
   - 可重复（同类情况会再遇到）
   - 代价高（踩了损失大）
   - 代码看不出（不看记录会再犯）
2. **verified-failure 直写**——本次故障红转绿（从失败修到通过）的教训，直接写最近的规则 owner（`rules/*.md` 或对应 skill），不等重复发生
3. **activate 校验**——每条经验必须能回答"落在任务路径上改变哪一步动作"；答不上来 = 不沉淀。同根因再犯 → 提示升级为机器门禁（hook/guard）

**沉淀位置**：项目级 `.claude/learnings.md`；跨项目经验到全局 `~/.claude/learnings.md`。格式见 verification-before-completion skill 的 memory-save-details。

### 反模式

❌ 不要跳过 task 验证直接进入下一个。
❌ 不要在 task 失败时继续执行后续 task。
❌ 不要修改计划来"凑完成"——如果 task 不合理，停下跟用户讨论。

---

## C. 并行派发

每个独立问题域一个 agent，并发执行。

**并行前过三把尺子（缺一不开并行）：**
1. 上下文保护 — 子任务会产生大量与主任务无关的信息 → 独立 agent 隔离
2. 可并行 — 任务能切成独立分支同时跑，互不阻塞
3. 专业化 — 不同步骤需要不同工具/提示/专注度

三把都不满足 → 单 agent 顺序执行，别为并行而并行。

**识别独立域：**
- 用当：3+ 测试文件因不同根因失败、无共享状态
- 不用当：故障相关、需要完整系统状态

**派发 → 集成：**
- 每个 agent 得到：具体范围 + 明确目标 + 约束 + 预期输出
- agent 返回后：读摘要 → 验证不冲突 → 运行完整测试 → 集成变更

### 完成标准

- [ ] 所有 agent 已返回结果
- [ ] 变更之间无冲突
- [ ] 完整测试套件通过
- [ ] 变更已集成到主分支

### 反模式

❌ 不要在有共享状态的问题域之间并行。
❌ 不要跳过冲突检查直接集成。

---

## D. 压缩模式

压缩 token 用量 ~75%，保持完整技术精度。支持 lite/full/ultra 三级强度。

**切换方式：**
- 开启：`/dev-workflow caveman` 或 `caveman mode`
- 切换强度：`/dev-workflow lite|full|ultra`
- 关闭：`stop caveman` 或 `normal mode`

读取 `references/caveman-details.md` 了解压缩规则和强度定义。

---

## 参考文件

- **`references/plan-details.md`** — 写计划完整流程和自检清单
- **`references/execution-details.md`** — 执行计划 subagent 模式和每阶段验证
- **`references/caveman-details.md`** — 压缩模式规则和强度定义
- **`references/subagent-pattern.md`** — Subagent 派发模式
