---
name: review
description: >
  代码审查与审计:自动按变更规模选择策略。"审查"、"找 bug"、"审计"、"code review"。
version: 2.0.0
---

# 代码审查与深度审计

## 核心原则

**用户说"审查"，agent 自动决定策略。**

**铁律：子代理对抗审查按变更规模分级——变更 > 200 行必须启动 ≥2 个独立子代理；50-200 行至少 1 个。** 主 agent 完成初轮审查后，启动子代理独立审查（50-200 行 ≥1 个；>200 行 ≥2 个，分别从 Standards 和 Spec 轴独立审查），交叉验证后输出最终报告。不允许主 agent 独自完成全部审查工作——子代理的独立视角能发现主审查遗漏的深层问题（已验证：1413 行审查中初轮遗漏 12/23 个发现）。

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
3. **主 agent 执行初审**：读取 `references/checklist.md`，按分类逐项检查
4. **启动子代理对抗审查**：变更 50-200 行时启动 1 个独立子代理；> 200 行时启动至少 2 个独立子代理（分别从 Standards 轴和 Spec 轴），与主 agent 互不通信，各自输出发现
5. **交叉验证**：汇总主 agent + 各子代理的发现，去重、排序、交叉验证
6. 输出报告：读取 `references/report-format.md`（共享报告规则 → `templates/audit-report.md`）；快速审查的简版结构参考 `references/report-template.md`

**双轴审查（重要）：** 审查报告必须分两个独立轴，不合并排序：

| 轴 | 检查内容 | 来源 |
|----|---------|------|
| **Standards（规范）** | 代码是否符合项目编码规范 | `references/checklist.md` + `references/dotnet-checklist.md` |
| **Spec（需求）** | 代码是否匹配原始需求/PRD/用户要求；抓"无需求依据的改动"（越界到需求之外、凭语义联想自作主张） | 需求文档或用户对话 |

**为什么分两轴：** 一个 change 可以 Standards pass + Spec fail（代码规范但功能不对），反过来也行。合并排序会掩盖问题。

**报告格式：**
```
### Standards 轴
[规范符合性发现]

### Spec 轴
[需求匹配度发现]

### 汇总
- Standards: N 个发现，最严重的是 [X]
- Spec: N 个发现，最严重的是 [Y]
```

**完成标准：**
- [ ] 两个轴都已检查（或 Spec 轴标注"无需求文档"）
- [ ] 报告按双轴分开呈现
- [ ] 每个发现有具体的代码位置和规范来源

**按变更类型选择策略：**

| 变更规模 | 策略 | 读取 |
|----------|------|------|
| < 50 行 | 快速审查 | `references/quick-review.md` |
| 50-200 行 | 标准审查（含 1 个子代理对抗） | `references/checklist.md` |
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

**核心流程：**
1. 读取 `references/execute-review.md` 了解审查流程
2. 读取 `prompts/full-audit.md` 获取25个审计维度
3. 根据审计维度，读取对应的 prompts 文件
4. 读取 `rubrics/scoring.md` 获取评分标准
5. 读取 `templates/audit-report.md` 获取报告格式

**按审计维度选择 prompts：**

| 审查领域 | 读取 |
|----------|------|
| 架构 | `prompts/architecture-audit.md` |
| 安全 | `prompts/security-audit.md` |
| 稳定性 | `prompts/stability-audit.md` |
| 性能 | `prompts/performance-audit.md` |
| 测试 | `prompts/testing-audit.md` |
| 可维护性 | `prompts/maintainability-audit.md` |
| 设计 | `prompts/design-audit.md` |
| 发布 | `prompts/release-audit.md` |
| 文档 | `prompts/documentation-audit.md` |
| 可观测性 | `prompts/observability-audit.md` |
| 配置 | `prompts/configuration-audit.md` |
| 数据完整性 | `prompts/data-integrity-audit.md` |
| 隐私 | `prompts/privacy-audit.md` |
| 可访问性 | `prompts/accessibility-audit.md` |
| 供应链 | `prompts/supply-chain-audit.md` |
| 成本 | `prompts/cost-audit.md` |
| AI安全 | `prompts/ai-safety-audit.md` |
| 降级 | `prompts/fallback-audit.md` |
| 测试真实性 | `prompts/testing-authenticity-audit.md` |
| 类型安全 | `prompts/type-safety-audit.md` |
| 前端状态 | `prompts/frontend-state-audit.md` |
| 后端API | `prompts/backend-api-audit.md` |
| 依赖权重 | `prompts/dependency-weight-audit.md` |
| 代码一致性 | `prompts/code-consistency-audit.md` |
| 注释覆盖 | `prompts/comment-coverage-audit.md` |

**按审查需求选择 rubrics：**

| 需求 | 读取 |
|------|------|
| 评分标准 | `rubrics/scoring.md` |
| 严重程度定义 | `rubrics/severity.md` |
| 证据要求 | `rubrics/evidence.md` |
| 置信度定义 | `rubrics/confidence.md` |
| 覆盖度要求 | `rubrics/coverage.md` |
| 审查原则 | `rubrics/principles.md` |

**按输出格式选择 templates：**

| 需求 | 读取 |
|------|------|
| 审查报告 | `templates/audit-report.md` |
| 问题卡片 | `templates/issue-card.md` |
| 修复计划 | `templates/remediation-plan.md` |

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
