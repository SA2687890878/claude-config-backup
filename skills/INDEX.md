# Skills 索引

> 所有已注册的 Skills，按工作流阶段分组。
>
> **核心原则：用户说意图，agent 自动决定策略。**

## Skills 列表

### 📋 需求阶段

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `/requirements` | 需求分析、需求澄清、头脑风暴 | 需求探索与质询 |
| `/research` | 联网调研、竞品分析、技术选型 | [联网重型] 深度调研（SearXNG 多agent，需联网） |

### 🏗️ 设计阶段

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `/design` | 架构设计、功能设计、技术方案、怎么实现 | 技术方案产出（衔接需求→评审→开发） |
| `/arch-review` | 架构审查、方案评审 | 架构设计审查 |
| `/sql-best-practices` | 数据库、表、字段、迁移 | SQL 最佳实践 |

### 🔭 探索与分析阶段

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `/code-radar` | 代码定位、找代码、调用链、架构理解 | 代码雷达：三级搜索漏斗，最少调用定位代码 |
| `/deep-analysis` | 深度分析、方案对比、风险评估 | 全领域深度分析：对比矩阵 + 结构化报告 |

### 💻 开发阶段

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `/pipeline-executor` | ★唯一总入口★ 开发XX、一键开发、全流程、帮我开发、编排、pipeline | **全链路编排调度**：三种模式(auto/review/manual)，说一次"开发XX"自动跑到底 |
| `/test` | 测试、跑测试、生成测试 | 自动判断生成还是执行 |
| `/commit` | 提交、commit、push | Git 提交与工作空间管理 |
| `/sync` | 同步、刷新索引、同步经验 | 自动判断同步内容 |

> 内部执行层（不直接对外）：`/dev-pipeline`（五阶段内部逻辑，由 pipeline-executor 调度）· `/dev-workflow`（development 阶段执行器：写计划/执行计划/并行派发，仅 pipeline 内部调用）

### 🔍 审查阶段

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `/review` | 审查、review、找 bug、审计 | 唯一通用入口：自动按规模分级（0-50单/50-200×1对抗/>200×2对抗+四维度） |

> 已内化：`parallel-review` 多维度并行已并入 `review`；Brooks 精华已溶进 `review --brooks`（R1-R6快照）

### 🚀 发布阶段

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `/verification-before-completion` | 验证、完成前检查 | 完成前验证 |

### 🔧 运维阶段

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `/systematic-debugging` | 调试、排查、定位、bug | 系统化调试 |
| `/perf-tune` | 性能、调优、优化 | 性能诊断与优化 |
| `/docs` | 文档、doc、说明 | 项目文档生成 |

### 🧭 角色与知识管理

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `/harness-agents` | 角色、builder、operator、分工 | 双角色协作模型（开发 vs 运维诊断） |
| `/harness-rules` | 规则、禁令、质量门、红线 | 全局规则第一层 |
| `/harness-audit` | harness 体检、体系审计、技能库体检 | Harness 体系 7 维度审计 |
| `/knowledge-index` | 知识库、经验、memory、learnings | 知识库导航 |
| `/save-memory` | 保存经验、记录一下、保存进度 | 经验与进度管理 |
| `/skill-manager` | 技能管理、skills、找 skill | 技能注册与管理 |

### 🌐 外部工具

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `/smart-search` | 搜索路由、opencli 搜索 | 搜索路由器（research 前置，不含调研） |
| `/github-star-organizer` | 整理收藏、star 归类、收藏乱 | GitHub 收藏仓库自动归类到 Starred Lists |

### 📦 已溶：OpenCLI 精华 → `research`/`smart-search`

> 策略梯子+双层记忆+verify+限频已溶进 `research/references/strategy-ladder.md` + `smart-search` 台账共享；`opencli-usage` 保留为 `research` 内部地图，原4子能力已归档 `archive/`

### 📚 已溶：Brooks 精华 → `review`/`arch-review`/`harness-audit`

> R1-R6/T1-T6+Iron Law+Pain×Spread+HealthScore 已溶进 `review/references/brooks-essence.md`，`>200PR` 可选 `--brooks` 快照；`harness-audit` 第8维健康分；原6+`_shared` 已归档 `archive/`

---

## Skills 统计

- **总计**：28 个（39→28，11归档`archive/`）
- 需求阶段：2 | 设计阶段：3 | 探索与分析：2 | 开发阶段：6
- 审查阶段：1 | 发布阶段：1 | 运维阶段：3
- 角色与知识管理：6 | 外部工具：6（`smart-search`+`opencli-usage`）

## Quality Gates 对应

| Gate | 触发的 Skills |
|------|--------------|
| **Requirement Gate** | `/requirements`, `/research` |
| **Design Gate** | `/design`, `/arch-review`, `/sql-best-practices`, `/deep-analysis` |
| **Code Gate** | `/review`, `/parallel-review` |
| **Test Gate** | `/test` |
| **Release Gate** | `/review`, `/parallel-review`, `/verification-before-completion` |

> 补充：`visualize`（交互式可视化卡片）为 DSH 内置 skill，随工具可用。
>
> **编排入口：** `/pipeline-executor` 提供三种编排模式（auto/review/manual），自动串联需求→设计→开发→测试→提交，中间可打断审查。
