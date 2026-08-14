---
name: save-memory
description: >
  经验与进度管理:保存经验/教训、保存任务进度、下次继续时恢复工作。
  触发词:保存经验、记录一下、保存进度、下次继续、上次做到哪了、继续工作。
version: 1.0.0
---

# 经验与进度管理

> 从 `verification-before-completion` 拆分而来:本 skill 只负责经验沉淀与进度恢复,
> 验证职责保留在 `verification-before-completion`。

## 路由

| 意图 | 分支 |
|------|------|
| 保存经验/教训("保存经验"、"记录一下") | → A. 保存经验 |
| 保存任务进度("保存进度"、"下次继续") | → B. 保存进度 |
| 恢复工作("上次做到哪了"、"继续工作") | → C. 恢复工作 |
| 不确定 | → A. 保存经验(默认) |

---

## A. 保存经验

从当前会话中提取值得记录的经验,保存到 `~/.claude/memory/` 目录。

**经验类型:** 排查经验、架构决策、踩坑记录、最佳实践

读取 `references/memory-save-details.md` 了解完整流程。

> 沉淀标准(SBA 三件套:Recording Threshold / verified-failure / activate)见 `knowledge-index` skill;
> 经验写入后更新 `memory/MEMORY.md` 索引。

---

## B. 保存进度

在功能开发等长流程中,保存当前进度以便下次继续。

**保存位置:** `~/.claude/memory/task-state.md`

读取 `references/progress-save-details.md` 了解完整流程。

---

## C. 恢复工作

新会话启动时,检查 `~/.claude/memory/task-state.md`。

如果存在且有未完成任务:
1. 读取 `~/.claude/memory/task-state.md`
2. 报告上次进度
3. 问用户:"要继续吗?"

用户确认后,按 task-state 的"恢复指令"跳到对应 skill 继续执行。
