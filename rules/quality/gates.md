# Quality Gate 体系

> 所有工作流必须通过对应的质量门禁。门禁是强制的，不可跳过。

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

## 门禁执行规则

- 门禁是强制的，不可跳过
- 必须有实际运行的命令和输出
- 退出码是唯一的判定标准

## 工作流集成

- **explore** → Requirement Gate
- **build** → Design Gate → Code Gate → Test Gate
- **operate** → Code Gate → Test Gate

---

## 防自欺机制

> 门禁的目的是确保真实完成，不是确保 agent 声称完成。区分"候选完成"和"最终裁决"。

### Task Contract（任务契约）

复杂任务开始时，先声明契约：

```text
[Task Contract]
intent: 用户要什么（一句话）
acceptance: 怎么算成功（可验证的条件列表）
forbidden: 不能做什么（红线）
verify_commands: 用什么命令验证（具体命令）
```

**示例**：
```text
[Task Contract]
intent: 修复 OrderService 的空引用异常
acceptance: dotnet test 退出码 0 + 原始场景不再报错
forbidden: 不改公共接口签名、不改数据库 schema
verify_commands: dotnet build && dotnet test --filter OrderService
```

### 完成声明分离

声称完成时，必须区分两个状态：

| 状态 | 含义 | 谁决定 |
|------|------|-------|
| `agent_proposed_status` | agent 认为完成了（候选） | agent |
| `verdict` | 最终确认完成 | 用户或独立 verifier |

**格式**：
```text
[候选完成] agent_proposed_status: done
证据：[build 输出] [test 输出] [手动验证结果]
剩余风险：[已知的未验证项]

请确认是否接受。
```

**禁止**：agent 自己宣布 `status: done` 并跳过用户确认。

### 高风险操作门控

以下操作必须停下解释风险，等待用户确认：

| 操作 | 风险 | 要求 |
|------|------|------|
| 修改测试文件 | 可能降低测试有效性 | 解释为什么改、改了什么、是否削弱了覆盖 |
| 修改评分/验证标准 | 可能自欺 | 解释标准变更的原因和影响 |
| 修改 CI/CD 配置 | 影响整个团队 | 解释变更范围和回滚方案 |
| 修改长期 memory | 影响未来会话 | 解释写入内容和预期影响 |

### 防作弊红线

以下行为**绝对禁止**：
- 为了通过测试而修改测试（改断言、删测试、改预期值）
- 为了通过验证而修改验证器/评分器
- 把未验证的结论写入长期 memory 或最终 status
- 跳过验证步骤声称"应该没问题"
- 用"部分验证"代替"完整验证"

---

## 偏差检测（借鉴 COMPASS Skills）

> 在执行过程中实时发现偏差，避免返工。

### 偏差类型

| 类型 | 说明 | 严重度 |
|------|------|--------|
| **功能偏差** | 实现了用户未要求的功能 | medium |
| **功能遗漏** | 遗漏了用户明确要求的功能 | high |
| **范围蔓延** | 改动范围超出用户预期 | medium |
| **技术偏差** | 用了用户不想要的技术方案 | medium |
| **约束违反** | 违反了用户明确的硬限制 | high |
| **接口变更** | 改了用户未要求改的公共接口 | high |

### 检测节点

**1. 开始执行前**
- 用户要求是什么？（回溯对话）
- 我理解的是什么？（当前理解）
- 两者是否一致？
- 如果不一致 → 必须向用户确认

**2. 执行过程中**
- 发现以下信号时，暂停并检查：
  - "顺便把 XXX 也改了" — 可能是范围蔓延
  - "这个接口也需要调整" — 可能是接口变更
  - "用 XXX 方案更好" — 可能是技术偏差

**3. 提交前**
- 实际改了哪些文件？
- 这些文件是否都是用户要求改的？
- 有没有改用户没要求改的文件？
- 有没有遗漏用户要求改的文件？
- 公共接口是否保持不变？
- 数据库结构是否保持不变（除非用户确认）？

### 偏差报告格式

发现偏差时，向用户报告：

```
发现偏差：
- 预期：[用户要求的是什么]
- 实际：[我实际做的是什么]
- 严重度：[low/medium/high]
- 建议：[如何修正]

请确认是否继续。
```

### 严重度处理

- **low**：描述不够精确，不影响执行 → 继续，记录
- **medium**：可能偏离用户要求 → 向用户确认
- **high**：会导致错误交付或违反用户要求 → 必须暂停，等待用户确认
