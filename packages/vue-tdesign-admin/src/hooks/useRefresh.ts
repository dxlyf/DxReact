// composables/useRefresh.js
import { useRouter, useRoute } from 'vue-router'
import { nextTick } from 'vue'

export function useRefresh() {
  const router = useRouter()
  const route = useRoute()
  
  const refresh = (options = {}) => {
    const {
      tempPath = '/empty',
      delay = 0
    } = options
    
    router.replace(tempPath)
    
    setTimeout(() => {
      nextTick(() => {
        router.replace(route.fullPath)
      })
    }, delay)
  }
  
  const refreshWithQuery = (newParams) => {
    router.replace({
      path: route.path,
      query: {
        ...route.query,
        ...newParams,
        _t: Date.now() // 添加时间戳避免缓存
      }
    })
  }
  
  return {
    refresh,
    refreshWithQuery
  }
}