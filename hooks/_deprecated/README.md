# Deprecated Hooks 归档

> 归档时间: 2026-08-20 | 原因: 已被合并至新 hooks，无需单独注册

| 归档文件 | 行数 | 已合并至 | 说明 |
|---------|------|---------|------|
| cs-guard.js | 287 | cs-checks.js | C# 三类检查已合并至 cs-checks.js（语法+质量+逻辑） |
| vue-guard.js | 87 | cs-checks.js | Vue 检查已合并至 cs-checks.js checkVue() |
| sqlite-index-update.js | 91 | index-updater.js | SQLite 增量更新已合并至 index-updater.js |
| source-sync-update.js | 134 | index-updater.js | 源码同步已合并至 index-updater.js |
| learning-recorder.js | 127 | index-updater.js | 修改记录已合并至 index-updater.js recordModification() |
| review-trigger.js | 50 | completion-reminder.js | Review 提醒由 completion-reminder 覆盖 |
| test-reminder.js | 58 | completion-reminder.js | 测试提醒由 completion-reminder 覆盖 |
| focus-window.ps1 | 534 | notify.ps1 | 窗口聚焦已整合至 notify 流程 |

如需恢复，移回 hooks/ 并在 settings.json hooks 中注册即可。