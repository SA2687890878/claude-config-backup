# Harness Engineering: 复用指南

> 换电脑或分享给同事时使用本指南。

**版本**：v4.0 | **最后更新**：2026-08-27

---

## 快速复用（3 步）

### 第 1 步：克隆配置仓库
```bash
git clone <你的配置仓库> ~/.claude
```

### 第 2 步：安装依赖
```bash
# RTK（Token 压缩工具，可选）
cargo install rtk

# CodeGraph（代码图谱，可选）
# 见 codegraph 官方文档

# Context-mode（可选）
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

## 系统要求

| 依赖 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | Hook 运行时 |
| Git | 2.30+ | 版本控制 |
| Claude Code | 最新版 | AI 助手 |
| RTK | 0.42+ | Token 压缩（可选） |
| CodeGraph | 最新版 | 代码图谱（可选） |

---

## 目录结构

```
~/.claude/
├── CLAUDE.md              # 全局指令（@注入核心索引）
├── rules/                 # 核心规则（自动加载，6 条）
├── knowledge/             # 知识库（按需加载 + 分层索引）
├── skills/                # 技能（按需调用，28 个）
├── hooks/                 # 钩子（自动触发，20 个）
├── docs/                  # 文档（给人看）
└── projects/              # 项目级数据
```

---

## Hook 清单（当前真实 20 个）

| 文件 | 触发时机 | 功能 |
|------|----------|------|
| `session-start.js` | 会话启动 | 加载项目知识、显示状态 |
| `context-injector.js` | 用户输入 | 按关键词注入相关规则 |
| `skill-router.js` | 用户输入 | 路由到对应 skill |
| `secret-guard.js` | 写文件/Bash 前 | 密钥泄露拦截 |
| `write-guard.js` | 写文件前 | 路径安全检查 |
| `impact-guard.js` | Edit 前 | 修改现有代码提醒 |
| `bash-guard.js` | Bash 前 | Shell 命令安全检查 |
| `git-commit-review.js` | 提交前 | Git 提交审查 |
| `commit-gate.js` | 提交时 | 提交门禁（编译/测试检查） |
| `cs-checks.js` | 写 .cs 后 | C# 语法/风格检查 |
| `build-verify.js` | 会话结束 | 编译 + 测试验证，失败阻断 |
| `failure-detector.js` | 工具返回 | 检测失败模式 |
| `metrics-collector.js` | 工具返回 | 收集指标 |
| `metrics-report.js` | 会话结束 | 输出指标报告 |
| `index-updater.js` | 变更后 | 更新 SQLite 索引 |
| `project-knowledge.js` | 会话中 | 沉淀项目知识 |
| `knowledge-sync-reminder.js` | 定期 | 提醒同步知识 |
| `completion-reminder.js` | 会话结束 | 完成前提醒 |
| `encrypted-write-guard.js` | 写文件前 | 加密文件写入防护 |
| `notify.ps1` | 通知 | 渠道通知发送 |

> 完整触发配置见 `settings.json` 的 `hooks` 段。

---

## 规则结构

**核心规则**（`rules/`，自动加载，6 条）：
`confidence-reporting` / `rigor-standards` / `gates`（5门禁）/ `verification` / `code-access` / `token-optimization`

**参考规则**（`knowledge/rules/`，按需加载，通过 `rules/INDEX.md` 导航）：
- `code-access/`：indexing（三套索引）、write-rules、decision-tree
- `gates/`：requirement / design / code / test / release / task-contract
- `languages/`：csharp、javascript、postgresql、sqlserver、vue
- `quality/`：constitution（宪法）、checklist（微清单）、review-checklist、hooks-standards
- `token-optimization/`：overview
- `tools/`：rtk、model-strategy、security
- `workflows/`：workflows、knowledge-sync、task-management、artifact-management、git

---

## 项目初始化

每个项目启动时，需要初始化本地 Memory：

```bash
# 进入项目目录
cd /path/to/your/project

# 检查初始化清单（自动检测缺失项）
cat ~/.claude/docs/PROJECT-INIT-CHECKLIST.md
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

# 2. 检查 Git
git --version

# 3. 检查 Claude Code
claude --version

# 4. 验证 Hook 工作
node ~/.claude/hooks/secret-guard.js < /dev/null

# 5. 检查规则被加载
ls ~/.claude/rules/
# 预期看到 6 个核心规则文件
```

### 权限检查（Windows 用户）

```bash
# Hook 不执行时检查权限
icacls ~/.claude/hooks/*.js /grant %USERNAME%:F

# PowerShell 脚本不运行：修改执行策略
powershell -ExecutionPolicy RemoteSigned -Command "..."
```

### 路径替换（重要！）

克隆后必须替换所有硬编码路径：

| 原路径 | 替换为 |
|--------|--------|
| 示例中的用户主目录 | 你的用户主目录 |
| 示例中的项目工作区路径 | 你的项目工作区路径 |
| 示例 GitHub 用户名 | 你的 GitHub 用户名 |

文件列表：
- `~/.claude/CLAUDE.md`
- `~/.claude/hooks/session-start.js`
- `~/.claude/hooks/project-knowledge.js`
- `~/.claude/docs/SETUP.md`

---

## 常见问题排查

### 问题 1：Hook 无法执行

```bash
# 1. 检查 settings.json 路径
cat ~/.claude/settings.json | grep -i "hook"

# 2. 手动测试 Hook
echo '{"tool": "Write", "params": {"file_path": "test.cs"}}' | \
  node ~/.claude/hooks/cs-checks.js

# 3. 检查错误日志
tail -100 ~/.claude/hooks/.log  # 如果有日志文件
```

### 问题 2：Skills 找不到

```bash
# 1. 检查 skills 目录
ls ~/.claude/skills/sync/

# 2. 检查 SKILL.md 格式
cat ~/.claude/skills/sync/SKILL.md | head -10

# 3. 检查 INDEX.md 注册
grep -n "sync" ~/.claude/skills/INDEX.md
```

### 问题 3：Memory 不保存

```bash
# 1. 检查 Memory 目录是否存在
ls -la ~/.claude/projects/<你的项目路径转换>/memory/

# 2. 检查 learnings.md 权限
chmod 666 ~/.claude/projects/<你的项目路径转换>/memory/learnings.md

# 3. 检查 project-knowledge.js 是否存在
ls ~/.claude/hooks/project-knowledge.js
```

---

## 分享给同事

1. **公开部分**（可上传 GitHub）：`~/.claude/` 除 `settings.json` 外全部
2. **私密部分**（不上传）：`settings.json`（含 API Token）、`~/.claude/projects/`、`~/.claude/metrics/`
3. **分享方式**：
   ```bash
   # 创建 .gitignore
   echo "settings.json
   projects/
   metrics/
   *.swp" >> ~/.claude/.gitignore

   # 上传到 GitHub
   cd ~/.claude
   git remote add origin <你的仓库>
   git push -u origin main
   ```
4. **同事使用**：克隆 → 复制 `settings.example.json` → 填 Token → 替换硬编码路径

---

## 常见问题

- **settings.json 为什么不提交？** 含 API Token 敏感信息，用 `settings.example.json` 作模板。
- **路径中的用户名怎么改？** 把示例中的用户主目录改成你的。
- **Hook 不生效？** 检查 settings.json 路径 / Node.js 安装 / `node hooks/xxx.js` 语法。
- **如何禁用某个 Hook？** 从 settings.json 的 `hooks` 中删除对应条目。
- **如何更新配置？** `cd ~/.claude && git pull`

---

## 更新记录

| 日期 | 版本 | 内容 |
|------|------|------|
| 2026-08-27 | 4.0 | 同步真实 hooks/rules 清单；清除不存在 hook 名与硬编码路径 |
| 2026-06-15 | 3.1 | 补完迁移指南 |
| 2026-06-11 | 3.0 | 兼容 Harness Engineering v3.0 |
