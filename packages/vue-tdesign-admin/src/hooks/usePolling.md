## 📝 TypeScript 版本的轮询函数

以下是完整的 TypeScript 实现，包含类型定义和多种功能：

## 📦 基础版本 - 类型安全

```typescript
// composables/usePolling.ts
import { ref, onUnmounted, type Ref } from 'vue'

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
interface PollingReturn {
  /** 是否正在轮询 */
  isPolling: Ref<boolean>
  /** 当前错误 */
  error: Ref<Error | null>
  /** 当前重试次数 */
  retryCount: Ref<number>
  /** 启动轮询 */
  start: () => void
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
  callback: () => Promise<T>,
  options: PollingOptions = {}
): PollingReturn {
  const {
    interval = 3000,
    immediate = true,
    maxRetries = Infinity,
    onError = null
  } = options

  const isPolling = ref<boolean>(false)
  const retryCount = ref<number>(0)
  const error = ref<Error | null>(null)
  let timerId: number | null = null

  /**
   * 执行轮询任务
   */
  const execute = async (): Promise<void> => {
    if (!isPolling.value) return

    try {
      error.value = null
      await callback()
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
  const start = (): void => {
    if (isPolling.value) return
    
    isPolling.value = true
    retryCount.value = 0
    error.value = null
    
    if (immediate) {
      execute()
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

  // 组件卸载前自动停止
  onUnmounted(() => {
    stop()
  })

  return {
    isPolling,
    error,
    retryCount,
    start,
    stop,
    restart
  }
}
```

## 🚀 高级版本 - 完整功能

```typescript
// composables/useAdvancedPolling.ts
import { ref, computed, onUnmounted, watch, type Ref, type ComputedRef } from 'vue'

/**
 * 轮询选项接口
 */
export interface AdvancedPollingOptions<T = any> {
  /** 轮询间隔（毫秒），默认3000 */
  interval?: number
  /** 是否立即执行一次，默认true */
  immediate?: boolean
  /** 最大重试次数，默认无限 */
  maxRetries?: number
  /** 错误处理函数 */
  onError?: (error: Error, retryCount: number) => void
  /** 成功处理函数 */
  onSuccess?: (result: T, successCount: number) => void
  /** 停止回调 */
  onStop?: (lastResult: T | null) => void
  /** 退避因子，用于递增间隔，默认1（无退避） */
  backoffFactor?: number
  /** 最大间隔（毫秒），默认60000 */
  maxInterval?: number
  /** 继续轮询的条件函数 */
  condition?: (result: T | null, error: Error | null) => boolean
  /** 是否在错误时自动停止，默认false */
  stopOnError?: boolean
}

/**
 * 轮询状态接口
 */
export interface PollingState<T = any> {
  /** 是否正在轮询 */
  isPolling: Ref<boolean>
  /** 当前错误 */
  error: Ref<Error | null>
  /** 最后一次结果 */
  lastResult: Ref<T | null>
  /** 当前重试次数 */
  retryCount: ComputedRef<number>
  /** 成功次数 */
  successCount: ComputedRef<number>
  /** 当前间隔 */
  currentInterval: ComputedRef<number>
}

/**
 * 轮询方法接口
 */
export interface PollingMethods {
  /** 启动轮询 */
  start: () => void
  /** 停止轮询 */
  stop: () => void
  /** 重启轮询 */
  restart: () => void
  /** 立即执行一次 */
  executeOnce: () => Promise<any>
  /** 修改间隔 */
  setInterval: (newInterval: number) => void
  /** 重置状态 */
  reset: () => void
}

/**
 * 轮询返回值类型
 */
export type AdvancedPollingReturn<T = any> = PollingState<T> & PollingMethods

/**
 * 高级轮询函数
 * @param callback 轮询时要执行的函数
 * @param options 配置选项
 */
export function useAdvancedPolling<T = any>(
  callback: () => Promise<T>,
  options: AdvancedPollingOptions<T> = {}
): AdvancedPollingReturn<T> {
  const {
    interval = 3000,
    immediate = true,
    maxRetries = Infinity,
    onError = null,
    onSuccess = null,
    onStop = null,
    backoffFactor = 1,
    maxInterval = 60000,
    condition = null,
    stopOnError = false
  } = options

  const isPolling = ref<boolean>(false)
  const retryCount = ref<number>(0)
  const successCount = ref<number>(0)
  const error = ref<Error | null>(null)
  const lastResult = ref<T | null>(null)
  const currentInterval = ref<number>(interval)
  
  let timerId: number | null = null

  /**
   * 计算有效间隔（考虑退避策略）
   */
  const effectiveInterval = computed((): number => {
    if (backoffFactor === 1) return interval
    const calculated = interval * Math.pow(backoffFactor, retryCount.value)
    return Math.min(calculated, maxInterval)
  })

  /**
   * 执行轮询任务
   */
  const execute = async (): Promise<void> => {
    if (!isPolling.value) return

    try {
      error.value = null
      const result = await callback()
      
      lastResult.value = result
      successCount.value++
      retryCount.value = 0
      currentInterval.value = interval // 重置间隔
      
      // 成功回调
      if (onSuccess) {
        onSuccess(result, successCount.value)
      }
    } catch (err) {
      retryCount.value++
      const errorObj = err as Error
      error.value = errorObj
      
      // 更新间隔（退避）
      currentInterval.value = effectiveInterval.value
      
      // 错误处理
      if (onError) {
        onError(errorObj, retryCount.value)
      }
      
      console.error('轮询执行错误:', errorObj)
      
      // 检查是否达到最大重试次数
      if (retryCount.value >= maxRetries) {
        console.warn(`达到最大重试次数 (${maxRetries})，停止轮询`)
        stop()
        return
      }
      
      // 检查是否需要在错误时停止
      if (stopOnError) {
        stop()
        return
      }
    }

    // 检查是否满足继续条件
    const shouldContinue = condition 
      ? condition(lastResult.value, error.value)
      : true
    
    if (isPolling.value && shouldContinue) {
      timerId = window.setTimeout(execute, currentInterval.value)
    } else if (!shouldContinue) {
      stop()
    }
  }

  /**
   * 启动轮询
   */
  const start = (): void => {
    if (isPolling.value) return
    
    isPolling.value = true
    retryCount.value = 0
    error.value = null
    
    if (immediate) {
      execute()
    } else {
      timerId = window.setTimeout(execute, interval)
    }
  }

  /**
   * 停止轮询
   */
  const stop = (): void => {
    if (isPolling.value) {
      isPolling.value = false
      if (timerId !== null) {
        clearTimeout(timerId)
        timerId = null
      }
      
      if (onStop) {
        onStop(lastResult.value)
      }
    }
  }

  /**
   * 重启轮询
   */
  const restart = (): void => {
    stop()
    start()
  }

  /**
   * 立即执行一次（不重置轮询）
   */
  const executeOnce = async (): Promise<T> => {
    if (isPolling.value) {
      throw new Error('轮询正在进行中，请先停止')
    }
    return await callback()
  }

  /**
   * 修改间隔
   */
  const setInterval = (newInterval: number): void => {
    currentInterval.value = newInterval
    if (isPolling.value) {
      restart() // 重启以应用新间隔
    }
  }

  /**
   * 重置状态
   */
  const reset = (): void => {
    stop()
    retryCount.value = 0
    successCount.value = 0
    error.value = null
    lastResult.value = null
    currentInterval.value = interval
  }

  // 组件卸载前自动停止
  onUnmounted(() => {
    stop()
  })

  // 监听间隔变化
  watch(currentInterval, (newVal, oldVal) => {
    if (newVal !== oldVal && isPolling.value) {
      restart()
    }
  })

  return {
    // 状态
    isPolling,
    error,
    lastResult,
    retryCount: computed(() => retryCount.value),
    successCount: computed(() => successCount.value),
    currentInterval: computed(() => currentInterval.value),
    
    // 方法
    start,
    stop,
    restart,
    executeOnce,
    setInterval,
    reset
  }
}
```

## 🎯 使用示例 - TypeScript 版本

### 1. **基础使用 - 带类型**

```vue
<template>
  <div class="polling-demo">
    <h3>实时数据监控</h3>
    
    <!-- 状态显示 -->
    <div class="status">
      <span class="indicator" :class="{ active: isPolling }"></span>
      <span>{{ isPolling ? '轮询中' : '已停止' }}</span>
      <span v-if="retryCount > 0" class="retry-count">
        重试: {{ retryCount }}/{{ maxRetries }}
      </span>
    </div>

    <!-- 数据显示 -->
    <div v-if="data" class="data-display">
      <pre>{{ JSON.stringify(data, null, 2) }}</pre>
    </div>

    <!-- 错误显示 -->
    <div v-if="error" class="error">
      ❌ {{ error.message }}
    </div>

    <!-- 控制按钮 -->
    <div class="controls">
      <button 
        @click="startPolling" 
        :disabled="isPolling"
        class="btn start"
      >
        开始轮询
      </button>
      <button 
        @click="stopPolling" 
        :disabled="!isPolling"
        class="btn stop"
      >
        停止轮询
      </button>
      <button 
        @click="restartPolling" 
        class="btn restart"
      >
        重启
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAdvancedPolling } from './composables/useAdvancedPolling'

// 定义数据类型
interface RealtimeData {
  id: number
  value: number
  timestamp: string
  status: 'active' | 'inactive'
}

const data = ref<RealtimeData | null>(null)
const maxRetries = 5

// 定义轮询任务
const fetchData = async (): Promise<RealtimeData> => {
  const response = await fetch('/api/realtime-data')
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const result = await response.json()
  data.value = result
  return result
}

// 使用轮询（带类型）
const {
  isPolling,
  error,
  retryCount,
  start,
  stop,
  restart
} = useAdvancedPolling<RealtimeData>(fetchData, {
  interval: 5000,
  immediate: false,
  maxRetries,
  backoffFactor: 1.5,
  onSuccess: (result, count) => {
    console.log(`第${count}次成功获取数据:`, result)
  },
  onError: (err, retries) => {
    console.error(`第${retries}次重试:`, err.message)
  },
  condition: (result, err) => {
    // 根据数据状态决定是否继续
    return result?.status !== 'inactive'
  }
})

// 包装方法供模板使用
const startPolling = start
const stopPolling = stop
const restartPolling = restart
</script>
```

### 2. **带进度显示的长轮询**

```vue
<template>
  <div class="long-polling">
    <h3>任务进度监控</h3>
    
    <div class="task-info">
      <p>任务ID: {{ taskId }}</p>
      <p>状态: {{ taskStatus }}</p>
    </div>

    <!-- 进度条 -->
    <div v-if="taskProgress > 0" class="progress-container">
      <div class="progress-bar" :style="{ width: taskProgress + '%' }">
        {{ taskProgress }}%
      </div>
    </div>

    <!-- 结果 -->
    <div v-if="taskResult" class="task-result">
      <h4>处理结果:</h4>
      <pre>{{ JSON.stringify(taskResult, null, 2) }}</pre>
    </div>

    <div class="controls">
      <button 
        @click="startTask" 
        :disabled="isPolling"
        class="btn start"
      >
        开始处理
      </button>
      <button 
        @click="stopPolling" 
        :disabled="!isPolling"
        class="btn stop"
      >
        取消
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAdvancedPolling } from './composables/useAdvancedPolling'

// 类型定义
interface TaskResponse {
  taskId: string
}

interface TaskStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  result?: any
  error?: string
}

const taskId = ref<string | null>(null)
const taskStatus = ref<string>('idle')
const taskProgress = ref<number>(0)
const taskResult = ref<any>(null)

// 模拟创建任务
const createTask = async (): Promise<TaskResponse> => {
  const response = await fetch('/api/tasks', { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (!response.ok) {
    throw new Error('创建任务失败')
  }
  const data = await response.json()
  taskId.value = data.taskId
  return data
}

// 查询任务状态
const queryTaskStatus = async (): Promise<TaskStatus> => {
  if (!taskId.value) {
    throw new Error('任务ID不存在')
  }
  
  const response = await fetch(`/api/tasks/${taskId.value}`)
  if (!response.ok) {
    throw new Error('查询任务状态失败')
  }
  
  const data: TaskStatus = await response.json()
  
  taskStatus.value = data.status
  taskProgress.value = data.progress || 0
  
  // 如果任务完成，保存结果
  if (data.status === 'completed') {
    taskResult.value = data.result
    stop() // 任务完成，停止轮询
  } else if (data.status === 'failed') {
    throw new Error(data.error || '任务失败')
  }
  
  return data
}

// 使用轮询
const {
  isPolling,
  start,
  stop
} = useAdvancedPolling<TaskStatus>(queryTaskStatus, {
  interval: 2000,
  immediate: false,
  condition: (result) => {
    // 当任务完成或失败时停止轮询
    return result?.status !== 'completed' && result?.status !== 'failed'
  },
  onError: (err) => {
    taskStatus.value = 'failed'
    taskResult.value = { error: err.message }
  }
})

// 开始任务
const startTask = async (): Promise<void> => {
  taskProgress.value = 0
  taskResult.value = null
  taskStatus.value = 'processing'
  
  try {
    await createTask()
    start() // 开始轮询
  } catch (err) {
    taskStatus.value = 'failed'
    taskResult.value = { error: (err as Error).message }
  }
}
</script>
```

### 3. **多个轮询实例管理**

```vue
<template>
  <div class="multi-polling">
    <h3>多数据源监控</h3>
    
    <div class="polling-list">
      <div v-for="source in dataSources" :key="source.id" class="source-item">
        <div class="source-header">
          <h4>{{ source.name }}</h4>
          <span class="status" :class="{ active: source.polling.isPolling.value }">
            {{ source.polling.isPolling.value ? '轮询中' : '已停止' }}
          </span>
        </div>
        
        <div class="source-data">
          <pre>{{ JSON.stringify(source.polling.lastResult.value, null, 2) }}</pre>
        </div>
        
        <div class="source-controls">
          <button 
            @click="source.polling.start"
            :disabled="source.polling.isPolling.value"
            class="small-btn start"
          >
            启动
          </button>
          <button 
            @click="source.polling.stop"
            :disabled="!source.polling.isPolling.value"
            class="small-btn stop"
          >
            停止
          </button>
        </div>
      </div>
    </div>

    <div class="global-controls">
      <button @click="startAll" class="btn">启动全部</button>
      <button @click="stopAll" class="btn">停止全部</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAdvancedPolling } from './composables/useAdvancedPolling'

// 类型定义
interface UserData {
  id: number
  name: string
  email: string
}

interface OrderData {
  id: number
  amount: number
  status: string
}

interface SystemStatus {
  cpu: number
  memory: number
  uptime: number
}

// 数据源类型
interface DataSource<T = any> {
  id: number
  name: string
  polling: ReturnType<typeof useAdvancedPolling<T>>
}

// 多个数据源
const dataSources: DataSource[] = [
  {
    id: 1,
    name: '用户数据',
    polling: useAdvancedPolling<UserData[]>(
      async () => {
        const res = await fetch('/api/users')
        return res.json()
      },
      { interval: 5000 }
    )
  },
  {
    id: 2,
    name: '订单数据',
    polling: useAdvancedPolling<OrderData[]>(
      async () => {
        const res = await fetch('/api/orders')
        return res.json()
      },
      { interval: 3000 }
    )
  },
  {
    id: 3,
    name: '系统状态',
    polling: useAdvancedPolling<SystemStatus>(
      async () => {
        const res = await fetch('/api/status')
        return res.json()
      },
      { interval: 10000 }
    )
  }
]

// 全局控制
const startAll = (): void => {
  dataSources.forEach(s => s.polling.start())
}

const stopAll = (): void => {
  dataSources.forEach(s => s.polling.stop())
}
</script>
```

### 4. **带自动重连的 WebSocket 降级方案**

```typescript
// composables/useReconnectPolling.ts
import { useAdvancedPolling, type AdvancedPollingOptions } from './useAdvancedPolling'

interface ReconnectOptions<T = any> extends AdvancedPollingOptions<T> {
  maxReconnectAttempts?: number
  reconnectInterval?: number
  onReconnect?: (attempt: number) => void
}

export function useReconnectPolling<T = any>(
  callback: () => Promise<T>,
  options: ReconnectOptions<T> = {}
) {
  const {
    maxReconnectAttempts = 10,
    reconnectInterval = 5000,
    onReconnect,
    ...pollingOptions
  } = options

  let reconnectAttempts = 0

  const polling = useAdvancedPolling<T>(async () => {
    try {
      const result = await callback()
      reconnectAttempts = 0 // 成功后重置
      return result
    } catch (error) {
      reconnectAttempts++
      
      if (reconnectAttempts <= maxReconnectAttempts) {
        if (onReconnect) {
          onReconnect(reconnectAttempts)
        }
        
        // 使用退避策略
        const delay = reconnectInterval * Math.pow(1.5, reconnectAttempts - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // 重试
        return await callback()
      }
      
      throw error
    }
  }, {
    ...pollingOptions,
    backoffFactor: 1.5,
    maxRetries: maxReconnectAttempts
  })

  return {
    ...polling,
    reconnectAttempts
  }
}
```

## 📊 类型定义总结

| 类型 | 作用 | 包含属性/方法 |
|:---|:---|:---|
| `PollingOptions` | 轮询配置 | interval, immediate, maxRetries, onError |
| `AdvancedPollingOptions` | 高级配置 | 继承基础 + backoffFactor, condition 等 |
| `PollingState` | 轮询状态 | isPolling, error, lastResult, retryCount 等 |
| `PollingMethods` | 轮询方法 | start, stop, restart, executeOnce 等 |
| `AdvancedPollingReturn` | 完整返回 | 合并状态和方法 |

## 💡 最佳实践

1. **类型安全**：始终为回调函数指定返回类型
2. **错误处理**：提供 onError 回调，避免静默失败
3. **资源清理**：组件卸载时自动停止轮询
4. **条件控制**：使用 condition 函数控制轮询生命周期
5. **退避策略**：网络波动时避免频繁重试

这个 TypeScript 版本的轮询函数提供了完整的类型支持，可以在开发时获得更好的 IDE 提示和类型检查。