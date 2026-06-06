<!-- Command: 人类可读的流程文档（详细步骤 + 决策点 + 自检清单）
     对应 Workflow: ~/.claude/workflows/code-review.js（机器可执行编排） -->
代码审查流程。并行多维度审查，快速发现所有问题。

## 标准流程

```
变更收集 → /dispatching-parallel-agents（5个维度并行）
→ 问题汇总 → 修复建议
```

---

## Phase 1: 变更收集

确定审查范围：
```bash
git status
git diff --stat
git diff --cached --stat
```

询问用户：
- 当前变更（git diff）
- 指定文件
- 指定分支对比
- 最近 N 次提交

用 `codegraph_explore` 了解变更代码的调用关系。

---

## Phase 2: 并行多维度审查（dispatching-parallel-agents）

调用 /dispatching-parallel-agents，同时启动 5 个 Agent：

### Agent 1: 架构审查
- Skill: /arch-review
- 检查：分层/依赖方向/SOLID/模块耦合

### Agent 2: 代码质量
- Skill: /dotnet-review
- 检查：命名/异常处理/资源释放/null 安全/重复代码

### Agent 3: 安全性
- Skill: /security-scan
- 检查：SQL 注入/XSS/硬编码密钥/权限校验/敏感数据日志

### Agent 4: 性能
- 检查：N+1 查询/不必要 DB 调用/大对象/同步阻塞异步/缺少索引

### Agent 5: 最佳实践
- 检查：async/await 一致性/依赖注入/配置管理/日志规范/API 规范

---

## Phase 3: 问题汇总

合并 5 个 Agent 的结果，按严重程度分类：

| 级别 | 含义 | 处理 |
|------|------|------|
| CRITICAL | 生产必炸（数据丢失/安全漏洞/死锁） | 必须修复 |
| HIGH | 很可能出问题（未处理异常/资源泄漏） | 应该修复 |
| MEDIUM | 可能出问题（边界条件/性能隐患） | 建议修复 |
| LOW | 代码质量（命名/冗余/可读性） | 可选修复 |

每个问题格式：`[级别] 文件:行号 — 描述`

---

## Phase 4: 修复建议

为 CRITICAL/HIGH 问题提供具体修复代码。
CRITICAL/HIGH 全部修复后，调用 /verification-before-completion 验证。
