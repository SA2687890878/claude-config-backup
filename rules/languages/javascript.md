# JavaScript/TypeScript 规范

## 适用场景
- Claude Code hooks（Node.js）
- Vue 2 组件中的 JS
- 构建脚本

## 核心规则

### 异步处理
- 优先使用 `async/await`，避免回调地狱
- Promise 链要有 `.catch()` 处理
- 不要在循环中使用 `await`（除非确实是串行依赖）

### 错误处理
- `try/catch` 中不要空 catch 块
- 错误信息要有上下文（文件名、操作）
- Hook 脚本失败时输出到 stderr，不要静默吞掉

### Node.js Hook 规范
- stdin 读取要有超时保护（10 秒）
- 输出到 stdout 必须是 JSON 格式
- 输出到 stderr 是用户可见的信息
- exit code: 0=成功, 2=阻断(PreToolUse)

### 变量声明
- 优先 `const`，需要修改时用 `let`
- 不要使用 `var`

### 字符串
- 优先模板字符串
- 路径比较时统一使用正斜杠

## 禁止
- 不要使用 `eval()`
- 不要使用 `process.exit()` 以外的方式终止进程
- 不要在 PostToolUse 中使用 `decision: block`（会回滚用户修改）
