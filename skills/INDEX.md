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
| `/arch-review` | 架构审查、方案评审 | 架构设计审查 |
| `/sql-best-practices` | 数据库、表、字段、迁移 | SQL 最佳实践 |

### 💻 开发阶段

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `/dev-workflow` | 开发工作流、写代码 | 写计划→执行→验证→提交 |
| `/commit` | 提交、commit、push | Git 提交与工作空间管理 |
| `/sync` | 同步、刷新索引、同步经验 | 自动判断同步内容 |
| `/test` | 测试、跑测试、生成测试 | 自动判断生成还是执行 |

### 🔍 审查阶段

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `/review` | 审查、review、找 bug、审计 | 自动选择审查策略 |

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

### 📚 知识管理

| Skill | 触发词 | 说明 |
|-------|--------|------|
| `/skill-manager` | 技能管理、skills、找 skill | 技能注册与管理 |

---

## Skills 统计

- **总计**：14 个 Skills
- **需求阶段**：2 个
- **设计阶段**：2 个
- **开发阶段**：4 个
- **审查阶段**：1 个
- **发布阶段**：1 个
- **运维阶段**：3 个
- **知识管理**：1 个

## Quality Gates 对应

| Gate | 触发的 Skills |
|------|--------------|
| **Requirement Gate** | `/requirements`, `/research` |
| **Design Gate** | `/arch-review`, `/sql-best-practices` |
| **Code Gate** | `/review` |
| **Test Gate** | `/test` |
| **Release Gate** | `/review`, `/verification-before-completion` |
