# Artifact 管理规范

> 每个工作流阶段生成具体产物，可追溯、可复用、可验证。

## 核心原则

**Artifact First**：先定义产物，再执行工作。产物是工作的证据和可复用资产。

---

## 产物清单（按工作流）

### Explore 工作流产物

#### Requirement.md（必须）
**内容**：
- 功能需求（用户故事、验收标准）
- 非功能需求（性能、安全、可用性）
- 边界条件（正常/异常/边界值）
- 约束条件（技术/业务/时间）

**验证标准**：
- 通过 Requirement Gate
- 用户确认（签字或明确同意）

**存储位置**：
```
<project-root>/.claude/artifacts/
└── Requirement-YYYY-MM-DD-功能名.md
```

#### Decision.md（可选）
**内容**：
- 技术方案选型（选了什么、为什么）
- 备选方案分析（为什么不用其他方案）
- 风险评估

**验证标准**：
- 架构师/技术负责人确认

**存储位置**：
```
<project-root>/.claude/artifacts/
└── Decision-YYYY-MM-DD-功能名.md
```

---

### Build 工作流产物

#### Architecture.md（推荐）
**内容**：
- 系统架构（模块划分、依赖关系）
- 主要流程（时序图、流程图）
- 关键设计决策

**验证标准**：
- 通过 Design Gate（架构审查通过）
- 无 CRITICAL/HIGH 架构问题

**存储位置**：
```
<project-root>/.claude/artifacts/
└── Architecture-YYYY-MM-DD-功能名.md
```

#### Design.md（推荐）
**内容**：
- 详细设计（类图、接口定义）
- 数据结构（表结构、字段说明）
- 算法设计（核心逻辑、边界处理）

**验证标准**：
- 通过 Design Gate
- 性能风险评估完成

**存储位置**：
```
<project-root>/.claude/artifacts/
└── Design-YYYY-MM-DD-功能名.md
```

#### Code（强制）
**内容**：
- 遵循质量标准的代码
- 单元测试（覆盖主流程、异常流程、边界条件）

**验证标准**：
- 通过 Code Gate（编译通过 + 代码审查通过）
- 无 CRITICAL/HIGH 代码问题

**存储位置**：
```
<project-root>/src/
<project-root>/tests/
```

#### TestPlan.md（推荐）
**内容**：
- 测试场景（主流程、异常流程、边界条件）
- 测试用例（Given/When/Then）
- 测试数据（测试账号、测试数据）

**验证标准**：
- 测试用例覆盖所有功能点
- 测试结果通过率 100%（除 skip 外）

**存储位置**：
```
<project-root>/.claude/artifacts/
└── TestPlan-YYYY-MM-DD-功能名.md
```

#### Code Review Results（强制）
**内容**：
- 审查通过证据（无 CRITICAL/HIGH 问题）
- 审查发现的问题（已修复）

**验证标准**：
- 通过 Code Gate

**存储位置**：
```
<project-root>/.claude/artifacts/
└── CodeReview-YYYY-MM-DD-功能名.md
```

---

### Operate 工作流产物

#### RCA.md（推荐）
**内容**：
- Root Cause Analysis
- 问题现象（错误信息、复现步骤）
- 根因分析（为什么会出现）
- 影响范围（影响哪些用户、哪些功能）
- 修复方案（如何修复、验证方法）

**验证标准**：
- 根因确认（非猜测）
- 修复方案已实装并验证
- 回归测试通过

**存储位置**：
```
<project-root>/.claude/artifacts/
└── RCA-YYYY-MM-DD-问题名.md
```

#### Improvement.md（可选）
**内容**：
- 改进建议（如何避免类似问题）
- 流程优化（如何提前发现）

**存储位置**：
```
<project-root>/.claude/artifacts/
└── Improvement-YYYY-MM-DD-主题.md
```

---

## 存储标准

### 项目级 Artifacts

```
<project-root>/
├── .claude/artifacts/
│   ├── Requirement-YYYY-MM-DD-用户导出功能.md
│   ├── Architecture-YYYY-MM-DD-用户导出功能.md
│   ├── Design-YYYY-MM-DD-用户导出功能.md
│   ├── TestPlan-YYYY-MM-DD-用户导出功能.md
│   ├── CodeReview-YYYY-MM-DD-用户导出功能.md
│   ├── RCA-YYYY-MM-DD-订单金额计算错误.md
│   └── archive/
│       └── YYYY-MM-DD-分支名/
│           ├── Requirement.md
│           ├── Architecture.md
│           └── Design.md
```

### 全局 Artifacts（模板和通用文档）

```
~/.claude/docs/
├── ARCHITECTURE.md         # 架构设计指南
├── templates/              # 产物模板
│   ├── Requirement.md.template
│   ├── Architecture.md.template
│   ├── Design.md.template
│   ├── TestPlan.md.template
│   └── RCA.md.template
└── examples/               # 产物示例
    ├── Requirement-example.md
    └── RCA-example.md
```

---

## 生命周期

### 1. **生成阶段**

工作流执行时自动生成对应产物：

| 工作流 | 触发命令 | 自动生成产物 |
|--------|---------|-------------|
| `/explore` | 需求探索完成 | Requirement.md |
| `/build` | 设计完成 | Architecture.md + Design.md |
| `/build` | 编码完成 | Code + TestPlan.md |
| `/operate` | 问题修复完成 | RCA.md |

### 2. **评审阶段**

Quality Gate 检查时引用产物：

| Gate | 检查产物 | 通过条件 |
|------|---------|---------|
| Requirement Gate | Requirement.md | 需求完整性、可测试性 |
| Design Gate | Architecture.md + Design.md | 架构合理性、性能风险 |
| Code Gate | Code + CodeReview | 编译通过 + 审查通过 |
| Test Gate | TestPlan.md + 测试结果 | 所有测试通过 |
| Release Gate | 所有产物 | 风险评估完成 |

### 3. **版本控制阶段**

产物改动记录到 git：

```bash
# Artifact 产物应该提交到 git
git add .claude/artifacts/Requirement-*.md
git commit -m "[文档] 添加用户导出功能需求文档"
```

### 4. **归档阶段**

功能完成后移至 archive/：

```bash
# 分支合并到主分支后，归档产物
mv .claude/artifacts/Requirement-*.md \
   .claude/artifacts/archive/2026-06-15-feature-user-export/
```

---

## Artifact 与 Quality Gate 的映射

```
Requirement Gate
  ↓ 检查
Requirement.md + Decision.md
  ↓ 通过后进入

Design Gate
  ↓ 检查
Architecture.md + Design.md
  ↓ 通过后进入

Code Gate
  ↓ 检查
Code + CodeReview Results
  ↓ 通过后进入

Test Gate
  ↓ 检查
TestPlan.md + 测试结果
  ↓ 通过后进入

Release Gate
  ↓ 检查
所有产物 + 风险评估
  ↓ 通过后发布
```

---

## Artifact 与 Memory 的关系

### Artifact（工作产物，项目级）
- 存储位置：`<project>/.claude/artifacts/`
- 生命周期：生成 → 评审 → 版本控制 → 归档
- 用途：可追溯、可复用、可验证

### Memory（经验沉淀，项目级）
- 存储位置：`<project>/.../memory/learnings.md`
- 生命周期：手动记录 → 定期升级到 Knowledge
- 用途：避免重复踩坑、加速开发

### Knowledge（工程知识，全局/项目级）
- 存储位置：`~/.claude/knowledge/project/`
- 生命周期：从 Memory 升级 → 长期维护
- 用途：跨项目复用、新人培训

**同步方向**：
```
Artifact（产物）
  ↓ 沉淀
Memory learnings.md（经验）
  ↓ 升级
Knowledge project/（知识）
```

---

## Skill 集成

### `/explore` Skill
**输出产物**：
- `Requirement.md`（必须）
- `Decision.md`（可选）

**生成时机**：
- 需求探索完成后
- 用户确认需求后

**模板位置**：
```
~/.claude/docs/templates/Requirement.md.template
```

### `/build` Skill
**输出产物**：
- `Architecture.md`（推荐）
- `Design.md`（推荐）
- `Code`（强制）
- `TestPlan.md`（推荐）
- `CodeReview Results`（强制）

**生成时机**：
- 设计完成后（Architecture.md + Design.md）
- 编码完成后（Code + TestPlan.md）
- 代码审查后（CodeReview Results）

### `/operate` Skill
**输出产物**：
- `RCA.md`（推荐）
- `Improvement.md`（可选）

**生成时机**：
- 问题修复完成后
- 根因分析完成后

---

## 最佳实践

### DO ✅

- **每个功能都生成 Requirement.md** — 需求可追溯
- **复杂功能生成 Architecture.md** — 设计可复用
- **问题修复生成 RCA.md** — 避免重复踩坑
- **产物提交到 git** — 版本控制
- **定期归档** — 保持目录整洁

### DON'T ❌

- **不要跳过 Requirement.md** — 否则需求凭记忆
- **不要只写代码不写文档** — 否则无法复用
- **不要把产物当成负担** — 产物是资产，不是包袱
- **不要在 Artifact 中记录敏感信息** — 特别是 API Key
- **不要遗弃旧产物** — archive/ 中的产物也许某天还会用到

---

## 产物模板

### Requirement.md 模板

```markdown
# 需求文档：[功能名称]

## 基本信息
- 需求提出人：[姓名]
- 需求日期：YYYY-MM-DD
- 优先级：P0 / P1 / P2
- 预计工期：X 天

## 功能需求

### 用户故事
作为 [角色]，我希望 [功能]，以便 [目的]。

### 验收标准
- [ ] Given [前置条件]，When [操作]，Then [结果]
- [ ] Given [前置条件]，When [操作]，Then [结果]

### 边界条件
- 正常情况：[描述]
- 异常情况：[描述]
- 边界值：[描述]

## 非功能需求
- 性能：[响应时间 < 200ms]
- 安全：[权限校验、数据加密]
- 可用性：[99.9% uptime]

## 约束条件
- 技术约束：[必须用 .NET 8.0]
- 业务约束：[必须兼容旧数据]
- 时间约束：[2 周内完成]

## 验收检查
- [ ] 通过 Requirement Gate
- [ ] 用户确认签字
```

### Architecture.md 模板

```markdown
# 架构设计：[功能名称]

## 系统架构

### 模块划分
- 模块 1：[职责]
- 模块 2：[职责]

### 依赖关系
```
Controller → Service → Repository → Database
```

### 主要流程
```
用户请求 → 权限校验 → 业务处理 → 数据持久化 → 返回结果
```

## 关键设计决策

### 决策 1：[使用 Repository 模式]
- 原因：[解耦业务逻辑和数据访问]
- 备选方案：[直接用 EF]
- 为什么不用备选方案：[难以测试、耦合度高]

## 风险评估
- 性能风险：[大数据量导出可能内存溢出]
- 安全风险：[用户输入未转义可能 SQL 注入]
- 数据风险：[导出时数据变更可能导致重复]

## 验收检查
- [ ] 通过 Design Gate
- [ ] 架构审查通过
```

### RCA.md 模板

```markdown
# 根因分析：[问题名称]

## 问题现象
- 错误信息：[详细错误信息]
- 复现步骤：[如何复现]
- 影响范围：[影响哪些用户、哪些功能]

## 根因分析
- 根本原因：[为什么会出现]
- 触发条件：[什么情况下会触发]
- 代码位置：[文件名:行号]

## 修复方案
- 修复方法：[如何修复]
- 验证方法：[如何验证修复有效]
- 回归测试：[测试结果]

## 改进建议
- 如何避免类似问题：[改进措施]
- 如何提前发现：[监控、测试]

## 验收检查
- [ ] 根因确认（非猜测）
- [ ] 修复方案已实装并验证
- [ ] 回归测试通过
```

---

## 总结

**Artifact First 的核心**：
1. **每个阶段有产物** — 需求、设计、代码、测试、RCA
2. **产物可追溯** — 版本控制、归档
3. **产物可复用** — 下次类似功能可参考
4. **产物可验证** — Quality Gate 检查

**理想状态**：
- 每完成一个功能，都有完整的产物集
- 新功能开发时，可参考历史产物
- 问题修复时，可参考历史 RCA
- 新人加入时，可通过产物快速了解项目
