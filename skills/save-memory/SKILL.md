---
name: save-memory
description: "该技能用于保存经验、任务进度和恢复信息，便于后续继续工作。触发：保存经验、保存进度、记录一下、下次继续、/save-memory。"
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

**保存位置:** `~/.claude/tasks/active.json`（优先） + `~/.claude/memory/task-state.md`（遗留兼容）

读取 `references/progress-save-details.md` 了解完整流程。

---

## C. 恢复工作

新会话启动时，按优先级检查：

1. **`~/.claude/tasks/active.json`**（首选）→ 非空则从上一次的 stage 恢复，产物路径从 links 字段读取
2. **`~/.claude/tasks/.index.json`** → 有未完成任务则列出最近 5 条让用户选择
3. **`~/.claude/memory/task-state.md`**（遗留兼容）→ 以上两者都空才检查

用户确认后，按 active.json 的 stage 跳到对应 skill 继续执行。

## 反模式

- 不要把一次性细节、未经验证的猜测或敏感凭据写入长期记忆。
- 不要绕过 `active.json` 直接用遗留文件作为唯一进度源。
- 不要把源码/索引批处理混入经验保存流程，应交给 `/sync`。
- 不要在没有可复用价值时制造冗余记忆条目。

## 阶段门禁

- [ ] 已判断内容属于经验、进度或恢复信息。
- [ ] 经验满足 SBA 可复用性门槛，进度包含 stage 和 product_path。
- [ ] 写入目标与既有任务源一致，未覆盖无关条目。
- [ ] 写入后已读取并核对落盘结果。

## 完成标准

- [ ] 保存经验（A）：经验已按 SBA 三件套门槛筛选（≥2/3：可重复/代价高/代码看不出），非什么都说
- [ ] 保存进度（B）：当前 stage + product_path 已写入 `~/.claude/tasks/active.json`（不是只写 task-state.md）
- [ ] 恢复工作（C）：按优先级 active.json → .index.json → task-state.md 检查，恢复后跳到对应 skill
- [ ] 经验与同步职责边界正确：会话级即时沉淀归本 skill；批式源码/索引同步交给 `/sync`（本 skill 不做索引重建）
