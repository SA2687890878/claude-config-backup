# Quality Gate 体系

> 所有工作流必须通过对应的质量门禁，不可跳过。

## 门禁概览

| 门禁 | 时机 | 通过条件 |
|------|------|---------|
| Requirement Gate | 需求探索完成后 | 所有检查项通过 |
| Design Gate | 设计完成后 | 所有检查项通过 |
| Code Gate | 编码完成后 | 编译通过 + 审查通过 |
| Test Gate | 测试完成后 | 所有测试通过 |
| Release Gate | 发布前 | 所有检查项通过 |

## 详细参考

- Requirement Gate：`~/.claude/knowledge/rules/gates/requirement.md`
- Design Gate：`~/.claude/knowledge/rules/gates/design.md`
- Code Gate：`~/.claude/knowledge/rules/gates/code.md`
- Test Gate：`~/.claude/knowledge/rules/gates/test.md`
- Release Gate：`~/.claude/knowledge/rules/gates/release.md`

## 工作流集成

- **explore** → Requirement Gate
- **build** → Design Gate → Code Gate → Test Gate
- **operate** → Code Gate → Test Gate

---

## 任务追踪与 Task Contract

**首次写文件（或切换上下文）前，必须先声明 Task Contract。** 这不是可选的防自欺机制，而是**产物定位和阶段流转的锚点**。

### Task Contract 模板

```text
[Task Contract]
task_id: 需求名-YYYYMMDD（唯一标识，如 auth-permission-20260815）
title: 用户权限模块重构
stage: requirements|design|development|testing|done|paused
paused_at: skill名/步骤名（暂停时记录，恢复时从这里继续）
product_path: docs/features/{task_id}/（所有产物统一放此目录，很重要）
baseline: git 分支名或 HEAD（改动前基线，防回滚丢失）
acceptance: 怎么算成功（可验证条件）
forbidden: 不能做什么
verify_commands: 用什么命令验证
```

### 执行规则

1. **开始新任务** → 创建 active.json，写 task_id + product_path + stage=requirements + baseline
2. **推进阶段** → 更新 active.json 的 stage（需求→设计→开发→测试→完成）
3. **产物输出** → 始终写入 `{product_path}/`。设计读 `{product_path}/requirements.md`，开发读 `{product_path}/design.md`
4. **完成/切换** → active.json 条目移入 `.index.json`，active 归空
5. **暂停** → 更新 active.json：stage=paused，paused_at=当前skill/步骤名
6. **恢复** → 读 active.json，从 paused_at 处继续
7. **切换任务** → 存档当前任务（stage=paused），开新任务

### 索引设计

- `~/.claude/tasks/active.json` — 活跃任务栈，最多 3 个并行任务。支持 paused 状态（暂停但未完成）。**每次都读**（恒定大小，不膨胀）
- `~/.claude/tasks/.index.json` — 历史索引。**只按需读**，用于查找已完成或暂停任务的产物路径

### 反模式

❌ 跨任务混放产物到同一目录
❌ 不写 baseline 直接改代码（导致回滚时找不到原始状态）
❌ 多个任务共享同一个 product_path（产物交叉污染）

### 完成声明

```text
[候选完成] agent_proposed_status: done
证据：[build 输出] [test 输出]
剩余风险：[已知的未验证项]
请确认是否接受。
```

**禁止**：跳过用户确认直接宣布完成。

### 防作弊红线

- 禁止为通过测试而修改测试
- 禁止跳过验证声称"应该没问题"
- 禁止用"部分验证"代替"完整验证"

### 熔断与责任边界

- 连续打回 ≥3 次 → 暂停，人工介入（熔断，防 AI 自圆其说循环）
- 下游环节不可修改上游产物（需求/设计/计划），只能提阻塞项

### 红线分级与触发即停

- 红线分两级：Critical（全流程必守，违反即事故/严重返工）/ Standard（按需，违反污染规范）
- 触发红线 → 立即停下，按模板汇报：当前情形 + 建议处理（回退到哪一步 / 需确认什么）
- 治理红线：工作图（任务怎么拆/合）可快变；角色图（谁能改 DB/绕过审批）必须慢变、可审计

---

## 偏差检测

### 偏差类型

| 类型 | 严重度 |
|------|--------|
| 功能偏差（实现了未要求的功能） | medium |
| 功能遗漏（遗漏了明确要求的功能） | high |
| 范围蔓延（改动超出预期） | medium |
| 技术偏差（用了不想要的技术方案） | medium |
| 约束违反（违反硬限制） | high |

### 检测节点

- **执行前**：用户要求 vs 我的理解，不一致必须确认
- **执行中**：发现"顺便改 XXX"、"接口也要调整"时暂停检查
- **提交前**：实际改了哪些文件？是否都是用户要求改的？

### 严重度处理

- **low**：继续，记录
- **medium**：向用户确认
- **high**：必须暂停，等待用户确认

---

## R1-R6 根因框架

任务偏差归因后再决定是否改规范：

| 根因 | 含义 | 动作 |
|------|------|------|
| R1 规范缺失 | 没有对应约定 | 补充规则 |
| R2 规范冗余 | 规则太多矛盾 | 精简 |
| R3 规范过时 | 工具变了规则没变 | 更新 |
| R4 Review 漏洞 | 检查项不完整 | 补清单 |
| R5 代码 bug | 逻辑错误 | 修代码，不动规范 |
| R6 外部因素 | 第三方变更 | 记录 |

**铁律**：R5/R6 不触发规范进化；R1-R4 才是补规则的合法依据。
