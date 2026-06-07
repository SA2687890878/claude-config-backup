---
name: memory-save
description: >
  保存本次会话的关键经验到持久记忆。包括：排查经验、架构决策、踩坑记录、
  最佳实践。触发词：保存经验、记录经验、memory save、保存记忆。
version: 1.0.0
---

# Memory Save（经验积累）

将会话中的关键经验保存到 `memory/` 目录，实现跨 session 的知识沉淀。

## 触发条件

- 用户说"保存经验"、"记录经验"、"memory save"
- 会话结束前主动建议保存
- 解决了复杂问题后自动建议

## 执行流程

### 第一步：提取经验

从当前会话中提取值得记录的经验：

| 类型 | 示例 |
|------|------|
| 排查经验 | 数据库连接池耗尽、EF Core 迁移失败 |
| 架构决策 | 为什么选 A 方案而不是 B |
| 踩坑记录 | 某个 API 的隐藏行为、配置陷阱 |
| 最佳实践 | 代码模式、配置模板、命名规范 |

### 第二步：检查重复

读取 `memory/MEMORY.md`，检查是否已有相同主题的经验。
- 有 → 更新现有记录
- 没有 → 创建新记录

### 第三步：写入文件

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

### 第四步：更新索引

在 `memory/MEMORY.md` 中添加一行索引：
```markdown
- [标题](文件名.md) — 一句话描述
```

## 经验分类

| type | 用途 |
|------|------|
| `feedback` | 用户给的指导、纠正、偏好 |
| `project` | 项目进行中的目标、约束、进展 |
| `reference` | 外部资源链接、文档、配置 |

## 示例

用户："把刚才排查数据库连接池的问题记录一下"

1. 提取：问题现象 → 根因 → 解决方案
2. 写入 `memory/fix-db-connection-pool.md`
3. 更新 `memory/MEMORY.md`
