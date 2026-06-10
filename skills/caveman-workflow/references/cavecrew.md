# Cavecrew 压缩子代理

三种子代理预设，输出 caveman 压缩格式。主 context 更持久。

## 何时用

| 任务 | 用 |
|------|---|
| "X 定义在哪 / 调用 Y / 列出 Z 的用法" | `cavecrew-investigator` |
| 同上但还要建议/架构评论 | `Explore`（原版） |
| 手术编辑，≤2 文件，范围明确 | `cavecrew-builder` |
| 新功能 / 3+ 文件 / 跨模块重构 | 主线程 |
| 审查 diff/分支/文件找 bug | `cavecrew-reviewer` |
| 深度代码审查含理由+替代方案 | `Code Reviewer`（原版） |
| 已知答案的一行回答 | 主线程，不派子代理 |

**原则：想要 1/3 token 的输出选 cavecrew，想要散文选原版。**

## 输出契约

**investigator:**
```
<Header>:
- path:line — `symbol` — short note
totals: <counts>.
```

**builder:**
```
<path:line-range> — <change ≤10 words>.
verified: <re-read OK | mismatch @ path:line>.
```

**reviewer:**
```
path:line: <emoji> <severity>: <problem>. <fix>.
totals: N🔴 N🟡 N🔵 N❓
```

## 链式模式

**定位 → 修复 → 验证：**
1. investigator 返回位置列表
2. 主线程选 1-2 个位置，传给 builder
3. builder 编辑后，reviewer 审查 diff

**并行侦察：**
同时派 2-3 个 investigator（不同角度：定义 vs 调用方 vs 测试）。主线程聚合。

## 不要

- 不要在不知道文件时派 builder → 先派 investigator
- 5 文件重构不要用 builder → 会返回 `too-big.`
- 不要问 reviewer "一般性反馈" → 只返回 findings，用 Code Reviewer 要架构意见
