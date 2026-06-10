# 压缩 Memory 文件

压缩 .md 文件为 caveman 格式，省输入 token。技术内容完整保留。

## 流程

1. 备份原文件为 `<filename>.original.md`
2. 压缩：删废话、短同义词、片段 OK
3. 覆盖原文件

## 删

冠词、填充词（just/really/basically/actually）、客套、对冲、冗余短语（"in order to"→"to"）、连接词（however/furthermore）

## 保留（绝不修改）

- 代码块（``` 和缩进）— 原样复制
- 行内代码（反引号内容）
- URL 和链接
- 文件路径、命令、技术术语、专有名词
- 日期、版本号、数值
- 环境变量
- Markdown 标题结构、列表层级、表格结构

## 绝不压缩

- .py, .js, .ts, .json, .yaml, .yml, .toml, .env, .lock, .css, .html, .xml, .sql, .sh
- 混合内容文件中的代码部分

## 压缩示例

原文：
> You should always make sure to run the test suite before pushing any changes to the main branch. This is important because it helps catch bugs early and prevents broken builds from being deployed to production.

压缩后：
> Run tests before push to main. Catch bugs early, prevent broken prod deploys.
