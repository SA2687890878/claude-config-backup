---
name: code-review-workflow
description: >
  代码审查全流程 — 路由到"我审别人"、"请求别人审"、"接收反馈"三条分支。
  以 Staff Engineer 视角审查 C#/Vue 2/PostgreSQL 代码变更，找能通过编译但会在生产环境炸的问题。
  当用户说 /code-review-workflow、代码审查、code review、帮我看看这段代码、
  review 一下这个改动、请求审查、接收审查反馈时触发。
version: 1.0.0
---

# 代码审查工作流

## 代码探索铁律

审查需要达到上下文时先用索引、最后才 Read。遵循 [`rules/code-access.md`](../../rules/code-access.md) 的决策树——search.ps1 查符号、ctx_search 查语义、Read 只看精确范围。加密项目禁用 ctx_search/codegraph 查 .cs。

## 路由

根据用户意图走不同分支：

| 意图 | 分支 |
|------|------|
| 审查代码变更（"帮我看看"、"review"、"审查"） | → A. 执行审查 |
| 请求 subagent 审查（"请求审查"、"让别人看看"） | → B. 请求审查 |
| 接收审查反馈（"收到反馈"、"reviewer 说"） | → C. 接收反馈 |
| 不确定 | → A. 执行审查（默认） |

---

## A. 执行审查

### 确定范围

- git 仓库中：`git diff` 获取变更
- 用户指定文件：直接审查
- 没有明确范围：问用户

### 执行

读取 `references/checklist.md` 了解审查清单。按分类逐项检查。

每个 finding 格式：`[严重级别] (置信度: N/10) 文件:行号 — 描述`

严重级别：
- **CRITICAL** — 生产必炸（数据丢失、安全漏洞、死锁）
- **HIGH** — 很可能出问题（未处理异常、资源泄漏）
- **MEDIUM** — 可能出问题（边界条件、性能隐患）
- **LOW** — 代码质量（命名、冗余、可读性）

### 输出报告

读取 `references/report-template.md`，按模板输出。每个问题标注置信度（1-10），低于 5 不进主报告。明显问题直接自动修复，不只报告。

### 认知模式

1. **生产环境优先** — 想象凌晨 3 点跑着，没人看监控
2. **数据流追踪** — 从输入到输出完整走一遍
3. **并发假设** — 两个请求同时到达同一行代码
4. **防御性编程** — 每个外部输入都不可信

---

## B. 请求审查

读取 `references/request-review.md`，按步骤派发 code reviewer subagent。

核心流程：获取 git SHAs → 构造审查上下文 → 派发 subagent → 按严重级别处理反馈（Critical 立即修、Important 继续前修、Minor 记录、错了就 push back）。

---

## C. 接收反馈

技术评估，不是情绪表演。Read 工具读出乱码时，用 PowerShell `[System.IO.File]::ReadAllText('路径', [System.Text.Encoding]::UTF8)` 读取。

### 响应模式

1. READ: 完整读完反馈，不反应
2. UNDERSTAND: 用自己的话复述需求（或提问）
3. VERIFY: 对照代码库实际验证
4. EVALUATE: 对这个代码库技术上合理吗？
5. RESPOND: 技术确认或有理有据的 push back
6. IMPLEMENT: 逐项修复，每项测试

### 禁止的响应

- ❌ "你说得对！" — 违反 CLAUDE.md
- ❌ "好建议！" — 表演性认同
- ❌ "我马上改" — 未验证就改
- ✅ 复述技术需求 / 问澄清 / 用技术理由 push back / 直接动手

### 处理不清楚的反馈

如果任何一项不清楚：停下，不要改任何东西，要求澄清。原因：各项可能相关，部分理解 = 错误实现。

### 实施顺序

1. 先澄清所有不清楚的
2. 阻塞问题（崩溃、安全）→ 简单修复（拼写、import）→ 复杂修复（重构、逻辑）
3. 每项单独测试
4. 验证无回归

### Push Back 条件

- 建议会破坏现有功能
- Reviewer 缺少完整上下文
- 违反 YAGNI（未使用的功能）
- 对这个技术栈技术上不正确
- 存在遗留/兼容性原因

方式：用技术理由，不防御性。问具体问题。引用可运行的测试/代码。

### YAGNI 检查

如果 reviewer 建议"正式实现"，先 grep 代码库找实际使用。没用就建议删掉。
