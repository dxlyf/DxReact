// ====== 基础值类型 ======
export type ValueType = 'string' | 'number' | 'boolean' | 'array' | 'object'

// ====== 校验规则 ======
export type FieldRule = {
  required?: boolean
  message?: string
  /** 自定义校验函数，返回 true 或错误信息 */
  validator?: (value: any, formData: Record<string, any>) => boolean | string
  /** 正则校验 */
  pattern?: RegExp
  /** 最小值（number/string） */
  min?: number
  /** 最大值（number/string） */
  max?: number
}

// ====== 条件显示 ======
export type Condition = {
  /** 依赖的字段 key */
  field: string
  /** 当依赖字段的值等于 value 时显示 */
  value: any
  /** 或自定义判断函数 */
  when?: (value: any) => boolean
}

// ====== 自定义组件配置 ======
export type CustomComponentConfig = {
  /** 组件名称（已注册的全局/局部组件）或组件对象 */
  component: string | any
  /** 传递给组件的 props（modelValue 和 onUpdate:modelValue 由系统自动处理） */
  props?: Record<string, any>
  /** 组件的事件监听 */
  events?: Record<string, (...args: any[]) => void>
  /** 自定义的 v-model 属性名，默认 'modelValue' */
  modelProp?: string
  /** 自定义的 update 事件名，默认 'update:modelValue' */
  updateEvent?: string
}

// ====== 枚举选项 ======
export type FieldOption = {
  label: string
  value: any
  /** 选项禁用 */
  disabled?: boolean
  /** 选项附加数据 */
  extra?: Record<string, any>
}

// ====== 数组类型的展示形态 ======
export type ArrayDisplayType =
  | 'select'       // 下拉选择框
  | 'checkbox'     // 复选框组
  | 'table'        // 表格编辑
  | 'tag-input'    // 标签输入
  | 'list'         // 列表（可增减）
  | 'multiple-select' // 多选下拉

// ====== 对象类型的展示形态 ======
export type ObjectDisplayType =
  | 'form'         // 表单（默认）
  | 'card'         // 卡片分组
  | 'collapse'     // 折叠面板分组
  | 'tabs'         // 标签页分组

// ====== 数组子项配置 ======
export type ArrayItemConfig = {
  /** 数组元素的类型 */
  valueType: ValueType
  /** 如果元素是 string/number，可配置枚举选项 */
  options?: FieldOption[]
  /** 如果元素是 object，定义其字段结构 */
  fields?: FormFieldConfig[]
  /** 如果元素是 object，可指定展示形态 */
  objectDisplayType?: ObjectDisplayType
  /** 自定义数组元素组件 */
  component?: CustomComponentConfig
  /** 唯一标识字段（table 模式时使用） */
  rowKey?: string
  /** 表格模式时的列配置 */
  columns?: Array<{
    title: string
    key: string
    valueType: ValueType
    component?: CustomComponentConfig
    options?: FieldOption[]
    fields?: FormFieldConfig[]
    width?: number
    required?: boolean
  }>
  /**
   * 允许动态添加的额外字段模板（list 模式）
   * 每个条目定义一种可以动态添加到数组项的额外字段
   */
  extraFieldTemplates?: ExtraFieldTemplate[]
}

// ====== 动态额外字段模板 ======
export type ExtraFieldTemplate = {
  /** 展示名称 */
  label: string
  /** 字段 key 前缀，最终 key 为 `_extra.{key}` */
  key: string
  /** 值类型 */
  valueType: ValueType
  /** 占位符 */
  placeholder?: string
  /** 枚举选项（string/number 时使用） */
  options?: FieldOption[]
  /** 数字配置 */
  numberConfig?: FormFieldConfig['numberConfig']
  /** 字符串配置 */
  stringConfig?: FormFieldConfig['stringConfig']
  /** 布尔配置 */
  booleanConfig?: FormFieldConfig['booleanConfig']
  /** 默认值 */
  defaultValue?: any
  /** 自定义组件 */
  component?: CustomComponentConfig
}

// ====== 对象子项分组配置 ======
export type ObjectGroupConfig = {
  label: string
  key?: string
  displayType?: ObjectDisplayType
  fields: FormFieldConfig[]
}

// ====== 字段配置（核心） ======
export type FormFieldConfig = {
  /** 字段唯一标识 */
  key: string
  /** 字段标签 */
  label: string
  /** 值类型 */
  valueType: ValueType

  // ====== 通用配置 ======
  /** 默认值 */
  defaultValue?: any
  /** 占位符 */
  placeholder?: string
  /** 字段说明/帮助文本 */
  help?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否隐藏 */
  hidden?: boolean | ((formData: Record<string, any>) => boolean)
  /** 条件显示 */
  condition?: Condition
  /** 校验规则 */
  rules?: FieldRule[]
  /** 额外传递给组件的 props */
  extraProps?: Record<string, any>

  // ====== 样式布局 ======
  /** 占据列数（仅在多列布局时生效） */
  span?: number
  /** 自定义类名 */
  className?: string

  // ====== 枚举（string/number 时使用） ======
  options?: FieldOption[]
  /** 是否支持多选 */
  multiple?: boolean

  // ====== 数字类型配置 ======
  numberConfig?: {
    /** 最小值 */
    min?: number
    /** 最大值 */
    max?: number
    /** 步长 */
    step?: number
    /** 小数位数 */
    precision?: number
  }

  // ====== 字符串类型配置 ======
  stringConfig?: {
    /** 最大长度 */
    maxlength?: number
    /** 是否显示字数统计 */
    showLimitNumber?: boolean
    /** 多行文本 */
    textarea?: boolean
    /** 文本域行数 */
    rows?: number
  }

  // ====== 布尔类型配置 ======
  booleanConfig?: {
    /** 开关的文字描述，如 ['开启', '关闭'] */
    text?: [string, string]
    /** 开关的值的映射，如 [true, false] */
    trueValue?: any
    falseValue?: any
  }

  // ====== 数组类型配置 ======
  arrayConfig?: {
    /** 展示形态 */
    displayType: ArrayDisplayType
    /** 数组元素配置 */
    item: ArrayItemConfig
    /** 最少项数 */
    minItems?: number
    /** 最多项数 */
    maxItems?: number
    /** 是否可拖拽排序（table/list 模式） */
    sortable?: boolean
  }

  // ====== 对象类型配置 ======
  objectConfig?: {
    /** 展示形态 */
    displayType?: ObjectDisplayType
    /** 字段列表 */
    fields: FormFieldConfig[]
    /** 分组配置（用于 card/tabs/collapse 模式） */
    groups?: ObjectGroupConfig[]
  }

  // ====== 自定义组件覆盖 ======
  /** 完全自定义的渲染组件，优先级高于 valueType */
  component?: CustomComponentConfig
}

// ====== 表单整体配置 ======
export type FormSchema = {
  /** 表单字段列表 */
  fields: FormFieldConfig[]
  /** 表单布局：列数 */
  column?: number
  /** 表单标签对齐方式 */
  labelAlign?: 'left' | 'right' | 'top'
  /** 表单标签宽度 */
  labelWidth?: string | number
  /** 表单尺寸 */
  size?: 'small' | 'medium' | 'large'
  /** 分组配置（用于 card/tabs/collapse 模式） */
  groups?: ObjectGroupConfig[]
  /** 表单数据变化回调，任何字段改动都会触发，返回完整表单对象 */
  onChange?: (values: Record<string, any>) => void
}

// ====== 组件暴露的方法 ======
export type FormExpose = {
  validate: () => Promise<boolean>
  clearValidate: () => void
  resetFields: () => void
  getValues: () => Record<string, any>
  setValues: (values: Record<string, any>) => void
}
