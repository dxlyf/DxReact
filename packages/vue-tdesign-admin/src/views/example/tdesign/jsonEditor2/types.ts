import { type FormRule } from 'tdesign-vue-next'

/**
 * 字段值类型
 * - string: 文本输入框
 * - number: 数字输入框
 * - boolean: switch / checkbox
 * - object: 嵌套表单
 * - array:  动态数组表单
 */
export type ValueType = 'string' | 'number' | 'boolean' | 'array' | 'object'

export type OptionItem = {
  label: string
  value: boolean | string | number
}

// ====== 基础字段配置 ======
export type BaseFieldConfig = {
  /** 字段名 */
  key: string
  /** 字段标签 */
  label?: string
  /** 默认值（数据为 null/undefined 时启用） */
  defaultValue?: any
  /** 是否必填，显示红色星号 */
  required?: boolean
  /** 校验规则 */
  rules?: FormRule[]
  /** 是否隐藏 */
  hidden?: boolean | ((data: Record<string, any>) => boolean)
  /** 条件显示 */
  condition?: {
    field: string
    value?: any
    when?: (val: any) => boolean
  }
  /** 帮助提示文本 */
  help?: string
  /** 占位符 */
  placeholder?: string
}

// ====== 基础值类型配置（string/number/boolean） ======
export type PrimitiveValueConfig = {
  /** 下拉选项（有选项时渲染为 select） */
  options?: OptionItem[]
  /** 是否多选 */
  multiple?: boolean
}

// ====== 字符串字段 ======
export type StringFieldConfig = BaseFieldConfig & PrimitiveValueConfig & {
  valueType: 'string'
  /** 最大长度 */
  maxlength?: number
  /** 是否显示字数统计 */
  showLimitNumber?: boolean
  /** 多行文本 */
  textarea?: boolean
  /** 多行文本行数 */
  rows?: number
}

// ====== 数字字段 ======
export type NumberFieldConfig = BaseFieldConfig & PrimitiveValueConfig & {
  valueType: 'number'
  min?: number
  max?: number
  step?: number
  /** 小数位数 */
  precision?: number
}

// ====== 布尔字段 ======
export type BooleanFieldConfig = BaseFieldConfig & PrimitiveValueConfig & {
  valueType: 'boolean'
  /** Switch 的自定义标签 [关文案, 开文案] */
  switchLabel?: [string, string]
}

// ====== 对象字段 ======
export type ObjectFieldConfig = BaseFieldConfig & {
  valueType: 'object'
  /** 展示模式：card 或 form，默认为 card */
  displayType?: 'card' | 'form'
  /** 子字段配置 */
  fields?: FieldConfig[]
  /** 是否允许添加字段（默认 true） */
  addedProperty?: boolean
  /** 是否允许自定义字段名（默认 true，false 则只能从 properties 预定义列表中选择） */
  defineProperty?: boolean
  /** 预定义的可添加字段模板 */
  properties?: FieldConfig[]
}
export type ArrayObjectConfig=Omit<ObjectFieldConfig,'display'>&{
    display?:'form'
}
// ====== 数组字段 ======
export type ArrayFieldConfig = BaseFieldConfig & {
  valueType: 'array'
  /** 展示模式：tabs 或 list */
  displayType?: 'tabs' | 'list'
  /** 是否可排序（默认 true） */
  sortable?: boolean
  /** 是否可删除（默认 true） */
  removable?: boolean
  /** 是否可添加（默认 true） */
  added?: boolean
  /** 最大项数 */
  maxItems?: number
  /** 子项字段配置 */
  items?: ArrayObjectConfig
}

// ====== 字段联合类型 ======
export type PrimitiveFieldConfig = StringFieldConfig | NumberFieldConfig | BooleanFieldConfig
export type FieldConfig = PrimitiveFieldConfig | ObjectFieldConfig | ArrayFieldConfig

// ====== 表单配置 ======
export type JsonFormConfig = {
  /** 表单字段定义（顶层必须是 object 或 array） */
  schema?: ObjectFieldConfig | ArrayFieldConfig
  /** 表单数据 */
  value?: any
  /** v-model 绑定值 */
  modelValue?: any
  /** 值变化回调 */
  onChange?: (value: any) => void
}

// ====== provide/inject 类型 ======
/** 深层更新函数：path 是从根到目标字段的路径数组 */
export type UpdateValueFn = (path: (string | number)[], value: any) => void

export const UPDATE_VALUE_KEY = Symbol('updateValue')
