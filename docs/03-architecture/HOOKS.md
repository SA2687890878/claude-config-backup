# Hook 工作原理

> 理解 Hook 的触发时机、执行流程和检查内容。

---

## Hook 类型

| 类型 | 触发时机 | 用途 |
|------|----------|------|
| **SessionStart** | 会话启动时 | 注入 git 状态、项目信息、任务进度 |
| **UserPromptSubmit** | 用户输入时 | 自动路由 workflow、注入规则上下文 |
| **PreToolUse** | 工具执行前 | 拦截危险操作、提醒注意事项 |
| **PostToolUse** | 工具执行后 | 检查代码质量、自动索引更新 |
| **Stop** | 会话结束时 | 编译 + 测试双门禁验证 |

---

## 执行流程

```
会话启动
    │
    └─→ SessionStart: session-start.js
        └─→ 注入 git 状态 + 项目检测 + task-state 恢复

用户输入
    │
    └─→ UserPromptSubmit
        ├─→ inject-git-rules.js: git 关键词 → 注入 git.md
        ├─→ inject-token-rules.js: 代码分析关键词 → 注入 token-optimization.md
        └─→ workflow-router.js: 触发词匹配 → 自动路由到对应 workflow ⭐

Claude 调用工具（Write/Edit）
    │
    ├─→ PreToolUse（执行前）
    │   ├─→ secret-guard.js: 硬编码密钥？→ 阻断
    │   ├─→ write-guard.js: 主目录垃圾文件？→ 阻断
    │   ├─→ impact-guard.js: 修改 .cs？→ 提醒查调用链
    │   └─→ encrypted-write-guard.js: 加密项目？→ 警告
    │
    ├─→ 工具执行
    │
    └─→ PostToolUse（执行后）
        ├─→ cs-guard.js: C# 语法检查
        ├─→ quality-guard.js: SQL 注入/null 安全/资源释放
        ├─→ logic-guard.js: foreach await/字符串判断/Dispose
        ├─→ vue-guard.js: Vue 2/Element UI 检查
        ├─→ test-reminder.js: 提示运行测试
        ├─→ review-trigger.js: 提示运行代码审查
        ├─→ sqlite-index-update.js: 自动增量更新 SQLite 索引 ⭐
        ├─→ learning-recorder.js: 记录修改到 learnings.md ⭐
        ├─→ metrics-collector.js: 记录工具调用统计 ⭐
        └─→ git-commit-review.js: git 操作安全检查（Bash）

会话结束
    │
    └─→ Stop
        ├─→ build-verify.js: dotnet build + test（警告不阻断）
        ├─→ metrics-report.js: 输出度量报告 ⭐
        └─→ notify.ps1: Windows Toast 通知 ⭐
```

---

## Hook 详细说明

### SessionStart

#### session-start.js
- **触发**：会话启动
- **功能**：
  - 注入 git 状态（分支、上次提交、未提交改动数）
  - 项目检测（OTD → PostgreSQL / Code WorkSpace → SQL Server）
  - 任务进度恢复（检查 memory/task-state.md，有未完成任务时注入）

---

### UserPromptSubmit

#### workflow-router.js ⭐
- **触发**：用户输入包含 workflow 触发词
- **功能**：自动注入路由上下文，告诉 LLM 该调用哪个 Skill
- **触发词映射**：
  - 讨论/设计/方案 → /requirements
  - 开发/添加/实现 → /feature-development
  - 修复/bug/报错 → /bug-fix
  - 优化/慢/性能 → /perf-optimize
  - 审查/review → /code-review
  - 测试/跑测试 → /test-runner
  - 数据库/表/字段 → /sql-best-practices
  - 保存经验/进度 → /memory-save
  - 继续工作 → 恢复 task-state.md
  - 提交/commit → /commit
  - 文档/doc → /docs

#### context-injector.js（合并了 inject-git-rules.js、inject-token-rules.js）
- **触发**：用户输入包含 git 命令、token 优化、安全相关关键词
- **功能**：根据关键词自动注入对应的规则文件（knowledge/rules/ 目录）

---

### PreToolUse（执行前）

#### secret-guard.js
- **触发**：Write/Edit/Bash
- **检查**：硬编码密钥、密码、Token、AWS Key、私钥
- **动作**：发现则阻断（exit 2）

#### write-guard.js
- **触发**：Write/Edit
- **检查**：文件路径是否安全
- **动作**：在用户主目录根下创建垃圾文件则阻断

#### impact-guard.js
- **触发**：Edit (*.cs)
- **检查**：是否修改 .cs 文件
- **动作**：提醒查调用链（不阻断）
- **示例**：`[Impact Guard] 正在修改 UserService.cs — 建议先运行 codegraph_callers 查看调用链`

---

### PostToolUse（执行后）

#### cs-guard.js
- **触发**：Write/Edit .cs 文件
- **检查**：花括号匹配、async 无 await、空 catch 块、.Result/.Wait()
- **动作**：发现问题则警告

#### quality-guard.js
- **触发**：Write/Edit .cs 文件
- **检查**：SQL 注入风险、硬编码 IP/端口、Null 安全、资源释放、CancellationToken、异常处理
- **动作**：发现问题则警告

#### test-reminder.js
- **触发**：Write/Edit .cs 文件
- **检查**：向上查找对应的测试项目（*.Tests.csproj）
- **动作**：找到测试项目则提示运行 dotnet test

#### sqlite-index-update.js
- **触发**：Write/Edit .cs 文件（属于已配置的项目根）
- **检查**：向上查找 .csproj 目录确定项目路径
- **动作**：fire-and-forget 后台触发 update.ps1 增量更新 SQLite 索引
- **特点**：不阻塞主流程（detached: true），失败静默处理

#### git-commit-review.js
- **触发**：Bash 命令包含 git commit/push/reset/clean
- **检查**：force push、受保护分支、提交信息中的密钥、跳过钩子、硬重置
- **动作**：输出安全提醒（不阻断）

---

### Stop（会话结束）

#### build-verify.js
- **触发**：会话结束
- **流程**：
  1. `git status --porcelain -- "*.cs"` 找出改动的 .cs 文件
  2. 向上查找 .csproj，逐个 `dotnet build`
  3. 编译通过后，查找测试项目（*.Tests.csproj），运行 `dotnet test`
  4. 编译失败 → 阻断会话结束
  5. 测试失败 → 阻断会话结束
  6. 全部通过 → 提示 commit

---

## 配置位置

Hook 配置在 `settings.json` 的 `hooks` 字段。

### 完整注册表

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "node", "args": ["session-start.js"] }] }
    ],
    "UserPromptSubmit": [
      { "hooks": [
        { "type": "command", "command": "node", "args": ["inject-git-rules.js"] },
        { "type": "command", "command": "node", "args": ["inject-token-rules.js"] },
        { "type": "command", "command": "node", "args": ["workflow-router.js"] }
      ]}
    ],
    "PreToolUse": [
      { "matcher": "Write|Edit", "hooks": [
        { "type": "command", "command": "node", "args": ["secret-guard.js"] },
        { "type": "command", "command": "node", "args": ["write-guard.js"] },
        { "type": "command", "command": "node", "args": ["impact-guard.js"], "if": "Edit(*.cs)" }
      ]}
    ],
    "PostToolUse": [
      { "matcher": "Write|Edit", "hooks": [
        { "type": "command", "command": "node", "args": ["cs-guard.js"], "if": "Write(*.cs)|Edit(*.cs)" },
        { "type": "command", "command": "node", "args": ["quality-guard.js"], "if": "Write(*.cs)|Edit(*.cs)" },
        { "type": "command", "command": "node", "args": ["test-reminder.js"], "if": "Write(*.cs)|Edit(*.cs)" },
        { "type": "command", "command": "node", "args": ["sqlite-index-update.js"], "if": "Write(*.cs)|Edit(*.cs)" }
      ]},
      { "matcher": "Bash", "hooks": [
        { "type": "command", "command": "node", "args": ["git-commit-review.js"] }
      ]}
    ],
    "Stop": [
      { "hooks": [{ "type": "command", "command": "node", "args": ["build-verify.js"] }] }
    ]
  }
}
```

---

## 自定义 Hook

### 创建 Hook 文件

```javascript
#!/usr/bin/env node
/**
 * My Hook (PreToolUse/PostToolUse)
 * 说明：...
 */
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const toolName = input.tool_name || '';

    // 只处理特定工具
    if (toolName !== 'Write' && toolName !== 'Edit') return;

    const filePath = (input.tool_input && input.tool_input.file_path) || '';

    // 你的检查逻辑
    if (有问题) {
      console.error('[My Hook] 警告信息');  // 用户可见
      // process.exit(2);  // 阻断（仅 PreToolUse）
    }
  } catch (e) { }
});
```

### 注册 Hook

在 `settings.json` 的 `hooks` 中添加对应事件和 matcher。

---

## 调试 Hook

```bash
# 模拟输入
echo '{"tool_name":"Write","tool_input":{"file_path":"test.cs","content":"..."}}' | node ~/.claude/hooks/my-hook.js

# 模拟 Bash 输入
echo '{"tool_name":"Bash","tool_input":{"command":"git push --force"}}' | node ~/.claude/hooks/git-commit-review.js
```

Hook 的 stderr 输出会显示给用户，stdout 输出会注入到 Claude 的上下文。

---

## 最佳实践

| 实践 | 说明 |
|------|------|
| **PreToolUse 用于阻断** | 发现严重问题时阻止执行 |
| **PostToolUse 用于警告** | 发现问题时提醒用户 |
| **保持 Hook 快速** | timeout 不要太长 |
| **只检查必要的** | 不要过度检查 |
| **错误处理** | 用 try-catch 包裹逻辑 |
| **加密源码** | PostToolUse 读 tool_input.file_path，向上找 .csproj，后台 spawn PowerShell |

---

## 更新记录

| 日期 | 版本 | 内容 |
|------|------|------|
| 2026-06-11 | 3.0 | 兼容 Harness Engineering v3.0 配置体系 |
