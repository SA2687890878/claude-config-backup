# mattpocock/skills 吸收方法论

> 2026-06-25 评估得出。适用于 Harness Engineering 设计。

## 核心结论

mattpocock 的精华不是 skills 本身，而是 writing-great-skills 方法论。不要全盘安装他的 skills。

## 吸收了 3 个高 ROI 概念

### 1. Phase 0 建反馈循环

排查 bug 前先建一个 tight + red-capable 的命令：
- 失败的测试（首选）
- API 调用
- 最小化复现脚本
- 数据库查询验证
- 日志注入
- git bisect

完成标准：一条命令，稳定复现，秒级，agent 可运行。
反模式：读代码猜原因时停下来，先建循环。

### 2. 结构化假设

生成 3-5 个假设，不是 1 个（防锚定效应）。
每个假设可证伪：如果 X 是原因，那么改变 Y 会让 bug 消失。
展示给用户排优先级。

### 3. 双轴审查

Standards（规范）+ Spec（需求）分开报告，不合并排序。
原因：一个 change 可以 Standards pass + Spec fail，反过来也行。

## 不要全盘安装的原因

- 他的 CONTEXT.md 工作流跟 Memory/Knowledge 体系冲突
- 他的 TDD/PRD/issue 工作流对个人开发者不适用
- 他的 skills 是 TypeScript 生态，不直接适用 .NET

## Skill 编写纪律（已落地到 skill-manager/references/skill-writing-discipline.md）

每个 skill 必须有：
- 第三人称 description（官方规范）
- 每个阶段的 completion criteria（防 premature completion）
- Anti-patterns（告诉 agent 不要做什么）
- References 文件在 SKILL.md 中明确引用

No-op 测试：写完 skill 后，每句话过一遍，删掉它 agent 行为会变吗？没变就删。
