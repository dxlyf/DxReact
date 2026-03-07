// composables/usePolling.ts
import { ref, onBeforeUnmount, type Ref, shallowRef, type ShallowRef, computed } from 'vue'

/**
 * 轮询选项接口
 */
interface PollingOptions {
  /** 轮询间隔（毫秒），默认3000 */
  interval?: number
  /** 是否立即执行一次，默认true */
  immediate?: boolean
  /** 最大重试次数，默认无限 */
  maxRetries?: number
  /** 错误处理函数 */
  onError?: (error: Error, retryCount: number) => void
}

/**
 * 轮询返回值接口
 */
interface PollingReturn<T> {
  /** 是否正在轮询 */
  isPolling: ShallowRef<boolean>
  /** 当前错误 */
  error: ShallowRef<Error | null>
  /** 当前重试次数 */
  retryCount: ShallowRef<number>
  /** 最后一次轮询结果 */
  lastResult: ShallowRef<T | null>
  /** 轮询状态 */
  pollingState: ShallowRef<'idle'|'polling'|'stopped'>
  /** 轮询次数 */
  pollingCount: ShallowRef<number>
  /** 重置轮询状态 */
  resetPollingState: () => void
  /** 启动轮询 */
  start: (...args:any[]) => void
  /** 停止轮询 */
  stop: () => void
  /** 重启轮询 */
  restart: () => void
}

/**
 * 轮询函数
 * @param callback 轮询时要执行的函数
 * @param options 配置选项
 */
export function usePolling<T = any>(
  callback: (...params: any[]) => Promise<T>,
  options: PollingOptions = {}
): PollingReturn<T> {
  const {
    interval = 3000,
    immediate = true,
    maxRetries = Infinity,
    onError = null
  } = options

  const pollingState=shallowRef<'idle'|'polling'|'stopped'>('idle')
  const isPolling = computed({
    get:()=>pollingState.value==='polling',
    set:(val)=>{
      pollingState.value=val?'polling':'stopped'
    }
  })
  const pollingCount=shallowRef<number>(0)
  const retryCount = shallowRef<number>(0)
  const error = shallowRef<Error | null>(null)
  const lastResult = shallowRef<T | null>(null)
  let lastParams: any[] = []
  let timerId: number | null = null

  /**
   * 执行轮询任务
   */
  const execute = async (): Promise<void> => {
    if (!isPolling.value) return

    try {
      error.value = null
      pollingCount.value++
      lastResult.value=await callback(...lastParams)
      retryCount.value = 0 // 成功执行后重置重试计数
    } catch (err) {
      retryCount.value++
      error.value = err as Error
      
      // 错误处理
      if (onError) {
        onError(err as Error, retryCount.value)
      }
      
      console.error('轮询执行错误:', err)
      
      // 检查重试次数
      if (retryCount.value >= maxRetries) {
        console.warn(`达到最大重试次数 (${maxRetries})，停止轮询`)
        stop()
        return
      }
    }

    // 设置下一次轮询
    if (isPolling.value) {
      timerId = window.setTimeout(execute, interval)
    }
  }

  /**
   * 启动轮询
   */
  const start = (...params: any[]): void => {
    if (isPolling.value) return
    lastParams = params
    pollingCount.value=0
    isPolling.value = true
    retryCount.value = 0
    error.value = null
    
    if (immediate) {
      Promise.resolve().then(execute)
    } else {
      timerId = window.setTimeout(execute, interval)
    }
  }

  /**
   * 停止轮询
   */
  const stop = (): void => {
    isPolling.value = false
    if (timerId !== null) {
      clearTimeout(timerId)
      timerId = null
    }
  }

  /**
   * 重启轮询
   */
  const restart = (): void => {
    stop()
    start()
  }

  const resetPollingState=():void=>{
    pollingState.value='idle'
  }

  // 组件卸载前自动停止
  onBeforeUnmount(() => {
    stop()
  })

  return {
    pollingCount,
    pollingState,
    isPolling,
    error,
    retryCount,
    start,
    stop,
    restart,
    resetPollingState,
    lastResult
  }
}