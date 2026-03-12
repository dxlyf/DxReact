// composables/useUrlParamsSimple.ts
import { ref, readonly, onMounted, onUnmounted } from 'vue'
// composables/useUrlParamsSimpleWithRouter.ts
import {  watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
/**
 * 简单版本的URL参数管理Hook
 * @param autoSync 是否自动同步到URL，默认true
 */
export function useUrlParamsSimple(autoSync: boolean = true) {
  // 从URL初始化参数
  const params = ref<Record<string, string>>({})
  
  // 解析URL参数
  const parseParams = () => {
    const searchParams = new URLSearchParams(window.location.search)
    const result: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      result[key] = value
    })
    return result
  }

  // 初始化
  params.value = parseParams()

  // 更新URL
  const updateUrl = () => {
    const url = new URL(window.location.href)
    Object.entries(params.value).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
    window.history.replaceState({}, '', url.pathname + url.search + url.hash)
  }

  // 设置参数
  const setParam = (key: string, value: string) => {
    params.value[key] = value
    if (autoSync) updateUrl()
  }

  // 设置多个参数
  const setParams = (newParams: Record<string, string>) => {
    params.value = { ...params.value, ...newParams }
    if (autoSync) updateUrl()
  }

  // 删除参数
  const removeParam = (key: string) => {
    delete params.value[key]
    if (autoSync) updateUrl()
  }

  // 删除多个参数
  const removeParams = (keys: string[]) => {
    keys.forEach(key => delete params.value[key])
    if (autoSync) updateUrl()
  }

  // 清空所有参数
  const clearParams = () => {
    params.value = {}
    if (autoSync) updateUrl()
  }

  // 获取参数值
  const getParam = (key: string, defaultValue: string = ''): string => {
    return params.value[key] ?? defaultValue
  }

  // 是否有参数
  const hasParam = (key: string): boolean => {
    return key in params.value
  }

  // 监听popstate事件
  const handlePopState = () => {
    params.value = parseParams()
  }

  onMounted(() => {
    window.addEventListener('popstate', handlePopState)
  })

  onUnmounted(() => {
    window.removeEventListener('popstate', handlePopState)
  })

  return {
    params: readonly(params),
    setParam,
    setParams,
    removeParam,
    removeParams,
    clearParams,
    getParam,
    hasParam
  }
}





/**
 * 基于Vue Router的简单版本URL参数管理Hook
 * @param autoSync 是否自动同步到路由，默认true
 */
export function useUrlParamsSimpleWithRouter(autoSync: boolean = true) {
  const router = useRouter()
  const route = useRoute()
  
  // 从路由初始化参数
  const params = ref<Record<string, string>>({})

  // 解析路由参数
  const parseRouteParams = () => {
    const result: Record<string, string> = {}
    Object.entries(route.query).forEach(([key, value]) => {
      if (typeof value === 'string') {
        result[key] = value
      }
    })
    return result
  }

  // 初始化
  params.value = parseRouteParams()

  // 更新路由
  const updateRoute = (replace: boolean = false) => {
    const query = { ...route.query }
    
    // 更新query对象
    Object.entries(params.value).forEach(([key, value]) => {
      query[key] = value
    })

    // 删除不存在的参数
    Object.keys(query).forEach(key => {
      if (!(key in params.value)) {
        delete query[key]
      }
    })

    if (replace) {
      router.replace({ query })
    } else {
      router.push({ query })
    }
  }

  // 设置参数
  const setParam = (key: string, value: string, replace: boolean = false) => {
    params.value[key] = value
    if (autoSync) updateRoute(replace)
  }

  // 设置多个参数
  const setParams = (newParams: Record<string, string>, replace: boolean = false) => {
    params.value = { ...params.value, ...newParams }
    if (autoSync) updateRoute(replace)
  }

  // 删除参数
  const removeParam = (key: string, replace: boolean = false) => {
    delete params.value[key]
    if (autoSync) updateRoute(replace)
  }

  // 删除多个参数
  const removeParams = (keys: string[], replace: boolean = false) => {
    keys.forEach(key => delete params.value[key])
    if (autoSync) updateRoute(replace)
  }

  // 清空所有参数
  const clearParams = (replace: boolean = false) => {
    params.value = {}
    if (autoSync) updateRoute(replace)
  }

  // 获取参数值
  const getParam = (key: string, defaultValue: string = ''): string => {
    return params.value[key] ?? defaultValue
  }

  // 是否有参数
  const hasParam = (key: string): boolean => {
    return key in params.value
  }

  // 手动同步到路由
  const syncToRoute = (replace: boolean = false) => {
    updateRoute(replace)
  }

  // 监听路由变化
  watch(
    () => route.query,
    () => {
      params.value = parseRouteParams()
    }
  )

  return {
    params: readonly(params),
    setParam,
    setParams,
    removeParam,
    removeParams,
    clearParams,
    getParam,
    hasParam,
    syncToRoute
  }
}