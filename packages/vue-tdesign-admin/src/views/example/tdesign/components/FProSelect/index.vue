<!-- EnhancedSelect.vue -->
<template>
  <t-select
    v-model="currentValue"
    v-bind="$attrs"
    :options="mergedOptions"
    :loading="loading"
    @change="handleChange"
    @visible-change="handleVisibleChange"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps || {}" />
    </template>
  </t-select>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, nextTick, shallowRef } from 'vue'
import type { SelectValue } from 'tdesign-vue-next'

// types.ts
export interface EnhancedSelectProps {
  /** 默认选中项的索引 */
  defaultSelectedIndex?: number
  /** 异步请求函数，用于获取选项数据 */
  request?: () => Promise<SelectOption[]>
  /** 请求参数 */
  requestParams?: Record<string, any>
  /** 是否在组件挂载时自动请求 */
  immediate?: boolean
}

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
  [key: string]: any
}

interface Props extends EnhancedSelectProps {
  modelValue?: SelectValue
  options?: SelectOption[]
}

const props = withDefaults(defineProps<Props>(), {
  defaultSelectedIndex: -1,
  immediate: true,
  modelValue: undefined,
  options: () => [],
  request: undefined,
  requestParams: () => ({})
})

const emit = defineEmits<{
  'update:modelValue': [value: SelectValue]
  'change': [value: SelectValue]
  'request-success': [options: SelectOption[]]
  'request-error': [error: Error]
}>()

const currentValue = shallowRef<SelectValue>(props.modelValue)
const requestOptions = ref<SelectOption[]>([])
const loading = ref(false)
const error = ref<Error | null>(null)

// 合并选项
const mergedOptions = computed<SelectOption[]>(() => {
  if (props.request) {
    return requestOptions.value
  }
  return props.options
})

// 监听 modelValue 变化
watch(() => props.modelValue, (newVal) => {
  currentValue.value = newVal
})

// 监听 currentValue 变化
watch(currentValue, (newVal) => {
  emit('update:modelValue', newVal)
})

// 执行请求
const executeRequest = async () => {
  if (!props.request) return
  
  loading.value = true
  error.value = null
  
  try {
    const params = props.requestParams || {}
    const result = await props.request()
    requestOptions.value = result
    
    emit('request-success', result)
    
    // 设置默认选中项
    if (props.defaultSelectedIndex >= 0 && result.length > 0) {
      const index = Math.min(props.defaultSelectedIndex, result.length - 1)
      const defaultOption = result[index]
      if (defaultOption && defaultOption.value !== undefined) {
        currentValue.value = defaultOption.value
      }
    }
  } catch (err) {
    error.value = err as Error
    emit('request-error', err as Error)
    console.error('EnhancedSelect request error:', err)
  } finally {
    loading.value = false
  }
}

// 处理选项变化
const handleChange = (value: SelectValue) => {
  currentValue.value = value
  emit('change', value)
}

// 处理下拉框显示/隐藏
const handleVisibleChange = (visible: boolean) => {
  // 可以在展开时重新请求数据
  if (visible && props.request) {
    // 如果需要在每次展开时重新请求，取消下面的注释
    // executeRequest()
  }
}

// 初始化时不自动请求的处理
const handleDefaultSelectedIndex = () => {
  if (props.defaultSelectedIndex >= 0 && props.options.length > 0) {
    const index = Math.min(props.defaultSelectedIndex, props.options.length - 1)
    const defaultOption = props.options[index]
    if (defaultOption && defaultOption.value !== undefined) {
      currentValue.value = defaultOption.value
    }
  }
}

onMounted(() => {
  if (props.request && props.immediate) {
    executeRequest()
  } else if (!props.request) {
    handleDefaultSelectedIndex()
  }
})

// 暴露方法供父组件调用
defineExpose({
  executeRequest,
  currentValue,
  loading,
  error
})
</script>