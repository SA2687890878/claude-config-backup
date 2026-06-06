<!-- Command: 人类可读的流程文档（详细步骤 + 决策点 + 自检清单）
     对应 Workflow: ~/.claude/workflows/feature-development.js（机器可执行编排） -->
功能开发流程。按以下顺序执行，每个阶段完成后等待用户确认再继续。

## 标准流程（Harness 最佳实践）

```
/brainstorming → /writing-plans → /using-git-worktrees → /subagent-driven-development
→ /arch-review → /dotnet-review → /verification-before-completion
→ /finishing-a-development-branch
```

---

## Phase 1: 需求探索（brainstorming）

调用 /brainstorming：
- 探索项目上下文（检查文件、文档、近期提交）
- 逐一提问，澄清目标/约束/成功标准
- 提出 2-3 个方案及权衡，给出推荐
- 呈现设计，用户批准后写设计文档到 `docs/superpowers/specs/YYYY-MM-DD-[name]-design.md`
- 用户审阅文档后进入下一阶段

**决策点**：用户批准设计 → Phase 2

---

## Phase 2: 实现规划（writing-plans）

调用 /writing-plans：
- 基于设计文档拆分任务
- 每个任务：文件映射 + 分步骤（TDD：先写失败测试）
- 保存到 `docs/superpowers/plans/YYYY-MM-DD-[name].md`（writing-plans 标准路径）
- 同步更新 `docs/features/[name]/04-tasks.md`（项目文档中心链接）
- 计划头部必须包含 Harness 标准头（Goal / Architecture / Tech Stack）

**决策点**：规划完成 → Phase 2.5

---

## Phase 2.5: 隔离工作区（using-git-worktrees）

调用 /using-git-worktrees：
- 检查当前是否已在隔离 worktree 中
- 如未隔离，询问用户是否创建 worktree（保护当前分支）
- 创建 `worktrees/[feature-name]` 隔离分支
- 后续所有代码改动在此 worktree 中进行

> 若用户拒绝或已在 worktree 中，直接跳到 Phase 3。

**决策点**：工作区就绪 → Phase 3

---

## Phase 3: 代码实现（subagent-driven-development）

调用 /subagent-driven-development：
- 严格按顺序：Entity → DTO → Interface → Service → Controller
- 每个组件完成后执行自检清单
- 多租户字段 `ComId` 正确处理
- 使用 `AsNoTracking()` 读只读数据
- 完成后执行：`dotnet build`

**决策点**：编译通过 → Phase 4

---

## Phase 4: 代码审查

### 4a. 架构审查（arch-review）
调用 /arch-review，检查分层/依赖/SOLID/数据库设计。
- PASS → 继续 4b
- FAIL → 返回 Phase 3 修复

### 4b. 代码审查（dotnet-review）
调用 /dotnet-review，读取 `git diff` 审查变更。
- CRITICAL/HIGH → 返回 Phase 3 修复
- PASS → Phase 5

---

## Phase 5: 完成验证（verification-before-completion）

调用 /verification-before-completion：
```bash
dotnet build --configuration Release
dotnet test
git diff --stat
```
检查：无临时代码残留、无硬编码密钥、异步一致性、DB 查询安全。

**决策点**：全部 PASS → Phase 6

---

## Phase 6: 收尾（finishing-a-development-branch）

调用 /finishing-a-development-branch：
- 验证测试通过
- 检测环境（普通仓库/worktree）
- 呈现选项：merge / PR / stash / 继续开发
- 执行用户选择并清理
