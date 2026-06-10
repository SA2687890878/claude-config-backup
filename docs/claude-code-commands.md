# Claude Code 命令参考

> 官方命令 + 个人 Harness Engineering 命令完整手册

---

## 目录

- [一、官方命令](#一官方命令)
  - [1.1 启动选项](#11-启动选项)
  - [1.2 会话管理](#12-会话管理)
  - [1.3 模型与权限](#13-模型与权限)
  - [1.4 工具控制](#14-工具控制)
  - [1.5 子命令](#15-子命令)
  - [1.6 会话内命令](#16-会话内命令)
- [二、Harness Engineering 命令](#二harness-engineering-命令)
  - [2.1 Skills（技能）](#21-skills技能)
  - [2.2 Rules（规则）](#22-rules规则)
  - [2.3 Commands（流程）](#23-commands流程)
  - [2.4 Hooks（钩子）](#24-hooks钩子)
- [三、使用示例](#三使用示例)

---

## 一、官方命令

### 1.1 启动选项

| 命令 | 作用 | 示例 |
|------|------|------|
| `claude` | 启动交互式会话 | `claude` |
| `claude -p` | 非交互式模式（管道） | `echo "explain this" \| claude -p` |
| `claude --help` | 显示帮助 | `claude --help` |
| `claude -v` | 显示版本 | `claude -v` |

### 1.2 会话管理

| 命令 | 作用 | 示例 |
|------|------|------|
| `-c, --continue` | 继续当前目录最近的会话 | `claude --continue` |
| `-r, --resume [id/name]` | 恢复指定会话（ID 或名称） | `claude --resume abc123` |
| `-n, --name <name>` | 给会话命名 | `claude --name my-session` |
| `--fork-session` | 恢复时创建新会话 ID | `claude --resume --fork-session` |
| `--session-id <uuid>` | 使用指定 UUID | `claude --session-id 550e8400-e29b-41d4-a716-446655440000` |
| `--no-session-persistence` | 禁用会话持久化（仅 -p） | `claude -p --no-session-persistence` |

**会话管理最佳实践：**
```bash
# 日常工作：继续上次会话
claude --continue

# 多任务：给会话命名
claude --name order-service-dev

# 恢复特定会话
claude --resume order-service-dev
```

### 1.3 模型与权限

| 命令 | 作用 | 示例 |
|------|------|------|
| `--model <model>` | 指定模型 | `claude --model opus` |
| `--effort <level>` | 设置努力级别 | `claude --effort high` |
| `--permission-mode <mode>` | 权限模式 | `claude --permission-mode auto` |
| `--allowedTools <tools...>` | 允许的工具 | `claude --allowedTools "Bash(git *) Edit"` |
| `--disallowedTools <tools...>` | 禁止的工具 | `claude --disallowedTools "Edit"` |

**模型别名：**
- `sonnet` → claude-sonnet-4-6
- `opus` → claude-opus-4-8
- `haiku` → claude-haiku-4-5-20251001

**努力级别：**
- `low` - 快速响应
- `medium` - 平衡模式
- `high` - 深度思考
- `xhigh` - 超深度
- `max` - 最大努力

**权限模式：**
- `default` - 默认（需要确认）
- `auto` - 自动执行
- `acceptEdits` - 接受编辑
- `plan` - 只规划不执行

### 1.4 工具控制

| 命令 | 作用 | 示例 |
|------|------|------|
| `--tools <tools...>` | 指定可用工具 | `claude --tools "Bash,Edit,Read"` |
| `--bare` | 最小模式（跳过 hooks 等） | `claude --bare` |
| `--add-dir <dirs...>` | 添加额外目录访问 | `claude --add-dir /path/to/other/project` |

### 1.5 子命令

| 命令 | 作用 | 示例 |
|------|------|------|
| `claude auth` | 管理认证 | `claude auth login` |
| `claude mcp` | 配置 MCP 服务器 | `claude mcp add my-server` |
| `claude plugin` | 管理插件 | `claude plugin list` |
| `claude project` | 管理项目状态 | `claude project list` |
| `claude update` | 检查更新 | `claude update` |
| `claude doctor` | 健康检查 | `claude doctor` |
| `claude install` | 安装原生构建 | `claude install stable` |
| `claude agents` | 管理后台代理 | `claude agents list` |
| `claude ultrareview` | 云端多代理代码审查 | `claude ultrareview` |

### 1.6 会话内命令

| 命令 | 作用 |
|------|------|
| `/help` | 显示帮助 |
| `/clear` | 清空上下文 |
| `/compact` | 压缩上下文 |
| `/cost` | 显示 token 成本 |
| `/doctor` | 诊断问题 |
| `/init` | 初始化项目 |
| `/login` | 登录 |
| `/logout` | 登出 |
| `/memory` | 编辑记忆 |
| `/model` | 切换模型 |
| `/permissions` | 管理权限 |
| `/rename` | 重命名会话 |
| `/resume` | 恢复会话 |
| `/status` | 显示状态 |
| `/terminal-setup` | 终端设置 |
| `/vim` | 切换 vim 模式 |

---

## 二、Harness Engineering 命令

### 2.1 Skills（技能）

共 33 个 skills，按功能分类：

#### 需求与设计

| 命令 | 作用 | 触发词 |
|------|------|--------|
| `/brainstorming` | 头脑风暴，探索需求 | 讨论、设计、方案 |
| `/requirements` | 需求分析 | 需求、规格 |

#### 开发流程

| 命令 | 作用 | 触发词 |
|------|------|--------|
| `/feature-development` | 功能开发全流程 | 开发、添加、实现 |
| `/subagent-driven-development` | 子代理驱动开发 | - |
| `/executing-plans` | 执行计划 | - |
| `/writing-plans` | 编写计划 | - |
| `/using-git-worktrees` | 使用 Git worktree | - |
| `/finishing-a-development-branch` | 完成开发分支 | - |

#### 测试

| 命令 | 作用 | 触发词 |
|------|------|--------|
| `/test-driven-development` | 测试驱动开发 | - |
| `/generate-tests` | 生成测试 | - |
| `/verification-before-completion` | 完成前验证 | - |

#### 代码审查

| 命令 | 作用 | 触发词 |
|------|------|--------|
| `/arch-review` | 架构审查 | - |
| `/dotnet-review` | .NET 代码审查 | - |
| `/requesting-code-review` | 请求代码审查 | - |
| `/receiving-code-review` | 接收代码审查 | - |
| `/safe-modification` | 安全修改 | - |

#### 调试与优化

| 命令 | 作用 | 触发词 |
|------|------|--------|
| `/systematic-debugging` | 系统化调试 | 修复、bug、报错 |
| `/perf-tune` | 性能调优 | 优化、慢、性能 |
| `/security-scan` | 安全扫描 | - |

#### 文档与记忆

| 命令 | 作用 | 触发词 |
|------|------|--------|
| `/docs` | 生成文档 | 文档 |
| `/memory-save` | 保存记忆 | - |

#### Git 操作

| 命令 | 作用 | 触发词 |
|------|------|--------|
| `/commit` | 提交代码 | 提交 |
| `/dispatching-parallel-agents` | 并行代理分发 | - |

#### Token 优化（Caveman 系列）

| 命令 | 作用 |
|------|------|
| `/caveman` | 压缩模式（省 75% token） |
| `/caveman-commit` | 压缩提交 |
| `/caveman-compress` | 压缩内容 |
| `/caveman-help` | 压缩帮助 |
| `/caveman-review` | 压缩审查 |
| `/caveman-stats` | 压缩统计 |
| `/cavecrew` | 团队压缩 |

#### 其他工具

| 命令 | 作用 |
|------|------|
| `/find-skills` | 查找技能 |
| `/skill-creator` | 创建技能 |
| `/writing-skills` | 编写技能 |
| `/using-superpowers` | 使用超能力 |
| `/sync-source-index` | 同步源码索引 |
| `/supabase-postgres-best-practices` | Supabase PostgreSQL 最佳实践 |

---

### 2.2 Rules（规则）

共 9 个规则文件：

| 文件 | 作用 | 何时加载 |
|------|------|---------|
| `csharp.md` | C# 编码规范 | 编写 .cs 文件时 |
| `git.md` | Git 提交规范 | Git 操作时 |
| `model-strategy.md` | 模型使用策略 | 选择模型时 |
| `postgresql.md` | PostgreSQL 规范 | 数据库操作时 |
| `security.md` | 安全规则 | 敏感操作时 |
| `sqlserver.md` | SQL Server 规范 | 数据库操作时 |
| `token-optimization.md` | Token 优化规则 | 所有操作时 |
| `vue.md` | Vue 编码规范 | 前端开发时 |
| `workflows.md` | 工作流触发规则 | 所有操作时 |

**规则优先级：**
```
项目级 .claude/ > 全局 rules/*.md > CLAUDE.md
```

### 2.3 Commands（流程）

| 命令 | 作用 | 标准流程 |
|------|------|---------|
| `/feature-development` | 功能开发全流程 | brainstorming → writing-plans → git-worktrees → subagent-development → arch-review → dotnet-review → verification → finishing-branch |
| `/bug-fix` | Bug 修复流程 | systematic-debugging → test-driven-development → 修复 → dotnet-review → verification |
| `/code-review` | 代码审查流程 | 变更收集 → dispatching-parallel-agents（5维度并行） → 问题汇总 → 修复建议 |
| `/perf-optimize` | 性能优化流程 | 问题定位 → 分析 → 优化 → 验证 |
| `/branch` | 分支管理 | - |

**流程特点：**
- 每个阶段完成后等待用户确认
- 有明确的退出码 gate
- 并行审查提高效率

### 2.4 Hooks（钩子）

共 14 个 hooks，按触发时机分类：

#### PreToolUse（工具使用前）

| Hook | 作用 |
|------|------|
| `secret-guard.js` | 检测硬编码密钥/密码/token |
| `secret-guard-enhanced.js` | 增强版密钥检测 |
| `write-guard.js` | 防止在主目录写垃圾文件 |
| `impact-guard.js` | 影响分析 |

#### PostToolUse（工具使用后）

| Hook | 作用 |
|------|------|
| `cs-guard.js` | C# 语法和异步问题检查 |
| `quality-guard.js` | 代码质量检查（SQL注入、null安全、资源释放等） |
| `build-guard.js` | 构建验证 |
| `sqlite-index-update.js` | SQLite 索引自动更新 |

#### Commit（提交时）

| Hook | 作用 |
|------|------|
| `git-commit-review.js` | Git 提交信息审查 |

#### Session（会话时）

| Hook | 作用 |
|------|------|
| `bash-output-checker.js` | Bash 输出检查 |

#### 输出处理

| Hook | 作用 |
|------|------|
| `rtk-wrapper.js` | RTK 压缩包装器 |

#### 通知

| Hook | 作用 |
|------|------|
| `notify-complete.ps1` | 任务完成通知（PowerShell） |
| `notify-complete.sh` | 任务完成通知（Shell） |

**Hook 优先级：**
```
PreToolUse > 执行工具 > PostToolUse > 输出
```

---

## 三、使用示例

### 日常工作流

```bash
# 1. 开始工作（继续上次会话）
claude --continue

# 2. 如果是新任务，先 brainstorming
> /brainstorming

# 3. 开发功能
> /feature-development

# 4. 提交代码
> /commit

# 5. 结束会话（会话自动保存）
```

### 多任务切换

```bash
# 任务 1：开发 OrderService
claude --name order-service
> /feature-development
# ... 工作中 ...

# 任务 2：修复 UserService bug
claude --name user-service-bugfix
> /bug-fix
# ... 工作中 ...

# 回到任务 1
claude --resume order-service
```

### 代码审查

```bash
# 审查当前分支所有变更
> /code-review

# 只审查特定文件
> /dotnet-review
```

### 性能优化

```bash
# 分析性能问题
> /perf-tune

# 系统化调试
> /systematic-debugging
```

### Token 优化

```bash
# 启用压缩模式
> /caveman

# 查看压缩统计
> /caveman-stats
```

---

## 四、配置文件位置

| 文件 | 路径 | 作用 |
|------|------|------|
| CLAUDE.md | `~/.claude/CLAUDE.md` | 全局指令 |
| MEMORY.md | `~/.claude/projects/xxx/memory/MEMORY.md` | 项目记忆 |
| Skills | `~/.claude/skills/` | 技能目录 |
| Rules | `~/.claude/rules/` | 规则目录 |
| Commands | `~/.claude/commands/` | 流程目录 |
| Hooks | `~/.claude/hooks/` | 钩子目录 |
| Settings | `~/.claude/settings.json` | 配置文件 |

---

## 五、快捷键

| 快捷键 | 作用 |
|--------|------|
| `Ctrl+C` | 中断当前操作 |
| `Ctrl+D` | 退出会话 |
| `Ctrl+L` | 清屏 |
| `Tab` | 自动补全 |
| `↑/↓` | 历史命令 |

---

**文档版本**：v1.0  
**更新时间**：2026-06-10  
**维护者**：胡志军
