# 知识同步方法

## 问题

项目级经验（memory/learnings.md）如何正确提炼到全局知识库（knowledge/）？

## 错误做法

**直接复制项目经验到全局知识库**：
- ❌ 没有读取内容就复制
- ❌ 没有判断是否过时
- ❌ 没有分析通用性
- ❌ 没有去掉项目特定细节

**后果**：
- 知识库包含过时的信息
- 知识库包含项目特定的细节
- 知识库内容冗余、混乱

## 正确做法

### 第一步：读取项目经验

```bash
# 读取项目级经验文件
cat ~/.claude/projects/<project>/memory/learnings.md
```

### 第二步：判断是否过时

**检查方法**：
1. 查看文件修改时间（超过 6 个月可能过时）
2. 检查内容是否与当前代码一致
3. 验证相关工具/框架是否已更新

**过时的例子**：
- "Read/Grep 工具无法处理 UTF-16 文件" → 可能已修复
- "CodeGraph 不能读取加密文件" → 可能已支持

### 第三步：分析通用性

**判断标准**：
- **通用知识**：任何项目都可能遇到（如 EF Core 可空属性）
- **项目特定**：只有该项目会遇到（如特定业务逻辑）

**通用知识的例子**：
- EF Core SqlNullValueException 排查
- .NET 8 Options 模式陷阱
- GitLab MR 流程

**项目特定的例子**：
- IJob 接口约束（只有该项目使用）
- 特定 API 响应格式（只有该项目使用）

### 第四步：提炼成通用知识

**提炼方法**：
1. 去掉项目特定的细节（项目名、具体文件路径等）
2. 保留通用的模式和最佳实践
3. 添加 "How to apply" 部分
4. 使用通用的术语和描述

**提炼前**：
```markdown
pcs.crontabservice 的 IJob 接口定义：
BaseResponse<TaskState> ExecuteAsync(CrontabTask task)
```

**提炼后**：
```markdown
## EF Core SqlNullValueException

### 场景
EF Core 查询时报错：SqlNullValueException

### 根因
实体属性声明为 string（非空），但数据库对应列存在 NULL 值
```

### 第五步：更新索引

```markdown
# knowledge/MEMORY.md

## Engineering（工程规范）
- [dotnet-async-constraints](engineering/dotnet-async-constraints.md) — .NET异步约束
```

## 检查清单

- [ ] 已读取项目经验内容
- [ ] 已判断是否过时
- [ ] 已分析通用性
- [ ] 已提炼成通用知识
- [ ] 已更新索引
- [ ] 已标记项目经验为"已同步"

## How to apply

- 每次提炼项目经验时，按照这个流程执行
- 不要直接复制，要先分析再提炼
- 只提炼真正有价值的通用知识
