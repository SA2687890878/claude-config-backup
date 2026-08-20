---
name: verification-before-completion
description: "该技能用于在声明完成、提交或交付前执行证据化验证。触发：验证、确认完成、能提交了吗、verify、/verification-before-completion。"
version: 3.0.0
---

confidence: A|B|C（对结论的信心）
```

- 缺 scope/uncovered = 只报结果不报覆盖，视为不完整
- confidence 依据：A=退出码+完整输出确认；B=部分验证+已知缺口；C=推测未运行

## 落盘判定（sentinel）

**宣称完成时的成功证据必须是可核验的落盘事实，不靠 stdout 自述：**

- 长跑命令：证据 = 产物文件存在 / 退出码 0 / 外部事实（如 `git log -1` 能看到该 commit）
- stdout 会被截断、后台化、管道异步化——"我看到了输出"不算证据
- 失败重试前：先确认上次是否已落盘（避免重复执行幂等破坏性命令）
- 反向同样成立：产物未落盘 = 未完成，即使"AI 说没问题"

读取 `references/verification-details.md` 了解常见验证要求和红旗信号。

---

> 经验沉淀 / 进度保存 / 恢复工作 → 交给 `save-memory` skill("保存经验"、"保存进度"、"继续工作")。
> 本 skill 只负责"完成前验证"这一个职责。

## 反模式

- 不要用旧输出、缓存或“应该通过”替代新鲜证据。
- 不要隐藏未覆盖范围、残留风险或失败命令。
- 不要把 stdout 自述当作落盘事实。
- 不要在验证未完成时声明任务完成或允许提交。

## 阶段门禁

- [ ] 识别验证目标和范围后再选择命令。
- [ ] 命令已实际执行并读取完整结果。
- [ ] 产物、退出码、git 状态或文件存在性已核对。
- [ ] 收据包含 scope、uncovered、residual 和 confidence。

## 完成标准

- [ ] 验证命令已执行（新鲜、完整输出），未跳过"识别→运行→读取→验证→结论"任一步
- [ ] 完成收据已填写：action / result / scope / uncovered / residual / confidence 六槽齐全
- [ ] scope 和 uncovered 已诚实列出（未只报结果不报覆盖）
- [ ] 证据为可核验的落盘事实（产物文件存在 / 退出码 0 / git log -1），不靠 stdout 自述
- [ ] confidence 依据明确：A=退出码+完整输出 / B=部分验证+已知缺口 / C=推测未运行
