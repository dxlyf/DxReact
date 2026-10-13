# 任务
用 Vue 3 + TypeScript + TDesign Vue Next 开发一个 `SchemaForm` 组件：
根据 Schema 配置动态渲染表单，支持 string / number / object / array 四种字段类型，
object 和 array 可无限层级嵌套。

# 一、技术栈与约束
- Vue 3 `<script setup>` + TypeScript，Composition API
- UI 组件库：TDesign Vue Next（t-input / t-input-number / t-popup / t-checkbox /
  t-tabs / t-button / t-dialog / t-tooltip / t-tag 等）
- 拖拽排序：sortablejs(已安装)
- 样式：Tailwind CSS 处理布局间距，TDesign 自带样式负责控件外观
- 组件为受控组件：`v-model` 绑定表单值
- 组件命名前缀统一为 `SchemaForm` / `Schema` 开头，避免与业务组件冲突

# 二、类型定义（types.ts）

```ts
export type FieldType = 'string' | 'number' | 'object' | 'array';

export interface BaseField {
  key: string;                 // 字段唯一标识，同时作为 value 中的属性名
  label: string;               // 显示名
  type: FieldType;
  defaultCollapsed?: boolean;  // 仅 object/array 有效，默认 false（展开）
}

export interface StringField extends BaseField {
  type: 'string';
  placeholder?: string;
  defaultValue?: string;
}

export interface NumberField extends BaseField {
  type: 'number';
  placeholder?: string;
  min?: number;
  max?: number;
  defaultValue?: number;
}

export interface ObjectField extends BaseField {
  type: 'object';
  fields: FieldSchema[];        // 预设字段列表
  defaultVisible?: string[];    // 默认显示的字段 key；不传 = 全部显示
  togglable?: boolean;          // 是否允许切换字段显隐，默认 true
  allowAddField?: boolean;      // 是否允许手输新增字段，默认 true
}

export interface ArrayField extends BaseField {
  type: 'array';
  itemFields: FieldSchema[];    // 每一项的字段结构（每项本质是一个 object，固定不可增删）
  defaultValueCount?: number;   // 初始项数，默认 0
  maxItems?: number;            // 最大项数；不传 = 无限制
  sortable?: boolean;           // tab 是否可拖拽排序，默认 false
  removable?: boolean;          // 是否可移除项，默认 true
  getItemLabel?: (index: number, item: any) => string; // tab 标题，默认「项 N」
}

export type FieldSchema = StringField | NumberField | ObjectField | ArrayField;

// 运行时通过手输新增的字段，第一版固定为 string 类型
export interface RuntimeAddedField extends StringField {
  __runtimeAdded: true;
}
```

# 三、组件 Props / Emits

```ts
interface SchemaFormProps {
  schema: FieldSchema[];                         // 初始 schema
  modelValue: Record<string, any>;               // 表单值（受控）
  hiddenValues?: Record<string, any>;            // 隐藏值暂存区（可选，受控）
}

// emits
// 'update:modelValue'      表单值变化
// 'update:hiddenValues'    隐藏值暂存区变化（仅在传入 hiddenValues 时使用）
// 'schema-change'          手输新增字段后回传最新 schema
```

外部使用示例：

```vue
<SchemaForm
  v-model="formValue"
  v-model:hidden-values="hiddenValue"
  :schema="schema"
  @schema-change="onSchemaChange"
/>
```

# 四、值模型
- `modelValue` 是与 schema 同构的普通对象
- object 字段的值是对象，array 字段的值是数组，每个元素是对象
- 渲染时若某字段在 value 中不存在，用 `defaultValue` 初始化；数组按 `defaultValueCount` 初始化
- 任意叶子节点变化，向上冒泡出完整的顶层 value，通过 `update:modelValue` 提交

# 五、各类型的渲染与交互

## string
- 用 `<t-input>`，绑定 label，透传 placeholder

## number
- 用 `<t-input-number>`，透传 min / max / placeholder

## object
渲染成一个带边框的分组卡片：

- 头部：展开/收起箭头 + label + 右侧「添加字段」按钮
- 点击头部可收起/展开，内容区高度过渡动画（200ms），收起后只留头部
- **收起/展开状态属于组件内部 UI state，不进入 value，也不随 schema 变化重置**
- 内容区：按顺序渲染当前可见的子字段（递归调用本组件的渲染逻辑）

### 「添加字段」Popover（重点）
- 用 `<t-popup placement="top">` 实现，**弹出位置必须在按钮正上方**
- 触发按钮点击后展开，点击外部或 Esc 关闭
- `togglable: false` 时不渲染该按钮，全部字段固定显示

Popover 内容结构自上而下：

1. **手输新增区**（`allowAddField !== false` 时显示）
   - 一个 `<t-input>`（placeholder：「输入字段名」）+ 一个「添加」按钮
   - 字段名校验：非空、trim 后不为空、且不与 `fields` 中已有 key 重复
   - 校验失败：输入框下方红字提示，不关闭 Popover
   - 点击「添加」或回车：向当前 object 的 `fields` 追加
     `{ key, label: key, type: 'string', __runtimeAdded: true }`，
     **默认选中（可见）**，触发 `schema-change`，清空输入框并保持焦点以便连续添加
2. **分隔线**
3. **已存字段列表**：每行 = 左「字段名」+ 右 `<t-checkbox>`
   - 选中 = 表单中显示该字段；未选中 = 不显示
   - 初始选中状态由 `defaultVisible` 决定，未配置则全部选中
4. **底部操作条**：`全选` / `全不选` / `关闭`

### 显隐切换时的值处理（必须严格实现）
- 取消勾选 → 该字段的值从 `modelValue` 中移除，暂存到隐藏值暂存区
  （key 为字段路径，如 `user.address.city`），触发 `update:modelValue`
- 重新勾选 → 从暂存区取回并写回 `modelValue`；若暂存无值则用该字段的 `defaultValue`，
  触发 `update:modelValue`
- 首次挂载时若发现传入的 `modelValue` 含隐藏字段的值，剥离到暂存区并触发一次
  `update:modelValue`

## array
渲染成一个带边框的分组卡片：

- 头部：展开/收起箭头 + label + 项数统计 `(2/5)` + 右侧「添加项」按钮
- 收起/展开行为与 object 完全一致（UI state，不进 value）
- **array 不支持添加字段**，`itemFields` 完全由外部 schema 决定，界面上不提供字段管理入口
- 内容区：**Tabs 形式**展示每一项，一次只显示一个 tab 的内容
  - 用 `<t-tabs>` + `<t-tab-panel>` 实现
  - Tab 标题默认「项 1」「项 2」…，支持 `getItemLabel` 自定义
  - Tab 内容：按 `itemFields` 渲染一个 object 表单（递归调用本组件的渲染逻辑）
  - 每个 tab 右侧有 × 关闭按钮，点击后**二次确认**（用 `DialogPlugin.confirm`），
    确认后移除该项及其数据
  - `removable: false` 时不显示 ×
  - `sortable: true` 时 tab 可拖拽排序（用 `vuedraggable@next` 包裹 tab 头列表），
    拖拽时显示插入位置指示；`sortable` 默认 false 不启用
  - 排序后 `modelValue` 数组顺序同步调整
- 「添加项」按钮：新项初始化为 `itemFields` 的默认值；
  项数达到 `maxItems` 时按钮禁用并用 `<t-tooltip>` 提示已达上限

# 六、隐藏值暂存机制（核心）

组件需要维护两份数据：

```
modelValue           ← 受控，外部持有，只放"可见字段"的值
hiddenValues         ← 隐藏字段的值，key = 字段路径（. 连接，数组用索引）
```

规则：

1. **受控优先**：若外部传入 `hiddenValues` prop，则使用受控模式，通过
   `update:hiddenValues` 回传；否则组件内部用 `ref` 维护，不对外暴露
2. **路径 key**：形如 `user.address.city`，数组用索引如 `list.0.name`
3. **数组路径的脆弱性**：删除中间项会导致后续索引偏移，第一版接受该限制，
   在代码中用 `// TODO` 注释标出
4. 暂存区**不参与表单校验、不参与提交**；外部若需持久化，通过
   `update:hiddenValues` 自行处理（例如存 localStorage）

# 七、组件拆分

按以下文件结构组织，先说明每个文件职责，再写代码：

```
FSchemaForm/
├── index.ts                       # 对外导出
├── types.ts                       # 全部类型定义
├── SchemaForm.vue                 # 顶层入口，遍历 schema 分发渲染
├── fields/
│   ├── StringField.vue
│   ├── NumberField.vue
│   ├── ObjectField.vue            # 含 Popover 字段管理与显隐逻辑
│   └── ArrayField.vue             # 含 Tabs + 拖拽 + 移除确认
├── components/
│   ├── CollapseCard.vue           # 通用收起展开卡片容器
│   └── FieldPopover.vue           # 通用字段管理 Popover（手输 + 勾选）
├── composables/
│   ├── useSchemaForm.ts           # value 的读写、默认值初始化、冒泡
│   └── useHiddenValues.ts         # 隐藏值暂存区（受控/非受控二选一）
└── utils/
    ├── value.ts                   # 路径读写、默认值构建、值清理工具
    └── schema.ts                  # schema 遍历、字段查找工具
```

# 八、边界与异常
- schema 为空数组：渲染空状态提示
- `modelValue` 缺少 schema 定义的字段：渲染时自动补默认值
- 数组项数为 0：内容区显示「暂无数据，点击右上角添加」
- 拖拽排序过程中不触发 `update:modelValue`，松手后一次性提交
- 嵌套 5 层以上时用 `v-memo` 或 `defineAsyncComponent` 隔离子字段，避免全量重渲染
- Popover 内新增字段时若与隐藏中的字段 key 冲突，视为重复，拒绝新增

# 九、交付要求
1. **先不要写代码**。先输出：文件拆分方案 + 各文件职责 + 关键数据结构 +
   你对不确定点的提问
2. 我确认后，再分文件输出代码，每个文件独立代码块（.vue 文件用完整 SFC 格式）
3. 关键逻辑加中文注释
4. 最后附一份 mock schema + 使用示例（含默认值），能直接 `npm run dev` 跑起来# 任务
用 Vue 3 + TypeScript + TDesign Vue Next 开发一个 `SchemaForm` 组件：
根据 Schema 配置动态渲染表单，支持 string / number / object / array 四种字段类型，
object 和 array 可无限层级嵌套。

# 一、技术栈与约束
- Vue 3 `<script setup>` + TypeScript，Composition API
- UI 组件库：TDesign Vue Next（t-input / t-input-number / t-popup / t-checkbox /
  t-tabs / t-button / t-dialog / t-tooltip / t-tag 等）
- 拖拽排序：sortablejs(已安装)
- 样式：Tailwind CSS 处理布局间距，TDesign 自带样式负责控件外观
- 组件为受控组件：`v-model` 绑定表单值
- 组件命名前缀统一为 `SchemaForm` / `Schema` 开头，避免与业务组件冲突

# 二、类型定义（types.ts）

```ts
export type FieldType = 'string' | 'number' | 'object' | 'array';

export interface BaseField {
  key: string;                 // 字段唯一标识，同时作为 value 中的属性名
  label: string;               // 显示名
  type: FieldType;
  defaultCollapsed?: boolean;  // 仅 object/array 有效，默认 false（展开）
}

export interface StringField extends BaseField {
  type: 'string';
  placeholder?: string;
  defaultValue?: string;
}

export interface NumberField extends BaseField {
  type: 'number';
  placeholder?: string;
  min?: number;
  max?: number;
  defaultValue?: number;
}

export interface ObjectField extends BaseField {
  type: 'object';
  fields: FieldSchema[];        // 预设字段列表
  defaultVisible?: string[];    // 默认显示的字段 key；不传 = 全部显示
  togglable?: boolean;          // 是否允许切换字段显隐，默认 true
  allowAddField?: boolean;      // 是否允许手输新增字段，默认 true
}

export interface ArrayField extends BaseField {
  type: 'array';
  itemFields: FieldSchema[];    // 每一项的字段结构（每项本质是一个 object，固定不可增删）
  defaultValueCount?: number;   // 初始项数，默认 0
  maxItems?: number;            // 最大项数；不传 = 无限制
  sortable?: boolean;           // tab 是否可拖拽排序，默认 false
  removable?: boolean;          // 是否可移除项，默认 true
  getItemLabel?: (index: number, item: any) => string; // tab 标题，默认「项 N」
}

export type FieldSchema = StringField | NumberField | ObjectField | ArrayField;

// 运行时通过手输新增的字段，第一版固定为 string 类型
export interface RuntimeAddedField extends StringField {
  __runtimeAdded: true;
}
```

# 三、组件 Props / Emits

```ts
interface SchemaFormProps {
  schema: FieldSchema[];                         // 初始 schema
  modelValue: Record<string, any>;               // 表单值（受控）
  hiddenValues?: Record<string, any>;            // 隐藏值暂存区（可选，受控）
}

// emits
// 'update:modelValue'      表单值变化
// 'update:hiddenValues'    隐藏值暂存区变化（仅在传入 hiddenValues 时使用）
// 'schema-change'          手输新增字段后回传最新 schema
```

外部使用示例：

```vue
<SchemaForm
  v-model="formValue"
  v-model:hidden-values="hiddenValue"
  :schema="schema"
  @schema-change="onSchemaChange"
/>
```

# 四、值模型
- `modelValue` 是与 schema 同构的普通对象
- object 字段的值是对象，array 字段的值是数组，每个元素是对象
- 渲染时若某字段在 value 中不存在，用 `defaultValue` 初始化；数组按 `defaultValueCount` 初始化
- 任意叶子节点变化，向上冒泡出完整的顶层 value，通过 `update:modelValue` 提交

# 五、各类型的渲染与交互

## string
- 用 `<t-input>`，绑定 label，透传 placeholder

## number
- 用 `<t-input-number>`，透传 min / max / placeholder

## object
渲染成一个带边框的分组卡片：

- 头部：展开/收起箭头 + label + 右侧「添加字段」按钮
- 点击头部可收起/展开，内容区高度过渡动画（200ms），收起后只留头部
- **收起/展开状态属于组件内部 UI state，不进入 value，也不随 schema 变化重置**
- 内容区：按顺序渲染当前可见的子字段（递归调用本组件的渲染逻辑）

### 「添加字段」Popover（重点）
- 用 `<t-popup placement="top">` 实现，**弹出位置必须在按钮正上方**
- 触发按钮点击后展开，点击外部或 Esc 关闭
- `togglable: false` 时不渲染该按钮，全部字段固定显示

Popover 内容结构自上而下：

1. **手输新增区**（`allowAddField !== false` 时显示）
   - 一个 `<t-input>`（placeholder：「输入字段名」）+ 一个「添加」按钮
   - 字段名校验：非空、trim 后不为空、且不与 `fields` 中已有 key 重复
   - 校验失败：输入框下方红字提示，不关闭 Popover
   - 点击「添加」或回车：向当前 object 的 `fields` 追加
     `{ key, label: key, type: 'string', __runtimeAdded: true }`，
     **默认选中（可见）**，触发 `schema-change`，清空输入框并保持焦点以便连续添加
2. **分隔线**
3. **已存字段列表**：每行 = 左「字段名」+ 右 `<t-checkbox>`
   - 选中 = 表单中显示该字段；未选中 = 不显示
   - 初始选中状态由 `defaultVisible` 决定，未配置则全部选中
4. **底部操作条**：`全选` / `全不选` / `关闭`

### 显隐切换时的值处理（必须严格实现）
- 取消勾选 → 该字段的值从 `modelValue` 中移除，暂存到隐藏值暂存区
  （key 为字段路径，如 `user.address.city`），触发 `update:modelValue`
- 重新勾选 → 从暂存区取回并写回 `modelValue`；若暂存无值则用该字段的 `defaultValue`，
  触发 `update:modelValue`
- 首次挂载时若发现传入的 `modelValue` 含隐藏字段的值，剥离到暂存区并触发一次
  `update:modelValue`

## array
渲染成一个带边框的分组卡片：

- 头部：展开/收起箭头 + label + 项数统计 `(2/5)` + 右侧「添加项」按钮
- 收起/展开行为与 object 完全一致（UI state，不进 value）
- **array 不支持添加字段**，`itemFields` 完全由外部 schema 决定，界面上不提供字段管理入口
- 内容区：**Tabs 形式**展示每一项，一次只显示一个 tab 的内容
  - 用 `<t-tabs>` + `<t-tab-panel>` 实现
  - Tab 标题默认「项 1」「项 2」…，支持 `getItemLabel` 自定义
  - Tab 内容：按 `itemFields` 渲染一个 object 表单（递归调用本组件的渲染逻辑）
  - 每个 tab 右侧有 × 关闭按钮，点击后**二次确认**（用 `DialogPlugin.confirm`），
    确认后移除该项及其数据
  - `removable: false` 时不显示 ×
  - `sortable: true` 时 tab 可拖拽排序（用 `vuedraggable@next` 包裹 tab 头列表），
    拖拽时显示插入位置指示；`sortable` 默认 false 不启用
  - 排序后 `modelValue` 数组顺序同步调整
- 「添加项」按钮：新项初始化为 `itemFields` 的默认值；
  项数达到 `maxItems` 时按钮禁用并用 `<t-tooltip>` 提示已达上限

# 六、隐藏值暂存机制（核心）

组件需要维护两份数据：

```
modelValue           ← 受控，外部持有，只放"可见字段"的值
hiddenValues         ← 隐藏字段的值，key = 字段路径（. 连接，数组用索引）
```

规则：

1. **受控优先**：若外部传入 `hiddenValues` prop，则使用受控模式，通过
   `update:hiddenValues` 回传；否则组件内部用 `ref` 维护，不对外暴露
2. **路径 key**：形如 `user.address.city`，数组用索引如 `list.0.name`
3. **数组路径的脆弱性**：删除中间项会导致后续索引偏移，第一版接受该限制，
   在代码中用 `// TODO` 注释标出
4. 暂存区**不参与表单校验、不参与提交**；外部若需持久化，通过
   `update:hiddenValues` 自行处理（例如存 localStorage）

# 七、组件拆分

按以下文件结构组织，先说明每个文件职责，再写代码：

```
├── index.ts                       # 对外导出
├── types.ts                       # 全部类型定义
├── SchemaForm.vue                 # 顶层入口，遍历 schema 分发渲染
├── fields/
│   ├── StringField.vue
│   ├── NumberField.vue
│   ├── ObjectField.vue            # 含 Popover 字段管理与显隐逻辑
│   └── ArrayField.vue             # 含 Tabs + 拖拽 + 移除确认
├── components/
│   ├── CollapseCard.vue           # 通用收起展开卡片容器
│   └── FieldPopover.vue           # 通用字段管理 Popover（手输 + 勾选）
├── composables/
│   ├── useSchemaForm.ts           # value 的读写、默认值初始化、冒泡
│   └── useHiddenValues.ts         # 隐藏值暂存区（受控/非受控二选一）
└── utils/
    ├── value.ts                   # 路径读写、默认值构建、值清理工具
    └── schema.ts                  # schema 遍历、字段查找工具
```

# 八、边界与异常
- schema 为空数组：渲染空状态提示
- `modelValue` 缺少 schema 定义的字段：渲染时自动补默认值
- 数组项数为 0：内容区显示「暂无数据，点击右上角添加」
- 拖拽排序过程中不触发 `update:modelValue`，松手后一次性提交
- 嵌套 5 层以上时用 `v-memo` 或 `defineAsyncComponent` 隔离子字段，避免全量重渲染
- Popover 内新增字段时若与隐藏中的字段 key 冲突，视为重复，拒绝新增

# 九、交付要求
1. **先不要写代码**。先输出：文件拆分方案 + 各文件职责 + 关键数据结构 +
   你对不确定点的提问
2. 我确认后，再分文件输出代码，每个文件独立代码块（.vue 文件用完整 SFC 格式）
3. 关键逻辑加中文注释
4. 最后附一份 mock schema + 使用示例（含默认值），能直接 `npm run dev` 跑起来