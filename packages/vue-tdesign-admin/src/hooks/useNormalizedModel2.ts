// composables/useNormalizedModel.ts
import { watch, type Ref, type WatchOptions, computed, type ComputedRef, nextTick } from 'vue'

/**
 * 规范化 model 值的配置项
 */
export interface NormalizedModelOptions<T> {
  /** 默认值对象，支持响应式 */
  defaults: T | ComputedRef<T> | (() => T)
  /** 是否立即执行规范化，默认 true */
  immediate?: boolean
  /** 是否深度监听，默认 true */
  deep?: boolean
  /** 自定义合并策略 */
  mergeStrategy?: (current: Partial<T>, defaults: T) => T
}

/**
 * 获取默认值的函数（支持多种传入方式）
 */
function getDefaultsValue<T>(
  defaults: T | ComputedRef<T> | (() => T)
): T {
  if (typeof defaults === 'function') {
    // 如果是函数，调用它
    return (defaults as () => T)()
  } else if (defaults && typeof defaults === 'object' && 'value' in defaults) {
    // 如果是 ComputedRef，取 .value
    return (defaults as ComputedRef<T>).value
  }
  // 否则直接返回
  return defaults as T
}

/**
 * 确保响应式 model 始终具有完整的结构（支持动态 defaults）
 * @param model - defineModel 返回的 Ref
 * @param options - 配置项
 * @returns 返回控制函数
 * 
 * @example
 * ```ts
 * // 静态 defaults
 * const model = defineModel<{ zh: string; en: string }>()
 * useNormalizedModel(model, { defaults: { zh: '', en: '' } })
 * 
 * // 响应式 defaults
 * const dynamicDefaults = ref({ zh: '默认中文', en: '默认英文' })
 * useNormalizedModel(model, { defaults: dynamicDefaults })
 * 
 * // 函数式 defaults
 * useNormalizedModel(model, { 
 *   defaults: () => ({ zh: getDefaultZh(), en: getDefaultEn() })
 * })
 * ```
 */
export function useNormalizedModel<T extends Record<string, any>>(
  model: Ref<T | undefined>,
  options: NormalizedModelOptions<T>
) {
  const {
    defaults: defaultsSource,
    immediate = true,
    deep = false,
    mergeStrategy = defaultMergeStrategy
  } = options

  /**
   * 获取当前的默认值
   */
  const getCurrentDefaults = (): T => {
    return getDefaultsValue(defaultsSource)
  }

  /**
   * 规范化值：确保返回值包含所有默认字段
   */
  const normalize = (value: T | undefined, currentDefaults: T): T => {
    if (!value || typeof value !== 'object') {
      return { ...currentDefaults }
    }

    // 使用合并策略
    return mergeStrategy(value as Partial<T>, currentDefaults)
  }

  /**
   * 检查两个值是否相等
   */
  const isEqual = (a: T, b: T): boolean => {
    return JSON.stringify(a) === JSON.stringify(b)
  }

  const _applyNormalization = (currentValue: T | undefined, currentDefaults: T): boolean => {
    const normalizedValue = normalize(currentValue, currentDefaults)
    // 只有值发生变化时才更新
    if (!currentValue || !isEqual(currentValue, normalizedValue)) {
      model.value = normalizedValue
      return true
    }
    return false
  }
  /**
   * 执行规范化更新
   * @returns 是否执行了更新
   */
  const applyNormalization = (): boolean => {
    return _applyNormalization(model.value, getCurrentDefaults())
  }


  // 监听 model 变化并自动规范化
  const stopWatchModel = watch(
    [model, () => getCurrentDefaults()],
    ([newCurrentValue, newCurrentDefaults]) => {
      _applyNormalization(newCurrentValue, newCurrentDefaults)
    },
    { immediate, deep }
  )

  // 返回控制函数
  return {
    /** 停止自动规范化 */
    stop: () => {
      stopWatchModel()
    },
    /** 手动触发规范化 */
    normalize: applyNormalization,
    /** 获取当前规范化后的值 */
    getNormalizedValue: () => {
      return normalize(model.value, getCurrentDefaults())
    },
    /** 获取当前默认值 */
    getCurrentDefaults
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