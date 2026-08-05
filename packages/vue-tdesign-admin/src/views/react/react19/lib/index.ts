// ============================================================
// 对外 API 聚合导出（对齐 React 19 API 风格）
// ============================================================
import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE, REACT_SUSPENSE_TYPE } from './core/types'
import type { ReactElement } from './core/types'
import { createRoot, render as renderRoot, registerHostConfig, updateContainer, scheduleUpdateOnFiber } from './core/reconciler'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useTransition,
  startTransition,
} from './core/hooks'
import { domConfig } from './host/dom'
import { DefaultLane } from './scheduler'
import type { Lane } from './scheduler'
import type { HostConfig } from './core/host'
import { flattenChildren } from './core/children'

// 注册默认 DOM 渲染器（reconcilerConfig.dom）
registerHostConfig(domConfig)

// ---------- createElement ----------
export function createElement(
  type: any,
  config: Record<string, any> | null,
  ...children: any[]
): ReactElement {
  let key: string | null = null
  let ref: any = null
  const props: Record<string, any> = {}
  if (config != null) {
    for (const name in config) {
      if (name === 'key') {
        key = String(config[name])
      } else if (name === 'ref') {
        ref = config[name]
      } else {
        props[name] = config[name]
      }
    }
  }
  // 构造 children 时统一扁平化（静态节点与数组混排、嵌套数组、条件表达式）
  // → reconciler 只需处理一维数组；过滤 null/undefined/boolean
  if (children.length === 1) {
    const only = children[0]
    props.children = Array.isArray(only) ? flattenChildren(only) : only
  } else if (children.length > 1) {
    props.children = flattenChildren(children)
  }
  return { $$typeof: REACT_ELEMENT_TYPE, type, key, ref, props }
}

// ---------- 特殊组件（类型放宽为 any，便于 JSX 使用）----------
export const Fragment: any = REACT_FRAGMENT_TYPE
export const Suspense: any = REACT_SUSPENSE_TYPE

// ---------- Component 基类（类组件 / ErrorBoundary）----------
export class Component<P = Record<string, any>, S = Record<string, any>> {
  props: P
  state: S
  refs: Record<string, any>
  _reactInternalFiber: any

  constructor(props: P) {
    this.props = props
    this.state = {} as S
    this.refs = {}
  }

  setState(partialState: Partial<S> | ((prev: S) => Partial<S>)): void {
    const nextState =
      typeof partialState === 'function'
        ? (partialState as (prev: S) => Partial<S>)(this.state)
        : partialState
    this.state = { ...this.state, ...nextState }
    const fiber = this._reactInternalFiber
    if (fiber !== undefined && fiber !== null) {
      scheduleClassUpdate(fiber, DefaultLane)
    }
  }

  forceUpdate(): void {
    const fiber = this._reactInternalFiber
    if (fiber !== undefined && fiber !== null) {
      scheduleClassUpdate(fiber, DefaultLane)
    }
  }

  render(): any {
    throw new Error('Component.render() must be implemented')
  }
}

// 类组件更新调度（通过 reconciler 导出，避免 hooks 循环依赖问题）
function scheduleClassUpdate(fiber: any, lane: Lane): void {
  scheduleUpdateOnFiber(fiber, lane)
}

/** ErrorBoundary 便捷封装：props.fallback 渲染错误 UI */
export class ErrorBoundary extends Component {
  state = { error: null as any }

  static getDerivedStateFromError(error: any): Record<string, any> {
    return { error }
  }

  render(): any {
    if (this.state.error !== null) {
      const fallback = this.props.fallback
      if (typeof fallback === 'function') {
        return fallback(this.state.error)
      }
      return fallback ?? null
    }
    return this.props.children
  }
}

// ---------- Hooks ----------
export {
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

// ---------- use（React 19，可选：消费 Promise 资源，挂起于 Suspense）----------
export function use<T>(resource: T | Promise<T>): T {
  if (resource !== null && typeof resource === 'object' && typeof (resource as any).then === 'function') {
    const thenable = resource as any
    if (thenable._status === 'fulfilled') {
      return thenable._value as T
    }
    if (thenable._status === 'rejected') {
      throw thenable._reason
    }
    if (thenable._status === undefined) {
      thenable._status = 'pending'
      thenable.then(
        (value: T) => {
          thenable._status = 'fulfilled'
          thenable._value = value
        },
        (reason: any) => {
          thenable._status = 'rejected'
          thenable._reason = reason
        },
      )
    }
    // pending：throw 触发 Suspense 挂起
    throw resource
  }
  return resource as T
}

// ---------- useSyncExternalStore（可选）----------
export function useSyncExternalStore(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => any,
): any {
  const value = getSnapshot()
  const [, forceUpdate] = useState({})
  const ref = useRef({ value, subscribe })
  ref.current.value = value
  ref.current.subscribe = subscribe
  useEffect(() => {
    let active = true
    const checkSnapshot = (): void => {
      if (!active) return
      const nextValue = getSnapshot()
      if (nextValue !== ref.current.value) {
        forceUpdate({})
      }
    }
    const unsubscribe = subscribe(checkSnapshot)
    return () => {
      active = false
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe])
  return value
}

// ---------- 渲染入口 ----------
export { createRoot, renderRoot as render, updateContainer }

// ---------- reconcilerConfig（可插拔宿主）----------
export { registerHostConfig }
export type { HostConfig }
