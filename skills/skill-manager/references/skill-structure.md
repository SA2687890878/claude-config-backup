# Skill 官方目录结构

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (required)
│   │   ├── name: (required)
│   │   ├── description: (required)
│   │   └── version: (optional)
│   └── Markdown instructions (required)
└── Bundled Resources (optional)
    ├── scripts/     - 可执行脚本 (Python/Bash/etc.)
    ├── references/  - 需要时加载的补充文档
    └── assets/      - 输出用的模板/图标等
```

## SKILL.md 格式

```markdown
---
name: Skill Name
description: >
  This skill should be used when the user asks to "specific phrase 1",
  "specific phrase 2". Include exact phrases users would say that should
  trigger this skill. Be concrete and specific.
version: 1.0.0
---

# Skill 标题

核心指令和流程指导...
```

## SKILL.md vs references 的分工

- **SKILL.md**：核心流程指令、路由逻辑、关键规则
- **references/**：详细参考材料、审查清单、模板、subagent prompt

> *Keep only essential procedural instructions and workflow guidance in SKILL.md; move detailed reference material, schemas, and examples to references files.*
>
> *Avoid duplication: Information should live in either SKILL.md or references files, not both.*

## references 加载方式

SKILL.md 中用自然语言告诉 Claude 何时读取哪个 reference 文件：

```markdown
如果用户要 X：
  读取 `references/x-details.md`，按步骤执行。
```

Claude 用 Read 工具加载。大文件（>10k words）在 SKILL.md 中提供 grep 搜索模式。
