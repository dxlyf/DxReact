// composables/usePolling.ts
import { ref, onUnmounted, type Ref } from 'vue'

export interface PollingOptions<T = any> {
  /** 轮询间隔时间(ms) */
  interval: number
  /** 是否立即执行 */
  immediate?: boolean
  /** 最大轮询次数（可选） */
  maxAttempts?: number
  /** 错误重试次数 */
  retryCount?: number
  /** 错误重试延迟(ms) */
  retryDelay?: number
  /** 停止轮询的条件 */
  stopCondition?: (data: T) => boolean
  /** 错误回调 */
  onError?: (error: Error) => void
  /** 成功回调 */
  onSuccess?: (data: T) => void
}

export interface PollingReturn<T> {
  /** 响应数据 */
  data: Ref<T | null>
  /** 加载状态 */
  loading: Ref<boolean>
  /** 错误信息 */
  error: Ref<Error | null>
  /** 轮询次数 */
  attempts: Ref<number>
  /** 是否正在轮询 */
  isPolling: Ref<boolean>
  /** 开始轮询 */
  start: () => void
  /** 停止轮询 */
  stop: () => void
  /** 手动执行一次请求 */
  execute: () => Promise<T | null>
  /** 重置状态 */
  reset: () => void
}

/**
 * 支持轮询的Composition API
 * @param requestFn 请求函数
 * @param options 配置选项
 */
export function usePolling<T = any>(
  requestFn: () => Promise<T>,
  options: PollingOptions<T>
): PollingReturn<T> {
  const {
    interval,
    immediate = true,
    maxAttempts,
    retryCount = 3,
    retryDelay = 1000,
    stopCondition,
    onError,
    onSuccess
  } = options

  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const attempts = ref(0)
  const isPolling = ref(false)

  let pollingTimer: ReturnType<typeof setTimeout> | null = null
  let currentRetryCount = 0
  let isStopped = false

  /**
   * 停止轮询并清理定时器
   */
  const stop = () => {
    isPolling.value = false
    isStopped = true
    if (pollingTimer) {
      clearTimeout(pollingTimer)
      pollingTimer = null
    }
  }

  /**
   * 执行单次请求
   */
  const execute = async (): Promise<T | null> => {
    if (loading.value) return null
    
    loading.value = true
    error.value = null

    try {
      const result = await requestFn()
      data.value = result
      currentRetryCount = 0 // 重置重试计数
      onSuccess?.(result)
      
      // 检查是否需要停止轮询
      if (stopCondition?.(result)) {
        stop()
      }
      
      return result
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err))
      error.value = errorObj
      onError?.(errorObj)
      
      // 错误重试逻辑
      if (currentRetryCount < retryCount) {
        currentRetryCount++
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        if (!isStopped && isPolling.value) {
          return execute()
        }
      } else {
        // 超过重试次数，停止轮询
        stop()
      }
      
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 开始轮询
   */
  const start = () => {
    if (isPolling.value) return
    
    isPolling.value = true
    isStopped = false
    attempts.value = 0
    
    const poll = async () => {
      if (!isPolling.value || isStopped) return
      
      // 检查最大轮询次数
      if (maxAttempts && attempts.value >= maxAttempts) {
        stop()
        return
      }
      
      attempts.value++
      await execute()
      
      // 继续下一次轮询
      if (isPolling.value && !isStopped) {
        pollingTimer = setTimeout(poll, interval)
      }
    }
    
    // 开始轮询
    poll()
  }

  /**
   * 重置所有状态
   */
  const reset = () => {
    stop()
    data.value = null
    error.value = null
    attempts.value = 0
    currentRetryCount = 0
    isStopped = false
  }

  // 自动开始（如果immediate为true）
  if (immediate) {
    start()
  }

  // 组件卸载时停止轮询
  onUnmounted(() => {
    stop()
  })

  return {
    data,
    loading,
    error,
    attempts,
    isPolling,
    start,
    stop,
    execute,
    reset
  }
}