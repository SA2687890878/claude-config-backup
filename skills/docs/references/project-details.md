# 项目文档生成详细流程

## 步骤

1. 检查现有文档：`ls docs/project/` 不存在则创建目录
2. 分析代码库：
   - 项目结构（目录分布、文件数量）
   - 技术栈（从 `.csproj` 识别框架版本）
   - 架构模式（Controllers/Services/Entities 分层）
   - 核心业务模块
3. 生成 5 份文档：

| 文档 | 路径 | 内容 |
|------|------|------|
| 项目概述 | `docs/project/README.md` | 简介、技术栈、目录结构、核心模块 |
| 架构设计 | `docs/project/architecture.md` | 分层说明、依赖关系、模块职责 |
| 技术栈 | `docs/project/tech-stack.md` | 框架版本、工具链、依赖关系 |
| 开发规范 | `docs/project/conventions.md` | 命名规范、代码规范、Git 规范、文档规范 |
| 数据库文档 | `docs/project/database.md` | 表结构、索引、关系、ER 图 |
