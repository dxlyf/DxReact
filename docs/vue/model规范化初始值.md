在 Vue 3 中，`defineModel` 返回的 `model` 是一个 `ModelRef` 类型的响应式引用，它的行为与普通的 `ref` 有所不同。当你需要处理回显时，如果详情数据可能只有部分属性（比如只有 `{zh: ""}`），而你想确保 `model` 始终有 `{zh: "", en: ""}` 的完整结构，可以通过以下几种方式实现：

## 方案1：监听详情数据变化，合并默认值

```vue
<script setup lang="ts">
import { watch, ref } from 'vue'

// 定义 model
const model = defineModel<{ zh: string; en: string }>()

// 监听 model 变化，确保结构完整
watch(
  () => model.value,
  (newVal) => {
    if (newVal) {
      // 如果缺少某些属性，补充默认值
      const fullValue = {
        zh: newVal.zh ?? '',
        en: newVal.en ?? ''
      }
      
      // 只有值发生变化时才更新，避免无限循环
      if (JSON.stringify(newVal) !== JSON.stringify(fullValue)) {
        model.value = fullValue
      }
    }
  },
  { immediate: true, deep: true }
)
</script>
```

## 方案2：使用计算属性的 getter/setter 包装

```vue
<script setup lang="ts">
import { computed } from 'vue'

const model = defineModel<{ zh: string; en: string }>()

// 创建一个包装后的计算属性
const fullModel = computed({
  get() {
    const value = model.value
    // 返回完整结构
    return {
      zh: value?.zh ?? '',
      en: value?.en ?? ''
    }
  },
  set(newValue) {
    model.value = newValue
  }
})

// 在模板中使用 fullModel 而不是直接用 model
// <input v-model="fullModel.zh" />
// <input v-model="fullModel.en" />
</script>
```

## 方案3：在父组件传递时规范化数据（推荐）

在父组件中，在传递数据给子组件之前，确保数据结构完整：

```vue
<!-- 父组件 -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import ChildComponent from './ChildComponent.vue'

// 详情数据
const detailData = ref({ zh: '' }) // 可能不完整

// 规范化的数据
const normalizedData = ref({ zh: '', en: '' })

// 监听详情数据变化，规范化数据
watch(
  () => detailData.value,
  (newVal) => {
    normalizedData.value = {
      zh: newVal?.zh ?? '',
      en: newVal?.en ?? ''
    }
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <!-- 传递规范化的数据 -->
  <ChildComponent v-model="normalizedData" />
</template>
```

## 方案4：在子组件初始化时处理

```vue
<script setup lang="ts">
import { onMounted, watch } from 'vue'

const model = defineModel<{ zh: string; en: string }>()

// 初始化确保结构完整
const ensureFullStructure = () => {
  const currentValue = model.value
  
  if (!currentValue || typeof currentValue !== 'object') {
    model.value = { zh: '', en: '' }
    return
  }
  
  const needsUpdate = 
    !('zh' in currentValue) || 
    !('en' in currentValue) ||
    currentValue.zh === undefined ||
    currentValue.en === undefined
  
  if (needsUpdate) {
    model.value = {
      zh: currentValue.zh ?? '',
      en: currentValue.en ?? ''
    }
  }
}

// 组件挂载时执行
onMounted(ensureFullStructure)

// 监听 model 变化，确保结构完整
watch(() => model.value, ensureFullStructure, { deep: true })
</script>
```

## 方案5：使用工具函数（最优雅）

创建一个可复用的组合式函数：

```typescript
// composables/useFullModel.ts
import { watch, type Ref } from 'vue'

export function useFullModel<T extends Record<string, any>>(
  model: Ref<T | undefined>,
  defaultValues: T
) {
  const ensureFullStructure = () => {
    const currentValue = model.value
    
    if (!currentValue || typeof currentValue !== 'object') {
      model.value = { ...defaultValues }
      return
    }
    
    let needsUpdate = false
    const fullValue = { ...defaultValues }
    
    // 合并现有值
    for (const key in defaultValues) {
      if (currentValue[key] !== undefined) {
        fullValue[key] = currentValue[key]
      } else {
        needsUpdate = true
      }
    }
    
    if (needsUpdate || Object.keys(currentValue).length !== Object.keys(defaultValues).length) {
      model.value = fullValue
    }
  }
  
  watch(() => model.value, ensureFullStructure, { 
    immediate: true, 
    deep: true 
  })
  
  return { ensureFullStructure }
}
```

在组件中使用：

```vue
<script setup lang="ts">
import { useFullModel } from './composables/useFullModel'

const model = defineModel<{ zh: string; en: string }>()

// 使用工具函数，传入默认值
useFullModel(model, { zh: '', en: '' })
</script>

<template>
  <input v-model="model.zh" placeholder="中文" />
  <input v-model="model.en" placeholder="英文" />
</template>
```

## 注意事项

1. **避免无限循环**：在 watch 中更新 model 时，要判断值是否真的变化了
2. **性能考虑**：如果数据量大，注意 deep watch 的性能影响
3. **类型安全**：确保 TypeScript 类型定义与实际数据结构一致

推荐使用**方案5（工具函数）**，因为它最优雅、可复用，并且集中管理了初始化逻辑。

以下是一个完整的公共规范化 model 默认值的方法实现：

## 核心实现

```typescript
// composables/useNormalizedModel.ts
import { watch, type Ref, type WatchOptions } from 'vue'

/**
 * 规范化 model 值的配置项
 */
export interface NormalizedModelOptions<T> {
  /** 默认值对象 */
  defaults: T
  /** 是否立即执行规范化，默认 true */
  immediate?: boolean
  /** 是否深度监听，默认 true */
  deep?: boolean
  /** 自定义合并策略，默认覆盖默认值中存在的字段 */
  mergeStrategy?: (current: Partial<T>, defaults: T) => T
}

/**
 * 确保响应式 model 始终具有完整的结构
 * @param model - defineModel 返回的 Ref
 * @param options - 配置项
 * @returns 返回用于手动触发规范化的函数
 * 
 * @example
 * ```ts
 * const model = defineModel<{ zh: string; en: string }>()
 * 
 * // 使用默认配置
 * useNormalizedModel(model, { defaults: { zh: '', en: '' } })
 * 
 * // 使用自定义合并策略
 * useNormalizedModel(model, {
 *   defaults: { zh: '', en: '' },
 *   mergeStrategy: (current, defaults) => ({
 *     ...defaults,
 *     ...current
 *   })
 * })
 * ```
 */
export function useNormalizedModel<T extends Record<string, any>>(
  model: Ref<T | undefined>,
  options: NormalizedModelOptions<T>
) {
  const {
    defaults,
    immediate = true,
    deep = true,
    mergeStrategy = defaultMergeStrategy
  } = options

  /**
   * 规范化值：确保返回值包含所有默认字段
   */
  const normalize = (value: T | undefined): T => {
    if (!value || typeof value !== 'object') {
      return { ...defaults }
    }
    
    // 使用合并策略
    return mergeStrategy(value as Partial<T>, defaults)
  }

  /**
   * 检查两个值是否相等（简单比较，避免无限循环）
   */
  const isEqual = (a: T, b: T): boolean => {
    return JSON.stringify(a) === JSON.stringify(b)
  }

  /**
   * 执行规范化更新
   * @returns 是否执行了更新
   */
  const applyNormalization = (): boolean => {
    const currentValue = model.value
    const normalizedValue = normalize(currentValue)
    
    // 只有值发生变化时才更新
    if (!currentValue || !isEqual(currentValue, normalizedValue)) {
      model.value = normalizedValue
      return true
    }
    return false
  }

  // 监听 model 变化并自动规范化
  const stopWatch = watch(
    () => model.value,
    () => {
      applyNormalization()
    },
    { immediate, deep }
  )

  // 返回停止监听函数和手动规范化函数
  return {
    /** 停止自动规范化 */
    stop: stopWatch,
    /** 手动触发规范化 */
    normalize: applyNormalization,
    /** 获取当前规范化后的值 */
    getNormalizedValue: () => normalize(model.value)
  }
}

/**
 * 默认合并策略：只处理 defaults 中存在的字段
 */
function defaultMergeStrategy<T extends Record<string, any>>(
  current: Partial<T>,
  defaults: T
): T {
  const result = { ...defaults }
  
  for (const key in defaults) {
    if (current[key] !== undefined && current[key] !== null) {
      result[key] = current[key]
    }
  }
  
  return result
}
```

## 扩展工具函数

```typescript
// composables/useNormalizedModel.ts (续)

/**
 * 创建带默认值的 model 工厂函数
 * @param defaults - 默认值配置
 * @returns 工厂函数
 * 
 * @example
 * ```ts
 * const useLocalizedModel = createNormalizedModelFactory({ zh: '', en: '' })
 * const model = defineModel<{ zh: string; en: string }>()
 * useLocalizedModel(model)
 * ```
 */
export function createNormalizedModelFactory<T extends Record<string, any>>(defaults: T) {
  return function(model: Ref<T | undefined>, options?: Omit<NormalizedModelOptions<T>, 'defaults'>) {
    return useNormalizedModel(model, { defaults, ...options })
  }
}

/**
 * 深度合并策略（递归合并嵌套对象）
 */
export function deepMergeStrategy<T extends Record<string, any>>(
  current: Partial<T>,
  defaults: T
): T {
  const result = { ...defaults } as any
  
  for (const key in defaults) {
    const currentValue = current[key]
    const defaultValue = defaults[key]
    
    if (currentValue !== undefined && currentValue !== null) {
      // 如果都是对象且不是数组，递归合并
      if (
        typeof currentValue === 'object' &&
        typeof defaultValue === 'object' &&
        !Array.isArray(currentValue) &&
        !Array.isArray(defaultValue)
      ) {
        result[key] = deepMergeStrategy(currentValue, defaultValue)
      } else {
        result[key] = currentValue
      }
    }
  }
  
  return result
}

/**
 * 保留额外字段的合并策略（保留 defaults 中没有的字段）
 */
export function keepExtraFieldsStrategy<T extends Record<string, any>>(
  current: Partial<T>,
  defaults: T
): T {
  const result = { ...defaults }
  
  // 覆盖默认字段
  for (const key in defaults) {
    if (current[key] !== undefined && current[key] !== null) {
      result[key] = current[key]
    }
  }
  
  // 保留额外字段
  for (const key in current) {
    if (!(key in defaults) && current[key] !== undefined && current[key] !== null) {
      (result as any)[key] = current[key]
    }
  }
  
  return result
}
```

## 使用示例

### 基础用法

```vue
<!-- ChildComponent.vue -->
<script setup lang="ts">
import { useNormalizedModel } from './composables/useNormalizedModel'

// 定义 model
const model = defineModel<{ zh: string; en: string }>()

// 规范化 model，确保始终有 zh 和 en 字段
useNormalizedModel(model, {
  defaults: { zh: '', en: '' }
})
</script>

<template>
  <div>
    <input v-model="model.zh" placeholder="中文" />
    <input v-model="model.en" placeholder="英文" />
    <p>当前值：{{ model }}</p>
  </div>
</template>
```

### 使用工厂函数

```vue
<script setup lang="ts">
import { createNormalizedModelFactory } from './composables/useNormalizedModel'

// 创建专门用于本地化文本的工厂函数
const useLocalizedModel = createNormalizedModelFactory({ 
  zh: '', 
  en: '', 
  ja: '' 
})

const model = defineModel<{ zh: string; en: string; ja: string }>()

// 使用工厂函数
useLocalizedModel(model)
</script>
```

### 使用自定义合并策略

```vue
<script setup lang="ts">
import { useNormalizedModel, deepMergeStrategy } from './composables/useNormalizedModel'

interface Config {
  theme: {
    primary: string
    secondary: string
  }
  fontSize: number
}

const model = defineModel<Config>()

// 使用深度合并策略处理嵌套对象
const { stop, normalize } = useNormalizedModel(model, {
  defaults: {
    theme: {
      primary: '#1890ff',
      secondary: '#f5222d'
    },
    fontSize: 14
  },
  mergeStrategy: deepMergeStrategy
})

// 手动触发规范化
const handleReset = () => {
  normalize()
}

// 组件卸载时停止监听
onUnmounted(() => {
  stop()
})
</script>
```

### 多个字段的复杂示例

```vue
<script setup lang="ts">
import { useNormalizedModel, keepExtraFieldsStrategy } from './composables/useNormalizedModel'

interface UserInfo {
  name: string
  age: number
  email: string
}

const model = defineModel<UserInfo>()

const { getNormalizedValue } = useNormalizedModel(model, {
  defaults: {
    name: '',
    age: 0,
    email: ''
  },
  mergeStrategy: keepExtraFieldsStrategy, // 保留额外字段
  immediate: true,
  deep: true
})

// 获取当前规范化后的值（不会触发更新）
const currentValue = getNormalizedValue()
console.log(currentValue)
</script>
```

### 在组合式函数中使用

```typescript
// composables/useFormModel.ts
import { useNormalizedModel } from './useNormalizedModel'

export function useFormModel<T extends Record<string, any>>(
  model: Ref<T | undefined>,
  defaultValues: T
) {
  const { normalize, getNormalizedValue } = useNormalizedModel(model, {
    defaults: defaultValues,
    immediate: true
  })
  
  const reset = () => {
    model.value = { ...defaultValues }
    normalize()
  }
  
  const isValid = computed(() => {
    const value = getNormalizedValue()
    return Object.values(value).every(v => v !== undefined && v !== '')
  })
  
  return {
    reset,
    isValid,
    getValue: getNormalizedValue
  }
}
```

## 高级用法：全局注册

```typescript
// plugins/normalizedModel.ts
import { App } from 'vue'
import { useNormalizedModel, createNormalizedModelFactory } from '@/composables/useNormalizedModel'

export default {
  install(app: App) {
    // 全局提供工具函数
    app.config.globalProperties.$normalizeModel = useNormalizedModel
    app.config.globalProperties.$createModelFactory = createNormalizedModelFactory
  }
}
```

这个实现提供了：
- ✅ 自动规范化 model 值
- ✅ 可配置的默认值
- ✅ 自定义合并策略
- ✅ 避免无限循环
- ✅ TypeScript 类型安全
- ✅ 灵活的配置选项
- ✅ 多种合并策略（默认、深度合并、保留额外字段）
- ✅ 工厂函数支持