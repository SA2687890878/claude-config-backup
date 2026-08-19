# AGENTS.md

> **规则主体统一在 `CLAUDE.md` 维护，本文件是转发入口，不重复存储。**
>
> `AGENTS.md` 是 Codex CLI 的全局指令入口，但 Codex CLI 也能通过 `Read` 工具读取任意文件。

## Codex CLI 指南

Codex CLI 启动时，请先读取 `~/.claude/CLAUDE.md` 获取完整规则。
本文件只放 Codex 特有的配置差异。

## DSH vs Codex 差异速查

| 项目 | DSH (CLAUDE.md) | Codex CLI |
|------|------------------|-----------|
| 配置入口 | `~/.claude/CLAUDE.md` | `~/.codex/AGENTS.md` + `config.toml` |
| 模型配置 | `settings.json` | `~/.codex/config.toml` |
| 规则主体 | `~/.claude/CLAUDE.md` + `rules/` | 从 `CLAUDE.md` 直接 `Read` 读取 |
| Skills | `~/.claude/skills/` | Skills 系统（本目录结构与 DSH 不同） |
| Hooks | `~/.claude/hooks/`（settings.json 注册） | 不适用 |
| 任务栈 | `~/.claude/tasks/active.json` + `.index.json` | 不适用（可用 memory 工具） |
| 模型 | mimo-v2.5（DSH settings.json） | gpt-5.4（config.toml） |
| 工具 | DSH 原生 sandbox + MCP | Codex 原生 sandbox |

## 使用 Codex CLI 时的注意

1. Codex CLI 没有 hooks 系统，`context-injector`/`skill-router` 等自动注入不生效
2. 首次使用需手动运行：`Read ~/.claude/CLAUDE.md` 获取全局规则
3. Codex CLI 的 skills 系统路径为 `~/.codex/skills/`，与 DSH 的 `~/.claude/skills/` 不共享
4. 任务栈 `tasks/active.json` 是纯文件层约定，两个 CLI 都能读写

---

> 最后更新：2026-08-15 | 本文件不维护规则正文，只维护转发入口和差异说明。