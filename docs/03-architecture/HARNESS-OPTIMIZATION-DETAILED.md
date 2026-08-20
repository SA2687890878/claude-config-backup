# Harness 优化详细方案

> 北极星：高质量完成工作 · 节省 token · 覆盖日常全链路 · 流程自动化早下班
> 原则：按需加载 · 渐进式披露 · 索引导航 · 用词精准 · 不罗嗦
> 版本：v2.0 | 分支：harness_v2 | 状态：已完成（2026-08-20）

---

## 1. 目标

| 目标 | 验收 |
|------|------|
| 高质量可靠 | 五阶段 Gate 不可跳过，证据为准 |
| 节省 token | 冷启动 <1500 token，索引只导航 |
| 全链路覆盖 | 需求沟通→讨论→架构→功能设计→开发→测试→排障 闭环 |
| 自动化早下班 | `开发XX` 一句跑到底，阶段自动串联 |
| 按需加载 | 规则/skill/references 触发时再读 |

---

## 2. 现状诊断（带证据）

| 问题 | 证据 | 影响 |
|------|------|------|
| **三入口并存** | `dev-pipeline 53行` / `pipeline-executor 52行` / `dev-workflow 109行`，触发词重叠 `一键开发/pipeline` | 用户说"开发XX"路由不稳定 |
| **双协议并存** | `tasks/active.json 479B` 为主，但 `task-state.md` 仍在多处当主路径 | 任务恢复抢解释权 |
| **索引污染** | `docs/` 6个文件 >300行（`HARNESS-ENGINEERING 609`/`DIRECTORY-GUIDE 522`） | 索引承载教程，违背渐进披露 |
| **旧口径残留** | `ARCHITECTURE.md` 仍画 `/explore→/build→/operate` 老命令图，`CLAUDE.md` 未明确唯一入口 | 心智模型混乱 |

已达标：`CLAUDE.md 77行` / `rules 6个` / `knowledge/MEMORY.md 11行`（索引已瘦）

---

## 3. 目标架构

### 3.1 入口分层

| 层 | 成员 | 说明 |
|----|------|------|
| **一级对外** | `requirements` / `design` / `pipeline-executor` / `review` / `test` / `systematic-debugging` / `verification-before-completion` | 用户可直接触发 |
| **内部执行层** | `dev-pipeline`→并入 pipeline 内部协议 / `dev-workflow`→收缩为 development 阶段执行器 | 不再竞争一级路由 |
| **侧挂能力层** | `research`/`docs`/`brooks-*`/`opencli-*`/`smart-search`/`perf-tune`/`sql-best-practices` | 独立触发，不进主链路 |

### 3.2 协议单轨

```
主协议：tasks/active.json（唯一真源，stage 流转）
历史：  tasks/.index.json
兼容：  task-state.md 仅遗留说明，不再作为恢复入口
```

### 3.3 索引纯度

索引只做三件事：有哪些资源 / 什么时候读 / 去哪读
不承载：统计 / 迁移历史 / 长篇说明 / 教程

长内容下沉：`docs/`→`knowledge/`→`references/`

### 3.4 流程闭环

```
用户："开发XX"
  → pipeline-executor（唯一总入口，review 模式默认）
    → requirements → Gate（模糊必澄清，不可被 auto 绕过）
    → design → Gate
    → dev-workflow（内部执行层）→ Gate(build==0)
    → test → Gate(test==0)
    → verification-before-completion → commit → sync/save-memory
  每阶段：存档产物 → 推进 active.json → 等确认/自动推进
```

---

## 4. 详细施工清单

### P0-1 协议收口

| # | 操作 | 文件 | 改动 |
|---|------|------|------|
| 1 | 明确唯一真源 | `CLAUDE.md` §任务追踪 | `active.json` 为唯一主协议，`task-state.md` 改为"遗留兼容" |
| 2 | 降级旧协议 | `knowledge/rules/workflows/task-management.md` | 全文"主恢复入口"改为"兼容层" |
| 3 | 同步记忆协议 | `skills/save-memory/SKILL.md` | 恢复/继续工作只认 `active.json` |
| 4 | 同步知识协议 | `knowledge/rules/workflows/knowledge-sync.md` | 同上 |
| 5 | 验证 | 新会话 `继续工作` 不读旧协议 |  |

### P0-2 入口收敛

| # | 操作 | 文件 | 改动 |
|---|------|------|------|
| 1 | 定唯一总入口 | `CLAUDE.md` §任务追踪 | `说"开发XX"→ /pipeline-executor` 单一入口声明 |
| 2 | dev-pipeline 内化 | `skills/dev-pipeline/SKILL.md` | 头部加 `> 内部协议：由 pipeline-executor 调度，不直接对外`；description 去掉 `一键开发/pipeline` 一级触发词，改为 `内部五阶段协议` |
| 3 | dev-workflow 收缩 | `skills/dev-workflow/SKILL.md` | 头部加 `> 内部执行层：development 阶段专用，由 pipeline-executor 调用`；description 保留 `写计划/执行计划/并行派发`，去掉与 pipeline 竞争的泛触发词 |
| 4 | pipeline-executor 强化 | `skills/pipeline-executor/SKILL.md` | 明确"唯一对外总入口"定位；补充 `auto 模式 Gate 不可跳过` 约束；决策表默认 review |
| 5 | 索引重分组 | `skills/INDEX.md` | 开发阶段分组：`pipeline-executor` 标 `★唯一总入口`，`dev-pipeline/dev-workflow` 移入"内部执行层"子分组 |

### P1-1 索引瘦身

| # | 操作 | 文件 | 改动 |
|---|------|------|------|
| 1 | 保留（已达标） | `knowledge/MEMORY.md` 11行 | 不动 |
| 2 | 保留（已达标） | `knowledge/rules/INDEX.md` | 不动，已是路径映射 |
| 3 | 精简技能索引 | `skills/INDEX.md` | 每行只留 `触发词|一句话`，删除统计段落中的重复说明 |
| 4 | 归档旧迭代文档 | `docs/03-architecture/harness-iteration-*.md` | 标注 `已归档→以本文档为准` 或移入 `docs/archive/` |

### P1-2 旧口径清理

| # | 操作 | 文件 | 改动 |
|---|------|------|------|
| 1 | 架构图更新 | `docs/03-architecture/ARCHITECTURE.md` | 整体架构图：`Commands /explore/build/operate` 改为 `pipeline-executor` 单入口；组件关系图同步 |
| 2 | 目录指南 | `docs/01-getting-started/DIRECTORY-GUIDE.md` | 技能/工作流描述对齐新分层 |
| 3 | Hooks 文档 | `docs/03-architecture/HOOKS.md` | 旧 hooks 主职责表述改为兼容说明 |
| 4 | 全局搜索 | `docs/**/*.md` + `knowledge/**/*.md` | 搜索 `task-state.md.*主` 残留，统一改为兼容 |

### P2 侧挂分层（说明性）

- `brooks-*`/`opencli-*`/`smart-search`/`research` 统一为侧挂能力层，`skills/INDEX.md` 单独分组"外部工具"，不与主流程平铺竞争

---

## 5. 验收标准

| # | 标准 | 验证方法 |
|---|------|----------|
| 1 | 说"开发XX"稳定只进 `pipeline-executor` | 新会话触发词测试，`grep description` 无重叠 |
| 2 | 任务恢复只认 `active.json` | `继续工作` 场景不读旧协议 |
| 3 | `auto` 模式不可跳过 Gate | `auto` 仍需 Gate 通过才进下一阶段 |
| 4 | 索引只导航 | `skills/INDEX.md` 每技能一行触发词+一句话，无教程 |
| 5 | 旧说明不与新协议并列 | `grep task-state.*主` 0 命中 |
| 6 | 冷启动 token 下降 | `CLAUDE.md 77行 + 按需 skill` 实测 |

---

## 6. 执行顺序

```
P0-1 协议收口 → P0-2 入口收敛 → 验证 → P1-1 索引瘦身 → P1-2 旧口径清理 → 最终验收
```

先统一解释权，再收入口，再清索引，最后清文档。保留兼容，逐步退役。

---

## 7. 关联文档

- 归档：`harness-iteration-architecture.md` / `harness-iteration-execution.md` → 以本文为准
- 上游：`ARCHITECTURE.md` / `CLAUDE.md` / `skills/INDEX.md`
- 下游：`knowledge/rules/workflows/task-management.md` / `knowledge-sync.md`

> 更新记录：2026-08-20 v2.0 合并两迭代方案，精炼为可执行清单
