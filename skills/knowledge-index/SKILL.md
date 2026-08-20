---
name: knowledge-index
description: "该技能用于导航 knowledge、memory 和 learnings，判断场景应读取的知识文档。触发：知识库、经验、文档在哪、知识沉淀、/knowledge-index。"
version: 1.1.0
---

# 知识库导航

> 用到才读，先看索引再深入。

## 布局

| 位置 | 内容 |
|------|------|
| `knowledge/rules/` | 规则细节（gates/languages/quality/tools/workflows） |
| `knowledge/engineering/` | 技术沉淀 |
| `knowledge/project/` | 项目知识 |
| `memory/` | 跨项目经验（learnings.md） |
| `~/.claude/learnings.md` | 项目经验 |

## 场景 → 文档

| 场景 | 路径 |
|------|------|
| 任务管理 | `knowledge/rules/workflows/task-management.md` |
| 五道门 | `knowledge/rules/gates/{requirement,design,code,test,release}.md` |
| 代码访问 | `knowledge/rules/code-access/{encryption,indexing,write-rules,decision-tree}.md` |
| 审查清单 | `knowledge/rules/quality/review-checklist.md` |
| 问题澄清 | `knowledge/rules/quality/question-bank.md` |
| C#/Vue/SQL | `knowledge/rules/languages/{csharp,vue,sqlserver,postgresql}.md` |
| 模型策略 | `knowledge/rules/tools/model-strategy.md` |
| 跨项目经验 | `memory/learnings.md` |

> 经验沉淀 SBA 标准见 `save-memory`；只导航，不替代正文。

## 反模式

- 不要在导航 Skill 中展开整篇规则正文。
- 不要引用未确认存在的路径或把旧路径当作当前入口。
- 不要把经验沉淀、源码同步和规则导航混为一个职责。
- 不要在没有场景匹配时随意推荐文档。

## 阶段门禁

- [ ] 场景、目标和需要的知识类型已识别。
- [ ] 推荐路径已逐一确认存在。
- [ ] 已明确哪些内容只需导航、哪些内容需要转交其他 Skill。

## 完成标准

- [ ] 用户场景已映射到正确文档路径（任务/门禁/代码访问/审查/语言/模型策略）
- [ ] 已给出路径而未展开正文（本 skill 只导航）
- [ ] 指向的文件真实存在（无死路径）；经验沉淀指引到 `save-memory`
