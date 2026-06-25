# Rules 架构设计

## Claude Code 的 rules 扫描机制

**发现**：Claude Code 会递归扫描 `~/.claude/rules/` 目录，包括子目录。

**影响**：
- 放在 `rules/` 目录下的所有文件都会被自动加载
- 无论是否使用 `@rules/` 引用，都会被扫描
- 无法通过配置禁止这个行为

**验证方法**：
- 创建 `rules/reference/` 目录，放入测试文件
- 新开会话，检查 /memory 看是否被加载
- 结果：即使放在子目录，仍然会被加载

## 解决方案：核心规则 + 参考规则分离

### 架构设计

```
~/.claude/
├── rules/                          # 核心规则（自动加载）
│   ├── tools/
│   │   ├── code-access.md          # 精简版，只保留核心
│   │   └── token-optimization.md   # 精简版，只保留核心
│   └── quality/
│       ├── gates.md                # 精简版，只保留概览
│       └── verification.md         # 精简版，只保留核心
│
└── knowledge/
    ├── rules/                      # 按需加载的 rules
    │   ├── code-access/            # 详细说明
    │   ├── gates/                  # 详细说明
    │   ├── verification/           # 详细说明
    │   ├── token-optimization/     # 详细说明
    │   ├── workflows/              # 工作流规则
    │   ├── quality/                # 质量规则
    │   ├── tools/                  # 工具规则
    │   └── languages/              # 语言规则
    └── engineering/                # 工程知识
```

### 设计原则

1. **核心规则**（rules/ 目录）：
   - 每次会话自动加载
   - 内容精简（每个文件 < 50 行）
   - 只保留核心规则和决策树
   - 包含参考规则的路径

2. **参考规则**（knowledge/rules/ 目录）：
   - 需要时按需加载
   - 内容详细（可以很长）
   - 包含完整的说明、示例、最佳实践
   - 通过 `ctx_search` 或手动读取

### 实施效果

| 项目 | 修改前 | 修改后 | 节省 |
|------|--------|--------|------|
| 核心规则行数 | 574 行 | 104 行 | 82% |
| 核心规则 token | ~5.7k | ~1.5k | 74% |

### 按需加载方式

**方式 1：通过 ctx_search 查询**
```javascript
ctx_search({ queries: ["encryption"], source: "knowledge" })
```

**方式 2：通过 Read 工具读取**
```bash
cat ~/.claude/knowledge/rules/code-access/encryption.md
```

**方式 3：通过 context-injector.js 自动注入**
- 根据输入关键词自动注入相关规则
- 配置在 `~/.claude/hooks/context-injector.js`

## How to apply

- 新增规则时，判断是否为核心规则
- 核心规则：放在 rules/ 目录，内容精简
- 参考规则：放在 knowledge/rules/ 目录，内容详细
- 核心规则中包含参考规则的路径，方便按需加载

