# 全局规则

## 行为原则
- 多种解释时选最符合上下文的，更简单的方法直接用，真正不确定才问
- 最少代码解决问题，不做未请求的抽象和灵活性
- 只改必须改的，匹配现有风格，每行改动追溯到用户请求
- 多步骤任务列出计划，循环直到验证通过
- 回答技术问题前先查阅文档/源码，不确定时明确说明
- 必须使用简体中文回答和思考，编写代码注释和文档也使用简体中文

## 环境
- 简体中文 | Windows + PowerShell
- .NET 8.0（Web）+ .NET Framework 4.5.2（WPF）| Vue 2
- SQL Server（老项目）| PostgreSQL（新项目）

## 项目速查
| 项目 | 路径 | 数据库 |
|------|------|--------|
| pcs.webbackend | `F:/Code WorkSpace/pcs.webbackend/` | SQL Server |
| pcs.crontabservice | `F:/Code WorkSpace/pcs.crontabservice/` | SQL Server |
| OTD-* | `F:/OTD Code WorkSpace/` | PostgreSQL |

## 规则优先级
项目级 `.claude/` > 全局 `rules/*.md` > 本文件

## 核心禁止
- 禁止 .Result / .Wait()（同步阻塞）
- 禁止直接 push 到 main/develop
- 禁止硬编码密钥/密码/token

## 压缩保留
当压缩对话时，始终保留：修改文件列表、测试命令、验证结果。

## 规则引用
@rules/tools/model-strategy.md
@rules/quality/gates.md
@RTK.md
