// React 19 渲染器 - 基于现代DOM操作

import type { Fiber, Props, HostConfig, EffectTag } from './types';
import { commitHookEffects, cleanupHookEffects } from './hooks';

// 默认宿主配置（DOM环境）
const defaultHostConfig: HostConfig = {
  // DOM 创建
  createElement: (type: string, props: Props): HTMLElement => {
    const element = document.createElement(type);
    updateDOMProperties(element, {}, props);
    return element;
  },
  
  createTextNode: (text: string): Text => {
    return document.createTextNode(text);
  },
  
  // DOM 操作
  appendChild: (parent: Node, child: Node): void => {
    parent.appendChild(child);
  },
  
  removeChild: (parent: Node, child: Node): void => {
    parent.removeChild(child);
  },
  
  insertBefore: (parent: Node, child: Node, before: Node | null): void => {
    parent.insertBefore(child, before);
  },
  
  // 属性操作
  setAttribute: (element: Element, key: string, value: any): void => {
    if (key === 'className') {
      element.className = value || '';
    } else if (key === 'style') {
      if (typeof value === 'string') {
        element.style.cssText = value;
      } else if (typeof value === 'object') {
        element.style.cssText = '';
        for (const styleName in value) {
          element.style[styleName as any] = value[styleName];
        }
      }
    } else if (key.startsWith('on')) {
      // 事件处理
      const eventName = key.toLowerCase().slice(2);
      element.addEventListener(eventName, value);
    } else {
      element.setAttribute(key, String(value));
    }
  },
  
  removeAttribute: (element: Element, key: string): void => {
    if (key === 'className') {
      element.className = '';
    } else if (key === 'style') {
      element.style.cssText = '';
    } else if (key.startsWith('on')) {
      const eventName = key.toLowerCase().slice(2);
      element.removeEventListener(eventName, (element as any)[`_${key}`]);
    } else {
      element.removeAttribute(key);
    }
  },
  
  // 事件系统
  addEventListener: (element: Element, event: string, handler: EventListener): void => {
    element.addEventListener(event, handler);
  },
  
  removeEventListener: (element: Element, event: string, handler: EventListener): void => {
    element.removeEventListener(event, handler);
  },
  
  // 文本内容
  setTextContent: (node: Node, text: string): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      (node as Text).data = text;
    }
  },
};

let hostConfig = defaultHostConfig;

// 设置宿主配置
export function setHostConfig(config: Partial<HostConfig>): void {
  hostConfig = { ...defaultHostConfig, ...config };
}

// 创建DOM节点
export function createDOM(fiber: Fiber): Node {
  const { type, pendingProps } = fiber;
  
  if (typeof type === 'string') {
    // 宿主组件
    return hostConfig.createElement(type, pendingProps);
  } else if (type === 'TEXT_ELEMENT') {
    // 文本节点
    return hostConfig.createTextNode(pendingProps.nodeValue || '');
  }
  
  // 函数组件没有对应的DOM节点
  return document.createComment('function-component');
}

// 更新DOM属性
export function updateDOMProperties(
  element: Element,
  prevProps: Props,
  nextProps: Props
): void {
  // 移除旧属性
  for (const key in prevProps) {
    if (key !== 'children' && !(key in nextProps)) {
      hostConfig.removeAttribute(element, key);
    }
  }
  
  // 设置新属性
  for (const key in nextProps) {
    if (key !== 'children' && prevProps[key] !== nextProps[key]) {
      hostConfig.setAttribute(element, key, nextProps[key]);
    }
  }
}

// 提交根节点
export function commitRoot(finishedWork: Fiber): void {
  // 提交变更副作用
  commitMutationEffects(finishedWork);
  
  // 提交布局副作用
  commitLayoutEffects(finishedWork);
  
  // 提交被动副作用
  commitPassiveEffects(finishedWork);
}

// 提交变更副作用
function commitMutationEffects(finishedWork: Fiber): void {
  let nextEffect: Fiber | null = finishedWork;
  
  while (nextEffect !== null) {
    const fiber = nextEffect;
    
    // 处理删除
    if ((fiber.flags & EffectTag.Delete) !== EffectTag.None) {
      commitDeletion(fiber);
    }
    
    // 处理插入
    if ((fiber.flags & EffectTag.Placement) !== EffectTag.None) {
      commitPlacement(fiber);
    }
    
    // 处理更新
    if ((fiber.flags & EffectTag.Update) !== EffectTag.None) {
      commitUpdate(fiber);
    }
    
    nextEffect = nextEffect.child;
  }
}

// 提交布局副作用
function commitLayoutEffects(finishedWork: Fiber): void {
  let nextEffect: Fiber | null = finishedWork;
  
  while (nextEffect !== null) {
    const fiber = nextEffect;
    
    // 处理布局副作用
    if ((fiber.flags & EffectTag.Layout) !== EffectTag.None) {
      commitHookEffects(fiber);
    }
    
    nextEffect = nextEffect.child;
  }
}

// 提交被动副作用
function commitPassiveEffects(finishedWork: Fiber): void {
  let nextEffect: Fiber | null = finishedWork;
  
  while (nextEffect !== null) {
    const fiber = nextEffect;
    
    // 处理被动副作用
    if ((fiber.flags & EffectTag.Passive) !== EffectTag.None) {
      // 延迟执行useEffect
      setTimeout(() => {
        commitHookEffects(fiber);
      }, 0);
    }
    
    nextEffect = nextEffect.child;
  }
}

// 提交删除操作
function commitDeletion(fiber: Fiber): void {
  if (fiber.stateNode) {
    const parent = getParentDOM(fiber);
    if (parent) {
      hostConfig.removeChild(parent, fiber.stateNode);
    }
    
    // 清理副作用
    cleanupHookEffects(fiber);
  }
  
  // 递归删除子节点
  let child = fiber.child;
  while (child !== null) {
    commitDeletion(child);
    child = child.sibling;
  }
}

// 提交插入操作
function commitPlacement(fiber: Fiber): void {
  const parent = getParentDOM(fiber);
  if (!parent || !fiber.stateNode) return;
  
  const before = getHostSibling(fiber);
  hostConfig.insertBefore(parent, fiber.stateNode, before);
}

// 提交更新操作
function commitUpdate(fiber: Fiber): void {
  if (fiber.stateNode && fiber.alternate) {
    const prevProps = fiber.alternate.memoizedProps;
    const nextProps = fiber.memoizedProps;
    
    if (typeof fiber.type === 'string') {
      // 宿主组件更新
      updateDOMProperties(fiber.stateNode as Element, prevProps, nextProps);
    } else if (fiber.type === 'TEXT_ELEMENT') {
      // 文本节点更新
      if (prevProps.nodeValue !== nextProps.nodeValue) {
        hostConfig.setTextContent(fiber.stateNode, nextProps.nodeValue || '');
      }
    }
  }
}

// 获取父级DOM节点
function getParentDOM(fiber: Fiber): Node | null {
  let parent = fiber.return;
  
  while (parent !== null) {
    if (parent.stateNode) {
      return parent.stateNode;
    }
    parent = parent.return;
  }
  
  return null;
}

// 获取宿主兄弟节点
function getHostSibling(fiber: Fiber): Node | null {
  let node: Fiber | null = fiber;
  
  while (node !== null) {
    // 查找兄弟节点
    if (node.sibling !== null) {
      node = node.sibling;
      
      // 查找第一个有DOM节点的子节点
      while (node !== null && !node.stateNode) {
        if (node.child === null) {
          node = node.sibling;
        } else {
          node = node.child;
        }
      }
      
      if (node !== null && node.stateNode) {
        return node.stateNode;
      }
    }
    
    // 向上查找
    node = node.return;
  }
  
  return null;
}

// 渲染函数
export function render(element: any, container: Element): void {
  // 创建根Fiber
  const rootFiber = {
    tag: 3, // HostRoot
    type: 'ROOT',
    key: null,
    pendingProps: { children: element },
    memoizedProps: null,
    memoizedState: null,
    stateNode: container,
    return: null,
    child: null,
    sibling: null,
    index: 0,
    flags: EffectTag.None,
    subtreeFlags: EffectTag.None,
    deletions: null,
    updateQueue: null,
    lanes: 0,
    childLanes: 0,
    alternate: null,
    mode: 0,
  } as Fiber;
  
  // 开始渲染
  scheduleRender(rootFiber);
}

// 调度渲染
function scheduleRender(rootFiber: Fiber): void {
  // 这里应该调用调度器
  // 简化实现：直接执行渲染
  performSyncWorkOnRoot(rootFiber);
}

// 同步渲染根节点
function performSyncWorkOnRoot(rootFiber: Fiber): void {
  // 创建工作中的根节点
  const workInProgress = {
    ...rootFiber,
    alternate: rootFiber,
  };
  
  // 执行工作循环
  workLoopSync(workInProgress);
  
  // 提交更新
  commitRoot(workInProgress);
}

// 同步工作循环
function workLoopSync(workInProgress: Fiber): void {
  let nextUnitOfWork: Fiber | null = workInProgress;
  
  while (nextUnitOfWork !== null) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
}

// 执行工作单元
function performUnitOfWork(unit: Fiber): Fiber | null {
  // 开始工作
  const next = beginWork(null, unit);
  
  if (next === null) {
    // 完成工作
    return completeUnitOfWork(unit);
  }
  
  return next;
}

// 开始工作（简化实现）
function beginWork(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  // 这里应该调用Fiber系统的beginWork
  // 简化实现：直接返回子节点
  return workInProgress.child;
}

// 完成工作单元
function completeUnitOfWork(unit: Fiber): Fiber | null {
  // 完成当前工作
  completeWork(null, unit);
  
  // 处理兄弟节点
  if (unit.sibling !== null) {
    return unit.sibling;
  }
  
  // 处理父节点
  return unit.return;
}

// 完成工作（简化实现）
function completeWork(current: Fiber | null, workInProgress: Fiber): void {
  // 这里应该调用Fiber系统的completeWork
  // 简化实现：设置memoizedProps
  workInProgress.memoizedProps = workInProgress.pendingProps;
}

// 卸载组件
export function unmountComponentAtNode(container: Element): boolean {
  // 查找容器对应的根Fiber
  // 简化实现：直接清空容器
  container.innerHTML = '';
  return true;
}

// 创建Portal（实验性）
export function createPortal(children: any, container: Element, key?: string): any {
  return {
    type: 'PORTAL',
    props: {
      children,
      container,
      key,
    },
  };
}

// 渲染器配置
export const RendererConfig = {
  setHostConfig,
  getHostConfig: () => hostConfig,
};

// 性能监控
export const RendererPerformance = {
  measureCommit: (label: string) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-commit-start`);
      
      return () => {
        performance.mark(`${label}-commit-end`);
        performance.measure(`${label}-commit`, `${label}-commit-start`, `${label}-commit-end`);
      };
    }
    
    return () => {};
  },
};