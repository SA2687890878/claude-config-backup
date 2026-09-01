# pcs-web-frontend 项目知识（追溯平台前端）

> 触发词：**追溯平台前端 / PCS 前端 / 客户选择器 / 物品选择器 / 部门产线工位 / Element Plus / 追溯平台**
> 触发条件：用户提到上述任一词语且涉及前端实现时，按本节查证；否则不加载。
> 来源：马诺整理的前端规范（精华已提炼入库，自包含，不依赖原目录）。

## 技术栈硬约束
- 前端仅限 **Vue 3 + Element Plus**（默认）或 **Vue 2 + Element UI**（兼容备选），两栈二选一。
- 严禁 React / Next.js / Angular / Svelte / 裸 Vite 脚手架 / Tailwind 专属实现；涉及上述内容必须转换为 Vue 等价实现。
- 不迁移框架版本：Vue2 项目不升 Vue3，Vue3 项目不降 Vue2；不替换既有 UI 框架。
- 典型工作台页面结构 = 查询区 + 表格区（含状态标签）+ 分页 + 新建/编辑弹窗 + 删除确认。
- 状态标签用 Element 语义色（success/warning/danger/info），不手写颜色。
- 桌面弹窗宽度 Token = **520px**；内容过高内部滚动；移动端保留安全边距。

## 表格三件套（PCS 既定基线，追溯平台列表页一律套用）
- 操作列用无边框纯文字按钮，禁止图标；操作项将换行时只显示"更多"，全部操作收进下拉菜单。
- 普通数据列与操作列支持表头拖拽调宽。
- 查询 / 分页 / 刷新不重置本次页面会话已调列宽。

## 表格规则（TABLE-001~005，机器硬规则）
- **TABLE-001 外观**：标准表格 `border + stripe + size=small`，统一走 `tokens.table` 共享入口（表头背景/文字/斑马纹/悬停/边框/字号/字重/内边距/单行/48px 行高）；列标题简洁无句号；序号/选择列居中、数值列右对齐、时间列 `YYYY-MM-DD HH:mm`、状态列用 Tag；禁止页面级第二套 `.el-table` 视觉值。
- **TABLE-002 文本/空值**：短字段（状态/日期/序号）固定 `width`，长字段（名称/备注/地址）`min-width` + `show-overflow-tooltip`（Tooltip 显示完整原文）；空值保持空白，不得转成破折号 `—`。
- **TABLE-003 横向溢出/操作列**：操作列 `fixed=right` 固定最右；只准无边框纯文字按钮（Vue3 用 `link`，Vue2 用 `type=text`），无明确业务要求不加 icon；操作项将换行时只显示"更多"，全部收进 `el-dropdown`（菜单保留权限/禁用/确认/事件语义）；操作列宽度/视口/操作项动态变化时重新判断，不得按钮与更多来回闪烁；宽表横向溢出时同时固定首个业务标识列。
- **TABLE-004 表头固定/列宽**：所有列表页表格设 `max-height`（推荐 `calc(100vh - 320px)`）固定表头并保证分页在视口内，表格内部纵向滚动（无双重滚动）；除选择列/序号列/业务禁止列外，数据列与操作列必须可表头拖拽调宽；用列宽状态或 `header-dragend` 保存本次会话列宽，查询/分页/刷新不重置。
- **TABLE-005 状态覆盖**：必须覆盖首次加载/翻页/排序/筛选/刷新/空数据/筛选无结果/失败/无权限/多选状态；每次请求绑定 `v-loading`；空数据插槽说明原因+动作（如"清空筛选"）；多选后上方显示"已选 N 项"+批量操作；接口失败不得显示空数据；超大数据不一次性无约束渲染。

## 前端红线（REDLINE-001~010，MUST_NOT）
- **R1** 禁止业务代码裸写行内 `style`（如 `style="color:#07458B"`），样式走主题 Token / 预定义类 / 组件属性。
- **R2** 禁止表格嵌套表格（`el-table` 内嵌 `el-table`），关联数据用展开行结构化内容 / Drawer / Dialog。
- **R3** 禁止弹窗嵌套弹窗（Dialog 内再开 Dialog），复杂内容用 Tabs / Steps / 返回上一层。
- **R4** 禁止手写必填红星（`label="* 名称"`），必填标识必须由 Form rules `required=true` 自动生成。
- **R5** 禁止页面独立映射状态色（`status===1?'success':'danger'`），必须调用全局状态→Tag 类型映射函数。
- **R6** 禁止原生 `alert()` / `confirm()`：反馈用 `ElMessage`，破坏性确认用 `ElMessageBox`。
- **R7** 禁止成功后二次确认弹窗：成功反馈用 `ElMessage` 或页面状态更新，不再 `MessageBox.alert`。
- **R8** 禁止直接展示英文错误码：必须转换为用户可理解的业务问题+建议操作（错误码可作辅助编号附后）。
- **R9** 禁止格式不一致：日期/金额/数字/电话/百分比统一走全局 formatter（FORMAT-001~005），禁止页面临时拼接格式。
- **R10** 禁止无限制上传：所有 `el-upload` 必须设 `accept` / `limit` / `before-upload` / `on-exceed`（类型/大小/数量），缺失即阻止发布。

## 领域组件契约（4 个公共组件，业务页面只能传 v-model + disabled，禁止传领域配置）

### 客户选择 `PcsCustomerTableSelector.vue`
- 定位：客户数据弹窗表格检索、后端分页、单选和回填。非客户领域不得复用/复制。
- 固定契约：API 组件内置，业务不得传 URL/请求函数；仅一个查询条件；列 `corrId`/`corrName`；行键 `corrId`；文案（标题/按钮/查询提示/空态/错误态）组件内置。
- 接口：Props `modelValue`/`disabled`；Events `update:modelValue`/`selected`/`request-error`。
- 禁止传入：URL、`request`、`columns`、`rowKey`、标题、按钮文案、查询文案、分页模式。
- 容器：内部打开 Dialog，只允许用于普通页面/独立路由/非浮层内联表单；禁止放入已处于 Dialog 的新增/编辑组件（嵌套红线）；默认 body Teleport，不得 `teleported=false`；Teleport 后样式必须走 Dialog 自身 class，禁止依赖业务根节点 scoped 后代。

### 物品选择 `PcsItemTableSelector.vue`
- 定位：物品数据弹窗表格检索、后端分页、单选和回填。
- 固定契约：API 组件内置；列 `itemNo`/`itemName`/`spec`/`pattern`；行键 `itemNo`；搜索/翻页/切页容量均重新请求后端。
- 接口：Props `modelValue`/`disabled`/`showTrigger`(默认 true)；Events `update:modelValue`/`selected`/`request-error`/`opened`/`closed`；公开方法 `open()`。
- `selected` 固定返回 `{ itemNo, itemName, itemSpec, itemPattern }`。
- 禁止传入：API、列、行键、标题、按钮、查询文案、分页策略。旧 `SelectItem.vue` 仅兼容历史页面。
- 容器：同客户选择；`showTrigger=false` 仅供共同父页面同级 Dialog 顺序切换（隐藏内置触发按钮），禁止用 CSS 隐藏组件根节点；不得在隐藏宿主（`display:none`/`v-if`/`v-show`）上调用 `open()`。

### 部门产线工位树 `PcsDepartmentLineLocTree.vue`
- 定位：按"部门→产线→工位"展示当前用户有权限的组织生产层级。
- 固定契约：API `GET /api/PcsPublic/GetDepartmentLineLocTree`；根 `parentType=root`、展开部门 `parentType=department&parentId=部门编号`、展开产线 `parentType=line&parentId=产线编号`；默认只加载部门，部门/产线懒加载，工位为叶子节点；单选高亮整行点击，不显示复选框。
- 接口：Props `modelValue`/`disabled`/`height`；Events `update:modelValue`/`selected`/`request-error`。
- `selected` 返回 `{ id, nodeType, code, name, deptId, deptName, lineId, lineName, locId, locName }`；清空返回 `null`。
- 禁止传入：API、节点字段映射、层级、`node-key`、懒加载方法。
- 页面接入：树/侧栏必须列入 `surface_inventory`；筛选字段必须与选中层级匹配（选中部门只能声明部门筛选）；页面无工位字段时不得宣称已按工位筛选，应限制可选层级或在方案确认中明确降级。

### 部门产线工位设备联动下拉 `PcsDepartmentLineLocEquipmentSelect.vue`
- 定位：固定"生产部门→产线→工位→设备"四级单选联动。
- 复用结构：部门/产线/工位分别组合复用 `SelectDepartment`/`SelectLine`/`SelectLoc`；设备由组件内部请求 `GET /api/PcsEquipment/GetEquipmentListByLoc`（参数 `{ locId }`），业务不得传 URL/请求函数或重复维护设备下拉；组合表单中原子组件用 `fieldOnly`，禁止 Form 内嵌 Form。
- 固定数据映射：输出统一为 `deptId`/`lineId`/`locId`/`locName`/`equipmentId`/`equipmentName`；设备接口兼容旧 `equipment_id/equipment_name` 与升级 `equipmentId/equipmentName`；业务不得依赖原子组件 snake_case payload 或自行转换。
- 固定联动逻辑：
  1. 部门变化：保留 `deptId`，清空产线/工位/设备及设备选项。
  2. 产线变化：保留部门/产线，清空工位/设备及设备选项。
  3. 工位变化：保留部门/产线/工位，清空设备，按 `locId` 请求设备列表。
  4. 设备变化：回填设备编号和名称，触发最终 `selected`。
  5. 上级未选时下级控件禁用；禁用整个组件时四级全不可操作。
  6. 工位下无设备用统一业务提示，不保留旧设备值。
  7. 外部 `modelValue` 变化必须同步四级回显；值未变化不得重复 emit/重复请求。
  8. 设备请求绑定真实 loading；成功/空/业务失败/网络异常都必须结束，失败发 `request-error`。
  9. 设备请求必须用请求序号/取消机制防竞态——快速切换工位时旧响应不得覆盖新工位设备列表。
- 接口：Props `modelValue`/`disabled`；Events `update:modelValue`/`change`/`selected`/`request-error`。
- `change` 返回 `{ level, deptId, lineId, locId, locName, equipmentId, equipmentName }`；完整对象结构如上 6 字段。
- 响应式：桌面四列（各 6/24）/ 平板两列 / 手机单列全宽；Select 均 `small`+全宽+可搜索，设备允许清空。
- 迁移旧页面：必须删除原页面设备 `options`、设备 `loading`、工位→设备请求方法、重复字段映射；页面只保留完整选择对象及设备选中后的业务动作。

## 复用纪律
- 需求命中上述领域组件时**必须复用**，不得复制弹窗/表格/查询/分页/状态逻辑另造组件。
- `PcsTableSelectorBase.vue` 仅供公共领域组件内部复用，业务页面禁止直接引用。
- 组件缺陷在授权范围内修复根组件并评估全部调用点，不得创建同功能新组件绕开缺陷。
- 领域组件内部打开 Dialog，禁止放入已处于 Dialog 的新增/编辑组件（嵌套红线）；外层保留 Dialog 时用共同父页面同级顺序切换（保存草稿→关外层→等 `closed`→调 `open()`→`closed` 后恢复），禁止固定延时/同时显示/隐藏根节点。

## 设计 / 体验（通用部分见 `knowledge/rules/frontend/ui-rules.md`）
- **设计确认**：涉及页面结构/布局/控件/交互/视觉/响应式，修改前必须先展示 Markdown 页面效果图并单独确认（Design Taste）；禁止与动画/可用性审核合并询问。
- **动画策略**：Design Taste 确认后单独询问（不增加/基础动效/增强动效）；增强须说明依赖、性能、`prefers-reduced-motion` 降级；未经确认不得加动画或装依赖。
- **可用性审核**：页面修改和基础验证完成后单独询问（审核并修复/仅审核/不使用）；基于修改后的真实代码执行。
