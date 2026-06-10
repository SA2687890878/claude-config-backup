---
name: safe-ops
description: >
  安全操作 — 路由到"命令防护"、"代码修改评估"、"安全扫描"三条分支。
  命令防护在执行破坏性命令前发出警告；代码修改评估在改遗留代码前查调用链；
  安全扫描检测依赖漏洞、SQL 注入、硬编码密钥等安全问题。
  当用户说 /safe-ops、安全模式、小心操作、安全评估、安全扫描、
  安全检查、漏洞检测、影响分析时触发。
version: 2.0.0
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

执行以下任何操作前必须先警告用户并等待确认。

| 类型 | 模式 | 风险 |
|------|------|------|
| Bash | `rm -rf` / `rm -r` | 递归删除 |
| Bash | `git push --force` / `-f` | 覆盖远程历史 |
| Bash | `git reset --hard` | 丢失未提交工作 |
| SQL | `DROP TABLE` / `DROP DATABASE` | 数据丢失 |
| SQL | `TRUNCATE` / `DELETE FROM` 无 WHERE | 清空/删除全表 |
| PS | `Remove-Item -Recurse -Force` | 递归强制删除 |

检测到危险命令时：**暂停 → 展示风险 → 等待确认 → 再执行。**

---

## B. 修改评估

遗留代码可以改，但必须评估后改。

> **代码访问铁律**：评估影响时优先用索引。加密项目 `codegraph` 失效，改用 `search.ps1 -Callers/-Callees`。

### 核心原则

1. **能新增就不改** — 能新增方法/类就不改现有的
2. **必须改就评估** — 完整评估影响后出解决方案
3. **记录改动** — 用 `/memory-save` 记录重要改动

### 修改前必须做

1. 查调用方：READABLE 用 `codegraph_callers`；ENCRYPTED 用 `search.ps1 -Callers "Class.Method"`
2. 查影响范围：READABLE 用 `codegraph_impact`；ENCRYPTED 用 `search.ps1 -Callees`
3. 确认改动是否会影响其他模块
4. 确认是否需要同步修改调用方
5. 确认改动后如何验证

---

## C. 安全扫描

你是安全工程师。系统化检测代码中的安全问题。

**硬性规则：**
- 每个问题必须有具体文件和行号
- 问题分 CRITICAL/HIGH/MEDIUM/LOW 四级
- 发现问题直接给出修复建议
- 不说"可能有风险"，要么有，要么没有

### 扫描流程

**Step 1:** 确定范围（用户指定 / git diff / 全项目）

**Step 2:** 读取 `references/scan-patterns.md`，按 6 类逐项执行：
1. 依赖漏洞（`dotnet list package --vulnerable`）
2. 硬编码密钥（password/secret/token/connectionstring）
3. SQL 注入（拼接 SQL、FromSqlRaw 无参数）
4. XSS（@Html.Raw、未转义输出）
5. 认证授权（缺 [Authorize]、宽松 CORS）
6. 敏感数据泄露（日志记录密钥、堆栈外泄）

**Step 3:** 按严重级别分类输出报告。明显问题可直接自动修复（需用户同意）。
