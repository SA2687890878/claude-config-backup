# 任务管理规则

> 经验沉淀和任务归档的详细规则。CLAUDE.md 引用此文件。

## 路径设计（Claude Code 的 projects 目录结构）

所有项目级数据存储在 Claude Code 的 projects 目录下：
```
~/.claude/projects/<project-path>/
├── memory/
│   ├── MEMORY.md          # auto-memory 索引
│   ├── learnings.md       # 项目经验（自动+手动写入）
│   └── task-state.md      # 任务状态
└── archive/               # 任务归档
    └── YYYY-MM-DD-分支名.md
```

路径转换规则：`C:\Users\admin` → `C--Users-admin`

---

## 经验沉淀（借鉴 ralph 的 progress.txt 模式）

**每次完成一个功能或修复一个 bug 后，必须追加到项目级 `memory/learnings.md`：**

```markdown
## YYYY-MM-DD HH:MM - [做了什么]

### 修改的文件
- `文件路径` - 改了什么

### 学到的模式（可复用）
- 这个项目用 XxxTemplate 做聚合
- 修改 X 时必须同时更新 Y

### 踩坑记录（下次避免）
- 不要忘记在迁移脚本中加 IF NOT EXISTS
- 这个项目的 Vue 组件都用 xxx 命名

### 有用的上下文
- 评估面板在 component X 中
- Settings 表的字段必须匹配模板
```

**规则：**
1. 存储位置：`~/.claude/projects/<project-path>/memory/learnings.md`
2. 只记录**非显而易见的、可复用的**经验
3. 不记录常规操作（如"添加了一个属性"）
4. `Learnings for future iterations` 是最重要的——下次会话要先看这些
5. `project-knowledge.js` 会在 SessionStart 时自动加载

---

## 任务状态管理

### 任务状态文件

位置：`~/.claude/projects/<project-path>/memory/task-state.md`

```markdown
# 当前任务状态

## 基本信息
- 项目：[项目名]
- 分支：[当前分支]
- 开始时间：[开始时间]

## 任务列表
- [ ] 任务 1
- [ ] 任务 2
- [x] 任务 3（已完成）

## 进度记录
- HH:MM - 完成了什么
```

### 任务归档（借鉴 ralph 的自动归档）

完成一个功能分支时（/commit 的"完成分支"流程），自动归档：

1. 把 `memory/task-state.md` 移动到 `archive/YYYY-MM-DD-分支名.md`
2. 清空 `memory/task-state.md`（保留模板）
3. 在归档文件头部添加完成时间

### 恢复任务

新会话启动时，如果用户说"继续工作"：
1. 读取 `memory/task-state.md`
2. 报告给用户并询问是否继续

> **注意**：`task-state.md` 需要用户或 Claude 手动创建和更新，不会自动生成。这是设计意图——避免自动保存导致数据丢失。

---

## Memory → Knowledge 同步机制

> 项目经验如何升级为工程知识，实现跨项目复用。

### 三层知识体系

```
Memory（项目级会话状态 + 经验）
  ↓ 沉淀
Knowledge（工程级可复用知识）
  ├── engineering/（工程规范、工具规范）
  ├── project/（项目特定知识）
  └── business/（业务知识）
```

### Memory 与 Knowledge 的区分

| 层级 | 位置 | 维护方式 | 生命周期 | 用途 |
|------|------|---------|---------|------|
| **Memory** | `<project>/.../memory/` | 自动+手动 | 会话级，完成后归档 | 避免重复踩坑 |
| **Knowledge** | `~/.claude/knowledge/` | 手动提炼 | 长期维护 | 跨项目复用 |

**区分原则**：
- **Memory**：项目特定的经验（"这个项目用 XxxTemplate 做聚合"）
- **Knowledge**：可复用的通用知识（"Repository 模式的最佳实践"）

### 同步流程

#### 1. 触发时机

**自动触发**：
- 每周：`workflow-router.js` 在 SessionStart 时提示"本周是否需要同步 Memory → Knowledge"
- 每月：定期审查提示

**手动触发**：
- 用户说"同步经验"、"更新知识库"
- 完成大型功能时

#### 2. 同步步骤

```
读取 memory/learnings.md
  ↓
识别可复用模式
  ↓ 判断
是项目特定的？
  ├─ 是 → 升级到 knowledge/project/<project-name>/
  └─ 否 → 升级到 knowledge/engineering/ 或 knowledge/business/
  ↓
更新对应的 Knowledge 文件
  ↓
在 learnings.md 中标记"已同步"
```

#### 3. 识别规则

**升级到 knowledge/engineering/**（工程规范）：
- 工具使用技巧（"SQLite 索引比 CodeGraph 快 10 倍"）
- 编码规范（"异步方法必须用 Async 后缀"）
- 测试模式（"Repository 测试用 InMemory 数据库"）
- 性能优化（"大数据导出用流式处理"）

**升级到 knowledge/project/<project-name>/**（项目知识）：
- API 约定（"响应格式统一用 {success, data, message}"）
- 数据库设计（"所有表必须有 ComId 字段"）
- 常用模式（"聚合用 XxxTemplate"）
- 实体映射（"Order → OrderDto 映射规则"）

**升级到 knowledge/business/**（业务知识）：
- 业务流程（"订单状态机：待支付 → 已支付 → 已发货 → 已完成"）
- 业务规则（"退款只能在 7 天内申请"）
- 术语表（"ComId = 租户 ID"）

#### 4. 同步示例

**learnings.md 中的经验**：
```markdown
## 2026-06-15 16:30 - [特性] 实现用户导出功能

### 学到的模式
- 大数据量导出不能一次性加载，需要分页 + 流式写入
- 使用 `IAsyncEnumerable<T>` 避免内存溢出
- 导出时需要捕获快照（防止中途有新增记录导致数据重复）
```

**同步判断**：
- "大数据量导出用流式处理" → **通用工程知识** → 升级到 `knowledge/engineering/performance.md`
- "IAsyncEnumerable<T> 避免内存溢出" → **通用工程知识** → 升级到 `knowledge/engineering/dotnet-best-practices.md`
- "导出时捕获快照" → **项目特定知识** → 升级到 `knowledge/project/<project-name>/export-patterns.md`

**同步后的 knowledge/engineering/performance.md**：
```markdown
# 性能优化最佳实践

## 大数据导出

### 问题
一次性加载大数据量会导致内存溢出。

### 解决方案
使用流式处理 + 分页加载：
- .NET：`IAsyncEnumerable<T>` + `yield return`
- 数据库：`Skip()` + `Take()` 分页
- 文件写入：流式写入，不缓存全部数据

### 示例代码
```csharp
public async IAsyncEnumerable<User> GetUsersStreamAsync()
{
    var pageSize = 1000;
    var page = 0;
    while (true)
    {
        var users = await _db.Users
            .Skip(page * pageSize)
            .Take(pageSize)
            .ToListAsync();
        if (!users.Any()) break;
        foreach (var user in users)
            yield return user;
        page++;
    }
}
```

### 经验来源
- 项目：OTD.PCS.WebBackend
- 日期：2026-06-15
- 问题：用户导出 100 万行时内存峰值 3GB
- 修复后：内存稳定在 200MB 以下
```

**learnings.md 中标记**：
```markdown
## 2026-06-15 16:30 - [特性] 实现用户导出功能

### 学到的模式
- 大数据量导出不能一次性加载，需要分页 + 流式写入 **[已同步到 knowledge/engineering/performance.md]**
- 使用 `IAsyncEnumerable<T>` 避免内存溢出 **[已同步到 knowledge/engineering/dotnet-best-practices.md]**
- 导出时需要捕获快照 **[已同步到 knowledge/project/<project-name>/export-patterns.md]**
```

#### 5. Knowledge 文件结构

```
~/.claude/knowledge/
├── engineering/                           # 工程规范
│   ├── performance.md                     # 性能优化
│   ├── dotnet-best-practices.md           # .NET 最佳实践
│   ├── sql-best-practices.md              # SQL 最佳实践
│   ├── testing-patterns.md                # 测试模式
│   └── code-index-strategy.md             # 代码索引策略
├── project/                               # 项目特定知识
│   ├── <project-name>/
│   │   ├── api-contract.md                # API 约定
│   │   ├── database-schema.md             # 数据库设计
│   │   ├── common-patterns.md             # 常用模式
│   │   ├── entity-mapping.md              # 实体映射
│   │   └── export-patterns.md             # 导出模式
│   └── <another-project>/
│       └── ...
└── business/                              # 业务知识
    ├── order-workflow.md                  # 订单流程
    ├── refund-policy.md                   # 退款政策
    └── terminology.md                     # 术语表
```

#### 6. 自动化支持

**Hook 集成**（可选）：
创建 `~/.claude/hooks/knowledge-sync-reminder.js`（SessionStart），在每周一提示：

```javascript
// 每周一提示同步 Memory → Knowledge
const today = new Date();
if (today.getDay() === 1) {  // 周一
  console.log(JSON.stringify({
    additionalContext: "## 知识同步提醒\n\n本周是否需要将 memory/learnings.md 中的经验同步到 knowledge/？"
  }));
}
```

**Skill 集成**：
创建 `/sync-knowledge` Skill，自动化同步流程：
1. 读取 `memory/learnings.md`
2. 识别可复用模式
3. 询问用户分类（engineering / project / business）
4. 写入对应的 Knowledge 文件
5. 在 learnings.md 中标记"已同步"

### 最佳实践

#### DO ✅

- **定期同步**：每周或每完成大功能后同步一次
- **标记已同步**：在 learnings.md 中标记，避免重复
- **保留上下文**：同步到 Knowledge 时保留"经验来源"（项目、日期、问题）
- **分类清晰**：判断是工程知识还是项目知识
- **更新而非新建**：如果 Knowledge 文件已存在相关内容，更新而非新建

#### DON'T ❌

- **不要全部同步**：只同步可复用的经验
- **不要删除 learnings.md**：标记为"已同步"，保留原记录
- **不要混淆层级**：项目特定知识不要放到 engineering/
- **不要遗弃旧 Knowledge**：定期审查和更新 Knowledge 文件

### 查询机制

**查询 Knowledge**：
```bash
# 使用 ctx_search 查询
mcp__context-mode__ctx_search({
  queries: ["大数据导出", "IAsyncEnumerable"],
  source: "knowledge"
})

# 或使用 Grep
Grep({ pattern: "IAsyncEnumerable", path: "~/.claude/knowledge/" })
```

**查询 Memory**：
```bash
# SessionStart 时自动加载 learnings.md
# 或手动读取
Read({ file_path: "~/.claude/projects/<project>/memory/learnings.md" })
```

### 总结

**Memory → Knowledge 的核心**：
1. **Memory 是原始经验**：会话级、项目特定
2. **Knowledge 是提炼知识**：长期维护、跨项目复用
3. **定期同步**：每周或完成大功能后
4. **分类清晰**：engineering / project / business
5. **保留上下文**：记录经验来源
