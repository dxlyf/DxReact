import type { FormFieldConfig, CustomComponentConfig, ExtraFieldTemplate, ValueType } from './types'

export const getDefaultValue = (field: FormFieldConfig): any => {
  if (field.defaultValue !== undefined) return field.defaultValue
  switch (field.valueType) {
    case 'string': return ''
    case 'number': return 0
    case 'boolean': return false
    case 'array': return []
    case 'object': return {}
    default: return ''
  }
}

export const resolveCustomComponent = (config: CustomComponentConfig) => {
  return typeof config.component === 'string' ? config.component : config.component
}

export const isFieldHidden = (field: FormFieldConfig, formData: Record<string, any>): boolean => {
  if (typeof field.hidden === 'function') return field.hidden(formData)
  if (field.hidden) return true
  if (field.condition) {
    const depVal = formData[field.condition.field]
    if (field.condition.when) return !field.condition.when(depVal)
    return depVal !== field.condition.value
  }
  return false
}

export const extraFieldTemplates = (field: FormFieldConfig) => field.arrayConfig?.item?.extraFieldTemplates || []

/** 获取额外字段列表。优先读 _extraFields；没有时从对象 key 推导（去除已知配置 key） */
export const getExtraFields = (item: any, knownKeys?: string[]): string[] => {
  if (item?._extraFields?.length) return item._extraFields
  if (!item || typeof item !== 'object') return []
  // 兜底：从对象自身 key 推导，排除内部 key 和已知配置 key
  const exclude = new Set(['_extraFields', '_extraFieldTypes', ...(knownKeys || [])])
  return Object.keys(item).filter((k) => !exclude.has(k))
}

export const getExtraFieldType = (item: any, key: string): ValueType | undefined => item?._extraFieldTypes?.[key]

/** 将 ExtraFieldTemplate 转为 FormFieldConfig */
const templateToFieldConfig = (tmpl: ExtraFieldTemplate): FormFieldConfig => ({
  key: tmpl.key,
  label: tmpl.label,
  valueType: tmpl.valueType,
  placeholder: tmpl.placeholder,
  options: tmpl.options,
  numberConfig: tmpl.numberConfig,
  stringConfig: tmpl.stringConfig,
  booleanConfig: tmpl.booleanConfig,
  defaultValue: tmpl.defaultValue,
  component: tmpl.component,
})

/** 根据 item 的 _extraFields，构建合并后的字段列表（原始字段 + 额外字段内联） */
export const buildMergedFieldConfigs = (
  baseFields: FormFieldConfig[] | undefined,
  templates: ExtraFieldTemplate[],
  item: any,
): FormFieldConfig[] => {
  const base = baseFields || []
  // 已知 key = 配置字段 key + 模板 key
  const knownKeys = [...base.map((f) => f.key), ...templates.map((t) => t.key)]
  const extras = getExtraFields(item, knownKeys)
  if (!extras.length) return base

  const extraConfigs: FormFieldConfig[] = []
  for (const key of extras) {
    // 先查预定义模板
    const tmpl = templates.find((t) => t.key === key)
    if (tmpl) {
      extraConfigs.push(templateToFieldConfig(tmpl))
    } else {
      // 自定义字段：从 _extraFieldTypes 取类型
      const vt = getExtraFieldType(item, key) || 'string'
      extraConfigs.push({ key, label: key, valueType: vt })
    }
  }
  return [...base, ...extraConfigs]
}

// ====== 数组操作 ======
export const addArrayItem = (field: FormFieldConfig, data: Record<string, any>) => {
  const list = [...(data[field.key] || [])]
  const itemValueType = field.arrayConfig?.item?.valueType
  let newItem: any
  if (itemValueType === 'object') {
    newItem = {}
    field.arrayConfig?.item?.fields?.forEach((f) => {
      newItem[f.key] = getDefaultValue(f)
    })
  } else {
    newItem = ''
  }
  list.push(newItem)
  return { ...data, [field.key]: list }
}

export const deleteArrayItem = (field: FormFieldConfig, idx: number, data: Record<string, any>) => {
  const list = [...(data[field.key] || [])]
  list.splice(idx, 1)
  return { ...data, [field.key]: list }
}

export const moveArrayItem = (field: FormFieldConfig, idx: number, dir: 'up' | 'down', data: Record<string, any>) => {
  const list = [...(data[field.key] || [])]
  const targetIdx = dir === 'up' ? idx - 1 : idx + 1
  if (targetIdx < 0 || targetIdx >= list.length) return data
  const [removed] = list.splice(idx, 1)
  list.splice(targetIdx, 0, removed)
  return { ...data, [field.key]: list }
}

export const updateArrayItem = (field: FormFieldConfig, idx: number, val: any, data: Record<string, any>) => {
  const list = [...(data[field.key] || [])]
  list[idx] = val
  return { ...data, [field.key]: list }
}

// ====== 额外字段操作 ======
export const addExtraField = (
  field: FormFieldConfig,
  idx: number,
  tmplKey: string,
  valueType: ValueType,
  data: Record<string, any>,
) => {
  const item = { ...((data[field.key] || [])[idx] || {}) }
  const extraFields = [...(item._extraFields || [])]
  if (extraFields.includes(tmplKey)) return data
  extraFields.push(tmplKey)
  item._extraFields = extraFields
  item._extraFieldTypes = { ...(item._extraFieldTypes || {}), [tmplKey]: valueType }
  const tmpl = field.arrayConfig?.item?.extraFieldTemplates?.find((t) => t.key === tmplKey)
  item[tmplKey] = tmpl?.defaultValue !== undefined ? tmpl.defaultValue : getDefaultValueByType(valueType)
  return updateArrayItem(field, idx, item, data)
}

const getDefaultValueByType = (vt: ValueType): any => {
  switch (vt) {
    case 'string': return ''
    case 'number': return 0
    case 'boolean': return false
    case 'array': return []
    case 'object': return {}
    default: return ''
  }
}

export const removeExtraField = (field: FormFieldConfig, idx: number, tmplKey: string, data: Record<string, any>) => {
  const item = { ...((data[field.key] || [])[idx] || {}) }
  const extraFields = item._extraFields?.filter((k: string) => k !== tmplKey) ?? []
  item._extraFields = extraFields
  const types = { ...(item._extraFieldTypes || {}) }
  delete types[tmplKey]
  item._extraFieldTypes = types
  delete item[tmplKey]
  return updateArrayItem(field, idx, item, data)
}

export const updateExtraField = (field: FormFieldConfig, idx: number, tmplKey: string, val: any, data: Record<string, any>) => {
  const item = { ...((data[field.key] || [])[idx] || {}) }
  item[tmplKey] = val
  return updateArrayItem(field, idx, item, data)
}

// ====== 对象级额外字段操作 ======
export const objectTemplates = (field: FormFieldConfig) => field.objectConfig?.extraFieldTemplates || []

/** 给对象添加一个额外字段，返回新对象 */
export const addExtraFieldToObject = (
  obj: Record<string, any>,
  tmplKey: string,
  valueType: ValueType,
  templates: ExtraFieldTemplate[],
): Record<string, any> => {
  const item = { ...obj }
  const extraFields = [...(item._extraFields || [])]
  if (extraFields.includes(tmplKey)) return item
  extraFields.push(tmplKey)
  item._extraFields = extraFields
  item._extraFieldTypes = { ...(item._extraFieldTypes || {}), [tmplKey]: valueType }
  const tmpl = templates.find((t) => t.key === tmplKey)
  item[tmplKey] = tmpl?.defaultValue !== undefined ? tmpl.defaultValue : getDefaultValueByType(valueType)
  return item
}

// ====== 内部字段清理 ======
const INTERNAL_KEYS = ['_extraFields', '_extraFieldTypes']

/** 递归移除数据中的 _extraFields 和 _extraFieldTypes */
export const stripInternalProps = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(stripInternalProps)
  }
  if (data && typeof data === 'object') {
    const cleaned: Record<string, any> = {}
    for (const key of Object.keys(data)) {
      if (INTERNAL_KEYS.includes(key)) continue
      cleaned[key] = stripInternalProps(data[key])
    }
    return cleaned
  }
  return data
}

/** 从对象移除一个额外字段 */
export const removeExtraFieldFromObject = (obj: Record<string, any>, tmplKey: string): Record<string, any> => {
  const item = { ...obj }
  const extraFields = (item._extraFields || []).filter((k: string) => k !== tmplKey)
  item._extraFields = extraFields
  const types = { ...(item._extraFieldTypes || {}) }
  delete types[tmplKey]
  item._extraFieldTypes = types
  delete item[tmplKey]
  return item
}
