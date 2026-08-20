---
name: skill-manager
description: "该技能用于查找、创建、优化和评估 Claude Code skills。触发：找 skill、创建 skill、优化 skill、评估 skill、skill 怎么写、/skill-manager。"
version: 3.0.0
---

# Skill 管理

管理 Claude Code skills 的全生命周期：查找、创建、优化、评估。

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

找到后呈现：skill 名称 + 功能简述 + 安装命令 + 详情链接（skills.sh）。

### 安装

```bash
# skills.sh 生态安装（通用）
npx skills install <owner/repo@skill-name>
# 手动安装到本环境（~/.claude/skills/<name>/SKILL.md，受 git worktree 管理）
# DSH 环境也可走插件体系：dsh plugin add <plugin>
```

### 未找到

确认没匹配 → 用通用能力直接帮忙 → 建议自建（跳转到 B. 创建）。

### 完成标准

- [ ] 搜索结果已呈现（或确认未找到）
- [ ] 用户确认是否安装
- [ ] 安装后验证 skill 可触发

---

## B. 创建

### Step 1: 判断是否该创建

**应该创建：**
- 技术不直觉显而易见、跨项目引用、模式通用、别人受益
- 同样的代码/流程被反复重写
- 需要确定性可靠性（脚本化）

**不应该创建：**
- 一次性方案
- 标准实践已有文档
- 项目特定约定（放 CLAUDE.md）

### Step 2: 规划内容

分析具体用例，识别需要的资源：
- **scripts/** — 需要确定性可靠性的可执行代码
- **references/** — 需要时加载的补充文档
- **assets/** — 输出用的模板/图标等

### Step 3: 创建目录结构

```bash
mkdir -p skills/skill-name/{references,scripts}
touch skills/skill-name/SKILL.md
```

读取 `references/skill-structure.md` 了解官方规范。

### Step 4: 编写 SKILL.md

**Frontmatter 规范：**
- `name`：skill 名称（必填）
- `description`：第三人称，包含具体触发短语（必填）
- `version`：语义化版本（可选）

**Description 格式 / 写作风格 / 精简度：** 读取 `references/skill-writing-discipline.md` 了解官方规范（Description 触发短语、祈使句风格、1,500-2,000 词精简度与 no-op 测试）。

### Step 5: 验证

1. `/skill-name` 能触发
2. 自然语言描述意图能自动发现
3. `allowed-tools` 覆盖所需工具
4. references/ 中的文件都被 SKILL.md 引用
5. 无重复信息（SKILL.md 和 references/ 不重复）

### 完成标准

- [ ] SKILL.md 有有效的 YAML frontmatter（name + description）
- [ ] description 使用第三人称，包含具体触发短语
- [ ] 正文使用祈使句，1,500-2,000 词
- [ ] 详细内容在 references/ 中
- [ ] 所有引用的文件存在
- [ ] `/skill-name` 能触发

---

## C. 优化

### Step 1: 评估现状

读取现有 skill → 按以下维度检查：

| 维度 | 检查项 |
|------|--------|
| **触发** | description 是否包含用户实际会说的短语？ |
| **精简** | SKILL.md 是否超过 3,000 词？是否有内容该推到 references/？ |
| **风格** | 是否使用祈使句？是否有第二人称？ |
| **完成标准** | 每个阶段是否有明确的完成标准？ |
| **反模式** | 是否告诉 agent 不要做什么？ |
| **引用** | references/ 文件是否都被引用？是否有未引用的文件？ |

### Step 2: 优化 Description

描述是触发的关键信号。

**优化流程：**
1. 列出用户实际会说的短语（中英文）
2. 去掉噪音词（"的"、"了"、"一下"）
3. 加遗漏的触发短语
4. 确保第三人称格式

### Step 3: 优化正文

**No-op 测试：** 每句话过一遍——删掉它，agent 行为会变吗？
- 变了 → 保留
- 没变 → 这是 no-op，删掉

**Completion criteria：** 每个阶段加完成标准，防止 agent 提前收工。

**Anti-patterns：** 每个阶段加"不要做什么"。

### Step 4: 自动优化

运行 `scripts/improve_description.py` 自动优化描述触发准确率。

### Step 5: 迭代

修改 → 测试多组意图 → 确认无误触发 → 重复。

### 完成标准

- [ ] 评估维度已逐项检查
- [ ] description 已优化（触发短语 + 第三人称）
- [ ] 正文已优化（no-op 测试 + completion criteria + anti-patterns）
- [ ] 优化后验证通过

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

### 完成标准

- [ ] eval 测试已运行；若依赖 `claude -p` 或外部模型不可用，已记录为未执行而非伪造结果
- [ ] 评分报告已生成，或已明确记录缺失输入/依赖
- [ ] 改进点已识别并与具体测试失败关联
- [ ] 至少完成一轮修改后回归；无回归时保留原描述并说明原因

### 评估反模式

- 不要在没有测试 prompt、eval 输入或模型依赖时声称 benchmark 已通过。
- 不要把 `--help` 或语法编译结果当作触发效果评估。
- 不要只优化单个正向触发词而忽略 false trigger。
- 不要为了达到词数目标机械扩写正文。

---

## 参考文件

### Skill 结构与编写
- **`references/skill-structure.md`** — 官方目录结构和 SKILL.md 格式规范
- **`references/skill-writing-discipline.md`** — Skill 编写纪律：description 规范、写作风格、completion criteria、no-op test

### 评估工具
- **`references-eval/grader-prompt.md`** — 评分标准
- **`references-eval/comparator-prompt.md`** — 盲比模板
- **`references-eval/analyzer-prompt.md`** — 改进分析模板
- **`references-eval/schemas.md`** — eval 数据结构的 JSON Schema 定义（grader/comparator 输出的数据结构约束）

### 脚本
- **`scripts/`** — 自动化工具（eval、优化、打包）
