---
name: audit
description: >
  深度代码审计 — 25 个维度全覆盖，生成评分报告。
  适用于：发布前审计、重大变更审计、安全审计。
  当用户说 /audit、审计代码、深度审查时触发。
version: 1.0.0
---

# 深度代码审计

## 核心理念

**全面、客观、可执行。**

覆盖架构、安全、性能、测试、文档等 25 个维度，生成专业审计报告。

## 触发条件

1. **Code Gate 触发**
   - 新增/修改 > 100 行代码
   - 涉及安全相关文件

2. **Release Gate 触发**
   - 发布前自动执行 full 模式

3. **手动触发**
   - 用户说"审计代码"、"深度审查"

## 审计模式

| 模式 | 适用场景 | 维度 |
|------|---------|------|
| `full` | 发布前、重大变更 | 全部 25 个 |
| `security` | 安全相关变更 | 安全、隐私、供应链 |
| `stability` | 稳定性相关 | 稳定性、错误处理、并发 |
| `performance` | 性能优化 | 性能、成本、资源 |
| `quick` | 日常开发 | 架构、稳定性、性能 |

## 执行流程

### 第一步：选择审计模式

根据变更类型自动选择：

```python
def select_audit_mode(changed_files):
    security_keywords = ['auth', 'permission', 'security', 'crypto']
    if any(kw in f.lower() for f in changed_files for kw in security_keywords):
        return 'security,stability'
    
    if any('test' in f.lower() for f in changed_files):
        return 'testing,testing-authenticity'
    
    if len(changed_files) > 20:
        return 'full'
    
    return 'architecture,stability,performance'
```

### 第二步：执行审计

使用 Fuck_My_Shit_Mountain skill：

```bash
/fuck-my-shit-mountain --mode {audit_mode} --language zh --format markdown
```

### 第三步：处理结果

1. 存档到 `.claude/audits/` 目录
2. 关键发现存入 SQLite 索引
3. critical 问题阻断发布

## 审计报告格式

```markdown
## 审计报告

### 评分
- Security: 8.0/10 (A)
- Stability: 6.0/10 (B)
- Performance: 9.0/10 (A)
- Testing: 5.0/10 (B)
- Maintainability: 7.0/10 (A)
- **Overall: 7.0/10 (A)**

### 发现
| 维度 | 严重程度 | 问题 | 修复建议 |
|------|---------|------|---------|
| Security | HIGH | SQL 注入风险 | 使用参数化查询 |
| Stability | MEDIUM | 未处理异常 | 添加 try-catch |

### 修复优先级
1. [CRITICAL] 必须修复
2. [HIGH] 强烈建议修复
3. [MEDIUM] 建议修复
```
