import type { Fiber, EffectCallback, DependencyList } from './types';
import { getCurrentFiber, getHookIndex } from './components';
import { markUpdateWithPriority } from './fiber';
import { scheduleRootUpdate } from './scheduler';

// Hook 类型定义
type Hook = {
  memoizedState: any;
  baseState: any;
  baseQueue: Update<any> | null;
  queue: any;
  next: Hook | null;
};

// 更新队列项
type Update<S> = {
  action: ((prevState: S) => S) | S;
  next: Update<S> | null;
};

// 效果 Hook 数据结构
type Effect = {
  tag: number;
  create: EffectCallback | void;
  destroy: (() => void) | void;
  deps: DependencyList | null;
  next: Effect | null;
};

// 效果标签
const HookHasEffect = 1;
const HookLayout = 2;
const HookPassive = 4;

// 获取当前组件的 Hook 链表
function getHook(): Hook {
  const fiber = getCurrentFiber();
  if (!fiber) {
    throw new Error('Hooks can only be called inside component functions');
  }
  
  const index = getHookIndex();
  let memoizedState = fiber.memoizedState as Hook | null;
  
  if (memoizedState) {
    // 找到对应的 Hook
    let currentHook: Hook | null = memoizedState;
    for (let i = 0; i < index; i++) {
      if (!currentHook?.next) {
        throw new Error('Invalid hook call. Hooks must be called in the same order.');
      }
      currentHook = currentHook.next;
    }
    
    if (currentHook) {
      return currentHook;
    }
  }
  
  // 创建新的 Hook
  const newHook: Hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null
  };
  
  // 添加到 Hook 链表
  if (!memoizedState) {
    fiber.memoizedState = newHook;
  } else {
    let lastHook = memoizedState;
    while (lastHook.next) {
      lastHook = lastHook.next;
    }
    lastHook.next = newHook;
  }
  
  return newHook;
}

// useState Hook
export function useState<S>(initialState: S | (() => S)): [S, (newState: S | ((prevState: S) => S)) => void] {
  const hook = getHook();
  
  // 初始化状态
  if (!hook.memoizedState) {
    const initialValue = typeof initialState === 'function' 
      ? (initialState as () => S)() 
      : initialState;
    
    hook.memoizedState = initialValue;
    hook.baseState = initialValue;
    hook.baseQueue = null;
    
    // 创建更新队列
    hook.queue = {
      pending: null,
      dispatch: null
    };
  }
  
  const queue = hook.queue;
  const current = getCurrentFiber();
  
  // 创建 dispatch 函数
  if (!queue.dispatch && current) {
    queue.dispatch = (action: S | ((prevState: S) => S)) => {
      // 创建更新
      const update: Update<S> = {
        action,
        next: null
      };
      
      // 添加到更新队列
      if (!queue.pending) {
        queue.pending = update;
        update.next = update;
      } else {
        update.next = queue.pending.next;
        queue.pending.next = update;
        queue.pending = update;
      }
      
      // 调度更新
      if (current) {
        markUpdateWithPriority(current, 1); // NORMAL priority
        scheduleRootUpdate(current);
      }
    };
  }
  
  // 处理待处理的更新
  if (hook.baseQueue) {
    let newState = hook.baseState;
    let update = hook.baseQueue;
    
    do {
      const action = update.action;
      newState = typeof action === 'function' 
        ? (action as (prevState: S) => S)(newState)
        : action;
      update = update.next!;
    } while (update !== hook.baseQueue);
    
    hook.memoizedState = newState;
    hook.baseState = newState;
    hook.baseQueue = null;
  }
  
  return [hook.memoizedState, queue.dispatch!];
}

// useEffect Hook
export function useEffect(effect: EffectCallback, deps?: DependencyList): void {
  const fiber = getCurrentFiber();
  if (!fiber) {
    throw new Error('useEffect can only be called inside component functions');
  }
  
  const hook = getHook();
  const nextDeps = deps === undefined ? null : deps;
  
  // 检查依赖是否变化
  let destroy: (() => void) | void = undefined;
  
  if (hook.memoizedState) {
    const prevEffect = hook.memoizedState as Effect;
    const prevDeps = prevEffect.deps;
    
    if (nextDeps !== null && prevDeps !== null) {
      let depsChanged = false;
      for (let i = 0; i < nextDeps.length && !depsChanged; i++) {
        if (nextDeps[i] !== prevDeps[i]) {
          depsChanged = true;
        }
      }
      
      if (!depsChanged) {
        // 依赖未变化，重用之前的 effect
        pushEffect(HookPassive, prevEffect.create, prevEffect.destroy, nextDeps);
        return;
      }
      
      // 依赖变化，保存销毁函数
      destroy = prevEffect.destroy;
    }
  }
  
  // 创建新的 effect
  hook.memoizedState = pushEffect(HookHasEffect | HookPassive, effect, destroy, nextDeps);
}

// useLayoutEffect Hook
export function useLayoutEffect(effect: EffectCallback, deps?: DependencyList): void {
  const fiber = getCurrentFiber();
  if (!fiber) {
    throw new Error('useLayoutEffect can only be called inside component functions');
  }
  
  const hook = getHook();
  const nextDeps = deps === undefined ? null : deps;
  
  let destroy: (() => void) | void = undefined;
  
  if (hook.memoizedState) {
    const prevEffect = hook.memoizedState as Effect;
    const prevDeps = prevEffect.deps;
    
    if (nextDeps !== null && prevDeps !== null) {
      let depsChanged = false;
      for (let i = 0; i < nextDeps.length && !depsChanged; i++) {
        if (nextDeps[i] !== prevDeps[i]) {
          depsChanged = true;
        }
      }
      
      if (!depsChanged) {
        pushEffect(HookLayout, prevEffect.create, prevEffect.destroy, nextDeps);
        return;
      }
      
      destroy = prevEffect.destroy;
    }
  }
  
  hook.memoizedState = pushEffect(HookHasEffect | HookLayout, effect, destroy, nextDeps);
}

// useContext Hook
export function useContext<T>(context: { Provider: any; _currentValue: T }): T {
  const fiber = getCurrentFiber();
  if (!fiber) {
    throw new Error('useContext can only be called inside component functions');
  }
  
  // 这里简化处理，实际需要监听 context 变化
  return context._currentValue;
}

// useReducer Hook
export function useReducer<S, A>(
  reducer: (state: S, action: A) => S,
  initialState: S
): [S, (action: A) => void] {
  const hook = getHook();
  
  // 初始化
  if (!hook.memoizedState) {
    hook.memoizedState = initialState;
    hook.baseState = initialState;
    hook.baseQueue = null;
    
    hook.queue = {
      pending: null,
      dispatch: null,
      lastRenderedState: initialState
    };
  }
  
  const queue = hook.queue;
  const current = getCurrentFiber();
  
  // 创建 dispatch 函数
  if (!queue.dispatch && current) {
    queue.dispatch = (action: A) => {
      const update: Update<S> = {
        action: (state: S) => reducer(state, action),
        next: null
      };
      
      // 添加到更新队列
      if (!queue.pending) {
        queue.pending = update;
        update.next = update;
      } else {
        update.next = queue.pending.next;
        queue.pending.next = update;
        queue.pending = update;
      }
      
      // 调度更新
      if (current) {
        markUpdateWithPriority(current, 1); // NORMAL priority
        scheduleUpdate();
      }
    };
  }
  
  // 处理待处理的更新
  if (hook.baseQueue) {
    let newState = hook.baseState;
    let update = hook.baseQueue;
    
    do {
      const action = update.action;
      newState = typeof action === 'function' 
        ? (action as (prevState: S) => S)(newState)
        : action;
      update = update.next!;
    } while (update !== hook.baseQueue);
    
    hook.memoizedState = newState;
    hook.baseState = newState;
    hook.baseQueue = null;
    
    if (queue) {
      queue.lastRenderedState = newState;
    }
  }
  
  return [hook.memoizedState, queue.dispatch!];
}

// useRef Hook
export function useRef<T>(initialValue: T): { current: T } {
  const hook = getHook();
  
  if (!hook.memoizedState) {
    hook.memoizedState = { current: initialValue };
  }
  
  return hook.memoizedState;
}

// useCallback Hook
export function useCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  const hook = getHook();
  
  if (!hook.memoizedState) {
    // 首次渲染
    hook.memoizedState = [callback, deps];
    return callback;
  }
  
  const [prevCallback, prevDeps] = hook.memoizedState;
  
  // 检查依赖是否变化
  let depsChanged = false;
  for (let i = 0; i < deps.length && !depsChanged; i++) {
    if (deps[i] !== prevDeps[i]) {
      depsChanged = true;
    }
  }
  
  if (depsChanged) {
    hook.memoizedState = [callback, deps];
    return callback;
  }
  
  return prevCallback;
}

// useMemo Hook
export function useMemo<T>(factory: () => T, deps: DependencyList): T {
  const hook = getHook();
  
  if (!hook.memoizedState) {
    // 首次渲染
    const value = factory();
    hook.memoizedState = [value, deps];
    return value;
  }
  
  const [prevValue, prevDeps] = hook.memoizedState;
  
  // 检查依赖是否变化
  let depsChanged = false;
  for (let i = 0; i < deps.length && !depsChanged; i++) {
    if (deps[i] !== prevDeps[i]) {
      depsChanged = true;
    }
  }
  
  if (depsChanged) {
    const value = factory();
    hook.memoizedState = [value, deps];
    return value;
  }
  
  return prevValue;
}

// useImperativeHandle Hook
export function useImperativeHandle<T, R extends T>(
  ref: { current: T | null } | ((instance: T | null) => void) | null | undefined,
  createHandle: () => R,
  deps?: DependencyList
): void {
  const hook = getHook();
  const nextDeps = deps === undefined ? null : deps;
  
  // 检查依赖是否变化
  let shouldUpdate = !hook.memoizedState;
  
  if (hook.memoizedState && nextDeps !== null) {
    const prevDeps = hook.memoizedState[1];
    for (let i = 0; i < nextDeps.length && !shouldUpdate; i++) {
      if (nextDeps[i] !== prevDeps[i]) {
        shouldUpdate = true;
      }
    }
  }
  
  if (shouldUpdate) {
    const handle = createHandle();
    hook.memoizedState = [handle, nextDeps];
    
    // 设置 ref
    if (typeof ref === 'function') {
      ref(handle);
    } else if (ref !== null && ref !== undefined) {
      ref.current = handle;
    }
  }
}

// useDebugValue Hook
export function useDebugValue<T>(_value: T, _formatter?: (value: T) => any): void {
  // 开发环境下的调试工具，这里简化处理
}

// 推送 effect 到 Fiber
export function pushEffect(
  tag: number,
  create: EffectCallback | void,
  destroy: (() => void) | void,
  deps: DependencyList | null
): Effect {
  const effect: Effect = {
    tag,
    create,
    destroy,
    deps,
    next: null
  };
  
  const fiber = getCurrentFiber();
  if (!fiber) return effect;
  
  // 连接到 Fiber 的 effect 链表
  if (!fiber.updateQueue) {
    fiber.updateQueue = { lastEffect: null };
    effect.next = effect;
    fiber.updateQueue.lastEffect = effect;
  } else {
    const lastEffect = fiber.updateQueue.lastEffect!;
    const firstEffect = lastEffect.next!;
    lastEffect.next = effect;
    effect.next = firstEffect;
    fiber.updateQueue.lastEffect = effect;
  }
  
  return effect;
}

// 执行 effect 清理
function cleanupEffect(effect: Effect): void {
  if (effect.destroy) {
    try {
      effect.destroy();
    } catch (error) {
      console.error('Error in effect cleanup:', error);
    }
  }
}

// 执行 effect
function runEffect(effect: Effect): void {
  if (effect.create) {
    try {
      const destroy = effect.create();
      if (typeof destroy === 'function') {
        effect.destroy = destroy;
      }
    } catch (error) {
      console.error('Error in effect callback:', error);
    }
  }
}

// 提交效果队列
export function commitPassiveHookEffects(fiber: Fiber): void {
  const updateQueue = fiber.updateQueue;
  if (!updateQueue || !updateQueue.lastEffect) return;
  
  const firstEffect = updateQueue.lastEffect.next;
  let effect = firstEffect;
  
  do {
    if ((effect.tag & HookPassive) !== 0) {
      // 执行清理
      if ((effect.tag & HookHasEffect) !== 0) {
        cleanupEffect(effect);
        // 执行新的 effect
        runEffect(effect);
      }
    }
    effect = effect.next;
  } while (effect !== firstEffect);
}

// 提交布局效果队列
export function commitHookEffects(fiber: Fiber): void {
  const updateQueue = fiber.updateQueue;
  if (!updateQueue || !updateQueue.lastEffect) return;
  
  const firstEffect = updateQueue.lastEffect.next;
  let effect = firstEffect;
  
  do {
    if ((effect.tag & HookLayout) !== 0) {
      // 执行清理
      if ((effect.tag & HookHasEffect) !== 0) {
        cleanupEffect(effect);
        // 执行新的 effect
        runEffect(effect);
      }
    }
    effect = effect.next;
  } while (effect !== firstEffect);
}

// 调度更新（将在调度系统中实现）
let scheduleUpdate: () => void = () => {};

// 设置调度更新函数
export function setScheduleUpdate(fn: () => void): void {
  scheduleUpdate = fn;
}
