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
