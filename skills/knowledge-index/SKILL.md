---
name: knowledge-index
description: >
  知识库导航:knowledge/、memory/、learnings 布局,什么场景读哪个文档。触发:知识库、经验、文档在哪、怎么沉淀经验。
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
