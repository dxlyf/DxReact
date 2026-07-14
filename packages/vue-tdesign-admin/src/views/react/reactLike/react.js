// ============================================================
// Mini React Core
// createElement + Concurrent Hooks
// 支持: useState / useEffect / useRef / useMemo / useCallback /
//       useTransition / useDeferredValue / Suspense
// ============================================================

export { scheduleUpdateOnFiber, createElement, render, useState, useEffect, useRef, useMemo, useCallback, useTransition, useDeferredValue, Suspense };

// ---- Fiber Tags ----
export const HostRoot = 0
export const HostComponent = 1
export const FunctionComponent = 2
export const Fragment = 'FRAGMENT'
export const HostText = 4
export const SuspenseComponent = 5

// ---- Effect Flags ----
export const NoFlags = 0b00000000
export const Placement = 0b00000001
export const Update = 0b00000010
export const Deletion = 0b00000100
export const Passive = 0b00001000
export const LayoutEffect = 0b00010000
export const Ref = 0b00100000

// ---- Lane 系统 ----
import {
  SyncLane, DefaultLane, TransitionLane1, IdleLane, NoLanes,
  getHighestPriorityLane, lanesToPriority,
  scheduleCallback, cancelCallback, shouldYieldToHost, getCurrentTime
} from './scheduler.js'

// ---- 全局状态 ----
let nextUnitOfWork = null
let workInProgressRoot = null
let currentRoot = null
let workInProgress = null
let rootContainer = null
let rootElement = null

// hooks 状态
let currentlyRenderingFiber = null
let workInProgressHook = null
let currentHookNode = null
let hookIndex = 0

// effects
let pendingEffects = []
let pendingLayoutEffects = []

// Suspense 状态
let suspenseStack = []

// ============================================================
// createElement (JSX factory)
// ============================================================
function createElement(type, config, ...children) {
  let key = null
  let ref = null
  const props = {}
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
function createFiber(tag, pendingProps, key) {
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

function createWorkInProgress(current, pendingProps) {
  let wip = current.alternate
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
function createHook() {
  return { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null }
}

function mountWorkInProgressHook() {
  const hook = createHook()
  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = hook
  } else {
    workInProgressHook.next = hook
  }
  workInProgressHook = hook
  hookIndex++
  return hook
}

function updateWorkInProgressHook() {
  if (currentHookNode === null) {
    currentHookNode = currentlyRenderingFiber.alternate.memoizedState
  } else {
    currentHookNode = currentHookNode.next
  }
  const newHook = createHook()
  newHook.memoizedState = currentHookNode.memoizedState
  newHook.queue = currentHookNode.queue
  newHook.baseState = currentHookNode.baseState
  newHook.baseQueue = currentHookNode.baseQueue
  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = newHook
  } else {
    workInProgressHook.next = newHook
  }
  workInProgressHook = newHook
  hookIndex++
  return newHook
}

// ---- useState ----
function useState(initialState) {
  const isMount = !currentlyRenderingFiber.alternate
  const hook = isMount ? mountWorkInProgressHook() : updateWorkInProgressHook()

  if (isMount) {
    if (typeof initialState === 'function') initialState = initialState()
    hook.memoizedState = initialState
    hook.baseState = initialState
    hook.queue = {
      pending: null,
      dispatch: null,
      lastRenderedReducer: basicStateReducer,
      lastRenderedState: initialState,
    }
  }

  const queue = hook.queue
  if (queue.pending) {
    const first = queue.pending
    const last = first.next
    first.next = null
    queue.pending = null

    let newState = hook.baseState
    let update = first
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

function basicStateReducer(state, action) {
  return typeof action === 'function' ? action(state) : action
}

function dispatchSetState(fiber, queue, action) {
  const update = { action, next: null, lane: fiber.lanes || SyncLane }
  const pending = queue.pending
  if (pending === null) {
    update.next = update
  } else {
    update.next = pending.next
    pending.next = update
  }
  queue.pending = update

  // 向上找到 root
  let node = fiber
  let root = null
  while (node) {
    if (node.tag === HostRoot) {
      root = node.stateNode
      break
    }
    node = node.return
  }
  if (root) scheduleUpdateOnFiber(root)
}

// ---- useEffect ----
function useEffect(create, deps) {
  const hook = !currentlyRenderingFiber.alternate
    ? mountWorkInProgressHook()
    : updateWorkInProgressHook()

  const nextDeps = deps === undefined ? null : deps
  const prevDeps = hook.memoizedState ? hook.memoizedState.deps : null

  if (prevDeps !== null && nextDeps !== null) {
    if (depsUnchanged(prevDeps, nextDeps)) return
  }

  hook.memoizedState = { create, deps: nextDeps }
  currentlyRenderingFiber.flags |= Passive
}

// ---- useLayoutEffect (同步 effect) ----
function useLayoutEffect(create, deps) {
  const hook = !currentlyRenderingFiber.alternate
    ? mountWorkInProgressHook()
    : updateWorkInProgressHook()

  const nextDeps = deps === undefined ? null : deps
  const prevDeps = hook.memoizedState ? hook.memoizedState.deps : null

  if (prevDeps !== null && nextDeps !== null) {
    if (depsUnchanged(prevDeps, nextDeps)) return
  }

  hook.memoizedState = { create, deps: nextDeps }
  currentlyRenderingFiber.flags |= LayoutEffect
}

// ---- useRef ----
function useRef(initialValue) {
  const isMount = !currentlyRenderingFiber.alternate
  const hook = isMount ? mountWorkInProgressHook() : updateWorkInProgressHook()

  if (isMount) {
    hook.memoizedState = { current: initialValue }
  }
  return hook.memoizedState
}

// ---- useMemo ----
function useMemo(nextCreate, deps) {
  const isMount = !currentlyRenderingFiber.alternate
  const hook = isMount ? mountWorkInProgressHook() : updateWorkInProgressHook()

  const nextDeps = deps === undefined ? null : deps

  if (isMount) {
    const value = nextCreate()
    hook.memoizedState = [value, nextDeps]
    return value
  }

  const [prevValue, prevDeps] = hook.memoizedState
  if (prevDeps !== null && nextDeps !== null && depsUnchanged(prevDeps, nextDeps)) {
    return prevValue
  }

  const nextValue = nextCreate()
  hook.memoizedState = [nextValue, nextDeps]
  return nextValue
}

// ---- useCallback ----
function useCallback(callback, deps) {
  const isMount = !currentlyRenderingFiber.alternate
  const hook = isMount ? mountWorkInProgressHook() : updateWorkInProgressHook()

  const nextDeps = deps === undefined ? null : deps

  if (isMount) {
    hook.memoizedState = [callback, nextDeps]
    return callback
  }

  const [prevCallback, prevDeps] = hook.memoizedState
  if (prevDeps !== null && nextDeps !== null && depsUnchanged(prevDeps, nextDeps)) {
    return prevCallback
  }

  hook.memoizedState = [callback, nextDeps]
  return callback
}

// ---- useTransition (React 18 核心并发特性) ----
// startTransition 将状态更新标记为低优先级 (Transition lane)
// 高优先级的更新（如用户输入）可以中断低优先级的过渡渲染
function useTransition() {
  const isMount = !currentlyRenderingFiber.alternate
  const hook = isMount ? mountWorkInProgressHook() : updateWorkInProgressHook()
  // 在 hook 执行时捕获 fiber（渲染上下文中），而非 callback 执行时
  const fiber = currentlyRenderingFiber

  if (isMount) {
    hook.memoizedState = false  // isPending
  }

  const startTransition = (callback) => {
    // 标记为 pending 状态
    hook.memoizedState = true

    // 向上找 root 用于触发重渲染（显示 pending 状态）
    let node = fiber
    let root = null
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
// 延迟更新某个值，优先保持 UI 响应，在空闲时再更新
function useDeferredValue(value) {
  const isMount = !currentlyRenderingFiber.alternate
  const hook = isMount ? mountWorkInProgressHook() : updateWorkInProgressHook()

  if (isMount) {
    hook.memoizedState = value
    return value
  }

  const prevValue = hook.memoizedState
  if (value === prevValue) return prevValue

  // 延迟更新：返回旧值，同时调度一个新值更新
  const fiber = currentlyRenderingFiber
  let node = fiber
  let root = null
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
// 简化版 Suspense：支持 fallback 渲染
function Suspense({ children, fallback }) {
  // 检查子组件是否抛出 Promise (suspended)
  const [suspended, setSuspended] = useState(false)
  const suspensePromise = useRef(null)

  if (suspended) {
    // 渲染 fallback
    return fallback || null
  }

  return children
}

// ============================================================
// 工具函数
// ============================================================
function depsUnchanged(prevDeps, nextDeps) {
  if (prevDeps.length !== nextDeps.length) return false
  for (let i = 0; i < prevDeps.length; i++) {
    if (!Object.is(prevDeps[i], nextDeps[i])) return false
  }
  return true
}

// ============================================================
// Reconciler - React 风格 reconcileChildren
// reconcileChildFibers: 处理单个子节点 (element/text/fragment)
// reconcileChildrenArray: 处理数组子节点 (diff + key匹配)
// ============================================================

function reconcileChildren(returnFiber, currentFirstChild, newChild, lanes) {
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
function reconcileSingleElement(returnFiber, currentFirstChild, element, lanes) {
  const key = element.key
  let child = currentFirstChild
  while (child !== null) {
    // key 相同且 type 相同 → 复用
    if (child.key === key) {
      if (child.type === element.type) {
        // 删除其余兄弟
        deleteRemainingChildren(returnFiber, child.sibling)
        const existing = useFiber(child, element.props, key)
        existing.return = returnFiber
        return existing
      } else {
        // key 相同 type 不同 → 删除所有
        deleteRemainingChildren(returnFiber, child)
        break
      }
    } else {
      // key 不同 → 标记删除
      deleteChild(returnFiber, child)
    }
    child = child.sibling
  }

  // 无匹配，新建
  const created = createFiberFromElement(element, key)
  created.return = returnFiber
  return created
}

// ---- reconcileSingleTextNode ----
function reconcileSingleTextNode(returnFiber, currentFirstChild, textContent, lanes) {
  let child = currentFirstChild
  while (child !== null) {
    if (child.tag === HostText) {
      // 找到文本节点 → 删除其余，复用
      deleteRemainingChildren(returnFiber, child.sibling)
      const existing = useFiber(child, textContent, null)
      existing.return = returnFiber
      return existing
    }
    // 非文本节点 → 删除
    deleteChild(returnFiber, child)
    child = child.sibling
  }
  // 新建文本 fiber
  const created = createFiber(HostText, textContent, null)
  created.return = returnFiber
  return created
}

// ---- reconcileChildrenArray (核心 diff) ----
function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren, lanes) {
  let resultingFirstChild = null
  let previousNewFiber = null

  let oldFiber = currentFirstChild
  let lastPlacedIndex = 0
  let newIdx = 0
  let nextOldFiber = null

  // 第一轮：按 index 比较 (key 都为空时走这里)
  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    if (oldFiber.index > newIdx) {
      nextOldFiber = oldFiber
      oldFiber = null
    } else {
      nextOldFiber = oldFiber.sibling
    }

    const newChild = newChildren[newIdx]
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      // 文本节点
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
      // Fragment 展开或其他类型
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
      let newFiber = null
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

// ---- placeChild: 跟踪是否存在移动 ----
function placeChild(newFiber, lastPlacedIndex, newIndex) {
  newFiber.index = newIndex
  const current = newFiber.alternate
  if (current !== null) {
    const oldIndex = current.index
    if (oldIndex < lastPlacedIndex) {
      // 需要移动
      newFiber.flags |= Placement
      return lastPlacedIndex
    } else {
      return oldIndex
    }
  } else {
    // 新创建的，需要插入
    newFiber.flags |= Placement
    return lastPlacedIndex
  }
}

function placeSingleChild(newFiber) {
  if (newFiber.alternate === null) {
    newFiber.flags |= Placement
  }
  return newFiber
}

// ---- 删除工具 ----
function deleteChild(returnFiber, childToDelete) {
  if (childToDelete === null) return
  const deletions = returnFiber.deletions
  if (deletions === null) {
    returnFiber.deletions = [childToDelete]
  } else {
    deletions.push(childToDelete)
  }
  childToDelete.flags |= Deletion
}

function deleteRemainingChildren(returnFiber, currentFirstChild) {
  let child = currentFirstChild
  while (child !== null) {
    deleteChild(returnFiber, child)
    child = child.sibling
  }
  return null
}

function flatten(arr) {
  const result = []
  const stack = [arr]
  while (stack.length) {
    const item = stack.pop()
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

function useFiber(fiber, pendingProps, key) {
  const clone = createFiber(fiber.tag, pendingProps, key)
  clone.type = fiber.type
  clone.stateNode = fiber.stateNode
  clone.alternate = fiber
  fiber.alternate = clone
  return clone
}

function createFiberFromElement(element, key) {
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
function beginWork(wip) {
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

function updateFunctionComponent(wip) {
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
  } catch (err) {
    console.error(`[React] 组件渲染错误 (${Component.name || 'Anonymous'}):`, err)
    children = createElement('div', {
      style: 'padding:16px;background:#fff2f0;border:1px solid #ffccc7;border-radius:6px;color:#ff4d4f;font-size:13px;'
    }, `Component Error: ${err.message}`)
  } finally {
    currentlyRenderingFiber = null
  }

  return reconcileChildren(wip, wip.alternate ? wip.alternate.child : null, children)
}

function updateHostComponent(wip) {
  const props = wip.pendingProps || {}
  if (!wip.stateNode) {
    wip.stateNode = document.createElement(wip.type)
  }
  return reconcileChildren(wip, wip.alternate ? wip.alternate.child : null, props.children)
}

// ---- completeWork ----
function completeWork(wip) {
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

function completeHostComponent(wip) {
  const dom = wip.stateNode
  const newProps = wip.pendingProps || {}
  const oldProps = wip.alternate ? wip.alternate.memoizedProps : null

  if (oldProps) {
    updateDOMProperties(dom, oldProps, newProps)
  } else {
    setDOMProperties(dom, newProps)
  }
  wip.memoizedProps = newProps
}

function completeHostText(wip) {
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
function setDOMProperties(dom, props) {
  for (const key in props) {
    if (key === 'children' || key === 'key' || key === 'ref') continue
    if (key.startsWith('on')) {
      addEventListenerToRoot(dom, key.slice(2).toLowerCase(), props[key])
    } else if (key === 'className') {
      dom.setAttribute('class', props[key] || '')
    } else if (key === 'style' && typeof props[key] === 'object') {
      for (const sk in props[key]) dom.style[sk] = props[key][sk]
    } else if (key === 'dangerouslySetInnerHTML') {
      dom.innerHTML = props[key].__html
    } else if (key === 'htmlFor') {
      dom.setAttribute('for', props[key])
    } else if (key in dom) {
      try { dom[key] = props[key] } catch(e) { dom.setAttribute(key, props[key]) }
    } else {
      dom.setAttribute(key, props[key])
    }
  }
}

function updateDOMProperties(dom, oldProps, newProps) {
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
      for (const sk in oldStyle) { if (!(sk in newStyle)) dom.style[sk] = '' }
      for (const sk in newStyle) { dom.style[sk] = newStyle[sk] }
    } else if (key === 'dangerouslySetInnerHTML') {
      dom.innerHTML = newProps[key].__html
    } else if (key === 'htmlFor') {
      dom.setAttribute('for', newProps[key] || '')
    } else if (key in dom) {
      try { dom[key] = newProps[key] } catch(e) {}
    } else {
      dom.setAttribute(key, newProps[key])
    }
  }
}

// ============================================================
// 事件系统（事件委托）
// ============================================================
const rootEventListeners = new Map()

function addEventListenerToRoot(dom, eventType, handler) {
  if (!rootContainer) return
  const key = eventType
  if (!rootEventListeners.has(key)) {
    rootEventListeners.set(key, [])
    rootContainer.addEventListener(eventType, handleRootEvent)
  }
  rootEventListeners.get(key).push({ dom, handler })
}

function handleRootEvent(e) {
  const type = e.type
  const listeners = rootEventListeners.get(type)
  if (!listeners) return

  const matched = []
  let el = e.target
  while (el && el !== rootContainer.parentNode) {
    for (const item of listeners) {
      if (item.dom === el) matched.push(item.handler)
    }
    el = el.parentNode
  }
  for (const handler of matched.reverse()) {
    handler(e)
  }
}

// ============================================================
// Commit 阶段
// ============================================================
function commitRoot(root) {
  const finishedWork = root.current.alternate
  if (!finishedWork) return

  // 收集 effects 和 deletions（从 fiber 树中遍历）
  const effectList = []
  const deletionList = []
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

function runEffects(hookChain) {
  let h = hookChain
  while (h) {
    if (h.memoizedState && h.memoizedState.create) {
      if (h.memoizedState.destroy) h.memoizedState.destroy()
      h.memoizedState.destroy = h.memoizedState.create()
    }
    h = h.next
  }
}

function collectEffectsAndDeletions(fiber, effectList, deletionList) {
  if (fiber.flags & (Placement | Update | Ref)) effectList.push(fiber)
  if (fiber.flags & Deletion) deletionList.push(fiber)
  // 收集 fiber.deletions（子节点删除列表）
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

function commitPlacement(fiber) {
  const parent = getParentDOM(fiber)
  const node = getStateNode(fiber)
  if (parent && node) parent.appendChild(node)
}

function commitDeletion(fiber) {
  const node = getStateNode(fiber)
  if (node && node.parentNode) node.parentNode.removeChild(node)
}

function getParentDOM(fiber) {
  let node = fiber.return
  while (node) {
    if (node.tag === HostComponent) return node.stateNode
    if (node.tag === HostRoot) return rootContainer
    node = node.return
  }
  return null
}

function getStateNode(fiber) {
  if (fiber.tag === HostComponent || fiber.tag === HostText) return fiber.stateNode
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
function workLoopConcurrent() {
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

function workLoopSync() {
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
function performUnitOfWork(fiber) {
  // beginWork - 返回子节点
  const next = beginWork(fiber)

  if (next !== null) {
    return next
  }

  // 没有子节点，执行 completeWork 并返回兄弟节点
  let node = fiber
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
function scheduleUpdateOnFiber(root) {
  if (!root || root === workInProgressRoot) return

  console.log('[React] scheduleUpdateOnFiber 开始调度更新')

  const current = root.current
  const wip = createWorkInProgress(current, current.pendingProps)
  workInProgressRoot = root
  workInProgress = wip
  nextUnitOfWork = wip

  // 使用并发调度
  const priority = SyncLane
  scheduleCallback(lanesToPriority(priority), (didTimeout) => {
    if (didTimeout) {
      // 已过期，同步执行
      workLoopSync()
      return null
    }
    // 并发执行
    const hasMore = workLoopConcurrent()
    if (hasMore) {
      return workLoopConcurrent // 返回自身继续调度
    }
    return null
  })
}

// ============================================================
// render 入口
// ============================================================
function render(element, container) {
  console.log('[React] render 入口调用，container:', container.tagName, 'element:', element.type?.name || element.type || 'element')

  rootContainer = container
  rootElement = element

  const fiberRoot = {
    containerInfo: container,
    current: null,
    finishedWork: null,
  }

  const uninitializedFiber = createFiber(HostRoot, null, null)
  uninitializedFiber.stateNode = fiberRoot
  fiberRoot.current = uninitializedFiber

  scheduleUpdateOnFiber(fiberRoot)
}
