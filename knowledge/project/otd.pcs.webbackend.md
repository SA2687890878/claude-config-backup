# otd.pcs.webbackend 项目知识

> PCS（Production Control System）Web 后端，企业级生产管理平台。

## 基本信息

| 项 | 值 |
|----|-----|
| 路径 | `E:\Code WorkSpace\otd.pcs.webbackend\` |
| 框架 | .NET 8.0 |
| 数据库 | SQL Server |
| 认证 | JWT + IdentityServer4 |
| 后台任务 | Hangfire |
| 日志 | Serilog |
| 存储 | AWS S3 / Minio |

## 解决方案结构

```
otd.pcs.webbackend.sln
├── src/
│   ├── otd.pcs.webbackend/          # 主 Web API（Controllers/Services/Entities/Dtos）
│   ├── otd.pcs.Infrastructure/       # 基础设施层
│   └── otd.pcs.publishManagement/    # 发布管理模块
```

## 主项目关键目录

| 目录 | 职责 |
|------|------|
| Controllers/ | API 控制器（~41 个） |
| Services/ + Interfaces/ | 业务逻辑 + 接口定义 |
| Entities/ + DbContexts/ | EF Core 实体 + DbContext |
| Job/ | Hangfire 后台任务 |
| Lib/ + Utils/ | 公共库 + 工具类 |
| Resources/ | 国际化资源文件 |

## 核心业务域

| 业务域 | Controller 示例 |
|--------|----------------|
| AGV 调度 | AgvTask, AgvSystem, AgvVehicle* |
| 生产运营 | PcsOps*, PcsEquipment, PcsSchedule |
| 追溯 | PcsTrace, PcsItemNo |
| 工具治具 | PcsToolFixture |
| 认证 | Auth, UserAuth |

## 文档中心（按需读）

- 入口：`docs/00-文档中心.md`（31 个专业文档）
- 架构设计：`docs/架构设计/`
- API 文档：`docs/API文档/`
- 快速参考：`docs/DOCUMENTATION_QUICK_REFERENCE_CARD.md`

## 常见开发场景

| 场景 | 关键文件 |
|------|---------|
| 新增 API | Controllers/ + Services/ + Interfaces/ |
| 新增实体 | Entities/ + DbContexts/ |
| 新增后台任务 | Job/ + Startup.cs |
| 数据库迁移 | DbContexts/ + dotnet ef migrations |

## 注意

- 路径：项目在 **E 盘**（CLAUDE.md 中 F: 路径为过时映射，待修正）
- SQL Server 为主，写 SQL 注意 T-SQL 语法
- 加密机制：待确认（若 .cs 加密，遵循 code-access 规则）
