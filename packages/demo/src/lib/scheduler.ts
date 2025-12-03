import type { Fiber, FiberTag } from './types';
import { Priority, FiberTag as FiberTagEnum } from './types';
import { createWorkInProgress, reconcileChildren } from './fiber';
import { commitRoot, updateDOMProperties } from './dom-renderer';
import { performanceMonitor } from './performance';
import { Component, instantiateComponent, renderClassComponent, setCurrentFiber } from './components';

// 任务队列
let taskQueue: Task[] = [];
// 当前优先级
let currentPriority: Priority = Priority.LowPriority;
// 当前任务
let currentTask: Task | null = null;
// 是否正在执行任务
let isPerformingWork = false;
// 是否应该中断当前任务
let shouldYield = false;
// 当前时间切片剩余时间
let timeRemaining = 0;
// 帧截止时间
let frameDeadline: number | null = null;

// 任务接口
interface Task {
  callback: () => void;
  priority: Priority;
  expirationTime: number;
  id: number;
}

// 任务ID生成器
let taskIdCounter = 0;

// 获取当前时间
const getCurrentTime = () => {
  return performance.now();
};

// 判断是否应该让出主线程
const shouldYieldToHost = (): boolean => {
  updateTimeRemaining();
  if (frameDeadline !== null) {
    const remaining = frameDeadline - getCurrentTime();
    return remaining <= 0 || shouldYield;
  }
  return shouldYield;
};

// 调度下一帧工作
const schedulePerformWorkUntilDeadline = (): void => {
  requestAnimationFrame(performWorkUntilDeadline);
};

// 在下一帧中执行工作直到deadline
const performWorkUntilDeadline = (timestamp: number): void => {
  if (frameDeadline === null) {
    frameDeadline = timestamp + 16; // 约60fps
  }
  
  const hasMoreWork = workLoop();
  
  if (hasMoreWork) {
    // 还有工作要做，继续调度
    schedulePerformWorkUntilDeadline();
  } else {
    frameDeadline = null;
    isPerformingWork = false;
  }
};

// 计算过期时间
const computeExpirationTime = (priority: Priority): number => {
  const currentTime = getCurrentTime();
  switch (priority) {
    case Priority.SynchronousPriority:
      return currentTime;
    case Priority.HighPriority:
      return currentTime + 250; // 250ms
    case Priority.NormalPriority:
      return currentTime + 5000; // 5s
    case Priority.LowPriority:
      return currentTime + 10000; // 10s
    default:
      return currentTime + 5000; // 默认5s
  }
};

// 调度任务
const scheduleCallback = (callback: () => void, priority: Priority = Priority.NormalPriority): number => {
  performanceMonitor.start();
  try {
    const id = taskIdCounter++;
    const expirationTime = computeExpirationTime(priority);
    
    const newTask: Task = {
      callback,
      priority,
      expirationTime,
      id,
    };
    
    // 按过期时间插入任务队列
    insertTask(newTask);
    
    // 如果没有正在执行的任务，开始执行
    if (!isPerformingWork) {
      requestHostCallback(flushWork);
    }
    
    return id;
  } finally {
    performanceMonitor.end('scheduleCallback');
  }
};

// 插入任务到队列中，保持队列按优先级和过期时间排序
const insertTask = (task: Task): void => {
  let insertIndex = 0;
  
  // 找到合适的插入位置
  while (insertIndex < taskQueue.length) {
    const currentTask = taskQueue[insertIndex];
    
    // 优先按过期时间排序，过期时间早的优先执行
    if (currentTask.expirationTime > task.expirationTime) {
      break;
    }
    
    // 过期时间相同时，优先级高的优先执行
    if (currentTask.expirationTime === task.expirationTime && 
        currentTask.priority > task.priority) {
      break;
    }
    
    insertIndex++;
  }
  
  taskQueue.splice(insertIndex, 0, task);
};

// 取消任务
const cancelCallback = (id: number): void => {
  taskQueue = taskQueue.filter(task => task.id !== id);
};

// 刷新工作循环
const flushWork = (): boolean => {
  isPerformingWork = true;
  const previousPriority = currentPriority;
  
  try {
    // 执行任务
    return workLoop();
  } finally {
    currentTask = null;
    currentPriority = previousPriority;
    isPerformingWork = false;
  }
};

// 工作循环
const workLoop = (): boolean => {
  performanceMonitor.start();
  try {
    // 设置时间切片初始剩余时间为5ms
    timeRemaining = 5;
    shouldYield = false;
    
    // 处理任务直到队列为空或需要让出时间片
    while (taskQueue.length > 0 && !shouldYield) {
      currentTask = taskQueue.shift()!;
      currentPriority = currentTask.priority;
      
      const currentTime = getCurrentTime();
      
      // 检查任务是否过期或需要重新排序
      if (currentTask.expirationTime > currentTime && taskQueue.length > 0) {
        const nextTask = taskQueue[0];
        // 如果队列中有更紧急的任务，重新插入当前任务
        if (nextTask.expirationTime < currentTask.expirationTime || 
            (nextTask.expirationTime === currentTask.expirationTime && nextTask.priority < currentTask.priority)) {
          insertTask(currentTask);
          currentTask = null;
          continue;
        }
      }
      
      // 执行任务
      try {
        currentTask.callback();
      } catch (error) {
        console.error('Scheduler caught an error:', error);
      }
      
      // 更新时间切片剩余时间
      updateTimeRemaining();
    }
    
    // 检查是否还有任务需要执行
    if (taskQueue.length > 0) {
      return true;
    }
    
    return false;
  } finally {
    performanceMonitor.end('workLoop');
  }
};

// 更新时间切片剩余时间
const updateTimeRemaining = (): void => {
  timeRemaining -= 1; // 简单模拟时间消耗
  shouldYield = timeRemaining <= 0;
};

// 获取时间切片剩余时间
const getTimeRemaining = (): number => {
  return timeRemaining;
};

// 检查是否应该让出时间片（已在前面定义）

// 使用requestIdleCallback作为调度器，如果不支持则使用setTimeout
let requestHostCallback: (callback: () => void) => void;

// 初始化宿主环境调度
const initializeScheduler = (): void => {
  if (typeof requestIdleCallback === 'function') {
    // 使用requestIdleCallback
    requestHostCallback = (callback: () => void) => {
      requestIdleCallback((_deadline) => {
        callback();
      }, { timeout: 100 }); // 设置100ms超时
    };
    

  } else {
    // 降级使用setTimeout
    let scheduledCallback: (() => void) | null = null;
    
    requestHostCallback = (callback: () => void) => {
      scheduledCallback = callback;
      setTimeout(() => {
        if (scheduledCallback) {
          const cb = scheduledCallback;
          scheduledCallback = null;
          cb();
        }
      }, 1);
    };
    
    // Cancel callback implementation would go here
  }
};

// 调度根节点更新
const scheduleRootUpdate = (root: any, priority: Priority = Priority.NormalPriority): void => {
  scheduleCallback(() => {
    performSyncWorkOnRoot(root);
  }, priority);
};

// 执行根节点同步工作
const performSyncWorkOnRoot = (root: any): void => {
  // 直接使用root作为current Fiber
  const current = root;
  
  // 创建workInProgress树，传递根节点的pendingProps（包含子元素）
  root.workInProgress = createWorkInProgress(current, current.pendingProps);
  
  // 执行调和阶段
  let next = root.workInProgress;
  while (next && !shouldYieldToHost()) {
    next = performUnitOfWork(next);
  }
  
  // 如果调和阶段完成，执行提交阶段
  if (!next && root.workInProgress) {
    commitRoot(root);
  }
};

// 执行单个工作单元
const performUnitOfWork = (unitOfWork: Fiber): Fiber | null => {
  // 调和当前Fiber节点
  const next = beginWork(unitOfWork);
  
  // 如果当前Fiber没有子节点，尝试完成当前Fiber及其兄弟节点
  if (!next) {
    return completeUnitOfWork(unitOfWork);
  }
  
  return next;
};

// 开始工作
const beginWork = (current: Fiber): Fiber | null => {
  // 对于不同类型的Fiber节点，执行不同的调和逻辑
  switch (current.tag) {
    case FiberTagEnum.HostRoot:
      // 根节点，直接调和children
      const nextChildren = current.pendingProps?.children;
      if (current.alternate) {
        // 更新阶段
        reconcileChildren(current.alternate, current, nextChildren);
      } else {
        // 挂载阶段
        reconcileChildren(null, current, nextChildren);
      }
      return current.child;
    case FiberTagEnum.FunctionComponent:
    case FiberTagEnum.ClassComponent:
      return updateComponent(current);
    case FiberTagEnum.HostComponent:
      return updateHostComponent(current);
    case FiberTagEnum.HostText:
      return null;
    default:
      // 检查是否为Fragment类型
      if (typeof current.type === 'symbol' && current.type.toString() === 'Symbol(Fragment)') {
        // Fragment组件，直接调和children
        const nextChildren = current.pendingProps?.children;
        if (current.alternate) {
          // 更新阶段
          reconcileChildren(current.alternate, current, nextChildren);
        } else {
          // 挂载阶段
          reconcileChildren(null, current, nextChildren);
        }
        return current.child;
      }
      return null;
  }
};

// 更新组件
const updateComponent = (current: Fiber): Fiber | null => {
  const { type, pendingProps } = current;
  
  // 获取子节点
  let nextChildren;
  
  if (typeof type === 'function') {
    if (type.prototype && typeof type.prototype.render === 'function') {
      // 类组件
      try {
        let instance = current.stateNode as Component;
        if (!instance) {
          // 创建类组件实例
          instance = instantiateComponent(current, pendingProps);
          current.stateNode = instance;
        }
        
        // 渲染类组件
        nextChildren = renderClassComponent(current, instance, pendingProps);
      } catch (error) {
        console.error('Error rendering class component:', error);
        nextChildren = null;
      }
    } else {
      // 函数组件
      const Component = type;
      try {
        // 设置当前Fiber（供hooks使用）
        setCurrentFiber(current);
        
        // 执行函数组件
        nextChildren = Component(pendingProps);
      } catch (error) {
        console.error('Error rendering function component:', error);
        nextChildren = null;
      } finally {
        setCurrentFiber(null);
      }
    }
  } else {
    nextChildren = null;
  }
  
  // 调和子节点
  if (current.alternate) {
    // 更新阶段
    reconcileChildren(current.alternate, current, nextChildren);
  } else {
    // 挂载阶段
    reconcileChildren(null, current, nextChildren);
  }
  
  // 返回第一个子节点
  return current.child;
};

// 更新宿主组件
const updateHostComponent = (current: Fiber): Fiber | null => {
  const { type, pendingProps } = current;
  
  // 创建DOM节点（如果不存在）
  if (!current.stateNode) {
    if (type === 'TEXT_ELEMENT') {
      // 文本节点
      current.stateNode = document.createTextNode(pendingProps?.nodeValue || '');
    } else if (typeof type === 'string') {
      // 普通DOM元素
      current.stateNode = document.createElement(type);
      
      // 设置属性
      if (pendingProps) {
        updateDOMProperties(current.stateNode, {}, pendingProps);
      }
    }
  }
  
  // 获取子节点
  const nextChildren = pendingProps?.children;
  
  // 调和子节点
  if (current.alternate) {
    // 更新阶段
    reconcileChildren(current.alternate, current, nextChildren);
  } else {
    // 挂载阶段
    reconcileChildren(null, current, nextChildren);
  }
  
  // 返回第一个子节点
  return current.child;
};

// 完成工作单元
const completeUnitOfWork = (unitOfWork: Fiber): Fiber | null => {
  let completedWork: Fiber = unitOfWork;
  
  while (true) {
    // 获取父节点、兄弟节点
    // Removed unused variable
    const returnFiber = completedWork.return;
    const siblingFiber = completedWork.sibling;
    
    // 标记节点为已完成
    if (returnFiber) {
      // 累加副作用
      if (returnFiber.firstEffect === null) {
        returnFiber.firstEffect = completedWork.firstEffect;
      }
      
      if (completedWork.lastEffect !== null) {
        if (returnFiber.lastEffect !== null) {
          returnFiber.lastEffect.nextEffect = completedWork.firstEffect;
        } else {
          returnFiber.firstEffect = completedWork.firstEffect;
        }
        returnFiber.lastEffect = completedWork.lastEffect;
      }
      
      // 将当前节点的副作用添加到父节点的副作用链表
      const effectTag = completedWork.effectTag;
      if (effectTag !== 0) { // 使用数值0表示无副作用
        if (returnFiber.lastEffect !== null) {
          // 修复nextEffect引用
        } else {
          returnFiber.firstEffect = completedWork;
        }
        returnFiber.lastEffect = completedWork;
      }
    }
    
    // 如果有兄弟节点，返回兄弟节点继续处理
    if (siblingFiber) {
      return siblingFiber;
    }
    
    // 如果没有兄弟节点，返回到父节点
    if (returnFiber) {
      completedWork = returnFiber;
      continue;
    }
    
    // 如果已经达到根节点，完成整个工作单元
    return null;
  }
};

// 初始化调度器
initializeScheduler();

export {
  scheduleCallback,
  cancelCallback,
  shouldYieldToHost,
  getTimeRemaining,
  scheduleRootUpdate,
  performSyncWorkOnRoot,
};
