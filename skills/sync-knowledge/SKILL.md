---
name: sync-knowledge
description: >
  将项目经验同步为可复用知识。当用户说 /sync-knowledge、同步经验、
  同步知识、更新知识库、sync knowledge、把经验升级为知识时触发。
  从 learnings.md 提取经验，自动分类（engineering/project/business），
  用户确认后写入 knowledge/ 并标记已同步。
version: 1.0.0
---

# Memory → Knowledge 同步

## 目标

将项目级 `memory/learnings.md` 中的经验升级为可复用的工程知识（`~/.claude/knowledge/`），防止经验积压和流失。

---

## 执行流程

### Step 1: 读取并解析

1. 计算项目名称：`cwd.replace(/:/g, '-').replace(/[\/\\]/g, '-')`
2. 读取 `~/.claude/projects/<projectName>/memory/learnings.md`
3. 解析未标记"已同步"的经验条目

**如果文件不存在** → 提示用户先运行项目启动 Checklist

**实现细节** → 读取 `references/sync-details.md` 了解正则表达式和解析逻辑

---

### Step 2: 自动分类

对每条经验按关键词分类：
- **engineering** — 性能、内存、异步、缓存、测试、重构
- **project** — API、数据库、实体、导出、报表
- **business** — 订单、用户、支付、流程、状态机

**分类规则** → 读取 `references/sync-details.md` 中的分类表

---

### Step 3: 用户确认

使用 AskUserQuestion 询问用户：

**第一轮：批量确认**
```
发现 N 条未同步的经验，是否同步？
选项：全部同步 / 逐条确认 / 取消
```

**第二轮（如果选"逐条确认"）：**
```
经验：<标题>
建议分类：<category>
选项：engineering / project / business / 跳过
```

---

### Step 4: 写入 Knowledge

对每条确认同步的经验：

1. 确定目标文件：`~/.claude/knowledge/<category>/<filename>.md`
2. 格式化内容（包含：问题、解决方案、示例代码、经验来源）
3. 如果文件存在 → 追加；不存在 → 创建
4. 保留完整的经验来源上下文（项目、日期、问题、效果）

**写入格式** → 读取 `references/sync-details.md` 中的模板

---

### Step 5: 标记已同步

在 `learnings.md` 中标记：
```
- 经验内容 **[已同步到 knowledge/engineering/performance.md]**
```

---

## 输出格式

```
## 知识同步完成

### 统计
- 总计：N 条
- 已同步：N 条
- 跳过：N 条

### 同步明细
- knowledge/engineering/file.md (N 条)
- knowledge/project/<project>/file.md (N 条)

### 下一步
- 可通过 ctx_search(source: "knowledge") 查询
- 建议每周审查一次 learnings.md
```

---

## 参数支持

| 参数 | 说明 |
|------|------|
| `--review` | 只显示统计，不同步 |
| `--auto` | 自动模式，跳过用户确认 |
| `--project <name>` | 指定项目名称 |

---

## 硬性规则

1. **不删除 learnings.md** — 只标记，保留原记录
2. **不混淆层级** — 项目特定知识不放到 engineering/
3. **保留上下文** — 必须记录经验来源
4. **更新而非新建** — 追加到现有文件
5. **不遗弃旧 Knowledge** — 定期审查和更新

---

## 错误处理

| 错误 | 处理 |
|------|------|
| learnings.md 不存在 | 提示初始化 Memory 目录 |
| knowledge/ 不存在 | 自动创建目录结构 |
| 经验格式不规范 | 跳过并警告 |

---

## 相关资源

- 详细流程：`references/sync-details.md`
- Memory 机制：`~/.claude/rules/workflows/task-management.md`
- Knowledge 模板：`~/.claude/docs/templates/`
