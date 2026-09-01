# Claude Harness 使用指南

> 一套按需加载的交付体系：需求→设计→开发→测试→提交，由 `pipeline-executor` 单轨编排。

## 核心入口：pipeline-executor（一键全流程）

触发 `/pipeline` 或直接说"开发功能 / 做这个功能"，自动走五阶段：

1. **需求**（requirements）→ Requirement.md
2. **设计**（arch-review / design）→ Architecture.md, Design.md
3. **开发**（dev-workflow）→ Code
4. **测试**（test）→ 测试结果
5. **提交**（verification-before-completion + commit）→ Git commit

每阶段过对应 Gate（见下方门禁）。三档模式：auto（全自动）/ review（关键点人工确认）/ manual（逐阶段确认）。

## 常用场景速查

| 场景 | 触发 | 输出 |
|------|------|------|
| 开发新功能 | `/pipeline` 或"开发X" | Requirement→Design→Code→测试→提交 |
| 修复 Bug | `/pipeline` 或"修复X" | RCA.md + 修复代码 |
| 讨论/设计方案 | `/requirements` / `/design` | Requirement.md, Design.md |
| 代码审查 | `/review` | 审查报告（CRITICAL/HIGH/MEDIUM/LOW） |
| 架构审查 | `/arch-review` | 架构评审意见 |
| 跑/写测试 | `/test` | 测试结果 / 测试代码 |
| 问题排查 | `/systematic-debugging` / `/perf-tune` | RCA.md / 优化报告 |
| 深度调研 | `/research` | 带来源报告 |
| 数据库设计 | `/sql-best-practices` | 表/字段/索引建议 |
| 同步经验 | `/sync` | 知识库更新 |
| 提交代码 | `/commit` | Git commit |
| 完成前验证 | `/verification-before-completion` | 完成收据 |

## 质量门禁（每个阶段必须过）

| 门禁 | 时机 | 检查 |
|------|------|------|
| Requirement Gate | 需求完成后 | 完整、无歧义、可验收 |
| Design Gate | 设计完成后 | 满足需求、可扩展、风险可控 |
| Code Gate | 编码完成后 | 编译通过、审查通过 |
| Test Gate | 测试完成后 | 测试通过、覆盖率 |
| Release Gate | 提交前 | 风险评估、回滚方案 |

**铁律：没有新鲜的验证证据，不许宣称完成。**

## Token 节省

| 机制 | 节省率 | 说明 |
|------|--------|------|
| RTK 代理 | ~61% | Bash 输出自动压缩 |
| SQLite 索引 | ~95% | search.ps1 查符号 |
| Skills 拆分 | ~70% | 核心指令 + references 分离 |
| Hooks 自动化 | ~30% | 确定性验证不交给 AI |

## Commands 速查

| 命令 | 何时用 |
|------|--------|
| `/pipeline` | 完整交付（推荐入口） |
| `/requirements` | 需求不清，需梳理 |
| `/design` | 出技术方案 / 架构 |
| `/review` | 代码审查 |
| `/test` | 测试 |
| `/commit` | 提交 |
| `/systematic-debugging` | 问题难定位 |
| `/perf-tune` | 性能问题 |
| `/sync` | 同步经验 / 索引 |
| `/verification-before-completion` | 完成前验证 |
| `/skill-manager` | 管理 skills |
| `/docs` | 生成文档 |

## 最佳实践

**DO**
- 每个功能走 pipeline 全流程，Requirement.md 是后续所有决策的基础
- 编码前做 arch-review，编码后立即 review
- 每周 `/sync` 一次，防经验流失
- 保存进度用 `/verification-before-completion`，长对话可恢复

**DON'T**
- 不跳过质量门禁——必须有编译、测试证据
- 不在一个长对话里堆完所有事（token 会膨胀、推理变慢）
- 不忽视 Hook 警告（cs-checks / secret-guard 报的都是真问题）
- 不硬编码密钥 / Token（secret-guard 会拦截）
- 不直接 Read 整个加密 .cs 文件（会读乱码）——用 search.ps1 / codegraph

## 常见问题

- **编译失败**：查错误（文件:行号）→ 按语法/类型/缺引用分类修复 → 重新 dotnet build 验证
- **测试失败**：定位失败用例 → 分测试逻辑/被测代码/数据/环境 → 修复 → dotnet test 验证
- **Git 冲突**：git status 找冲突文件 → 解 `<<<<<<<` 标记 → git add → 继续合并
- **权限问题**：Windows `icacls`；Linux/Mac `chmod`；Git `core.fileMode false`
- **Token 用尽**：`/cost` 看消耗 → `/compact` 压缩 → 保存进度后重启恢复
- **继续上次工作**：若 `settings.json` 已注册 `session-start.js`/`skill-router.js`，说“继续工作”后读取 `tasks/active.json` 恢复；否则手动调用对应 Skill
- **Hook 报警**：仅以当前 `settings.json` 已注册的 Hook 为准；按实际提示修复 SQL 注入、Null、资源等问题

## 更新记录

| 日期 | 版本 | 内容 |
|------|------|------|
| 2026-08-26 | 4.0 | 单轨 pipeline-executor；清除 /explore /build /operate 旧命令；场景表化精简 |
| 2026-06-11 | 3.0 | 符合《建设指南》配置体系 |
| 2026-06-10 | 2.0 | 添加自动化行为说明 |
| 2026-06-04 | 1.0 | 初始版本 |
