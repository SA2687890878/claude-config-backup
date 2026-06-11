---
name: code-review-workflow
description: >
  代码审查全流程 — 路由到"我审别人"、"请求别人审"、"接收反馈"三条分支。
  当用户说 /code-review-workflow、代码审查、code review、帮我看看这段代码、
  review 一下这个改动、请求审查、接收审查反馈时触发。
version: 1.0.0
---

# 代码审查工作流

## 代码探索铁律

审查需要达到上下文时先用索引、最后才 Read。遵循 [`rules/tools/code-access.md`](../../rules/tools/code-access.md) 的决策树。

## 路由

| 意图 | 分支 |
|------|------|
| 审查代码变更（"帮我看看"、"review"、"审查"） | → A. 执行审查 |
| 请求 subagent 审查（"请求审查"、"让别人看看"） | → B. 请求审查 |
| 接收审查反馈（"收到反馈"、"reviewer 说"） | → C. 接收反馈 |
| 不确定 | → A. 执行审查（默认） |

---

## A. 执行审查

**核心流程：**
1. 确定范围：`git diff` 获取变更
2. 执行审查：读取 `references/checklist.md`，按分类逐项检查
3. 输出报告：读取 `references/report-template.md`

**严重级别：**
- **CRITICAL** — 生产必炸（数据丢失、安全漏洞、死锁）
- **HIGH** — 很可能出问题（未处理异常、资源泄漏）
- **MEDIUM** — 可能出问题（边界条件、性能隐患）
- **LOW** — 代码质量（命名、冗余、可读性）

**认知模式：**
1. 生产环境优先 — 想象凌晨 3 点跑着，没人看监控
2. 数据流追踪 — 从输入到输出完整走一遍
3. 并发假设 — 两个请求同时到达同一行代码
4. 防御性编程 — 每个外部输入都不可信

---

## B. 请求审查

读取 `references/request-review.md`，按步骤派发 code reviewer subagent。

核心流程：获取 git SHAs → 构造审查上下文 → 派发 subagent → 按严重级别处理反馈。

---

## C. 接收反馈

技术评估，不是情绪表演。

**响应模式：**
1. READ: 完整读完反馈，不反应
2. UNDERSTAND: 用自己的话复述需求（或提问）
3. VERIFY: 对照代码库实际验证
4. EVALUATE: 对这个代码库技术上合理吗？
5. RESPOND: 技术确认或有理有据的 push back
6. IMPLEMENT: 逐项修复，每项测试

读取 `references/receiving-feedback-details.md` 了解完整流程。
