// ============================================================
// 核心类型定义：Fiber / Hook / Update / Element / Context / FiberRoot
// 对齐 React 19 react-reconciler 的数据结构（精简教学版）
// ============================================================
import type { Lane, Lanes } from '../scheduler'

// 供核心层使用的 lane 集合常量（scheduler 同步提供）
export const NoLanes: Lanes = 0

// re-export：核心层统一从 ./types 引入 lane 类型
export type { Lane, Lanes } from '../scheduler'

// ---------- Fiber Tag ----------
export const FunctionComponent = 0
export const ClassComponent = 1
export const HostRoot = 3
export const HostComponent = 5
export const HostText = 6
export const Fragment = 7
export const ContextProvider = 8
export const ContextConsumer = 9
export const SuspenseComponent = 13
export const OffscreenComponent = 22

export type WorkTag = number

// ---------- Flags（effect 标记，提交阶段按位处理）----------
export const NoFlags = 0b00000000000000000000000000000000
export const Placement = 0b00000000000000000000000000000010
export const Update = 0b00000000000000000000000000000100
export const Deletion = 0b00000000000000000000000000001000
export const ChildDeletion = 0b00000000000000000000001000000000
export const Passive = 0b00000000000000000000010000000000 // useEffect
export const Ref = 0b00000000000000000000100000000000
export const LayoutMask = Update

// ---------- Suspense 挂起原因 ----------
export const SuspendedOnData = 0
export const SuspendedOnError = 1
export const SuspendedOnImmediate = 2

// ---------- Root 退出状态 ----------
export const RootInProgress = 0
export const RootCompleted = 1
export const RootSuspended = 2
export const RootErrored = 3
export type RootExitStatus = number

// ---------- 执行上下文（用于批处理）----------
export const NoContext = 0b000
export const BatchedContext = 0b001
export const RenderContext = 0b010
export const CommitContext = 0b100

// ---------- Element ----------
export const REACT_ELEMENT_TYPE = Symbol.for('react.element')
export const REACT_FRAGMENT_TYPE = Symbol.for('react.fragment')
export const REACT_CONTEXT_TYPE = Symbol.for('react.context')
export const REACT_PROVIDER_TYPE = Symbol.for('react.provider')
export const REACT_SUSPENSE_TYPE = Symbol.for('react.suspense')

export interface ReactElement {
  $$typeof: symbol
  type: any
  key: string | null
  ref: any
  props: Record<string, any>
}

// ---------- Context ----------
export interface ReactContext<T> {
  $$typeof: symbol
  Provider: ReactProvider<T>
  _currentValue: T
}

export interface ReactProvider<T> {
  $$typeof: symbol
  _context: ReactContext<T>
}

// ---------- 宿主实例 ----------
// 由 reconcilerConfig 定义，DOM 渲染器实现；核心层只持有引用
export type HostInstance = any

// ---------- Update（state 更新）----------
export interface Update<S = any> {
  action: S | ((prev: S) => S)
  next: Update<S> | null
  lane: Lane
}

export interface UpdateQueue<S = any> {
  pending: Update<S> | null
  dispatch: ((action: any) => void) | null
  lastRenderedReducer: ((state: S, action: any) => S) | null
  lastRenderedState: S
}

// ---------- Hook ----------
export interface Hook {
  memoizedState: any
  baseState: any
  baseQueue: Update | null
  queue: UpdateQueue | null
  next: Hook | null
}

// ---------- Effect（useEffect / useLayoutEffect）----------
export const HookHasEffect = 0b001 // 本轮需要执行
export const HookLayout = 0b010 // useLayoutEffect
export const HookPassive = 0b100 // useEffect

export interface EffectState {
  tag: number
  create: () => (() => void) | void
  destroy: (() => void) | void
  deps: Array<any> | null
  next: EffectState | null
}

// ---------- Context 依赖（useContext 收集）----------
export interface ContextDependency {
  context: ReactContext<any>
  next: ContextDependency | null
}

// ---------- Fiber ----------
export interface Fiber {
  tag: WorkTag
  key: string | null
  type: any
  stateNode: any // 宿主实例 或 类实例
  ref: any

  return: Fiber | null
  sibling: Fiber | null
  child: Fiber | null
  index: number

  pendingProps: any
  memoizedProps: any
  memoizedState: any // Hook 链（函数组件）或 state（类组件）
  dependencies: ContextDependency | null // useContext 依赖链
  updateQueue: any

  flags: Flags
  subtreeFlags: Flags
  deletions: Fiber[] | null

  lanes: Lane
  childLanes: Lanes
  alternate: Fiber | null

  // Suspense
  fallback: any // Suspense 的 fallback 元素
  suspenseConfig: { didSuspend: boolean; thrownValue: any } | null
  // 本轮渲染是否挂起（handleThrow 设置，Suspense beginWork 消费）
  _didSuspend: boolean
  // 函数组件用（renderWithHooks 注入）
  _hookState: any
  // 错误边界临时错误（渲染阶段设置，类组件 beginWork 消费）
  _error: any
}

export type Flags = number

// ---------- FiberRoot ----------
export interface FiberRoot {
  containerInfo: HostInstance
  current: Fiber
  finishedWork: Fiber | null
  callbackNode: any | null // 调度器任务
  pendingLanes: Lanes
  expiredLanes: Lanes
  callbackPriority: number
  _hasPassiveEffects: boolean
  _pendingPassiveEffects: EffectState[] | null
}

// ---------- Lane 相关 ----------
export const NoLane: Lane = 0

// ---------- ClassComponent 生命周期（Error Boundary 用）----------
export interface ClassComponentInstance<P = any, S = any> {
  props: P
  state: S
  render: () => any
  getDerivedStateFromError?: (error: any) => Partial<S> | null
  componentDidCatch?: (error: any, info: any) => void
  componentDidMount?: () => void
  componentDidUpdate?: (prevProps: P, prevState: S) => void
  componentWillUnmount?: () => void
  _reactInternalFiber: Fiber | null
}

// ---------- 函数组件 props ----------
export interface FunctionComponent<P = Record<string, any>> {
  (props: P): any
  displayName?: string
}
