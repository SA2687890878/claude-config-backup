---
name: systematic-debugging
description: >
  系统化调试与安全操作 — 遇到 bug、测试失败、意外行为时，先找根因再修复。
  包含安全操作：命令防护、代码修改评估、安全扫描。
  当用户说 /systematic-debugging、调试、排查、debug、为什么报错、
  找 bug、测试失败、安全模式、安全评估、安全扫描时触发。
version: 2.0.0
---

# 系统化调试

## 核心铁律

**没有根因调查，不允许修复。** 随机修复浪费时间、引入新 bug。

> **代码探索铁律**：定位 bug 时先用索引追调用链、最后才 Read。遵循 [`rules/tools/code-access.md`](../../rules/tools/code-access.md)：search.ps1 -Callers/-Callees 是调试追踪首选。

## 四个阶段

每个阶段必须完成才能进入下一个。

**Phase 1: 根因调查** — 读错误、复现、检查变更、收集证据
**Phase 2: 模式分析** — 找可工作示例、对比差异
**Phase 3: 假设与测试** — 形成理论、最小化测试
**Phase 4: 实现修复** — 创建测试、修复、验证

**3+ 次修复失败 = 架构问题。** 停下，质疑架构，和用户讨论。

读取 `references/debugging-details.md` 了解完整流程和红旗信号。

---

# 安全操作

## 路由

| 意图 | 分支 |
|------|------|
| 破坏性命令防护（执行危险命令前） | → A. 命令防护 |
| 代码修改影响评估（改遗留代码前） | → B. 修改评估 |
| 安全扫描（"扫描"、"漏洞"、"安全检查"） | → C. 安全扫描 |
| 不确定 | → 问用户 |

---

## A. 命令防护

执行危险命令前必须先警告用户并等待确认。

**危险命令模式：**
- Bash: `rm -rf`, `git push --force`, `git reset --hard`
- SQL: `DROP TABLE`, `TRUNCATE`, `DELETE FROM` 无 WHERE
- PS: `Remove-Item -Recurse -Force`

读取 `references/command-guard-details.md` 了解完整列表。

---

## B. 修改评估

遗留代码可以改，但必须评估后改。

**核心原则：**
1. 能新增就不改
2. 必须改就评估
3. 记录改动

读取 `references/modification-assessment-details.md` 了解评估流程。

---

## C. 安全扫描

系统化检测代码中的安全问题。

**扫描范围：**
1. 依赖漏洞
2. 硬编码密钥
3. SQL 注入
4. XSS
5. 认证授权
6. 敏感数据泄露

读取 `references/security-scan-details.md` 了解完整扫描流程。
