# Harness Engineering 复用指南

> 换电脑或分享给同事时使用本指南。

---

## 快速复用（3 步）

### 第 1 步：克隆配置仓库

```bash
git clone https://github.com/SA2687890878/claude-config-backup.git ~/.claude
```

### 第 2 步：安装依赖

```bash
# RTK（Token 压缩工具）
cargo install rtk

# CodeGraph（代码图谱）
# 见 codegraph 官方文档

# Context-mode
# 见 context-mode 官方文档
```

### 第 3 步：创建 settings.json

```bash
# 复制示例文件
cp ~/.claude/settings.example.json ~/.claude/settings.json

# 编辑填入你的配置
# - ANTHROPIC_AUTH_TOKEN：你的 API Token
# - ANTHROPIC_BASE_URL：你的 API 地址
# - 路径中的用户名改成你的
```

---

## 详细步骤

### 1. 系统要求

| 依赖 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | Hook 运行时 |
| Git | 2.30+ | 版本控制 |
| Claude Code | 最新版 | AI 助手 |
| RTK | 0.42+ | Token 压缩（可选） |
| CodeGraph | 最新版 | 代码图谱（可选） |

### 2. 目录结构

```
~/.claude/
├── CLAUDE.md              # 全局指令
├── RTK.md                 # RTK 说明
├── settings.json          # 配置（不提交，含 Token）
├── settings.example.json  # 配置示例（提交）
├── commands/              # 工作流命令
├── rules/                 # 全局规则
├── hooks/                 # Hook 脚本
├── skills/                # 技能定义
├── docs/                  # 文档
└── memory/                # 持久记忆（项目级）
```

### 3. Hook 清单

| Hook | 文件 | 触发时机 | 功能 |
|------|------|----------|------|
| Secret Guard | `hooks/secret-guard.js` | 写文件/Bash 前 | 密钥泄露检测 |
| Write Guard | `hooks/write-guard.js` | 写文件前 | 路径安全检查 |
| Impact Guard | `hooks/impact-guard.js` | Edit 前 | 修改现有代码提醒 |
| CS Guard | `hooks/cs-guard.js` | 写 .cs 后 | C# 语法检查 |
| Quality Guard | `hooks/quality-guard.js` | 写 .cs 后 | C# 最佳实践检查 |
| Build Guard | `hooks/build-guard.js` | 写 .cs 后 | 构建提示 |
| RTK Wrapper | `hooks/rtk-wrapper.js` | Bash 前 | Token 压缩 |

### 4. 规则清单

| 文件 | 用途 |
|------|------|
| `rules/languages/csharp.md` | C# 编码规范 |
| `rules/workflows/git.md` | Git 提交规范 |
| `rules/tools/security.md` | 安全规则 |
| `rules/tools/token-optimization.md` | Token 优化规则 |
| `rules/workflows/workflows.md` | 工作流触发规则 |

### 5. Skills 清单

| Skill | 用途 |
|-------|------|
| `commit` | Git 提交信息生成 |
| `docs` | 文档生成 |
| `memory-save` | 经验保存 |
| `dotnet-review` | .NET 代码审查 |
| `security-scan` | 安全扫描 |
| ... | 见 `skills/` 目录 |

---

## 项目级配置

每个项目可以在项目根目录创建 `.claude/` 目录：

```
项目根目录/
├── .claude/
│   ├── settings.json      # 项目级权限
│   └── rules/             # 项目级规则
│       └── safe-modification.md
└── CLAUDE.md              # 项目级指令
```

---

## 自定义 Hook

### 创建新 Hook

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
    // 你的逻辑
    console.error('[My Hook] 警告信息');  // 用户可见
  } catch (e) { }
});
```

### 注册 Hook

编辑 `settings.json`，在 `hooks` 中添加：

```json
{
  "matcher": "Write|Edit",
  "hooks": [
    { "type": "command", "command": "node ~/.claude/hooks/my-hook.js", "timeout": 10 }
  ]
}
```

---

## 常见问题

### Q: settings.json 为什么不提交？

A: 因为包含 API Token 等敏感信息。使用 `settings.example.json` 作为模板。

### Q: 路径中的用户名怎么改？

A: 把 `C:/Users/admin/` 改成你的用户名路径，如 `C:/Users/zhangsan/`。

### Q: Hook 不生效怎么办？

A: 检查：
1. `settings.json` 中路径是否正确
2. Node.js 是否安装
3. Hook 文件是否有语法错误：`node hooks/xxx.js`

### Q: 如何禁用某个 Hook？

A: 从 `settings.json` 的 `hooks` 中删除对应条目即可。

### Q: 如何更新配置？

A: ```bash
cd ~/.claude && git pull
```

---

## 更新日志

| 日期 | 内容 |
|------|------|
| 2026-06-07 | 添加 Impact Guard、Quality Guard、Build Guard |
| 2026-06-04 | 初始版本 |

---

## 更新记录

| 日期 | 版本 | 内容 |
|------|------|------|
| 2026-06-11 | 3.0 | 兼容 Harness Engineering v3.0 配置体系 |
