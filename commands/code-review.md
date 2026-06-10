<!-- Command: 代码审查流程编排
     配套 Workflow: ~/.claude/workflows/code-review.js -->
代码审查流程。并行多维度审查，快速发现所有问题。

> **代码访问**：审查跨多文件时遵循 [`rules/code-access.md`](../rules/code-access.md)——先用 search.ps1/ctx_search 定位，再 Read 精确范围。加密项目不要对 .cs 用 ctx_search/codegraph。

## 执行方式

**优先使用 Workflow 工具执行**：

```
Workflow({scriptPath: "~/.claude/workflows/code-review.js"})
```

如果 Workflow 工具不可用，按以下流程手动执行。

## 标准流程

```
确定审查范围 → /code-review-workflow(执行审查) → 问题汇总 → 修复建议
```

---

## Phase 1: 确定审查范围

- git 仓库中：`git diff` 获取变更
- 用户指定文件：直接审查
- 没有明确范围：问用户

---

## Phase 2: 执行审查

调用 `/code-review-workflow`，走执行审查分支。

按审查清单逐项检查，每个维度的发现汇总到一起。

---

## Phase 3: 问题汇总

按严重级别分类：
- **CRITICAL** — 生产必炸，必须修
- **HIGH** — 很可能出问题，应该修
- **MEDIUM** — 可能出问题，建议修
- **LOW** — 代码质量，可选修

---

## Phase 4: 修复建议

为 CRITICAL 和 HIGH 问题提供具体修复代码。

明显问题直接自动修复（需用户同意）。
