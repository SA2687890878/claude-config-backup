<!-- Command: 性能调优流程编排
     配套 Workflow: ~/.claude/workflows/perf-optimize.js -->
性能调优流程。先量后优，用数据说话。

> **代码访问**：定位热点优先用 `search.ps1 -Callers/-Callees` 追调用链，不要 Read 整个文件。详见 [`rules/code-access.md`](../rules/code-access.md)。

## 执行方式

**优先使用 Workflow 工具执行**：

```
Workflow({scriptPath: "~/.claude/workflows/perf-optimize.js"})
```

如果 Workflow 工具不可用，按以下流程手动执行。

## 标准流程

```
/perf-tune(性能分析) → 优化方案 → 优化实施 → /verification-before-completion(复测验证)
```

---

## Phase 1: 性能分析

调用 `/perf-tune`：
- 确认问题类型：响应慢 / 资源高 / 吞吐低
- 收集基线数据：响应时间、CPU、内存、数据库查询
- 定位瓶颈：用数据说话，不猜

**决策点**：瓶颈定位 → Phase 2

---

## Phase 2: 优化方案

制定优化策略：
- 预期收益（量化）
- 风险评估
- 回滚方案

**决策点**：用户批准方案 → Phase 3

---

## Phase 3: 优化实施

按方案实施代码变更。每改一项就验证一项。

---

## Phase 4: 复测验证

调用 `/verification-before-completion`：
```bash
dotnet build --configuration Release
dotnet test
# 性能测试命令
```

对比优化前后指标。无回归 + 有改善 → 完成。
