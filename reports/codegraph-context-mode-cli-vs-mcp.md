# CodeGraph 与 context-mode 的 CLI vs MCP 对比调研报告

> 调研时间：2026-06-26
> 调研目的：分析两种工具的 CLI 与 MCP 调用方式，哪个更省 token

---

## 核心结论

**没有明确证据表明 CLI 比 MCP 更省 token**。真正的 token 节省来自工具本身的功能，而不是调用方式。

- **CodeGraph**：通过代码图谱提供精准上下文，减少文件读取和工具调用
- **context-mode**：通过沙箱化工具输出，减少原始数据进入上下文

---

## 1. 工具概述

### CodeGraph

| 属性 | 值 |
|------|-----|
| GitHub Stars | 54,743 |
| Forks | 3,358 |
| License | MIT |
| 定位 | 预索引代码知识图谱，为 AI agent 提供语义代码智能 |

**核心功能**：
- 预构建代码知识图谱（符号、调用边、依赖关系）
- 自动同步代码变更
- 支持 22+ 种编程语言
- 支持 Claude Code、Cursor、Codex、Gemini 等 8+ 个平台

### context-mode

| 属性 | 值 |
|------|-----|
| GitHub Stars | 18,193 |
| Forks | 1,276 |
| License | ELv2 |
| 定位 | AI 编码 agent 的上下文窗口优化 |

**核心功能**：
- 沙箱化工具输出（原始数据不进入上下文）
- 会话连续性（SQLite 跟踪所有操作）
- Think-in-Code 范式（LLM 生成代码而非处理数据）
- 支持 17 个平台

---

## 2. 架构对比

### CLI 调用方式

```bash
# CodeGraph CLI
codegraph query "AuthController"
codegraph callers "Login"
codegraph impact "UserService"

# context-mode CLI
context-mode index ./src
context-mode search "认证逻辑"
```

**特点**：
- 通过 Bash 工具调用
- 返回格式化文本（带 ANSI 颜色、装饰性输出）
- 需要 Claude 解析文本

### MCP 调用方式

```javascript
// CodeGraph MCP
mcp__codegraph__codegraph_search({ query: "AuthController" })
mcp__codegraph__codegraph_explore({ query: "认证流程" })

// context-mode MCP
mcp__context-mode__ctx_execute({ language: "javascript", code: "..." })
mcp__context-mode__ctx_search({ queries: ["认证逻辑"] })
```

**特点**：
- 通过 MCP 工具直接调用
- 返回结构化 JSON
- Claude 直接使用，无需解析

---

## 3. Token 消耗机制分析

### MCP 的 Token 消耗

**固定开销**：
- 工具 schema 描述：~500-1000 token（一次性加载）
- 每次调用开销：~50-100 token（工具名 + JSON 参数）

**Issue #776 的数据**：
> "Current standing cost per session: 8 tools ≈ 8.0KB of `tools/list` schemas + 7.3KB server instructions ≈ **~3.8k tokens in context every request**"

### CLI 的 Token 消耗

**每次调用开销**：
- Bash 命令文本：~20-50 token
- 命令输出：取决于输出量

**Issue #500 的问题**：
> "CLI outputs are designed for humans (with ANSI colors, padding, decorative output). For LLM context injection, we need **compressed outputs** — less text, more density, optimized for token cost."

### 实际对比

| 方面 | MCP | CLI |
|------|-----|-----|
| 工具加载开销 | 固定 ~3.8k token | 无 |
| 每次调用开销 | ~50-100 token | ~20-50 token |
| 返回格式 | 结构化 JSON（可能冗余） | 格式化文本（可能更紧凑） |
| 解析成本 | 无需解析 | Claude 需要解析文本 |

---

## 4. Benchmark 数据

### CodeGraph 官方 Benchmark

**测试条件**：7 个真实开源代码库，Claude Code headless，每个 4 次运行取中位数

| 代码库 | 语言 | 工具调用减少 | 时间减少 | 文件读取 | Token 减少 | 成本变化 |
|--------|------|-------------|---------|---------|-----------|---------|
| VS Code | TypeScript | 81% | 11% | 0 vs 9 | 64% | -18% |
| Excalidraw | TypeScript | 40% | 27% | 0 vs 7 | 25% | 持平 |
| Django | Python | 77% | 13% | 0 vs 9 | 60% | -8% |
| Tokio | Rust | 57% | 18% | 0 vs 8 | 38% | 持平 |
| OkHttp | Java | 50% | 31% | 0 vs 4 | 54% | -25% |
| Gin | Go | 44% | 24% | 1 vs 6 | 23% | -19% |
| Alamofire | Swift | 58% | 33% | 0 vs 9 | 64% | -40% |

**官方结论**：
> "The universal win — every repo, every size: 58% fewer tool calls · 22% faster · file reads cut to ~zero."

### context-mode 官方声称

> "Context Mode sandboxes tool output — raw output stays in isolated subprocesses and only compressed summaries enter context. Claims 98% reduction (315KB → 5.4KB)."

### 矛盾的数据

**Issue #975 用户报告**：
> "I tested on one private code repo with codegraph enabled vs disabled... The result shows that it consumes more."

测试数据显示 codegraph 启用后反而消耗更多 token。

---

## 5. 社区真实反馈

### CodeGraph CLI 的问题

**Issue #500**（用户 @DerekJi）：
> "codegraph already has extensive CLI commands...that work independently of the MCP server. The CLI doesn't require MCP at all"
>
> 但问题在于：
> - CLI 输出是**给人看的**（带 ANSI 颜色、装饰性输出）
> - 对 LLM 注入效率低
> - 没有 `--compact` 标志来压缩输出
> - "每查询 200 tokens → 压缩后 50 tokens"

**Issue #676**（用户 @doctorcolossus）：
> "If my agent could just use the excellent CLI directly without MCP, it would be much simpler and more elegant."

**Issue #985**（Feature Request）：
> "CLI support would allow direct command execution without relying on stdio MCP, easier scripting and automation, improved developer experience."

### context-mode 的问题

**Issue #873**（OMP 插件问题）：
> "After `omp plugin install context-mode`, the routing instructions file (`SYSTEM.md`) is never copied... Without this file, the model never learns that `ctx_execute`, `ctx_batch_execute`, etc. exist"

**Issue #403**（用户反馈）：
> "Hey sorry for writing this. But i want to tell you that i use your app and it helps me so fcking much and i really appreciate your work."

---

## 6. 关键发现

### 1. CLI 和 MCP 不是互斥的

两个工具都同时支持 CLI 和 MCP，可以针对不同场景选择使用。

### 2. Token 节省来自工具本身，不是调用方式

- **CodeGraph** 的 token 节省来自精准的代码图谱，减少文件读取
- **context-mode** 的 token 节省来自沙箱化输出，减少原始数据进入上下文

### 3. CLI 输出格式需要优化

Issue #500 指出 CLI 输出是给人看的，对 LLM 注入效率低。需要 `--compact` 标志来压缩输出。

### 4. MCP 的固定开销不可忽视

Issue #776 指出 MCP 工具 schema 每次请求都占用 ~3.8k token。

### 5. 没有绝对的优劣

- 简单查询：CLI 可能更省 token（无固定开销）
- 复杂分析：MCP 更可靠（结构化返回）
- 批量处理：CLI 更灵活（管道组合）

---

## 7. 最佳实践建议

### 对于你的场景（加密项目代码探索）

**推荐方案**：保持现状，两个都用

| 场景 | 推荐方式 | 原因 |
|------|---------|------|
| 简单符号查找 | CLI | 无固定开销，输出紧凑 |
| 深度架构分析 | MCP | 结构化返回，一次获取完整上下文 |
| 批量处理 | CLI | 管道组合更灵活 |
| 需要精确控制 | CLI | 可用 `head`/`tail` 控制输出量 |

### Token 优化策略

1. **简单查询用 CLI**：`codegraph query "xxx"`
2. **复杂分析用 MCP**：`codegraph_explore` 一次获取多个相关符号
3. **用 ctx_execute 处理大数据**：不读入上下文，在沙箱中处理
4. **避免不必要的 MCP 调用**：合并相关查询

### 不要做的事

- ❌ 为了省 token 放弃 MCP 的结构化优势
- ❌ 假设 CLI 一定比 MCP 更省 token
- ❌ 忽视 MCP 工具 schema 的固定开销

---

## 8. 结论

**核心观点**：不要纠结于 CLI vs MCP 的调用方式，而应该关注如何正确使用这两个工具。

- **CodeGraph**：用于代码探索和导航，精准获取需要的代码
- **context-mode**：用于上下文管理，减少原始数据进入上下文

两者配合使用，才能最大化 token 节省效果。

---

## 数据来源

- [CodeGraph GitHub](https://github.com/colbymchenry/codegraph)
- [context-mode GitHub](https://github.com/mksglu/context-mode)
- GitHub Issues: #500, #676, #776, #888, #975, #985 (CodeGraph)
- GitHub Issues: #45, #403, #873 (context-mode)
- 官方 README 和 Benchmark 数据

---

*报告生成时间：2026-06-26*
