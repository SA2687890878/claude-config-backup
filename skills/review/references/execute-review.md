# A. 执行审查

## Step 1: 确定审查范围

- git 仓库中：`git diff` 获取变更
- 非 git 仓库：用 glob 查找最近修改的文件

## Step 2: 自动选择审查策略

根据变更类型自动选择：

| 变更规模 | 策略 | 读取 |
|----------|------|------|
| < 50 行 | 快速审查 | `references/quick-review.md` |
| 50-200 行 | 标准审查 | `references/checklist.md` |
| > 200 行 | 深度审查 | `prompts/full-audit.md` |
| 涉及 auth/crypto/database | 安全审查 | `references/dotnet-checklist.md` |
| 涉及 test 文件 | 测试审查 | `references/checklist.md` |

## Step 3: 按文件类型选择检查清单

| 文件类型 | 审查清单 |
|----------|----------|
| `.cs` | `references/dotnet-checklist.md` |
| `.vue` | `references/vue-checklist.md` |
| `.sql` | `references/sql-checklist.md` |
| `*.json` / `*.xml` | `references/config-checklist.md` |

## Step 4: 执行审查

1. 读取对应的检查清单
2. 按清单逐项检查
3. 记录发现的问题

## Step 5: 输出报告

读取 `templates/audit-report.md` 获取标准报告格式。
