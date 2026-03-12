// composables/useUrlParamsWithRouter.ts
import { ref, readonly, onMounted, watch, type Ref, type DeepReadonly } from 'vue'
import { useRouter, useRoute, type LocationQueryValue } from 'vue-router'

/**
 * 参数值类型
 */
type ParamValue = string | number | boolean | null | undefined
type RouterQueryValue = LocationQueryValue | LocationQueryValue[]

/**
 * 参数对象类型
 */
interface ParamObject {
  [key: string]: ParamValue
}

/**
 * 参数配置选项
 */
interface UseUrlParamsWithRouterOptions {
  /** 是否自动同步到路由，默认true */
  autoSync?: boolean
  /** 是否替换历史记录，默认false（使用push） */
  replace?: boolean
  /** 防抖时间(ms)，0表示不防抖，默认300 */
  debounceTime?: number
  /** 是否编码参数值，默认true */
  encode?: boolean
  /** 是否移除空值参数，默认true */
  removeEmpty?: boolean
  /** 初始化参数 */
  initialParams?: ParamObject
  /** 路由名称（可选） */
  routeName?: string
}

/**
 * 同步选项
 */
interface SyncOptions {
  /** 是否同步到路由 */
  sync?: boolean
  /** 是否替换历史记录 */
  replace?: boolean
}

/**
 * 路由参数管理返回值
 */
interface UseUrlParamsWithRouterReturn {
  /** 当前参数（只读） */
  params: DeepReadonly<Ref<ParamObject>>
  /** 更新参数 */
  updateParams: (newParams: ParamObject, options?: SyncOptions) => void
  /** 删除指定参数 */
  removeParams: (keys: string | string[], options?: SyncOptions) => void
  /** 清空所有参数 */
  clearParams: (options?: SyncOptions) => void
  /** 手动同步当前参数到路由 */
  syncToRoute: (replace?: boolean) => Promise<void>
  /** 重置到初始状态 */
  reset: (options?: SyncOptions) => Promise<void>
  /** 是否有指定参数 */
  hasParam: (key: string) => boolean
  /** 获取指定参数值 */
  getParam: <T extends ParamValue = string>(key: string, defaultValue?: T) => T | undefined
  /** 获取当前路由query对象 */
  getRouteQuery: () => Record<string, RouterQueryValue>
}

/**
 * 基于Vue Router的URL参数管理Hook
 * @param options 配置选项
 */
export function useUrlParamsWithRouter(options: UseUrlParamsWithRouterOptions = {}): UseUrlParamsWithRouterReturn {
  const {
    autoSync = true,
    replace: defaultReplace = false,
    debounceTime = 300,
    encode = true,
    removeEmpty = true,
    initialParams = {},
    routeName
  } = options

  const router = useRouter()
  const route = useRoute()
  const params = ref<ParamObject>({})
  let timeoutId: number | null = null

  /**
   * 解码参数值
   */
  const decodeParam = (value: string): string => {
    try {
      return decode ? decodeURIComponent(value) : value
    } catch {
      return value
    }
  }

  /**
   * 编码参数值
   */
  const encodeParam = (value: ParamValue): string => {
    if (value === null || value === undefined) return ''
    const strValue = String(value)
    return encode ? encodeURIComponent(strValue) : strValue
  }

  /**
   * 从路由解析参数
   */
  const parseRouteParams = (): ParamObject => {
    const result: ParamObject = { ...initialParams }
    
    Object.entries(route.query).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        // 处理数组参数
        if (Array.isArray(value)) {
          result[key] = value.map(v => decodeParam(v as string))
        } else {
          result[key] = decodeParam(value as string)
        }
      }
    })
    
    return result
  }

  // 初始化参数
  params.value = parseRouteParams()

  /**
   * 构建路由query对象
   */
  const buildRouteQuery = (): Record<string, RouterQueryValue> => {
    const query: Record<string, RouterQueryValue> = {}
    
    Object.entries(params.value).forEach(([key, value]) => {
      if (removeEmpty && (value === null || value === undefined || value === '')) {
        return
      }
      
      if (Array.isArray(value)) {
        query[key] = value.map(v => encodeParam(v))
      } else {
        query[key] = encodeParam(value)
      }
    })
    
    return query
  }

  /**
   * 同步到路由（带防抖）
   */
  const syncToRoute = async (replaceHistory: boolean = defaultReplace): Promise<void> => {
    const query = buildRouteQuery()
    
    const navigationPromise = replaceHistory
      ? router.replace({ name: routeName, query })
      : router.push({ name: routeName, query })

    if (debounceTime > 0) {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
      return new Promise((resolve) => {
        timeoutId = window.setTimeout(async () => {
          await navigationPromise
          timeoutId = null
          resolve()
        }, debounceTime)
      })
    } else {
      await navigationPromise
    }
  }

  /**
   * 更新参数
   */
  const updateParams = (newParams: ParamObject, syncOptions: SyncOptions = {}) => {
    params.value = {
      ...params.value,
      ...newParams
    }

    const shouldSync = syncOptions.sync !== undefined ? syncOptions.sync : autoSync
    if (shouldSync) {
      syncToRoute(syncOptions.replace)
    }
  }

  /**
   * 删除参数
   */
  const removeParams = (keys: string | string[], syncOptions: SyncOptions = {}) => {
    const keysToRemove = Array.isArray(keys) ? keys : [keys]
    const newParams = { ...params.value }
    
    keysToRemove.forEach(key => {
      delete newParams[key]
    })
    
    params.value = newParams

    const shouldSync = syncOptions.sync !== undefined ? syncOptions.sync : autoSync
    if (shouldSync) {
      syncToRoute(syncOptions.replace)
    }
  }

  /**
   * 清空所有参数
   */
  const clearParams = (syncOptions: SyncOptions = {}) => {
    params.value = {}

    const shouldSync = syncOptions.sync !== undefined ? syncOptions.sync : autoSync
    if (shouldSync) {
      syncToRoute(syncOptions.replace)
    }
  }

  /**
   * 重置到初始状态
   */
  const reset = async (syncOptions: SyncOptions = {}): Promise<void> => {
    params.value = { ...initialParams }

    const shouldSync = syncOptions.sync !== undefined ? syncOptions.sync : autoSync
    if (shouldSync) {
      await syncToRoute(syncOptions.replace)
    }
  }

  /**
   * 检查是否有指定参数
   */
  const hasParam = (key: string): boolean => {
    return key in params.value
  }

  /**
   * 获取指定参数值
   */
  const getParam = <T extends ParamValue = string>(
    key: string, 
    defaultValue?: T
  ): T | undefined => {
    const value = params.value[key] as T
    return value !== undefined ? value : defaultValue
  }

  /**
   * 获取当前路由query对象
   */
  const getRouteQuery = (): Record<string, RouterQueryValue> => {
    return route.query
  }

  // 监听路由变化
  watch(
    () => route.query,
    (newQuery) => {
      const newParams: ParamObject = {}
      Object.entries(newQuery).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            newParams[key] = value.map(v => decodeParam(v as string))
          } else {
            newParams[key] = decodeParam(value as string)
          }
        }
      })
      params.value = newParams
    },
    { deep: true }
  )

  // 组件卸载时清理定时器
  onMounted(() => {
    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  })

  return {
    params: readonly(params),
    updateParams,
    removeParams,
    clearParams,
    syncToRoute,
    reset,
    hasParam,
    getParam,
    getRouteQuery
  }
}