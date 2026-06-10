<!-- Command: Bug 修复流程编排
     配套 Workflow: ~/.claude/workflows/bug-fix.js -->
Bug 修复流程。按顺序执行，每个阶段完成后等待用户确认。

> **代码访问**：定位 bug 调用链优先用 `search.ps1 -Callers`；查错误信息/日志关键字用 `ctx_search`（仅 READABLE）。详见 [`rules/code-access.md`](../rules/code-access.md)。

## 执行方式

**优先使用 Workflow 工具执行**：

```
Workflow({scriptPath: "~/.claude/workflows/bug-fix.js"})
```

如果 Workflow 工具不可用，按以下流程手动执行。

## 标准流程

```
/systematic-debugging → /generate-tests(写复现失败测试) → 修复实施
→ /code-review-workflow(执行审查) → /verification-before-completion
```

---

## Phase 1: 问题定位

调用 `/systematic-debugging`：

先收集信息（信息不全就问，不要猜）：
- **错误信息**：完整的异常堆栈/错误日志
- **复现步骤**：什么操作触发的？能否稳定复现？
- **环境**：开发/测试/生产？最近有没有改动？
- **影响范围**：只有这一个接口还是多个地方都有？

严重程度分类：

| 级别 | 定义 |
|------|------|
| P0 | 生产环境无法使用、数据丢失 |
| P1 | 核心功能异常、有 workaround |
| P2 | 非核心功能异常 |
| P3 | 体验问题、UI 瑕疵 |

**输出**：根因确认 + 修复方案

---

## Phase 2: 修复实施（TDD：先写复现失败测试）

**第 1 步 — 写复现失败测试**：

调用 `/generate-tests`，针对根因写测试。运行测试确认当前确实失败（红）。

**第 2 步 — 实施修复使测试转绿**：

最小改动原则：只改必须改的、保持向后兼容、不借机重构。

自检清单：
```
□ 已先写复现失败测试且确认其变红
□ 根因已修复（不是只修表面症状）
□ 修复后失败测试转绿
□ 不会引入新问题
□ 异步方法正确使用（无 .Result/.Wait()）
□ 资源正确释放
```

执行确定性验证：
```bash
dotnet build
dotnet test
```

**决策点**：编译退出码 0 + 复现测试转绿 + 无回归 → Phase 3

---

## Phase 3: 代码审查

调用 `/code-review-workflow`，走执行审查分支，审查修复变更。
- CRITICAL → 返回 Phase 2
- PASS → Phase 4

---

## Phase 4: 完成验证

调用 `/test-runner`，运行完整测试套件确认无回归。全部通过后调用 `/verification-before-completion`：
```bash
dotnet build --configuration Release
dotnet test
```

---

## Phase 5: 收尾

生成排查文档到 `docs/issues/YYYY-MM-DD-[描述].md`（如有必要）。

调用 `/commit` 提交修复。
