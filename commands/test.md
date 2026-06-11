---
description: 测试执行 — 运行测试、分析失败、修复验证
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
---

测试执行闭环。运行测试、分析失败原因、修复并验证。

## 执行方式

调用 `/test-runner` skill 执行测试。

## 流程

1. 运行 `dotnet test` 获取完整输出
2. 解析测试数量、失败详情
3. 逐个分析失败测试，定位根因
4. 最小化修复，不改测试来"凑绿"
5. 重新运行测试确认通过
