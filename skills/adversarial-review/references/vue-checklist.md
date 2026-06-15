# Vue 2 代码审查清单

## CRITICAL — 生产必炸

### XSS 风险
- [ ] v-html 是否使用（应避免，或做 XSS 过滤）
- [ ] 用户输入是否转义
- [ ] 动态绑定是否安全（:href、:src 等）
- [ ] 第三方库是否有已知 XSS 漏洞

### 数据泄露
- [ ] 敏感数据是否暴露在前端
- [ ] API 响应是否包含不必要的字段
- [ ] localStorage/sessionStorage 是否存储敏感信息

## HIGH — 很可能出问题

### v-for 问题
- [ ] v-for 是否有 :key（必须是唯一标识，不是 index）
- [ ] v-if 和 v-for 不要在同一元素上（v-if 优先级更高）
- [ ] 列表渲染是否有性能问题（大列表是否虚拟滚动）

### computed 副作用
- [ ] computed 中是否有副作用（API 调用、修改数据）
- [ ] computed 是否依赖外部状态
- [ ] computed 缓存是否正确失效

### 事件处理
- [ ] 事件监听是否在 beforeDestroy 中移除
- [ ] addEventListener 是否有对应的 removeEventListener
- [ ] 定时器是否在 beforeDestroy 中清除

### 表单验证
- [ ] 表单规则是否在 computed 中定义（不是 data）
- [ ] $t() 国际化是否在 computed 中使用（不是 data）
- [ ] 异步验证是否有加载状态

## MEDIUM — 可能出问题

### 性能
- [ ] 大列表是否使用虚拟滚动
- [ ] 频繁更新的组件是否使用 v-once / v-memo
- [ ] 路由懒加载是否配置
- [ ] 组件懒加载是否配置

### 状态管理
- [ ] Vuex 状态是否结构清晰
- [ ] 是否有直接修改 state 的情况（应用 mutation）
- [ ] getters 是否有缓存

### 样式
- [ ] scoped 样式是否正确使用
- [ ] 深度选择器（::v-deep）是否必要
- [ ] 样式覆盖是否有优先级问题

## LOW — 代码质量

- [ ] 组件命名是否清晰
- [ ] Props 类型定义是否完整
- [ ] 注释是否充分
- [ ] 无用代码是否清理
