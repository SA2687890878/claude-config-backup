# Harness 交付流水

> **归档**：旧版 `/explore /build /operate` 三流已下线，归档见 `docs/archive/workflow-20260611.md`（2026-06-11）。现行单轨：`pipeline-executor`。

## 现行流水

```
用户说“开发XX/帮我开发/一键开发”
  → /pipeline-executor（唯一总入口，auto/review/manual 三模式）
    → requirements → Design Gate
    → design (+arch-review) → Design Gate
    → dev-workflow (development 阶段执行) → Code Gate
    → test → Test Gate
    → verification-before-completion → Release Gate → /commit
```

## 你的 7 项日常怎么走

| 你的日常 | 实际走的 skill | 进度 |
|---------|---------------|------|
| 需求沟通/讨论 | `/requirements` (+`/research` 按需) | Requirement Gate |
| 架构/功能设计 | `/design` (+`/arch-review` 按需) | Design Gate |
| 功能开发 | `/pipeline-executor` 自动串五阶段 | Code Gate |
| 功能测试 | `/test` | Test Gate |
| 问题排查 | `/systematic-debugging` / `/perf-tune` | Code/Test Gate |

## 产物

- 需求→设计→代码→测试，每阶段产物以 `active.json` 的 `product_path` 为准（`~/.claude/tasks/active.json` 唯一真源）。
- 阶段推进：更新 `active.json stage`，完成归档到 `tasks/.index.json`。

## 关联

- 总入口：`skills/INDEX.md` 的 `/pipeline-executor ★唯一总入口`
- 架构：`03-architecture/ARCHITECTURE.md`
- 门禁：`rules/quality/gates.md` + `knowledge/rules/gates/*`
- 压缩：`RTK.md`（重输出用 RTK 代理，已按需加载）
