# Task Contract + 偏差检测 + R1-R6

> 从 gates.md 拆出，开发阶段按需加载。

## Task Contract 模板

```text
[Task Contract]
task_id: 需求名-YYYYMMDD（唯一标识，如 auth-permission-20260815）
title: 用户权限模块重构
stage: requirements|design|development|testing|done|paused
paused_at: skill名/步骤名（暂停时记录，恢复时从这里继续）
product_path: docs/features/{task_id}/（所有产物统一放此目录）
baseline: git 分支名或 HEAD（改动前基线，防回滚丢失）
acceptance: 怎么算成功（可验证条件）
forbidden: 不能做什么
verify_commands: 用什么命令验证
```

## 执行规则

1. **开始新任务** → 创建 active.json，写 task_id + product_path + stage=requirements + baseline
2. **推进阶段** → 更新 active.json 的 stage
3. **产物输出** → 始终写入 `{product_path}/`
4. **完成/切换** → active.json 条目移入 `.index.json`
5. **暂停** → stage=paused，paused_at=当前skill/步骤名
6. **恢复** → 读 active.json，从 paused_at 处继续

## 完成声明

```text
[候选完成] agent_proposed_status: done
证据：[build 输出] [test 输出]
剩余风险：[已知的未验证项]
请确认是否接受。
```

**禁止**：跳过用户确认直接宣布完成。

## 防作弊红线

- 禁止为通过测试而修改测试
- 禁止跳过验证声称"应该没问题"
- 禁止用"部分验证"代替"完整验证"

---

## 偏差检测

| 类型 | 严重度 |
|------|--------|
| 功能偏差（实现了未要求的功能） | medium |
| 功能遗漏（遗漏了明确要求的功能） | high |
| 范围蔓延（改动超出预期） | medium |
| 技术偏差（用了不想要的技术方案） | medium |
| 约束违反（违反硬限制） | high |

检测节点：执行前（理解一致性）、执行中（"顺便改"检查）、提交前（实际改动 vs 要求）。

---

## R1-R6 根因框架

| 根因 | 含义 | 动作 |
|------|------|------|
| R1 规范缺失 | 没有对应约定 | 补充规则 |
| R2 规范冗余 | 规则太多矛盾 | 精简 |
| R3 规范过时 | 工具变了规则没变 | 更新 |
| R4 Review 漏洞 | 检查项不完整 | 补清单 |
| R5 代码 bug | 逻辑错误 | 修代码，不动规范 |
| R6 外部因素 | 第三方变更 | 记录 |

**铁律**：R5/R6 不触发规范进化；R1-R4 才是补规则的合法依据。
