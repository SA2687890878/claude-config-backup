---
name: docs
description: "该技能用于生成需求、设计、API 和排查文档。触发：项目文档、生成文档、API 文档、排查文档、generate docs、/docs。"
version: 3.0.0
---

# 文档中心（docs）

> **产物链路**：可从 `pipeline-executor` 产物自动生成：`{product_path}/requirements.md → 需求文档` / `{product_path}/design.md → 设计文档` / `arch-review.md → 评审文档`。

统一的文档生成 skill。一个入口，三种范围，多套模板。

## 第一步：判定 scope（路由）

根据用户意图选择范围。**只生成文档，不写业务代码。**

| scope | 触发语义 | 输出位置 | 流程 + 模板 |
|-------|---------|---------|------|
| **project** | 项目文档 / 文档中心 | `docs/project/` | `references/project-details.md`（流程）+ `project-templates.md`（样例） |
| **feature** | 功能文档 / 需求文档 | `docs/features/{name}/` | `references/feature-details.md`（流程）+ `feature-templates.md`（样例） |
| **issue**   | 排查文档 / 问题记录 | `docs/issues/{date}-{name}.md` | `references/issue-details.md`（流程）+ `issue-template.md`（样例） |

> 每个 scope 都有两份参考：`*-details.md` 讲生成流程，`*-templates.md` 给文档样例，**两者都读**。

意图不明确时，先问一句："你要生成**项目级**、**功能级**还是**问题排查**文档？"

---

## scope = project（项目文档中心）

**核心流程：**
1. 检查现有文档：`ls docs/project/`
2. 分析代码库：项目结构、技术栈、架构模式、核心模块
3. 生成 5 份文档：README、architecture、api、database、deployment

读取 `references/project-details.md` 了解完整流程。收集信息时可参考 `references/requirement-questions.md` 的需求澄清问题。

---

## scope = feature（功能文档）

**核心流程：**
1. 创建目录：`docs/features/{name}/`
2. 收集信息：需求、设计、实现
3. 生成 4 份文档：requirement、analysis、design、tasks

读取 `references/feature-details.md` 了解完整流程。

---

## scope = issue（问题排查文档）

**核心流程：**
1. 收集信息：问题描述、根因分析、修复方案
2. 生成 1 份文档：排查记录

读取 `references/issue-details.md` 了解完整流程。用 `references/issue-checklist.md` 核对问题分类与排查方向是否覆盖完整。

---

## 输出格式

所有文档遵循统一格式：
```markdown
# 文档标题

## 概述
一句话描述

## 详细内容
...

## 参考
- 相关文档
- 相关代码
```

## 反模式

- 不要在 scope 未确定时生成文档。
- 不要把未读取的项目事实写成文档内容。
- 不要为了补齐模板编造 API、数据库或部署信息。
- 不要在文档任务中修改业务代码。

## 阶段门禁

- [ ] scope、受众、输出目录和文档类型已确定。
- [ ] 对应 reference 与模板已读取，事实来源已标注。
- [ ] 文档完成结构校验、链接检查和必要的术语统一。
- [ ] 输出已落盘，且业务代码无变更。

## 完成标准

- [ ] scope 已判定（project / feature / issue），不明确时已先询问
- [ ] 对应 scope 的 `*-details.md`（流程）+ `*-templates.md`（样例）**两者都已读取**
- [ ] 文档已生成到指定输出位置（docs/project/ 或 docs/features/{name}/ 或 docs/issues/）
- [ ] 只生成文档，未写任何业务代码
- [ ] 项目文档：5 份（README/architecture/api/database/deployment）齐全
