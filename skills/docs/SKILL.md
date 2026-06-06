---
name: docs
description: >
  统一生成与维护项目文档，覆盖三种范围：项目级（docs/project）、功能级（docs/features）、
  问题排查级（docs/issues）。只产出文档，不写业务代码、不执行开发或修复。
  只要用户提到项目文档、文档中心、功能文档、需求文档、排查文档、问题记录，
  或要求初始化/生成/更新任何项目文档，都应使用本 skill——即使用户没明说"文档中心"。
  纯开发动作用 feature-development，纯修复用 bug-fix。
version: 2.0.0
---

# 文档中心（docs）

统一的文档生成 skill。一个入口，三种范围，多套模板。

> **设计说明**：原 project-docs / feature-docs / issue-docs 三个 skill 流程骨架相同
> （分析 → 套模板 → 写入 docs/ 子目录），仅 scope/模板/路径不同。按 Anthropic
> "consolidate functionality、避免 overlapping tools" 原则合并为单一 skill，
> 用 scope 路由到对应模板，从源头消除触发词冲突。

## 第一步：判定 scope（路由）

根据用户意图选择范围。**只生成文档，不写业务代码、不执行修复/开发动作**——
那些属于 `/feature-development`、`/bug-fix` 工作流，本 skill 只负责"文档产物"。

| scope | 触发语义 | 输出位置 | 模板 |
|-------|---------|---------|------|
| **project** | 项目文档 / 文档中心 / 初始化文档 | `docs/project/`（5 份） | `references/project-templates.md` |
| **feature** | 功能文档 / 需求文档 | `docs/features/{name}/`（4 份） | `references/feature-templates.md` |
| **issue**   | 排查文档 / 问题记录 | `docs/issues/{date}-{name}.md`（1 份） | `references/issue-template.md` |

意图不明确时，先问一句："你要生成**项目级**、**功能级**还是**问题排查**文档？"

---

## scope = project（项目文档中心）

### 步骤
1. 检查现有文档：`ls docs/project/` 不存在则创建目录
2. 分析代码库：`codegraph_files` 取结构，`codegraph_explore` 析核心模块
   - 项目结构（目录分布、文件数量）
   - 技术栈（从 `.csproj` 识别框架版本）
   - 架构模式（Controllers/Services/Entities 分层）
   - 核心业务模块
3. 生成 5 份文档（模板见 `references/project-templates.md`）：

   | 文档 | 路径 | 内容 |
   |------|------|------|
   | 项目概述 | `docs/project/README.md` | 简介、技术栈、目录结构、核心模块 |
   | 架构设计 | `docs/project/architecture.md` | 分层说明、依赖关系、模块职责 |
   | 技术栈 | `docs/project/tech-stack.md` | 框架版本、第三方库、工具链 |
   | 开发规范 | `docs/project/conventions.md` | 命名、代码、Git 规范 |
   | 数据库设计 | `docs/project/database.md` | 核心表结构、关系说明 |

4. 更新根目录 `README.md` 末尾的文档中心链接表格
5. 索引：`ctx_index path: "docs/project/", source: "项目文档"`

### 约束
- 基于代码库实际内容生成，不臆测
- 不修改源代码

---

## scope = feature（功能文档链）

### 步骤
1. 收集需求：功能名称（可作目录名）、功能描述、来源、优先级
2. 5 问质询（见 `references/requirement-questions.md`）：
   - Q1 谁在用？ Q2 现在怎么做？ Q3 最小可用版本？ Q4 怎么知道做对了？ Q5 有什么约束？
3. 创建目录并生成 4 份文档（模板见 `references/feature-templates.md`）：

   | 文档 | 内容 |
   |------|------|
   | `01-requirement.md` | 需求 — 使用者、功能要求、验收标准 |
   | `02-analysis.md` | 分析 — 边界、异常、数据流、API 设计 |
   | `03-design.md` | 设计 — 技术方案、代码变更、数据库变更 |
   | `04-tasks.md` | 任务清单 — 可执行的开发任务 |

4. 索引：`ctx_index path: "docs/features/{name}/", source: "功能文档-{name}"`

### 约束
- 文档具体、可执行；不写代码，只生成文档
- 若用户实际意图是"直接开发功能"而非"只要文档" → 提示改用 `/feature-development`

---

## scope = issue（问题排查记录）

> **边界**：本 scope 只生成"排查**记录文档**"。真正的排查/修复动作（定位、改代码、
> 跑测试）属于 `/bug-fix` 工作流或 `systematic-debugging` skill，不在此 skill 职责内。
> 若用户要的是"修好这个 bug"而非"记录这个问题" → 提示改用 `/bug-fix`。

### 步骤
1. 信息收集（见 `references/issue-checklist.md`）：现象、发现时间、环境、复现步骤
   - 必问：能稳定复现吗？最近改了什么？有错误日志吗？
2. 问题分类：功能缺陷 / 性能 / 数据 / 接口 / 环境
3. 根因分析：日志、`codegraph` 代码分析、数据、环境
4. 生成记录：`docs/issues/{date}-{issue-name}.md`（模板见 `references/issue-template.md`）

### 约束
- 按流程排查，不跳步；每个判断有依据
- 使用中文、输出 Markdown

---

## 通用约束（所有 scope）

- 全程中文，输出 Markdown
- 文档基于事实，不臆测
- 本 skill 不修改源代码、不执行开发/修复动作
- 完成后输出文档清单 + 下一步建议
