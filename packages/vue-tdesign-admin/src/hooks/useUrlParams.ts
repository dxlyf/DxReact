// composables/useUrlParams.ts
import { ref, readonly, onMounted, onUnmounted, type Ref, type DeepReadonly } from 'vue'

/**
 * 参数值类型
 */
type ParamValue = string | number | boolean | null | undefined

/**
 * 参数对象类型
 */
interface ParamObject {
  [key: string]: ParamValue
}

/**
 * 参数配置选项
 */
interface UseUrlParamsOptions {
  /** 是否自动同步到URL，默认true */
  autoSync?: boolean
  /** 是否替换历史记录，默认false（使用pushState） */
  replace?: boolean
  /** 防抖时间(ms)，0表示不防抖，默认300 */
  debounceTime?: number
  /** 是否编码参数值，默认true */
  encode?: boolean
  /** 是否移除空值参数，默认true */
  removeEmpty?: boolean
  /** 初始化参数 */
  initialParams?: ParamObject
}

/**
 * 同步选项
 */
interface SyncOptions {
  /** 是否同步到URL */
  sync?: boolean
  /** 是否替换历史记录 */
  replace?: boolean
}

/**
 * URL参数管理返回值
 */
interface UseUrlParamsReturn {
  /** 当前参数（只读） */
  params: DeepReadonly<Ref<ParamObject>>
  /** 更新参数 */
  updateParams: (newParams: ParamObject, options?: SyncOptions) => void
  /** 删除指定参数 */
  removeParams: (keys: string | string[], options?: SyncOptions) => void
  /** 清空所有参数 */
  clearParams: (options?: SyncOptions) => void
  /** 手动同步当前参数到URL */
  syncToUrl: (replace?: boolean) => void
  /** 重置到初始状态 */
  reset: (options?: SyncOptions) => void
  /** 是否有指定参数 */
  hasParam: (key: string) => boolean
  /** 获取指定参数值 */
  getParam: <T extends ParamValue = string>(key: string, defaultValue?: T) => T | undefined
}

/**
 * 基于原生History的URL参数管理Hook
 * @param options 配置选项
 */
export function useUrlParams(options: UseUrlParamsOptions = {}): UseUrlParamsReturn {
  const {
    autoSync = true,
    replace: defaultReplace = false,
    debounceTime = 300,
    encode = true,
    removeEmpty = true,
    initialParams = {}
  } = options

  // 从URL初始化参数
  const params = ref<ParamObject>({})
  let timeoutId: number | null = null

  /**
   * 从URL解析参数
   */
  const parseUrlParams = (): ParamObject => {
    const result: ParamObject = {}
    const searchParams = new URLSearchParams(window.location.search)
    
    for (const [key, value] of searchParams) {
      result[key] = decodeParam(value)
    }
    
    return result
  }

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

  // 初始化参数
  const initializeParams = () => {
    const urlParams = parseUrlParams()
    params.value = {
      ...initialParams,
      ...urlParams
    }
  }

  initializeParams()

  /**
   * 更新URL
   */
  const updateUrl = (replaceHistory: boolean = defaultReplace) => {
    const url = new URL(window.location.href)
    
    // 清空现有参数
    Array.from(url.searchParams.keys()).forEach(key => {
      url.searchParams.delete(key)
    })
    
    // 添加新参数
    Object.entries(params.value).forEach(([key, value]) => {
      if (removeEmpty && (value === null || value === undefined || value === '')) {
        return
      }
      url.searchParams.set(key, encodeParam(value))
    })

    const newUrl = url.pathname + url.search + url.hash
    
    if (replaceHistory) {
      window.history.replaceState({ ...window.history.state }, '', newUrl)
    } else {
      window.history.pushState({ ...window.history.state }, '', newUrl)
    }
  }

  /**
   * 同步到URL（带防抖）
   */
  const syncToUrl = (replaceHistory: boolean = defaultReplace) => {
    if (debounceTime > 0) {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
      timeoutId = window.setTimeout(() => {
        updateUrl(replaceHistory)
        timeoutId = null
      }, debounceTime)
    } else {
      updateUrl(replaceHistory)
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
      syncToUrl(syncOptions.replace)
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
      syncToUrl(syncOptions.replace)
    }
  }

  /**
   * 清空所有参数
   */
  const clearParams = (syncOptions: SyncOptions = {}) => {
    params.value = {}

    const shouldSync = syncOptions.sync !== undefined ? syncOptions.sync : autoSync
    if (shouldSync) {
      syncToUrl(syncOptions.replace)
    }
  }

  /**
   * 重置到初始状态
   */
  const reset = (syncOptions: SyncOptions = {}) => {
    params.value = { ...initialParams }

    const shouldSync = syncOptions.sync !== undefined ? syncOptions.sync : autoSync
    if (shouldSync) {
      syncToUrl(syncOptions.replace)
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

  // 监听popstate事件（用户点击前进/后退）
  const handlePopState = () => {
    params.value = parseUrlParams()
  }

  onMounted(() => {
    window.addEventListener('popstate', handlePopState)
  })

  onUnmounted(() => {
    window.removeEventListener('popstate', handlePopState)
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId)
    }
  })

  return {
    params: readonly(params),
    updateParams,
    removeParams,
    clearParams,
    syncToUrl,
    reset,
    hasParam,
    getParam
  }
}