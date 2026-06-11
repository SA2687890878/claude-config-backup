---
description: 代码审查 — 多维度审查代码变更，发现问题并提供改进建议
allowed-tools: Read, Grep, Glob, Bash
---

代码审查流程。从架构、质量、安全、性能等多维度审查代码。

## 执行方式

调用 `/code-review-workflow` skill 执行审查。

## 审查维度

1. 架构 — 分层与依赖、模块耦合、SOLID 原则
2. 质量 — 命名规范、代码质量、异常处理、null 安全
3. 安全 — SQL 注入、XSS、硬编码密钥、权限校验
4. 性能 — N+1 查询、同步阻塞、大对象、缺少索引
5. 最佳实践 — async/await、DI、配置管理、日志规范

## 输出格式

按严重级别分类：CRITICAL / HIGH / MEDIUM / LOW
