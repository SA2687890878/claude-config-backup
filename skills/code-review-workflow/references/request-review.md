# 请求审查

派发 code reviewer subagent，在问题扩散前捕获。

## 获取 git SHAs

```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

## 构造审查上下文

用 Agent 工具，填以下信息：
- **DESCRIPTION** — 简述你做了什么
- **PLAN_OR_REQUIREMENTS** — 应该做什么
- **BASE_SHA** — 起始 commit
- **HEAD_SHA** — 结束 commit

## 处理反馈

- **Critical** — 立即修复
- **Important** — 继续之前修复
- **Minor** — 记录，稍后处理
- **Reviewer 错了** — 用技术理由 push back

## 何时请求

**必须：**
- 完成主要功能后
- 合并到 main 前

**建议：**
- 卡住时（新视角）
- 重构前（基线检查）
- 修复杂 bug 后
