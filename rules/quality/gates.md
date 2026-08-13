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

## 防自欺机制

### Task Contract

复杂任务开始时声明：

```text
[Task Contract]
intent: 用户要什么
acceptance: 怎么算成功（可验证条件）
forbidden: 不能做什么
verify_commands: 用什么命令验证
baseline: 首次写文件前的 git 基线（HEAD/分支/脏状态）——缺基线时暂停，先记录再改
```

> baseline 依据 Aegis TaskStartSnapshot：先记真实基线再动手，防止"改着改着不知道动了什么"。

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
