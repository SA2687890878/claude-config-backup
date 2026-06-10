---
name: skill-manager
description: >
  Skill 管理 — 路由到"查找 skill"、"创建 skill"、"优化 skill"、"评估 skill"四条分支。
  当用户说 /skill-manager、找 skill、创建 skill、写 skill、优化 skill、
  评估 skill、benchmark、eval、find a skill、skill 怎么写时触发。
version: 2.0.0
---

# Skill 管理

## 路由

| 意图 | 分支 |
|------|------|
| 查找/安装 skill（"找 skill"、"有没有"、"find"） | → A. 查找 |
| 创建新 skill（"写 skill"、"创建 skill"、"新建"） | → B. 创建 |
| 优化已有 skill（"优化"、"改进"、"描述优化"） | → C. 优化 |
| 评估 skill 质量（"评估"、"benchmark"、"eval"、"测试 skill"） | → D. 评估 |
| 不确定 | → 问用户 |

---

## A. 查找

### 搜索

```bash
npx skills find [query]
```

### 呈现

找到后：skill 名称和功能 + 安装命令 + 详情链接（skills.sh）。

### 安装

```bash
bash /path/to/skill/scripts/install-skill.sh <owner/repo@skill-name>
```

### 未找到

确认没匹配 → 用通用能力直接帮忙 → 建议自建。

---

## B. 创建

### 判断是否该创建

- ✅ 技术不直觉显而易见、跨项目引用、模式通用、别人受益
- ❌ 一次性方案、标准实践已有文档、项目特定约定放 CLAUDE.md

### 目录结构

读取 `references/skill-structure.md` 了解官方规范。

### Description 最佳实践

- 包含中英文触发词
- 包含 `/command-name` 形式
- 包含自然语言触发短语
- 简洁但完整——用于语义匹配

### 验证

1. `/skill-name` 能触发
2. 自然语言描述意图能自动发现
3. `allowed-tools` 覆盖所需工具

---

## C. 优化

### 评估

读取现有 skill → 识别问题（描述不精确？触发不准确？内容冗余？）

### 优化描述

描述是触发的关键信号：关键词密度（用户实际说什么？）→ 去掉噪音词 → 加遗漏触发短语。

### 迭代

修改 → 测试多组意图 → 确认无误触发 → 重复。

### 自动优化

运行 `scripts/improve_description.py` 自动优化描述触发准确率。

---

## D. 评估

用 eval/benchmark 工具链量化 skill 质量。

### 流程

1. 设计测试 prompt 组
2. 运行 `scripts/run_eval.py` 对比 with_skill vs without_skill
3. 用 `references-eval/grader-prompt.md` 评分
4. 用 `references-eval/comparator-prompt.md` 盲比
5. 用 `references-eval/analyzer-prompt.md` 分析改进点
6. 迭代优化

### 脚本

| 脚本 | 用途 |
|------|------|
| `scripts/run_eval.py` | 运行 eval 测试 |
| `scripts/run_loop.py` | 循环 eval 直到满意 |
| `scripts/aggregate_benchmark.py` | 聚合 benchmark 结果 |
| `scripts/generate_report.py` | 生成报告 |
| `scripts/improve_description.py` | 优化描述 |
| `scripts/quick_validate.py` | 快速验证 |
| `scripts/package_skill.py` | 打包 skill |
