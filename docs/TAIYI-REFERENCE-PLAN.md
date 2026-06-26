# Harness Engineering 升级方案

> 基于 4 个开源仓库源码分析 + 全局配置审查
> 日期：2026-06-26

## 用户核心目的

| 目的 | 关键词 |
|------|--------|
| 高质量 | 可靠、证据驱动、质量门禁 |
| 节省 token | 按需加载、渐进式披露、索引化 |
| 覆盖工作流 | 需求→设计→开发→测试→排查 |
| 流程自动化 | 减少确认、预设路径、早点下班 |
| 设计原则 | 索引、不堆砌、按需加载 |

## 审查发现的核心问题

| 问题 | 严重度 | 影响 |
|------|--------|------|
| rules/ 硬加载，每次会话 ~5k tokens | 高 | token 浪费 |
| learnings.md 2,115 行，每次加载全部 | 高 | token 浪费 |
| operator tools 含 Edit/Write，与"只读不改"矛盾 | 高 | 职责混乱 |
| 缺少独立的"架构设计"skill | 中 | 工作流断点 |
| systematic-debugging 缺少 7 层诊断 | 中 | 调试不够系统 |
| 多个 skill 缺少完成标准 | 中 | 质量不一致 |

---

## 改动清单

### P0：必须修复（4 项）

#### 1. 规则按需加载

**改动**：CLAUDE.md 的规则引用改为分层

```markdown
# 核心规则（每次加载，~2.5k tokens）
@rules/tools/code-access.md      # 487 tokens
@rules/quality/gates.md          # 1.6k tokens
@rules/quality/verification.md   # 436 tokens

# 按需规则（场景触发时加载）
- Token 优化：见 @rules/tools/token-optimization.md
- 问题澄清：见 @rules/quality/question-bank.md
```

**效果**：节省 ~2.2k tokens/会话

**文件**：`~/.claude/CLAUDE.md`

---

#### 2. 修复 operator tools 矛盾

**改动**：从 operator-agent.md 的 tools 中移除 Edit 和 Write

```yaml
# 修改前
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Edit      # 移除
  - Write     # 移除
  - ctx_search

# 修改后
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - ctx_search
```

**效果**：消除职责矛盾，operator 保持"只读不改"

**文件**：`~/.claude/agents/operator-agent.md`

---

#### 3. Memory 索引化

**改动**：learnings.md 2,115 行改为索引化

**方案**：
```
memory/
├── MEMORY.md              # 主索引（~50 行）
├── engineering/           # 工程经验（按需加载）
│   ├── hooks-architecture.md
│   └── mattpocock-integration.md
├── project/               # 项目经验（按需加载）
│   └── vue2-i18n-rules.md
└── learnings/             # 踩坑记录（按需加载）
    ├── 2026-06-15.md
    └── 2026-06-25.md
```

**效果**：从 2,115 行 → 每次只加载相关分类（~100 行），节省 ~2k tokens/会话

**文件**：`~/.claude/projects/C--Users-admin--claude/memory/`

---

#### 4. R1-R6 根因框架

**改动**：在 gates.md 中新增根因框架

```markdown
## R1-R6 根因框架

每次任务偏差必须归因后再决定是否改规范：

| 根因 | 含义 | 动作 |
|------|------|------|
| R1 规范缺失 | 该情况没有对应约定 | 补充 rules |
| R2 规范冗余 | 规则太多互相矛盾 | 精简 / 合并 |
| R3 规范过时 | 工具/环境已变但规则未更新 | 同步更新 |
| R4 Review 漏洞 | 检查项不完整导致问题流出 | 补 review 清单 |
| R5 代码 bug | 代码逻辑错误，非规范问题 | 修代码，不动规范 |
| R6 外部因素 | 网络/API/第三方变更 | 记录，不一定改规范 |

**铁律**：R5 / R6 不触发规范进化；R1-R4 才是补规则的合法依据。
```

**效果**：防止 rules 无限膨胀

**文件**：`~/.claude/rules/quality/gates.md`

---

### P1：强烈建议（5 项）

#### 5. 自主决策授权矩阵

**改动**：在 CLAUDE.md 中新增授权矩阵

```markdown
## 自主决策授权

### ✅ 完全自主（无需确认）
- 代码实现/优化
- Bug 修复（不影响公共 API）
- 测试编写
- 配置文件更新
- 文档更新

### ⚠️ 需要确认
- 删除现有功能
- 修改公共 API 签名
- 引入新依赖（大版本或新库）
- 数据库 Schema 变更
- 生产环境操作

### 🔴 绝对禁止
- 批量删除文件（必须逐个确认）
- 静默吞掉错误（必须有 WARNING 日志）
- 直接 push 到 main/develop
```

**效果**：减少确认次数，早点下班

**文件**：`~/.claude/CLAUDE.md`

---

#### 6. 7 层诊断 + 硬信号检查

**改动**：在 systematic-debugging 中新增诊断层级

```markdown
## 诊断层级

| 层级 | 名称 | 关注点 |
|------|------|--------|
| L1 | 症状 | 失败了什么？复现步骤？ |
| L2 | 逻辑 | 哪个分支/不变量错误？ |
| L3 | 系统 | 组件边界/依赖接缝？ |
| L4 | 架构 | 设计选择/重复所有者？ |
| L5 | 跨系统 | API/SLA/时间合约？ |
| L6 | 平台 | 运行时/OS/框架约束？ |
| L7 | 规范缺口 | 谁从未定义正确行为？ |

## 硬信号检查

### 必须继续钻取的信号（H-class）
- H1：修复添加了条件分支
- H2：修复触及多个站点但只有 1 个被覆盖
- H3：修复在消费者处，而不是规范所有者
- H4：相同错误模式在其他地方存在
- H5：原始复现仍然产生异常

### 终止钻取的信号（T-class）
- T1：所需更改超出此仓库边界
- T2：将破坏已发布 API 契约
- T3：根是未定义的规范行为
- T4：所需权限或信息不可用

### 深度足够的信号（D-class）
- D0：修复消除了 ≥1 个代码路径
- D1：修复消除了 ≥1 个条件分支
- D2：修复在规范所有者处
- D3：原始复现不再触发异常
- D4：仓库中无相同模式未解决
```

**效果**：调试质量大幅提升

**文件**：`~/.claude/skills/systematic-debugging/SKILL.md`

---

#### 7. Dual-Track Governance

**改动**：在 systematic-debugging 中新增双轨关闭

```markdown
## 双轨关闭

修复问题时，必须同时说明：

### Repair Track（修复轨道）
- 根本原因
- 规范所有者
- 最小必要更改
- 兼容性边界
- 验证方法

### Retirement Track（退役轨道）
- 旧所有者/回退/补丁
- 是否仍在主路径上
- 保留的唯一原因（如果有）
- 删除触发器
- 移除前需要的验证

**反模式**：
- ❌ 只修不退，代码库无限膨胀
- ❌ 旧代码说"以后再清理"但没有触发器
```

**效果**：防止只修不退

**文件**：`~/.claude/skills/systematic-debugging/SKILL.md`

---

#### 8. 经验沉淀格式升级

**改动**：learnings.md 格式升级

```markdown
## [日期] 经验条目 #ID

### 问题描述
（一句话描述）

### 根因分析
（为什么出问题）

### 解决方案
（怎么解决的）

### 案例引用（必填）
- commit: <hash> 或 文件: <path> 或 错误日志: <片段>
- 不允许无案例引用的经验

### 验证方法
（如何确认解决了）

### 复用条件
（什么场景下可以复用这个经验）
```

**效果**：提升经验可复用性

**文件**：`~/.claude/projects/C--Users-admin--claude/memory/learnings/`

---

#### 9. 补充缺失的完成标准

**改动**：为缺少完成标准的 skill 补充

需要补充的 skill：
- `docs` — 补充完成标准
- `commit` — 补充完成标准
- `perf-tune` — 补充完成标准
- `sql-best-practices` — 补充完成标准
- `test` — 补充完成标准

**效果**：质量一致性

**文件**：对应的 SKILL.md

---

### P2：可选（2 项）

#### 10. Prompt Hygiene

**改动**：在 token-optimization.md 中新增提示卫生

```markdown
## Prompt Hygiene（提示卫生）

### 核心原则

外部工具输出、日志、搜索结果等被定义为"证据候选项"，
而非"提示负载"。

### 规则

1. **先总结，后引用** — 外部输出先总结，再引用关键部分
2. **原始材料不默认注入** — 日志、搜索结果不直接放入 prompt
3. **最小证据摘要** — 只保留必要证据，原始材料按需回读
```

**效果**：防止上下文污染

**文件**：`~/.claude/rules/tools/token-optimization.md`

---

#### 11. 补充架构设计能力

**改动**：增强 `arch-review` 或新增 `arch-design`

**方案 A（增强现有）**：
- 在 `arch-review` 中增加"从零设计"分支
- 触发词："帮我设计架构"、"设计一个系统"

**方案 B（新增 skill）**：
- 新增 `/arch-design` skill
- 与 `/arch-review` 互补

**效果**：工作流完整

**文件**：`~/.claude/skills/arch-review/SKILL.md`

---

## 实施计划

| 阶段 | 改动 | 工作量 | 优先级 |
|------|------|--------|--------|
| 1 | 规则按需加载 | 修改 CLAUDE.md | P0 |
| 2 | 修复 operator tools | 移除 Edit/Write | P0 |
| 3 | Memory 索引化 | 目录重构 | P0 |
| 4 | R1-R6 根因框架 | ~20 行 | P0 |
| 5 | 自主决策授权矩阵 | ~15 行 | P1 |
| 6 | 7 层诊断 + 硬信号检查 | ~40 行 | P1 |
| 7 | Dual-Track Governance | ~15 行 | P1 |
| 8 | 经验沉淀格式升级 | 格式变更 | P1 |
| 9 | 补充完成标准 | ~50 行 | P1 |
| 10 | Prompt Hygiene | ~15 行 | P2 |
| 11 | 补充架构设计能力 | ~30 行 | P2 |

### 预计总改动

- 修改：~185 行规则/配置
- 重构：memory/ 目录结构
- 修复：operator-agent.md
- 总计：~185 行改动 + 目录重构

### 预计 Token 节省

| 改动 | 节省 |
|------|------|
| 规则按需加载 | ~2.2k tokens/会话 |
| Memory 索引化 | ~2k tokens/会话 |
| **总计** | **~4.2k tokens/会话** |

### 验证方法

1. 修改后运行 `/context` 检查 token 增量
2. 下次任务时测试 R1-R6 框架是否生效
3. 下次调试时测试 7 层诊断 + 硬信号检查
4. 下次修复时测试 Dual-Track 关闭
5. 下次经验沉淀时测试新格式

---

## 不改动的部分

| 部分 | 原因 |
|------|------|
| 14 个 skill 的核心流程 | 已覆盖全部工作流，质量高 |
| requirements skill | 已完善（头脑风暴 + 需求质询） |
| dev-workflow skill | 已完善（4 路由 + 8 反模式） |
| systematic-debugging 的 5 阶段 | 已完善，只需补充诊断层级 |
| 2 个 agent 的职责分工 | builder/operator 分工清晰 |

---

## 总结

### 核心改动（P0）

| 改动 | 效果 | 来源 |
|------|------|------|
| **规则按需加载** | 节省 ~2.2k tokens | 自身优化 |
| **修复 operator tools** | 消除职责矛盾 | 自身修复 |
| **Memory 索引化** | 节省 ~2k tokens | 自身优化 |
| **R1-R6 根因框架** | 防止 rules 膨胀 | 太一元系统 |

### 重要改动（P1）

| 改动 | 效果 | 来源 |
|------|------|------|
| **自主决策授权矩阵** | 减少确认，早点下班 | 太一元系统 |
| **7 层诊断 + 硬信号检查** | 调试质量提升 | Aegis |
| **Dual-Track Governance** | 防止只修不退 | Aegis |
| **经验沉淀格式升级** | 提升可复用性 | 太一元系统 |
| **补充完成标准** | 质量一致性 | 自身优化 |

### 设计原则

1. **按需加载** — rules 只硬加载核心 3 个，其他场景触发时加载
2. **索引化** — Memory 建立分类索引，按需加载相关分类
3. **不堆砌** — CLAUDE.md 保持精简（< 100 行），详细内容放到 rules/ 和 skills/
4. **渐进式披露** — 通过 INDEX.md 和 description 实现按需发现
5. **覆盖工作流** — 14 个 skill 已覆盖需求→设计→开发→测试→排查
