// ============================================================
// Mini React Concurrent Scheduler
// 基于 React 19 Lane 优先级的并发调度器
// 核心功能: Lane 优先级系统 + 时间切片 + 可中断渲染
// ============================================================

// ---- Lane 优先级定义 ----
// React 19 使用 Lane 模型管理更新优先级
// 数值越小，优先级越高
export const SyncLane =            0b0000000000000000000000000000001  // 同步优先级
export const InputContinuousLane = 0b0000000000000000000000000000100  // 连续输入
export const DefaultLane =         0b0000000000000000000000000010000  // 默认优先级
export const IdleLane =            0b0100000000000000000000000000000  // 空闲优先级
export const OffscreenLane =       0b1000000000000000000000000000000  // 离屏

// Transition lanes
export const TransitionLane1 =     0b0000000000000000000000000100000
export const TransitionLane2 =     0b0000000000000000000000001000000
export const TransitionLane3 =     0b0000000000000000000000010000000

export const NoLanes = 0b0000000000000000000000000000000

export type Lane = number

// 获取最高优先级 lane
export function getHighestPriorityLane(lanes: Lane): Lane {
  return lanes & -lanes
}

// lane 转优先级数值（越小越优先）
export function lanesToPriority(lanes: Lane): number {
  if (lanes & SyncLane) return 0
  if (lanes & InputContinuousLane) return 1
  if (lanes & DefaultLane) return 2
  if (lanes & (TransitionLane1 | TransitionLane2 | TransitionLane3)) return 3
  if (lanes & IdleLane) return 4
  return 5
}

// ---- 任务类型 ----
export interface Task {
  id: number
  callback: ((didTimeout: boolean) => any) | null
  priority: number
  expirationTime: number
  startTime: number
}

type WorkCallback = (currentTime: number) => boolean
type ContinuationCallback = (didTimeout: boolean) => any

let taskIdCounter = 0
const taskQueue: Task[] = []
let isPerformingWork = false
let currentTask: Task | null = null

// 根据优先级计算过期时间
const IMMEDIATE_PRIORITY_TIMEOUT = -1
const USER_BLOCKING_PRIORITY_TIMEOUT = 250
const NORMAL_PRIORITY_TIMEOUT = 5000
const LOW_PRIORITY_TIMEOUT = 10000
const IDLE_PRIORITY_TIMEOUT = 1073741823

function getTimeoutByPriority(priority: number): number {
  switch (priority) {
    case 0: return IMMEDIATE_PRIORITY_TIMEOUT   // Sync
    case 1: return USER_BLOCKING_PRIORITY_TIMEOUT // Input
    case 2: return NORMAL_PRIORITY_TIMEOUT        // Default
    case 3: return LOW_PRIORITY_TIMEOUT           // Transition
    case 4: return LOW_PRIORITY_TIMEOUT           // (same as transition in React 18+)
    case 5: return IDLE_PRIORITY_TIMEOUT          // Idle
    default: return NORMAL_PRIORITY_TIMEOUT
  }
}

export function scheduleCallback(priority: number, callback: ContinuationCallback): Task {
  const currentTime = performance.now()
  const timeout = getTimeoutByPriority(priority)
  const expirationTime = currentTime + timeout

  const newTask: Task = {
    id: taskIdCounter++,
    callback,
    priority,
    expirationTime,
    startTime: currentTime,
  }

  // 按过期时间排序插入
  let insertIndex = taskQueue.length
  for (let i = 0; i < taskQueue.length; i++) {
    if (taskQueue[i].expirationTime > expirationTime) {
      insertIndex = i
      break
    }
  }
  taskQueue.splice(insertIndex, 0, newTask)

  // 设置工作回调并启动消息循环
  if (scheduledHostCallback === null) {
    scheduledHostCallback = flushWork as WorkCallback
  }

  if (!isPerformingWork) {
    requestHostCallback()
  }

  return newTask
}

export function cancelCallback(task: Task): void {
  const idx = taskQueue.indexOf(task)
  if (idx !== -1) {
    taskQueue.splice(idx, 1)
  }
}

// ---- 时间切片 ----
const FRAME_LENGTH = 5  // 每帧 5ms
let frameDeadline = 0
let scheduledHostCallback: WorkCallback | null = null
let isMessageLoopRunning = false

function requestHostCallback(): void {
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true
    schedulePerformWorkUntilDeadline()
  }
}

// 使用 MessageChannel 实现微任务调度（比 setTimeout 更精确）
let channel: MessageChannel | null = null
let port: MessagePort | null = null

function schedulePerformWorkUntilDeadline(): void {
  if (typeof MessageChannel !== 'undefined') {
    if (!channel) {
      channel = new MessageChannel()
      port = channel.port2
      channel.port1.onmessage = performWorkUntilDeadline
    }
    port!.postMessage(null)
  } else {
    setTimeout(performWorkUntilDeadline, 0)
  }
}

function performWorkUntilDeadline(): void {
  if (scheduledHostCallback !== null) {
    const currentTime = performance.now()
    frameDeadline = currentTime + FRAME_LENGTH

    try {
      const hasMoreWork = scheduledHostCallback(currentTime)
      if (!hasMoreWork) {
        isMessageLoopRunning = false
        scheduledHostCallback = null
      }
    } catch (e) {
      isMessageLoopRunning = false
      scheduledHostCallback = null
      throw e
    }
  } else {
    isMessageLoopRunning = false
  }

  // 如果还有工作，重新调度
  if (scheduledHostCallback !== null) {
    schedulePerformWorkUntilDeadline()
  }
}

// 暴露给外部的 shouldYield 检查
export function shouldYieldToHost(): boolean {
  const currentTime = performance.now()
  return frameDeadline <= currentTime
}

// 获取剩余时间
export function getCurrentTime(): number {
  return performance.now()
}

// ---- 工作循环 ----
function flushWork(currentTime: number): boolean {
  isPerformingWork = true
  try {
    return workLoop(currentTime)
  } finally {
    isPerformingWork = false
    currentTask = null
  }
}

function workLoop(currentTime: number): boolean {
  // 允许在单个 workLoop 中处理更高优先级的任务
  currentTask = peek(taskQueue)

  while (currentTask !== null) {
    // 如果任务还未过期，且需要让出控制权（时间切片）
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      break
    }

    const callback = currentTask.callback
    if (typeof callback === 'function') {
      currentTask.callback = null
      const didTimeout = currentTask.expirationTime <= currentTime
      const continuationCallback = callback(didTimeout)

      // 如果回调返回一个函数，说明任务尚未完成
      if (typeof continuationCallback === 'function') {
        currentTask.callback = continuationCallback as ContinuationCallback
        return true
      }
    }

    // 任务完成，从队列移除
    pop(taskQueue)
    currentTask = peek(taskQueue)
    currentTime = performance.now()
  }

  return currentTask !== null
}

function peek(queue: Task[]): Task | null {
  return queue[0] || null
}

function pop(queue: Task[]): Task | undefined {
  return queue.shift()
}

// 刷新所有立即过期的任务（同步任务的降级处理）
export function flushSyncWork(): void {
  const currentTime = performance.now()
  while (taskQueue.length > 0 && taskQueue[0].expirationTime <= currentTime) {
    const task = taskQueue.shift()!
    if (typeof task.callback === 'function') {
      task.callback(true)
    }
  }
  // 如果还有工作，继续调度
  if (taskQueue.length > 0) {
    requestHostCallback()
  }
}

// ---- 启动工作循环 ----
export function startWorkLoop(): void {
  scheduledHostCallback = flushWork as WorkCallback
  requestHostCallback()
}

// ---- 暂停/恢复 ----
export function pauseExecution(): void {
  isPerformingWork = false
}

export function continueExecution(): void {
  if (taskQueue.length > 0) {
    requestHostCallback()
  }
}
