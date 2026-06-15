---
name: vue2-i18n-rules
description: Vue 2 + Element UI 多语言实现规则 — $t() 只能在 template 和 computed/methods 中使用
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 058ac2e3-b32a-454b-a353-c0f4e6f1f077
---

Vue 2 项目中使用 `$t()` 做多语言时，有严格的使用范围限制。

## 使用范围

| 位置 | 能否用 `$t()` | 说明 |
|------|-------------|------|
| template | ✅ | `{{ $t('key') }}` 或 `:label="$t('key')"` |
| computed | ✅ | `this.$t('key')` |
| methods | ✅ | `this.$t('key')` |
| data() | ❌ | 不能用，data 初始化时 i18n 可能未就绪 |
| filters | ❌ | 不能用 |

## 表单验证规则的正确写法

```javascript
// ❌ 错误：rules 定义在 data 中
data() {
  return {
    formRules: { name: [{ required: true, message: this.$t('required'), trigger: 'blur' }] }
  }
}

// ✅ 正确：rules 定义在 computed 中
computed: {
  formRules() {
    return { name: [{ required: true, message: this.$t('required'), trigger: 'blur' }] }
  }
}
```

## 语言文件结构

- 中文：`src/utils/i18n/config/zh/plcProtocol.js`
- 英文：`src/utils/i18n/config/en/plcProtocol.js`
- 西班牙文：`src/utils/i18n/config/es/plcProtocol.js`
- 泰文：`src/utils/i18n/config/th.js`（内联）
- 注册：在 `zh.js`/`en.js`/`es.js` 中 `import` 并 `...展开`

**Why:** Vue 2 的 data() 在组件初始化时执行，此时 i18n 实例可能还未完全加载。
**How to apply:** 动态文本（验证规则、弹窗标题等）用 computed，静态文本用 template 中的 `$t()`。
