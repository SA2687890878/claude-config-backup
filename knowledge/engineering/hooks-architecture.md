# Hooks 架构：Prompt Hook vs Command Hook

> 2026-06-25 踩坑得出。适用于所有 Claude Code 项目。

## 核心结论

Prompt hooks 只适合低频事件，不适合高频事件。

## 适用边界

| 事件 | 频率 | 适合 hook 类型 | 原因 |
|------|------|---------------|------|
| Write Edit | 每次编辑都触发 | command | prompt hook 每次消耗 500-1000 token |
| Bash | 每次命令都触发 | command | 同上 |
| SessionStart | 每会话 1 次 | prompt 或 command | 频率低，token 消耗可接受 |
| Stop | 每会话 1 次 | prompt | 需要推理判断是否完成 |
| UserPromptSubmit | 每次输入都触发 | command | 高频，不适合 prompt |

## 关键限制

hook 的 matcher 只能按工具名过滤（Write Edit），不能按文件类型过滤。

所以 prompt hook 会在编辑 .md .js .json 时也触发，每次输出"这不是 .cs 文件，跳过"，白白消耗 500-1000 token。

## 正确做法

需要文件类型过滤的 hook 用 command hook，在 Node.js 内部检查文件扩展名：

```
const filePath = input.tool_input.file_path || '';
if (!/[.]cs$/i.test(filePath)) return; // 不是 .cs 直接退出，0 token
```

## prompt hook 适合的场景

- Stop 事件：判断任务是否完成（需要推理）
- SessionStart 事件：加载上下文（低频）
- 需要 LLM 做复杂判断的低频事件

## 踩坑记录

把 impact-guard 改成 prompt hook 后：
1. 每次 Edit 任何文件都触发 LLM 推理，浪费 token
2. Edit 工具被 prompt hook 输出干扰，.js 文件写入转义出错
3. session-start.js 被破坏，从 git 恢复

规则：永远不要把需要文件类型过滤的 hook 改成 prompt 类型。
