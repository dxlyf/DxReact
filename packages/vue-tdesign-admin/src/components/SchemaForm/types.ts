/**
 * types.ts
 * 作用：配置化表单生成器的全部 TypeScript 类型定义。
 * - SchemaNode：描述字段 / 容器的 JSON 结构（支持无限层级嵌套）
 * - FieldRule：字段校验规则
 * - FormContext：表单上下文（数据读写、错误管理、校验、重置）
 */
/** 表单数据模型：独立于 Schema 的响应式数据对象 */
export type FormModel = Record<string, unknown>

/** 普通字段（控件）类型 */
export type WidgetType = 'input' | 'number' | 'select' | 'date' | 'textarea'

/** 容器类型：card 卡片 / group|grid 栅格 / list 动态列表 */
export type ContainerType = 'card' | 'group' | 'grid' | 'list'

/** 节点类型 */
export type SchemaNodeType = WidgetType | ContainerType

/** select 等控件的选项 */
export interface SelectOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
}

/**
 * 条件显隐规则：
 * - 布尔值：直接控制
 * - 字符串表达式：如 "model.age > 18"，内部使用 new Function + with 求值并缓存
 * - 函数：接收当前 model，返回是否显示
 */
export type VisibleRule = boolean | string | ((model: FormModel) => boolean)

/** 单个字段的校验规则 */
export interface FieldRule {
  /** 是否必填 */
  required?: boolean
  /** 校验失败时的提示文案 */
  message?: string
  /** 正则校验，支持 RegExp 或字符串（字符串会自动编译为正则） */
  pattern?: RegExp | string
  /** 自定义校验：返回字符串表示错误，返回空表示通过（支持异步） */
  validator?: (value: unknown, model: FormModel) => string | void | Promise<string | void>
}

/** 透传给控件的额外属性（如 select 的 options） */
export interface FieldProps {
  /** select 的选项 */
  options?: SelectOption[]
  /** textarea 行数 */
  rows?: number
  [key: string]: unknown
}

/** Schema 节点：字段与容器共用一套结构，通过 type 区分 */
export interface SchemaNode {
  /** 节点类型 */
  type: SchemaNodeType
  /** 字段名或数据路径（容器上的 key 会作为子节点的数据前缀，从而支持嵌套对象） */
  key?: string
  /** 标签 */
  label?: string
  /** 标题（card / list 使用） */
  title?: string
  /** 栅格占位，1 ~ 24 */
  span?: number
  /** 默认值 */
  defaultValue?: unknown
  /** 校验规则 */
  rules?: FieldRule[]
  /** 条件显隐 */
  visible?: VisibleRule
  /** 是否禁用 */
  disabled?: boolean
  /** 占位提示 */
  placeholder?: string
  /** 控件额外属性 */
  props?: FieldProps
  /** 子节点（card / group / grid 使用） */
  children?: SchemaNode[]
  /** 列表项结构（list 使用，内部可再嵌 list 实现无限嵌套） */
  itemSchema?: SchemaNode[]
  /** 列表「添加一项」按钮文案 */
  addText?: string
  /** 列表最少项数 */
  minItems?: number
  /** 列表最多项数 */
  maxItems?: number
}

/** 表单上下文：通过 provide / inject 在子孙组件中共享 */
export interface FormContext {
  /** 表单数据（reactive，依据 schema 的 defaultValue 自动初始化） */
  model: FormModel
  /** 错误信息，键为字段完整路径 */
  errors: Record<string, string>
  /** 按点号路径读取数据，如 contacts.0.name */
  getValue: (path: string) => unknown
  /** 按点号路径写入数据 */
  setValue: (path: string, value: unknown) => void
  /** 读取某个字段的错误信息 */
  getError: (path: string) => string | undefined
  /** 设置 / 清除某个字段的错误信息 */
  setError: (path: string, message?: string) => void
  /** 校验全部字段（含列表内嵌套字段），返回是否全部通过 */
  validate: () => Promise<boolean>
  /** 校验单个字段 */
  validateField: (path: string) => Promise<boolean>
  /** 清空数据与错误，并重新应用默认值 */
  reset: () => void
  /** 先 reset，再把数据深度合并进 model */
  setData: (data: FormModel) => void
  /** 返回深拷贝的纯数据 */
  getData: () => FormModel
}
