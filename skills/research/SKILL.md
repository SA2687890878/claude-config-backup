---
name: research
description: "该技能用于联网或离线深度调研、竞品分析和技术选型，并生成带来源的报告。触发：联网调研、深度调研、竞品分析、技术选型、research、/research。"
version: 3.0.0
updated: 2026-06-08
risk: medium
author: hoolulu
repository: https://github.com/hoolulu/deep-research
---

# 🔍 深度调研报告（Deep Research）

## 触发与用法

```bash
/research {主题}                    # 标准模式（推荐）
/research {主题} --mode quick       # 快速模式
/research {主题} --mode deep        # 深度模式
/research 竞品分析                   # 竞品调研
/research 技术选型                   # 技术对比
```

## 三档模式

| 模式 | 时间 | 成本 | 适用场景 |
|------|------|------|---------|
| `quick` | 8-12 分钟 | < 0.2 元 | 简单调研 |
| `standard` | 10-15 分钟 | < 0.4 元 | 日常调研（推荐） |
| `deep` | 20-30 分钟 | < 0.7 元 | 深度分析 |

## 支持语言

19 种语言：中文、英文、日文、韩文、法文、德文、西班牙文...

## 数据源

- **在线模式**：SearXNG + 优质源搜索 + Scrapling 抓取
- **离线模式**：本地 PDF/DOCX/TXT/MD 文件

## 输出内容

- 市场规模分析、竞争格局对比、技术栈评估、趋势预测
- 15-25 张数据表、80-120 段分析
- 最终报告保存到 `reports/` 目录

---

## 主流程（主 agent 调度）

```
Setup → 语言检测 → 离线模式判定 → 模式解析
  ↓
Task 1: 分析主题 + 生成大纲
  ↓
Task 2: 数据收集 + 结构化数据池
  ↓
Task 3: 并行派发章节撰写
  ↓
Task 4: 验证 + 装配 + QA
  ↓
输出最终报告
```

### Step 0: 语言检测

- 清洗主题（去掉框架包装文本）
- 检测语言（ISO 639-1 代码）
- 写入 `{TMPDIR}/language.txt`
- **所有输出必须使用检测到的语言**

### Step 0.5: 离线模式判定

- 提到本地文件 + 未说联网 → 离线模式
- 提到本地文件 + 说"联网补充" → 正常流程
- 未提本地文件 → 正常流程

### Task 1: 分析主题 + 生成大纲

- **prompt 文件**：`prompts/task1_outline.md`
- **输出**：`{TMPDIR}/outline.json`

### Task 2: 数据收集 + 结构化数据池

- **prompt 文件**：`prompts/task2_data_collection.md`（入口：Task 2 数据收集；输出：`{TMPDIR}/data-pool.json` 与 `{TMPDIR}/task2_manifest.json`）
- **输出**：`{TMPDIR}/data-pool.json` + `{TMPDIR}/task2_manifest.json`
- **失败重试**：自动重试 1 次

### Task 3: 并行派发章节撰写

- **prompt 文件**：`prompts/task3_chapter_agent.md`（入口：Task 3 并行章节撰写；输出：`{TMPDIR}/chapters/chapter-{N}.md`）
- **输出**：`{TMPDIR}/chapters/chapter-{N}.md`
- **并行模式**：所有章节并行撰写
- **失败处理**：串行重写失败章节

### Task 4: 验证 + 装配 + QA

- **prompt 文件**：`prompts/task4_assembly.md`（入口：Task 4 装配与 QA；工具：`tools/dr_tools.py`；输出：`reports/`）
- **工具**：`{TOOLSDIR}/dr_tools.py`
- **步骤**：
  1. `validate-all-chapters` — 批量验证
  2. `assemble-report` — 装配报告
  3. `generate-confidence-section` — 可信评估
  4. `convert-citations` — 引用转换
  5. `qa-report` — 质量检查
  6. 更新报告列表页

---

## 质量标准

| # | 标准 | 说明 |
|---|------|------|
| 1 | 结论先行 | 每章以引用格式核心判断开头 |
| 2 | 来源可追溯 | 每个数字标注（机构，年份） |
| 3 | 反方视角 | 至少 1 处呈现争议或反对观点 |
| 4 | 三层深度 | 事实层 → 因果层 → 判断层 |
| 5 | 零套话 | 无"近年来""值得注意的是"等填充词 |
| 6 | 标题含判断 | "格局：高度集中"✅ \| "行业概况"❌ |
| 7 | 纯文本公式 | 不使用 LaTeX/math 公式语法 |

---

## 工具依赖

| 工具 | 用途 | 免费？ | 国内源？ |
|------|------|--------|---------|
| `websearch` | 主力搜索（CLI 内置 Exa） | ✅ | ❌ |
| `searxng` | 搜索引擎（自建） | ✅ | ✅ |
| `scrapling` | 全文抓取（MCP） | ✅ | ✅ |
| `webfetch` | 抓取回退 | ✅ | ❌ |

---

## 搜索链路（已溶 OpenCLI 梯子）

> 选源按 `references/strategy-ladder.md` 梯子：`PUBLIC_API(1.18) > COOKIE_API(2.01) ≈ UI_SELECTOR(1.92) ≫ PAGE_FETCH(8.41) / INTERCEPT(8.69)`，契约优先；`--trace` verify，有 `active.json` 时双写 `{product_path}/opencli-artifacts/`。

```
Layer 0 — CLI 内置引擎探测
  ↓
Layer 1 — 大纲建议源 + Layer 2 — 全网补充搜索（并行，梯子选源）
  ↓
Layer 3 — sources.json 优质源搜索
  ↓
质量评估 → 不达标 → Layer 4 免费源补强
  ↓
Scrapling 抓取 → 失败回退 → webfetch
```

---

## 安装配置

### 前置条件

- Python 3.10+
- Scrapling（可选，自动安装）
- Playwright（可选，JS 渲染）

### Scrapling MCP 注册

运行 `/research` 时自动检测和安装。手动注册格式：

```json
{
  "mcp": {
    "scrapling": {
      "type": "local",
      "command": ["<python-path>", "<mcp-server-script-path>"],
      "enabled": true
    }
  }
}
```

---

## 跨平台编码规范

| 规则 | 正确做法 | 错误做法 |
|------|---------|---------|
| 非 ASCII 文本不进 shell | 用 `write` 工具写文件 | Python argv 传非 ASCII ❌ |
| 文件读写用 UTF-8 | `encoding='utf-8-sig'` | 依赖 shell 编码 ❌ |
| 写文件只用 `write` 工具 | UTF-8 无 BOM | PowerShell Set-Content ❌ |
| Python stdout 设 UTF-8 | `sys.stdout.reconfigure('utf-8')` | 依赖系统默认 ❌ |

---

## 详细参考

- 质量标准完整版：`RULES.md`
- 分类标准：`TYPES.md`
- 三档模式参数：`profiles.json`
- 语言映射表：`tools/lang_config.py`（用法见 `RULES.md`）
- 编码规范详情：见上文“跨平台编码规范”表与 `RULES.md` 编码洁净条款。
- 资源入口：Task 1–4 的 prompt 文件；Task 4 调用 `tools/dr_tools.py` 输出到 `reports/`。

---

**Created by [hoolulu](https://github.com/hoolulu)** · [github.com/hoolulu/deep-research](https://github.com/hoolulu/deep-research)

## 反模式

- 不要在未确认联网/离线模式前开始收集资料。
- 不要把无来源数字或模型推测写成事实结论。
- 不要跳过 Task 2 数据池、Task 3 章节校验或 Task 4 QA。
- 不要把失败的工具调用伪装成已完成的搜索或验证。

## 阶段门禁

- [ ] Step 0/0.5 已完成，模式、语言和输出目录已确定。
- [ ] Task 1 输出 `outline.json`，且大纲可映射到报告章节。
- [ ] Task 2 输出数据池和 manifest，来源可追溯。
- [ ] Task 3 每个章节均有文件，失败章节已重写或显式标记。
- [ ] Task 4 完成验证、装配、引用转换和 QA 后才生成最终报告。

## 完成标准

- [ ] 语言已检测并按该语言输出全部内容（ISO 639-1）
- [ ] 四条主链路已完成：大纲 → 数据池 → 章节并行 → 装配 QA（Task1-4 全部跑通）
- [ ] 7 条质量标准全部满足（见上方"质量标准"表）
- [ ] 章节校验通过（validate-all-chapters），报告装配并生成可信评估
- [ ] 最终报告保存到 `reports/`，非 ASCII 内容走 UTF-8 文件（未进 shell argv）
- [ ] 计价达标：quick 8-12min / standard 10-15min / deep 20-30min 内完成对应档
