// composables/useDualModel.js
import { computed } from 'vue'

export function useDualModel(props, emit) {
  const value = computed({
    get() {
      // 优先使用 v-model 的值，其次使用 :value
      return props.modelValue ?? props.value
    },
    set(newValue) {
      if (props.modelValue !== undefined) {
        emit('update:modelValue', newValue)
      } else {
        emit('change', newValue)
      }
    }
  })
  
  return value
}