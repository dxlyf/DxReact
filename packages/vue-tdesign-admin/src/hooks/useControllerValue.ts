import { computed, ref, type ComputedRef, type WritableComputedRef } from 'vue'

export interface UseControllerValueOptions<T> {
  /** 默认值 */
  defaultValue?: T
  /** 值变化时的回调函数 */
  onChange?: (value: T) => void
}

export interface UseControllerValueReturn<T> {
  /** 当前值（响应式） */
  value: WritableComputedRef<T>
  /** 是否受控模式 */
  isControlled: ComputedRef<boolean>
  /** 设置值的方法 */
  setValue: (value: T) => void
}

/**
 * 受控值管理 Composable
 * 支持 v-model 绑定，自动处理受控和非受控模式
 *
 * @example
 * // 在组件中使用
 * const props = defineProps<{
 *   modelValue?: string
 *   defaultValue?: string
 * }>()
 * const emit = defineEmits(['update:modelValue'])
 *
 * const { value, setValue, isControlled } = useControllerValue(props, emit, {
 *   defaultValue: props.defaultValue
 * })
 */
export function useControllerValue<T = unknown>(
  props: Record<string, any>,
  emit: (event: string, ...args: any[]) => void,
  options?: UseControllerValueOptions<T>
): UseControllerValueReturn<T> {
  // 内部状态（非受控模式下使用）
  const internalValue = ref<T | undefined>(options?.defaultValue)

  // 判断是否处于受控模式
  const isControlled = computed(() => props.modelValue !== undefined)

  // 获取当前值
  const getValue = (): T => {
    if (isControlled.value) {
      return props.modelValue as T
    }
    return internalValue.value as T
  }

  // 设置值
  const setValue = (newValue: T) => {
    if (isControlled.value) {
      // 受控模式：触发事件让父组件更新
      emit('update:modelValue', newValue)
    } else {
      // 非受控模式：更新内部状态
      internalValue.value = newValue
    }
    // 触发回调
    options?.onChange?.(newValue)
  }

  // 响应式的值
  const value = computed<T>({
    get: getValue,
    set: setValue
  }) as WritableComputedRef<T>

  return {
    value,
    isControlled,
    setValue
  }
}

export default useControllerValue
