import type { JsonSchema, ValidationError } from './types'

export function validateSchema(
  value: unknown,
  schema: JsonSchema,
  path: string = ''
): ValidationError[] {
  const errors: ValidationError[] = []

  if (schema.const !== undefined && value !== schema.const) {
    errors.push({
      path,
      message: `值必须等于 ${JSON.stringify(schema.const)}`,
      keyword: 'const'
    })
  }

  if (schema.enum && !schema.enum.includes(value as never)) {
    errors.push({
      path,
      message: `值必须是以下之一: ${schema.enum.join(', ')}`,
      keyword: 'enum'
    })
  }

  if (schema.type === 'string' && typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({
        path,
        message: `最小长度为 ${schema.minLength}`,
        keyword: 'minLength'
      })
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({
        path,
        message: `最大长度为 ${schema.maxLength}`,
        keyword: 'maxLength'
      })
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push({
        path,
        message: schema.description || '格式不符合要求',
        keyword: 'pattern'
      })
    }
    if (schema.format) {
      const formatError = validateFormat(value, schema.format)
      if (formatError) {
        errors.push({ path, message: formatError, keyword: 'format' })
      }
    }
  }

  if ((schema.type === 'number' || schema.type === 'integer') && typeof value === 'number') {
    if (schema.minimum !== undefined) {
      if (schema.exclusiveMinimum === true && value <= schema.minimum) {
        errors.push({
          path,
          message: `值必须大于 ${schema.minimum}`,
          keyword: 'exclusiveMinimum'
        })
      } else if (typeof schema.exclusiveMinimum === 'number' && value <= schema.exclusiveMinimum) {
        errors.push({
          path,
          message: `值必须大于 ${schema.exclusiveMinimum}`,
          keyword: 'exclusiveMinimum'
        })
      } else if (value < schema.minimum) {
        errors.push({
          path,
          message: `最小值为 ${schema.minimum}`,
          keyword: 'minimum'
        })
      }
    }
    if (schema.maximum !== undefined) {
      if (schema.exclusiveMaximum === true && value >= schema.maximum) {
        errors.push({
          path,
          message: `值必须小于 ${schema.maximum}`,
          keyword: 'exclusiveMaximum'
        })
      } else if (typeof schema.exclusiveMaximum === 'number' && value >= schema.exclusiveMaximum) {
        errors.push({
          path,
          message: `值必须小于 ${schema.exclusiveMaximum}`,
          keyword: 'exclusiveMaximum'
        })
      } else if (value > schema.maximum) {
        errors.push({
          path,
          message: `最大值为 ${schema.maximum}`,
          keyword: 'maximum'
        })
      }
    }
    if (schema.multipleOf !== undefined && value % schema.multipleOf !== 0) {
      errors.push({
        path,
        message: `值必须是 ${schema.multipleOf} 的倍数`,
        keyword: 'multipleOf'
      })
    }
    if (schema.type === 'integer' && !Number.isInteger(value)) {
      errors.push({
        path,
        message: '值必须是整数',
        keyword: 'type'
      })
    }
  }

  if (schema.type === 'array' && Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push({
        path,
        message: `至少需要 ${schema.minItems} 项`,
        keyword: 'minItems'
      })
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push({
        path,
        message: `最多允许 ${schema.maxItems} 项`,
        keyword: 'maxItems'
      })
    }
    if (schema.uniqueItems && new Set(value).size !== value.length) {
      errors.push({
        path,
        message: '数组项必须唯一',
        keyword: 'uniqueItems'
      })
    }
    if (schema.items) {
      value.forEach((item, index) => {
        const itemErrors = validateSchema(item, schema.items!, `${path}[${index}]`)
        errors.push(...itemErrors)
      })
    }
  }

  if (schema.type === 'object' && typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>
    
    if (schema.required) {
      schema.required.forEach(key => {
        if (obj[key] === undefined || obj[key] === null || obj[key] === '') {
          errors.push({
            path: path ? `${path}.${key}` : key,
            message: '此字段为必填项',
            keyword: 'required'
          })
        }
      })
    }

    if (schema.properties) {
      Object.keys(schema.properties).forEach(key => {
        const propSchema = schema.properties![key]
        const propValue = obj[key]
        const propPath = path ? `${path}.${key}` : key
        
        if (propValue !== undefined) {
          const propErrors = validateSchema(propValue, propSchema, propPath)
          errors.push(...propErrors)
        }
      })
    }
  }

  return errors
}

function validateFormat(value: string, format: string): string | null {
  const formatPatterns: Record<string, { pattern: RegExp; message: string }> = {
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: '请输入有效的邮箱地址'
    },
    uri: {
      pattern: /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/,
      message: '请输入有效的URI'
    },
    'date-time': {
      pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/,
      message: '请输入有效的日期时间'
    },
    date: {
      pattern: /^\d{4}-\d{2}-\d{2}$/,
      message: '请输入有效的日期'
    },
    time: {
      pattern: /^\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/,
      message: '请输入有效的时间'
    },
    ipv4: {
      pattern: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      message: '请输入有效的IPv4地址'
    },
    ipv6: {
      pattern: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
      message: '请输入有效的IPv6地址'
    },
    hostname: {
      pattern: /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
      message: '请输入有效的主机名'
    }
  }

  const formatConfig = formatPatterns[format]
  if (formatConfig && !formatConfig.pattern.test(value)) {
    return formatConfig.message
  }

  return null
}

export function getDefaultValue(schema: JsonSchema): unknown {
  if (schema.default !== undefined) {
    return schema.default
  }

  switch (schema.type) {
    case 'string':
      return ''
    case 'number':
    case 'integer':
      return 0
    case 'boolean':
      return false
    case 'array':
      return []
    case 'object':
      if (schema.properties) {
        const obj: Record<string, unknown> = {}
        Object.keys(schema.properties).forEach(key => {
          obj[key] = getDefaultValue(schema.properties![key])
        })
        return obj
      }
      return {}
    default:
      return null
  }
}

export function getValueByPath(obj: unknown, path: string): unknown {
  if (!path) return obj
  
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.')
  let result = obj

  for (const key of keys) {
    if (result === null || result === undefined) return undefined
    result = (result as Record<string, unknown>)[key]
  }

  return result
}

export function setValueByPath(obj: unknown, path: string, value: unknown): unknown {
  if (!path) return value

  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.')
  const newObj = JSON.parse(JSON.stringify(obj ?? {}))
  let current: Record<string, unknown> = newObj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    const nextKey = keys[i + 1]
    const isNextArray = /^\d+$/.test(nextKey)

    if (current[key] === undefined || current[key] === null) {
      current[key] = isNextArray ? [] : {}
    }
    current = current[key] as Record<string, unknown>
  }

  const lastKey = keys[keys.length - 1]
  if (value === undefined) {
    delete current[lastKey]
  } else {
    current[lastKey] = value
  }

  return newObj
}

export function deleteByPath(obj: unknown, path: string): unknown {
  if (!path) return undefined

  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.')
  const newObj = JSON.parse(JSON.stringify(obj ?? {}))
  let current: Record<string, unknown> = newObj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (current[key] === undefined || current[key] === null) {
      return newObj
    }
    current = current[key] as Record<string, unknown>
  }

  const lastKey = keys[keys.length - 1]
  if (Array.isArray(current)) {
    const index = parseInt(lastKey, 10)
    current.splice(index, 1)
  } else {
    delete current[lastKey]
  }

  return newObj
}
