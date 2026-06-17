# 代码一致性审计提示词

使用 review skill 的**代码一致性模式**。

共享设置、覆盖度、报告模板、HTML 和 lint 规则在 `references/report-format.md` 中；在生成报告前加载该参考文件。

关注代码风格一致性、命名约定、模式统一性以及对项目自身声明约定的遵守。

## 审查领域

### 命名约定
- 同一语言内大小写不一致（camelCase vs snake_case vs kebab-case）。
- 缩写使用不一致（例如 `idx` vs `index`、`cfg` vs `config`、`msg` vs `message`）。
- 模糊含义的名称（循环计数器之外的单字母变量、过于通用的名称如 `data`、`info`、`temp`）。
- 函数/方法名称未描述其作用（副作用未反映在名称中）。
- 调用点无意义的布尔参数（例如 `process(true, false)` 没有命名参数/结构）。

### 导入/模块组织
- 导入组未遵循项目约定（stdlib → 第三方 → 内部）。
- 污染命名空间的通配符导入（`use module::*`、`from module import *`）。
- 导入顺序不一致。
- 循环导入。

### 代码风格
- 缩进风格不一致
- 大括号风格不一致
- 空格使用不一致
- 换行使用不一致

### 模式使用
- 相似功能使用不同模式
- 错误处理模式不一致
- 日志记录模式不一致
- 配置管理模式不一致

## 输出格式

读取 `templates/audit-report.md` 获取标准报告格式。

## 评分标准

读取 `rubrics/scoring.md` 获取评分标准。
