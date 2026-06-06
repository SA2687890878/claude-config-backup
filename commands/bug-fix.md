<!-- Command: 人类可读的流程文档（详细步骤 + 决策点 + 自检清单）
     对应 Workflow: ~/.claude/workflows/bug-fix.js（机器可执行编排） -->
Bug 修复流程。按顺序执行，每个阶段完成后等待用户确认。

## 标准流程

```
/systematic-debugging → /test-driven-development（先写复现失败测试）→ 修复实施
→ /dotnet-review（隔离 diff）→ /verification-before-completion（确定性退出码 gate）
```

---

## Phase 1: 问题定位（systematic-debugging）

调用 /systematic-debugging：

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

用 `codegraph_explore` 分析调用链，定位根因。

**输出**：根因确认 + 修复方案

---

## Phase 2: 修复实施（TDD：先写复现失败测试）

> 官方实践：先写一个能复现该 bug 的失败测试（红），再修复使其转绿。
> 这样得到可回归的确定性信号，而非靠肉眼判断"修好了"。

**第 1 步 — 写复现失败测试**：
- 针对根因写测试，断言「正确行为」
- 运行测试，确认当前确实失败（红），保留失败输出作为证据
- 不得为迁就错误行为而弱化断言

**第 2 步 — 实施修复使测试转绿**：

最小改动原则：
- 只改必须改的
- 保持向后兼容
- 不借机重构（除非必要）
- 修复要针对根因，不得改测试来"凑绿"

自检清单：
```
□ 已先写复现失败测试且确认其变红
□ 根因已修复（不是只修表面症状）
□ 修复后失败测试转绿
□ 不会引入新问题
□ 边界条件已考虑
□ 异步方法正确使用（无 .Result/.Wait()）
□ 资源正确释放
□ 多租户 ComId 正确处理
```

执行确定性验证（读真实退出码）：
```bash
dotnet build
dotnet test
```

**决策点**：编译退出码 0 + 复现测试转绿 + 无回归 → Phase 3

---

## Phase 3: 代码审查（dotnet-review）

调用 /dotnet-review，审查修复变更：
```bash
git diff
```
- CRITICAL → 返回 Phase 2
- PASS → Phase 4

---

## Phase 4: 完成验证（verification-before-completion）

调用 /verification-before-completion：
```bash
dotnet build --configuration Release
dotnet test
git diff --stat
```

---

## Phase 5: 收尾

生成排查文档到 `docs/issues/YYYY-MM-DD-[描述].md`（如有必要）。

调用 `/commit` 提交修复。
