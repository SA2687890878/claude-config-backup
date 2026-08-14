---
name: harness-rules
description: >
  全局规则第一层:环境、项目速查、核心禁令、五道门概要,细节按需读 .claude/rules/。触发:规则、禁令、质量门、红线。
version: 2.0.0
---

# 全局规则(第一层,薄)

> 渐进式披露:本文件只放"每次都必须知道"的。任何细节 → 读对应文件,不要在这里展开。

## 环境
- 简体中文 | Windows + PowerShell | .NET 8(Web)/ .NET Framework 4.5.2(WPF)/ Vue 2
- SQL Server(老项目)| PostgreSQL(新项目)

## 核心禁令(违反即事故)
1. 禁止 `.Result` / `.Wait()`(同步阻塞)
2. 禁止直接 push 到 main/develop
3. 禁止硬编码密钥/密码/token

## 行为原则(摘要)
- 简单方法直接用,真正不确定才问;最小代码改动;先计划后执行,验证通过才算完成
- 详细:`.claude/CLAUDE.md`

## 规则优先级
项目级 `.claude/` > 全局 `rules/*.md` > CLAUDE.md

## 质量门概要(五道)
需求 → 设计 → 代码 → 测试 → 发布,每道门不可跳过。
**防自欺**:完成前必须给证据(命令输出/落盘产物),用户确认才算完成;打回 ≥2 次暂停。
详细:`.claude/rules/quality/gates.md` + `.claude/rules/quality/verification.md`

## 代码访问概要(加密项目)
先索引后 Read;加密 .cs 用 SQLite 索引 + CodeGraph;写加密文件必须 PowerShell,禁 node.exe。
详细:`.claude/rules/tools/code-access.md`

## Token 原则
能在代码中处理的数据不进上下文;跨会话知识以 memory/learnings.md 为准。
详细:`.claude/rules/tools/token-optimization.md`

---
**按需深入**(第二层,用时才读):
- 五道门细节 → `.claude/knowledge/rules/gates/*.md`
- 语言规则(C#/Vue/SQL)→ `.claude/knowledge/rules/languages/*.md`
- 审查清单 → `.claude/knowledge/rules/quality/review-checklist.md`
- 问题澄清题库 → `.claude/knowledge/rules/quality/question-bank.md`
- 加密文件修改(cherry-pick 流程、switch-case 易错点)→ `~/.claude/learnings.md`
- 知识库导航 → skill: `knowledge-index`
