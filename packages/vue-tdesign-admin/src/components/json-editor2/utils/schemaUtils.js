// 根据schema生成字段配置
export function generateFields(schema, basePath = '', parentSchema = null) {
  if (!schema || !schema.properties) return []
  
  const fields = []
  const requiredFields = schema.required || []
  
  Object.keys(schema.properties).forEach(key => {
    const propSchema = schema.properties[key]
    const path = basePath ? `${basePath}.${key}` : key
    const isRequired = requiredFields.includes(key)
    
    fields.push({
      key: path,
      path: path,
      label: propSchema.title || key,
      description: propSchema.description,
      schema: propSchema,
      required: isRequired,
      type: propSchema.type,
      format: propSchema.format
    })
    
    // 递归处理嵌套对象
    if (propSchema.type === 'object' && propSchema.properties) {
      const nestedFields = generateFields(propSchema, path, propSchema)
      fields.push(...nestedFields)
    }
    
    // 处理数组中的对象
    if (propSchema.type === 'array' && propSchema.items?.type === 'object') {
      const nestedFields = generateFields(propSchema.items, `${path}[$index]`, propSchema)
      fields.push(...nestedFields)
    }
  })
  
  return fields
}

// 根据schema类型获取对应的组件类型
export function getComponentType(field) {
  const schema = field.schema || field
  
  if (schema.type === 'string') {
    if (schema.enum) return 'SelectField'
    if (schema.format === 'date') return 'DateField'
    if (schema.format === 'datetime') return 'DateTimeField'
    if (schema.format === 'textarea') return 'TextareaField'
    if (schema.format === 'email') return 'EmailField'
    if (schema.format === 'password') return 'PasswordField'
    return 'StringField'
  } else if (schema.type === 'number' || schema.type === 'integer') {
    return 'NumberField'
  } else if (schema.type === 'boolean') {
    return 'BooleanField'
  } else if (schema.type === 'array') {
    return 'ArrayField'
  } else if (schema.type === 'object') {
    return 'ObjectField'
  }
  
  return 'StringField'
}

// 获取嵌套属性的值
export function getValue(obj, path, defaultValue = null) {
  if (!path) return obj
  
  const keys = path.split('.')
  let result = obj
  
  for (const key of keys) {
    if (result === null || result === undefined) return defaultValue
    if (key.includes('[') && key.includes(']')) {
      // 处理数组路径如 'hobbies[0]'
      const arrayKey = key.split('[')[0]
      const index = parseInt(key.split('[')[1].split(']')[0])
      result = result[arrayKey]?.[index]
    } else {
      result = result[key]
    }
  }
  
  return result !== undefined ? result : defaultValue
}

// 设置嵌套属性的值
export function setValue(obj, path, value) {
  if (!path) return value
  
  const keys = path.split('.')
  const newObj = { ...obj }
  let current = newObj
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    
    if (key.includes('[') && key.includes(']')) {
      // 处理数组路径
      const arrayKey = key.split('[')[0]
      const index = parseInt(key.split('[')[1].split(']')[0])
      
      if (!current[arrayKey]) current[arrayKey] = []
      if (!current[arrayKey][index]) current[arrayKey][index] = {}
      
      current = current[arrayKey][index]
    } else {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {}
      }
      current = current[key]
    }
  }
  
  const lastKey = keys[keys.length - 1]
  
  if (lastKey.includes('[') && lastKey.includes(']')) {
    const arrayKey = lastKey.split('[')[0]
    const index = parseInt(lastKey.split('[')[1].split(']')[0])
    
    if (!current[arrayKey]) current[arrayKey] = []
    current[arrayKey][index] = value
  } else {
    if (value === undefined || value === null) {
      delete current[lastKey]
    } else {
      current[lastKey] = value
    }
  }
  
  return newObj
}

// 根据schema获取字段的默认值
export function getDefaultValue(schema) {
  if (schema.default !== undefined) return schema.default
  
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
      return {}
    default:
      return null
  }
}

// 验证字段值
export function validateField(value, schema) {
  const errors = []
  
  if (schema.required && (value === undefined || value === null || value === '')) {
    errors.push('此字段为必填项')
  }
  
  if (schema.type === 'string') {
    if (schema.minLength !== undefined && value?.length < schema.minLength) {
      errors.push(`最小长度为 ${schema.minLength}`)
    }
    if (schema.maxLength !== undefined && value?.length > schema.maxLength) {
      errors.push(`最大长度为 ${schema.maxLength}`)
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push(`格式不符合要求`)
    }
  }
  
  if (schema.type === 'number' || schema.type === 'integer') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`最小值为 ${schema.minimum}`)
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`最大值为 ${schema.maximum}`)
    }
  }
  
  return errors
}