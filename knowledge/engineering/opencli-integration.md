---
name: opencli-integration
description: openCli集成到harness engineering——把网站变成CLI工具，提升信息获取效率
metadata:
  type: reference
---

## openCli 集成

### 已安装的适配器

| 适配器 | 用途 | 命令示例 |
|--------|------|---------|
| v2ex | V2EX 社区 | `openCli v2ex hot` |
| github | GitHub | `openCli github search "Claude Code"` |
| stackoverflow | Stack Overflow | `openCli stackoverflow search "token optimization"` |
| npm | NPM 包搜索 | `openCli npm search "claude"` |

### 使用场景

1. **技术调研**：搜索 V2EX、GitHub、Stack Overflow 上的讨论
2. **依赖查询**：查询 NPM 包信息
3. **社区动态**：获取 V2EX 热门话题
4. **代码搜索**：搜索 GitHub 代码片段

### 最佳实践

```bash
# 搜索 V2EX 上关于 Claude Code 的讨论
openCli v2ex hot --format json | grep -i "claude"

# 搜索 GitHub 上的 Claude Code 工具
openCli github search "Claude Code CLI" --format json

# 查询 NPM 包
openCli npm search "claude-code" --format json
```

### 与 Harness Engineering 集成

- **技能触发**：在 `/research` 技能中使用 openCli 进行技术调研
- **知识同步**：将 openCli 获取的信息同步到 knowledge/
- **工作流**：在 `/explore` 阶段使用 openCli 收集信息

## Why:
openCli 把网站变成 CLI 工具，大幅提升信息获取效率，避免手动切换浏览器。

## How to apply:
在需要技术调研时，优先使用 openCli 搜索相关信息，而不是手动浏览网站。
