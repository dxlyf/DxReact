// ============================================================
// Mini React Core
// createElement + Concurrent Hooks
// 支持: useState / useEffect / useRef / useMemo / useCallback /
//       useTransition / useDeferredValue / Suspense
// ============================================================

// ---- Fiber Tags ----
export const HostRoot = 0
export const HostComponent = 1
export const FunctionComponent = 2
export const Fragment = 'FRAGMENT'
export const HostText = 4
export const SuspenseComponent = 5

export type FiberTag = number | typeof Fragment

// ---- Effect Flags ----
export const NoFlags = 0b00000000
export const Placement = 0b00000001
export const Update = 0b00000010
export const Deletion = 0b00000100
export const Passive = 0b00001000
export const LayoutEffect = 0b00010000
export const Ref = 0b00100000

export type Flags = number

// ---- Lane 系统 ----
import type { Lane } from './scheduler.ts'
import {
  SyncLane, DefaultLane, TransitionLane1,
  getHighestPriorityLane, lanesToPriority,
  scheduleCallback, shouldYieldToHost, getCurrentTime
} from './scheduler.ts'

// ---- 类型定义 ----
interface HookQueue {
  pending: Update | null
  dispatch: ((action: any) => void) | null
  lastRenderedReducer: (state: any, action: any) => any
  lastRenderedState: any
}

interface Update {
  action: any
  next: Update | null
  lane: Lane
}

interface Hook {
  memoizedState: any
  baseState: any
  baseQueue: Update | null
  queue: HookQueue | null
  next: Hook | null
}

interface EffectState {
  create: () => (() => void) | void
  deps: any[] | null
  destroy?: (() => void) | void
}

interface FiberRoot {
  containerInfo: HTMLElement
  current: Fiber
  finishedWork: Fiber | null
}

export interface Fiber {
  tag: FiberTag
  key: string | null
  type: any
  stateNode: any
  ref: any
  return: Fiber | null
  sibling: Fiber | null
  child: Fiber | null
  index: number
  pendingProps: any
  memoizedProps: any
  memoizedState: Hook | null
  updateQueue: any
  flags: Flags
  subtreeFlags: Flags
  deletions: Fiber[] | null
  lanes: Lane
  childLanes: Lane
  alternate: Fiber | null
  fallback: any
  dehydrated: any
}

interface Element {
  $$typeof: symbol
  type: any
  key: string | null
  ref: any
  props: Record<string, any>
}

// ---- 全局状态 ----
let nextUnitOfWork: Fiber | null = null
let workInProgressRoot: FiberRoot | null = null
let workInProgress: Fiber | null = null
let rootContainer: HTMLElement | null = null
let rootElement: Element | any[] | null = null

// hooks 状态
let currentlyRenderingFiber: Fiber | null = null
let workInProgressHook: Hook | null = null
let currentHookNode: Hook | null = null
let hookIndex = 0

// effects
let pendingEffects: Fiber[] = []
let pendingLayoutEffects: Fiber[] = []

// Suspense 状态
let suspenseStack: any[] = []

// ============================================================
// createElement (JSX factory)
// ============================================================
function createElement(type: any, config: Record<string, any> | null, ...children: any[]): Element {
  let key: string | null = null
  let ref: any = null
  const props: Record<string, any> = {}
  if (config) {
    for (const name in config) {
      if (name === 'key') {
        key = '' + config[name]
      } else if (name === 'ref') {
        ref = config[name]
      } else {
        props[name] = config[name]
      }
    }
  }
  if (children.length === 1) {
    props.children = children[0]
  } else if (children.length > 1) {
    props.children = children
  }
  return { $$typeof: Symbol.for('react.element'), type, key, ref, props }
}

// ============================================================
// Fiber 创建
// ============================================================
function createFiber(tag: FiberTag, pendingProps: any, key: string | null): Fiber {
  return {
    tag, key: key || null, type: null, stateNode: null, ref: null,
    return: null, sibling: null, child: null, index: 0,
    pendingProps,
    memoizedProps: null, memoizedState: null, updateQueue: null,
    flags: NoFlags,
    subtreeFlags: NoFlags,
    deletions: null,
    lanes: NoLanes,
    childLanes: NoLanes,
    alternate: null,
    // Suspense
    fallback: null,
    dehydrated: null,
  }
}

function createWorkInProgress(current: Fiber, pendingProps: any): Fiber {
  let wip: Fiber = current.alternate!
  if (wip === null) {
    wip = createFiber(current.tag, pendingProps, current.key)
    wip.type = current.type
    wip.stateNode = current.stateNode
    wip.alternate = current
    current.alternate = wip
  } else {
    wip.pendingProps = pendingProps
    wip.flags = NoFlags
    wip.subtreeFlags = NoFlags
    wip.deletions = null
  }
  wip.child = null; wip.sibling = null; wip.index = 0
  wip.memoizedProps = current.memoizedProps
  wip.memoizedState = current.memoizedState
  wip.updateQueue = current.updateQueue
  wip.lanes = current.lanes
  wip.childLanes = current.childLanes
  return wip
}

// ============================================================
// Hooks 系统
// ============================================================
function createHook(): Hook {
  return { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null }
}

function mountWorkInProgressHook(): Hook {
  const hook = createHook()
  if (workInProgressHook === null) {
    currentlyRenderingFiber!.memoizedState = hook
  } else {
    workInProgressHook.next = hook
  }
  workInProgressHook = hook
  hookIndex++
  return hook
}

function updateWorkInProgressHook(): Hook {
  if (currentHookNode === null) {
    currentHookNode = currentlyRenderingFiber!.alternate!.memoizedState
  } else {
    currentHookNode = currentHookNode.next
  }
  const newHook = createHook()
  newHook.memoizedState = currentHookNode!.memoizedState
  newHook.queue = currentHookNode!.queue
  newHook.baseState = currentHookNode!.baseState
  newHook.baseQueue = currentHookNode!.baseQueue
  if (workInProgressHook === null) {
    currentlyRenderingFiber!.memoizedState = newHook
  } else {
    workInProgressHook.next = newHook
  }
  workInProgressHook = newHook
  hookIndex++
  return newHook
}

// ---- useState ----
function useState<S>(initialState: S | (() => S)): [S, (action: any) => void] {
  const isMount = !currentlyRenderingFiber!.alternate
  const hook = isMount ? mountWorkInProgressHook() : updateWorkInProgressHook()

  if (isMount) {
    if (typeof initialState === 'function') initialState = (initialState as () => S)()
    hook.memoizedState = initialState
    hook.baseState = initialState
    hook.queue = {
      pending: null,
      dispatch: null,
      lastRenderedReducer: basicStateReducer,
      lastRenderedState: initialState,
    }
  }

  const queue = hook.queue!
  if (queue.pending) {
    const first = queue.pending
    const last = first.next!
    first.next = null
    queue.pending = null

    let newState = hook.baseState
    let update: Update | null = first
    while (update) {
      newState = basicStateReducer(newState, update.action)
      update = update.next
    }
    hook.memoizedState = newState
    hook.baseState = newState
    hook.baseQueue = null
    queue.lastRenderedState = newState
  }

  const dispatch = queue.dispatch || (queue.dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue))
  return [hook.memoizedState, dispatch]
}

function basicStateReducer(state: any, action: any): any {
  return typeof action === 'function' ? action(state) : action
}

function dispatchSetState(fiber: Fiber, queue: HookQueue, action: any): void {
  const update: Update = { action, next: null, lane: fiber.lanes || SyncLane }
  const pending = queue.pending
  if (pending === null) {
    update.next = update
  } else {
    update.next = pending.next
    pending.next = update
  }
  queue.pending = update

  // 向上找到 root
  let node: Fiber | null = fiber
  let root: FiberRoot | null = null
  while (node) {
    if (node.tag === HostRoot) {
      root = node.stateNode as FiberRoot
      break
    }
    node = node.return
  }
  if (root) scheduleUpdateOnFiber(root)
}

// ---- useEffect ----
function useEffect(create: () => (() => void) | void, deps?: any[]): void {
  const hook = !currentlyRenderingFiber!.alternate
    ? mountWorkInProgressHook()
    : updateWorkInProgressHook()

  const nextDeps = deps === undefined ? null : deps
  const prevDeps = hook.memoizedState ? (hook.memoizedState as EffectState).deps : null

  if (prevDeps !== null && nextDeps !== null) {
    if (depsUnchanged(prevDeps, nextDeps)) return
  }

  hook.memoizedState = { create, deps: nextDeps } as EffectState
  currentlyRenderingFiber!.flags |= Passive
}

// ---- useLayoutEffect (同步 effect) ----
function useLayoutEffect(create: () => (() => void) | void, deps?: any[]): void {
  const hook = !currentlyRenderingFiber!.alternate
    ? mountWorkInProgressHook()
    : updateWorkInProgressHook()

  const nextDeps = deps === undefined ? null : deps
  const prevDeps = hook.memoizedState ? (hook.memoizedState as EffectState).deps : null

  if (prevDeps !== null && nextDeps !== null) {
    if (depsUnchanged(prevDeps, nextDeps)) return
  }

  hook.memoizedState = { create, deps: nextDeps } as EffectState
  currentlyRenderingFiber!.flags |= LayoutEffect
}

// ---- useRef ----
function useRef<T>(initialValue: T): { current: T } {
  const isMount = !currentlyRenderingFiber!.alternate
  const hook = isMount ? mountWorkInProgressHook() : updateWorkInProgressHook()

  if (isMount) {
    hook.memoizedState = { current: initialValue }
  }
  return hook.memoizedState!
}

// ---- useMemo ----
function useMemo<T>(nextCreate: () => T, deps?: any[]): T {
  const isMount = !currentlyRenderingFiber!.alternate
  const hook = isMount ? mountWorkInProgressHook() : updateWorkInProgressHook()

  const nextDeps = deps === undefined ? null : deps

  if (isMount) {
    const value = nextCreate()
    hook.memoizedState = [value, nextDeps]
    return value
  }

  const [prevValue, prevDeps]: [T, any[] | null] = hook.memoizedState
  if (prevDeps !== null && nextDeps !== null && depsUnchanged(prevDeps, nextDeps)) {
    return prevValue
  }

  const nextValue = nextCreate()
  hook.memoizedState = [nextValue, nextDeps]
  return nextValue
}

// ---- useCallback ----
function useCallback<T extends (...args: any[]) => any>(callback: T, deps?: any[]): T {
  const isMount = !currentlyRenderingFiber!.alternate
  const hook = isMount ? mountWorkInProgressHook() : updateWorkInProgressHook()

  const nextDeps = deps === undefined ? null : deps

  if (isMount) {
    hook.memoizedState = [callback, nextDeps]
    return callback
  }

  const [prevCallback, prevDeps]: [T, any[] | null] = hook.memoizedState
  if (prevDeps !== null && nextDeps !== null && depsUnchanged(prevDeps, nextDeps)) {
    return prevCallback
  }

  hook.memoizedState = [callback, nextDeps]
  return callback
}

// ---- useTransition (React 18 核心并发特性) ----
function useTransition(): [boolean, (callback: () => void) => void] {
  const isMount = !currentlyRenderingFiber!.alternate
  const hook = isMount ? mountWorkInProgressHook() : updateWorkInProgressHook()
  // 在 hook 执行时捕获 fiber（渲染上下文中），而非 callback 执行时
  const fiber = currentlyRenderingFiber!

  if (isMount) {
    hook.memoizedState = false  // isPending
  }

  const startTransition = (callback: () => void) => {
    // 标记为 pending 状态
    hook.memoizedState = true

    // 向上找 root 用于触发重渲染（显示 pending 状态）
    let node: Fiber | null = fiber
    let root: FiberRoot | null = null
    while (node) {
      if (node.tag === HostRoot) { root = node.stateNode; break }
      node = node.return
    }
    // 触发一次渲染以显示 pending 状态
    if (root) scheduleUpdateOnFiber(root)

    // 使用 Transition lane 执行回调，将内部的 setState 标记为低优先级
    const prevLanes = fiber.lanes
    fiber.lanes = TransitionLane1
    try {
      callback()
    } finally {
      fiber.lanes = prevLanes
    }
  }

  return [hook.memoizedState, startTransition]
}

// ---- useDeferredValue (React 18 核心并发特性) ----
function useDeferredValue<T>(value: T): T {
  const isMount = !currentlyRenderingFiber!.alternate
  const hook = isMount ? mountWorkInProgressHook() : updateWorkInProgressHook()

  if (isMount) {
    hook.memoizedState = value
    return value
  }

  const prevValue = hook.memoizedState
  if (value === prevValue) return prevValue

  // 延迟更新：返回旧值，同时调度一个新值更新
  const fiber = currentlyRenderingFiber!
  let node: Fiber | null = fiber
  let root: FiberRoot | null = null
  while (node) {
    if (node.tag === HostRoot) { root = node.stateNode; break }
    node = node.return
  }

  // 使用 Transition lane 调度延迟更新
  scheduleCallback(lanesToPriority(TransitionLane1), () => {
    hook.memoizedState = value
    if (root) scheduleUpdateOnFiber(root)
  })

  return prevValue
}

// ---- Suspense ----
function Suspense({ children, fallback }: { children: any; fallback?: any }): any {
  const [suspended] = useState(false)

  if (suspended) {
    return fallback || null
  }

  return children
}

// ============================================================
// 工具函数
// ============================================================
function depsUnchanged(prevDeps: any[], nextDeps: any[]): boolean {
  if (prevDeps.length !== nextDeps.length) return false
  for (let i = 0; i < prevDeps.length; i++) {
    if (!Object.is(prevDeps[i], nextDeps[i])) return false
  }
  return true
}

// ============================================================
// Reconciler
// ============================================================

function reconcileChildren(returnFiber: Fiber, currentFirstChild: Fiber | null, newChild: any, lanes?: any): Fiber | null {
  // 非数组路径：单个子节点
  if (typeof newChild === 'object' && newChild !== null) {
    switch (newChild.$$typeof) {
      case Symbol.for('react.element'):
        return placeSingleChild(
          reconcileSingleElement(returnFiber, currentFirstChild, newChild, lanes)
        )
    }

    if (Array.isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstChild, newChild, lanes)
    }
  }

  // 文本节点
  if (typeof newChild === 'string' || typeof newChild === 'number') {
    return placeSingleChild(
      reconcileSingleTextNode(returnFiber, currentFirstChild, '' + newChild, lanes)
    )
  }

  // null/undefined/boolean → 清除所有旧子节点
  return deleteRemainingChildren(returnFiber, currentFirstChild)
}

// ---- reconcileSingleElement ----
function reconcileSingleElement(returnFiber: Fiber, currentFirstChild: Fiber | null, element: Element, lanes?: any): Fiber {
  const key = element.key
  let child: Fiber | null = currentFirstChild
  while (child !== null) {
    if (child.key === key) {
      if (child.type === element.type) {
        deleteRemainingChildren(returnFiber, child.sibling)
        const existing = useFiber(child, element.props, key)
        existing.return = returnFiber
        return existing
      } else {
        deleteRemainingChildren(returnFiber, child)
        break
      }
    } else {
      deleteChild(returnFiber, child)
    }
    child = child.sibling
  }

  const created = createFiberFromElement(element, key)
  created.return = returnFiber
  return created
}

// ---- reconcileSingleTextNode ----
function reconcileSingleTextNode(returnFiber: Fiber, currentFirstChild: Fiber | null, textContent: string, lanes?: any): Fiber {
  let child: Fiber | null = currentFirstChild
  while (child !== null) {
    if (child.tag === HostText) {
      deleteRemainingChildren(returnFiber, child.sibling)
      const existing = useFiber(child, textContent, null)
      existing.return = returnFiber
      return existing
    }
    deleteChild(returnFiber, child)
    child = child.sibling
  }
  const created = createFiber(HostText, textContent, null)
  created.return = returnFiber
  return created
}

// ---- reconcileChildrenArray ----
function reconcileChildrenArray(returnFiber: Fiber, currentFirstChild: Fiber | null, newChildren: any[], lanes?: any): Fiber | null {
  let resultingFirstChild: Fiber | null = null
  let previousNewFiber: Fiber | null = null

  let oldFiber: Fiber | null = currentFirstChild
  let lastPlacedIndex = 0
  let newIdx = 0
  let nextOldFiber: Fiber | null = null

  // 第一轮：按 index 比较
  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    if (oldFiber.index > newIdx) {
      nextOldFiber = oldFiber
      oldFiber = null
    } else {
      nextOldFiber = oldFiber.sibling
    }

    const newChild = newChildren[newIdx]
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      if (oldFiber !== null && oldFiber.tag === HostText) {
        const newFiber = useFiber(oldFiber, '' + newChild, null)
        newFiber.index = newIdx
        newFiber.return = returnFiber
        if (previousNewFiber === null) resultingFirstChild = newFiber
        else previousNewFiber.sibling = newFiber
        previousNewFiber = newFiber
        oldFiber = nextOldFiber
        continue
      }
      deleteChild(returnFiber, oldFiber)
    } else if (newChild !== null && typeof newChild === 'object' && newChild.$$typeof === Symbol.for('react.element')) {
      const key = newChild.key !== null ? newChild.key : '' + newIdx

      if (oldFiber !== null && oldFiber.key === key) {
        if (oldFiber.type === newChild.type) {
          const newFiber = useFiber(oldFiber, newChild.props, key)
          newFiber.index = newIdx
          newFiber.return = returnFiber
          lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)
          if (previousNewFiber === null) resultingFirstChild = newFiber
          else previousNewFiber.sibling = newFiber
          previousNewFiber = newFiber
          oldFiber = nextOldFiber
          continue
        }
        deleteChild(returnFiber, oldFiber)
      } else if (oldFiber !== null) {
        deleteChild(returnFiber, oldFiber)
      }

      oldFiber = nextOldFiber
    } else if (newChild != null) {
      if (oldFiber !== null) {
        deleteChild(returnFiber, oldFiber)
      }
      oldFiber = nextOldFiber
    }
  }

  // 新 children 还有剩余 → 全部新建
  if (newIdx < newChildren.length) {
    for (; newIdx < newChildren.length; newIdx++) {
      const newChild = newChildren[newIdx]
      let newFiber: Fiber | null = null
      if (typeof newChild === 'string' || typeof newChild === 'number') {
        newFiber = createFiber(HostText, '' + newChild, null)
      } else if (newChild !== null && typeof newChild === 'object' && newChild.$$typeof === Symbol.for('react.element')) {
        newFiber = createFiberFromElement(newChild, newChild.key)
      }
      if (newFiber) {
        newFiber.index = newIdx
        newFiber.return = returnFiber
        newFiber.flags |= Placement
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)
        if (previousNewFiber === null) resultingFirstChild = newFiber
        else previousNewFiber.sibling = newFiber
        previousNewFiber = newFiber
      }
    }
  }

  // 旧 fiber 还有剩余 → 全部删除
  if (oldFiber !== null) {
    deleteRemainingChildren(returnFiber, oldFiber)
  }

  return resultingFirstChild
}

// ---- placeChild ----
function placeChild(newFiber: Fiber, lastPlacedIndex: number, newIndex: number): number {
  newFiber.index = newIndex
  const current = newFiber.alternate
  if (current !== null) {
    const oldIndex = current.index
    if (oldIndex < lastPlacedIndex) {
      newFiber.flags |= Placement
      return lastPlacedIndex
    } else {
      return oldIndex
    }
  } else {
    newFiber.flags |= Placement
    return lastPlacedIndex
  }
}

function placeSingleChild(newFiber: Fiber): Fiber {
  if (newFiber.alternate === null) {
    newFiber.flags |= Placement
  }
  return newFiber
}

// ---- 删除工具 ----
function deleteChild(returnFiber: Fiber, childToDelete: Fiber | null): void {
  if (childToDelete === null) return
  const deletions = returnFiber.deletions
  if (deletions === null) {
    returnFiber.deletions = [childToDelete]
  } else {
    deletions.push(childToDelete)
  }
  childToDelete.flags |= Deletion
}

function deleteRemainingChildren(returnFiber: Fiber, currentFirstChild: Fiber | null): null {
  let child = currentFirstChild
  while (child !== null) {
    deleteChild(returnFiber, child)
    child = child.sibling
  }
  return null
}

function flatten(arr: any[]): any[] {
  const result: any[] = []
  const stack: any[] = [arr]
  while (stack.length) {
    const item = stack.pop()!
    if (Array.isArray(item)) {
      stack.push(...[...item].reverse())
    } else if (item && item.type === Fragment) {
      const children = item.props.children
      if (Array.isArray(children)) stack.push(...[...children].reverse())
      else if (children != null) result.push(children)
    } else if (item != null && typeof item !== 'boolean') {
      result.push(item)
    }
  }
  return result
}

function useFiber(fiber: Fiber, pendingProps: any, key: string | null): Fiber {
  const clone = createFiber(fiber.tag, pendingProps, key)
  clone.type = fiber.type
  clone.stateNode = fiber.stateNode
  clone.alternate = fiber
  fiber.alternate = clone
  return clone
}

function createFiberFromElement(element: Element, key: string | null): Fiber {
  const type = element.type
  const props = element.props || {}
  const fiber = createFiber(
    type === Fragment ? Fragment :
    typeof type === 'function' ? FunctionComponent : HostComponent,
    props, key
  )
  fiber.type = type
  return fiber
}

// ---- beginWork ----
function beginWork(wip: Fiber): Fiber | null {
  switch (wip.tag) {
    case HostRoot:
      return reconcileChildren(wip, wip.alternate ? wip.alternate.child : null, rootElement)
    case FunctionComponent:
      return updateFunctionComponent(wip)
    case HostComponent:
      return updateHostComponent(wip)
    case Fragment:
      return reconcileChildren(wip, wip.alternate ? wip.alternate.child : null, (wip.pendingProps || {}).children)
    case HostText:
      return null
    default:
      return null
  }
}

function updateFunctionComponent(wip: Fiber): Fiber | null {
  const Component = wip.type
  const props = wip.pendingProps || {}

  // 处理 ref
  if (props.ref) {
    wip.ref = props.ref
    wip.flags |= Ref
  }

  // 准备 hooks 上下文
  currentlyRenderingFiber = wip
  workInProgressHook = null
  currentHookNode = null
  hookIndex = 0

  let children
  try {
    children = Component(props)
  } catch (err: any) {
    console.error(`[React] 组件渲染错误 (${Component.name || 'Anonymous'}):`, err)
    children = createElement('div', {
      style: { padding: '16px', background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '6px', color: '#ff4d4f', fontSize: '13px' }
    }, `Component Error: ${err.message}`)
  } finally {
    currentlyRenderingFiber = null
  }

  return reconcileChildren(wip, wip.alternate ? wip.alternate.child : null, children)
}

function updateHostComponent(wip: Fiber): Fiber | null {
  const props = wip.pendingProps || {}
  if (!wip.stateNode) {
    wip.stateNode = document.createElement(wip.type)
  }
  return reconcileChildren(wip, wip.alternate ? wip.alternate.child : null, props.children)
}

// ---- completeWork ----
function completeWork(wip: Fiber): void {
  switch (wip.tag) {
    case HostComponent:
      completeHostComponent(wip)
      break
    case HostText:
      completeHostText(wip)
      break
    case FunctionComponent:
      wip.memoizedProps = wip.pendingProps
      break
    case Fragment:
      wip.memoizedProps = wip.pendingProps
      break
  }
}

function completeHostComponent(wip: Fiber): void {
  const dom = wip.stateNode as HTMLElement
  const newProps = wip.pendingProps || {}
  const oldProps = wip.alternate ? wip.alternate.memoizedProps : null

  if (oldProps) {
    updateDOMProperties(dom, oldProps, newProps)
  } else {
    setDOMProperties(dom, newProps)
  }
  wip.memoizedProps = newProps
}

function completeHostText(wip: Fiber): void {
  if (!wip.stateNode) {
    wip.stateNode = document.createTextNode(wip.pendingProps || '')
  } else {
    const text = wip.pendingProps || ''
    if (wip.stateNode.nodeValue !== text) {
      wip.stateNode.nodeValue = text
    }
  }
  wip.memoizedProps = wip.pendingProps
}

// ============================================================
// DOM 属性处理
// ============================================================
function setDOMProperties(dom: HTMLElement, props: Record<string, any>): void {
  for (const key in props) {
    if (key === 'children' || key === 'key' || key === 'ref') continue
    if (key.startsWith('on')) {
      addEventListenerToRoot(dom, key.slice(2).toLowerCase(), props[key])
    } else if (key === 'className') {
      dom.setAttribute('class', props[key] || '')
    } else if (key === 'style' && typeof props[key] === 'object') {
      for (const sk in props[key]) (dom.style as any)[sk] = props[key][sk]
    } else if (key === 'dangerouslySetInnerHTML') {
      dom.innerHTML = props[key].__html
    } else if (key === 'htmlFor') {
      dom.setAttribute('for', props[key])
    } else if (key in dom) {
      try { (dom as any)[key] = props[key] } catch(e) { dom.setAttribute(key, props[key]) }
    } else {
      dom.setAttribute(key, props[key])
    }
  }
}

function updateDOMProperties(dom: HTMLElement, oldProps: Record<string, any>, newProps: Record<string, any>): void {
  const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)])
  allKeys.delete('children'); allKeys.delete('key'); allKeys.delete('ref')

  for (const key of allKeys) {
    if (oldProps[key] === newProps[key]) continue
    if (key.startsWith('on')) {
      addEventListenerToRoot(dom, key.slice(2).toLowerCase(), newProps[key])
    } else if (key === 'className') {
      dom.setAttribute('class', newProps[key] || '')
    } else if (key === 'style') {
      const newStyle = newProps[key] || {}
      const oldStyle = oldProps[key] || {}
      for (const sk in oldStyle) { if (!(sk in newStyle)) (dom.style as any)[sk] = '' }
      for (const sk in newStyle) { (dom.style as any)[sk] = newStyle[sk] }
    } else if (key === 'dangerouslySetInnerHTML') {
      dom.innerHTML = newProps[key].__html
    } else if (key === 'htmlFor') {
      dom.setAttribute('for', newProps[key] || '')
    } else if (key in dom) {
      try { (dom as any)[key] = newProps[key] } catch(e) {}
    } else {
      dom.setAttribute(key, newProps[key])
    }
  }
}

// ============================================================
// 事件系统（事件委托）
// ============================================================
const rootEventListeners = new Map<string, Array<{ dom: HTMLElement; handler: EventListener }>>()

function addEventListenerToRoot(dom: HTMLElement, eventType: string, handler: EventListener): void {
  if (!rootContainer) return
  const key = eventType
  if (!rootEventListeners.has(key)) {
    rootEventListeners.set(key, [])
    rootContainer.addEventListener(eventType, handleRootEvent)
  }
  rootEventListeners.get(key)!.push({ dom, handler })
}

function handleRootEvent(e: Event): void {
  const type = e.type
  const listeners = rootEventListeners.get(type)
  if (!listeners) return

  const matched: EventListener[] = []
  let el = e.target as HTMLElement | null
  while (el && el !== rootContainer!.parentNode) {
    for (const item of listeners) {
      if (item.dom === el) matched.push(item.handler)
    }
    el = el.parentNode as HTMLElement | null
  }
  for (const handler of matched.reverse()) {
    handler(e)
  }
}

// ============================================================
// Commit 阶段
// ============================================================
function commitRoot(root: FiberRoot): void {
  const finishedWork = root.current.alternate
  if (!finishedWork) return

  // 收集 effects 和 deletions
  const effectList: Fiber[] = []
  const deletionList: Fiber[] = []
  collectEffectsAndDeletions(finishedWork, effectList, deletionList)

  console.log(`[React] commitRoot: ${effectList.length} 个 Placement, ${deletionList.length} 个 Deletion`)

  // Placement
  for (const fiber of effectList) {
    if (fiber.flags & Placement) {
      commitPlacement(fiber)
      fiber.flags &= ~Placement
    }
  }

  // Deletions
  for (const fiber of deletionList) {
    commitDeletion(fiber)
  }

  // Ref 处理
  for (const fiber of effectList) {
    if (fiber.flags & Ref && fiber.ref) {
      fiber.ref.current = fiber.stateNode || getStateNode(fiber)
      fiber.flags &= ~Ref
    }
  }

  // Layout effects (同步)
  for (const fiber of pendingLayoutEffects) {
    runEffects(fiber.memoizedState)
  }
  pendingLayoutEffects = []

  // 切换 current tree
  root.current = finishedWork

  // Passive effects (异步)
  if (pendingEffects.length > 0) {
    setTimeout(() => {
      for (const fiber of pendingEffects) {
        runEffects(fiber.memoizedState)
      }
      pendingEffects = []
    }, 0)
  }
}

function runEffects(hookChain: Hook | null): void {
  let h: Hook | null = hookChain
  while (h) {
    if (h.memoizedState && h.memoizedState.create) {
      if (h.memoizedState.destroy) h.memoizedState.destroy()
      h.memoizedState.destroy = h.memoizedState.create()
    }
    h = h.next
  }
}

function collectEffectsAndDeletions(fiber: Fiber, effectList: Fiber[], deletionList: Fiber[]): void {
  if (fiber.flags & (Placement | Update | Ref)) effectList.push(fiber)
  if (fiber.flags & Deletion) deletionList.push(fiber)
  // 收集 fiber.deletions
  if (fiber.deletions !== null) {
    for (let i = 0; i < fiber.deletions.length; i++) {
      const child = fiber.deletions[i]
      commitDeletion(child)
    }
    fiber.deletions = null
  }
  let child = fiber.child
  while (child) {
    collectEffectsAndDeletions(child, effectList, deletionList)
    child = child.sibling
  }
}

function commitPlacement(fiber: Fiber): void {
  const parent = getParentDOM(fiber)
  const node = getStateNode(fiber)
  if (parent && node) parent.appendChild(node)
}

function commitDeletion(fiber: Fiber): void {
  const node = getStateNode(fiber)
  if (node && node.parentNode) node.parentNode.removeChild(node)
}

function getParentDOM(fiber: Fiber): HTMLElement | null {
  let node: Fiber | null = fiber.return
  while (node) {
    if (node.tag === HostComponent) return node.stateNode as HTMLElement
    if (node.tag === HostRoot) return rootContainer
    node = node.return
  }
  return null
}

function getStateNode(fiber: Fiber): Node | null {
  if (fiber.tag === HostComponent || fiber.tag === HostText) return fiber.stateNode as Node
  let child = fiber.child
  while (child) {
    const node = getStateNode(child)
    if (node) return node
    child = child.sibling
  }
  return null
}

// ============================================================
// 并发工作循环 (核心)
// ============================================================
function workLoopConcurrent(): boolean {
  // 在时间切片内持续执行工作单元
  while (nextUnitOfWork !== null && !shouldYieldToHost()) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
  }

  if (nextUnitOfWork === null && workInProgressRoot !== null) {
    // 所有工作完成，提交
    commitRoot(workInProgressRoot)
    workInProgressRoot = null
  }

  // 返回是否需要继续工作
  return nextUnitOfWork !== null
}

function workLoopSync(): void {
  // 同步模式下不检查 shouldYield
  let unitCount = 0
  while (nextUnitOfWork !== null) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    unitCount++
  }
  if (workInProgressRoot !== null) {
    console.log(`[React] workLoopSync 完成，处理了 ${unitCount} 个 fiber 单元，开始 commit`)
    commitRoot(workInProgressRoot)
    workInProgressRoot = null
  }
}

// 执行单个 Fiber 工作单元
function performUnitOfWork(fiber: Fiber): Fiber | null {
  // beginWork - 返回子节点
  const next = beginWork(fiber)

  if (next !== null) {
    return next
  }

  // 没有子节点，执行 completeWork 并返回兄弟节点
  let node: Fiber | null = fiber
  while (node !== null) {
    completeWork(node)

    // 收集 effects
    if (node.flags & Passive) pendingEffects.push(node)
    if (node.flags & LayoutEffect) pendingLayoutEffects.push(node)

    if (node.sibling !== null) {
      return node.sibling
    }
    node = node.return
  }
  return null
}

// ============================================================
// 调度更新
// ============================================================
function scheduleUpdateOnFiber(root: FiberRoot): void {
  if (!root || root === workInProgressRoot) return

  console.log('[React] scheduleUpdateOnFiber 开始调度更新')

  const current = root.current
  const wip = createWorkInProgress(current, current.pendingProps)
  workInProgressRoot = root
  workInProgress = wip
  nextUnitOfWork = wip

  // 使用并发调度
  const priority = SyncLane
  scheduleCallback(lanesToPriority(priority), (didTimeout: boolean) => {
    if (didTimeout) {
      workLoopSync()
      return null
    }
    const hasMore = workLoopConcurrent()
    if (hasMore) {
      return workLoopConcurrent as any
    }
    return null
  })
}

// ============================================================
// render 入口（导出）
// ============================================================
function render(element: Element, container: HTMLElement): void {
  console.log('[React] render 入口调用，container:', container.tagName, 'element:', element.type?.name || element.type || 'element')

  rootContainer = container
  rootElement = element

  const fiberRoot: FiberRoot = {
    containerInfo: container,
    current: null!,
    finishedWork: null,
  }

  const uninitializedFiber = createFiber(HostRoot, null, null)
  uninitializedFiber.stateNode = fiberRoot
  fiberRoot.current = uninitializedFiber

  scheduleUpdateOnFiber(fiberRoot)
}

// ============================================================
// 导出
// ============================================================
export {
  scheduleUpdateOnFiber,
  createElement,
  render,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useTransition,
  useDeferredValue,
  Suspense
}
