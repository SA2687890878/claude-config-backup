# 日常使用指南

> 基于《Harness Engineering 建设指南》构建的配置体系使用说明

---

## 快速开始

### 启动 Claude Code

```bash
cd /你的项目目录
claude
```

Claude 会自动加载：
- `CLAUDE.md`（全局指令）
- `commands/`（斜杠命令）
- `workflows/`（工作流）
- `agents/`（角色）
- `skills/`（技能）
- `rules/`（规则）
- `hooks/`（自动化）

---

## 日常工作流

### 场景 1：开发新功能

```
你：开发一个设备点检功能

Claude：[自动进入构建流程]
  → /build 触发 build.js 工作流
  → Phase 1: 需求探索（requirements skill）
  → Phase 2: 设计（arch-review skill）→ Design Gate
  → Phase 3: 编码（builder-agent）→ Code Gate
  → Phase 4: 测试（test-runner skill）→ Test Gate
  → Phase 5: 验证（verification-before-completion）→ Release Gate
  → 输出：Requirement.md, Architecture.md, Design.md, Code, TestPlan.md
```

**触发词**：开发、添加、实现、构建

**命令**：`/build`

---

### 场景 2：修复 Bug

```
你：这个接口报错了

Claude：[自动进入运维流程]
  → /operate 触发 operate.js 工作流
  → Phase 1: 问题定位（systematic-debugging skill）
  → Phase 2: 根因分析（operator-agent）
  → Phase 3: 修复实施（TDD）
  → Phase 4: 验证闭环（Code Gate + Test Gate）
  → 输出：RCA.md, 修复代码
```

**触发词**：修复、bug、报错、排查

**命令**：`/operate`

---

### 场景 3：讨论设计方案

```
你：讨论一下这个功能的架构

Claude：[进入探索流程]
  → /explore 触发 explore.js 工作流
  → Phase 1: 需求探索（5W1H 分析）
  → Phase 2: 方案设计（2-3 个方案对比）
  → Phase 3: 决策记录
  → 输出：Requirement.md, Decision.md
```

**触发词**：讨论、设计、方案、探索

**命令**：`/explore`

---

### 场景 4：代码审查

```
你：帮我看看这段代码

Claude：[进入审查流程]
  → /review 命令触发
  → 5 个维度并行审查：架构、质量、安全、性能、最佳实践
  → 按严重级别分类：CRITICAL / HIGH / MEDIUM / LOW
  → 输出：审查报告 + 修复建议
```

**触发词**：审查、review

**命令**：`/review`

---

### 场景 5：运行测试

```
你：跑一下测试

Claude：[进入测试流程]
  → /test 命令触发
  → 运行 dotnet test
  → 分析失败原因
  → 修复并验证
  → 输出：测试结果报告
```

**触发词**：测试、跑测试

**命令**：`/test`

---

### 场景 6：提交代码

```
你：提交

Claude：[进入提交流程]
  → /commit 命令触发
  → 分析 git diff
  → 生成符合规范的提交信息
  → 确认后执行提交
```

**触发词**：提交、commit

**命令**：`/commit`

---

## 自动化行为

### 会话启动时

`session-start.js` 自动：
- 检测当前项目（OTD / 旧项目）
- 显示 git 状态摘要
- 检查是否有未完成任务（task-state.md）

### 代码修改时

Hooks 自动执行：
- `cs-guard.js` — C# 语法检查
- `quality-guard.js` — SQL 注入/null 安全/资源释放检查
- `test-reminder.js` — 提示运行测试
- `sqlite-index-update.js` — 自动更新 SQLite 索引

### 会话结束时

`build-verify.js` 自动：
- 检测修改的 .cs 文件
- 运行 dotnet build（编译验证）
- 运行 dotnet test（测试验证）
- 任一失败 → 阻断会话结束

---

## 质量门禁

每个工作流阶段必须通过对应的质量门禁：

| 门禁 | 时机 | 检查内容 |
|------|------|---------|
| **Requirement Gate** | 需求探索完成后 | 完整性、无歧义、可验收 |
| **Design Gate** | 设计完成后 | 满足需求、可扩展、风险 |
| **Code Gate** | 编码完成后 | 编译通过、审查通过 |
| **Test Gate** | 测试完成后 | 测试通过、覆盖率、回归 |
| **Release Gate** | 发布前 | 风险评估、回滚方案 |

**铁律：没有新鲜的验证证据，不许宣称完成。**

---

## Token 节省技巧

| 机制 | 节省率 | 使用方式 |
|------|--------|---------|
| RTK 代理 | ~61% | 自动生效（Bash 输出压缩） |
| SQLite 索引 | ~95% | 用 search.ps1 查符号 |
| Skills 拆分 | ~70% | 核心指令 + references 分离 |
| Hooks 自动化 | ~30% | 确定性验证不交给 AI |

---

## 常见问题

### Q: 如何继续上次未完成的工作？

```
你：继续工作

Claude：[自动恢复]
  → 读取 memory/task-state.md
  → 报告上次进度
  → 询问是否继续
```

### Q: 如何保存当前进度？

```
你：保存进度

Claude：[调用 /verification-before-completion]
  → 保存当前任务状态到 memory/task-state.md
  → 下次会话可恢复
```

### Q: 如何切换到压缩模式？

```
你：caveman mode

Claude：[切换到压缩输出]
  → 删减冠词、填充词、客套话
  → 保持技术精度
  → 节省 ~75% token
```

### Q: 如何查看当前配置状态？

```
你：/status

Claude：[显示状态]
  → 当前项目
  → Git 状态
  → 未完成任务
  → Token 使用情况
```

---

## 更新记录

| 日期 | 版本 | 内容 |
|------|------|------|
| 2026-06-11 | 3.0 | 更新为符合《建设指南》的配置体系；新增 Commands/Workflows/Agents 说明 |
| 2026-06-10 | 2.0 | 添加自动化行为说明 |
| 2026-06-04 | 1.0 | 初始版本 |
