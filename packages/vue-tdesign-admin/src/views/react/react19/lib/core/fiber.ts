// ============================================================
// Fiber 工厂与双缓冲（对齐 ReactFiber.js）
//   current 树：已提交到页面的 Fiber 树
//   workInProgress 树：渲染中的新树，通过 alternate 双缓冲切换
// ============================================================
import {
  ClassComponent,
  ContextProvider,
  Fragment,
  FunctionComponent,
  HostComponent,
  HostText,
  SuspenseComponent,
  NoFlags,
  NoLane,
  NoLanes,
  REACT_FRAGMENT_TYPE,
  REACT_PROVIDER_TYPE,
  REACT_SUSPENSE_TYPE,
} from './types'
import type { Fiber, ReactElement, WorkTag } from './types'

export function createFiber(tag: WorkTag, pendingProps: any, key: string | null): Fiber {
  return {
    tag,
    key: key || null,
    type: null,
    stateNode: null,
    ref: null,
    return: null,
    sibling: null,
    child: null,
    index: 0,
    pendingProps,
    memoizedProps: null,
    memoizedState: null,
    dependencies: null,
    updateQueue: null,
    flags: NoFlags,
    subtreeFlags: NoFlags,
    deletions: null,
    lanes: NoLane,
    childLanes: NoLanes,
    alternate: null,
    fallback: null,
    suspenseConfig: null,
    _hookState: null,
    _didSuspend: false,
    _error: undefined,
  }
}

/** 基于 current 创建（或复用）workInProgress fiber */
export function createWorkInProgress(current: Fiber, pendingProps: any): Fiber {
  let wip: Fiber | null = current.alternate
  if (wip === null) {
    // 首次创建 workInProgress
    wip = createFiber(current.tag, pendingProps, current.key)
    wip.type = current.type
    wip.stateNode = current.stateNode
    wip.alternate = current
    current.alternate = wip
  } else {
    // 复用上次的 workInProgress（重置可变字段）
    wip.pendingProps = pendingProps
    wip.flags = NoFlags
    wip.subtreeFlags = NoFlags
    wip.deletions = null
    // 临时标记不跨渲染持久（Suspense 挂起 / 错误边界）
    wip._didSuspend = false
    wip._error = undefined
  }
  // 继承 current 的 child/sibling/index（对齐 React）：
  //  - 正常协调路径会在 beginWork 的 reconcileChildren 中覆盖 child；
  //  - bailout 路径直接复用继承的子树（不重新协调）
  wip.child = current.child
  wip.sibling = current.sibling
  wip.index = current.index
  wip.memoizedProps = current.memoizedProps
  wip.memoizedState = current.memoizedState
  wip.dependencies = current.dependencies
  wip.updateQueue = current.updateQueue
  wip.lanes = current.lanes
  wip.childLanes = current.childLanes
  wip.fallback = current.fallback
  wip.suspenseConfig = current.suspenseConfig
  wip.ref = current.ref
  return wip
}

export function createFiberFromElement(element: ReactElement): Fiber | null {
  const { type, key, props } = element
  let fiber: Fiber | null = null
  if (typeof type === 'function') {
    // 类组件：type.prototype.render 存在
    const isClass =
      type.prototype !== undefined && typeof type.prototype.render === 'function'
    fiber = createFiber(isClass ? ClassComponent : FunctionComponent, props, key)
    fiber.type = type
  } else if (typeof type === 'string') {
    fiber = createFiber(HostComponent, props, key)
    fiber.type = type
  } else if (type === REACT_FRAGMENT_TYPE) {
    fiber = createFiber(Fragment, props, key)
    fiber.type = type
  } else if (type === REACT_SUSPENSE_TYPE) {
    fiber = createFiber(SuspenseComponent, props, key)
    fiber.type = type
  } else if (type !== null && typeof type === 'object' && type.$$typeof === REACT_PROVIDER_TYPE) {
    // Context.Provider：type 是 Provider 对象（$$typeof = REACT_PROVIDER_TYPE）
    fiber = createFiber(ContextProvider, props, key)
    fiber.type = type
  }
  return fiber
}

export function createFiberFromText(content: string): Fiber {
  const fiber = createFiber(HostText, content, null)
  fiber.type = 'TEXT'
  return fiber
}
