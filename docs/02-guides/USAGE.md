# Harness Engineering: 日常使用指南

> 基于《Harness Engineering 建设指南》构建的配置体系使用说明

**版本**：v1.0.0 | **最后更新**：2026-06-15

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

### 场景 7：同步经验到知识库

```
你：同步经验
或：/sync-knowledge

Claude：[进入知识同步流程]
  → 读取 memory/learnings.md
  → 识别未同步的经验
  → 自动分类：engineering / project / business
  → 用户确认
  → 写入 ~/.claude/knowledge/
  → 标记已同步
  → 输出：同步统计报告
```

**触发词**：同步经验、同步知识、更新知识库

**命令**：`/sync-knowledge`

---

### 场景 8：架构审查

```
你：帮我审查一下这个架构

Claude：[进入架构审查流程]
  → /arch-review 触发 arch-review skill
  → 分析：模块划分、依赖关系、扩展性
  → 评估：性能风险、数据风险、安全风险
  → 输出：架构评审意见 + 改进建议
```

**触发词**：架构审查、架构设计

**命令**：`/arch-review`

---

### 场景 9：性能调优

```
你：这段代码很慢，帮我优化

Claude：[进入性能调优流程]
  → /perf-tune 触发 perf-tune skill
  → Phase 1: 性能诊断（识别瓶颈）
  → Phase 2: 原因分析（为什么慢）
  → Phase 3: 优化方案（具体改进）
  → Phase 4: 验证（对比优化前后）
  → 输出：性能优化报告
```

**触发词**：性能、调优、优化、慢

**命令**：`/perf-tune`

---

### 场景 10：系统化调试

```
你：这个问题很诡异，我不知道怎么定位

Claude：[进入系统化调试流程]
  → /systematic-debugging 触发 systematic-debugging skill
  → Phase 1: 收集信息（症状、环境、复现步骤）
  → Phase 2: 假设推导（可能的原因）
  → Phase 3: 逐个验证（排除法）
  → Phase 4: 根因确认（找到真正的原因）
  → 输出：调试过程 + 最终解决方案
```

**触发词**：调试、排查、定位、问题

**命令**：`/systematic-debugging`

---

## Skills 使用速查表

| Skill | 触发词 | 何时用 |
|-------|--------|--------|
| `/requirements` | 需求分析、需求澄清 | 需求不清楚，需要 5W1H 分析 |
| `/arch-review` | 架构审查、架构设计 | 设计完成，需要审查 |
| `/code-review-workflow` | 代码审查、review | 代码完成，需要多维度审查 |
| `/sql-best-practices` | 数据库、表、字段 | 处理数据库设计或优化 |
| `/dev-workflow` | 开发工作流 | 计划 → 执行 → 验证 → 提交 |
| `/generate-tests` | 生成测试、测试用例 | 需要自动生成测试 |
| `/test-runner` | 跑测试、执行测试 | 执行测试并分析失败 |
| `/systematic-debugging` | 调试、排查、定位 | 问题难以定位 |
| `/perf-tune` | 性能、调优、优化 | 性能有问题 |
| `/docs` | 文档、说明、doc | 生成/更新文档 |
| `/sync-knowledge` | 同步经验、同步知识 | 经验积累够多，需要升级 |
| `/commit` | 提交、commit、push | 代码完成，准备提交 |
| `/verification-before-completion` | 验证、完成前检查 | 任务即将完成 |
| `/adversarial-review` | 对抗审查、找问题 | 快速自动审查，找所有问题 |
| `/skill-manager` | 技能管理、skills | 查找/创建/优化 skills |

---

## 工作流对应表

| 工作流 | 触发方式 | 包含 Skills | 输出产物 | 预期时间 |
|--------|---------|-----------|---------|---------|
| **explore.js** | `/explore` 或 "讨论" | requirements | Requirement.md, Decision.md | 15-30 分钟 |
| **build.js** | `/build` 或 "开发" | arch-review, code-review-workflow, dev-workflow, generate-tests, test-runner | Architecture.md, Design.md, Code, TestPlan.md | 4-8 小时（小功能）<br>1-2 天（中功能）<br>3-5 天（大功能） |
| **operate.js** | `/operate` 或 "修复" | systematic-debugging, perf-tune | RCA.md, Improvement.md | 1-2 小时（简单问题）<br>4-6 小时（复杂问题） |

### 时间估算说明

**explore.js（需求探索）**
- 简单需求（已明确）：15 分钟
- 中等需求（需要讨论）：30 分钟
- 复杂需求（多个方案）：1 小时

**build.js（功能开发）**
- 小功能（1-2 个文件）：4-6 小时
- 中功能（5-10 个文件）：1-2 天
- 大功能（10+ 文件）：3-5 天

**operate.js（问题排查）**
- 简单问题（明显错误）：1-2 小时
- 中等问题（需要调试）：4-6 小时
- 复杂问题（多个因素）：1-2 天

---

---

## 最佳实践

### ✅ DO（推荐做法）

1. **每个功能都探索一遍**
   - 不要跳过 `/explore`
   - 即使你觉得需求很清楚，探索也能发现遗漏
   - 产生的 Requirement.md 是后续所有决策的基础

2. **设计完成后进行架构审查**
   ```
   你：设计完成，请 /arch-review
   ```
   - 在编码前发现架构问题
   - 成本低，收益高

3. **编码完成后立即审查**
   - 代码审查不是最后的防线，而是编码的一部分
   - 及时修复问题，避免后期大返工

4. **每周同步一次经验**
   - `/sync-knowledge` 每周一次
   - 防止经验积压，知识流失

5. **保存进度，记录决策**
   ```
   你：保存进度
   ```
   - 使用 `/verification-before-completion`
   - 更新 memory/task-state.md
   - 长对话可恢复

### ❌ DON'T（避免做法）

1. **不要跳过质量门禁**
   - 不要声称"代码可以运行"就完成了
   - 必须有编译验证、测试验证的证据

2. **不要在一个长对话中做完所有事**
   - Token 会越来越多，推理越来越慢
   - 分场景、分工作流，逐个完成

3. **不要忽视 Hook 的警告**
   - CS Guard 报语法错误，立即修复
   - Quality Guard 报 SQL 注入风险，立即检查
   - Hook 的警告都是真实问题

4. **不要硬编码密钥/Token**
   - Secret Guard 会拦截
   - 即使能通过，也是安全风险

5. **不要直接 Read 整个 .cs 文件**
   - 加密项目中，bash 会读到乱码
   - 用 `search.ps1` 查符号位置
   - 用 `codegraph_node` 查源码

---

## 工作流组合示例

### 小功能开发（1-2 小时）

```
1. 需求澄清
   你：/explore
   输出：Requirement.md

2. 设计
   你：/arch-review
   输出：Architecture.md

3. 编码
   你：/build
   输出：Code + TestPlan.md

4. 提交
   你：/commit
   输出：Git commit
```

### 大功能开发（1-2 天）

```
1. 技术调研
   你：/explore + /sql-best-practices
   输出：Requirement.md + 数据库设计

2. 详细设计
   你：/build
   输出：Architecture.md + Design.md

3. 编码 + 测试
   你：多次 /dev-workflow
   输出：Code + Tests

4. 最终审查
   你：/adversarial-review
   输出：审查报告 + 修复

5. 提交
   你：/commit
   输出：Git commit
```

### Bug 修复流程

```
1. 问题分析
   你：/operate
   输出：RCA.md

2. 代码审查
   你：/code-review-workflow
   输出：审查意见

3. 修复 + 测试
   你：/build
   输出：修复代码 + Tests

4. 提交
   你：/commit
   输出：Git commit
```

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

### Q: Hook 报警，该怎么办？

**SQL 注入风险**
```csharp
// ❌ 错误：字符串拼接
var sql = "SELECT * FROM Users WHERE Id = " + userId;

// ✅ 正确：参数化查询
var users = await _db.Users.Where(u => u.Id == userId).ToListAsync();
```

**Null 安全问题**
```csharp
// ❌ 错误：可能空引用
string name = user.Profile.Name.ToUpper();

// ✅ 正确：判空
string name = user?.Profile?.Name?.ToUpper() ?? "";
```

**资源泄露**
```csharp
// ❌ 错误：未释放资源
var file = File.OpenRead(path);
var content = file.ReadAllBytes();

// ✅ 正确：using 模式
using var file = File.OpenRead(path);
byte[] content = file.ReadAllBytes();
```

### Q: 编译失败怎么办？

**症状**：`dotnet build` 返回退出码 != 0

**处理流程**：
```
1. 查看错误信息
   → 找到具体的编译错误（文件:行号）

2. 分析错误类型
   ├─ 语法错误 → 直接修复
   ├─ 类型错误 → 检查类型转换
   ├─ 缺少引用 → 添加 using 或 NuGet 包
   └─ 其他错误 → 搜索错误信息

3. 修复并验证
   → 再次运行 dotnet build

4. 如果是新代码导致的
   → 检查刚写的代码是否有语法问题
   → 检查是否缺少 using
   → 检查类型是否匹配
```

### Q: 测试失败怎么办？

**症状**：`dotnet test` 返回退出码 != 0 或有测试失败

**处理流程**：
```
1. 查看测试失败信息
   → 找到哪个测试失败
   → 查看具体的断言错误

2. 分析失败原因
   ├─ 测试逻辑错误 → 修复测试
   ├─ 被测代码错误 → 修复代码
   ├─ 测试数据问题 → 修改测试数据
   └─ 环境问题 → 检查环境配置

3. 修复并验证
   → 再次运行 dotnet test

4. 如果是新增测试失败
   → 检查测试逻辑是否正确
   → 检查断言是否合理
   → 检查测试数据是否有效
```

### Q: Git 冲突怎么办？

**症状**：`git merge` 或 `git pull` 提示冲突

**处理流程**：
```
1. 查看冲突文件
   → git status 会列出冲突文件

2. 打开冲突文件
   → 找到 <<<<<<< 和 >>>>>>> 标记

3. 解决冲突
   ├─ 保留你的修改
   ├─ 保留他们的修改
   ├─ 合并两个修改
   └─ 手动重写

4. 标记冲突已解决
   → git add <冲突文件>

5. 继续合并
   → git merge --continue 或 git pull
```

### Q: 权限问题怎么办？

**症状**：Permission denied、无法写入文件

**处理流程**：
```
1. 检查文件权限
   → ls -la <文件或目录>

2. 修复权限
   ├─ Windows：icacls <path> /grant %USERNAME%:F /T
   └─ Linux/Mac：chmod -R 755 <path>

3. 如果是 Git 权限问题
   → git config core.fileMode false

4. 如果是 Hook 权限问题
   → chmod +x ~/.claude/hooks/*.js
```

### Q: Token 用尽怎么办？

**症状**：Claude 提示 Token 限制

**处理流程**：
```
1. 查看当前消耗
   → /cost

2. 压缩对话
   → /compact

3. 如果还是不够
   → 保存进度：/verification-before-completion
   → 重新启动 Claude
   → 恢复进度：说"继续工作"

4. 避免再次发生
   → 使用 RTK 压缩
   → 减少不必要的 Read 调用
   → 使用 Skills 而不是自己实现
```

---

## 更新记录

| 日期 | 版本 | 内容 |
|------|------|------|
| 2026-06-11 | 3.0 | 更新为符合《建设指南》的配置体系；新增 Commands/Workflows/Agents 说明 |
| 2026-06-10 | 2.0 | 添加自动化行为说明 |
| 2026-06-04 | 1.0 | 初始版本 |
