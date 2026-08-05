// ============================================================
// Reconciler 核心（对齐 ReactFiberWorkLoop / ReactFiberBeginWork /
//               ReactFiberCompleteWork / ReactFiberCommitWork 的调用链）
//   调用链：
//   updateContainer → scheduleUpdateOnFiber → ensureRootIsScheduled
//     → performConcurrentWorkOnRoot → performWorkOnRoot
//     → renderRootSync / renderRootConcurrent
//     → workLoopSync / workLoopConcurrent → performUnitOfWork
//     → beginWork → completeUnitOfWork → completeWork
//     → completeRoot → commitRoot（不可中断）
// ============================================================
import {
  ClassComponent,
  ContextProvider,
  Fragment,
  FunctionComponent,
  HookHasEffect,
  HookLayout,
  HookPassive,
  HostComponent,
  HostRoot,
  HostText,
  NoFlags,
  NoLanes,
  Placement,
  Passive,
  Update,
  ChildDeletion,
  RootCompleted,
  RootInProgress,
  SuspenseComponent,
} from './types'
import type { Fiber, FiberRoot, Flags, Lanes, ReactElement, ClassComponentInstance } from './types'
import { createFiber, createFiberFromElement, createFiberFromText, createWorkInProgress } from './fiber'
import { renderWithHooks } from './hooks'
import { getHostConfig, setHostConfig } from './host'
import {
  DefaultLane,
  getHighestPriorityLane,
  includesBlockingLane,
  lanesToPriority,
  scheduleCallback,
  shouldYieldToHost,
} from '../scheduler'
import type { Lane } from '../scheduler'
import { addDelegatedEventListeners } from '../events'

// ---------- 全局渲染状态 ----------
let workInProgressRoot: FiberRoot | null = null
let workInProgress: Fiber | null = null
let renderLanes: Lanes = NoLanes
let workInProgressRootExitStatus: number = RootInProgress
let isRendering = false

const MutationMask = Placement | Update | ChildDeletion
const LayoutMask = Update
const PassiveMask = Passive

// ============================================================
// 入口：updateContainer / createRoot / render
// ============================================================

/** 创建 FiberRoot 并关联 HostRoot fiber */
function createFiberRoot(container: any): FiberRoot {
  const hostRootFiber = createFiber(HostRoot, null, null)
  const fiberRoot: FiberRoot = {
    containerInfo: container,
    current: hostRootFiber,
    finishedWork: null,
    callbackNode: null,
    pendingLanes: NoLanes,
    expiredLanes: NoLanes,
    callbackPriority: -1,
    _hasPassiveEffects: false,
    _pendingPassiveEffects: null,
  }
  hostRootFiber.stateNode = fiberRoot
  return fiberRoot
}

export function updateContainer(element: ReactElement | null, container: any): FiberRoot {
  const root = getOrCreateRoot(container)
  // 最新的 element 存到 HostRoot 的 updateQueue，beginWork 时读取
  root.current.updateQueue = { element }
  scheduleUpdateOnFiber(root.current, DefaultLane)
  return root
}

const roots = new WeakMap<object, FiberRoot>()

function getOrCreateRoot(container: any): FiberRoot {
  let root = roots.get(container)
  if (root === undefined) {
    root = createFiberRoot(container)
    roots.set(container, root)
    // 事件委托注册在容器上
    addDelegatedEventListeners(container)
  }
  return root
}

/** 并发渲染入口（React 19 createRoot） */
export function createRoot(container: any): { render: (el: ReactElement | null) => void; unmount: () => void } {
  const root = getOrCreateRoot(container)
  return {
    render(element: ReactElement | null): void {
      updateContainer(element, container)
    },
    unmount(): void {
      updateContainer(null, container)
    },
  }
}

/** 同步渲染入口 */
export function render(element: ReactElement | null, container: any): void {
  const root = updateContainer(element, container)
  flushSyncWork(root)
}

/** 注册宿主配置（默认 DOM 渲染器由 index.ts 注册） */
export function registerHostConfig(config: import('./host').HostConfig): void {
  setHostConfig(config)
}

// ============================================================
// 调度：scheduleUpdateOnFiber → ensureRootIsScheduled
// ============================================================

/** 标记更新 lanes：本 fiber 与 alternate、以及两条 return 链的 childLanes（对齐 React markUpdateLaneFromFiberToRoot） */
function markUpdateLaneFromFiberToRoot(sourceFiber: Fiber, lane: Lane): FiberRoot | null {
  // 本 fiber 有待处理的更新（beginWork 的 bailout 检查依赖它）
  sourceFiber.lanes |= lane
  // bailout 克隆/alternate 复用后，dispatch 绑定的 fiber 可能不是当前树节点，
  // 它的 alternate 才是当前树节点——必须同步标记（否则更新会"漂移"到旧树上丢失）
  const alternate = sourceFiber.alternate
  if (alternate !== null) {
    alternate.lanes |= lane
  }
  // 沿 return 链标记 childLanes（alternate 链也标记，保证当前树祖先被覆盖）
  let node: Fiber = sourceFiber
  let parent = node.return
  while (parent !== null) {
    parent.childLanes |= lane
    const altParent = parent.alternate
    if (altParent !== null) {
      altParent.childLanes |= lane
    }
    node = parent
    parent = node.return
  }
  if (node.tag === HostRoot) {
    const root = node.stateNode as FiberRoot
    root.pendingLanes |= lane
    return root
  }
  return null
}

export function scheduleUpdateOnFiber(fiber: Fiber, lane: Lane): void {
  const root = markUpdateLaneFromFiberToRoot(fiber, lane)
  if (root === null) return
  if (isRendering) {
    // 渲染阶段不允许再触发更新（React 语义：setState during render 会报错）
    return
  }
  ensureRootIsScheduled(root)
}

function getNextLanes(root: FiberRoot): Lanes {
  if (root.expiredLanes !== NoLanes) return root.expiredLanes
  const pendingLanes = root.pendingLanes
  if (pendingLanes === NoLanes) return NoLanes
  return getHighestPriorityLane(pendingLanes)
}

/**
 * 确保 root 有已排定的渲染任务。
 * 关键：同优先级任务复用已有 callbackNode → 自动批处理（一次事件多次 setState 合并）
 */
function ensureRootIsScheduled(root: FiberRoot): void {
  const existingCallbackNode = root.callbackNode
  const nextLanes = getNextLanes(root)
  if (nextLanes === NoLanes) {
    if (existingCallbackNode !== null) {
      root.callbackNode = null
    }
    return
  }
  const priority = lanesToPriority(nextLanes)
  if (existingCallbackNode !== null && root.callbackPriority === priority) {
    // 相同优先级：复用现有任务（自动批处理的关键）
    return
  }
  root.callbackNode = null

  const task = scheduleCallback(priority, (didTimeout: boolean) =>
    performConcurrentWorkOnRoot(root, didTimeout, task),
  )
  root.callbackNode = task
  root.callbackPriority = priority
}

/** 渲染任务主体：选择并发/同步，完成后提交（React 的 performWorkOnRoot） */
function performConcurrentWorkOnRoot(root: FiberRoot, didTimeout: boolean, originalTask: any): any {
  // 高优先级任务插队：root.callbackNode 被替换，放弃当前任务
  if (root.callbackNode !== originalTask) {
    return false
  }
  const lanes = getNextLanes(root)
  if (lanes === NoLanes) {
    return false
  }
  // 渲染前先 flush 待执行的 useEffect（对齐 React：passive effects 在下一次渲染前执行）
  if (root._hasPassiveEffects) {
    flushPassiveEffects(root)
  }
  const shouldTimeSlice = !includesBlockingLane(lanes) && !didTimeout
  const exitStatus = shouldTimeSlice ? renderRootConcurrent(root, lanes) : renderRootSync(root, lanes)

  if (exitStatus === RootInProgress) {
    // 时间片用完，返回 continuation 让调度器重新调度（可被打断/恢复）
    return (didTimeout2: boolean) => performConcurrentWorkOnRoot(root, didTimeout2, originalTask)
  }

  if (exitStatus === RootCompleted) {
    root.pendingLanes = NoLanes
    root.expiredLanes = NoLanes
    // 任务已完成并提交：清理回调引用，允许下一次调度
    root.callbackNode = null
    root.callbackPriority = -1
    completeRoot(root)
  }
  // RootSuspended：等 ping 后重新调度
  return false
}

/** 同步立即完成一次渲染（render 入口 / flushSync 使用） */
function flushSyncWork(root: FiberRoot): void {
  const lanes = getNextLanes(root)
  if (lanes === NoLanes) return
  if (root._hasPassiveEffects) {
    flushPassiveEffects(root)
  }
  const exitStatus = renderRootSync(root, lanes)
  if (exitStatus === RootCompleted) {
    root.pendingLanes = NoLanes
    root.expiredLanes = NoLanes
    root.callbackNode = null
    root.callbackPriority = -1
    completeRoot(root)
  }
}

// ============================================================
// 渲染阶段：renderRoot → workLoop → performUnitOfWork
// ============================================================

function prepareFreshStack(root: FiberRoot, lanes: Lanes): void {
  root.finishedWork = null
  workInProgressRoot = root
  workInProgress = createWorkInProgress(root.current, null)
  workInProgressRootExitStatus = RootInProgress
  renderLanes = lanes
}

/**
 * 同步渲染整棵树（不可中断）。
 *  - renderRootSync 对齐 React 的 renderRootSync：设置执行上下文后，一次性跑完
 *    workLoopSync，期间不检查时间片，任何 happens 都会在同一个宏任务内完成。
 *  - prepareFreshStack 负责"开新局"：用 current 树 clone 出 workInProgress 树（双缓冲），
 *    记录本次要处理的 renderLanes。
 *  - 结束后如果 exitStatus 仍是 RootInProgress（说明 workLoop 正常跑完），把
 *    alternate（刚渲染完的新树）作为 finishedWork，等待 commitRoot 提交。
 */
function renderRootSync(root: FiberRoot, lanes: Lanes): number {
  isRendering = true
  try {
    if (workInProgressRoot !== root || workInProgress === null) {
      prepareFreshStack(root, lanes)
    }
    workLoopSync()
    if (workInProgressRootExitStatus === RootInProgress) {
      // workLoop 正常跑完：整树完成
      root.finishedWork = root.current.alternate
      workInProgressRootExitStatus = RootCompleted
    }
    return workInProgressRootExitStatus
  } finally {
    isRendering = false
  }
}

/**
 * 并发渲染（可中断/可恢复，配合时间切片）。
 *  - 与 renderRootSync 的唯一区别：workLoopConcurrent 每次迭代前检查
 *    shouldYieldToHost()（当前帧时间预算是否用尽）。
 *  - 若被时间片打断：workInProgress !== null → 返回 RootInProgress，
 *    外层 performConcurrentWorkOnRoot 返回 continuation，调度器稍后重新调度继续渲染。
 */
function renderRootConcurrent(root: FiberRoot, lanes: Lanes): number {
  isRendering = true
  try {
    if (workInProgressRoot !== root || workInProgress === null) {
      prepareFreshStack(root, lanes)
    }
    workLoopConcurrent()
    if (workInProgress !== null) {
      // 时间片用完未完成
      workInProgressRootExitStatus = RootInProgress
    } else if (workInProgressRootExitStatus === RootInProgress) {
      root.finishedWork = root.current.alternate
      workInProgressRootExitStatus = RootCompleted
    }
    return workInProgressRootExitStatus
  } finally {
    isRendering = false
  }
}

/**
 * 同步 workLoop：从 workInProgress（当前要处理的 fiber）开始，循环执行
 * performUnitOfWork，直到整棵树遍历完毕（workInProgress === null）。
 * 抛出的异常（Suspense 挂起的 Promise / 渲染错误）交给 handleThrow 统一处理。
 */
function workLoopSync(): void {
  while (workInProgress !== null) {
    try {
      performUnitOfWork(workInProgress)
    } catch (thrownValue) {
      handleThrow(thrownValue)
    }
  }
}

/** 并发 workLoop：与同步版唯一区别是每次迭代前检查时间片是否用尽 */
function workLoopConcurrent(): void {
  while (workInProgress !== null && !shouldYieldToHost()) {
    try {
      performUnitOfWork(workInProgress)
    } catch (thrownValue) {
      handleThrow(thrownValue)
    }
  }
}

/**
 * 单个 fiber 的处理单元 = 「递」阶段。
 *  1. 取 alternate（current 树中的对应节点，挂载时为 null）
 *  2. beginWork：协调当前节点，返回"下一步要处理的子节点"（next）
 *     - 返回子节点 → workInProgress 下移，继续递
 *     - 返回 null → 进入 completeUnitOfWork（「归」阶段）
 *  3. 更新 memoizedProps = pendingProps（本轮 props 已被消费，供下次 diff 使用）
 * 注：beginWork 抛出的异常不在此处处理，直接抛给 workLoop 的 handleThrow
 * （Suspense / ErrorBoundary 需要在 beginWork 之外恢复遍历）。
 */
function performUnitOfWork(unitOfWork: Fiber): void {
  const current = unitOfWork.alternate
  let next: Fiber | null = null
  try {
    next = beginWork(current, unitOfWork)
  } catch (thrownValue) {
    // 抛给外层 workLoop 的 handleThrow 处理（Suspense / Error Boundary）
    throw thrownValue
  }
  unitOfWork.memoizedProps = unitOfWork.pendingProps
  if (next === null) {
    completeUnitOfWork(unitOfWork)
  } else {
    workInProgress = next
  }
}

// ============================================================
// beginWork（ReactFiberBeginWork.js）
// ============================================================

function beginWork(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  // bailout 检查（对齐 React beginWork）：update 时 props 引用未变且本 fiber 无待处理
  // 更新 → 直接复用已完成子树，不重新执行 render / 协调
  if (current !== null) {
    const oldProps = current.memoizedProps
    const newProps = workInProgress.pendingProps
    if (oldProps === newProps && (current.lanes & renderLanes) === NoLanes) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress)
    }
  }
  // 消费本 fiber 的更新 lanes（本轮已处理，避免下轮残留误判）
  workInProgress.lanes = NoLanes
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress)
    case HostComponent:
      return updateHostComponent(current, workInProgress)
    case HostText:
      return null
    case FunctionComponent:
      return updateFunctionComponent(current, workInProgress)
    case ClassComponent:
      return updateClassComponent(current, workInProgress)
    case Fragment:
      return reconcileChildren(current, workInProgress, workInProgress.pendingProps.children)
    case ContextProvider:
      return updateContextProvider(current, workInProgress)
    case SuspenseComponent:
      return updateSuspenseComponent(current, workInProgress)
    default:
      return null
  }
}

/**
 * bailout：本 fiber 无更新，复用已完成子树（对齐 React bailoutOnAlreadyFinishedWork）。
 *  - 子树无待处理更新 → return null（本 fiber 完成，child 已在 createWorkInProgress 继承）
 *  - 子树有更新 → return child 继续向下（不执行本 fiber 的 render）
 */
function bailoutOnAlreadyFinishedWork(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  // ContextProvider 需要保持 contextStack 平衡（子树可能读 context 值）
  if (workInProgress.tag === ContextProvider) {
    const providerType = workInProgress.type
    const context = providerType._context
    contextStack.push({ context, prevValue: context._currentValue })
    context._currentValue = workInProgress.pendingProps.value
  }
  if ((workInProgress.childLanes & renderLanes) === NoLanes) {
    // 子树也没有待处理更新：整个子树跳过，DOM 保持现状
    return null
  }
  // 子树有待处理更新：克隆 current.child 链后返回 child 继续向下遍历
  // （该 fiber 的 render 不执行；克隆保证不修改已提交的 current 树）
  cloneChildFibers(current, workInProgress)
  return workInProgress.child
}

/** 克隆 current.child 链为可修改的 workInProgress（对齐 React cloneChildFibers） */
function cloneChildFibers(current: Fiber, workInProgress: Fiber): void {
  const currentChild = current.child
  if (currentChild === null) return
  let clone = createWorkInProgress(currentChild, currentChild.pendingProps)
  clone.return = workInProgress
  workInProgress.child = clone
  let prev = clone
  let cur = currentChild.sibling
  while (cur !== null) {
    const nextClone = createWorkInProgress(cur, cur.pendingProps)
    nextClone.return = workInProgress
    prev.sibling = nextClone
    prev = nextClone
    cur = cur.sibling
  }
}

function updateHostRoot(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  const element = workInProgress.updateQueue ? workInProgress.updateQueue.element : null
  return reconcileChildren(current, workInProgress, element)
}

function updateHostComponent(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  const type = workInProgress.type as string
  const nextProps = workInProgress.pendingProps
  const hostConfig = getHostConfig()
  let nextChildren: any = nextProps.children
  if (hostConfig.shouldSetTextContent && hostConfig.shouldSetTextContent(type, nextProps)) {
    // 纯文本子节点直接由宿主处理，不建 HostText fiber
    nextChildren = null
  }
  reconcileChildren(current, workInProgress, nextChildren)
  return workInProgress.child
}

function updateFunctionComponent(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  const Component = workInProgress.type
  const children = renderWithHooks(current, workInProgress, Component, workInProgress.pendingProps)
  reconcileChildren(current, workInProgress, children)
  return workInProgress.child
}

function updateClassComponent(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  const Component = workInProgress.type
  const nextProps = workInProgress.pendingProps
  let instance = workInProgress.stateNode as ClassComponentInstance | null

  if (instance === null) {
    // mount
    instance = new Component(nextProps)
    instance._reactInternalFiber = workInProgress
    instance.props = nextProps
    workInProgress.stateNode = instance
    if (workInProgress._error) {
      applyErrorToState(workInProgress, instance, Component)
    }
    instance.state = instance.state ?? {}
    workInProgress.memoizedState = instance.state
    // 对齐 React mountClassInstance：定义了 componentDidMount 则打 Update flag，
    // 否则 commitLayoutEffects 的 LayoutMask 剪枝会跳过该 fiber（生命周期不触发）
    if (typeof instance.componentDidMount === 'function') {
      workInProgress.flags |= Update
    }
  } else {
    // update
    instance.props = nextProps
    if (workInProgress._error) {
      applyErrorToState(workInProgress, instance, Component)
    }
    workInProgress.memoizedState = instance.state
    // 对齐 React updateClassInstance：定义了 componentDidUpdate 则打 Update flag
    if (typeof instance.componentDidUpdate === 'function') {
      workInProgress.flags |= Update
    }
  }
  const children = instance.render()
  reconcileChildren(current, workInProgress, children)
  return workInProgress.child
}

/** 把错误合并进边界实例的 state（getDerivedStateFromError / componentDidCatch） */
function applyErrorToState(workInProgress: Fiber, instance: ClassComponentInstance, Component: any): void {
  const error = workInProgress._error
  if (typeof Component.getDerivedStateFromError === 'function') {
    const partial = Component.getDerivedStateFromError(error)
    instance.state = { ...(instance.state ?? {}), ...(partial ?? {}) }
  }
  if (typeof instance.componentDidCatch === 'function') {
    ;(instance as any)._caughtError = error
  }
  workInProgress._error = null
}

// ---------- Context Provider ----------
const contextStack: Array<{ context: any; prevValue: any }> = []

function updateContextProvider(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  const providerType = workInProgress.type
  const context = providerType._context
  const newProps = workInProgress.pendingProps
  // push context value
  contextStack.push({ context, prevValue: context._currentValue })
  context._currentValue = newProps.value
  reconcileChildren(current, workInProgress, newProps.children)
  return workInProgress.child
}

function popContextProvider(): void {
  const entry = contextStack.pop()
  if (entry) {
    entry.context._currentValue = entry.prevValue
  }
}

// ---------- Suspense ----------
function updateSuspenseComponent(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  const didSuspend = workInProgress._didSuspend === true
  // 本轮已消费挂起标记
  workInProgress._didSuspend = false

  if (didSuspend) {
    // 渲染 fallback，并标记需要更新（commit 时替换 DOM）
    workInProgress.flags |= Update
    const fallback = workInProgress.pendingProps.fallback
    return reconcileChildren(current, workInProgress, fallback)
  }
  const children = workInProgress.pendingProps.children
  return reconcileChildren(current, workInProgress, children)
}

// ============================================================
// reconcileChildren（ReactChildFiber.js）
// ============================================================

function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any,
): Fiber | null {
  if (current === null) {
    // 初始挂载：使用 mountChildFibers（不追踪副作用，插入由最外层 Placement 递归覆盖）
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren)
  } else {
    workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren)
  }
  return workInProgress.child
}

type ChildReconciler = (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: any,
) => Fiber | null

/**
 * 创建子节点协调器（对齐 ReactFiberChildFiber.createChildReconciler）。
 *   shouldTrackSideEffects = true  → reconcileChildFibers（update：记录删除、打 Placement）
 *   shouldTrackSideEffects = false → mountChildFibers（初始挂载：无旧树可删、插入由顶层
 *                                      Placement 递归覆盖，无需逐节点标记）
 */
function createChildReconciler(shouldTrackSideEffects: boolean): ChildReconciler {
  function deleteChild(returnFiber: Fiber, childToDelete: Fiber | null): void {
    if (!shouldTrackSideEffects) {
      // mount：无旧树可删，no-op
      return
    }
    if (childToDelete === null) return
    const deletions = returnFiber.deletions
    if (deletions === null) {
      returnFiber.deletions = [childToDelete]
      returnFiber.flags |= ChildDeletion
    } else {
      deletions.push(childToDelete)
    }
  }

  function deleteRemainingChildren(returnFiber: Fiber, currentFirstChild: Fiber | null): void {
    if (!shouldTrackSideEffects) return
    let childToDelete = currentFirstChild
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete)
      childToDelete = childToDelete.sibling
    }
  }

  function useFiber(fiber: Fiber, pendingProps: any): Fiber {
    const clone = createWorkInProgress(fiber, pendingProps)
    clone.index = 0
    clone.sibling = null
    return clone
  }

  /** placement 判断：复用节点移动/新挂载时打 Placement 标记 */
  function placeChild(newFiber: Fiber, lastPlacedIndex: number, newIndex: number): number {
    newFiber.index = newIndex
    if (!shouldTrackSideEffects) {
      // mount：不逐节点标记，插入由最外层 Placement 递归覆盖
      return lastPlacedIndex
    }
    const current = newFiber.alternate
    if (current !== null) {
      const oldIndex = current.index
      if (oldIndex < lastPlacedIndex) {
        newFiber.flags |= Placement // 需要移动
        return lastPlacedIndex
      }
      return oldIndex
    } else {
      newFiber.flags |= Placement // 新挂载
      return lastPlacedIndex
    }
  }

  /** 单节点复用/新建后：新挂载的节点打 Placement（对齐 React 的 placeSingleChild） */
  function placeSingleChild(newFiber: Fiber): Fiber {
    if (shouldTrackSideEffects && newFiber.alternate === null) {
      newFiber.flags |= Placement
    }
    return newFiber
  }

  function reconcileChildFibers(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChild: any,
  ): Fiber | null {
    if (newChild === null || newChild === undefined) {
      // 删除所有旧子节点
      deleteRemainingChildren(returnFiber, currentFirstChild)
      return null
    }
    if (Array.isArray(newChild)) {
      // children 已在 createElement / jsx 构造层扁平化为一位数组
      // （静态节点与数组混排、嵌套数组、条件表达式均已展开过滤）
      return reconcileChildrenArray(returnFiber, currentFirstChild, newChild)
    }
    if (typeof newChild === 'object' && newChild.$$typeof !== undefined) {
      return reconcileSingleElement(returnFiber, currentFirstChild, newChild as ReactElement)
    }
    // 文本节点
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      return reconcileSingleTextNode(returnFiber, currentFirstChild, String(newChild))
    }
    deleteRemainingChildren(returnFiber, currentFirstChild)
    return null
  }

  function reconcileSingleElement(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    element: ReactElement,
  ): Fiber {
    const key = element.key
    let child = currentFirstChild
    while (child !== null) {
      if (child.key === key) {
        if (child.type === element.type) {
          // key + type 匹配：复用
          deleteRemainingChildren(returnFiber, child.sibling)
          const existing = useFiber(child, element.props)
          existing.return = returnFiber
          return placeSingleChild(existing)
        }
        // key 匹配但 type 不同：删除该节点及其后续
        deleteRemainingChildren(returnFiber, child)
        break
      } else {
        deleteChild(returnFiber, child)
        child = child.sibling
      }
    }
    const created = createFiberFromElement(element)!
    created.return = returnFiber
    return placeSingleChild(created)
  }

  function reconcileSingleTextNode(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    textContent: string,
  ): Fiber {
    if (currentFirstChild !== null && currentFirstChild.tag === HostText) {
      // 复用文本节点
      deleteRemainingChildren(returnFiber, currentFirstChild.sibling)
      const existing = useFiber(currentFirstChild, textContent)
      existing.return = returnFiber
      return placeSingleChild(existing)
    }
    deleteRemainingChildren(returnFiber, currentFirstChild)
    const created = createFiberFromText(textContent)
    created.return = returnFiber
    return placeSingleChild(created)
  }

  /**
   * 数组子节点 diff（对齐 React 的 reconcileChildrenArray）——列表 diff 的核心算法。
   *
   * 总体策略（与 React 一致）：
   *   阶段一：按 index 顺序从头对齐比较新旧节点，能复用（key + type 匹配）直接复用；
   *   阶段二：把"阶段一未被消费的剩余旧节点"放入 Map，以 key（无 key 用 index）为键；
   *   阶段三：剩余新节点从 Map 中按 key 找可复用的旧节点；
   *   阶段四：删除 Map 中最终未被复用的旧节点。
   *
   * 关键变量：
   *  - resultingFirstChild：组装后的新 fiber 链头，最终赋给 workInProgress.child
   *  - previousNewFiber：上一个已组装的新 fiber，用于把新节点串成 sibling 链
   *  - oldFiber：当前正在对齐的旧节点（沿 current.child 的 sibling 链前进）
   *  - nextOldFiber：备份"下一次循环要用的旧节点"。因为匹配过程中 oldFiber 可能被
   *    置 null 或已消费（sibling 已被读取），必须先在本次取下一个节点之前备份
   *  - lastPlacedIndex：已处理新节点中"被复用旧节点的最大 index"（见 placeChild：
   *    只有旧 index < lastPlacedIndex 的节点才需要打 Placement 移动标记——
   *    等价于找"最长不移动子序列"，尽量减少 DOM 移动）
   */
  function reconcileChildrenArray(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChildren: any[],
  ): Fiber | null {
    let resultingFirstChild: Fiber | null = null
    let previousNewFiber: Fiber | null = null
    let oldFiber = currentFirstChild
    let lastPlacedIndex = 0
    let newIdx = 0
    let nextOldFiber: Fiber | null = null

    // ─── 阶段一：按 index 顺序对齐比较 ───
    // 前提：挂载时每个旧节点的 index 与位置一致（0,1,2...）。顺序未变的节点会在
    // 这一遍被 updateSlot 以 key+type 直接复用，无需进入 O(n) 建 map + 查找。
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
      if (oldFiber.index > newIdx) {
        // 旧节点 index 与当前新位置不对齐（该旧节点不应对位）。
        // 备份它到 nextOldFiber，并把 oldFiber 置 null，让本轮的 updateSlot
        // 收到 null 直接返回 → 结束阶段一，该旧节点留给阶段二的 map 处理。
        nextOldFiber = oldFiber
        oldFiber = null
      } else {
        // 正常对齐：先备份下一个旧节点（sibling），本次使用当前 oldFiber
        nextOldFiber = oldFiber.sibling
      }
      const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx])
      if (newFiber === null) {
        // key 不匹配 / 类型不匹配 → 对位失败，停止阶段一的顺序对齐
        if (oldFiber === null) {
          // 刚才是"不对齐"分支（oldFiber 被置 null）：恢复 nextOldFiber，
          // 保证阶段二从正确的位置开始收集剩余旧节点
          oldFiber = nextOldFiber
        }
        break
      }
      // 复用/新建成功：placeChild 计算是否需要打 Placement，并推进 lastPlacedIndex
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)
      // 把 newFiber 串联进新结果链（首节点记录为链头，后续节点挂到前一个的 sibling）
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber
      } else {
        previousNewFiber.sibling = newFiber
        newFiber.return = returnFiber
      }
      previousNewFiber = newFiber
      oldFiber = nextOldFiber // 旧指针前进到已备份的下一个
    }

    // ─── 阶段一结束的快速路径 ───
    if (newIdx === newChildren.length) {
      // 新数组已全部处理完：剩余旧节点全是多余 → 整段标记删除
      deleteRemainingChildren(returnFiber, oldFiber)
      return resultingFirstChild
    }

    // ─── 阶段二：把剩余旧节点放入 Map ───
    // 只收集 oldFiber 及其后续（阶段一已消费的旧节点不在此列）。
    // 有 key 用 key 做键，无 key 退化为用 index（React 同款降级策略）。
    const existingChildren = new Map<string | number, Fiber>()
    let existingChild = oldFiber
    while (existingChild !== null) {
      const existingKey = existingChild.key !== null ? existingChild.key : existingChild.index
      existingChildren.set(existingKey, existingChild)
      existingChild = existingChild.sibling
    }

    // ─── 阶段三：剩余新节点从 Map 中复用 ───
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = updateFromMap(existingChildren, returnFiber, newIdx, newChildren[newIdx])
      if (newFiber !== null) {
        if (newFiber.alternate !== null) {
          // 复用成功：从 Map 中移除该旧节点（已被消费，不能再匹配给别的节点）
          existingChildren.delete(newFiber.alternate.key !== null ? newFiber.alternate.key : newFiber.alternate.index)
        }
        // 同样参与移动判定（lastPlacedIndex 持续累计，保证跨两阶段的移动判断一致）
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber
        } else {
          previousNewFiber.sibling = newFiber
          newFiber.return = returnFiber
        }
        previousNewFiber = newFiber
      }
    }

    // ─── 阶段四：删除 Map 中最终未被复用的旧节点（全部是本次要移除的）───
    existingChildren.forEach((child) => deleteChild(returnFiber, child))
    return resultingFirstChild
  }

  function updateSlot(returnFiber: Fiber, oldFiber: Fiber | null, newChild: any): Fiber | null {
    if (oldFiber === null) return null
    const newKey = newChild && newChild.key !== undefined ? newChild.key : null
    if (oldFiber.key !== newKey) return null
    if (typeof newChild === 'object' && newChild.$$typeof !== undefined) {
      if (oldFiber.type === newChild.type) {
        return useFiber(oldFiber, newChild.props)
      }
      // key 相同但 type 不同：删除旧节点 + 新建替换。
      // 注意必须返回新 fiber（非 null），否则 break 进入 map 阶段会再次
      // deleteChild 同一旧节点导致重复删除
      deleteChild(returnFiber, oldFiber)
      const created = createFiberFromElement(newChild)
      if (created !== null) created.return = returnFiber
      return created
    }
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      if (oldFiber.tag === HostText) {
        return useFiber(oldFiber, String(newChild))
      }
      deleteChild(returnFiber, oldFiber)
      const created = createFiberFromText(String(newChild))
      created.return = returnFiber
      return created
    }
    deleteChild(returnFiber, oldFiber)
    return null
  }

  function updateFromMap(
    existingChildren: Map<string | number, Fiber>,
    returnFiber: Fiber,
    newIdx: number,
    newChild: any,
  ): Fiber | null {
    if (newChild === null || newChild === undefined) return null
    const newKey = newChild && newChild.key !== undefined ? newChild.key : null
    let matchedFiber: Fiber | null = null
    if (typeof newChild === 'object' && newChild.$$typeof !== undefined) {
      if (newKey !== null) {
        matchedFiber = existingChildren.get(newKey) ?? null
      } else {
        matchedFiber = existingChildren.get(newIdx) ?? null
        if (matchedFiber !== null && matchedFiber.type !== newChild.type) {
          deleteChild(returnFiber, matchedFiber)
          matchedFiber = null
        }
      }
      if (matchedFiber !== null) {
        if (matchedFiber.type !== newChild.type) {
          deleteChild(returnFiber, matchedFiber)
          return null
        }
        return useFiber(matchedFiber, newChild.props)
      }
      const created = createFiberFromElement(newChild)!
      created.index = newIdx
      created.return = returnFiber
      return created
    }
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      matchedFiber = existingChildren.get(newIdx) ?? null
      if (matchedFiber !== null && matchedFiber.tag !== HostText) {
        deleteChild(returnFiber, matchedFiber)
        matchedFiber = null
      }
      if (matchedFiber !== null) {
        return useFiber(matchedFiber, String(newChild))
      }
      const created = createFiberFromText(String(newChild))
      created.index = newIdx
      created.return = returnFiber
      return created
    }
    return null
  }

  return reconcileChildFibers
}

export const reconcileChildFibers: ChildReconciler = createChildReconciler(true)
export const mountChildFibers: ChildReconciler = createChildReconciler(false)

// ============================================================
// completeUnitOfWork / completeWork（ReactFiberCompleteWork.js）
// ============================================================

/**
 * 「归」阶段：当前节点的子树已处理完，从当前节点开始逐级向上完成。
 *  - completeWork(当前节点) 完成自身的构建/更新
 *  - 若有 sibling → workInProgress 转向 sibling（回到「递」继续处理兄弟子树）
 *  - 若无 sibling → 向上回溯到 returnFiber，继续「归」
 *  - 到达 HostRoot（completedWork === null）→ 整棵树渲染完成，设置 finishedWork
 */
function completeUnitOfWork(unitOfWork: Fiber): void {
  let completedWork: Fiber | null = unitOfWork
  do {
    const current = completedWork.alternate
    const returnFiber = completedWork.return
    const next = completeWork(current, completedWork)
    if (next !== null) {
      workInProgress = next
      return
    }
    const siblingFiber = completedWork.sibling
    if (siblingFiber !== null) {
      workInProgress = siblingFiber
      return
    }
    completedWork = returnFiber
    workInProgress = completedWork
  } while (completedWork !== null)

  // 到达 HostRoot：整树渲染完成
  if (workInProgressRoot !== null) {
    workInProgressRoot.finishedWork = workInProgressRoot.current.alternate
    workInProgressRootExitStatus = RootCompleted
    workInProgress = null
  }
}

/**
 * 完成单个 fiber 的构建（ReactFiberCompleteWork.js）：
 *  - HostComponent / HostText：挂载时创建 DOM 实例并 append 子树宿主节点；
 *    update 时对比新旧 memoizedProps，有变化则打 Update flag（commit 阶段 diff）。
 *    注意这里才更新 memoizedProps（beginWork 阶段只比较、不更新）。
 *  - ContextProvider：弹出 contextStack（beginWork/bailout 时 push 的上下文出栈），
 *    保证后续兄弟节点的 useContext 读到的是外层值。
 *  - 最后统一 bubbleProperties 把子节点的 flags 冒泡到本节点的 subtreeFlags。
 */
function completeWork(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  const hostConfig = getHostConfig()
  switch (workInProgress.tag) {
    case HostComponent: {
      const type = workInProgress.type as string
      const props = workInProgress.pendingProps
      // 关键：更新 memoizedProps，保证 commit 后事件委托/后续 diff 读到最新 props
      workInProgress.memoizedProps = props
      if (current !== null && workInProgress.stateNode !== null) {
        // update：属性有变化时打 Update flag，commit 阶段 diff 新旧 props
        if (current.memoizedProps !== props) {
          workInProgress.flags |= Update
        }
      } else {
        // mount：创建实例并挂载子树宿主节点
        const instance = hostConfig.createInstance(type, props, getRootContainer(workInProgress))
        appendAllChildren(instance, workInProgress)
        workInProgress.stateNode = instance
        if (hostConfig.attachInstanceMeta) {
          hostConfig.attachInstanceMeta(instance, workInProgress)
        }
      }
      bubbleProperties(workInProgress)
      return null
    }
    case HostText: {
      workInProgress.memoizedProps = workInProgress.pendingProps
      if (current !== null && workInProgress.stateNode !== null) {
        // update：文本变化打 Update flag
        if (current.memoizedProps !== workInProgress.pendingProps) {
          workInProgress.flags |= Update
        }
      } else {
        const instance = hostConfig.createTextInstance(workInProgress.pendingProps, getRootContainer(workInProgress))
        workInProgress.stateNode = instance
      }
      bubbleProperties(workInProgress)
      return null
    }
    case ContextProvider:
      popContextProvider()
      bubbleProperties(workInProgress)
      return null
    default:
      bubbleProperties(workInProgress)
      return null
  }
}

/**
 * 挂载时把子树中的宿主节点（HostComponent/HostText，含经过 Fragment/组件等
 * 非宿主节点的情况）按树序遍历并 append 到父实例。
 * 只用于 mount（update 时 DOM 已存在，无需重新 append）。
 */
function appendAllChildren(parent: any, workInProgress: Fiber): void {
  const hostConfig = getHostConfig()
  let node: Fiber | null = workInProgress.child
  while (node !== null) {
    if (node.tag === HostComponent || node.tag === HostText) {
      hostConfig.appendChild(parent, node.stateNode)
    } else if (node.child !== null) {
      // 非宿主节点（组件/Fragment 等）：深入其子树继续找宿主节点
      node.child.return = node
      node = node.child
      continue
    }
    if (node === workInProgress) return
    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) return
      node = node.return
    }
    node.sibling.return = node.return
    node = node.sibling
  }
}

/**
 * flags 冒泡（React 的 bubbleProperties）：
 * 把子节点（child + sibling 链）的 subtreeFlags 与 flags 合并进当前节点的
 * subtreeFlags。提交阶段据此剪枝——若某节点 subtreeFlags 与当前掩码无交集，
 * 则整棵子树无需遍历，直接跳过，避免 O(n) 全量扫描。
 */
function bubbleProperties(completedWork: Fiber): void {
  let subtreeFlags: Flags = NoFlags
  let child = completedWork.child
  while (child !== null) {
    subtreeFlags |= child.subtreeFlags
    subtreeFlags |= child.flags
    child = child.sibling
  }
  completedWork.subtreeFlags |= subtreeFlags
}

function getRootContainer(fiber: Fiber): any {
  let node: Fiber | null = fiber
  while (node.return !== null) {
    node = node.return
  }
  if (node.tag === HostRoot) {
    return (node.stateNode as FiberRoot).containerInfo
  }
  return null
}

// ============================================================
// 异常处理：Suspense 挂起 + Error Boundary（ReactFiberThrow.js）
// ============================================================

function isThenable(value: any): boolean {
  return value !== null && typeof value === 'object' && typeof value.then === 'function'
}

function handleThrow(thrownValue: any): void {
  const thrownFiber = workInProgress
  if (thrownFiber === null) return

  if (isThenable(thrownValue)) {
    // Suspense：向上找最近的 Suspense 边界
    const boundary = findSuspenseBoundary(thrownFiber.return)
    if (boundary !== null) {
      boundary._didSuspend = true
      // 丢弃第一次 reconcile 累积的删除标记（重置边界后二次 reconcile 会完整对比旧树）
      boundary.deletions = null
      boundary.flags &= ~ChildDeletion
      ;(thrownValue as Promise<any>).then(() => {
        // 数据就绪，重新调度渲染
        scheduleUpdateOnFiber(boundary, DefaultLane)
      })
      workInProgress = boundary
      return
    }
    // 无边界：当作错误处理
  }

  // Error Boundary：向上找最近的类组件边界
  const errorBoundary = findErrorBoundary(thrownFiber.return)
  if (errorBoundary !== null) {
    errorBoundary._error = thrownValue
    errorBoundary.deletions = null
    errorBoundary.flags &= ~ChildDeletion
    workInProgress = errorBoundary
    return
  }
  // 无边界：根级错误，抛出（由最外层捕获并提示）
  throw thrownValue
}

function findSuspenseBoundary(fiber: Fiber | null): Fiber | null {
  let node = fiber
  while (node !== null) {
    if (node.tag === SuspenseComponent) {
      return node
    }
    node = node.return
  }
  return null
}

function findErrorBoundary(fiber: Fiber | null): Fiber | null {
  let node = fiber
  while (node !== null) {
    if (node.tag === ClassComponent) {
      const type = node.type
      const instance = node.stateNode
      if (
        instance &&
        (typeof type.getDerivedStateFromError === 'function' || typeof instance.componentDidCatch === 'function')
      ) {
        return node
      }
    }
    node = node.return
  }
  return null
}

// ============================================================
// 提交阶段：completeRoot → commitRoot（不可中断）
// ============================================================

/** 提交入口：渲染完成（finishedWork 非空）后调用 commitRoot 执行不可中断的提交 */
function completeRoot(root: FiberRoot): void {
  const finishedWork = root.finishedWork
  if (finishedWork === null) return
  commitRoot(root)
}

/**
 * 提交阶段总入口（React 的 commitRoot）——不可中断，三个阶段顺序执行：
 *  1. mutation  阶段：真实的 DOM 变更（插入 / 删除 / 属性更新），执行后 DOM 已反映新状态
 *  2. 双缓冲切换：root.current = finishedWork（此后新树成为"当前已提交"的树）
 *  3. layout    阶段：useLayoutEffect + 类组件生命周期（componentDidMount / componentDidUpdate）
 *  4. passive   阶段：useEffect 异步执行（通过调度器排入宏任务，不阻塞本次提交）
 *  5. 提交后重置：清残留的 lanes / flags，保证 current 树干净
 */
function commitRoot(root: FiberRoot): void {
  const finishedWork = root.finishedWork!
  root.finishedWork = null
  const hostConfig = getHostConfig()

  // 1. mutation 阶段：DOM 变更（插入/删除/更新）
  commitMutationEffects(root, finishedWork)
  // 2. 双缓冲切换：current = finishedWork
  root.current = finishedWork
  // 3. layout 阶段：useLayoutEffect + 类组件生命周期
  commitLayoutEffects(root, finishedWork)
  // 4. passive 阶段：useEffect 异步执行
  if ((finishedWork.flags & PassiveMask) || (finishedWork.subtreeFlags & PassiveMask)) {
    root._hasPassiveEffects = true
    scheduleCallback(2, () => {
      flushPassiveEffects(root)
      return false
    })
  }
  // 5. 提交后重置：清残留 lanes / childLanes / subtreeFlags 与非 Passive 的 flags。
  //    这样 current 树保持干净，下次渲染的 bailout 冒泡不会把上一轮残留的
  //    flags / lanes 带上（否则无关组件会被误判为需要更新而重复渲染）
  resetCommittedTree(finishedWork)
}

/**
 * 提交完成后重置整棵已提交树（保留待 flush 的 Passive 位）。
 * 只保留 Passive 相关 flags（useEffect 尚未执行，等 flushPassiveEffects 再清），
 * 其余 flags / lanes / childLanes 全部清零，使 current 树回到"干净"状态——
 * 这是 bailout 机制正确工作的前提（bailout 检查依赖 lanes 与 subtreeFlags 无残留）。
 */
function resetCommittedTree(fiber: Fiber): void {
  fiber.flags &= PassiveMask
  fiber.subtreeFlags &= PassiveMask
  fiber.lanes = NoLanes
  fiber.childLanes = NoLanes
  let child = fiber.child
  while (child !== null) {
    resetCommittedTree(child)
    child = child.sibling
  }
}

/**
 * mutation 阶段：应用所有副作用到 DOM（React 的 commitMutationEffectsOnFiber）。
 * 处理顺序（父先于子，保证容器/插入参考点就位）：
 *  1. ChildDeletion：先删掉被标记删除的子节点（children diff 产生的 deletions）
 *  2. Placement：插入新节点（首次挂载 / 移动）
 *  3. Update：更新属性 / 文本内容
 *  4. 递归遍历 child + sibling，用 subtreeFlags 剪枝——与掩码无交集的子树整体跳过
 * 关键细节：mutation 只清 Placement / ChildDeletion，不清 Update——Update 要保留给
 * layout 阶段判断 componentDidMount / componentDidUpdate / useLayoutEffect 是否调用。
 */
function commitMutationEffects(root: FiberRoot, fiber: Fiber): void {
  const hostConfig = getHostConfig()
  // 1. 处理本节点的 deletions
  if (fiber.flags & ChildDeletion) {
    const deletions = fiber.deletions ?? []
    for (let i = 0; i < deletions.length; i++) {
      const childToDelete = deletions[i]
      if (childToDelete !== null) {
        commitDeletion(childToDelete, fiber)
      }
    }
    fiber.deletions = null
    fiber.flags &= ~ChildDeletion
  }
  // 2. 处理自身 flags（父先于子，保证容器就位）
  if (fiber.flags & Placement) {
    commitPlacement(fiber)
    fiber.flags &= ~Placement
  }
  if (fiber.flags & Update) {
    commitWork(fiber)
    // 此处不清 Update：mutation 阶段只清 Placement，Update 保留给 layout 阶段判断
    // componentDidMount / componentDidUpdate / useLayoutEffect（layout 处理后清除）
  }
  // 3. 递归：遍历所有 child（含 sibling 链），按 自身flags | 子树flags 剪枝
  let child = fiber.child
  while (child !== null) {
    if (((child.subtreeFlags | child.flags) & MutationMask) !== NoFlags) {
      commitMutationEffects(root, child)
    }
    child = child.sibling
  }
}

/** 更新宿主节点：HostComponent 走 props diff，HostText 走文本 diff */
function commitWork(fiber: Fiber): void {
  const hostConfig = getHostConfig()
  if (fiber.tag === HostComponent) {
    const current = fiber.alternate
    if (current !== null && fiber.stateNode !== null) {
      hostConfig.commitUpdate(fiber.stateNode, fiber.type as string, current.memoizedProps ?? {}, fiber.memoizedProps ?? {})
    }
  } else if (fiber.tag === HostText) {
    const current = fiber.alternate
    if (current !== null && fiber.stateNode !== null) {
      hostConfig.commitTextUpdate(fiber.stateNode, current.memoizedProps ?? '', fiber.memoizedProps ?? '')
    }
  }
}

/** 判断 fiber 是否有真实 DOM 容器（HostComponent 或 HostRoot） */
function isHostParent(fiber: Fiber): boolean {
  return fiber.tag === HostComponent || fiber.tag === HostRoot
}

/** 沿 return 链向上找最近的宿主父节点（插入/删除的落点） */
function getHostParentFiber(fiber: Fiber): Fiber | null {
  let parent = fiber.return
  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent
    }
    parent = parent.return
  }
  return null
}

/**
 * 插入（Placement）落位：找到宿主父节点与其 DOM 实例，并计算插入参考位置
 * （before），然后把整棵子树（可能含非宿主节点）插入。
 */
function commitPlacement(finishedWork: Fiber): void {
  const hostConfig = getHostConfig()
  const parentFiber = getHostParentFiber(finishedWork)!
  const parentInstance = parentFiber.tag === HostRoot ? (parentFiber.stateNode as FiberRoot).containerInfo : parentFiber.stateNode
  const isContainer = parentFiber.tag === HostRoot
  const before = getHostSibling(finishedWork)
  insertOrAppendPlacementNode(finishedWork, before, parentInstance, isContainer)
}

/**
 * 找到被插入节点的宿主兄弟节点（作为 insertBefore 的参考位置）。
 * 跳过同样带 Placement 的兄弟（它们也要被移动，位置会重新计算，不能作为锚点）。
 * 若没有这样的兄弟 → 返回 null，表示 append 到末尾。
 */
function getHostSibling(fiber: Fiber): any {
  let node: Fiber | null = fiber
  siblings: while (true) {
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        return null
      }
      node = node.return
    }
    node = node.sibling
    while (node.tag !== HostComponent && node.tag !== HostText) {
      if (node.flags & Placement) continue siblings
      if (node.child === null) continue siblings
      node = node.child
    }
    if (node.flags & Placement) continue siblings
    return node.stateNode
  }
}

/**
 * 递归插入子树中的宿主节点：
 *  - 本节点是宿主节点 → 直接 insertBefore / appendChild
 *  - 本节点是非宿主节点（组件/Fragment）→ 深入 child 链，把子树里所有宿主节点
 *    依次插入（顺序保持原树顺序）
 */
function insertOrAppendPlacementNode(
  node: Fiber,
  before: any,
  parent: any,
  isContainer: boolean,
): void {
  const hostConfig = getHostConfig()
  if (node.tag === HostComponent || node.tag === HostText) {
    const instance = node.stateNode
    if (before !== null && before !== undefined) {
      if (isContainer) {
        hostConfig.insertInContainerBefore(parent, instance, before)
      } else {
        hostConfig.insertBefore(parent, instance, before)
      }
    } else {
      if (isContainer) {
        hostConfig.appendChildToContainer(parent, instance)
      } else {
        hostConfig.appendChild(parent, instance)
      }
    }
  } else {
    // 非宿主节点：深入子树找宿主后代
    const child = node.child
    if (child !== null) {
      insertOrAppendPlacementNode(child, before, parent, isContainer)
      let sibling = child.sibling
      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent, isContainer)
        sibling = sibling.sibling
      }
    }
  }
}

/**
 * 删除子树（React 的 commitDeletion）：
 *  1. 先执行卸载清理：递归卸载函数组件的 effect destroy、类组件的 componentWillUnmount
 *  2. 沿 return 链找到最近的宿主父节点（deletions 挂在组件 fiber 上，需向上找真实 DOM 容器）
 *  3. 从 DOM 移除被删子树的顶层宿主节点（其 DOM 子孙随之移除）
 */
function commitDeletion(fiber: Fiber, parentFiber: Fiber): void {
  const hostConfig = getHostConfig()
  // 1. 执行卸载清理（effect destroy、类组件 componentWillUnmount）
  unmountFiberEffects(fiber)
  // 2. 沿 return 向上找最近的宿主父节点（parentFiber 可能是类组件/函数组件，无 DOM）
  let hostParent: Fiber | null = parentFiber
  while (hostParent !== null && !isHostParent(hostParent)) {
    hostParent = hostParent.return
  }
  if (hostParent === null) return
  const isContainer = hostParent.tag === HostRoot
  const parentInstance = isContainer ? (hostParent.stateNode as FiberRoot).containerInfo : hostParent.stateNode
  removeChildFromDOM(parentInstance, fiber, isContainer)
}

/**
 * 从外部容器删除子树顶层宿主节点的 DOM 实例。
 *  - 本节点是宿主节点：直接删除，其 DOM 子孙自动随父节点一起移除
 *  - 非宿主节点（组件/Fragment）：递归其 child 链逐个删除（child 的 sibling 都是
 *    被删子树内部的节点，可以一并删除；入口 fiber 自己的 sibling 属于父节点的
 *    其他孩子，不能碰）
 */
function removeChildFromDOM(parent: any, fiber: Fiber, isContainer: boolean): void {
  const hostConfig = getHostConfig()
  if (fiber.tag === HostComponent || fiber.tag === HostText) {
    // 顶层宿主节点：从外部 parent 删除，其 DOM 子孙随之移除
    if (isContainer) {
      hostConfig.removeChildFromContainer(parent, fiber.stateNode)
    } else {
      hostConfig.removeChild(parent, fiber.stateNode)
    }
    return
  }
  // 非宿主节点：递归其 child 链（child 的 sibling 均属被删子树内部，
  // 注意不能遍历入口 fiber 自己的 sibling——那是父节点的其他孩子）
  let child = fiber.child
  while (child !== null) {
    removeChildFromDOM(parent, child, isContainer)
    child = child.sibling
  }
}

/**
 * 递归执行卸载清理副作用（React 的 commitUnmount）：
 *  - 函数组件：依次调用 updateQueue 中所有 effect 的 destroy（按注册顺序）
 *  - 类组件：调用 componentWillUnmount
 *  - 递归 child + sibling 链，保证整棵被删子树都被清理
 */
function unmountFiberEffects(fiber: Fiber): void {
  if (fiber.tag === FunctionComponent && fiber.updateQueue !== null) {
    const effectList = fiber.updateQueue as any
    let effect = effectList
    do {
      if (effect.destroy) {
        try {
          effect.destroy()
        } catch (e) {
          console.error('Error during effect cleanup:', e)
        }
      }
      effect = effect.next
    } while (effect !== effectList)
  }
  if (fiber.tag === ClassComponent) {
    const instance = fiber.stateNode as ClassComponentInstance | null
    if (instance && typeof instance.componentWillUnmount === 'function') {
      try {
        instance.componentWillUnmount()
      } catch (e) {
        console.error('Error during componentWillUnmount:', e)
      }
    }
  }
  let child = fiber.child
  while (child !== null) {
    unmountFiberEffects(child)
    child = child.sibling
  }
}

/**
 * layout 阶段（React 的 commitLayoutEffectOnFiber）——在双缓冲切换后、浏览器绘制前
 * 同步执行：
 *  - 函数组件：执行 useLayoutEffect（HookLayout | HookHasEffect）的 create，保存 destroy
 *  - 类组件：
 *      · componentDidCatch（错误边界捕获后调用，带错误与组件栈）
 *      · componentDidMount（fiber.alternate === null，即首次挂载）
 *      · componentDidUpdate（Update flag 存在时，传上一次的 props/state）
 * 递归时用 LayoutMask(=Update) 剪枝。执行完清掉本节点 Update flag——
 * layout 生命周期已消费它，避免提交后 current 树残留（bailout 冒泡安全）。
 */
function commitLayoutEffects(root: FiberRoot, fiber: Fiber): void {
  // 自身
  if (fiber.tag === FunctionComponent && (fiber.flags & LayoutMask) !== NoFlags && fiber.updateQueue !== null) {
    const effectList = fiber.updateQueue as any
    let effect = effectList
    do {
      if ((effect.tag & HookLayout) !== 0 && (effect.tag & HookHasEffect) !== 0) {
        try {
          const destroy = effect.create()
          effect.destroy = destroy
        } catch (e) {
          console.error('Error in useLayoutEffect:', e)
        }
      }
      effect = effect.next
    } while (effect !== effectList)
  }
  if (fiber.tag === ClassComponent) {
    const instance = fiber.stateNode as ClassComponentInstance | null
    if (instance) {
      // componentDidCatch（错误边界捕获后调用）
      if ((instance as any)._caughtError !== undefined) {
        const error = (instance as any)._caughtError
        ;(instance as any)._caughtError = undefined
        try {
          instance.componentDidCatch!(error, { componentStack: '' })
        } catch (e) {
          console.error('Error in componentDidCatch:', e)
        }
      }
      if (fiber.alternate === null) {
        instance.componentDidMount?.()
      } else if ((fiber.flags & Update) !== NoFlags) {
        instance.componentDidUpdate?.(fiber.alternate.memoizedProps, fiber.alternate.memoizedState)
      }
    }
  }
  // 递归：遍历所有 child（含 sibling 链），按 自身flags | 子树flags 剪枝
  let child = fiber.child
  while (child !== null) {
    if (((child.subtreeFlags | child.flags) & LayoutMask) !== NoFlags) {
      commitLayoutEffects(root, child)
    }
    child = child.sibling
  }
  // layout 生命周期已消费 Update：清除，避免提交后 current 树残留（bailout 冒泡安全）
  fiber.flags &= ~LayoutMask
}

// ---------- Passive Effects（useEffect 异步执行）----------
/**
 * flush passive effects：在渲染前（performConcurrentWorkOnRoot / flushSyncWork 开头）
 * 统一执行上一次提交遗留的 useEffect（React 语义：passive effects 在下一次渲染前执行，
 * 保证与 layout 阶段的顺序关系）。执行后清 Passive 位，防止残留导致重复执行。
 */
function flushPassiveEffects(root: FiberRoot): void {
  const finishedWork = root.current
  commitPassiveEffectsOnFiber(finishedWork)
  // 清理已消费的 Passive 位：防止下轮渲染 bailout 冒泡残留 Passive 而重复执行 useEffect
  clearPassiveFlags(finishedWork)
  root._hasPassiveEffects = false
}

/** 清除整棵树的 Passive flags（useEffect 已执行完） */
function clearPassiveFlags(fiber: Fiber): void {
  fiber.flags &= ~PassiveMask
  fiber.subtreeFlags &= ~PassiveMask
  let child = fiber.child
  while (child !== null) {
    clearPassiveFlags(child)
    child = child.sibling
  }
}

/**
 * 递归执行 passive effects（React 的 commitPassiveMountEffects）：
 * 顺序对齐 React——先统一执行旧 effect 的 destroy（cleanup），再统一执行新 effect
 * 的 create。只处理带 Passive | HookHasEffect 标记的 effect（deps 未变的 effect 不执行）。
 */
function commitPassiveEffectsOnFiber(fiber: Fiber): void {
  if (fiber.tag === FunctionComponent && (fiber.flags & PassiveMask) !== NoFlags && fiber.updateQueue !== null) {
    const effectList = fiber.updateQueue as any
    // 先执行旧 effect 的 destroy，再执行新 effect 的 create
    let effect = effectList
    do {
      if ((effect.tag & HookPassive) !== 0 && (effect.tag & HookHasEffect) !== 0 && effect.destroy) {
        try {
          effect.destroy()
        } catch (e) {
          console.error('Error in useEffect cleanup:', e)
        }
      }
      effect = effect.next
    } while (effect !== effectList)
    effect = effectList
    do {
      if ((effect.tag & HookPassive) !== 0 && (effect.tag & HookHasEffect) !== 0) {
        try {
          const destroy = effect.create()
          effect.destroy = destroy
        } catch (e) {
          console.error('Error in useEffect:', e)
        }
      }
      effect = effect.next
    } while (effect !== effectList)
  }
  // 递归：遍历所有 child（含 sibling 链），按 自身flags | 子树flags 剪枝
  let child = fiber.child
  while (child !== null) {
    if (((child.subtreeFlags | child.flags) & PassiveMask) !== NoFlags) {
      commitPassiveEffectsOnFiber(child)
    }
    child = child.sibling
  }
}
