/**
 * JSON Schema 数据类型
 */
export type JsonSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null'

/**
 * JSON Schema 定义
 * @see https://json-schema.org/understanding-json-schema/
 */
export interface JsonSchema {
  /** 字段标题，用于表单标签显示 */
  title?: string
  /** 字段描述，用于表单帮助文本 */
  description?: string
  /** 数据类型，支持单个类型或类型数组 */
  type: JsonSchemaType | JsonSchemaType[]
  /** 对象类型的属性定义 */
  properties?: Record<string, JsonSchema>
  /** 数组类型的元素 schema */
  items?: JsonSchema
  /** 必填字段列表 */
  required?: string[]
  /** 枚举值列表，用于下拉选择 */
  enum?: (string | number | boolean)[]
  /** 默认值 */
  default?: unknown
  /** 字符串格式，如 email、uri、date 等 */
  format?: string
  /** 字符串最小长度 */
  minLength?: number
  /** 字符串最大长度 */
  maxLength?: number
  /** 数值最小值 */
  minimum?: number
  /** 数值最大值 */
  maximum?: number
  /** 是否排他性最小值，true 表示必须大于 minimum，数字表示排他性边界值 */
  exclusiveMinimum?: boolean | number
  /** 是否排他性最大值，true 表示必须小于 maximum，数字表示排他性边界值 */
  exclusiveMaximum?: boolean | number
  /** 数值的倍数约束 */
  multipleOf?: number
  /** 正则表达式模式验证 */
  pattern?: string
  /** 数组最小元素数量 */
  minItems?: number
  /** 数组最大元素数量 */
  maxItems?: number
  /** 数组元素是否必须唯一 */
  uniqueItems?: boolean
  /** 常量值，字段值必须等于此值 */
  const?: unknown
  /** 满足其中一个 schema 即可 */
  oneOf?: JsonSchema[]
  /** 满足其中任意一个 schema 即可 */
  anyOf?: JsonSchema[]
  /** 必须满足所有 schema */
  allOf?: JsonSchema[]

  // ============ 扩展属性 x-* ============
  /** 
   * 扩展格式，用于指定表单控件类型
   * - textarea: 多行文本框
   * - switch: 开关控件
   * - checkbox: 复选框
   * - radio: 单选框组
   * - color: 颜色选择器
   * - date: 日期选择器
   * - datetime: 日期时间选择器
   * - time: 时间选择器
   * - upload: 文件上传
   * - rate: 评分组件
   * - slider: 滑块
   * - cascader: 级联选择器
   * - tree-select: 树形选择器
   * - password: 密码输入框
   * - editor: 富文本编辑器
   */
  'x-format'?: string
  /** 自定义组件名称，用于完全自定义渲染组件 */
  'x-component'?: string
  /** 传递给组件的额外属性 */
  'x-props'?: Record<string, unknown>
  /** 自定义验证规则 */
  'x-rules'?: Array<{ trigger?: 'blur' | 'change'; message?: string; [key: string]: unknown }>
  /** 字段占位符文本 */
  'x-placeholder'?: string
  /** 是否禁用字段 */
  'x-disabled'?: boolean
  /** 是否只读 */
  'x-readonly'?: boolean
  /** 字段是否隐藏 */
  'x-hidden'?: boolean
  /** 字段显示条件，支持表达式或条件对象 */
  'x-visible-if'?: string | Record<string, unknown>
  /** 字段禁用条件 */
  'x-disabled-if'?: string | Record<string, unknown>
  /** 字段宽度，支持数字或字符串如 '50%'、'200px' */
  'x-width'?: number | string
  /** 栅格占位格数，用于响应式布局 */
  'x-span'?: number
  /** 栅格偏移格数 */
  'x-offset'?: number
  /** 字段排序权重 */
  'x-order'?: number
  /** 字段分组名称 */
  'x-group'?: string
  /** 是否可折叠 */
  'x-collapsible'?: boolean
  /** 默认是否折叠 */
  'x-collapsed'?: boolean
  /** 标签提示信息 */
  'x-tooltip'?: string
  /** 标签图标 */
  'x-icon'?: string
  /** 前缀图标 */
  'x-prefix-icon'?: string
  /** 后缀图标 */
  'x-suffix-icon'?: string
  /** 前缀文本 */
  'x-prefix'?: string
  /** 后缀文本 */
  'x-suffix'?: string
  /** 下拉选项，用于 enum 的扩展配置 */
  'x-enum-options'?: Array<{ label: string; value: string | number | boolean; disabled?: boolean }>
  /** 级联选择器的数据源 */
  'x-cascader-options'?: Array<{ label: string; value: string | number; children?: Array<{ label: string; value: string | number }> }>
  /** 树形选择器的数据源 */
  'x-tree-options'?: Array<{ label: string; value: string | number; children?: Array<{ label: string; value: string | number }> }>
  /** 上传组件配置 */
  'x-upload'?: {
    action?: string
    accept?: string
    multiple?: boolean
    maxFiles?: number
    maxSize?: number
    tips?: string
  }
  /** 评分组件最大值 */
  'x-rate-max'?: number
  /** 是否允许半选 */
  'x-rate-allow-half'?: boolean
  /** 滑块最小值 */
  'x-slider-min'?: number
  /** 滑块最大值 */
  'x-slider-max'?: number
  /** 滑块步长 */
  'x-slider-step'?: number
  /** 是否显示滑块输入框 */
  'x-slider-show-input'?: boolean
  /** 是否范围选择 */
  'x-slider-range'?: boolean
  /** 富文本编辑器配置 */
  'x-editor'?: {
    height?: number
    placeholder?: string
    toolbar?: string[]
  }
  /** 字段联动更新配置 */
  'x-linkage'?: Array<{
    target: string
    condition: string | Record<string, unknown>
    action: 'show' | 'hide' | 'enable' | 'disable' | 'setValue' | 'setOptions'
    value?: unknown
  }>
  /** 异步数据源配置 */
  'x-remote'?: {
    url: string
    method?: 'GET' | 'POST'
    params?: Record<string, unknown>
    dataPath?: string
    labelField?: string
    valueField?: string
  }
  /** 表达式计算字段 */
  'x-computed'?: string
  /** 字段变更时触发的回调字段 */
  'x-watch'?: Array<{
    field: string
    handler: string
  }>
  /** 其他未定义的属性 */
  [key: string]: unknown
}

/**
 * 验证错误信息
 */
export interface ValidationError {
  /** 错误字段路径，如 'user.name' 或 'items[0].price' */
  path: string
  /** 错误消息 */
  message: string
  /** 触发错误的 JSON Schema 关键字 */
  keyword?: string
  /** 验证参数 */
  params?: Record<string, unknown>
}

/**
 * 字段组件属性
 */
export interface FieldProps {
  /** JSON Schema 定义 */
  schema: JsonSchema
  /** 字段值 */
  modelValue: unknown
  /** 字段路径 */
  path: string
  /** 字段标签 */
  label?: string
  /** 是否必填 */
  required?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 验证错误列表 */
  errors?: ValidationError[]
}

/**
 * 主题配置
 */
export interface ThemeConfig {
  /** 标签宽度 */
  labelWidth?: string | number
  /** 标签对齐方式 */
  labelAlign?: 'left' | 'right' | 'top'
  /** 表单尺寸 */
  size?: 'small' | 'medium' | 'large'
  /** 是否显示字段描述 */
  showDescription?: boolean
  /** 是否显示必填标记 */
  showRequiredMark?: boolean
  /** 是否显示验证信息 */
  showValidation?: boolean
  /** 对象字段是否可折叠 */
  collapsible?: boolean
  /** 默认是否展开 */
  defaultExpanded?: boolean
}

/**
 * JSON Editor 配置
 */
export interface JsonEditorConfig {
  /** JSON Schema 定义 */
  schema: JsonSchema
  /** 表单数据 */
  modelValue?: Record<string, unknown>
  /** 主题配置 */
  theme?: ThemeConfig
  /** 是否禁用整个表单 */
  disabled?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 是否在值变化时验证 */
  validateOnChange?: boolean
  /** 是否显示 JSON 预览 */
  showPreview?: boolean
}

/**
 * 字段上下文信息
 */
export interface FieldContext {
  /** 字段路径 */
  path: string
  /** 嵌套深度 */
  depth: number
  /** 父级 Schema */
  parentSchema?: JsonSchema
  /** 根 Schema */
  rootSchema: JsonSchema
}
