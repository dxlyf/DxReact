// ============================================================
// 事件系统：根节点事件委托 + 自动批处理
// 对齐 React 事件模型（简化版）：
//   - 事件统一委托到 root 容器监听，通过 target 上的 fiber 引用沿树查找 handler
//   - dispatchEvent 在 batchedUpdates 中执行，天然支持自动批处理
// ============================================================
import type { Fiber } from './core/types'
import { ClassComponent, HostComponent, NoContext, BatchedContext, RenderContext, CommitContext } from './core/types'

// ---------- 执行上下文（批处理边界）----------
let executionContext: number = NoContext

export function getExecutionContext(): number {
  return executionContext
}

export function setExecutionContext(ctx: number): void {
  executionContext = ctx
}

/** 批量执行：事件回调内多次 setState 只触发一次调度（自动批处理） */
export function batchedUpdates<A, R>(fn: (a: A) => R, a: A): R {
  const prevExecutionContext = executionContext
  executionContext |= BatchedContext
  try {
    return fn(a)
  } finally {
    executionContext = prevExecutionContext
  }
}

export function isBatching(): boolean {
  return (executionContext & (BatchedContext | RenderContext | CommitContext)) !== NoContext
}

// ---------- DOM 实例上的内部引用 key ----------
export const internalFiberKey = '__reactFiber$r19'
export const internalPropsKey = '__reactProps$r19'

export type EventHandler = (event: Event) => void

// 支持委托的事件类型（React 由 registrationNameDependencies 推导，这里枚举常用）
const delegatedEventTypes = [
  'click',
  'dblclick',
  'contextmenu',
  'input',
  'change',
  'submit',
  'keydown',
  'keyup',
  'keypress',
  'focus',
  'blur',
  'mouseenter',
  'mouseleave',
  'mousemove',
  'mousedown',
  'mouseup',
  'wheel',
  'touchstart',
  'touchmove',
  'touchend',
]

/** 事件委托处理器（由 DOM 渲染器在 root 容器上注册） */
export function dispatchEvent(event: Event): void {
  const propKey = eventToPropKey(event.type)
  if (propKey === null) return

  // target 可能是文本节点（无 fiber 引用），沿 DOM 向上找最近的宿主元素
  let target = (event.target as HTMLElement) || (event.currentTarget as HTMLElement)
  while (target != null && (target as any)[internalFiberKey] == null) {
    target = target.parentNode as HTMLElement
  }

  // React 19 事件委托：从 target 沿 fiber return 链向上找最近的 handler
  const fiber: Fiber | null = target != null ? ((target as any)[internalFiberKey] as Fiber) : null

  const handler = findEventHandler(fiber, propKey)
  if (handler !== null) {
    batchedUpdates(() => {
      handler(event)
    }, event)
  }
}

function findEventHandler(fiber: Fiber | null, propKey: string): EventHandler | null {
  let node: Fiber | null = fiber
  while (node !== null) {
    if (node.tag === HostComponent) {
      // 从 DOM 读最新 props（commit 时已更新 internalPropsKey），
      // 而非 fiber.memoizedProps——DOM 上挂的 fiber 引用是 mount 时的旧对象
      const dom = node.stateNode as any
      const props = dom != null ? dom[internalPropsKey] : node.memoizedProps
      if (props && typeof props[propKey] === 'function') {
        return props[propKey]
      }
    } else if (node.tag === ClassComponent) {
      const props = node.memoizedProps
      if (props && typeof props[propKey] === 'function') {
        return props[propKey]
      }
    }
    node = node.return
  }
  return null
}

/** 事件类型 → props 属性名（click → onClick） */
function eventToPropKey(eventType: string): string | null {
  // React 语义：受控组件的 onChange 在 DOM 上监听 'input' 事件
  if (eventType === 'input') return 'onChange'
  return 'on' + eventType.charAt(0).toUpperCase() + eventType.slice(1)
}

/** DOM 渲染器调用：在 root 容器上注册事件委托 */
export function addDelegatedEventListeners(container: HTMLElement): void {
  for (const type of delegatedEventTypes) {
    container.addEventListener(type, dispatchEvent)
  }
}
