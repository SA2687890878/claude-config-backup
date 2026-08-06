# 通用 Harness 工程规划（4 宿主版）

> 规划日期：2026-07-27
> 目标宿主：Claude Code / OpenAI Codex / GitHub Copilot / Reasonix
> 依据：本仓库 26 hooks + 33 rules + 20 skills 逐行精读；4 宿主官方文档核实（见 docs/REASONIX-MIGRATION.md 第七节矩阵）

---

## 0. 目标与约束

### 用户目标拆解

| 目标 | 落点 |
|---|---|
| 高质量完成工作 | 方法论 skills（双轴审查/五问质询/失败模式检测）+ 五级 Quality Gates |
| 节省 token | RTK + Think-in-Code + skills 渐进披露 + 输出压缩约定 |
| 覆盖日常工作全流程 | 7 阶段 × skill/rules/gates 映射（见第三节） |
| 流程自动化 | 护栏 hooks + git hooks 兜底 + 索引自动更新 |
| 高质量可靠的系统 | Verification First 铁律 + 测试纪律 |
| 早点下班 | 自动化最大化：确定性 hooks > 纪律规则 > 提示词 |

### 工作流覆盖（7 阶段）

需求沟通 → 需求讨论 → 架构设计 → 功能设计 → 功能开发 → 功能测试 → 问题排查

### 宿主约束

- Claude Code：主力之一，全能力
- Codex：全能力（hooks 同构 + updatedInput）
- GitHub Copilot：公司场景，全能力（读 CLAUDE.md、.claude/skills）
- Reasonix：降级适配（无 PreToolUse 改写、UserPromptSubmit stdout 无效）

---

## 1. 设计原则

1. **内容/适配分离**：规则、技能、护栏逻辑与宿主无关；宿主只做注册与转发。
2. **以 Claude 契约为基准**：4 宿主中 3 个（Claude/Codex/Copilot）hooks 协议同构、SKILL.md 同标准、CLAUDE.md 直接/可配读取——行业事实上收敛到 Claude 格式，按它写一份全兼容。
3. **确定性优先**：能用 hook/git hook 自动做的，不交给模型自觉。排序：git hooks > 宿主 hooks > 纪律规则 > 提示词。
4. **渐进披露**：核心规则常驻（≤150 行），方法论按需加载，技能只载 SKILL.md 摘要、选中才读 references。
5. **验证铁律**：没有新鲜验证证据不许宣称完成（verification-before-completion 升级为核心规则）。

---

## 2. 架构

```
harness/                          # 内容层（工具无关，本仓库即此层）
├── CLAUDE.md                     # 唯一入口：核心规则 + import 按需规则（4 宿主共同/可配读取）
├── rules/
│   ├── quality/gates.md          # 五级门禁（常驻）
│   ├── quality/verification.md   # 验证铁律（常驻）
│   ├── tools/token-optimization.md
│   └── languages/*.md            # csharp/vue/sqlserver/postgresql/javascript
├── knowledge/
│   ├── engineering/              # 工程知识（按需）
│   ├── project/                  # 项目知识（按需）
│   └── business/                 # 业务知识（按需）
├── skills/                       # 20 个 SKILL.md 标准技能（迁移+瘦身后 15 个左右）
├── guards/                       # 护栏 CLI（独立、可测、宿主无关）
│   ├── guard.ps1                 # guard check <file> / check-command "<cmd>"
│   ├── patterns/                 # 密钥/危险命令/CS 语义规则（纯数据，不进代码）
│   └── tests/                    # guard 自身测试
└── git-hooks/                    # 跨宿主兜底：pre-commit / pre-push

deploy/                           # 适配层（唯一绑定宿主的地方）
├── claude/     settings.local.json + hooks 注册 + ~/.claude/skills → harness/skills symlink
├── codex/      config.toml + hooks.json + ~/.agents/skills → harness/skills symlink + project_doc_fallback_filenames=["CLAUDE.md"]
├── copilot/    .github/hooks/*.json + .github/copilot-instructions.md（指向 CLAUDE.md）+ 仓库内 .claude/skills
└── reasonix/   settings + hooks 注册（降级表）+ skills 目录
```

### 数据流

```
用户意图 → 宿主（任一） → SessionStart 注入上下文（git 状态 + 项目信息 + 任务进度）
  → UserPromptSubmit（skill 自动发现/路由）
  → PreToolUse（guards CLI 检查：密钥/危险命令/CS 语义）→ 阻断或放行
  → 工具执行 → PostToolUse（guards 复查 + 索引更新 + 测试提醒）
  → Stop（build-verify 编译+测试报告）
  → commit 时 git pre-commit/pre-push 兜底（跨宿主，--no-verify 也拦）
```

---

## 3. 七阶段覆盖矩阵

| 阶段 | 触发 | Skill | 规则 | Gate | 产物 |
|---|---|---|---|---|---|
| 需求沟通 | "需求不清楚/帮我梳理" | requirements（五问质询+反谄媚） | question-bank | Requirement | requirements-*.md |
| 需求讨论 | "讨论/方案/头脑风暴" | requirements（头脑风暴硬门） | question-bank | Requirement | docs/specs/YYYY-MM-DD-主题-design.md |
| 架构设计 | "架构审查/方案评审" | arch-review（爆炸半径/无聊优先等 6 认知模式） | gates/design | Design | Architecture-*.md |
| 功能设计 | "写计划/plan" | dev-workflow A（Phase 0 文档发现、2-5 分钟粒度） | gates/design | Design | Design-*.md + plan |
| 功能开发 | "实现/添加/开发" | dev-workflow B（执行+每步验证） | languages/* + gates/code | Code | Code + CodeReview |
| 功能测试 | "测试/跑测试" | test（生成/执行/修复/覆盖率四路由） | gates/test | Test | TestPlan + 测试结果 |
| 问题排查 | "排查/bug/报错" | systematic-debugging（Phase 0 复现循环 + 失败模式检测） | gates/code | 修复验证 | RCA-*.md |

**贯穿全流程**：
- 代码审查：review skill（>50 行强制双轴对抗子代理审查）——Code/Release Gate 必过
- 验证：verification-before-completion——任何阶段宣称完成前必跑
- 知识沉淀：sync skill（learnings → knowledge 三层）
- 性能兜底：perf-tune（排查阶段慢查询/高 CPU 时启用）

---

## 4. 分层明细

### 4.1 内容层（工具无关）

**入口 CLAUDE.md 结构**（4 宿主兼容）：
```markdown
# 核心规则（≤150 行常驻）
- 环境/项目速查（F:\Code WorkSpace → SQL Server 等）
- 行为原则（最少代码、证据第一、验证铁律）
- 核心禁止（.Result/.Wait()、push main、硬编码密钥）
- 指令 import：rules/quality/gates.md、rules/quality/verification.md、rules/tools/token-optimization.md
- 压缩保留清单
```

**skills 迁移策略**（20 → 约 15 个）：
- 保留 12 个自研方法论（review/systematic-debugging/requirements/perf-tune/sql-best-practices/test/arch-review/dev-workflow/commit/docs/verification-before-completion/skill-manager）
- opencli 6 个：宿主无关，整体保留（不占主线）
- research：第三方工具链，保留但标注外部依赖
- sync：拆分——经验同步部分并入 verification-before-completion，加密索引部分退役
- **去宿主化**：清掉 skill 内 `~/.claude/` 路径、`rules/tools/code-access.md` 引用、search.ps1 调用

### 4.2 护栏层（guards CLI + git hooks）

**guards CLI 抽取范围**（从现有 hooks 抽逻辑）：
| 现有 hook | 抽取为 | 检查内容 |
|---|---|---|
| secret-guard.js | `guard check-content` | 15 类密钥正则（纯数据 patterns/） |
| bash-guard.js | `guard check-command` | 危险命令 10 类（rm -rf/DROP TABLE/force push） |
| cs-guard.js（合并版） | `guard check-cs` | 语法/质量/逻辑三类（.Result、空 catch、foreach await、SQL 注入） |
| vue-guard.js | `guard check-vue` | $t() 禁 data、v-for :key |
| git-commit-review.js | `guard check-git` | force push、受保护分支、提交信息密钥 |

**git hooks 兜底**（写一次 4 宿主全生效）：
- pre-commit：`guard check-git` + `guard check-content`（扫描 staged 内容）
- pre-push：受保护分支拦截
- 注：git hooks 是最后防线，宿主 hooks 失效/被 --no-verify 跳过时仍兜底

### 4.3 适配层（4 宿主注册）

**hooks 注册（以 Claude 契约为基准写脚本，3 宿主直接吃）**：
| 宿主 | 配置位置 | 阻断方式 | 差异处理 |
|---|---|---|---|
| Claude | settings.local.json hooks 字段 | exit 2 | 无 |
| Codex | ~/.codex/hooks.json 或 config.toml [hooks] | exit 2 / permissionDecision | 无 |
| Copilot | .github/hooks/*.json + settings.json | exit 2 / permissionDecision | 无 |
| Reasonix | settings hooks（兼容 Claude 格式） | exit 2 | UserPromptSubmit 注入停用；PreToolUse 改写不可用 |

**技能分发**（symlink 一次性配置）：
- `~/.claude/skills` ← harness/skills（Claude + Copilot 读）
- `~/.agents/skills` ← harness/skills（Codex + Copilot 读）
- 公司仓库 `.claude/skills`（Copilot 项目级，如有需要）

**指令文件分发**：
- Claude：CLAUDE.md 即仓库根文件（原生）
- Codex：config.toml 加 `project_doc_fallback_filenames = ["CLAUDE.md"]`
- Copilot：直接读 CLAUDE.md（官方支持），可选 .github/copilot-instructions.md 一行指向
- Reasonix：直接读 CLAUDE.md（原生）

### 4.4 工具层

| 工具 | 宿主支持 | 部署 |
|---|---|---|
| RTK | Claude/Copilot 自动；Codex 自写 hook 调 rtk rewrite；Reasonix 手动 | E:\开发工具 加入 PATH；纪律规则进 CLAUDE.md |
| MCP（CodeGraph/context-mode） | 4 宿主全支持 | 各宿主配置 .mcp.json 或等效配置 |
| sqlite-index | 独立脚本 | 本机退役（无加密），加密电脑再启用 |

---

## 5. Token 节省方案

| 机制 | 节省来源 | 4 宿主落地 |
|---|---|---|
| RTK 输出压缩 | CLI 输出 60-90% | Claude/Copilot 自动；Codex 自写 hook；Reasonix 手动+纪律 |
| 核心规则精简 | 常驻指令 ≤150 行 | 全部 |
| 渐进披露 | skills/rules 按需加载 | 全部（4 宿主均支持 description 匹配 + 选中才读全文） |
| Think-in-Code | 大文件不读入上下文 | 写进 token-optimization 规则，4 宿主模型遵循 |
| 输出过滤约定 | 构建只看 ERROR/FAIL | 写进 CLAUDE.md 纪律 |
| guards 单进程 | cs-guard 合并版避免 3 遍重复 | 修掉现有 bug 后全宿主受益 |

---

## 6. 现有资产迁移映射

| 资产 | 处置 | 依据 |
|---|---|---|
| 26 个 hooks | 10 个直接迁（逻辑抽入 guards）+ 8 个停用（4 个被原生替代/3 个 bug/1 个失效）+ 需适配 4 个 | REASONIX-MIGRATION.md 第二节 |
| 33 个 rules | 16 个直接保留 + 5 个裁剪 + 10 个不迁（加密/RTK/触发词表）+ 2 个合并 | 第三节 |
| 20 个 skills | 15 个保留（去宿主化）+ research/opencli 原样 + sync 拆分 | 第四节 |
| 2 个 agents | 转为各宿主自有格式（builder/operator 内容并入 dev-workflow skill） | 4.3 |
| 7 个 commands | Claude/Reasonix 兼容；Codex/Copilot 侧内容并入对应 skill | 4.3 |
| 加密工具链 | 本机退役 | 无加密 |
| RTK | 保留 + PATH 配置 | 4.4 |
| 3 个现有 bug | 修复（cs-guard 重复注册、artifact-index 失效、metrics 全量触发） | 精读发现 |

---

## 7. 落地路径

| 阶段 | 内容 | 验证 |
|---|---|---|
| P0 修 bug | cs-guard 合并版去重、删 artifact-index-update、metrics 加 matcher | 写 .cs 确认只跑 1 次 guard |
| P1 内容层去宿主化 | rules 裁剪 5 个、skills 清路径引用、CLAUDE.md 重构为 4 宿主兼容入口 | 4 宿主各自启动确认读到指令 |
| P2 guards 抽取 | secret/bash/cs/vue/git 逻辑独立 CLI + patterns 纯数据 + 测试 | guard 冒烟测试通过 |
| P3 git hooks | pre-commit/pre-push 接 guards | 故意写坏代码确认被拦 |
| P4 4 宿主部署 | deploy/ 目录 + 各宿主注册表 + symlink + config 模板 | 每个宿主跑一遍 7 阶段演练 |
| P5 验证循环 | 每宿主真实项目 1-2 周，记录 token 节省/质量 | 数据对比决定主力 |

---

## 8. 质量保障

- guards CLI 自带测试（patterns 命中/不命中用例）
- 适配层冒烟测试：每宿主最小 hooks 场景跑通
- hooks 自检脚本：全部 hooks 语法检查 + 模拟 stdin 冒烟
- 文档/现实漂移检测：deploy/ 注册表与 hooks 脚本清单 diff

---

## 9. 风险与未验证项

| 项 | 状态 |
|---|---|
| Codex 的 PreToolUse 自写 RTK hook（rtk rewrite 集成） | 未实测，需验证 |
| Reasonix UserPromptSubmit 注入完全不可用 | 官方文档确认，降级方案已定 |
| Copilot 企业管控（policy hooks/managed settings） | 未验证，需确认公司配置 |
| 各宿主模型质量差异 | 需真实项目实测（最终决策权重最大） |
| RTK 在 Codex 下的 hook 写法 | 未实测 |

---

*本规划基于 docs/REASONIX-MIGRATION.md 的查证结论，所有宿主能力均有官方文档/实测证据支撑。*
