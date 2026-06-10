<!-- Command: 功能开发流程编排
     配套 Workflow: ~/.claude/workflows/feature-development.js -->
功能开发流程。按以下顺序执行，每个阶段完成后等待用户确认再继续。

> **代码访问**：架构探查优先委托 `architect` agent（隔离 context）、实现期委托 `builder` agent。调用代码遵循 [`rules/code-access.md`](../rules/code-access.md) 决策树：先 search.ps1、后 ctx_search、最后 Read。

## 执行方式

**优先使用 Workflow 工具执行**，获得结构化编排、并行 agent、schema 验证：

```
Workflow({scriptPath: "~/.claude/workflows/feature-development.js"})
```

如果 Workflow 工具不可用，按以下流程手动执行。

## 标准流程

```
/requirements(头脑风暴) → /dev-workflow(写计划) → /git-workspace(创建工作区)
→ /dev-workflow(执行计划) → /arch-review → /code-review-workflow(执行审查)
→ /verification-before-completion → /git-workspace(完成分支)
```

---

## Phase 1: 需求探索

调用 `/requirements`，走头脑风暴分支：
- 探索项目上下文（检查文件、文档、近期提交）
- 逐一提问，澄清目标/约束/成功标准
- 提出 2-3 个方案及权衡，给出推荐
- 呈现设计，用户批准后写设计文档
- 用户审阅文档后进入下一阶段

**决策点**：用户批准设计 → Phase 2

---

## Phase 2: 实现规划

调用 `/dev-workflow`，走写计划分支：
- 基于设计文档拆分 bite-sized tasks
- 每个任务：文件映射 + 分步骤（TDD：先写失败测试）
- 保存计划文件

**决策点**：规划完成 → Phase 3

---

## Phase 3: 隔离工作区

调用 `/git-workspace`，走创建工作区分支：
- 检查当前是否已在隔离 worktree 中
- 如未隔离，创建 worktree 保护当前分支

> 若用户拒绝或已在 worktree 中，直接跳到 Phase 4。

**决策点**：工作区就绪 → Phase 4

---

## Phase 4: 代码实现

调用 `/dev-workflow`，走执行计划分支：
- 按计划逐 task 执行
- 每个 task 派 fresh subagent + 两阶段审查
- 完成后执行 `dotnet build`

**决策点**：编译通过 → Phase 5

---

## Phase 5: 代码审查

### 5a. 架构审查

调用 `/arch-review`，检查分层/依赖/SOLID/数据库设计。
- PASS → 继续 5b
- FAIL → 返回 Phase 4 修复

### 5b. 代码审查

调用 `/code-review-workflow`，走执行审查分支，审查 `git diff` 变更。
- CRITICAL/HIGH → 返回 Phase 4 修复
- PASS → Phase 6

---

## Phase 6: 完成验证

调用 `/test-runner`，运行完整测试套件。全部通过后调用 `/verification-before-completion`：
```bash
dotnet build --configuration Release
dotnet test
git diff --stat
```

> 如果涉及数据库变更（加表/加字段/改结构），在此之前调用 `/sql-best-practices` 走数据库变更分支（DB-first scaffold）。

**决策点**：全部 PASS → Phase 7

---

## Phase 7: 收尾

调用 `/git-workspace`，走完成分支：
- 验证测试通过
- 呈现选项：merge / PR / 保留 / 丢弃
- 执行用户选择并清理
