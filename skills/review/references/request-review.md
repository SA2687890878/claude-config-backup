# 请求审查

派发 code reviewer subagent，在问题扩散前捕获。

## 获取 git SHAs

```bash
# 获取当前分支的最新提交
git rev-parse HEAD

# 获取目标分支的最新提交（通常是 main）
git rev-parse main
```

## 构造审查上下文

```
审查请求：

分支：[当前分支]
提交：[当前提交]
目标：[目标分支]

变更文件：
[文件列表]

变更内容：
[git diff 输出]
```

## 派发 subagent

使用 subagent 工具派发独立的 code reviewer；只提供 diff、验收标准和需求依据，不传递实现者上下文。

## 按严重级别处理反馈

- **CRITICAL** — 立即修复
- **HIGH** — 尽快修复
- **MEDIUM** — 计划修复
- **LOW** — 可选修复
