# Harness Engineering: 复用指南

> 换电脑或分享给同事时使用本指南。

**版本**：v1.0.0 | **最后更新**：2026-06-15

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
| `knowledge/rules/workflows/workflows.md` | 工作流触发规则（按需加载） |

### 5. Skills 清单

| Skill | 用途 |
|-------|------|
| `commit` | Git 提交信息生成 |
| `docs` | 文档生成 |
| `sync` | 同步管理 |
| `review` | 代码审查与深度审计 |
| ... | 见 `skills/INDEX.md` |

### 6. 项目初始化

每个项目启动时，需要初始化本地 Memory：

```bash
# 进入项目目录
cd /path/to/your/project

# 检查初始化清单（自动检测缺失项）
cat ~/.claude/docs/PROJECT-INIT-CHECKLIST.md

# 如果缺失 .claude/artifacts/ 等目录，按清单手动创建或自动执行
```

初始化后目录结构：
```
项目根目录/
├── .claude/
│   ├── artifacts/           # Artifact 产物存储
│   │   └── INDEX.md        # 自动维护的产物索引
│   └── rules/              # 项目级规则（可选）

~/.claude/projects/<project-name>/memory/
├── MEMORY.md               # Memory 索引
├── learnings.md            # 经验记录（自动写入）
└── task-state.md           # 任务进度（手动维护）
```

---

## 迁移检查清单

### 环境检查（首次使用）

```bash
# 1. 检查 Node.js
node --version

# 预期输出（版本 >= 18.0.0）：
# v18.17.0
# v20.5.1
# v22.6.0

# 2. 检查 Git
git --version

# 预期输出（版本 >= 2.30.0）：
# git version 2.42.0.windows.1
# git version 2.41.0

# 3. 检查 Claude Code 已启动
claude --version

# 预期输出：
# Claude Code 1.0.x
# 或类似版本号

# 4. 验证 Hook 工作
node ~/.claude/hooks/secret-guard.js < /dev/null

# 预期输出（无错误，正常退出）：
# （无输出或简单日志）
# 确认：echo $?  # 应该返回 0

# 5. 检查规则被加载
ls -la ~/.claude/rules/languages/

# 预期输出（看到 5 个规则文件）：
# total 0
# drwxr-xr-x 1 admin ... .
# drwxr-xr-x 1 admin ... ..
# -rw-r--r-- 1 admin ... csharp.md
# -rw-r--r-- 1 admin ... vue.md
# -rw-r--r-- 1 admin ... javascript.md
# -rw-r--r-- 1 admin ... postgresql.md
# -rw-r--r-- 1 admin ... sqlserver.md
```

### 完整验证脚本

```bash
#!/bin/bash
echo "=== Harness Engineering 环境检查 ==="

echo -e "\n1. Node.js 版本："
node --version

echo -e "\n2. Git 版本："
git --version

echo -e "\n3. Claude Code 版本："
claude --version

echo -e "\n4. 检查关键目录："
for dir in hooks skills rules docs; do
  if [ -d ~/.claude/$dir ]; then
    echo "✅ ~/.claude/$dir 存在"
  else
    echo "❌ ~/.claude/$dir 不存在"
  fi
done

echo -e "\n5. 检查关键文件："
for file in CLAUDE.md settings.example.json; do
  if [ -f ~/.claude/$file ]; then
    echo "✅ ~/.claude/$file 存在"
  else
    echo "❌ ~/.claude/$file 不存在"
  fi
done

echo -e "\n=== 检查完成 ==="
```

**预期输出**：
```
=== Harness Engineering 环境检查 ===

1. Node.js 版本：
v20.5.1

2. Git 版本：
git version 2.42.0.windows.1

3. Claude Code 版本：
Claude Code 1.0.20

4. 检查关键目录：
✅ ~/.claude/hooks 存在
✅ ~/.claude/skills 存在
✅ ~/.claude/rules 存在
✅ ~/.claude/docs 存在

5. 检查关键文件：
✅ ~/.claude/CLAUDE.md 存在
✅ ~/.claude/settings.example.json 存在

=== 检查完成 ===
```

### 权限检查（Windows 用户）

```bash
# 如果 Hook 不执行，检查权限
icacls ~/.claude/hooks/*.js /grant %USERNAME%:F

# 如果 PowerShell 脚本不运行，修改执行策略
powershell -ExecutionPolicy RemoteSigned -Command "..."
```

### 路径替换（重要！）

克隆后必须替换所有硬编码路径：

| 原路径 | 替换为 |
|--------|--------|
| `C:/Users/admin/` | 你的用户主目录，如 `C:/Users/zhangsan/` |
| `F:\OTD Code WorkSpace` | 你的项目工作区路径 |
| `SA2687890878` | 你的 GitHub 用户名 |

文件列表：
- `~/.claude/CLAUDE.md`
- `~/.claude/hooks/session-start.js`
- `~/.claude/hooks/project-knowledge.js`
- `~/.claude/hooks/artifact-index-update.js`
- `~/.claude/docs/SETUP.md`

---

## 常见问题排查

### 问题 1：Hook 无法执行

**症状**：修改代码后没有自动检查

**排查步骤**：
```bash
# 1. 检查 settings.json 路径
cat ~/.claude/settings.json | grep -i "hook"

# 2. 手动测试 Hook
echo '{"tool": "Write", "params": {"file_path": "test.cs"}}' | \
  node ~/.claude/hooks/cs-guard.js

# 3. 检查错误日志
tail -100 ~/.claude/hooks/.log  # 如果有日志文件
```

### 问题 2：Skills 找不到

**症状**：输入 `/sync` 无反应

**排查步骤**：
```bash
# 1. 检查 skills 目录
ls ~/.claude/skills/sync/

# 2. 检查 SKILL.md 格式
cat ~/.claude/skills/sync/SKILL.md | head -10

# 3. 检查 INDEX.md 注册
grep -n "sync" ~/.claude/skills/INDEX.md
```

### 问题 3：Memory 不保存

**症状**：learnings.md 没有新增记录

**排查步骤**：
```bash
# 1. 检查 Memory 目录是否存在
ls -la ~/.claude/projects/C--Users-admin--claude/memory/

# 2. 检查 learnings.md 权限
chmod 666 ~/.claude/projects/C--Users-admin--claude/memory/learnings.md

# 3. 检查 learning-recorder.js 是否存在
ls ~/.claude/hooks/learning-recorder.js
```

### 问题 4：路径转换错误

**症状**：项目路径识别错误

**排查步骤**：
```bash
# 路径转换规则：C:\Users\admin → C--Users-admin
# 验证：
projectPath=$(pwd | sed 's|:|/|g; s|[/\\]|-|g')
echo "Expected memory path: ~/.claude/projects/$projectPath/memory/"
```

---

## 分享给同事

如果要分享此配置：

1. **公开部分**（可上传 GitHub）
   - `~/.claude/` 除了 `settings.json`
   - `~/.claude/docs/`
   - `~/.claude/hooks/`
   - `~/.claude/skills/`
   - `~/.claude/rules/`

2. **私密部分**（不上传）
   - `settings.json`（含 API Token）
   - `~/.claude/projects/`（项目级数据）
   - `~/.claude/metrics/`（度量数据）

3. **分享方式**
   ```bash
   # 创建 .gitignore
   echo "settings.json
   projects/
   metrics/
   *.swp" >> ~/.claude/.gitignore
   
   # 上传到 GitHub
   cd ~/.claude
   git remote add origin https://github.com/YOUR-USERNAME/claude-config.git
   git push -u origin main
   ```

4. **同事如何使用**
   - 同事克隆你的配置
   - 复制 `settings.example.json` → `settings.json`
   - 填入自己的 API Token
   - 替换所有硬编码路径

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
| 2026-06-15 | 3.1 | 补完迁移指南：初始化、检查清单、排查步骤、分享指南 |
| 2026-06-11 | 3.0 | 兼容 Harness Engineering v3.0 配置体系 |
