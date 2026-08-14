# Skills 索引

> 所有已注册的 Skills，按工作流阶段分组。
>
> **核心原则：用户说意图，agent 自动决定策略。**

## Skills 列表

### 📋 需求阶段

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `/requirements` | 需求分析、需求澄清、头脑风暴 | 需求探索与质询 |
| `/research` | 调研、竞品分析、技术选型 | 深度调研报告 |

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
| `/dev-pipeline` | 新功能、开发全流程、一键开发 | 需求→设计→开发→测试→验证 全链路编排 |
| `/dev-workflow` | 写计划、执行计划、并行派发 | 写计划→执行→验证→提交 |
| `/commit` | 提交、commit、push | Git 提交与工作空间管理 |
| `/sync` | 同步、刷新索引、同步经验 | 自动判断同步内容 |
| `/test` | 测试、跑测试、生成测试 | 自动判断生成还是执行 |

### 🔍 审查阶段

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `/review` | 审查、review、找 bug、审计 | 自动选择审查策略（双轴审查） |
| `/parallel-review` | 并行审查、多维度审查、大改动审查 | 四路子代理并行审查，适用 >100 行变更 |

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
| `/smart-search` | 搜索、查询、查找、研究 | 基于 opencli 的智能搜索路由器 |
| `/opencli-usage` | opencli | OpenCLI 顶层使用地图 |
| `/opencli-browser` | 浏览器操作、网页操作 | 驱动真实 Chrome 窗口 |
| `/opencli-browser-sitemap` | sitemap、站点地图 | 站点地图导航 |
| `/opencli-adapter-author` | adapter、适配器 | 编写新站点 OpenCLI 适配器 |
| `/opencli-autofix` | opencli 报错、修复 | 自动修复失效适配器 |

---

## Skills 统计

- **总计**：30 个
- 需求阶段：2 | 设计阶段：3 | 探索与分析：2 | 开发阶段：5
- 审查阶段：2 | 发布阶段：1 | 运维阶段：3
- 角色与知识管理：6 | 外部工具：6

## Quality Gates 对应

| Gate | 触发的 Skills |
|------|--------------|
| **Requirement Gate** | `/requirements`, `/research` |
| **Design Gate** | `/design`, `/arch-review`, `/sql-best-practices`, `/deep-analysis` |
| **Code Gate** | `/review`, `/parallel-review` |
| **Test Gate** | `/test` |
| **Release Gate** | `/review`, `/parallel-review`, `/verification-before-completion` |

> 补充：`visualize`（交互式可视化卡片）为 DSH 内置 skill，随工具可用。
