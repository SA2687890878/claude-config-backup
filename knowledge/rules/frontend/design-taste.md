---
paths:
  - "**/*.vue"
  - "**/*.jsx"
  - "**/*.tsx"
  - "**/*.html"
---

# 前端设计分级（Design Taste）

> 提炼自 PCS Design Taste 适配规范（马诺整理，已去业务化），按需加载。
> 触发词：设计 / 风格 / 效果图 / 美化 / 视觉风格 / Design Taste。
> 通用 UI 查证见 `frontend/ui-rules.md`；红线见 `rules/frontend/ui-redlines.md`。

## 设计三轴分级（1-10，先定档再动手）
- **DESIGN_VARIANCE 布局变化**：1-3 对称稳定传统业务布局；4-7 适度错位/非对称留白；8-10 强非对称/Bento/分屏。
- **MOTION_INTENSITY 动效强度**：1-3 仅 hover/active 反馈；4-7 页面进入、列表错峰、轻量弹性；8-10 滚动叙事、视差、复杂编排。
- **VISUAL_DENSITY 信息密度**：1-3 展示型大留白；4-7 日常产品页面；8-10 数据密集工作台，减少无意义容器。

复杂布局在窄视口必须回落为单列。

## 确认要求（门禁）
- 修改前必须输出 Markdown 页面效果图（桌面 + 移动 + 关键状态：加载/空/失败/禁用/提交中）。
- 效果图用 `text` 代码块绘制（CLI 禁止 Mermaid），标注 `[保留]` / `[新增]` / `[删除]` / `[移动]`。
- 单独确认动画策略（不增加 / 基础动效 / 增强动效），不得与设计/可用性审核合并询问。
- 增强动效须说明依赖、性能、`prefers-reduced-motion` 降级；未经确认不得加动画或装依赖。

## 转换红线
- React / Next.js / Tailwind / Framer Motion 内容转 Vue 等价实现，不做框架迁移。
- Design Taste 只能调整布局/密度/材质/层级/动效等可变轴，**不得覆盖**：基础 Token、组件库公开行为、交互状态机、可访问性、表格共享外观（`ui-rules.md` / `pcs-web-frontend.md` TABLE 规则）。
- 用户拒绝 Design Taste 时仍须修复基础 UI 规则不合规项。
