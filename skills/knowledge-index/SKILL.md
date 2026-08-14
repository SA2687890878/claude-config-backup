---
name: knowledge-index
description: >
  知识库导航:knowledge/、memory/、learnings 布局,什么场景读哪个文档。触发:知识库、经验、文档在哪、怎么沉淀经验。
version: 1.0.0
---

# 知识库导航

> 原则:用到才读,不预加载;先看索引再深入;发现过时条目 → 更新或删除(漂移检测)。

## 布局总览

```
~/.claude/knowledge/
├── engineering/                  # 技术文章吸收(15 篇正文 + INDEX)
├── business/                     # 业务知识(待填充)
├── project/                      # 项目知识
└── rules/                        # 规则细节
    ├── code-access/              # 加密机制、索引系统、写入规则、决策树
    ├── gates/                    # 五道门细节(requirement/design/code/test/release)
    ├── languages/                # csharp、javascript、vue、sqlserver、postgresql
    ├── quality/                  # 审查清单、问题库、hooks 标准
    ├── token-optimization/       # thinking.md、tools.md
    ├── tools/                    # 模型策略、安全
    └── workflows/                # git、任务管理、知识同步、产物管理
~/.claude/memory/                 # 跨项目经验(6 篇正文 + MEMORY.md/learnings.md 索引)
~/.claude/learnings.md            # 项目经验(pcs.webbackend 等)
```

> ⚠️ 命名注意：存在两份 learnings——`~/.claude/learnings.md`（**项目**经验）与 `~/.claude/memory/learnings.md`（**跨项目**经验）。按场景区分，不要混用；另有 Claude Code 会话布局 `~/.claude/projects/<name>/memory/`，仅历史会话使用。

## 场景 → 文档

| 场景 | 读什么 |
|------|--------|
| 加密 .cs 文件机制 | `knowledge/rules/code-access/encryption.md` |
| 索引系统设计 | `knowledge/rules/code-access/indexing.md` |
| 加密文件写入规则 | `knowledge/rules/code-access/write-rules.md` |
| 代码访问决策树 | `knowledge/rules/code-access/decision-tree.md` |
| 五道门细节 | `knowledge/rules/gates/{requirement,design,code,test,release}.md` |
| C# 约束(async、options 等) | `knowledge/rules/languages/csharp.md` + `knowledge/engineering/dotnet-async-constraints.md`、`dotnet8-options-pattern.md` |
| Vue 2 规则 | `knowledge/rules/languages/vue.md` |
| SQL Server / PostgreSQL | `knowledge/rules/languages/sqlserver.md` / `postgresql.md` |
| 模型选择策略 | `knowledge/rules/tools/model-strategy.md` |
| 安全红线 | `knowledge/rules/tools/security.md` |
| git 工作流 | `knowledge/rules/workflows/git.md` |
| 任务管理 | `knowledge/rules/workflows/task-management.md` |
| 知识同步 | `knowledge/rules/workflows/knowledge-sync.md` |
| 审查清单 | `knowledge/rules/quality/review-checklist.md` |
| 问题澄清题库 | `knowledge/rules/quality/question-bank.md` |
| 跨项目经验 | `memory/learnings.md`、`memory/harness-engineering-lessons.md` |
| 项目经验 | `~/.claude/learnings.md`(按项目) |
| 项目索引(otd.pcs.webbackend) | `knowledge/project/otd.pcs.webbackend.md`、`knowledge/project/INDEX.md` |
| 加密文件编辑实战 | `memory/encrypted-file-editing.md`、`memory/encrypted-file-git-blob-workflow.md` |
| 长会话陷阱 | `memory/long-conversation-pitfalls.md` |

## 经验沉淀标准(SBA)

- Recording Threshold:可重复 / 代价高 / 代码看不出 → 才写
- verified-failure:本次故障红转绿修好的教训,直写最近教训 owner
- activate:每条经验必须落在任务路径上改变下一步动作,答不上来不沉淀
- 漂移检测:被引用的规则/skill/代码变化时,复核 learnings 条目是否仍准确

## 知识条目三件套(升级标准)

每条新知识 = **条目 + 自测题 + 速查卡**(检索练习 > 被动阅读):

1. **条目** — 现有格式(Why + How to apply),落盘 knowledge/ 或 memory/
2. **自测题** — 3-5 道考官题(由易到难,附答案),下次用到时先自测再查条目
3. **速查卡** — 一页"5 分钟过完":一句话定义 + 3-5 条关键点 + 1-3 个真实例子 + 新手易错清单

> 依据:检索练习/测试效应 + 费曼循环(往外掏 > 往里塞)。沉淀不是存档,是让自己(和未来的 AI)能快速自测验证。

## Harness 建设文档(docs/)

```
~/.claude/docs/
├── HARNESS-ENGINEERING-PLAN.md    # 体系总体设计
├── HARNESS-ITERATION-PLAN.md      # 迭代计划(P0-P3 等)
├── HARNESS-DECISION-CHECKLIST.md  # 决策检查清单
├── REASONIX-MIGRATION.md          # 迁移评估
├── TAIYI-REFERENCE-PLAN.md        # 参考计划
├── CLAUDE-template.md             # 配置模板
├── README.md / INDEX.md           # 总览与索引
```
需要理解"为什么这么设计"、规划迭代、评估方案时阅读。

## 其他

- 双角色模型(builder/operator):见 `harness-agents` skill
- 全局规则(质量门/验证/代码访问):见 `harness-rules` skill
- 角色原文:`.claude/agents/builder-agent.md`、`operator-agent.md`

## 注意

- 本 skill 只导航,不替代文档内容;具体规则正文按需读取目标文件
- 路径以 `~/.claude/` 为准,DSH 会话中可直接读取该路径下的文件
