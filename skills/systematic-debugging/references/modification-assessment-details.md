# 修改评估详细流程

遗留代码可以改，但必须评估后改。

> **代码访问铁律**：评估影响时优先用索引。加密项目 `codegraph` 失效，改用 `search.ps1 -Callers/-Callees`。

## 核心原则

1. **能新增就不改** — 能新增方法/类就不改现有的
2. **必须改就评估** — 完整评估影响后出解决方案
3. **记录改动** — 用 `/memory-save` 记录重要改动

## 修改前必须做

1. 查调用方：READABLE 用 `codegraph_explore`（DSH）/ `semantic_search`（Claude），查询"X 的调用方"；ENCRYPTED 用 `search.ps1 -Callers "Class.Method"`
2. 查影响范围：READABLE 用 `codegraph_explore`（一次调用返回调用路径与影响面）；ENCRYPTED 用 `search.ps1 -Callees`
3. 确认改动是否会影响其他模块
4. 确认是否需要同步修改调用方
5. 确认改动后如何验证
