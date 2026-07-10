import type { FieldConfig, ValueType } from './types'

/** 在嵌套对象中按路径设置值，返回新对象（不可变） */
export function setInPath(obj: any, path: (string | number)[], value: any): any {
  if (path.length === 0) return value
  const [key, ...rest] = path
  if (Array.isArray(obj)) {
    const arr = [...obj]
    arr[key as number] = setInPath(arr[key as number], rest, value)
    return arr
  }
  const cloned = { ...(obj || {}) }
  cloned[key] = setInPath(cloned[key], rest, value)
  return cloned
}

/** 从嵌套对象中按路径获取值 */
export function getInPath(obj: any, path: (string | number)[]): any {
  let current = obj
  for (const key of path) {
    if (current == null) return undefined
    current = current[key]
  }
  return current
}

/** 获取字段默认值 */
export function getDefaultValue(field: FieldConfig): any {
  if (field.defaultValue !== undefined) return field.defaultValue
  switch (field.valueType) {
    case 'string': return ''
    case 'number': return 0
    case 'boolean': return false
    case 'array': return []
    case 'object': return {}
  }
}

/** 根据值类型获取默认值 */
export function getDefaultByType(vt: ValueType): any {
  switch (vt) {
    case 'string': return ''
    case 'number': return 0
    case 'boolean': return false
    case 'array': return []
    case 'object': return {}
  }
}

/** 判断字段是否隐藏 */
export function isFieldHidden(field: FieldConfig, data: Record<string, any>): boolean {
  if (typeof field.hidden === 'function') return field.hidden(data)
  if (field.hidden) return true
  if (field.condition) {
    const depVal = data[field.condition.field]
    if (field.condition.when) return !field.condition.when(depVal)
    return depVal !== field.condition.value
  }
  return false
}
