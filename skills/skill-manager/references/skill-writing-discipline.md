# Skill 编写纪律

> 基于 Claude Code 官方规范 + writing-great-skills 方法论。
> 创建或优化 skill 时查阅。

## Description 规范（官方要求）

**格式：** 第三人称，包含具体触发短语。

```yaml
# ✅ 正确
description: >
  This skill should be used when the user asks to "create X",
  "configure Y", or mentions /skill-name.

# ❌ 错误
description: 当用户说 /skill-name 时触发。
description: Use this skill when working with X.
```

**触发短语要求：**
- 包含用户实际会说的话（中英文）
- 包含 `/command-name` 形式
- 包含自然语言触发短语
- 不要泛泛的描述（"提供指导"）

**Description 优化流程：**
1. 列出用户实际会说的短语（中英文）
2. 去掉噪音词（"的"、"了"、"一下"）
3. 加遗漏的触发短语
4. 确保第三人称格式
5. 运行 `scripts/improve_description.py` 自动验证

---

## 写作风格（官方要求）

**全文使用祈使句/不定式（动词开头），不用第二人称。**

```
# ✅ 正确
读取 references/patterns.md 了解详细模式。
运行 dotnet build 验证编译。

# ❌ 错误
你应该读取 references/patterns.md。
你需要运行 dotnet build。
```

---

## Progressive Disclosure（官方要求）

```
SKILL.md（1,500-2,000 词）
  ├── 核心流程指令
  ├── 路由逻辑
  ├── 关键规则
  └── 指向 references/ 的引用

references/（按需加载，可以很长）
  ├── 详细参考材料
  ├── 审查清单
  ├── 模板
  └── subagent prompt
```

**原则：**
- SKILL.md 只放核心流程，细节推到 references/
- 不要在 SKILL.md 和 references/ 之间重复信息
- references/ 文件在 SKILL.md 中明确引用

**SKILL.md 精简度：**
- 目标：1,500-2,000 词
- 上限：3,000 词（超过就必须拆到 references/）
- 检查方法：`wc -w skills/*/SKILL.md`

---

## Completion Criteria（完成标准）

每个阶段必须有明确的完成标准：
- **可检查** — agent 能判断 done vs not-done
- **穷举** — "检查所有点"而不是"检查几个点"
- **防 premature completion** — 模糊标准 = agent 提前收工

```
# ✅ 好的完成标准
- [ ] dotnet build 退出码 == 0
- [ ] 所有测试通过（0 失败）
- [ ] 无 CRITICAL/HIGH 问题

# ❌ 坏的完成标准
- 代码质量良好
- 测试基本通过
- 没有大问题
```

---

## Anti-patterns（反模式）

每个阶段列出"不要做什么"：
- 告诉 agent 不做什么，跟告诉它做什么同样重要
- 格式：`❌ 如果你发现自己在做 X → 停下来 → 做 Y`

---

## No-op Test（空操作测试）

skill 写完后，每句话过一遍：删掉它，agent 行为会变吗？
- 变了 → 保留
- 没变 → 这是 no-op，删掉

---

## 验证清单

skill 写完或改完后，按以下顺序验证：frontmatter 与 description → references 引用 → 祈使句与词数 → progressive disclosure 去重 → 每阶段 completion criteria 与 anti-patterns → no-op 测试。记录每项结果；未通过项修复后重新验证。
