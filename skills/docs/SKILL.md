---
name: docs
description: >
  统一生成与维护项目文档，覆盖三种范围：项目级（docs/project）、功能级（docs/features）、
  问题排查级（docs/issues）。只产出文档，不写业务代码。
  当用户提到项目文档、文档中心、功能文档、需求文档、排查文档、问题记录时触发。
version: 2.0.0
---

# 文档中心（docs）

统一的文档生成 skill。一个入口，三种范围，多套模板。

## 第一步：判定 scope（路由）

根据用户意图选择范围。**只生成文档，不写业务代码。**

| scope | 触发语义 | 输出位置 | 模板 |
|-------|---------|---------|------|
| **project** | 项目文档 / 文档中心 | `docs/project/` | `references/project-templates.md` |
| **feature** | 功能文档 / 需求文档 | `docs/features/{name}/` | `references/feature-templates.md` |
| **issue**   | 排查文档 / 问题记录 | `docs/issues/{date}-{name}.md` | `references/issue-template.md` |

意图不明确时，先问一句："你要生成**项目级**、**功能级**还是**问题排查**文档？"

---

## scope = project（项目文档中心）

**核心流程：**
1. 检查现有文档：`ls docs/project/`
2. 分析代码库：项目结构、技术栈、架构模式、核心模块
3. 生成 5 份文档：README、architecture、api、database、deployment

读取 `references/project-details.md` 了解完整流程。

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

读取 `references/issue-details.md` 了解完整流程。

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
