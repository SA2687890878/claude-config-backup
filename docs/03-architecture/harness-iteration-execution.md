# Harness 迭代执行方案（已归档）

> **已归档：以 `HARNESS-OPTIMIZATION-DETAILED.md` 为准**，本文仅保留历史参考。

## 目标
把当前 harness 体系按最小风险分批收口，优先解决协议冲突、入口重叠和索引污染，确保可继续使用。

## 执行清单
### P0：协议收口
1. 统一 `tasks/active.json` 为主任务源。
2. 把 `task-state.md` 降级为遗留兼容说明。
3. 更新 `save-memory`、`task-management`、`knowledge-sync`、相关 docs 的叙述。
4. 检查所有“继续工作 / 恢复任务”入口是否只认新协议。

### P0：入口合并
1. 保留 `pipeline-executor` 作为唯一开发总入口。
2. 将 `dev-pipeline` 改为内部协议或并入 `pipeline-executor`。
3. 将 `dev-workflow` 收缩为开发阶段执行器，不再承担一级路由竞争。
4. 检查 `skills/INDEX.md` 中开发相关入口是否需要降级。

### P1：索引瘦身
1. 收紧 `skills/INDEX.md`，只保留触发词和一句话说明。
2. 收紧 `knowledge/MEMORY.md`，只保留分类导航。
3. 收紧 `knowledge/rules/INDEX.md`，只保留路径映射。
4. 把统计、教程、迁移历史移到 `docs/`。

### P1：旧口径清理
1. 把旧 hooks、旧 task-state、旧 memory 叙述统一改成兼容说明。
2. 把自动加载 / 按需加载的唯一真源口径对齐。
3. 检查 docs 与 knowledge 中是否存在互相打架的说明。

### P2：外围能力分层
1. 将 `brooks-*`、`opencli-*`、`smart-search`、`research` 统一视为侧挂能力层。
2. 避免它们与主流程 skill 平铺竞争。
3. 只在对应场景触发，不进入日常主链路。

## 文件级建议
### 重点修改
- `~/.claude/CLAUDE.md`
- `~/.claude/skills/INDEX.md`
- `~/.claude/skills/dev-pipeline/SKILL.md`
- `~/.claude/skills/pipeline-executor/SKILL.md`
- `~/.claude/skills/dev-workflow/SKILL.md`
- `~/.claude/skills/save-memory/SKILL.md`
- `~/.claude/knowledge/MEMORY.md`
- `~/.claude/knowledge/rules/INDEX.md`
- `~/.claude/knowledge/rules/workflows/task-management.md`
- `~/.claude/knowledge/rules/workflows/knowledge-sync.md`

### 说明性更新
- `~/.claude/docs/README.md`
- `~/.claude/docs/INDEX.md`
- `~/.claude/docs/03-architecture/ARCHITECTURE.md`
- `~/.claude/docs/03-architecture/MEMORY.md`
- `~/.claude/docs/03-architecture/PROJECTS.md`
- `~/.claude/docs/03-architecture/HOOKS.md`

## 验收标准
1. 新会话中任务恢复不再读旧协议作为主路径。
2. 开发类意图只有一个一级总入口。
3. 索引文件只保留导航信息。
4. 旧说明不再和新协议并列出现。
5. 体系说明更短，路由更稳定。

## 建议执行顺序
1. 先改协议与入口。
2. 再改索引。
3. 最后清理说明文档。

## 结论
这不是重写系统，而是收口系统。先把解释权统一，后面的自动化和 token 优化才会稳定生效。