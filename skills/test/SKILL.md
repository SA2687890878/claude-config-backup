---
name: test
description: "该技能用于生成或执行测试，并处理单元测试、覆盖率和测试失败。触发：测试、跑测试、生成测试、写测试、测试失败、单元测试、覆盖率、/test。"
version: 2.0.0
---

# 测试管理

## 核心原则

**用户说"测试"，agent 自动判断是生成还是执行。**

## 先读任务栈

**执行测试前先确认当前任务：**

1. 读 `~/.claude/tasks/active.json`
2. 确认 active 非空且 stage >= development（如在 requirements/design，提示先开发）
3. 从 `{product_path}/` 查找关联产物
4. 更新 active.json 的 stage=testing

## 路由

| 意图 | 策略 |
|------|------|
| 生成测试（"生成测试"、"写测试"、"单元测试"） | → A. 生成测试 |
| 执行测试（"跑测试"、"执行测试"、"测试失败"） | → B. 执行测试 |
| 修复测试（"修复测试"、"测试挂了"） | → C. 修复测试 |
| 测试覆盖率（"覆盖率"、"cover"） | → D. 测试覆盖率 |
| 不确定 | → 询问用户 |

---

## A. 生成测试

**适用场景：** 用户提到具体方法/类，需要生成测试。

**核心流程：**
1. 分析目标代码
2. 读取 `references/test-patterns.md` 了解测试模式
3. 读取 `references/test-frameworks.md` 选择合适的测试框架
4. 读取 `references/code-templates.md` 生成测试骨架
5. 读取 `references/test-best-practices.md` 确保符合最佳实践
6. 运行测试验证

**输出格式：**
读取 `references/report-template.md` 获取报告格式。

---

## B. 执行测试

**适用场景：** 有测试文件存在，需要执行测试。

**核心流程：**
```bash
# .NET 项目
dotnet test --configuration Release

# 前端项目
npm test
```

**失败处理：**
读取 `references/failure-patterns.md` 了解常见失败模式和修复方法。

**输出格式：**
读取 `references/report-template.md` 获取报告格式。

**产物移交：**
测试全部通过后，更新 active.json 的 stage=testing（可提交）。

---

## C. 修复测试

**适用场景：** 测试失败，需要修复。

**核心流程：**
1. 读取 `references/failure-patterns.md` 分析失败原因
2. 修复代码或测试
3. 重新运行验证

**输出格式：**
读取 `references/report-template.md` 获取报告格式。

---

## D. 测试覆盖率

**适用场景：** 用户需要检查测试覆盖率。

**核心流程：**
1. 读取 `references/test-coverage.md` 了解覆盖率工具
2. 运行覆盖率检查
3. 分析覆盖率报告
4. 提供改进建议

**输出格式：**
```
## 测试覆盖率报告

### 覆盖率指标
- 行覆盖率：X%
- 分支覆盖率：X%
- 函数覆盖率：X%

### 未覆盖代码
- [文件:行号] 代码描述

### 改进建议
- [建议1]
- [建议2]
```

---

## 测试原则

读取 `references/test-best-practices.md` 获取详细最佳实践。

### 必须做的

1. **每个测试都要断言** — 不能只是调用方法
2. **测试要隔离** — 不依赖外部状态
3. **测试要可重复** — 每次运行结果一致
4. **测试要快速** — 单元测试 < 100ms

### 禁止做的

1. **禁止测试实现细节** — 只测试行为
2. **禁止依赖测试顺序** — 测试之间独立
3. **禁止硬编码测试数据** — 使用 fixtures
4. **禁止跳过失败测试** — 修复或删除

## 完成标准

- [ ] 路由分支已判断（生成/执行/修复/覆盖率），automatically 判断正确
- [ ] 生成测试（A）：目标代码已分析，读取 test-patterns + test-frameworks + code-templates 后生成了骨架并运行验证
- [ ] 执行测试（B）：`dotnet test` 退出码 0 有实际输出证据（非"应该通过了"）
- [ ] 修复测试（C）：failure-patterns 已分析，修复后重新运行验证通过
- [ ] 覆盖率（D）：覆盖率报告已生成（行/分支/函数覆盖率），未覆盖代码和改进建议已列出
- [ ] 每个测试有断言，测试隔离可重复，未测试实现细节；`active.json` 已更新为 stage=testing
