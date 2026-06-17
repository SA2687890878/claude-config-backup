# 完整审计提示词

使用 review skill 的**完整模式**。

共享设置、覆盖度、报告模板、HTML 和 lint 规则在 `references/report-format.md` 中；在生成报告前加载该参考文件。

将此仓库视为准备稳定公开发布进行审计。

你的工作不是侮辱代码库。你的工作是以证据识别真正的工程风险。

## 设置

在编写发现之前，构建项目地图：

- 主要组件及其职责
- 运行时入口点和初始化顺序
- 架构边界 — 层、模块、依赖方向
- 数据流 — 请求/事件生命周期
- 状态所有权 — 什么拥有什么状态，如何修改
- 持久层 — 存储格式、迁移策略、备份

## 审计维度

读取以下文件获取各维度的审计提示词：

| 维度 | 读取 |
|------|------|
| 架构 | `prompts/architecture-audit.md` |
| 安全 | `prompts/security-audit.md` |
| 稳定性 | `prompts/stability-audit.md` |
| 性能 | `prompts/performance-audit.md` |
| 测试 | `prompts/testing-audit.md` |
| 可维护性 | `prompts/maintainability-audit.md` |
| 设计 | `prompts/design-audit.md` |
| 发布 | `prompts/release-audit.md` |
| 文档 | `prompts/documentation-audit.md` |
| 可观测性 | `prompts/observability-audit.md` |
| 配置 | `prompts/configuration-audit.md` |
| 数据完整性 | `prompts/data-integrity-audit.md` |
| 隐私 | `prompts/privacy-audit.md` |
| 可访问性 | `prompts/accessibility-audit.md` |
| 供应链 | `prompts/supply-chain-audit.md` |
| 成本 | `prompts/cost-audit.md` |
| AI安全 | `prompts/ai-safety-audit.md` |
| 降级 | `prompts/fallback-audit.md` |
| 测试真实性 | `prompts/testing-authenticity-audit.md` |
| 类型安全 | `prompts/type-safety-audit.md` |
| 前端状态 | `prompts/frontend-state-audit.md` |
| 后端API | `prompts/backend-api-audit.md` |
| 依赖权重 | `prompts/dependency-weight-audit.md` |
| 代码一致性 | `prompts/code-consistency-audit.md` |
| 注释覆盖 | `prompts/comment-coverage-audit.md` |

## 输出格式

读取 `templates/audit-report.md` 获取标准报告格式。

## 评分标准

读取 `rubrics/scoring.md` 获取评分标准。
