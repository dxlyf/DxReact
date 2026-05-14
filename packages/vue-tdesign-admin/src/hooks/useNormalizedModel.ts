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