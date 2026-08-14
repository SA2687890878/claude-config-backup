# 知识同步详细流程

## 执行步骤

### Step 1: 读取 learnings.md

```javascript
// 读取 learnings（按优先级）：
// 1. ~/.claude/memory/learnings.md —— 跨项目经验（权威源，knowledge-index 布局）
// 2. ~/.claude/learnings.md —— 项目经验（pcs.webbackend 等）
// 3. ~/.claude/projects/${projectName}/memory/learnings.md —— 仅 Claude Code 历史会话布局，存在才读
const learningsPath = `~/.claude/memory/learnings.md`
const learningsContent = Read(learningsPath)
```

### Step 2: 解析未同步的经验

```javascript
// 正则匹配未标记"已同步"的条目
const entries = learningsContent.match(/## \d{4}-\d{2}-\d{2}.*?(?=## \d{4}-\d{2}-\d{2}|$)/gs)

const unsyncedEntries = entries.filter(entry => {
  // 提取"学到的模式"部分
  const patterns = entry.match(/### 学到的模式(.*?)(?=###|$)/s)?.[1]
  if (!patterns) return false
  
  // 检查是否有未标记"已同步"的行
  const lines = patterns.split('\n').filter(line => line.trim().startsWith('-'))
  return lines.some(line => !line.includes('**[已同步到'))
})
```

### Step 3: 分类判断

对每条经验进行自动分类：

```javascript
function classify(pattern) {
  // 工程知识关键词
  const engineeringKeywords = [
    '性能', 'performance', '内存', '流式处理', 'IAsyncEnumerable',
    '索引', 'index', '缓存', 'cache', '异步', 'async',
    '测试', 'test', '重构', 'refactor', '设计模式', 'pattern'
  ]
  
  // 项目知识关键词
  const projectKeywords = [
    'API', '接口', 'endpoint', '数据库', 'database', 'schema',
    '实体', 'entity', '映射', 'mapping', 'DTO',
    '导出', 'export', '报表', 'report'
  ]
  
  // 业务知识关键词
  const businessKeywords = [
    '订单', 'order', '用户', 'user', '支付', 'payment',
    '审批', 'approval', '流程', 'workflow', '状态机', 'state machine',
    'ComId', '租户', 'tenant'
  ]
  
  if (engineeringKeywords.some(kw => pattern.toLowerCase().includes(kw))) {
    return 'engineering'
  } else if (businessKeywords.some(kw => pattern.toLowerCase().includes(kw))) {
    return 'business'
  } else {
    return 'project'
  }
}
```

### Step 4: 用户确认

对于每条经验，展示并询问：

```javascript
const questions = unsyncedEntries.map((entry, index) => {
  const date = entry.match(/## (\d{4}-\d{2}-\d{2})/)?.[1]
  const title = entry.match(/## \d{4}-\d{2}-\d{2}.*? - \[(.*?)\]/)?.[1]
  const patterns = entry.match(/### 学到的模式(.*?)(?=###|$)/s)?.[1]
    .split('\n')
    .filter(line => line.trim().startsWith('-') && !line.includes('**[已同步到'))
    .map(line => line.replace(/^-\s*/, '').trim())
  
  return {
    date,
    title,
    patterns,
    suggestedCategory: patterns.map(p => classify(p))
  }
})

// 使用 AskUserQuestion 询问用户
AskUserQuestion({
  questions: [
    {
      question: `发现 ${questions.length} 条未同步的经验，是否同步？`,
      header: '同步确认',
      multiSelect: false,
      options: [
        { label: '全部同步', description: '自动分类并同步所有经验' },
        { label: '逐条确认', description: '逐条展示并确认分类' },
        { label: '取消', description: '不同步' }
      ]
    }
  ]
})
```

### Step 5: 写入 Knowledge

```javascript
// 对于工程知识
const engineeringFile = '~/.claude/knowledge/engineering/performance.md'
const existingContent = Read(engineeringFile)

// 追加新经验
const newContent = `
## 大数据导出

### 问题
一次性加载大数据量会导致内存溢出。

### 解决方案
使用流式处理 + 分页加载：
- .NET：\`IAsyncEnumerable<T>\` + \`yield return\`
- 数据库：\`Skip()\` + \`Take()\` 分页
- 文件写入：流式写入，不缓存全部数据

### 示例代码
\`\`\`csharp
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
\`\`\`

### 经验来源
- 项目：${projectName}
- 日期：${date}
- 问题：用户导出 100 万行时内存峰值 3GB
- 修复后：内存稳定在 200MB 以下
`

Write(engineeringFile, existingContent + newContent)
```

### Step 6: 标记已同步

```javascript
// 更新 learnings.md
const updatedLearnings = learningsContent.replace(
  /- (.*大数据导出.*)/,
  '- $1 **[已同步到 knowledge/engineering/performance.md]**'
)

Write(learningsPath, updatedLearnings)
```

---

## 输出格式

```
## 知识同步报告

### 同步统计
- 总计：5 条经验
- 已同步：5 条
- 跳过：0 条

### 同步明细

#### knowledge/engineering/performance.md
- 大数据导出用流式处理
- IAsyncEnumerable 避免内存溢出

#### knowledge/project/<project-name>/export-patterns.md
- 导出时捕获快照

#### knowledge/business/order-workflow.md
- 订单状态机流程

### learnings.md 更新
已标记 5 条经验为"已同步"

### 下一步
- 可通过 ctx_search 查询同步后的知识
- 建议每周审查一次 learnings.md
```

---

## 错误处理

### 错误1：learnings.md 不存在
```
错误：learnings.md 不存在
提示：请先使用项目启动 Checklist 初始化 Memory 目录
```

### 错误2：Knowledge 目录不存在
```
错误：knowledge/ 目录不存在
操作：自动创建目录结构
```

### 错误3：经验格式不符合规范
```
警告：以下条目格式不规范，跳过同步
- [条目内容]
建议：检查 learnings.md 格式是否正确
```
