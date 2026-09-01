# Harness Engineering: settings.json 配置指南

> 配置示例与维护参考，不代表当前运行配置。当前 Hook/模型/权限以 `settings.json` 实际内容为准；先读 `docs/CURRENT-STATUS.md`。

**版本**：v1.0.0 | **最后更新**：2026-06-15

---

## 文件位置

```
~/.claude/settings.json          # 主配置文件（不提交 git）
~/.claude/settings.example.json  # 配置示例（可提交 git）
```

---

## 核心字段说明

### 1. 认证信息（必填）

```json
{
  "ANTHROPIC_AUTH_TOKEN": "your-api-token-here",
  "ANTHROPIC_BASE_URL": "https://api.anthropic.com"
}
```

| 字段 | 说明 | 必填 | 示例 |
|------|------|------|------|
| `ANTHROPIC_AUTH_TOKEN` | API Token，从 Anthropic 控制台获取 | ✅ | `sk-ant-xxx` |
| `ANTHROPIC_BASE_URL` | API 地址，使用官方 API 无需修改 | ✅ | `https://api.anthropic.com` |

---

### 2. 模型配置

```json
{
  "model": "claude-sonnet-4-6-20250514",
  "max_tokens": 200000,
  "temperature": 0
}
```

| 字段 | 说明 | 默认值 | 建议 |
|------|------|--------|------|
| `model` | 使用的 Claude 模型 | `claude-sonnet-4-6-20250514` | 保持默认，除非有特殊需求 |
| `max_tokens` | 最大输出 token 数 | 200000 | 保持默认 |
| `temperature` | 温度参数（0-1） | 0 | 代码生成建议 0，创意任务可调高 |

---

### 3. Hooks 配置（核心）

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/hooks/session-start.js",
            "timeout": 10
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/hooks/secret-guard.js",
            "timeout": 5
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/hooks/cs-guard.js",
            "timeout": 10
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/hooks/build-verify.js",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

#### Hook 配置字段

| 字段 | 说明 | 示例 |
|------|------|------|
| `hooks.SessionStart` | 会话启动时执行 | 加载 git 状态、检测项目 |
| `hooks.UserPromptSubmit` | 用户输入时执行 | 自动路由、注入规则 |
| `hooks.PreToolUse` | 工具调用前执行 | 安全检查、拦截危险操作 |
| `hooks.PostToolUse` | 工具调用后执行 | 语法检查、质量检查 |
| `hooks.Stop` | 会话结束时执行 | 编译验证、度量报告 |

#### Hook 配置结构

```json
{
  "matcher": "Write|Edit",      // 匹配哪些工具（正则）
  "hooks": [
    {
      "type": "command",        // 类型：command
      "command": "node ~/.claude/hooks/xxx.js",  // 执行命令
      "timeout": 10             // 超时秒数
    }
  ]
}
```

#### Matcher 正则示例

| Matcher | 匹配工具 |
|---------|---------|
| `Write|Edit` | Write 和 Edit 工具 |
| `Bash` | Bash 工具 |
| `.*` | 所有工具 |
| `Write` | 仅 Write 工具 |
| `Write|Edit|Glob|Grep` | 多个工具 |

---

### 4. 权限配置

```json
{
  "permissions": {
    "Bash": "allow",
    "Write": "allow",
    "Edit": "allow",
    "Read": "allow"
  }
}
```

| 字段 | 说明 | 选项 |
|------|------|------|
| `permissions.Bash` | Bash 命令权限 | `allow` / `deny` / `ask` |
| `permissions.Write` | 文件写入权限 | `allow` / `deny` / `ask` |
| `permissions.Edit` | 文件编辑权限 | `allow` / `deny` / `ask` |
| `permissions.Read` | 文件读取权限 | `allow` / `deny` / `ask` |

**建议**：
- 开发环境：全部 `allow`
- 生产环境：`Bash` 设为 `ask`，其他 `allow`

---

### 5. 项目特定配置

如果项目有自己的 `.claude/settings.json`，会覆盖全局配置：

```
项目根目录/
├── .claude/
│   ├── settings.json      # 项目级配置（覆盖全局）
│   └── rules/             # 项目级规则
└── CLAUDE.md              # 项目级指令
```

**优先级**：
```
项目级 .claude/settings.json > 全局 ~/.claude/settings.json
```

---

## 完整配置示例

```json
{
  "ANTHROPIC_AUTH_TOKEN": "sk-ant-xxxxxxxxxx",
  "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
  "model": "claude-sonnet-4-6-20250514",
  "max_tokens": 200000,
  "temperature": 0,
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/hooks/session-start.js",
            "timeout": 10
          },
          {
            "type": "command",
            "command": "node ~/.claude/hooks/project-knowledge.js",
            "timeout": 5
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/hooks/skill-router.js",
            "timeout": 5
          },
          {
            "type": "command",
            "command": "node ~/.claude/hooks/context-injector.js",
            "timeout": 5
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/hooks/secret-guard.js",
            "timeout": 5
          },
          {
            "type": "command",
            "command": "node ~/.claude/hooks/write-guard.js",
            "timeout": 5
          },
          {
            "type": "command",
            "command": "node ~/.claude/hooks/encrypted-write-guard.js",
            "timeout": 5
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/hooks/bash-guard.js",
            "timeout": 5
          },
          {
            "type": "command",
            "command": "node ~/.claude/hooks/commit-gate.js",
            "timeout": 10
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/hooks/cs-guard.js",
            "timeout": 10
          },
          {
            "type": "command",
            "command": "node ~/.claude/hooks/quality-guard.js",
            "timeout": 10
          },
          {
            "type": "command",
            "command": "node ~/.claude/hooks/test-reminder.js",
            "timeout": 5
          },
          {
            "type": "command",
            "command": "node ~/.claude/hooks/sqlite-index-update.js",
            "timeout": 10
          },
          {
            "type": "command",
            "command": "node ~/.claude/hooks/learning-recorder.js",
            "timeout": 5
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/hooks/build-verify.js",
            "timeout": 30
          },
          {
            "type": "command",
            "command": "node ~/.claude/hooks/metrics-report.js",
            "timeout": 10
          }
        ]
      }
    ]
  },
  "permissions": {
    "Bash": "allow",
    "Write": "allow",
    "Edit": "allow",
    "Read": "allow"
  }
}
```

---

## 常见配置场景

### 场景 1：禁用某个 Hook

从 settings.json 中删除对应的 hook 条目即可：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/hooks/cs-guard.js",
            "timeout": 10
          }
          // 删除 test-reminder.js，就禁用了测试提醒
        ]
      }
    ]
  }
}
```

### 场景 2：为项目单独配置

在项目根目录创建 `.claude/settings.json`：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/hooks/custom-project-hook.js",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

**效果**：该项目使用项目级 hook，全局 hook 仍然生效

### 场景 3：临时禁用所有 Hook

```bash
# 临时禁用（不影响 settings.json）
export CLAUDE_HOOKS_DISABLED=true

# 恢复
unset CLAUDE_HOOKS_DISABLED
```

### 场景 4：切换 API 地址

```json
{
  "ANTHROPIC_AUTH_TOKEN": "your-token",
  "ANTHROPIC_BASE_URL": "https://your-proxy.com/api"
}
```

---

## 调试配置

### 1. 查看 Hook 执行日志

Hook 默认输出到 stderr，可以在 Claude Code 中看到：

```bash
# Hook 输出格式
[HookName] 信息内容

# 示例
[secret-guard] ⚠️ 检测到可能的密钥：sk-ant-xxx
[cs-guard] ✅ C# 语法检查通过
[quality-guard] ⚠️ 发现 SQL 注入风险
```

### 2. 手动测试 Hook

```bash
# 测试单个 Hook
echo '{"tool": "Write", "params": {"file_path": "test.cs"}}' | \
  node ~/.claude/hooks/cs-guard.js

# 测试所有 Write 相关的 Hook
for hook in secret-guard write-guard encrypted-write-guard; do
  echo "Testing $hook..."
  echo '{"tool": "Write", "params": {"file_path": "test.cs"}}' | \
    node ~/.claude/hooks/$hook.js
done
```

### 3. Hook 超时配置

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/hooks/cs-guard.js",
            "timeout": 10  // 10 秒超时
          }
        ]
      }
    ]
  }
}
```

**超时建议**：
- 简单检查（secret-guard、write-guard）：5 秒
- 语法检查（cs-guard）：10 秒
- 构建验证（build-verify）：30 秒
- 复杂分析（quality-guard）：15 秒

### 4. 日志文件

```bash
# Hook 默认不写入文件
# 如果需要日志，修改 Hook 脚本添加文件写入

# 示例：在 Hook 中添加日志
const fs = require('fs');
const logFile = '~/.claude/hooks.log';

// 在 Hook 处理逻辑中
fs.appendFileSync(logFile, `[${new Date().toISOString()}] Hook 执行\n`);
```

### 5. 调试模式

如果需要详细调试信息，可以在 Hook 脚本中添加：

```javascript
// 在 Hook 脚本开头添加
const DEBUG = process.env.CLAUDE_HOOK_DEBUG === 'true';

if (DEBUG) {
  console.error(`[HookName] 输入数据: ${JSON.stringify(input)}`);
}

// ... 处理逻辑 ...

if (DEBUG) {
  console.error(`[HookName] 输出结果: ${JSON.stringify(result)}`);
}
```

然后设置环境变量：
```bash
export CLAUDE_HOOK_DEBUG=true
```

---

## 验证配置

### 检查配置是否生效

```bash
# 1. 检查文件内容
cat ~/.claude/settings.json

# 2. 手动测试 Hook
echo '{"tool": "Write", "params": {"file_path": "test.cs"}}' | \
  node ~/.claude/hooks/secret-guard.js

# 3. 在 Claude Code 中验证
# 启动 Claude Code，应该看到：
# - SessionStart hook 输出
# - git 状态
# - 项目检测信息
```

### 检查 Hook 是否执行

```bash
# 在 Claude Code 中执行操作
# 观察 stderr 输出（hook 的用户可见信息）

# 如果 Hook 没有执行：
# 1. 检查 settings.json 中路径是否正确
# 2. 检查 Node.js 是否安装：node --version
# 3. 检查 Hook 文件是否有语法错误
```

---

## 安全最佳实践

### 1. Token 安全

**推荐方式**：使用环境变量

```bash
# Windows
set ANTHROPIC_AUTH_TOKEN=sk-ant-xxxxxxxxxx

# Linux/Mac
export ANTHROPIC_AUTH_TOKEN=sk-ant-xxxxxxxxxx
```

然后在 settings.json 中引用：
```json
{
  "ANTHROPIC_AUTH_TOKEN": "${ANTHROPIC_AUTH_TOKEN}"
}
```

**为什么**：
- Token 不会出现在配置文件中
- 不会被意外提交到 git
- 可以通过环境变量管理多个 Token

### 2. 配置文件保护

```bash
# 1. 确保 .gitignore 包含
echo "settings.json" >> ~/.claude/.gitignore

# 2. 设置文件权限（仅所有者可读写）
chmod 600 ~/.claude/settings.json

# 3. 定期审查配置
cat ~/.claude/settings.json  # 检查是否有敏感信息
```

### 3. 权限最小化原则

**开发环境**（信任）：
```json
{
  "permissions": {
    "Bash": "allow",
    "Write": "allow",
    "Edit": "allow",
    "Read": "allow"
  }
}
```

**生产环境**（谨慎）：
```json
{
  "permissions": {
    "Bash": "ask",      // 需要确认
    "Write": "allow",
    "Edit": "allow",
    "Read": "allow"
  }
}
```

### 4. Token 使用审计

```bash
# 查看 Token 消耗
/cost

# 定期检查（避免 Token 浪费）
# 如果发现异常消耗，检查是否有死循环或重复操作
```

### 5. 多环境配置

```bash
# 开发环境配置
cp ~/.claude/settings.json ~/.claude/settings.dev.json

# 生产环境配置
cp ~/.claude/settings.json ~/.claude/settings.prod.json

# 根据环境切换
export CLAUDE_SETTINGS=~/.claude/settings.dev.json
```

---

## 更新记录

| 日期 | 内容 |
|------|------|
| 2026-06-15 | 初始版本，完整的字段说明和配置示例 |
