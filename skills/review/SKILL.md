---
name: review
description: >
  代码审查与深度审计 — 当用户说"审查"、"review"、"找 bug"、"审计"、"代码有问题吗"、"帮我看看"时触发。
  自动分析变更类型和规模，选择合适的审查策略。
version: 1.0.0
---

# 代码审查与深度审计

## 核心原则

**用户说"审查"，agent 自动决定策略。**

## 路由

| 意图 | 策略 |
|------|------|
| 审查代码变更（"帮我看看"、"review"、"审查"） | → A. 执行审查 |
| 快速审查（"快速看看"、"这几行有问题吗"） | → B. 快速审查 |
| 深度审计（"审计"、"代码质量"） | → C. 深度审查 |
| 请求审查（"请求审查"、"让别人看看"） | → D. 请求审查 |
| 接收反馈（"收到反馈"、"reviewer 说"） | → E. 接收反馈 |
| 不确定 | → A. 执行审查（默认） |

---

## A. 执行审查

**核心流程：**
1. 确定范围：`git diff` 获取变更
2. 自动选择审查策略（见下方"按变更类型选择策略"）
3. 执行审查：读取 `references/checklist.md`，按分类逐项检查
4. 输出报告：读取 `references/report-template.md`

**按变更类型选择策略：**

| 变更规模 | 策略 | 读取 |
|----------|------|------|
| < 50 行 | 快速审查 | `references/quick-review.md` |
| 50-200 行 | 标准审查 | `references/checklist.md` |
| > 200 行 | 深度审查 | `references/execute-review.md` |
| 涉及 auth/crypto/database | 安全审查 | `references/dotnet-checklist.md` |
| 涉及 test 文件 | 测试审查 | `references/checklist.md` |

**按文件类型选择检查清单：**

| 文件类型 | 读取 |
|----------|------|
| `.cs` | `references/dotnet-checklist.md` |
| `.vue` | `references/vue-checklist.md` |
| `.sql` | `references/sql-checklist.md` |
| `*.json` / `*.xml` | `references/config-checklist.md` |

---

## B. 快速审查

**适用场景：** 只改了几行代码，不需要完整审查流程。

**读取：** `references/quick-review.md`

---

## C. 深度审查（25维度）

**适用场景：** 变更 > 200 行，需要全面审计。

**读取：** `references/execute-review.md` + `prompts/full-audit.md`

**评分标准：** 读取 `rubrics/scoring.md`

**报告模板：** 读取 `templates/audit-report.md`

---

## D. 请求审查

**适用场景：** 请求 subagent 审查。

**读取：** `references/request-review.md`

---

## E. 接收反馈

**适用场景：** 接收审查反馈。

**读取：** `references/receiving-feedback-details.md`

---

## 严重程度定义

读取 `rubrics/severity.md`
