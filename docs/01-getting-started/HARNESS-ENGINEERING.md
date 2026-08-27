# Harness Engineering：个人研发效能系统

> **版本**：v2.0 | **最后更新**：2026-08-27（瘦身：旧三流 /explore/build/operate 已下线，现行单轨 pipeline-executor）
> **归档**：v1.0 完整版 759 行含旧工作流图，详见 git 历史。

---

## 什么是 Harness Engineering

一套系统化方法，实现：

- **消除重复** — 自动化确定性操作
- **降低认知负荷** — 流程标准化
- **加速反馈** — 快速验证
- **积累知识** — 经验沉淀跨项目复用

**北极星**：高质量完成工作 → 节省 Token → 早点下班

---

## 6 原则（每条一句话 + 落地）

### 1. Context First — 最少 Token，最大信息密度

规则预加载 + Hook 自动化 + Skill 拆分（核心指令/references 分离）+ Memory 自动加载。
*反例：长篇讲解最佳实践；正例：自动加载 perf-tune + sql-best-practices 直接诊断。*

### 2. Artifact First — 围绕交付物

每阶段有明确产物，下一阶段复用上一阶段，问题可追溯。

| 阶段 | 产物 | Gate |
|------|------|------|
| 需求 | Requirement.md | Requirement Gate |
| 设计 | Architecture.md / Design.md | Design Gate |
| 编码 | Code | Code Gate |
| 测试 | TestPlan + Tests | Test Gate |
| 发布 | 交付 + 回滚方案 | Release Gate |

产物路径以 `~/.claude/tasks/active.json` 的 `product_path` 为准，唯一真源。

### 3. Evidence First — 结论必须有证据

没有新鲜验证证据，不许宣称完成。证据 = 命令 + 退出码 + 输出摘要。

### 4. Verification First — 生成 ≠ 正确

Code Gate（编译 0 + 审查无 CRITICAL/HIGH）、Test Gate（测试 0 失败）、Release Gate（风险与回滚明确）。只看退出码，不看自述。

### 5. Quality Gate First — 门禁是防线不是建议

5 级门禁：Requirement → Design → Code → Test → Release，不可跳过，下游不改上游，连续打回 ≥3 次熔断。

### 6. Automation First — 能 Hook 的不交给 AI

PreToolUse 拦截密钥/危险命令，PostToolUse 检查质量，Stop 阶段验证构建与测试。

---

## 现行流水（唯一总入口）

```
用户说“开发XX/帮我开发/一键开发”
  → /pipeline-executor（auto/review/manual 三模式）
    → requirements → design → dev-workflow → test → verification → /commit
    → 每阶段过对应 Gate，产物写入 active.json 的 product_path
```

- 需求沟通/讨论 → `/requirements`（+`/research` 按需）
- 架构/功能设计 → `/design`（+`/arch-review` 按需）
- 功能开发 → `/pipeline-executor` 自动串五阶段
- 功能测试 → `/test`
- 问题排查 → `/systematic-debugging` / `/perf-tune`

详见 `03-architecture/ARCHITECTURE.md` 与 `skills/INDEX.md`。

---

## 数据流（简化）

```
用户输入 → skill-router.js（触发词→路由）→ pipeline-executor 编排
  → 27 个 Skills（按需）→ Hooks 5 类自动防护 → Quality Gates → 产物 → Memory/Knowledge
```

---

## 核心组件

| 组件 | 数量 | 说明 |
|------|------|------|
| Skills | 27 个 | ★ pipeline-executor 唯一总入口，其余按需 |
| Hooks | 19 个 .js | SessionStart/UserPromptSubmit/PreToolUse/PostToolUse/Stop |
| Quality Gates | 5 级 | 见 rules/quality/gates.md |
| Knowledge/Memory | 分层 | Memory 会话级 → Knowledge 工程级 |

---

## 衡量指标

| 指标 | 目标 | 手段 |
|------|------|------|
| Lead Time | ↓50% | 流程标准化 |
| Defect Rate | ↓70% | Gates + Hooks |
| Context Cost | ↓60% | 拆分 + RTK + 索引 |
| 复用率 | ↑80% | Memory→Knowledge |

度量：`metrics-collector.js` 记录 → `metrics-report.js` 汇总。

---

## 与其他方案对比

| 方案 | 流程 | 自动化 | 知识复用 | 质量保障 |
|------|------|--------|----------|----------|
| 传统 AI | 无 | 0% | 无 | 无 |
| 仅 Prompts | 部分 | 10% | 无 | 无 |
| 仅 Rules+Hooks | 部分 | 40% | 部分 | 部分 |
| **Harness** | 完整 | 85% | 完整 | 5 级 |

**为什么选 Harness**：系统化 + 可验证 + 可积累 + 可度量 + 可复用（换机一键迁移）。

---

## 更新记录

| 日期 | 版本 | 内容 |
|------|------|------|
| 2026-08-27 | 2.0 | 瘦身 759→~180 行；下线 /explore/build/operate；流水改为 pipeline-executor 单轨；归档旧图 |
| 2026-06-15 | 1.0 | 初始版 |
