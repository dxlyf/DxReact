// React 19 Hooks 系统 - 基于现代React设计

import type { Fiber, Hook, DependencyList, EffectTag } from './types';

// 全局变量
let currentlyRenderingFiber: Fiber | null = null;
let currentHook: Hook | null = null;
let workInProgressHook: Hook | null = null;
let hookIndex = 0;

// 设置当前渲染的Fiber
export function setCurrentFiber(fiber: Fiber | null): void {
  currentlyRenderingFiber = fiber;
  currentHook = null;
  workInProgressHook = null;
  hookIndex = 0;
}

// 获取当前Fiber
export function getCurrentFiber(): Fiber | null {
  return currentlyRenderingFiber;
}

// 创建Hook
export function createHook(): Hook {
  return {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };
}

// 获取当前Hook
function getCurrentHook(): Hook | null {
  if (currentlyRenderingFiber === null) {
    throw new Error('Hooks can only be called inside the body of a function component.');
  }
  
  if (currentHook === null) {
    // 第一次调用Hook
    if (currentlyRenderingFiber.memoizedState === null) {
      currentHook = createHook();
      currentlyRenderingFiber.memoizedState = currentHook;
    } else {
      currentHook = currentlyRenderingFiber.memoizedState;
    }
  } else {
    currentHook = currentHook.next;
  }
  
  return currentHook;
}

// 获取工作中的Hook
function getWorkInProgressHook(): Hook {
  if (workInProgressHook === null) {
    if (currentlyRenderingFiber === null) {
      throw new Error('Hooks can only be called inside the body of a function component.');
    }
    
    // 第一次调用Hook
    if (currentlyRenderingFiber.memoizedState === null) {
      workInProgressHook = createHook();
      currentlyRenderingFiber.memoizedState = workInProgressHook;
    } else {
      workInProgressHook = currentlyRenderingFiber.memoizedState;
    }
  } else {
    workInProgressHook = workInProgressHook.next;
  }
  
  return workInProgressHook!;
}

// useState Hook
export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void] {
  const hook = getCurrentHook()!;
  
  if (hook.memoizedState === null) {
    // 初始化状态
    hook.memoizedState = typeof initialState === 'function' 
      ? (initialState as () => T)() 
      : initialState;
    hook.baseState = hook.memoizedState;
  }
  
  const queue = hook.queue ||= {
    pending: null,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: hook.memoizedState,
  };
  
  const dispatch = (action: T | ((prevState: T) => T)) => {
    // 调度状态更新
    scheduleUpdate(currentlyRenderingFiber!, action);
  };
  
  queue.dispatch = dispatch;
  
  return [hook.memoizedState, dispatch];
}

// 基础状态reducer
function basicStateReducer<T>(state: T, action: T | ((prevState: T) => T)): T {
  return typeof action === 'function' 
    ? (action as (prevState: T) => T)(state) 
    : action;
}

// useEffect Hook
export function useEffect(
  effect: () => void | (() => void),
  deps?: DependencyList
): void {
  const hook = getCurrentHook()!;
  
  // 检查依赖是否变化
  const nextDeps = deps === undefined ? null : deps;
  const hasChanged = !areHookInputsEqual(nextDeps, hook.memoizedState?.deps);
  
  if (hasChanged) {
    // 标记副作用
    if (currentlyRenderingFiber) {
      currentlyRenderingFiber.flags |= EffectTag.Passive;
    }
    
    hook.memoizedState = {
      effect,
      deps: nextDeps,
      cleanup: null,
    };
  }
}

// useLayoutEffect Hook
export function useLayoutEffect(
  effect: () => void | (() => void),
  deps?: DependencyList
): void {
  const hook = getCurrentHook()!;
  
  // 检查依赖是否变化
  const nextDeps = deps === undefined ? null : deps;
  const hasChanged = !areHookInputsEqual(nextDeps, hook.memoizedState?.deps);
  
  if (hasChanged) {
    // 标记布局副作用
    if (currentlyRenderingFiber) {
      currentlyRenderingFiber.flags |= EffectTag.Layout;
    }
    
    hook.memoizedState = {
      effect,
      deps: nextDeps,
      cleanup: null,
    };
  }
}

// useMemo Hook
export function useMemo<T>(factory: () => T, deps: DependencyList): T {
  const hook = getCurrentHook()!;
  
  // 检查依赖是否变化
  const hasChanged = !areHookInputsEqual(deps, hook.memoizedState?.deps);
  
  if (hasChanged) {
    const newValue = factory();
    hook.memoizedState = {
      value: newValue,
      deps,
    };
    return newValue;
  }
  
  return hook.memoizedState?.value;
}

// useCallback Hook
export function useCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  const hook = getCurrentHook()!;
  
  // 检查依赖是否变化
  const hasChanged = !areHookInputsEqual(deps, hook.memoizedState?.deps);
  
  if (hasChanged) {
    hook.memoizedState = {
      callback,
      deps,
    };
    return callback;
  }
  
  return hook.memoizedState?.callback;
}

// useRef Hook
export function useRef<T>(initialValue: T): { current: T } {
  const hook = getCurrentHook()!;
  
  if (hook.memoizedState === null) {
    hook.memoizedState = { current: initialValue };
  }
  
  return hook.memoizedState;
}

// useReducer Hook
export function useReducer<T, A>(
  reducer: (state: T, action: A) => T,
  initialState: T,
  initialAction?: A
): [T, (action: A) => void] {
  const hook = getCurrentHook()!;
  
  if (hook.memoizedState === null) {
    // 初始化状态
    let state = initialState;
    if (initialAction !== undefined) {
      state = reducer(state, initialAction);
    }
    
    hook.memoizedState = state;
    hook.baseState = state;
  }
  
  const queue = hook.queue ||= {
    pending: null,
    dispatch: null,
    lastRenderedReducer: reducer,
    lastRenderedState: hook.memoizedState,
  };
  
  const dispatch = (action: A) => {
    // 调度reducer更新
    scheduleReducerUpdate(currentlyRenderingFiber!, reducer, action);
  };
  
  queue.dispatch = dispatch;
  
  return [hook.memoizedState, dispatch];
}

// 检查Hook依赖是否相等
function areHookInputsEqual(
  nextDeps: DependencyList | null,
  prevDeps: DependencyList | null
): boolean {
  if (prevDeps === null) {
    return false;
  }
  
  if (nextDeps === null) {
    return false;
  }
  
  if (nextDeps.length !== prevDeps.length) {
    return false;
  }
  
  for (let i = 0; i < nextDeps.length; i++) {
    if (!Object.is(nextDeps[i], prevDeps[i])) {
      return false;
    }
  }
  
  return true;
}

// 调度状态更新
function scheduleUpdate(fiber: Fiber, action: any): void {
  // 这里应该调用调度器来安排更新
  // 简化实现：直接标记需要更新
  fiber.flags |= EffectTag.Update;
}

// 调度reducer更新
function scheduleReducerUpdate(fiber: Fiber, reducer: any, action: any): void {
  // 这里应该调用调度器来安排更新
  // 简化实现：直接标记需要更新
  fiber.flags |= EffectTag.Update;
}

// 提交副作用（在渲染后执行）
export function commitHookEffects(fiber: Fiber): void {
  let hook = fiber.memoizedState;
  
  while (hook !== null) {
    // 执行useEffect
    if (hook.memoizedState?.effect && (fiber.flags & EffectTag.Passive)) {
      try {
        const cleanup = hook.memoizedState.effect();
        if (typeof cleanup === 'function') {
          hook.memoizedState.cleanup = cleanup;
        }
      } catch (error) {
        console.error('Effect error:', error);
      }
    }
    
    // 执行useLayoutEffect
    if (hook.memoizedState?.effect && (fiber.flags & EffectTag.Layout)) {
      try {
        const cleanup = hook.memoizedState.effect();
        if (typeof cleanup === 'function') {
          hook.memoizedState.cleanup = cleanup;
        }
      } catch (error) {
        console.error('Layout effect error:', error);
      }
    }
    
    hook = hook.next;
  }
}

// 清理副作用（在组件卸载时执行）
export function cleanupHookEffects(fiber: Fiber): void {
  let hook = fiber.memoizedState;
  
  while (hook !== null) {
    // 执行清理函数
    if (hook.memoizedState?.cleanup) {
      try {
        hook.memoizedState.cleanup();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
    
    hook = hook.next;
  }
}

// 重置Hook索引（在每次渲染前调用）
export function resetHooks(): void {
  currentHook = null;
  workInProgressHook = null;
  hookIndex = 0;
}

// 获取Hook数量（用于调试）
export function getHookCount(): number {
  return hookIndex;
}

// 错误边界Hook（实验性）
export function useErrorBoundary(): [any, (error: any) => void] {
  const [error, setError] = useState<any>(null);
  
  const handleError = (error: any) => {
    setError(error);
  };
  
  return [error, handleError];
}

// 自定义Hook基类
export function createCustomHook<T>(hookLogic: () => T): () => T {
  return () => {
    return hookLogic();
  };
}

// Hook调试工具
export const HookDebug = {
  getCurrentHook: () => currentHook,
  getHookIndex: () => hookIndex,
  getCurrentFiber: () => currentlyRenderingFiber,
  reset: () => {
    currentHook = null;
    workInProgressHook = null;
    hookIndex = 0;
    currentlyRenderingFiber = null;
  },
};