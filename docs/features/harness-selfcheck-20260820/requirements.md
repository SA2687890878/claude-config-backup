# Harness 自检 Demo

## 概述
验证 Harness 全链路（需求→设计→开发→测试→提交）可闭环，产出首条 tasks/.index.json 活证据。

## 使用者
- 角色：Harness 维护者
- 场景：体检后验证 Gate/落盘/产物路径是否真实生效
- 频率：每次体检修复后

## 需求规格
### 核心功能
- [P1-5] 跑通最小任务，验证 active.json → .index.json 流转
- [验证] 每个阶段 Gate 不可跳过（需求确认→设计→开发→测试→提交）

## 成功标准
- tasks/.index.json 含首条记录
- git log 可追溯 demo 产物

## 约束
- 不改业务代码，仅验证流程
- 产物落盘至 docs/features/harness-selfcheck-20260820/