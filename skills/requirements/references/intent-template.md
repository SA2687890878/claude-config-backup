# Intent 模板（半页纸）

> **何时写**：复杂/多人/高改动需求才写，写进 `{product_path}/intent.md`，简单需求跳过（见 `requirements/SKILL.md` Step2）。
> **为什么**：半页把“要什么/不做什么/边界”定死，堵住一次返工，返工省 2 轮对话。

```markdown
# Intent — <一句话目标>

## 为什么做（约束 1 行）
- 背景/痛点/时间技术数据合规限制，各 1 行，无“待定”

## 不做什么（非目标 1-3 条）
- [ ] <明确不做的事>

## 安全/权限（1 行）
- 数据范围 / 密钥 / 权限边界，写明

## 验收（可量化）
- <数字/用例/接口，不用“好用/更快”>

## 下一步
- [ ] 过 requirement/checklist.md → requirements.md → design
```

> 关联：`knowledge/rules/quality/checklist.md` 10行自检 + `quality/constitution.md` 三禁。
