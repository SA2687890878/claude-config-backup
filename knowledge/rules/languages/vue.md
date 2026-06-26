---
paths:
  - "**/*.vue"
  - "**/*.js"
---

# Vue 2 / 前端规范

## 核心规则
- `v-for` 必须有 `:key`
- 禁止在 `computed` 里做副作用
- 事件监听在 `beforeDestroy` 中移除
- API 调用必须有错误处理
- 大列表使用虚拟滚动
- 用户输入做 XSS 防护
- 访问嵌套对象属性前必须判空（`obj?.prop` 或三元表达式）
- `trim()` 调用前确保值非 null（用 `String(value).trim()`）

## i18n 多语言
- `$t()` 只能在 `template` 和 `computed`/`methods` 中使用
- **禁止**在 `data()` 中使用 `$t()`（data 初始化时 i18n 可能未就绪）
- 表单验证规则必须定义在 `computed` 中
- 动态文本用 `computed` 属性返回 `this.$t('key')`
- 语言文件：`src/utils/i18n/config/{zh,en,es,th}/`
- 新增语言 key 时，必须在所有四种语言文件中添加翻译
