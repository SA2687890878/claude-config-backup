# Token 节省机制

> 理解这套 Harness 如何节省 Token，以及节省了多少。

---

## 节省概览

| 工具 | 节省比例 | 机制 |
|------|----------|------|
| **RTK** | ~61% | CLI 输出压缩 |
| **CodeGraph** | ~80% | 代码结构探索，不读整个文件 |
| **SQLite Index** ⭐ | ~95% | 加密源码项目：符号查询替代 PowerShell 转码+Read |
| **Context-mode** | ~95% | 大文件沙箱处理 |
| **Grep/Glob** | ~90% | 精确搜索，不读无关内容 |

---

## RTK（CLI 输出压缩）

### 工作原理

```
原始输出（10KB）
    │
    ├─→ RTK Hook 拦截
    │
    └─→ 压缩后（2KB）
        ├─→ 只保留关键信息
        ├─→ 过滤噪音
        └─→ 节省 61% token
```

### 自动触发

```bash
# 你运行
dotnet build

# RTK 自动拦截
rtk dotnet build

# 输出被压缩
原始：10KB 构建日志
压缩：2KB 关键信息（ERROR/FAIL）
```

### 查看节省统计

```bash
rtk gain
```

输出示例：
```
Total commands:    581
Tokens saved:      2.7M (61.3%)
```

---

## CodeGraph（代码结构探索）

### 工作原理

```
传统方式：Read 整个 .cs 文件（15KB）
    │
    └─→ 15KB token 消耗

CodeGraph：codegraph_explore（1-3KB）
    │
    └─→ 1-3KB token 消耗
    └─→ 节省 80%
```

### 使用场景

| 场景 | 传统方式 | CodeGraph | 节省 |
|------|----------|-----------|------|
| 理解代码结构 | Read 整个文件 | codegraph_explore | 80% |
| 查找调用链 | Grep 多个文件 | codegraph_callers | 70% |
| 查看符号定义 | Read 文件 | codegraph_node | 80% |

### 自动使用

Claude 会自动选择 CodeGraph 而不是 Read 整个文件。

---

## SQLite Index（加密源码项目索引）

> 适用场景：源码经过加密编码，Read/CodeGraph 均无法读取的项目

### 工作原理

```
传统方式：PowerShell UTF-8 转码 → Read 整个 .cs 文件（15KB）
    │
    └─→ 15KB token 消耗

SQLite Index：search.ps1 -Query "ClassName"（200B）
    │
    └─→ 200B token 消耗
    └─→ 节省 95%
```

### 自动触发

- **索引更新**：写入 .cs 文件时 PostToolUse hook 自动触发增量更新
- **索引查询**：Claude 在需要理解加密源码时自动调用 search.ps1

### 查看统计

```powershell
search.ps1 -IndexStats -ProjectPath "项目.csproj 所在目录"
```

---

## Context-mode（大文件处理）

### 工作原理

```
大文件（50KB）
    │
    ├─→ 传统方式：Read 整个文件 → 50KB token
    │
    └─→ Context-mode：沙箱处理 → 返回 1KB 摘要
        └─→ 节省 95%
```

### 使用场景

| 场景 | 传统方式 | Context-mode | 节省 |
|------|----------|--------------|------|
| 读日志文件 | Read 整个文件 | ctx_execute_file | 95% |
| 处理 CSV | Read 整个文件 | ctx_execute | 95% |
| 批量分析 | Read 多个文件 | ctx_execute | 90% |

### 自动使用

Claude 会在处理大文件时自动选择 Context-mode。

---

## Grep/Glob（精确搜索）

### 工作原理

```
传统方式：Read 10 个文件（100KB）
    │
    └─→ 100KB token 消耗

Grep：只返回匹配行（1KB）
    │
    └─→ 1KB token 消耗
    └─→ 节省 90%
```

### 使用场景

| 场景 | 传统方式 | Grep/Glob | 节省 |
|------|----------|-----------|------|
| 搜索关键词 | Read 多个文件 | Grep | 90% |
| 查找文件 | ls -R | Glob | 80% |

---

## 综合节省

### 日常开发场景

| 操作 | 原始消耗 | 优化后 | 节省 |
|------|----------|--------|------|
| 理解一个 Controller | 15KB | 2KB | 87% |
| git status | 2KB | 200B | 90% |
| 构建输出 | 10KB | 500B | 95% |
| 读日志文件 | 50KB | 1KB | 98% |
| 搜索关键词 | 100KB | 1KB | 99% |

### 累计节省

```
RTK 累计节省：2.7M tokens（61.3%）
CodeGraph 节省：每次调用约 10-50KB
SQLite Index 节省：每次调用约 10-15KB（加密源码项目）
Context-mode 节省：每次调用约 50KB+
Grep/Glob 节省：每次调用约 10KB+
```

---

## 查看节省统计

### RTK 统计

```bash
rtk gain
```

### Context-mode 统计

```bash
ctx_stats
```

---

## 最佳实践

| 实践 | 说明 |
|------|------|
| **让 Claude 自动选择** | Claude 会自动选择最高效的工具 |
| **不要手动 Read 大文件** | 用 Context-mode 处理 |
| **用 Grep 代替 Read** | 搜索关键词时用 Grep |
| **用 CodeGraph 理解结构** | 不要 Read 整个 .cs 文件 |
| **用 SQLite Index 查加密源码** | 加密项目走索引，不走 PowerShell 转码+Read |

---

## Token 优化规则

在 `rules/token-optimization.md` 中定义：

```markdown
# Token 优化规则

## 代码分析工具选择

| 场景 | 工具 | 原因 |
|------|------|------|
| 非加密项目 | CodeGraph（codegraph_explore 等） | 实时索引，精度高 |
| 加密项目 | SQLite 本地索引 | CodeGraph/Read 均无法读取加密源码 |

**判断方法**：尝试 `codegraph_files`，返回空或报错则切换 SQLite 索引。

## 禁止
- Read 整个 .cs 文件来理解结构

## 输出压缩
- 构建/测试输出 → 只看 ERROR/FAIL
- 日志文件 → 用 ctx_execute_file 过滤异常行
```
