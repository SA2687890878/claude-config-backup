# 日常使用指南

> 安装完成后，如何使用这套 Harness Engineering。

---

## 快速开始

### 启动 Claude Code

```bash
cd /你的项目目录
claude
```

Claude 会自动加载：
- `CLAUDE.md`（项目指令）
- `rules/`（编码规范）
- `skills/`（工作流组件）
- `commands/`（自定义命令）
- `hooks/（生命周期钩子）

---

## 日常工作流

### 场景 1：开发新功能

```
你：开发一个设备点检功能

Claude：[自动进入功能开发流程]
  → Phase 1: 需求探索（/brainstorming）
  → Phase 2: 实现规划（/writing-plans）
  → Phase 3: 代码实现
  → Phase 4: 代码审查（/dotnet-review）
  → Phase 5: 完成验证（/verification-before-completion）
  → Phase 6: 收尾
```

**触发词**：开发、添加、实现

---

### 场景 2：修复 Bug

```
你：这个接口报错了

Claude：[自动进入 Bug 修复流程]
  → Phase 1: 问题定位（/systematic-debugging）
  → Phase 2: 修复实施（TDD）
  → Phase 3: 代码审查（/dotnet-review）
  → Phase 4: 完成验证
  → Phase 5: 收尾
```

**触发词**：修复、bug、报错

---

### 场景 3：讨论设计方案

```
你：讨论一下这个功能的架构

Claude：[进入头脑风暴]
  → 探索项目上下文
  → 逐一提问，澄清需求
  → 提出 2-3 个方案
  → 呈现设计，等待批准
```

**触发词**：讨论、设计、方案、头脑风暴

---

### 场景 4：代码审查

```
你：审查一下这个模块

Claude：[进入代码审查流程]
  → 读取 git diff
  → 检查架构、安全性、性能
  → 输出审查报告
```

**触发词**：审查、review

---

### 场景 5：性能优化

```
你：这个接口太慢了

Claude：[进入性能优化流程]
  → 分析瓶颈（/perf-tune）
  → 制定优化方案
  → 实施优化
  → 复测验证
```

**触发词**：优化、慢、性能

---

### 场景 6：查询加密源码的代码结构

公司源码经过加密编码，Read 工具和 CodeGraph 均无法直接读取。使用 SQLite 索引查询：

```
你：查一下 OrderService 的调用链

Claude：
  → powershell search.ps1 -Callers "OrderService.CreateOrder" -ProjectPath "项目路径"
  → 返回调用者列表（文件、行号、签名）
```

**常用查询**：

```powershell
# 查类
search.ps1 -Query "OrderController" -Type class -ProjectPath "项目.csproj 所在目录"

# 查方法调用链
search.ps1 -Callers "OrderService.CreateOrder" -ProjectPath "项目.csproj 所在目录"
search.ps1 -Callees "OrderService.CreateOrder" -ProjectPath "项目.csproj 所在目录"

# 索引统计
search.ps1 -Stats -ProjectPath "项目.csproj 所在目录"
```

> 索引在写入 .cs 文件时**自动更新**（PostToolUse hook），无需手动触发。

---

## 自动化 Hook

### 写代码时自动触发

```
你写 .cs 文件
    │
    ├─→ [PreToolUse] Secret Guard：检查密钥泄露
    ├─→ [PreToolUse] Write Guard：检查路径安全
    ├─→ [PreToolUse] Impact Guard：提醒查调用链
    │
    ├─→ [你的编辑操作]
    │
    ├─→ [PostToolUse] CS Guard：检查语法
    ├─→ [PostToolUse] Quality Guard：检查最佳实践
    └─→ [PostToolUse] Build Guard：提醒构建
```

### 运行命令时自动触发

```
你运行 Bash 命令
    │
    ├─→ [PreToolUse] Secret Guard：检查命令中的密钥
    └─→ [PreToolUse] RTK Wrapper：压缩输出（节省 61% token）
```

---

## 常用命令

| 命令 | 用途 |
|------|------|
| `/brainstorming` | 需求探索 |
| `/writing-plans` | 实现规划 |
| `/verification-before-completion` | 完成前验证 |
| `/memory-save` | 保存经验 |
| `/commit` | 生成提交信息 |
| `/code-review` | 代码审查 |
| `/bug-fix` | Bug 修复 |
| `/perf-optimize` | 性能优化 |

---

## 最佳实践

### 1. 渐进式开发

```
❌ 错误：一次性让 Claude 实现整个功能
✅ 正确：分步骤，每步确认后再继续
```

### 2. 先探索后实现

```
❌ 错误：直接让 Claude 写代码
✅ 正确：先讨论设计方案，确认后再写
```

### 3. 利用 Hook 自动检查

```
❌ 错误：手动检查代码质量
✅ 正确：Hook 自动检查，你只关注业务逻辑
```

### 4. 保存经验

```
❌ 错误：排查完问题就结束
✅ 正确：用 /memory-save 保存经验，下次直接复用
```

---

## 常见问题

### Q: Hook 不生效？

A: 检查 `settings.json` 中的路径是否正确，Node.js 是否安装。

### Q: 触发词没反应？

A: 检查 `rules/workflows.md` 中的触发词映射。

### Q: Token 节省不明显？

A: 确认 RTK 已安装：`rtk --version`

### Q: 如何跳过某个 Hook？

A: Hook 是自动执行的，无法跳过。如果需要临时禁用，从 `settings.json` 中删除对应条目。

---

## 工作流触发词速查

| 触发词 | 命令 | 场景 |
|--------|------|------|
| 讨论/设计/方案/头脑风暴 | `/brainstorming` | 需求探索 |
| 开发/添加/实现 | `/feature-development` | 功能开发 |
| 修复/bug/报错 | `/bug-fix` | Bug 修复 |
| 优化/慢/性能 | `/perf-optimize` | 性能优化 |
| 审查/review | `/code-review` | 代码审查 |
| 提交 | `/commit` | Git 提交 |
| 开始/继续 | 直接触发 | git status + task list |
| 文档 | `docs` skill | 生成文档 |
