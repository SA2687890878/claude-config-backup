---
name: dev-workflow
description: >
  开发工作流 — 路由到"写计划"、"执行计划"、"并行派发"、"压缩模式"四条分支。
  当用户说 /dev-workflow、写计划、执行计划、并行派发、开发计划、
  implementation plan、subagent 开发、caveman mode、压缩模式时触发。
version: 2.0.0
---

# 开发工作流

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

读取 `references/plan-details.md` 了解完整流程和自检清单。

---

## B. 执行计划

**核心流程：**
1. 加载并审查计划文件
2. 逐 task 执行：标记 in_progress → 执行 → 验证 → 标记 completed
3. 每阶段验证：反模式扫描 + 代码质量快查，通过才进入下一 task
4. 连续执行，不在 task 之间暂停
5. 碰到阻塞立即停下求助

读取 `references/execution-details.md` 了解 subagent 模式、每阶段验证和模型选择。

---

## C. 并行派发

每个独立问题域一个 agent，并发执行。

**识别独立域：**
- 用当：3+ 测试文件因不同根因失败、无共享状态
- 不用当：故障相关、需要完整系统状态

**派发 → 集成：**
- 每个 agent 得到：具体范围 + 明确目标 + 约束 + 预期输出
- agent 返回后：读摘要 → 验证不冲突 → 运行完整测试 → 集成变更

---

## D. 压缩模式

压缩 token 用量 ~75%，保持完整技术精度。支持 lite/full/ultra 三级强度。

**切换方式：**
- 开启：`/dev-workflow caveman` 或 `caveman mode`
- 切换强度：`/dev-workflow lite|full|ultra`
- 关闭：`stop caveman` 或 `normal mode`

读取 `references/caveman-details.md` 了解压缩规则和强度定义。
