---
paths:
  - "**/*.vue"
  - "**/*.js"
---

# Vue 2 / 前端规范

- `v-for` 必须有 `:key`
- 禁止在 `computed` 里做副作用
- 事件监听在 `beforeDestroy` 中移除
- API 调用必须有错误处理
- 大列表使用虚拟滚动
- 用户输入做 XSS 防护
