# 功能文档生成详细流程

## 步骤

1. 创建目录：`docs/features/{name}/`
2. 收集信息：需求、设计、实现
3. 生成 4 份文档：

| 文档 | 路径 | 内容 |
|------|------|------|
| 需求文档 | `docs/features/{name}/01-requirement.md` | 用户故事、验收标准、约束条件 |
| 需求分析 | `docs/features/{name}/02-analysis.md` | 功能边界、异常场景、数据流 |
| 设计文档 | `docs/features/{name}/03-design.md` | 技术方案、代码变更、数据库变更 |
| 任务清单 | `docs/features/{name}/04-tasks.md` | 开发任务、测试任务、依赖关系 |
