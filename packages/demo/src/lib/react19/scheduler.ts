// React 19 调度器 - 支持并发渲染和时间切片

import type { Fiber, Priority } from './types';
import { beginWork, completeWork, commitRoot, getNextWorkUnit, setNextWorkUnit } from './fiber';

// 任务队列
let taskQueue: Task[] = [];
let currentTask: Task | null = null;
let isPerformingWork = false;
let shouldYield = false;

// 时间切片配置
const YIELD_INTERVAL = 5; // 5ms 时间切片
let deadline: number = 0;

// 任务接口
interface Task {
  callback: () => Fiber | null;
  priority: Priority;
  expirationTime: number;
  id: number;
}

// 任务ID计数器
let taskIdCounter = 0;

// 获取当前时间
const getCurrentTime = (): number => {
  return performance.now();
};

// 计算过期时间
const computeExpirationTime = (priority: Priority): number => {
  const currentTime = getCurrentTime();
  
  switch (priority) {
    case Priority.Immediate:
      return currentTime; // 立即过期
    case Priority.UserBlocking:
      return currentTime + 250; // 250ms
    case Priority.Normal:
      return currentTime + 5000; // 5s
    case Priority.Low:
      return currentTime + 10000; // 10s
    case Priority.Idle:
      return currentTime + 100000; // 100s
    default:
      return currentTime + 5000;
  }
};

// 判断是否应该让出主线程
const shouldYieldToHost = (): boolean => {
  return getCurrentTime() >= deadline || shouldYield;
};

// 调度任务
export function scheduleCallback(
  callback: () => Fiber | null,
  priority: Priority = Priority.Normal
): number {
  const id = taskIdCounter++;
  const expirationTime = computeExpirationTime(priority);
  
  const newTask: Task = {
    callback,
    priority,
    expirationTime,
    id,
  };
  
  // 按优先级插入队列
  insertTask(newTask);
  
  // 如果没有正在执行的任务，开始调度
  if (!isPerformingWork) {
    requestHostCallback(performWorkUntilDeadline);
  }
  
  return id;
}

// 插入任务到队列
function insertTask(task: Task): void {
  let insertIndex = 0;
  
  // 找到合适的插入位置（按优先级和过期时间排序）
  while (insertIndex < taskQueue.length) {
    const current = taskQueue[insertIndex];
    
    // 优先级高的在前，过期时间早的在前
    if (current.priority > task.priority || 
        (current.priority === task.priority && current.expirationTime > task.expirationTime)) {
      break;
    }
    
    insertIndex++;
  }
  
  taskQueue.splice(insertIndex, 0, task);
}

// 取消任务
export function cancelCallback(id: number): void {
  taskQueue = taskQueue.filter(task => task.id !== id);
}

// 请求宿主回调
function requestHostCallback(callback: () => void): void {
  // 使用 requestAnimationFrame 进行时间切片
  requestAnimationFrame((timestamp) => {
    deadline = timestamp + YIELD_INTERVAL;
    callback();
  });
}

// 执行工作直到截止时间
function performWorkUntilDeadline(): void {
  isPerformingWork = true;
  
  try {
    // 执行工作循环
    const hasMoreWork = workLoop();
    
    if (hasMoreWork) {
      // 还有工作要做，继续调度
      requestHostCallback(performWorkUntilDeadline);
    } else {
      isPerformingWork = false;
    }
  } catch (error) {
    isPerformingWork = false;
    console.error('Scheduler error:', error);
  }
}

// 工作循环
function workLoop(): boolean {
  let currentTime = getCurrentTime();
  
  // 处理任务直到队列为空或需要让出时间片
  while (taskQueue.length > 0 && !shouldYieldToHost()) {
    currentTask = taskQueue.shift()!;
    
    // 检查任务是否过期
    if (currentTask.expirationTime > currentTime) {
      // 任务未过期，重新插入队列
      insertTask(currentTask);
      currentTask = null;
      continue;
    }
    
    try {
      // 执行任务
      const result = currentTask.callback();
      
      if (result !== null) {
        // 任务返回了新的工作单元，继续处理
        setNextWorkUnit(result);
        performUnitOfWork(result);
      }
    } catch (error) {
      console.error('Task execution error:', error);
    }
    
    currentTime = getCurrentTime();
  }
  
  // 检查是否还有任务需要执行
  return taskQueue.length > 0;
}

// 执行工作单元
export function performUnitOfWork(unit: Fiber): Fiber | null {
  let next: Fiber | null = null;
  
  try {
    // 开始工作
    next = beginWork(null, unit);
    
    if (next === null) {
      // 没有子节点，完成当前工作
      completeUnitOfWork(unit);
    }
  } catch (error) {
    console.error('Work unit error:', error);
    // 处理错误边界
    handleError(unit, error);
  }
  
  return next;
}

// 完成工作单元
function completeUnitOfWork(unit: Fiber): void {
  let completedWork: Fiber | null = unit;
  
  do {
    // 完成当前工作单元
    completeWork(null, completedWork);
    
    // 处理兄弟节点
    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      setNextWorkUnit(siblingFiber);
      return;
    }
    
    // 处理父节点
    completedWork = completedWork.return;
    setNextWorkUnit(completedWork);
  } while (completedWork !== null);
  
  // 所有工作完成，准备提交
  prepareForCommit(unit);
}

// 准备提交
function prepareForCommit(root: Fiber): void {
  // 标记为待提交状态
  pendingCommit = root;
  
  // 调度提交任务
  scheduleCallback(() => {
    if (pendingCommit !== null) {
      commitRoot(pendingCommit);
      pendingCommit = null;
    }
    return null;
  }, Priority.Immediate);
}

// 处理错误
function handleError(fiber: Fiber, error: any): void {
  // 查找错误边界
  let errorBoundary: Fiber | null = fiber.return;
  
  while (errorBoundary !== null) {
    // 检查是否为错误边界组件
    if (typeof errorBoundary.type === 'function') {
      const component = errorBoundary.type;
      
      // 检查是否有 componentDidCatch 方法
      if ((component as any).getDerivedStateFromError) {
        // 处理错误
        console.error('Error caught by boundary:', error);
        break;
      }
    }
    
    errorBoundary = errorBoundary.return;
  }
  
  if (errorBoundary === null) {
    // 没有错误边界，抛出错误
    throw error;
  }
}

// 强制让出主线程（用于高优先级任务）
export function yieldToHost(): void {
  shouldYield = true;
}

// 恢复工作
export function continueWork(): void {
  shouldYield = false;
  
  if (!isPerformingWork && taskQueue.length > 0) {
    requestHostCallback(performWorkUntilDeadline);
  }
}

// 获取当前任务队列大小
export function getTaskQueueSize(): number {
  return taskQueue.length;
}

// 清空任务队列（用于测试）
export function clearTaskQueue(): void {
  taskQueue = [];
  currentTask = null;
  isPerformingWork = false;
}

// 调度器状态
export const SchedulerState = {
  isPerformingWork: () => isPerformingWork,
  shouldYield: () => shouldYieldToHost(),
  currentTask: () => currentTask,
};

// 性能监控
export const PerformanceMonitor = {
  start: (label: string) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-start`);
    }
  },
  
  end: (label: string) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
    }
  },
  
  clear: (label: string) => {
    if (typeof performance !== 'undefined') {
      performance.clearMarks(`${label}-start`);
      performance.clearMarks(`${label}-end`);
      performance.clearMeasures(label);
    }
  },
};