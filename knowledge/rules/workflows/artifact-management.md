# Artifact 管理规范

> 每个工作流阶段生成具体产物，可追溯、可复用、可验证。
> 模板见 `~/.claude/docs/templates/`

## 核心原则

**Artifact First**：先定义产物，再执行工作。产物是工作的证据和可复用资产。

---

## 产物清单（按工作流）

| 工作流 | 产物 | 必须性 | 验证标准 |
|--------|------|--------|---------|
| `/explore` | Requirement.md | 必须 | 通过 Requirement Gate + 用户确认 |
| `/explore` | Decision.md | 可选 | 架构师确认 |
| `/build` | Architecture.md | 推荐 | 通过 Design Gate |
| `/build` | Design.md | 推荐 | 通过 Design Gate |
| `/build` | Code | 强制 | 通过 Code Gate |
| `/build` | TestPlan.md | 推荐 | 测试覆盖 100% |
| `/build` | CodeReview Results | 强制 | 通过 Code Gate |
| `/operate` | RCA.md | 推荐 | 根因确认 + 修复验证 |
| `/operate` | Improvement.md | 可选 | 改进建议 |

---

## 存储标准

### 项目级 Artifacts

```
<project-root>/
├── .claude/artifacts/
│   ├── Requirement-YYYY-MM-DD-功能名.md
│   ├── Architecture-YYYY-MM-DD-功能名.md
│   ├── Design-YYYY-MM-DD-功能名.md
│   ├── TestPlan-YYYY-MM-DD-功能名.md
│   ├── CodeReview-YYYY-MM-DD-功能名.md
│   ├── RCA-YYYY-MM-DD-问题名.md
│   └── archive/
│       └── YYYY-MM-DD-分支名/
```

### 全局 Artifacts

```
~/.claude/docs/
├── templates/              # 产物模板
└── examples/               # 产物示例
```

---

## 生命周期

| 阶段 | 触发 | 动作 |
|------|------|------|
| 生成 | 工作流执行时 | 自动生成对应产物 |
| 评审 | Quality Gate 检查 | Gate 引用产物验证 |
| 版本控制 | 提交时 | 产物提交到 git |
| 归档 | 功能完成后 | 移至 archive/ |

---

## 与 Quality Gate 的映射

```
Requirement Gate → 检查 Requirement.md + Decision.md
Design Gate → 检查 Architecture.md + Design.md
Code Gate → 检查 Code + CodeReview Results
Test Gate → 检查 TestPlan.md + 测试结果
Release Gate → 检查所有产物 + 风险评估
```

---

## Artifact 与 Memory 的关系

| 类型 | 存储位置 | 生命周期 | 用途 |
|------|---------|---------|------|
| Artifact | `<project>/.claude/artifacts/` | 生成→评审→归档 | 可追溯、可复用 |
| Memory | `<project>/.../memory/learnings.md` | 手动记录→升级 | 避免重复踩坑 |
| Knowledge | `~/.claude/knowledge/project/` | 从 Memory 升级 | 跨项目复用 |

**同步方向**：Artifact → Memory learnings.md → Knowledge project/
