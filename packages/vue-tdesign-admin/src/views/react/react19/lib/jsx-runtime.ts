// ============================================================
// JSX 运行时（react/jsx-runtime 等价物）
// 配合 tsconfig jsx: "react-jsx" + jsxImportSource 使用
// ============================================================
import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from './core/types'
import type { ReactElement } from './core/types'
import { flattenChildren } from './core/children'

function jsxImpl(type: any, config: Record<string, any> | null, maybeKey: string | null): ReactElement {
  let key: string | null = maybeKey ?? null
  let ref: any = null
  const props: Record<string, any> = {}
  if (config != null) {
    for (const name in config) {
      if (name === 'key') {
        key = String(config[name])
      } else if (name === 'ref') {
        ref = config[name]
      } else if (name === 'children') {
        // 构造 children 时统一扁平化（与 createElement 一致），
        // reconciler 只需处理一维数组
        props.children = Array.isArray(config[name]) ? flattenChildren(config[name]) : config[name]
      } else {
        props[name] = config[name]
      }
    }
  }
  return { $$typeof: REACT_ELEMENT_TYPE, type, key, ref, props }
}

/** automatic runtime：单 children */
export function jsx(type: any, config: Record<string, any> | null, maybeKey?: string | null): ReactElement {
  return jsxImpl(type, config, maybeKey ?? null)
}

/** automatic runtime：多 children（数组） */
export function jsxs(type: any, config: Record<string, any> | null, maybeKey?: string | null): ReactElement {
  return jsxImpl(type, config, maybeKey ?? null)
}

/** dev 版本 */
export function jsxDEV(type: any, config: Record<string, any> | null, key?: string | null): ReactElement {
  return jsxImpl(type, config, key ?? null)
}

export { REACT_FRAGMENT_TYPE as Fragment }

// ---------- JSX 类型（react-jsx 模式通过 jsxImportSource 解析）----------
export namespace JSX {
  type Element = import('./core/types').ReactElement
  type ElementType = any
  interface IntrinsicAttributes {
    key?: string | number | null
  }
  interface IntrinsicElements {
    [elemName: string]: any
  }
  interface ElementChildrenAttribute {
    children: any
  }
}
