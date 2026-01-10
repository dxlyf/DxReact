import type { Fiber, VNode, Props, ReactNode, FiberTag } from './types';
import { Priority, EffectTag, FiberTag as FiberTagEnum } from './types';
import { getChildrenArray } from './vdom';

// 创建新的 Fiber 节点
export function createFiber(
  tag: Fiber['tag'],
  type: Fiber['type'],
  props: Props,
  key: string |number| null = null,
  mode: number = 0,
  priority: Priority = Priority.NormalPriority
): Fiber {
  return {
    ref: null,
    // 静态属性
    tag,
    type,
    key,
    mode,
    priority,
    
    // 树结构
    child: null,
    sibling: null,
    return: null,
    index: 0,
    
    // 工作单元相关
    stateNode: null,
    props,
    memoizedProps: null,
    memoizedState: null,
    
    // 效果标记
    flags: 0,
    subtreeFlags: 0,
    
    // 副作用链表
    effectTag: EffectTag.None,
    nextEffect: null,
    firstEffect: null,
    lastEffect: null,
    
    // 替代/备份相关
    alternate: null,
    pendingProps: props,
  };
}

// 创建 work-in-progress fiber
export function createWorkInProgress(current: Fiber, pendingProps: Props): Fiber {
  // 复用现有 fiber 或者创建新的
  let workInProgress = current.alternate;
  if (!workInProgress) {
    // 第一次渲染，创建新的 fiber
    workInProgress = createFiber(current.tag, current.type, pendingProps, current.key);
    workInProgress.stateNode = current.stateNode;
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // 更新阶段，重置属性
    workInProgress.pendingProps = pendingProps;
    // 清除副作用标记
    workInProgress.effectTag = 0;
    // 清除副作用链表
    workInProgress.nextEffect = null;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;
  }
  
  // 复制其他属性
  workInProgress.type = current.type;
  workInProgress.child = current.child;
  workInProgress.sibling = current.sibling;
  workInProgress.return = current.return;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.dependencies = current.dependencies;
  workInProgress.expirationTime = current.expirationTime;
  workInProgress.priority = current.priority;
  
  return workInProgress;
}

// reconcileChildren 函数
export function reconcileChildren(current: Fiber | null, workInProgress: Fiber, nextChildren: ReactNode | undefined): void {
  if (current === null) {
    // 初次渲染
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
  } else {
    // 更新渲染
    workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren);
  }
}

// 挂载子节点（初次渲染）
function mountChildFibers(parentFiber: Fiber, _previousFiber: Fiber | null, newChildren: ReactNode | undefined): Fiber | null {
  const children = getChildrenArray(newChildren);
  if (!children || children.length === 0) {
    return null;
  }
  
  let firstChild: Fiber | null = null;
  let prevFiber: Fiber | null = null;
  
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child === null || child === undefined) continue;
    
    const newFiber = createChildFiber(parentFiber, child, i);
    if (!newFiber) continue;
    
    if (prevFiber === null) {
      firstChild = newFiber;
    } else {
      prevFiber.sibling = newFiber;
    }
    
    prevFiber = newFiber;
  }
  
  return firstChild;
}

// reconcile 子节点（更新阶段）
function reconcileChildFibers(parentFiber: Fiber, currentFirstChild: Fiber | null, newChildren: ReactNode | undefined): Fiber | null {
  const children = getChildrenArray(newChildren);
  const childCount = children ? children.length : 0;
  
  // 处理空 children 的情况
  if (childCount === 0) {
    // 删除所有现有子节点
    if (currentFirstChild) {
      deleteRemainingChildren(parentFiber, currentFirstChild);
    }
    return null;
  }
  
  // 创建一个基于 key 的映射，用于优化 diff
  const existingChildren = new Map<string | number, Fiber>();
  let existingChild = currentFirstChild;
  while (existingChild) {
    const key = existingChild.key !== null ? existingChild.key : existingChild.index;
    existingChildren.set(key, existingChild);
    existingChild = existingChild.sibling;
  }
  
  let firstChild: Fiber | null = null;
  let prevFiber: Fiber | null = null;
  
  // 处理新的子节点
  for (let i = 0; i < childCount; i++) {
    const child = children![i];
    if (child === null || child === undefined) continue;
    
    // 尝试通过 key 找到可复用的 fiber
    let newFiber: Fiber | null = null;
    
    if (typeof child === 'object' && child !== null && 'key' in child && child.key !== null) {
      const matchedFiber = existingChildren.get(child.key);
      if (matchedFiber && shouldSameNodeType(matchedFiber, child)) {
        // 找到匹配的 fiber，复用它
        newFiber = createWorkInProgress(matchedFiber, (child as VNode).props);
        markUpdate(newFiber);
        existingChildren.delete(child.key);
      }
    }
    
    // 如果没找到可复用的 fiber，创建新的
    if (!newFiber) {
      newFiber = createChildFiber(parentFiber, child, i);
      if (newFiber) {
        markPlacement(newFiber);
      }
    }
    
    if (!newFiber) continue;
    
    // 建立链表关系
    if (prevFiber === null) {
      firstChild = newFiber;
    } else {
      prevFiber.sibling = newFiber;
    }
    
    prevFiber = newFiber;
  }
  
  // 删除未被复用的旧节点
  existingChildren.forEach(child => {
    markDelete(child);
  });
  
  return firstChild;
}



// 创建子 fiber 节点
function createChildFiber(parentFiber: Fiber, element: ReactNode, _index: number): Fiber | null {
  if (typeof element === 'string' || typeof element === 'number') {
    return createFiberFromText(element, parentFiber);
  } else if (typeof element === 'object' && element !== null) {
    return createFiberFromElement(element as VNode, parentFiber);
  }
  return null;
}

// 删除剩余的子节点
function deleteRemainingChildren(_parentFiber: Fiber, currentFirstChild: Fiber): void {
  let child = currentFirstChild;
  while (child) {
    markDelete(child);
    child = child.sibling;
  }
}

// 检查两个节点是否是相同类型，可以复用
function shouldSameNodeType(fiber: Fiber, element: ReactNode): boolean {
  if (typeof element === 'object' && element !== null && 'type' in element) {
    const vnode = element as VNode;
    return fiber.type === vnode.type;
  }
  return fiber.type === 'TEXT_ELEMENT';
}

// 标记为需要删除
export function markDelete(fiber: Fiber): void {
  fiber.effectTag |= EffectTag.Delete;
}

// 标记为需要更新（简单版本）
export function markUpdate(fiber: Fiber): void {
  fiber.effectTag |= EffectTag.Update;
}

// 标记为需要放置
export function markPlacement(fiber: Fiber): void {
  fiber.effectTag |= EffectTag.Placement;
}

// 根据 VNode 创建 Fiber 节点
export function createFiberFromElement(element: VNode, parentFiber?: Fiber): Fiber {
  let tag: FiberTag;
  if (typeof element.type === 'string') {
    tag = FiberTagEnum.HostComponent;
  } else if (typeof element.type === 'function' && 'prototype' in element.type && typeof (element.type as any).prototype.render === 'function') {
    tag = FiberTagEnum.ClassComponent;
  } else {
    tag = FiberTagEnum.FunctionComponent;
  }
  const fiber = createFiber(tag, element.type, element.props, element.key !== undefined ? String(element.key) : null);
  if (parentFiber) {
    fiber.return = parentFiber;
  }
  return fiber;
}

// 根据文本内容创建 Fiber 节点
export function createFiberFromText(content: string | number, parentFiber?: Fiber): Fiber {
  const fiber = createFiber(FiberTagEnum.HostText, 'TEXT_ELEMENT', { nodeValue: String(content) }, null);
  if (parentFiber) {
    fiber.return = parentFiber;
  }
  return fiber;
}

// 克隆 Fiber 节点
export function cloneFiber(fiber: Fiber, priority?: Priority): Fiber {
  const newFiber = createFiber(
    fiber.tag,
    fiber.type,
    fiber.pendingProps,
    fiber.key,
    fiber.mode,
    priority !== undefined ? priority : fiber.priority
  );
  
  // 复制状态和引用
  newFiber.stateNode = fiber.stateNode;
  newFiber.memoizedProps = fiber.memoizedProps;
  newFiber.memoizedState = fiber.memoizedState;
  newFiber.flags = fiber.flags;
  newFiber.subtreeFlags = fiber.subtreeFlags;
  newFiber.alternate = fiber;
  
  return newFiber;
}

// 设置 Fiber 节点的子节点
export function setChildFibers(parent: Fiber, children: ReactNode): void {
  const childArray = getChildrenArray(children);
  let previousFiber: Fiber | null = null;
  
  for (let i = 0; i < childArray.length; i++) {
    const child = childArray[i];
    let newFiber: Fiber | null = null;
    
    // 跳过 null/undefined
    if (child === null || child === undefined) {
      continue;
    }
    
    // 创建 Fiber
    if (typeof child === 'string' || typeof child === 'number') {
      newFiber = createFiberFromText(String(child));
    } else if (typeof child === 'object' && child && 'type' in child) {
      newFiber = createFiberFromElement(child as VNode);
    }
    
    if (newFiber) {
      // 设置父子关系
      newFiber.return = parent;
      newFiber.index = i;
      
      // 设置兄弟关系
      if (previousFiber) {
        previousFiber.sibling = newFiber;
      } else {
        parent.child = newFiber;
      }
      
      previousFiber = newFiber;
    }
  }
}

// 标记 Fiber 节点及其子树的变更（带优先级）
export function markUpdateWithPriority(fiber: Fiber, priority: Priority): void {
  // 更新优先级
  if (fiber.priority > priority) {
    fiber.priority = priority;
  }
  
  // 标记为需要更新
  fiber.flags |= EffectTag.Update;
  
  // 向上冒泡更新标记
  let parent: Fiber | null = fiber.return;
  while (parent) {
    if (parent.subtreeFlags & EffectTag.Update) {
      // 父节点已经有更新标记，停止冒泡
      break;
    }
    parent.subtreeFlags |= EffectTag.Update;
    
    // 更新父节点优先级
    if (parent.priority > priority) {
      parent.priority = priority;
    }
    
    parent = parent.return;
  }
}

// 创建 Fiber 根节点
export function createHostRootFiber(containerInfo: any, priority: Priority = Priority.NormalPriority): Fiber {
  const rootFiber = createFiber(
    FiberTagEnum.HostRoot,
    'ROOT',
    { children: null },
    null,
    0,
    priority
  );
  rootFiber.stateNode = containerInfo;
  return rootFiber;
}

// 获取 Fiber 树中的下一个工作单元
export function getNextWorkUnit(workInProgress: Fiber | null): Fiber | null {
  // 深度优先搜索
  if (workInProgress?.child) {
    return workInProgress.child;
  }
  
  let node: Fiber | null = workInProgress;
  while (node) {
    if (node.sibling) {
      return node.sibling;
    }
    node = node.return;
  }
  
  return null;
}

// 收集副作用链表
export function collectEffectList(fiber: Fiber): void {
  let firstEffect: Fiber | null = null;
  let lastEffect: Fiber | null = null;
  
  // 收集当前 Fiber 的副作用
  if (fiber.effectTag !== EffectTag.None) {
    firstEffect = fiber;
    lastEffect = fiber;
  }
  
  // 递归收集子树的副作用
  let child = fiber.child;
  while (child) {
    collectEffectList(child);
    
    if (child.firstEffect) {
      if (lastEffect) {
        lastEffect.nextEffect = child.firstEffect;
      } else {
        firstEffect = child.firstEffect;
      }
      lastEffect = child.lastEffect;
    }
    
    child = child.sibling;
  }
  
  // 设置副作用链表
  fiber.firstEffect = firstEffect;
  fiber.lastEffect = lastEffect;
}



// 批量更新优化
export function scheduleUpdateOnFiber(fiber: Fiber, _priority: Priority): void {
  // 这里将由scheduler处理实际的更新调度
  markUpdate(fiber);
}

// 检查 Fiber 是否需要更新
export function shouldUpdateFiber(current: Fiber | null, workInProgress: Fiber): boolean {
  // 如果没有当前 Fiber，说明是新节点
  if (!current) {
    return true;
  }
  
  // 检查 props 是否变化
  const currentProps = current.memoizedProps;
  const workInProgressProps = workInProgress.pendingProps;
  
  // 对于函数组件，我们稍后会实现更复杂的比较逻辑
  // 对于原生元素，简单比较 props 是否相同
  if (typeof workInProgress.type === 'string') {
    return !shallowEqual(currentProps, workInProgressProps);
  }
  
  return true;
}

// 浅比较两个对象是否相等
function shallowEqual(a: any, b: any): boolean {
  if (a === b) {
    return true;
  }
  
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) {
    return false;
  }
  
  for (const key of keysA) {
    if (!keysB.includes(key) || a[key] !== b[key]) {
      return false;
    }
  }
  
  return true;
}

// 完成当前 Fiber 的工作
export function completeWork(workInProgress: Fiber): void {
  // 保存最终状态
  workInProgress.memoizedProps = workInProgress.pendingProps;
  
  // 收集副作用
  collectEffectList(workInProgress);
}
