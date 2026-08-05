// ============================================================
// Scheduler —— 基于 Lane 优先级 + MessageChannel 时间切片的调度器
// 对齐 React 19 Scheduler 的设计：
//   - Lane 表示更新优先级（二进制位，数值越小优先级越高）
//   - 任务队列按过期时间排序（最小堆），过期任务立即执行
//   - 通过 MessageChannel 实现宏任务调度与时间切片（可中断）
// ============================================================

// ---------- Lane 优先级 ----------
export const SyncLane = 0b0000000000000000000000000000001
export const InputContinuousLane = 0b0000000000000000000000000000100
export const DefaultLane = 0b0000000000000000000000000010000
export const TransitionLane1 = 0b0000000000000000000000000100000
export const IdleLane = 0b0100000000000000000000000000000
export const NoLanes = 0b0000000000000000000000000000000

export type Lane = number
export type Lanes = number

/** 取最高优先级 lane（最低位） */
export function getHighestPriorityLane(lanes: Lanes): Lane {
  return lanes & -lanes
}

/** lane 转调度优先级（0 最高，与 React lanesToPriority 语义一致） */
export function lanesToPriority(lanes: Lanes): number {
  if (lanes & SyncLane) return 0
  if (lanes & InputContinuousLane) return 1
  if (lanes & DefaultLane) return 2
  if (lanes & TransitionLane1) return 3
  return 4
}

/** 合并 lane 到 lanes */
export function mergeLanes(lanes: Lanes, lane: Lane): Lanes {
  return lanes | lane
}

/** 从 lanes 中移除 lane */
export function removeLanes(lanes: Lanes, lane: Lane): Lanes {
  return lanes & ~lane
}

export function isSubsetOfLanes(set: Lanes, subset: Lanes): boolean {
  return (set & subset) === subset
}

export function includesBlockingLane(lanes: Lanes): boolean {
  return (lanes & (SyncLane | InputContinuousLane)) !== NoLanes
}

// ---------- 任务类型 ----------
/** 调度回调：返回 true 表示还有工作需要继续（continuation） */
export type TaskCallback = (didTimeout: boolean) => boolean | void

export interface Task {
  id: number
  callback: TaskCallback | null
  priority: number
  startTime: number
  expirationTime: number
  sortIndex: number
}

// 各优先级超时时间（ms）
const IMMEDIATE_PRIORITY_TIMEOUT = -1 // 立即
const USER_BLOCKING_PRIORITY_TIMEOUT = 250
const NORMAL_PRIORITY_TIMEOUT = 5000
const LOW_PRIORITY_TIMEOUT = 10000
const IDLE_PRIORITY_TIMEOUT = 1073741823

function timeoutForPriority(priority: number): number {
  switch (priority) {
    case 0:
      return IMMEDIATE_PRIORITY_TIMEOUT
    case 1:
      return USER_BLOCKING_PRIORITY_TIMEOUT
    case 2:
      return NORMAL_PRIORITY_TIMEOUT
    case 3:
      return LOW_PRIORITY_TIMEOUT
    default:
      return IDLE_PRIORITY_TIMEOUT
  }
}

let taskIdCounter = 1

// ---------- 最小堆任务队列 ----------
const taskQueue: Task[] = []

function push(task: Task): void {
  taskQueue.push(task)
  let i = taskQueue.length - 1
  while (i > 0) {
    const parent = (i - 1) >> 1
    if (taskQueue[parent].sortIndex <= task.sortIndex) break
    const tmp = taskQueue[parent]
    taskQueue[parent] = task
    taskQueue[i] = tmp
    i = parent
  }
}

function pop(): Task | null {
  if (taskQueue.length === 0) return null
  const first = taskQueue[0]
  const last = taskQueue.pop()!
  if (taskQueue.length > 0) {
    taskQueue[0] = last
    let i = 0
    for (;;) {
      const left = 2 * i + 1
      const right = 2 * i + 2
      let smallest = i
      if (left < taskQueue.length && taskQueue[left].sortIndex < taskQueue[smallest].sortIndex) {
        smallest = left
      }
      if (right < taskQueue.length && taskQueue[right].sortIndex < taskQueue[smallest].sortIndex) {
        smallest = right
      }
      if (smallest === i) break
      const tmp = taskQueue[i]
      taskQueue[i] = taskQueue[smallest]
      taskQueue[smallest] = tmp
      i = smallest
    }
  }
  return first
}

function peek(): Task | null {
  return taskQueue.length > 0 ? taskQueue[0] : null
}

// ---------- 时间切片（帧预算）----------
const frameInterval = 5 // 每片 5ms，对齐 React 的 5ms 帧预算
let frameDeadline = 0

export function getCurrentTime(): number {
  return performance.now()
}

/** 时间片是否已耗尽，渲染循环据此让出主线程 */
export function shouldYieldToHost(): boolean {
  return getCurrentTime() >= frameDeadline
}

// ---------- MessageChannel 消息循环 ----------
const channel = new MessageChannel()
const port = channel.port2
channel.port1.onmessage = performWorkUntilDeadline

let isMessageLoopRunning = false
let scheduledHostCallback: ((hasTimeRemaining: boolean, initialTime: number) => boolean) | null = null
let isPerformingWork = false

function schedulePerformWorkUntilDeadline(): void {
  port.postMessage(null)
}

function performWorkUntilDeadline(): void {
  if (scheduledHostCallback !== null) {
    const currentTime = getCurrentTime()
    frameDeadline = currentTime + frameInterval
    const hasTimeRemaining = true
    const hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime)
    if (hasMoreWork) {
      schedulePerformWorkUntilDeadline()
    } else {
      isMessageLoopRunning = false
      scheduledHostCallback = null
    }
  } else {
    isMessageLoopRunning = false
  }
}

/**
 * 调度一个任务。
 * @param priority 0=立即 / 1=用户输入 / 2=默认 / 3=过渡 / 4=空闲
 * @param callback 返回 boolean：true=未完成需继续，void/undefined=完成
 */
export function scheduleCallback(priority: number, callback: TaskCallback): Task {
  const currentTime = getCurrentTime()
  const timeout = timeoutForPriority(priority)
  const newTask: Task = {
    id: taskIdCounter++,
    callback,
    priority,
    startTime: currentTime,
    expirationTime: currentTime + timeout,
    sortIndex: currentTime + timeout,
  }
  push(newTask)
  requestHostCallback()
  return newTask
}

/** 取消任务（如高优先级任务插队后放弃低优先级任务） */
export function cancelCallback(task: Task | null): void {
  if (task !== null) {
    task.callback = null
  }
}

function requestHostCallback(): void {
  scheduledHostCallback = workLoop
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true
    schedulePerformWorkUntilDeadline()
  }
}

/** 工作循环：先执行过期任务，再执行未过期任务直到时间片耗尽 */
function workLoop(hasTimeRemaining: boolean, initialTime: number): boolean {
  let currentTime = initialTime

  // 1. 执行所有已过期任务（didTimeout = true，无条件执行防止饿死）
  while (true) {
    const task = peek()
    if (task === null || task.expirationTime > currentTime) break
    const callback = task.callback
    task.callback = null
    pop()
    if (callback !== null) {
      const continuationCallback = callback(true)
      if (typeof continuationCallback === 'function') {
        // 任务未完成，以 continuation 形式重新入队
        const continued = continuationCallback as TaskCallback
        task.callback = continued
        push(task)
      }
    }
    currentTime = getCurrentTime()
  }

  // 2. 执行未过期任务直到时间片耗尽
  while (true) {
    const task = peek()
    if (task === null) return false
    currentTime = getCurrentTime()
    if (task.expirationTime > currentTime) {
      if (!hasTimeRemaining || shouldYieldToHost()) {
        // 时间片用完，让出主线程
        break
      }
    }
    const callback = task.callback
    task.callback = null
    pop()
    if (callback !== null) {
      const didUserCallbackTimeout = task.expirationTime <= currentTime
      const continuationCallback = callback(didUserCallbackTimeout)
      if (typeof continuationCallback === 'function') {
        const continued = continuationCallback as TaskCallback
        task.callback = continued
        push(task)
      }
    }
  }

  return taskQueue.length > 0
}

function flushWork(hasTimeRemaining: boolean, initialTime: number): boolean {
  isPerformingWork = true
  try {
    return workLoop(hasTimeRemaining, initialTime)
  } finally {
    isPerformingWork = false
  }
}

export function isPerformingWorkNow(): boolean {
  return isPerformingWork
}
