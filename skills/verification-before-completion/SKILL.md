---
name: verification-before-completion
description: >
  This skill should be used when the user asks to "验证", "确认完成", "检查一下",
  "测试一下", "能提交了吗", "保存进度", "保存经验", "verify", "save progress",
  or mentions /verification-before-completion.
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

读取 `references/verification-details.md` 了解常见验证要求和红旗信号。

---

# 进度保存与恢复

## 路由

| 意图 | 分支 |
|------|------|
| 保存经验/教训（"保存经验"、"记录一下"） | → A. 保存经验 |
| 保存任务进度（"保存进度"、"下次继续"） | → B. 保存进度 |
| 恢复工作（"上次做到哪了"、"继续工作"） | → C. 恢复工作 |
| 不确定 | → A. 保存经验（默认） |

---

## A. 保存经验

从当前会话中提取值得记录的经验，保存到 `memory/` 目录。

**经验类型：** 排查经验、架构决策、踩坑记录、最佳实践

读取 `references/memory-save-details.md` 了解完整流程。

---

## B. 保存进度

在功能开发等长流程中，保存当前进度以便下次继续。

**保存位置：** `memory/task-state.md`

读取 `references/progress-save-details.md` 了解完整流程。

---

## C. 恢复工作

新会话启动时，检查 `memory/task-state.md`。

如果存在且有未完成任务：
1. 读取 `memory/task-state.md`
2. 报告上次进度
3. 问用户："要继续吗？"

用户确认后，跳转到对应的 command/skill 继续执行。
