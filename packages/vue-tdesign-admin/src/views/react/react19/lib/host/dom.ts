// ============================================================
// DOM 渲染器 —— reconcilerConfig.dom 的默认实现
// 实现 HostConfig 接口，负责与浏览器 DOM 交互：
//   元素/文本创建、插入删除、属性 diff 更新、事件委托注册
// ============================================================
import type { HostConfig } from '../core/host'
import { internalFiberKey, internalPropsKey } from '../events'

// ---------- 属性名映射 ----------
function normalizePropKey(key: string): string {
  if (key === 'className') return 'class'
  if (key === 'htmlFor') return 'for'
  return key
}

function setStyle(dom: HTMLElement, style: Record<string, any> | null | undefined): void {
  if (style == null) return
  for (const key in style) {
    ;(dom.style as any)[key] = style[key]
  }
}

function applyProps(dom: HTMLElement, props: Record<string, any>): void {
  for (const key in props) {
    const value = props[key]
    if (key === 'children') continue
    if (key === 'key' || key === 'ref') continue
    if (key === 'style') {
      setStyle(dom, value)
      continue
    }
    if (key === 'dangerouslySetInnerHTML') {
      if (value && typeof value.__html === 'string') {
        dom.innerHTML = value.__html
      }
      continue
    }
    if (key.startsWith('on')) continue // 事件走委托，不在元素上绑定
    if (key === 'value' || key === 'checked' || key === 'selected') {
      ;(dom as any)[key] = value
      continue
    }
    const attrKey = normalizePropKey(key)
    if (attrKey === 'class') {
      dom.className = String(value ?? '')
      continue
    }
    if (attrKey in dom) {
      try {
        ;(dom as any)[attrKey] = value
      } catch {
        dom.setAttribute(attrKey, String(value))
      }
    } else if (value != null && value !== false) {
      dom.setAttribute(attrKey, String(value))
    }
  }
}

/** 对比新旧 props 并应用差异（仅更新变化的部分） */
function updateProps(
  dom: HTMLElement,
  oldProps: Record<string, any>,
  newProps: Record<string, any>,
): void {
  // 1. 删除旧属性
  for (const key in oldProps) {
    if (key === 'children' || key === 'key' || key === 'ref') continue
    if (key === 'style') continue
    if (key.startsWith('on')) continue
    if (!(key in newProps) || newProps[key] !== oldProps[key]) {
      const attrKey = normalizePropKey(key)
      if (attrKey === 'class') {
        dom.className = ''
      } else if (attrKey in dom) {
        try {
          ;(dom as any)[attrKey] = ''
        } catch {
          dom.removeAttribute(attrKey)
        }
      } else {
        dom.removeAttribute(attrKey)
      }
    }
  }
  // 2. 更新/新增属性
  for (const key in newProps) {
    if (key === 'children' || key === 'key' || key === 'ref') continue
    if (key === 'style') {
      if (newProps.style !== oldProps.style) {
        ;(dom as any).style.cssText = ''
        setStyle(dom, newProps.style)
      }
      continue
    }
    if (key.startsWith('on')) continue
    if (newProps[key] === oldProps[key]) continue
    const value = newProps[key]
    if (key === 'value' || key === 'checked' || key === 'selected') {
      ;(dom as any)[key] = value
      continue
    }
    const attrKey = normalizePropKey(key)
    if (attrKey === 'class') {
      dom.className = String(value ?? '')
      continue
    }
    if (attrKey in dom) {
      try {
        ;(dom as any)[attrKey] = value
      } catch {
        dom.setAttribute(attrKey, String(value))
      }
    } else if (value != null && value !== false) {
      dom.setAttribute(attrKey, String(value))
    }
  }
  // 3. 记录最新 props（事件委托在 dispatch 时读取）
  ;(dom as any)[internalPropsKey] = newProps
}

// ---------- HostConfig 实现 ----------
export const domConfig: HostConfig = {
  createInstance(type: string, props: Record<string, any>): HTMLElement {
    const dom = document.createElement(type)
    applyProps(dom, props)
    // 文本子节点（shouldSetTextContent 为 true 时 children 不在 fiber 树中，需直接设置）
    if (typeof props.children === 'string' || typeof props.children === 'number') {
      dom.textContent = String(props.children)
    }
    ;(dom as any)[internalPropsKey] = props
    return dom
  },

  createTextInstance(text: string): Text {
    return document.createTextNode(text)
  },

  appendChild(parentInstance: HTMLElement, child: Node): void {
    parentInstance.appendChild(child)
  },

  appendChildToContainer(container: HTMLElement, child: Node): void {
    container.appendChild(child)
  },

  insertBefore(parentInstance: HTMLElement, child: Node, beforeChild: Node): void {
    parentInstance.insertBefore(child, beforeChild)
  },

  insertInContainerBefore(container: HTMLElement, child: Node, beforeChild: Node): void {
    container.insertBefore(child, beforeChild)
  },

  removeChild(parentInstance: HTMLElement, child: Node): void {
    parentInstance.removeChild(child)
  },

  removeChildFromContainer(container: HTMLElement, child: Node): void {
    container.removeChild(child)
  },

  commitUpdate(
    instance: HTMLElement,
    _type: string,
    oldProps: Record<string, any>,
    newProps: Record<string, any>,
  ): void {
    // 纯文本子节点（shouldSetTextContent 优化路径，children 不在 fiber 树中）：
    // 变化时直接更新 textContent
    if (
      newProps.children !== oldProps.children &&
      (typeof newProps.children === 'string' || typeof newProps.children === 'number')
    ) {
      instance.textContent = String(newProps.children)
    }
    updateProps(instance, oldProps, newProps)
  },

  commitTextUpdate(textInstance: Text, _oldText: string, newText: string): void {
    if (textInstance.nodeValue !== newText) {
      textInstance.nodeValue = newText
    }
  },

  shouldSetTextContent(_type: string, props: Record<string, any>): boolean {
    return typeof props.children === 'string' || typeof props.children === 'number'
  },

  isTextInstance(instance: any): boolean {
    return instance != null && instance.nodeType === 3 // Node.TEXT_NODE
  },

  attachInstanceMeta(instance: HTMLElement, fiber: unknown): void {
    ;(instance as any)[internalFiberKey] = fiber
  },
}
