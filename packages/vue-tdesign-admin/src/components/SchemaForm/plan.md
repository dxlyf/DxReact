你是一位资深 Vue3 + TypeScript 开发工程师。请为我开发一套「配置化表单生成器」，要求如下：

## 一、技术栈
- Vue 3 + TypeScript
- 组合式 API，优先使用 `<script setup lang="ts">`
- 不依赖任何第三方表单库（如 TDesign Vue），纯手写实现

## 二、核心概念
- **Schema（配置方案）**：用 JSON 结构描述表单的字段、容器、校验、显隐等。
- **Data（数据）**：独立于 Schema 的响应式对象，存储表单值。
- 支持 **无限层级嵌套**：容器可嵌套容器，列表项内可再嵌列表。

## 三、Schema 节点类型
1. **字段类型**：`input`、`number`、`select`、`date`、`textarea` 等。
2. **容器类型**：
   - `card`：卡片，带标题
   - `group` / `grid`：栅格布局（24 栅格）
   - `list`：动态数组，支持添加/删除项，`itemSchema` 内可再次包含 `list`，实现无限嵌套。
3. 每个节点可包含：
   - `key`：字段名或数据路径
   - `label`：标签
   - `span`：栅格占位（1~24）
   - `defaultValue`：默认值
   - `rules`：校验规则数组
   - `visible`：条件显隐，支持布尔值、表达式字符串（如 `"model.age > 18"`）或函数 `(model) => boolean`
   - `disabled`、`placeholder`、`props`（如 select 的 options）等

## 四、TypeScript 类型定义
请定义以下接口（可放在 `types.ts`）：
- `SchemaNode`：联合类型或基础接口，包含 `type`、`key`、`label`、`span`、`children`、`itemSchema`、`rules`、`visible`、`defaultValue`、`props` 等。
- `FieldRule`：`required`、`message`、`pattern`、`validator`。
- `FormContext`：包含 `model`、`errors`、`getValue`、`setValue`、`getError`、`setError`、`validate`、`reset`、`setData`、`getData`。
- `SelectOption` 等辅助类型。

## 五、表单上下文（provide / inject）
创建一个 `createFormContext(schema)` 函数，返回 `FormContext`，并使用 `provide` 注入，`inject` 在子组件中获取。要求：
- `model` 为 `reactive` 对象，根据 schema 的 `defaultValue` 自动初始化。
- `getValue(path)` / `setValue(path, value)`：支持点号路径（如 `contacts.0.name`），能正确读写嵌套对象和数组。
- `errors` 为 `reactive` 对象，键为字段路径，值为错误信息。
- `validate()`：异步遍历所有字段（包括列表内嵌套字段），执行 rules，返回 `Promise<boolean>`。
- `reset()`：清空 model 和 errors，重新应用默认值。
- `setData(data)`：深度合并数据到 model（先 reset，再合并）。
- `getData()`：返回深拷贝的纯数据（`JSON.parse(JSON.stringify(toRaw(model)))`）。

## 六、组件拆分与递归渲染
请创建以下组件（均使用 TS）：
1. **`FormRenderer.vue`**：接收 `schema: SchemaNode[]` 和 `path: string`，递归遍历 schema，对每个节点渲染 `<FormField>`。
2. **`FormField.vue`**：
   - 接收 `node: SchemaNode` 和 `path: string`。
   - 计算完整路径 `fullPath`。
   - 根据 `visible` 判断是否渲染。
   - 若是容器（card/group/grid/list），渲染对应布局，并递归调用 `<FormRenderer>`。
   - 若是 `list`，从 model 中取出数组，渲染每一项（每项用 `itemSchema` 渲染 `<FormRenderer>`），并提供「添加一项」「删除」按钮。
   - 若是普通字段，渲染 label、控件、错误信息。
3. **`WidgetRenderer.vue`**：
   - 接收 `node` 和 `path`。
   - 根据 `node.type` 渲染具体控件（input、number、select、date、textarea）。
   - 使用 `computed` 的 get/set 实现与 `ctx.model` 的双向绑定。

## 七、校验逻辑
- 支持 `required`、`pattern`、自定义 `validator(value, model) => string | void | Promise<string | void>`。
- 校验时需遍历所有字段，包括列表内嵌套的字段。可以写一个 `walk` 函数递归 schema 并考虑列表索引。
- 错误信息显示在对应字段下方，字段边框变红。
- 提交时调用 `ctx.validate()`，若有错误则提示。

## 八、条件显隐
- `visible` 支持：
  - 布尔值
  - 字符串表达式（如 `"model.province !== ''"`），使用 `new Function('model', 'with(model){ return (expr) }')` 求值，并缓存。
  - 函数 `(model) => boolean`
- 显隐变化时，不影响数据，仅控制渲染。

## 九、动态列表与无限嵌套
- `list` 节点的数据为数组，每项可添加/删除。
- `itemSchema` 内可以再次出现 `list`，从而形成无限层级。
- 添加项时，根据 `itemSchema` 的默认值初始化新项（可为空对象，由后续渲染时自动初始化字段）。

## 十、示例与使用
请提供一个完整的 `App.vue` 示例，包含：
- 一个复杂的 schema：包含「基本信息」卡片、「地址信息」卡片（含条件显隐）、「联系人列表」卡片（列表项内嵌套「紧急联系人」列表）。
- 底部展示实时数据（`JSON.stringify`）。
- 按钮：「校验并提交」「重置」「填充示例数据」。
- 填充示例数据时，调用 `ctx.setData()` 填入一个包含嵌套列表的数据对象。

## 十一、输出要求
- 给出完整代码，按文件组织：`types.ts`、`useFormContext.ts`、`FormRenderer.vue`、`FormField.vue`、`WidgetRenderer.vue`、`App.vue`。
- 每个文件顶部写清楚作用说明。
- 代码需类型安全，避免 `any`（必要时用 `unknown` 或泛型）。
- 注释关键逻辑，尤其是路径读写、表达式求值、递归遍历、列表增删。
- 确保代码可直接复制到 Vue3 + TS 项目中运行（可使用 Vite 创建项目）。

请开始编写代码。