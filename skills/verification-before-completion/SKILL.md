---
name: verification-before-completion
description: >
  完成前验证:"验证"、"确认完成"、"能提交了吗"、"verify"。
version: 3.0.0
---

# 验证优先

## 核心铁律

**没有新鲜的验证证据，不许宣称完成。**

## 验证流程

在声称任何状态或表达满意之前：

1. **识别** — 什么命令能证明这个结论？
2. **运行** — 执行完整命令（新鲜、完整）
3. **读取** — 完整输出，检查退出码，计数失败
4. **验证** — 输出是否确认结论？
   - 否 → 陈述实际状态和证据
   - 是 → 带着证据陈述结论
5. **然后** — 才能下结论

跳过任何一步 = 说谎，不是验证。

## 完成收据

宣称完成时附证据槽（依据 Aegis 理念，补充 scope/uncovered/residual/confidence 维度）：

```text
[候选完成]
action: 跑了什么命令
result: 结果是什么
scope: 验证覆盖了什么
uncovered: 没覆盖什么（诚实列出）
residual: 剩余风险
confidence: A|B|C（对结论的信心）
```

- 缺 scope/uncovered = 只报结果不报覆盖，视为不完整
- confidence 依据：A=退出码+完整输出确认；B=部分验证+已知缺口；C=推测未运行

读取 `references/verification-details.md` 了解常见验证要求和红旗信号。

---

> 经验沉淀 / 进度保存 / 恢复工作 → 交给 `save-memory` skill("保存经验"、"保存进度"、"继续工作")。
> 本 skill 只负责"完成前验证"这一个职责。
