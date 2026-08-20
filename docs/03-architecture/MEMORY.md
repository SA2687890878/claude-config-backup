# Memory 机制详解

> 三层 Memory 设计：自动索引 + 手动经验 + 任务状态
> ⚠️ 任务主协议已迁移至 `~/.claude/tasks/active.json`（唯一真源），本文 `task-state.md` 相关描述为遗留兼容，新任务以 `active.json` 为准。

## 架构概览

```
~/.claude/projects/<project>/memory/
├── MEMORY.md              # 自动索引（由 Claude 维护）
├── <topic>.md             # 知识条目（自动创建）
├── learnings.md           # 经验沉淀（手动可选）
└── task-state.md          # 任务状态（手动维护）
```

---

## 三层 Memory 详解

### 第1层：MEMORY.md（自动索引）

**定位**：Claude 自动维护的知识索引

**生成机制**：
- `mcp__memory__create_entities` — 创建知识实体
- `mcp__memory__create_relations` — 建立实体关系
- `mcp__memory__add_observations` — 添加观察信息
- MEMORY.md 自动同步为可读索引

**示例内容**：
```markdown
# Memory 索引

## 项目知识
- [现有实体复用检查清单](existing-entity-reuse.md) — 开发新功能前的检查步骤
- [API 响应格式约定](api-response-format.md) — RESTful API 的统一格式
- [RTK Hook 状态](rtk-hook-status.md) — RTK 状态管理的关键模式

## 决策记录
- [为什么选择 Repository 模式](why-repository-pattern.md) — 架构决策依据
```

**用途**：
- ✅ 会话开始时，Claude 快速查询项目特定知识
- ✅ 开发新功能时，自动提醒"这个模式我们用过"
- ✅ 新成员加入时，快速了解项目最佳实践

**何时触发**：
- `project-knowledge.js` — SessionStart 时加载
- `mcp__memory__read_graph` — 会话中主动查询

---

### 第2层：learnings.md（手动经验沉淀）

**定位**：用户主动记录的开发经验和踩坑记录

**创建方式**：**手动创建**（不自动生成）

**何时添加**：
- 完成一个功能或修复一个 bug 时
- 学到了新的项目特定知识时
- 踩到了坑，想给下一个人提醒时

**格式约定**（借鉴 ralph 的 progress.txt）：

```markdown
# 项目经验记录

> 手动沉淀的开发经验。非显而易见的、可复用的洞察。

---

## 2026-06-15 16:30 - [特性] 实现用户导出功能

### 修改的文件
- `src/services/UserExportService.cs` — 导出逻辑
- `src/controllers/UserController.cs` — API 端点
- `tests/UserExportServiceTests.cs` — 单元测试

### 学到的模式
- 大数据量导出不能一次性加载，需要分页 + 流式写入
- 使用 `IAsyncEnumerable<T>` 避免内存溢出
- 导出时需要捕获快照（防止中途有新增记录导致数据重复）

### 踩坑记录（下次避免）
- ❌ 初版用了 `ToList()` 一次性加载，导出 100 万行时内存峰值 3GB
- ❌ 忘记检查文件写入权限，生产环境部署失败
- ✅ 改用流式处理后，内存稳定在 200MB 以下

### 有用的上下文
- 导出功能在 `Services/Export/` 目录
- Excel 生成用的是 NPOI，配置在 `appsettings.json` 的 `ExportSettings`
- 单元测试用了 `Xunit` + `Moq`，模式见 `UserExportServiceTests.cs`

---

## 2026-06-14 10:15 - [修复] 订单金额计算错误

### 修改的文件
- `src/domain/Order.cs` — 重构计算逻辑

### 学到的模式
- 货币计算必须用 `decimal`，不能用 `float`/`double`（浮点精度问题）
- 折扣、税费等应该分别记录，最后才汇总（审计友好）

### 踩坑记录
- ❌ 用了 `double`，导致 0.1 * 3 != 0.3 的 bug
- ❌ 在 Order.cs 中一次性计算所有费用，导致逻辑复杂且难以审计

### 有用的上下文
- 类似的计算逻辑见 `Domain/Calculations/`
- 单位测试覆盖了所有边界情况（1 分钱到 999万）
```

**何时更新**：
- 推荐在会话结束时，总结本次学到的经验
- 或者在 `/commit` 时，总结这个 PR 的经验

**不是自动生成的原因**：
- ❌ 避免数据丢失（自动生成的数据往往难以恢复）
- ❌ 避免垃圾数据（不是所有修改都值得记录）
- ✅ 记录的质量更高（人工筛选，去粗存精）

---

### 第3层：task-state.md（任务状态）

**定位**：当前会话的任务进度（用于跨会话恢复）

**创建方式**：**手动创建**（不自动生成）

**格式约定**：

```markdown
# 当前任务状态

## 基本信息
- 项目：OTD.PCS.WebBackend
- 分支：feature/user-export
- 开始时间：2026-06-15 14:00

## 任务列表
- [x] 实现导出 API
- [x] 添加单元测试
- [ ] 集成测试
- [ ] 文档更新
- [ ] Code Review

## 进度记录
- 14:00 - 开始实现导出 API
- 15:30 - API 实现完成，开始写单元测试
- 16:45 - 单元测试全部通过（98% 覆盖率）
- 17:00 - 准备进行集成测试

## 下一步
1. 运行集成测试（预计 30 分钟）
2. 补充 API 文档
3. 提交 PR
```

**用途**：
- ✅ 会话中断后，新会话快速恢复进度
- ✅ `skill-router.js` 在 SessionStart 时自动加载，提醒用户继续之前的工作
- ✅ 跨天工作时，不丢失上下文

**何时更新**：
- 任务开始时创建
- 完成一个 Subtask 时勾选
- 会话结束前保存

---

## 三层的协作机制

### 场景1：会话启动

```
SessionStart
  ↓
project-knowledge.js 运行
  ↓
加载 MEMORY.md（自动索引）+ learnings.md（如有）+ task-state.md（如有）
  ↓
Claude 根据 Memory 内容调整推理
  ↓
如果有未完成任务，skill-router.js 提醒用户继续
```

### 场景2：开发新功能

```
用户："开发一个导出功能"
  ↓
Claude 查询 MEMORY.md
  ↓
发现"现有实体复用检查清单"和"API 响应格式约定"
  ↓
自动提醒："根据项目惯例，需要检查这些地方..."
  ↓
开发完成后，用户手动更新 learnings.md
  ↓
下次类似功能时，下一个会话可以参考
```

### 场景3：跨会话恢复

```
旧会话结束
  ↓
learnings.md 记录了本次学到的经验
  ↓
task-state.md 记录了未完成的任务
  ↓
新会话启动
  ↓
加载 task-state.md，skill-router.js 提醒："上次还有这些任务"
  ↓
用户说"继续"，自动路由回原有工作
```

---

## 最佳实践

### DO ✅

- **定期更新 learnings.md** — 每完成一个重要功能就记录一次
- **具体记录坑** — "不要忘记 XYZ" 比 "代码复杂" 更有用
- **维护 task-state.md** — 特别是跨天工作时
- **链接参考** — learnings.md 中引用相关文件和类（后续查找快速）
- **时间戳** — 记录何时发现、何时解决，帮助后续判断是否仍适用

### DON'T ❌

- **不要过度自动化** — learnings.md 手动写，质量更高
- **不要重复记录** — 同一个坑不需要记多次
- **不要遗弃 task-state.md** — 会议中断或突发事件时特别重要
- **不要记录显而易见的事** — "修改了 UserController" 不值得记录
- **不要让 MEMORY.md 过大** — 超过 20 个条目考虑分类

---

## 与 Claude 官方 Memory 的关系

**Claude 官方 Memory**（`mcp__memory__*`）：
- 自动维护
- 用于 AI 的长期记忆
- 不涉及项目特定信息

**本地 Memory**（MEMORY.md + learnings.md + task-state.md）：
- 项目级数据
- 既供 AI 查询，也供人类阅读
- 包含踩坑记录、经验总结、决策依据

**协作关系**：
```
Claude 官方 Memory（全局知识）
  ↓
本地 Memory（项目特定知识）
  ↓
MEMORY.md（自动索引）
  ↓
learnings.md（人工经验）+ task-state.md（任务状态）
```

---

## 常见问题

### Q: learnings.md 多久更新一次？
**A**: 没有硬性规定。建议：
- 完成一个 PR 时更新一次
- 踩到坑时立即记录（怕忘了）
- 至少每周梳理一次经验

### Q: task-state.md 完成后删除吗？
**A**: 不删除，可以移动到 `archive/` 目录（按日期归档）

### Q: 如果忘记更新 learnings.md 怎么办？
**A**: 不会丢失。下次遇到同样问题时，从错误中重新学习就好。learnings.md 是"加速"，不是"必需"。

### Q: MEMORY.md 可以手动编辑吗？
**A**: 技术上可以，但不推荐。最好通过 `mcp__memory__*` API 编辑，保持结构一致。

---

## 总结

| 层级 | 文件 | 维护者 | 用途 | 查询方式 |
|------|------|--------|------|---------|
| 1 | MEMORY.md | Claude 自动 | 知识索引 | SessionStart 自动加载 |
| 2 | learnings.md | 用户手动 | 经验沉淀 | project-knowledge.js 加载 |
| 3 | task-state.md | 用户手动 | 任务状态 | skill-router.js 恢复 |

**理想状态**：
- MEMORY.md 由项目的最佳实践自动更新
- learnings.md 记录了项目的所有重要经验
- task-state.md 始终反映当前任务进度
- 新会话快速加载，老会话快速恢复，整个系统高效运转
