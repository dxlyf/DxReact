/**
 * useFormContext.ts
 * 作用：表单上下文的核心实现。
 * - createFormContext(schema)：创建 model / errors，并提供路径读写、校验、重置、数据填充能力
 * - provideFormContext / useFormContext：基于 provide / inject 在组件树中共享上下文
 * - 同时导出组件层需要的工具：路径读写、条件显隐求值、列表项默认值构建
 */
import { inject, provide, reactive, toRaw, type InjectionKey } from 'vue'
import type { FieldRule, FormContext, FormModel, SchemaNode, VisibleRule } from './types'

/** 上下文注入 key */
export const FORM_CONTEXT_KEY: InjectionKey<FormContext> = Symbol('schema-form-context')

/* ------------------------------------------------------------------ */
/* 1. 路径读写：支持 "contacts.0.name" 这类点号路径（含数组下标）        */
/* ------------------------------------------------------------------ */

/** 把点号路径拆成键数组 */
export function parsePath(path: string): string[] {
  return path
    .split('.')
    .map((key) => key.trim())
    .filter((key) => key !== '')
}

/** 按路径读取嵌套对象 / 数组中的值（任一层缺失都返回 undefined） */
export function getByPath(target: unknown, path: string): unknown {
  if (!path) return target
  return parsePath(path).reduce<unknown>((cursor, key) => {
    if (cursor === null || cursor === undefined || typeof cursor !== 'object') return undefined
    return (cursor as Record<string, unknown>)[key]
  }, target)
}

/** 按路径写入嵌套对象 / 数组，中间层缺失时自动按「数组下标 / 普通键」补全 */
export function setByPath(target: FormModel, path: string, value: unknown): void {
  const keys = parsePath(path)
  if (keys.length === 0) return
  let cursor: Record<string, unknown> = target
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i]
    const next = cursor[key]
    if (next === null || next === undefined || typeof next !== 'object') {
      // 下一级是纯数字则补数组，否则补对象
      cursor[key] = /^\d+$/.test(keys[i + 1]) ? [] : {}
    }
    cursor = cursor[key] as Record<string, unknown>
  }
  cursor[keys[keys.length - 1]] = value
}

/* ------------------------------------------------------------------ */
/* 2. 条件显隐：表达式编译 + 缓存                                       */
/* ------------------------------------------------------------------ */

/** 表达式编译结果缓存，避免重复编译同一表达式 */
const expressionCache = new Map<string, (model: FormModel) => boolean>()

/** 把字符串表达式编译成函数（with(model) 让表达式可直接写 model.xxx） */
function compileExpression(expression: string): (model: FormModel) => boolean {
  const cached = expressionCache.get(expression)
  if (cached) return cached
  const fn = new Function('model', `with(model){ return (${expression}) }`) as (
    model: FormModel,
  ) => boolean
  expressionCache.set(expression, fn)
  return fn
}

/** 求值 visible：支持布尔值、表达式字符串、函数；求值异常时默认显示 */
export function evaluateVisible(visible: VisibleRule | undefined, model: FormModel): boolean {
  if (visible === undefined || visible === null) return true
  if (typeof visible === 'boolean') return visible
  if (typeof visible === 'function') return visible(model) !== false
  const expression = visible.trim()
  if (!expression) return true
  try {
    return Boolean(compileExpression(expression)(model))
  } catch (error) {
    console.warn(`[SchemaForm] visible 表达式求值失败：${expression}`, error)
    return true
  }
}

/* ------------------------------------------------------------------ */
/* 3. 默认值构建（含列表项、无限嵌套容器）                              */
/* ------------------------------------------------------------------ */

/** 深拷贝（仅处理纯数据结构） */
function clone<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value
  try {
    return JSON.parse(JSON.stringify(value)) as T
  } catch {
    return value
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

/**
 * 把一个节点（及其子树）的默认值写入 target。
 * - list：写入空数组（或 defaultValue）
 * - card / group / grid：key 存在时先准备子对象，再递归写入子节点
 * - 普通字段：仅当声明了 defaultValue 才写入
 */
function applyNodeDefault(node: SchemaNode, target: FormModel): void {
  const key = node.key

  if (node.type === 'list') {
    if (key && !(key in target)) {
      target[key] = Array.isArray(node.defaultValue) ? clone(node.defaultValue) : []
    }
    return
  }

  if (node.type === 'card' || node.type === 'group' || node.type === 'grid') {
    if (!key) {
      applyDefaults(node.children ?? [], target)
      return
    }
    const existing = target[key]
    if (!isPlainObject(existing)) {
      target[key] = node.defaultValue !== undefined ? clone(node.defaultValue) : {}
    }
    applyDefaults(node.children ?? [], target[key] as FormModel)
    return
  }

  if (key && node.defaultValue !== undefined && !(key in target)) {
    target[key] = clone(node.defaultValue)
  }
}

/** 按 schema 把默认值写入 target */
export function applyDefaults(schema: SchemaNode[], target: FormModel): void {
  schema.forEach((node) => applyNodeDefault(node, target))
}

/** 依据 itemSchema 创建一个列表项（递归初始化嵌套字段 / 嵌套列表） */
export function createListItem(itemSchema: SchemaNode[] | undefined): FormModel {
  const item: FormModel = {}
  applyDefaults(itemSchema ?? [], item)
  return item
}

/* ------------------------------------------------------------------ */
/* 4. 递归遍历：收集所有「可见字段」的路径与规则                        */
/* ------------------------------------------------------------------ */

export interface WalkedField {
  node: SchemaNode
  /** 字段完整路径，如 contacts.0.emergency.0.name */
  path: string
  rules: FieldRule[]
}

/**
 * 递归遍历 schema，收集需要校验的字段。
 * 列表节点会按 model 中的实际数组长度展开每一项，因此天然支持无限嵌套。
 */
export function walkFields(schema: SchemaNode[], model: FormModel, parentPath = ''): WalkedField[] {
  const result: WalkedField[] = []

  const walk = (nodes: SchemaNode[], base: string): void => {
    nodes.forEach((node) => {
      // 不可见的字段不参与校验
      if (!evaluateVisible(node.visible, model)) return

      const fullPath = node.key ? (base ? `${base}.${node.key}` : node.key) : base

      if (node.type === 'list') {
        const list = getByPath(model, fullPath)
        const items = Array.isArray(list) ? list : []
        items.forEach((_item, index) => {
          walk(node.itemSchema ?? [], fullPath ? `${fullPath}.${index}` : `${index}`)
        })
        return
      }

      if (node.type === 'card' || node.type === 'group' || node.type === 'grid') {
        walk(node.children ?? [], fullPath)
        return
      }

      result.push({ node, path: fullPath, rules: node.rules ?? [] })
    })
  }

  walk(schema, parentPath)
  return result
}

/* ------------------------------------------------------------------ */
/* 5. 校验执行                                                          */
/* ------------------------------------------------------------------ */

/** 判断值是否为空（undefined / null / '' / 空数组 视为空） */
function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true
  if (Array.isArray(value)) return value.length === 0
  return false
}

/** 顺序执行一组规则，返回第一条错误信息（无错误返回 undefined） */
async function runRules(
  rules: FieldRule[],
  value: unknown,
  model: FormModel,
): Promise<string | undefined> {
  for (const rule of rules) {
    if (rule.required && isEmptyValue(value)) {
      return rule.message ?? '该字段为必填项'
    }
    if (rule.pattern && !isEmptyValue(value)) {
      const reg = typeof rule.pattern === 'string' ? new RegExp(rule.pattern) : rule.pattern
      if (!reg.test(String(value))) return rule.message ?? '格式不正确'
    }
    if (rule.validator) {
      const message = await rule.validator(value, model)
      if (typeof message === 'string' && message) return message
    }
  }
  return undefined
}

/* ------------------------------------------------------------------ */
/* 6. 上下文创建 / 注入                                                 */
/* ------------------------------------------------------------------ */

/** 创建表单上下文（model / errors 均为 reactive） */
export function createFormContext(schema: SchemaNode[]): FormContext {
  const model = reactive<FormModel>({})
  const errors = reactive<Record<string, string>>({})

  /** 清空 model 并按 schema 重新应用默认值 */
  const applySchemaDefaults = (): void => {
    Object.keys(model).forEach((key) => {
      delete model[key]
    })
    applyDefaults(schema, model)
  }

  const clearErrors = (): void => {
    Object.keys(errors).forEach((key) => {
      delete errors[key]
    })
  }

  const getValue = (path: string): unknown => getByPath(model, path)

  const setValue = (path: string, value: unknown): void => {
    if (!path) return
    setByPath(model, path, value)
  }

  const getError = (path: string): string | undefined => errors[path]

  const setError = (path: string, message?: string): void => {
    if (message) {
      errors[path] = message
    } else {
      delete errors[path]
    }
  }

  /** 校验单个字段 */
  const validateField = async (path: string): Promise<boolean> => {
    const field = walkFields(schema, model).find((item) => item.path === path)
    if (!field) {
      setError(path, undefined)
      return true
    }
    const message = await runRules(field.rules, getValue(path), model)
    setError(path, message)
    return !message
  }

  /** 校验全部字段（含列表内嵌套字段） */
  const validate = async (): Promise<boolean> => {
    clearErrors()
    const fields = walkFields(schema, model)
    const results = await Promise.all(
      fields.map(async (field) => {
        const message = await runRules(field.rules, getValue(field.path), model)
        if (message) errors[field.path] = message
        return !message
      }),
    )
    return results.every(Boolean)
  }

  /** 重置：清空数据与错误后重新应用默认值 */
  const reset = (): void => {
    clearErrors()
    applySchemaDefaults()
  }

  /** 深度合并数据到 model（先 reset） */
  const setData = (data: FormModel): void => {
    reset()
    mergeData(model, data)
  }

  /** 返回深拷贝的纯数据 */
  const getData = (): FormModel => JSON.parse(JSON.stringify(toRaw(model))) as FormModel

  applySchemaDefaults()

  return {
    model,
    errors,
    getValue,
    setValue,
    getError,
    setError,
    validate,
    validateField,
    reset,
    setData,
    getData,
  }
}

/** 深度合并：纯对象递归合并，数组与其它类型整体替换 */
function mergeData(target: FormModel, source: FormModel): void {
  Object.keys(source).forEach((key) => {
    const sourceValue = source[key]
    const targetValue = target[key]
    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      mergeData(targetValue, sourceValue)
    } else {
      target[key] = clone(sourceValue)
    }
  })
}

/** 创建上下文并 provide，返回上下文以便父组件直接操作（validate / reset 等） */
export function provideFormContext(schema: SchemaNode[]): FormContext {
  const context = createFormContext(schema)
  provide(FORM_CONTEXT_KEY, context)
  return context
}

/** 在子孙组件中获取上下文 */
export function useFormContext(): FormContext {
  const context = inject(FORM_CONTEXT_KEY)
  if (!context) {
    throw new Error('[SchemaForm] 未找到表单上下文，请先在祖先组件调用 provideFormContext()')
  }
  return context
}
