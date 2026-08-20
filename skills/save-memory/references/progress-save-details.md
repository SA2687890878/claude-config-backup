# 保存进度详细流程

> **主入口：`~/.claude/tasks/active.json`（CLAUDE.md 任务栈）。`memory/task-state.md` 仅遗留兼容，不再作为恢复入口。**

## 写入

保存到 `~/.claude/tasks/active.json`：

```json
{
  "task_id": "task-<uuid>",
  "stage": "development|testing|paused",
  "product_path": "~/projects/<name>/",
  "paused_at": "当前步骤描述",
  "context": {
    "files": ["涉及文件列表"],
    "decisions": ["关键决策"],
    "issues": ["已知问题"]
  }
}
```

**下次恢复时**：读 `active.json` → 从 `paused_at` 处继续。`memory/task-state.md` 仅当 `active.json` 不存在时作为遗留兼容回退。

## 自动保存

在以下时机自动建议保存进度：
- 长流程的每个 Phase 完成时
- 用户说"先到这"、"下次继续"时
- 会话即将结束时