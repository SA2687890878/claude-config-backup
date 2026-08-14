---
description: 更新 research skill（从 GitHub 上游 deep-research 同步）
---

<command-instruction>
本 skill 安装在 `~/.claude/skills/research/`。`~/.claude` 整体是 git worktree（分支 `harness_v2`，remote 为 claude-config-backup）。

## 更新方式

### 方式 A — 上游 deep-research 更新（推荐）

本 skill 源自 github.com/hoolulu/deep-research。上游有新版本时：

1. `git clone https://github.com/hoolulu/deep-research $env:TEMP\deep-research`
2. 对比临时目录与 `~/.claude/skills/research/`，**手动合并**差异（本目录含 DSH/Claude 适配改动，禁止整体覆盖）
3. 完成后删除临时目录

### 方式 B — 配置备份同步

仅同步备份仓库时：`git -C ~/.claude pull`

### 方式 C — 本地未改动时的快速替换

若本目录无本地定制（与上游 hash 一致），可整体替换后重跑本 skill 的校验。
</command-instruction>

<user-request>
$ARGUMENTS
</user-request>

---
```
research skill 更新助手 · 上游 github.com/hoolulu/deep-research
```
