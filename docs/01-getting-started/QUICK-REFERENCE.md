# Harness Engineering: 速查表

> 一页纸，快速查找所有命令、Skills、Hooks、工作流

**版本**：v1.0.0 | **最后更新**：2026-06-15

---

## 🚀 快速开始

```bash
# 1. 启动 Claude Code
cd /path/to/your/project
claude

# 2. 新会话自动加载
#    - CLAUDE.md（全局规则）
#    - hooks/（自动防护）
#    - skills/（专业能力）
```

---

## ⌨️ Claude Code 内置命令

### 常用命令

| 命令 | 用途 | 使用场景 |
|------|------|---------|
| `/help` | 显示所有命令 | 忘记命令时 |
| `/clear` | 清空当前会话 | 上下文太长、重新开始 |
| `/compact` | 压缩对话历史 | 上下文接近限制、响应变慢 |
| `/cost` | 查看当前会话 Token 消耗 | 监控 Token 使用 |
| `/status` | 显示系统状态 | 检查配置、Git 状态 |
| `/model` | 切换模型 | 需要不同模型能力时 |

### 历史与导航

| 操作 | 方法 | 说明 |
|------|------|------|
| 查看历史命令 | 按 `↑` 键 | 浏览之前输入过的命令 |
| 搜索历史命令 | 按 `Ctrl+R` | 快速搜索历史 |
| 清空输入 | 按 `Ctrl+U` | 取消当前输入 |
| 退出 Claude | 按 `Ctrl+C` 两次 | 强制退出 |

### 会话管理

| 操作 | 命令 | 说明 |
|------|------|------|
| 保存进度 | `/verification-before-completion` | 保存当前任务状态 |
| 恢复进度 | 输入"继续工作" | 自动加载上次进度 |
| 查看历史会话 | `ls ~/.claude/projects/*/memory/` | 查看所有项目的历史 |

### Token 控制

| 操作 | 方法 | 节省 |
|------|------|------|
| 压缩对话 | `/compact` | ~75% Token |
| 切换压缩模式 | "caveman mode" | ~75% Token |
| 查看消耗 | `/cost` | 监控使用量 |
| 限制输出长度 | 在 CLAUDE.md 中设置 | 自定义 |

---

## 📋 Commands 速查

### 开发类

| 命令 | 用途 | 触发词 |
|------|------|--------|
| `/explore` | 需求探索、技术调研、方案比较 | 讨论、设计、方案、探索 |
| `/build` | 功能开发全流程（设计→编码→测试） | 开发、添加、实现、构建 |
| `/operate` | 问题排查、根因分析、性能调优 | 修复、bug、报错、排查 |

### 测试与审查

| 命令 | 用途 | 触发词 |
|------|------|--------|
| `/review` | 多维度代码审查 | 审查、review、找 bug、审计 |
| `/test` | 测试执行、失败修复 | 测试、跑测试、生成测试 |

### 设计与架构

| 命令 | 用途 | 触发词 |
|------|------|--------|
| `/requirements` | 需求分析、需求澄清 | 需求分析、需求澄清 |
| `/research` | 深度调研报告 | 调研、竞品分析、技术选型 |
| `/arch-review` | 架构设计审查 | 架构审查、架构设计 |
| `/sql-best-practices` | SQL 最佳实践 | 数据库、表、字段 |

### 通用操作

| 命令 | 用途 | 触发词 |
|------|------|--------|
| `/commit` | Git 提交与工作空间管理 | 提交、commit、push |
| `/docs` | 文档生成 | 文档、doc、说明 |
| `/sync` | 同步管理 | 同步、刷新索引、同步经验 |
| `/systematic-debugging` | 系统化调试流程 | 调试、排查、定位 |
| `/perf-tune` | 性能诊断与优化 | 性能、调优、优化 |
| `/dev-workflow` | 写计划→执行→验证→提交 | 开发工作流 |
| `/verification-before-completion` | 完成前检查 | 验证、完成前检查 |
| `/skill-manager` | 技能注册与管理 | 技能管理、skills |

---

## 🔄 Skills 速查

| Skill | 触发 | 输入 | 输出产物 |
|----------|------|-----------|---------|
| requirements + research | `/explore` 或 "讨论" | requirements | Requirement.md, Decision.md |
| arch-review + dev-workflow + review + test | `/build` 或 "开发" | arch-review, review, dev-workflow, test | Architecture.md, Design.md, Code, TestPlan.md |
| systematic-debugging + perf-tune | `/operate` 或 "修复" | systematic-debugging, perf-tune | RCA.md, Improvement.md |

---

## 🛡️ Quality Gates 速查

```
Requirement Gate（需求探索后）
  → 检查：完整性、无歧义、可验收
  → 通过条件：所有检查项通过

Design Gate（设计完成后）
  → 检查：满足需求、可扩展、风险
  → 通过条件：架构审查通过

Code Gate（编码完成后）
  → 检查：编译通过、审查通过
  → 通过条件：编译 0 错误 + 无 CRITICAL/HIGH 问题

Test Gate（测试完成后）
  → 检查：测试通过、覆盖率、回归
  → 通过条件：所有测试通过

Release Gate（发布前）
  → 检查：风险评估、回滚方案
  → 通过条件：所有检查项通过
```

---

## 🪝 Hooks 速查

### SessionStart（会话启动）

| Hook | 功能 |
|------|------|
| session-start.js | git 状态 + 项目检测 + task-state 恢复 + 初始化检测 |
| project-knowledge.js | 加载项目 learnings.md |
| knowledge-sync-reminder.js | Memory → Knowledge 同步提醒 |

### UserPromptSubmit（用户输入）

| Hook | 功能 |
|------|------|
| skill-router.js | 自动路由到对应 skill |
| context-injector.js | 智能注入 git/token/security 规则 |

### PreToolUse（工具调用前）

| Hook | 功能 |
|------|------|
| secret-guard.js | 拦截硬编码密钥 |
| write-guard.js | 拦截主目录垃圾文件 |
| bash-guard.js | Bash 命令安全检查 |
| commit-gate.js | 提交前强制编译和测试验证 |
| encrypted-write-guard.js | 加密文件写入防护 |
| impact-guard.js | 修改前提示查看调用链 |

### PostToolUse（工具调用后）

| Hook | 功能 |
|------|------|
| cs-guard.js | C# 语法检查 |
| quality-guard.js | SQL 注入/null 安全/资源释放检查 |
| logic-guard.js | 逻辑错误检查 |
| vue-guard.js | Vue 代码检查 |
| test-reminder.js | 提示运行测试 |
| sqlite-index-update.js | 自动增量更新 SQLite 索引 |
| git-commit-review.js | 阻止 force push、密钥泄露 |
| review-trigger.js | 代码审查提醒 |
| artifact-index-update.js | 自动更新 Artifact INDEX.md |
| learning-recorder.js | 记录修改到 learnings.md |
| metrics-collector.js | 只记录高成本/质量工具 |

### Stop（会话结束）

| Hook | 功能 |
|------|------|
| build-verify.js | 编译验证报告（非阻断） |
| metrics-report.js | 输出简化的度量报告 |
| notify.ps1 | Windows Toast 通知 |

---

## ⚡ Skills 速查

### 按类别

**需求类**
| Skill | 用途 |
|-------|------|
| `/requirements` | 需求质询、用户故事 |

**设计类**
| Skill | 用途 |
|-------|------|
| `/arch-review` | 架构审查 |
| `/sql-best-practices` | SQL 最佳实践 |

**开发类**
| Skill | 用途 |
|-------|------|
| `/dev-workflow` | 计划→执行→验证→提交 |
| `/review` | 代码审查与深度审计 |

**测试类**
| Skill | 用途 |
|-------|------|
| `/test` | 测试管理（自动判断生成还是执行） |

**调试类**
| Skill | 用途 |
|-------|------|
| `/systematic-debugging` | 四阶段调试流程 |
| `/perf-tune` | 性能诊断与优化 |

**同步类**
| Skill | 用途 |
|-------|------|
| `/sync` | 同步管理（自动判断同步内容） |

**通用类**
| Skill | 用途 |
|-------|------|
| `/docs` | 项目/功能/问题文档生成 |
| `/commit` | Git 提交与工作空间管理 |
| `/verification-before-completion` | 验证与进度保存 |
| `/skill-manager` | 技能注册与管理 |

---

## 📊 Token 节省速查

| 机制 | 节省率 | 使用方式 |
|------|--------|---------|
| RTK 代理 | ~61% | 自动生效（Bash 输出压缩） |
| SQLite 符号索引 | ~95% | `search.ps1 -Query "pattern"` |
| context-mode | ~95% | `ctx_search(queries: [...])` |
| Skills 拆分 | ~70% | 核心指令 + references 分离 |
| Hooks 自动化 | ~30% | 确定性验证不交给 AI |

---

## 🗺️ 常用工作流

### 新功能开发（1-2 小时）

```
/explore → /arch-review → /build → /commit
    ↓           ↓          ↓        ↓
Requirement  Architecture  Code    Git
    .md          .md        +Tests
```

### Bug 修复（30 分钟-1 小时）

```
/operate → /review → /commit
    ↓          ↓          ↓
   RCA.md  修复建议    Git commit
```

### 代码审查（15-30 分钟）

```
/review
    ↓
审查报告 + 修复建议
```

---

## 🔧 常用操作

### 查看配置

```bash
# 查看当前 Skills
ls ~/.claude/skills/

# 查看 Skills 索引
cat ~/.claude/skills/INDEX.md

# 查看 Hooks
ls ~/.claude/hooks/

# 查看 Rules（按需加载）
cat ~/.claude/knowledge/rules/INDEX.md
```

### 项目初始化

```bash
# 检查初始化清单
cat ~/.claude/docs/PROJECT-INIT-CHECKLIST.md

# 如果缺失，手动创建
mkdir -p .claude/artifacts
```

### 经验同步

```bash
# 查看未同步的经验
cat ~/.claude/projects/<project>/memory/learnings.md | grep -v "已同步"

# 同步到知识库
/sync
```

### Token 节省

```bash
# 查看 Token 使用
/status

# 切换压缩模式
caveman mode
```

---

## 🐛 常见问题

### Hook 不工作？

```bash
# 检查 Hook 路径
cat ~/.claude/settings.json | grep -i "hook"

# 手动测试 Hook
echo '{"tool": "Write", "params": {"file_path": "test.cs"}}' | \
  node ~/.claude/hooks/cs-guard.js
```

### Skill 找不到？

```bash
# 检查 Skill 目录
ls ~/.claude/skills/sync/

# 检查 INDEX.md 注册
grep -n "sync" ~/.claude/skills/INDEX.md
```

### Memory 不保存？

```bash
# 检查目录
ls -la ~/.claude/projects/C--Users-admin--claude/memory/

# 检查权限
chmod 666 ~/.claude/projects/C--Users-admin--claude/memory/learnings.md
```

---

## 🚨 紧急情况处理

### 情况 1：Hook 导致 Claude 崩溃

**症状**：Claude 无法启动或频繁崩溃

**解决方案**：
```bash
# 1. 临时禁用所有 Hook
# 在 settings.json 中注释掉 hooks 配置
# 或设置环境变量
export CLAUDE_HOOKS_DISABLED=true

# 2. 启动 Claude Code
claude

# 3. 逐个启用 Hook，找出问题 Hook
# 编辑 settings.json，只启用一个 Hook
# 测试是否正常
# 重复直到找出问题 Hook

# 4. 修复或删除问题 Hook
```

### 情况 2：配置错误无法启动

**症状**：Claude 启动时报配置错误

**解决方案**：
```bash
# 1. 恢复默认配置
cp ~/.claude/settings.example.json ~/.claude/settings.json

# 2. 逐步添加自定义配置
# 每次只添加一个字段
# 测试是否正常

# 3. 找出有问题的字段
```

### 情况 3：Token 用尽

**症状**：Claude 提示 Token 限制

**解决方案**：
```bash
# 1. 查看当前消耗
/cost

# 2. 压缩对话
/compact

# 3. 如果还是不够，保存进度后重新开始
/verification-before-completion
# 然后重新启动 Claude
```

### 情况 4：Git 状态混乱

**症状**：Git 操作失败、冲突

**解决方案**：
```bash
# 1. 查看当前状态
git status

# 2. 如果有未提交的改动
git stash

# 3. 如果有冲突
git merge --abort

# 4. 重新操作
```

### 情况 5：权限问题

**症状**：Permission denied、无法写入文件

**解决方案**：
```bash
# 1. 检查文件权限
ls -la ~/.claude/

# 2. 修复权限（Windows）
icacls ~/.claude/ /grant %USERNAME%:F /T

# 3. 修复权限（Linux/Mac）
chmod -R 755 ~/.claude/
```

---

## 📚 更多信息

| 文档 | 用途 |
|------|------|
| [HARNESS-ENGINEERING.md](HARNESS-ENGINEERING.md) | 理念与设计 |
| [USAGE.md](USAGE.md) | 日常使用指南 |
| [SETUP.md](SETUP.md) | 复用与迁移指南 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 系统架构图 |
| [HOOKS.md](HOOKS.md) | Hook 工作原理 |
| [TOKEN-SAVINGS.md](TOKEN-SAVINGS.md) | Token 节省机制 |

---

**最后更新**：2026-06-15
