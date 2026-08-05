// ============================================================
// Hooks 系统（对齐 ReactFiberHooks.js 的核心实现，精简版）
//   支持：useState / useReducer / useEffect / useLayoutEffect /
//         useRef / useMemo / useCallback / useContext / useId /
//         useTransition / startTransition
//   mount/update 通过 current 链按序复用，违反调用规则时抛错
// ============================================================
import {
  HookHasEffect,
  HookLayout,
  HookPassive,
  Passive,
  Update,
  REACT_CONTEXT_TYPE,
  REACT_PROVIDER_TYPE,
} from './types'
import type { ContextDependency, EffectState, Fiber, Hook, Update as UpdateType, UpdateQueue, ReactContext } from './types'
import { DefaultLane, TransitionLane1 } from '../scheduler'
import { scheduleUpdateOnFiber } from './reconciler'

// ---------- 渲染中全局状态 ----------
let currentlyRenderingFiber: Fiber | null = null
let workInProgressHook: Hook | null = null
let currentHook: Hook | null = null
let isMount = false

// ---------- 内部引用（供 reconciler 注入）----------
export function renderWithHooks(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (props: any) => any,
  props: any,
): any {
  currentlyRenderingFiber = workInProgress
  workInProgress.memoizedState = null
  workInProgress.updateQueue = null
  workInProgress.dependencies = null
  workInProgressHook = null
  currentHook = current !== null ? current.memoizedState : null
  isMount = current === null

  let children: any
  try {
    children = Component(props)
  } catch (e) {
    // 抛给 workLoop 的 throw 处理链路（Suspense / Error Boundary）
    throw e
  }

  // Hook 调用规则校验：渲染结束后 current 链还有剩余 → 少了 hook
  if (currentHook !== null) {
    throw new Error(
      'Rendered fewer hooks than expected. This may be caused by an accidental early return statement.',
    )
  }
  return children
}

export function isRendering(): boolean {
  return currentlyRenderingFiber !== null
}

// ---------- Hook 链管理 ----------
function createHook(): Hook {
  return { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null }
}

/** 获取（挂载或更新）当前渲染位置的 hook */
function getHook(): Hook {
  if (workInProgressHook === null) {
    if (isMount) {
      const hook = createHook()
      currentlyRenderingFiber!.memoizedState = hook
      workInProgressHook = hook
    } else {
      if (currentHook === null) {
        throw new Error('Rendered more hooks than during the previous render.')
      }
      const hook = createHook()
      hook.memoizedState = currentHook.memoizedState
      hook.baseState = currentHook.baseState
      hook.baseQueue = currentHook.baseQueue
      hook.queue = currentHook.queue
      currentlyRenderingFiber!.memoizedState = hook
      workInProgressHook = hook
      currentHook = currentHook.next
    }
  } else {
    if (isMount) {
      const hook = createHook()
      workInProgressHook.next = hook
      workInProgressHook = hook
    } else {
      if (currentHook === null) {
        throw new Error('Rendered more hooks than during the previous render.')
      }
      const hook = createHook()
      hook.memoizedState = currentHook.memoizedState
      hook.baseState = currentHook.baseState
      hook.baseQueue = currentHook.baseQueue
      hook.queue = currentHook.queue
      workInProgressHook.next = hook
      workInProgressHook = hook
      currentHook = currentHook.next
    }
  }
  return workInProgressHook
}

// ---------- useState / useReducer ----------
function basicStateReducer(state: any, action: any): any {
  return typeof action === 'function' ? action(state) : action
}

export function useReducer<S>(
  reducer: (state: S, action: any) => S,
  initialArg: S,
  init?: (arg: S) => S,
): [S, (action: any) => void] {
  const hook = getHook()
  const queue: UpdateQueue<S> = hook.queue ?? {
    pending: null,
    dispatch: null,
    lastRenderedReducer: reducer,
    lastRenderedState: initialArg,
  }

  if (isMount) {
    let initialState: S
    if (init !== undefined) {
      initialState = init(initialArg)
    } else {
      initialState = initialArg
    }
    hook.memoizedState = initialState
    hook.baseState = initialState
    queue.lastRenderedReducer = reducer
    queue.lastRenderedState = initialState
  } else {
    queue.lastRenderedReducer = reducer
    const pending = queue.pending
    if (pending !== null) {
      // 处理 update 环形链表
      const first: UpdateType = pending.next!
      pending.next = null
      queue.pending = null
      let newState: S = hook.baseState
      let update: UpdateType | null = first
      while (update !== null) {
        const action = update.action
        newState = reducer(newState, action)
        update = update.next
      }
      hook.memoizedState = newState
      hook.baseState = newState
      hook.baseQueue = null
      queue.lastRenderedState = newState
    }
  }
  hook.queue = queue
  // dispatch 必须用 bind 在创建时刻捕获 fiber 与 queue（对齐 React：
  // queue.dispatch = dispatchAction.bind(null, currentlyRenderingFiber, queue)）。
  // 若写成箭头函数闭包读全局 currentlyRenderingFiber，则闭包执行时会拿到
  // 其它组件/root 的 fiber（全局变量残留），导致 setState 调度到错误的 root
  const dispatch: (action: any) => void =
    queue.dispatch ?? (queue.dispatch = dispatchAction.bind(null, currentlyRenderingFiber, queue))
  return [hook.memoizedState, dispatch]
}

export function useState<S>(initialState: S | (() => S)): [S, (action: S | ((prev: S) => S)) => void] {
  // 委托 useReducer：basicStateReducer 支持函数式更新；init 实现惰性初始化
  return useReducer(basicStateReducer, undefined as any, () => {
    return typeof initialState === 'function' ? (initialState as () => S)() : initialState
  })
}

/** 派发更新：入队 + 向上调度（自动批处理由 scheduleUpdateOnFiber 合并 lanes 实现） */
function dispatchAction(
  fiber: Fiber,
  queue: UpdateQueue<any>,
  action: any,
): void {
  const lane = isTransitionActive ? TransitionLane1 : DefaultLane
  const update: UpdateType = { action, next: null, lane }
  const pending = queue.pending
  if (pending === null) {
    update.next = update // 环形链表
  } else {
    update.next = pending.next
    pending.next = update
  }
  queue.pending = update
  scheduleUpdateOnFiber(fiber, lane)
}

// ---------- useEffect / useLayoutEffect ----------
function depsEqual(prevDeps: Array<any>, nextDeps: Array<any>): boolean {
  if (prevDeps.length !== nextDeps.length) return false
  for (let i = 0; i < prevDeps.length; i++) {
    if (prevDeps[i] !== nextDeps[i]) return false
  }
  return true
}

/** 把 effect 追加到 fiber 的 effect 链表（环形，fiber.updateQueue 指向最后一个） */
function pushEffect(tag: number, create: () => (() => void) | void, destroy: (() => void) | void, deps: Array<any> | null): EffectState {
  const effect: EffectState = { tag, create, destroy, deps, next: null }
  const updateQueue = currentlyRenderingFiber!.updateQueue as EffectState | null
  if (updateQueue === null) {
    effect.next = effect
    currentlyRenderingFiber!.updateQueue = effect
  } else {
    effect.next = updateQueue.next
    updateQueue.next = effect
    currentlyRenderingFiber!.updateQueue = effect
  }
  return effect
}

function mountEffectImpl(fiberFlags: number, hookFlags: number, create: () => (() => void) | void, deps: Array<any> | null): void {
  const hook = getHook()
  // 挂载时总是执行
  currentlyRenderingFiber!.flags |= fiberFlags
  hook.memoizedState = pushEffect(hookFlags | HookHasEffect, create, undefined, deps)
}

function updateEffectImpl(
  fiberFlags: number,
  hookFlags: number,
  create: () => (() => void) | void,
  deps: Array<any> | null,
): void {
  const hook = getHook()
  const nextDeps = deps === undefined ? null : deps
  const prevEffect = hook.memoizedState as EffectState | null
  if (prevEffect !== null) {
    const prevDeps = prevEffect.deps
    if (nextDeps !== null && prevDeps !== null && depsEqual(prevDeps, nextDeps)) {
      // 依赖未变，仅保留 effect 但不标记执行
      pushEffect(hookFlags, create, prevEffect.destroy, nextDeps)
      return
    }
    // 依赖变化：执行新 effect
    currentlyRenderingFiber!.flags |= fiberFlags
    hook.memoizedState = pushEffect(hookFlags | HookHasEffect, create, prevEffect.destroy, nextDeps)
  } else {
    currentlyRenderingFiber!.flags |= fiberFlags
    hook.memoizedState = pushEffect(hookFlags | HookHasEffect, create, undefined, nextDeps)
  }
}

export function useEffect(create: () => (() => void) | void, deps?: Array<any>): void {
  if (isMount) {
    mountEffectImpl(Passive, HookPassive, create, deps ?? null)
  } else {
    updateEffectImpl(Passive, HookPassive, create, deps ?? null)
  }
}

export function useLayoutEffect(create: () => (() => void) | void, deps?: Array<any>): void {
  if (isMount) {
    mountEffectImpl(Update, HookLayout, create, deps ?? null)
  } else {
    updateEffectImpl(Update, HookLayout, create, deps ?? null)
  }
}

// ---------- useRef ----------
export function useRef<T>(initialValue: T): { current: T } {
  const hook = getHook()
  if (isMount) {
    hook.memoizedState = { current: initialValue }
  }
  return hook.memoizedState
}

// ---------- useMemo / useCallback ----------
export function useMemo<T>(nextCreate: () => T, deps?: Array<any>): T {
  const hook = getHook()
  const nextDeps = deps === undefined ? null : deps
  if (!isMount) {
    const prevState = hook.memoizedState
    if (prevState !== null) {
      const prevDeps = prevState[1]
      if (nextDeps !== null && prevDeps !== null && depsEqual(prevDeps, nextDeps)) {
        return prevState[0]
      }
    }
  }
  const nextValue = nextCreate()
  hook.memoizedState = [nextValue, nextDeps]
  return nextValue
}

export function useCallback<T extends (...args: any[]) => any>(callback: T, deps?: Array<any>): T {
  return useMemo(() => callback, deps) as T
}

// ---------- useContext ----------
export function useContext<T>(context: ReactContext<T>): T {
  const hook = getHook()
  hook.memoizedState = context._currentValue
  // 记录依赖，Provider 更新时据此判定是否需要重渲染
  const dep: ContextDependency = { context, next: null }
  const fiber = currentlyRenderingFiber!
  const prevDeps = fiber.dependencies
  if (prevDeps === null) {
    fiber.dependencies = dep
  } else {
    // 追加到链尾（简化为覆盖，保证收集到）
    let last = prevDeps
    while (last.next !== null) last = last.next
    last.next = dep
  }
  return context._currentValue
}

// ---------- useId ----------
let globalIdCounter = 0
export function useId(): string {
  const hook = getHook()
  if (isMount) {
    hook.memoizedState = ':r' + ++globalIdCounter + ':'
  }
  return hook.memoizedState
}

// ---------- Transition ----------
let isTransitionActive = false

export function startTransition(callback: () => void): void {
  const prev = isTransitionActive
  isTransitionActive = true
  try {
    callback()
  } finally {
    isTransitionActive = prev
  }
}

export function useTransition(): [boolean, (callback: () => void) => void] {
  const [isPending, setPending] = useState(false)
  const start = (callback: () => void): void => {
    setPending(true)
    startTransition(() => {
      try {
        callback()
      } finally {
        setPending(false)
      }
    })
  }
  return [isPending, start]
}

// ---------- Context 创建 ----------
export function createContext<T>(defaultValue: T): ReactContext<T> {
  const context: ReactContext<T> = {
    $$typeof: REACT_CONTEXT_TYPE,
    _currentValue: defaultValue,
    Provider: null as any,
  }
  context.Provider = {
    $$typeof: REACT_PROVIDER_TYPE,
    _context: context,
  }
  return context
}

// ---------- 导出 ----------
export const Hooks = {
  useState,
  useReducer,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
  useContext,
  useId,
  useTransition,
  startTransition,
  createContext,
}
