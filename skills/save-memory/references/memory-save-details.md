# 保存经验详细流程

## 提取经验

从当前会话中提取值得记录的经验：

| 类型 | 示例 |
|------|------|
| 排查经验 | 数据库连接池耗尽、EF Core 迁移失败 |
| 架构决策 | 为什么选 A 方案而不是 B |
| 踩坑记录 | 某个 API 的隐藏行为、配置陷阱 |
| 最佳实践 | 代码模式、配置模板、命名规范 |

## 写入

**文件命名**：`memory/{kebab-case-name}.md`

**格式**：
```markdown
---
name: {short-kebab-case-slug}
description: {one-line summary}
metadata:
  type: feedback | project | reference
---

{经验内容}

**Why:** {为什么重要}
**How to apply:** {怎么用}
```

## 更新索引

在 `memory/MEMORY.md` 中添加一行索引：
```markdown
- [标题](文件名.md) — 一句话描述
```
