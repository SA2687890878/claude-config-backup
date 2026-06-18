# Claude Code 命令参考

> 基于《Harness Engineering 建设指南》构建的命令体系

---

## 目录

- [一、官方命令](#一官方命令)
- [二、自定义 Commands](#二自定义-commands)
- [三、Skills](#三workflows)
- [四、Agents](#四agents)
- [五、Skills](#五skills)
- [六、Hooks](#六hooks)
- [七、Quality Gates](#七quality-gates)

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
| `-r, --resume [id/name]` | 恢复指定会话 | `claude --resume abc123` |
| `-n, --name <name>` | 给会话命名 | `claude --name my-session` |

### 1.3 模型与权限

| 命令 | 作用 | 示例 |
|------|------|------|
| `--model <model>` | 指定模型 | `claude --model opus` |
| `--effort <level>` | 设置努力级别 | `claude --effort high` |
| `--permission-mode <mode>` | 权限模式 | `claude --permission-mode auto` |

### 1.4 会话内命令

| 命令 | 作用 |
|------|------|
| `/help` | 显示帮助 |
| `/clear` | 清空上下文 |
| `/compact` | 压缩上下文 |
| `/cost` | 显示 token 成本 |
| `/doctor` | 诊断问题 |
| `/memory` | 编辑记忆 |
| `/model` | 切换模型 |
| `/status` | 显示状态 |

---

## 二、自定义 Commands

### 2.1 工作流命令

| 命令 | 说明 | 对应 Skill |
|------|------|--------------|
| `/explore` | 需求探索、技术调研、方案比较 | /explore |
| `/build` | 功能开发全流程 | /build |
| `/operate` | 问题排查、性能调优 | /operate |
| `/review` | 多维度代码审查 | - |
| `/test` | 测试执行、失败修复 | - |
| `/commit` | Git 提交与工作空间管理 | - |

### 2.2 命令格式

```yaml
---
description: 命令描述
allowed-tools: Read, Bash(git:*)
model: sonnet
argument-hint: [参数提示]
---

简洁的指令内容...
```

---

## 三、Skills

### 3.1 技能列表

| Skill | 职责 | 输入 | 输出 |
|--------|------|------|------|------|
| **Explore** | /explore | 需求探索、技术调研 | 问题 | Requirement.md, Decision.md |
| **Build** | /build | 架构设计、功能设计、编码、测试 | Requirement | Architecture.md, Code |
| **Operate** | /operate | 问题排查、日志分析、性能分析 | 故障 | RCA.md, Improvement.md |

### 3.2 技能格式

```javascript
export const meta = {
  name: 'skill-name',
  description: '技能描述',
  phases: [
    { title: 'Phase 1', detail: '阶段描述' },
    { title: 'Phase 2', detail: '阶段描述' },
  ],
}

// 技能逻辑...
```

---

## 四、Agents

### 4.1 角色列表

| 角色 | 文件 | 职责 | 颜色 |
|------|------|------|------|
| **Builder** | builder-agent.md | 设计、开发、测试、代码审查、文档生成 | green |
| **Operator** | operator-agent.md | 排查问题、分析性能、探索代码、分析日志 | red |

### 4.2 角色格式

```yaml
---
name: agent-name
description: 当用户需要...时使用此 agent
model: inherit
color: green
tools: Read, Grep, Glob, Bash, Edit, Write
---

## 何时调用

- **场景 1。** 描述...

**核心职责：**
1. ...

**工作流程：**
1. ...
```

---

## 五、Skills

### 5.1 技能分类

| 分类 | Skills | 数量 |
|------|--------|------|
| **Requirement** | requirements, research | 2 |
| **Design** | arch-review, sql-best-practices | 2 |
| **Coding** | review, dev-workflow | 2 |
| **Testing** | test | 1 |
| **Sync** | sync | 1 |
| **Troubleshooting** | systematic-debugging, perf-tune | 2 |
| **Shared** | docs, commit, verification-before-completion | 3 |
| **总计** | | **14** |

### 5.2 技能格式

```yaml
---
name: skill-name
description: 技能描述
version: 1.0.0
---

# 技能标题

## 路由

| 意图 | 分支 |
|------|------|
| 场景 1 | → A. 分支 1 |
| 场景 2 | → B. 分支 2 |

---

## A. 分支 1

核心流程...

读取 `references/details.md` 了解详细流程。
```

### 5.3 技能目录结构

```
skill-name/
├── SKILL.md           # 核心指令（必需）
└── references/        # 详细材料（可选）
    ├── details-1.md
    └── details-2.md
```

---

## 六、Hooks

### 6.1 Hook 列表

| 事件 | Hook | 功能 |
|------|------|------|
| **SessionStart** | session-start.js | git 状态 + 项目检测 + task-state 恢复 |
| **UserPromptSubmit** | skill-router.js | 自动路由到对应 workflow |
| **UserPromptSubmit** | inject-git-rules.js | 注入 git 规则 |
| **UserPromptSubmit** | inject-token-rules.js | 注入 token 优化规则 |
| **PreToolUse** | secret-guard.js | 拦截硬编码密钥 |
| **PreToolUse** | write-guard.js | 拦截主目录垃圾文件 |
| **PreToolUse** | impact-guard.js | 修改前提示查看调用链 |
| **PostToolUse** | cs-guard.js | C# 语法检查 |
| **PostToolUse** | quality-guard.js | SQL 注入/null 安全/资源释放 |
| **PostToolUse** | test-reminder.js | 提示运行测试 |
| **PostToolUse** | sqlite-index-update.js | 自动增量更新 SQLite 索引 |
| **PostToolUse** | git-commit-review.js | 阻止 force push、密钥泄露 |
| **Stop** | build-verify.js | 编译 + 测试双门禁 |

### 6.2 Hook 格式

```javascript
export default {
  name: 'hook-name',
  description: 'Hook 描述',
  eventType: 'PreToolUse',
  matcher: 'Write|Edit',
  handler: async (context) => {
    // Hook 逻辑
    return { decision: 'approve' | 'block' | 'undefined' }
  }
}
```

---

## 七、Quality Gates

### 7.1 门禁列表

| 门禁 | 时机 | 检查内容 | 通过条件 |
|------|------|---------|---------|
| **Requirement Gate** | 需求探索完成后 | 完整性、无歧义、可验收 | 所有检查项通过 |
| **Design Gate** | 设计完成后 | 满足需求、可扩展、风险 | 所有检查项通过 |
| **Code Gate** | 编码完成后 | 编译通过、审查通过 | 编译+审查通过 |
| **Test Gate** | 测试完成后 | 测试通过、覆盖率、回归 | 所有测试通过 |
| **Release Gate** | 发布前 | 风险评估、回滚方案 | 所有检查项通过 |

### 7.2 门禁定义

详细定义见 `rules/quality/gates.md`

---

## 更新记录

| 日期 | 版本 | 内容 |
|------|------|------|
| 2026-06-11 | 3.0 | 重构为符合《建设指南》的命令体系；新增 Commands/Skills/Agents/Quality Gates |
| 2026-06-10 | 2.0 | 添加 workflow-router 自动路由 |
| 2026-06-04 | 1.0 | 初始版本 |
