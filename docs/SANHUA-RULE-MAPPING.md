# 三花数采规范吸收映射

> 来源：`E:\AI专项\三花数采组开发规范`。本表是提炼决策，不复制原文。

## 处理原则

- 全局只吸收跨项目、可判定、可验证的质量原则。
- 技术栈规则按需加载；PCS 领域规则项目化。
- 每条规则只有一个 Owner；已有规则优先补充，不新建平行 Skill。
- 规则与示例分离；固定行数、注释比例不作为质量门禁。

## 条目映射

| 来源 | 结论 | 唯一 Owner | 加载/验证 |
|---|---|---|---|
| 参数校验、权限校验 | 吸收 | `review` / API Gate | API 变更时；检查用例与拒绝响应 |
| 参数化查询、事务、幂等 | 吸收 | SQL 规则 / Design Gate | 数据库变更时；脚本与测试证据 |
| 超时、重试、降级、资源释放 | 吸收 | C# / Review / Test | 外部边界变更时；失败路径测试 |
| 异常不可静默吞掉 | 吸收 | C# / Review | 异常路径审查；保留上下文和堆栈 |
| 敏感日志防护 | 改写后吸收 | Security / Review | 日志变更时；字段脱敏检查 |
| 调用链、结果、耗时 | 改写后吸收 | 可观测性检查卡 | 日志/外部调用时；关联检索验证 |
| 空数据、异常数据、重复提交、弱网 | 吸收 | Test Gate | 功能测试时；边界/失败用例 |
| 版本兼容、迁移回滚 | 吸收 | Design / Release Gate | 跨版本或数据库变更时；回滚演练/脚本检查 |
| C# 命名、异步、DI、null | 吸收 | `languages/csharp.md` | C# 文件命中时 |
| Vue 命名、setup、交互 | 吸收 | `languages/vue.md` | Vue 文件命中时 |
| WPF UI 线程、绑定、释放 | 吸收 | `languages/wpf.md` | WPF/XAML 命中时 |
| PCS SYS/BIZ/SDK/DEV、TX/RX | 项目化 | `knowledge/project/sanhua/pcs-logging.md` | PCS 日志场景 |
| PCS 设备、SDK、状态码 | 项目化 | `pcs-device.md` | 设备/PLC/标刻场景 |
| PCS 公历/泰国时间规则 | 项目化 | `pcs-timezone.md` | 海外/分区表场景 |
| 三花分支与发布审批 | 项目化 | `pcs-release.md` | 三花发布场景 |
| 完整 JSON 默认入日志 | 不采用 | — | 改为白名单、脱敏、截断/采样 |
| 注释比例 ≥20% | 不采用 | — | 只要求说明非显然的 Why |
| 方法/组件固定行数红线 | 不采用 | — | 仅作为复杂度提醒 |
| 本地时间且不指定时区 | 不采用 | — | 全局要求明确时区；业务例外项目化 |
| 业务存储过程统一 `sp_` | 不采用 | — | 避免 SQL Server 系统前缀语义风险 |

## 目标落位

- 通用检查：补入现有 `review`、Gate、C#、Vue、SQL Server 规则。
- 新增按需卡：`knowledge/rules/languages/wpf.md`、`knowledge/rules/quality/logging-observability.md`。
- PCS 项目知识：本目录 `knowledge/project/sanhua/`。
- 领域精华已拆为：业务链路日志、SDK 调用契约、设备状态变化、调用链上下文、启动阶段、远程失败本地兜底、日志保留分层、PCS 测试矩阵和完整发布流程。

## 完成判定

只有同时满足以下条件，才称为“已吸收”：

1. 条目有唯一 Owner；
2. 有明确触发条件；
3. 有验证方式；
4. 不与既有规则冲突；
5. 真实任务中验证过加载范围和误报成本。
