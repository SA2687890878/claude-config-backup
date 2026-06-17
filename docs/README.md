# Harness Engineering: 文档中心

> 基于《Harness Engineering 建设指南（个人研发效能版）》构建的个人研发效能系统

**版本**：v2.0.0 | **最后更新**：2026-06-16

---

## 核心理念

- **Context First** — 最小上下文，最大有效信息密度
- **Artifact First** — 所有工作围绕交付物展开
- **Evidence First** — 所有结论必须有证据
- **Verification First** — 生成不等于正确，必须验证
- **Quality Gate First** — 围绕质量门建设 Harness
- **Automation First** — 能 Hook 的不要交给 AI

---

## 快速开始

**第一次使用推荐阅读顺序**：

| 步骤 | 文档 | 说明 | 阅读时间 |
|------|------|------|---------|
| 1 | [HARNESS-ENGINEERING.md](01-getting-started/HARNESS-ENGINEERING.md) | ⭐ 理念与设计（必读） | 15 分钟 |
| 2 | [QUICK-REFERENCE.md](01-getting-started/QUICK-REFERENCE.md) | ⭐ 一页纸速查表 | 5 分钟 |
| 3 | [DIRECTORY-GUIDE.md](01-getting-started/DIRECTORY-GUIDE.md) | ⭐ 目录结构指南 | 10 分钟 |

---

## 文档分类

### 01-入门文档（必读）

| 文档 | 说明 |
|------|------|
| [HARNESS-ENGINEERING.md](01-getting-started/HARNESS-ENGINEERING.md) | ⭐ Harness Engineering 理念与设计 |
| [QUICK-REFERENCE.md](01-getting-started/QUICK-REFERENCE.md) | ⭐ 一页纸速查表（命令/Skills/Hooks） |
| [DIRECTORY-GUIDE.md](01-getting-started/DIRECTORY-GUIDE.md) | ⭐ 目录结构指南（各文件夹、分类的作用） |

### 02-使用指南

| 文档 | 说明 |
|------|------|
| [USAGE.md](02-guides/USAGE.md) | 日常使用指南 + 10 个场景 + 最佳实践 |
| [SETUP.md](02-guides/SETUP.md) | 复用指南（换电脑/分享给同事） |
| [PROJECT-INIT-CHECKLIST.md](02-guides/PROJECT-INIT-CHECKLIST.md) | 项目启动清单 |

### 03-架构与设计

| 文档 | 说明 |
|------|------|
| [ARCHITECTURE.md](03-architecture/ARCHITECTURE.md) | 架构图 + 组件关系 + 数据流 |
| [HOOKS.md](03-architecture/HOOKS.md) | Hook 工作原理 + 触发时机 |
| [TOKEN-SAVINGS.md](03-architecture/TOKEN-SAVINGS.md) | Token 节省机制说明 |
| [MEMORY.md](03-architecture/MEMORY.md) | Memory 机制说明 |
| [PROJECTS.md](03-architecture/PROJECTS.md) | 项目管理说明 |
| [workflow.md](03-architecture/workflow.md) | 完整工作流说明 |
| [agent-roles.md](03-architecture/agent-roles.md) | Agent 角色定义 |
| [cross-project.md](03-architecture/cross-project.md) | 跨项目工作流 |
| [review-audit.md](03-architecture/review-audit.md) | 审查审计机制 |
| [iteration.md](03-architecture/iteration.md) | 自动迭代机制 |

### 04-参考文档

| 文档 | 说明 |
|------|------|
| [claude-code-commands.md](04-reference/claude-code-commands.md) | Claude Code 命令完整参考 |
| [SETTINGS-GUIDE.md](04-reference/SETTINGS-GUIDE.md) | settings.json 配置详解 |
| [LONG-CONVERSATION-PITFALLS.md](04-reference/LONG-CONVERSATION-PITFALLS.md) | 长对话陷阱与解决方案 |

### 05-模板

| 模板 | 说明 |
|------|------|
| [CLAUDE.md.template](templates/CLAUDE.md.template) | CLAUDE.md 模板 |
| [api-contract.md.template](templates/api-contract.md.template) | API 契约模板 |
| [database-schema.md.template](templates/database-schema.md.template) | 数据库设计模板 |
| [common-patterns.md.template](templates/common-patterns.md.template) | 常见模式模板 |
| [interface-contract.md](templates/interface-contract.md) | 接口契约模板 |

---

## 其他系统文件

```
~/.claude/
├── rules/                    # 核心规则（自动加载，104 行）
├── knowledge/                # 知识库（按需加载）
│   ├── rules/                # 按需加载的 rules
│   ├── engineering/          # 工程知识
│   ├── project/              # 项目知识
│   └── business/             # 业务知识
├── memory/                   # 记忆（会话级）
├── skills/                   # 技能（16 个）
├── agents/                   # Agent（2 个）
├── hooks/                    # 钩子（25 个）
└── projects/                 # 项目级数据
```

**详细说明**：见 [DIRECTORY-GUIDE.md](01-getting-started/DIRECTORY-GUIDE.md)

---

## 系统统计

| 组件 | 数量 | 说明 |
|------|------|------|
| **核心规则** | 4 个 | 自动加载，104 行 |
| **参考规则** | 28 个 | 按需加载 |
| **Skills** | 16 个 | 按需调用 |
| **Agents** | 2 个 | 按需调用 |
| **Hooks** | 25 个 | 自动触发 |
| **质量门禁** | 5 级 | 强制通过 |

---

## 更新记录

| 日期 | 版本 | 内容 |
|------|------|------|
| 2026-06-16 | 2.0 | 文档中心重组：分类整理、添加链接、删除重复内容 |
| 2026-06-16 | 2.0 | Rules 架构优化：核心规则+参考规则分离，节省 82% token |
| 2026-06-16 | 2.0 | Knowledge 层次化索引：总索引→分类索引→具体文件 |
| 2026-06-16 | 2.0 | 路径修正：所有引用 knowledge/engineering/rules/ 的路径更新 |
| 2026-06-16 | 2.0 | 知识沉淀：创建 3 个沉淀文件 + 2 个高价值知识文件 |
| 2026-06-11 | 1.0 | 初始版本 |

### 本次优化详情

#### 1. Rules 架构优化
- 实现核心规则 + 参考规则分离
- 核心规则精简到 104 行（节省 82% token）
- 参考规则移动到 knowledge/rules/ 目录

#### 2. Knowledge 层次化索引
- 创建各分类 INDEX.md
- 总索引只链接到分类索引
- 实现按需加载

#### 3. 文档中心重组
- 创建 5 个子目录分类（01-getting-started、02-guides、03-architecture、04-reference、templates）
- 更新 README.md 添加所有文档链接
- 删除重复内容

#### 4. 路径修正
- 修正所有引用 knowledge/engineering/rules/ 的路径
- 更新 context-injector.js 路径基准
- 确保路径一致性 100%

#### 5. 知识沉淀
- 创建 rules-architecture.md（Rules 架构设计）
- 创建 knowledge-sync-method.md（知识同步方法）
- 创建 index-design.md（索引设计原则）
- 提炼 2 个高价值知识文件（dotnet-async-constraints、dotnet8-options-pattern）

#### 优化成果

| 成果 | 量化 |
|------|------|
| Token 节省 | 82%（574 行 → 104 行） |
| 知识库结构 | 层次化索引（总索引 → 分类索引 → 具体文件） |
| 规则架构 | 核心规则 + 参考规则分离 |
| 沉淀文件 | 3 个（rules-architecture、knowledge-sync-method、index-design） |
| 路径一致性 | 100%（0 个旧路径） |
