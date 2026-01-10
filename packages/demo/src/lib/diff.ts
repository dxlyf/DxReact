import type { Fiber, VNode, ReactNode } from './types';
import { createFiberFromElement, createFiberFromText, markPlacement, markDelete } from './fiber';
import { getChildrenArray } from './vdom';
import { performanceMonitor } from './performance';
import { EffectTag } from './types';

// diff 算法主函数
export function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: ReactNode
): void {
  performanceMonitor.start();
  
  try {
    const nextChildArray = getChildrenArray(nextChildren);
    
    if (!current) {
      // 初次挂载，直接创建子 Fiber
      mountChildFibers(workInProgress, null, nextChildArray);
    } else {
      // 更新阶段，进行 diff
      reconcileChildFibers(workInProgress, current.child, nextChildArray);
    }
  } finally {
    performanceMonitor.end('reconcileChildren');
  }
}

// 挂载子 Fiber（初次渲染）
function mountChildFibers(
  parentFiber: Fiber,
  previousFiber: Fiber | null,
  newChildren: ReactNode[]
): Fiber | null {
  let lastPlacedIndex = 0;
  let resultingFirstChild: Fiber | null = null;
  let previousNewFiber: Fiber | null = null;
  
  for (let newIndex = 0; newIndex < newChildren.length; newIndex++) {
    const newChild = newChildren[newIndex];
    
    if (!newChild) {
      continue;
    }
    
    // 创建新的 Fiber
    const newFiber = createChildFiber(parentFiber, newChild, newIndex);
    if (!newFiber) {
      continue;
    }
    
    // 设置位置信息
    newFiber.index = newIndex;
    newFiber.return = parentFiber;
    
    if (!previousNewFiber) {
      resultingFirstChild = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }
    
    previousNewFiber = newFiber;
    
    // 标记为需要放置
    markPlacement(newFiber);
  }
  
  return resultingFirstChild;
}

// 协调子 Fiber（更新阶段）
function reconcileChildFibers(
  parentFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChildren: ReactNode[]
): Fiber | null {
  performanceMonitor.start();
  
  try {
    // 基本情况：没有新子节点
    if (newChildren.length === 0) {
      // 删除所有现有子节点
      if (currentFirstChild) {
        deleteRemainingChildren(parentFiber, currentFirstChild);
      }
      return null;
    }
    
    // 优化：单节点 diff
    if (newChildren.length === 1) {
      const newChild = newChildren[0];
      if (!newChild) {
        deleteRemainingChildren(parentFiber, currentFirstChild);
        return null;
      }
      
      // 检查是否只有一个旧子节点
      if (currentFirstChild && !currentFirstChild.sibling) {
        // 单节点更新优化
        return updateSingleChildFiber(
          parentFiber,
          currentFirstChild,
          newChild,
          0
        );
      } else {
        // 创建一个新节点并删除所有旧节点
        const newFiber = createChildFiber(parentFiber, newChild, 0);
        if (newFiber) {
          markPlacement(newFiber);
          deleteRemainingChildren(parentFiber, currentFirstChild);
          return newFiber;
        }
      }
    }
    
    // 多节点 diff - 使用基于 key 的优化算法
    return reconcileChildrenArray(
      parentFiber,
      currentFirstChild,
      newChildren
    );
  } finally {
    performanceMonitor.end('reconcileChildFibers');
  }
}

// 基于 key 的多节点 diff 算法
function reconcileChildrenArray(
  parentFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChildren: ReactNode[]
): Fiber | null {
  // 结果的第一个 Fiber
  let resultingFirstChild: Fiber | null = null;
  let previousNewFiber: Fiber | null = null;
  
  // 当前正在处理的旧 Fiber
  let currentFiber = currentFirstChild;
  
  // 旧 Fiber 映射表，用于基于 key 的查找
  const existingChildren = new Map<string | number, Fiber>();
  
  // 第一步：构建旧 Fiber 映射表
  let oldFiber = currentFirstChild;
  while (oldFiber) {
    if (oldFiber.key !== null) {
      existingChildren.set(oldFiber.key, oldFiber);
    }
    oldFiber = oldFiber.sibling;
  }
  
  // 第二步：遍历新子节点，尽可能重用现有 Fiber
  let lastPlacedIndex = 0;
  let newIndex = 0;
  let nextOldFiber = currentFirstChild;
  
  // 1. 尝试在相同位置找到可复用的节点
  for (; newIndex < newChildren.length && nextOldFiber; newIndex++) {
    const newChild = newChildren[newIndex];
    if (!newChild) continue;
    
    // 找到可复用的节点
    const matchedFiber = updateSlot(
      parentFiber,
      nextOldFiber,
      newChild,
      newIndex
    );
    
    if (!matchedFiber) {
      break;
    }
    
    // 记住最后放置的索引
    if (matchedFiber.alternate) {
      lastPlacedIndex = Math.max(lastPlacedIndex, matchedFiber.alternate.index);
    }
    
    nextOldFiber = nextOldFiber.sibling;
    
    // 连接 Fiber
    if (!previousNewFiber) {
      resultingFirstChild = matchedFiber;
    } else {
      previousNewFiber.sibling = matchedFiber;
    }
    previousNewFiber = matchedFiber;
  }
  
  // 2. 处理剩余的新子节点
  if (newIndex < newChildren.length) {
    // 创建新的 Fiber
    const fiberAfter = nextOldFiber;
    const newFiber = mountChildFibers(
      parentFiber,
      previousNewFiber,
      newChildren.slice(newIndex)
    );
    
    if (previousNewFiber) {
      previousNewFiber.sibling = newFiber;
    } else {
      resultingFirstChild = newFiber;
    }
  } else if (nextOldFiber) {
    // 3. 删除剩余的旧 Fiber
    deleteRemainingChildren(parentFiber, nextOldFiber);
  }
  
  return resultingFirstChild;
}

// 单节点更新优化
function updateSingleChildFiber(
  parentFiber: Fiber,
  currentFiber: Fiber,
  newChild: ReactNode,
  newIndex: number
): Fiber | null {
  // 如果是文本节点
  if (typeof newChild === 'string' || typeof newChild === 'number') {
    const textFiber = updateTextNode(
      parentFiber,
      currentFiber,
      String(newChild)
    );
    if (textFiber) {
      textFiber.index = newIndex;
      return textFiber;
    }
  }
  
  // 如果是 React 元素
  if (typeof newChild === 'object' && newChild !== null) {
    const elementFiber = updateElement(
      parentFiber,
      currentFiber,
      newChild as VNode
    );
    if (elementFiber) {
      elementFiber.index = newIndex;
      return elementFiber;
    }
  }
  
  // 如果无法更新，创建新节点并删除旧节点
  markDelete(currentFiber);
  const newFiber = createChildFiber(parentFiber, newChild, newIndex);
  if (newFiber) {
    markPlacement(newFiber);
  }
  return newFiber;
}

// 尝试更新同位置的节点
function updateSlot(
  parentFiber: Fiber,
  oldFiber: Fiber,
  newChild: ReactNode,
  newIndex: number
): Fiber | null {
  // 如果是文本节点
  if (typeof newChild === 'string' || typeof newChild === 'number') {
    return updateTextNode(
      parentFiber,
      oldFiber,
      String(newChild)
    );
  }
  
  // 如果是 React 元素
  if (typeof newChild === 'object' && newChild !== null) {
    const element = newChild as VNode;
    
    // 基于 key 和 type 比较
    if (
      oldFiber.key === element.key &&
      oldFiber.type === element.type
    ) {
      // 可以复用现有 Fiber
      const existing = useFiber(
        oldFiber,
        element.props
      );
      existing.index = newIndex;
      existing.return = parentFiber;
      
      // 如果节点位置变化，标记为需要移动
      if (oldFiber.index < newIndex) {
        markPlacement(existing);
      }
      
      return existing;
    } else if (element.key) {
      // 尝试通过 key 查找
      const matchedFiber = findFiberByKey(oldFiber, element.key);
      if (matchedFiber && matchedFiber.type === element.type) {
        // 复用找到的 Fiber
        const existing = useFiber(
          matchedFiber,
          element.props
        );
        existing.index = newIndex;
        existing.return = parentFiber;
        
        // 标记为需要移动
        markPlacement(existing);
        
        // 从旧链表中移除
        markDelete(matchedFiber);
        
        return existing;
      }
    }
  }
  
  return null;
}

// 更新文本节点
function updateTextNode(
  parentFiber: Fiber,
  oldFiber: Fiber,
  text: string
): Fiber | null {
  // 如果旧节点也是文本节点
  if (oldFiber.type === 'TEXT_ELEMENT') {
    // 复用现有 Fiber
    const existing = useFiber(
      oldFiber,
      { nodeValue: text }
    );
    existing.return = parentFiber;
    
    // 如果文本内容变化，标记更新
    if (existing.memoizedProps?.nodeValue !== text) {
      existing.effectTag |= EffectTag.Update;
    }
    
    return existing;
  }
  
  return null;
}

// 更新元素节点
function updateElement(
  parentFiber: Fiber,
  oldFiber: Fiber,
  element: VNode
): Fiber | null {
  // 检查是否可以复用
  if (oldFiber.type === element.type) {
    const existing = useFiber(
      oldFiber,
      element.props
    );
    existing.return = parentFiber;
    
    // 如果 props 变化，标记更新
    if (!shallowEqual(existing.memoizedProps, element.props)) {
      existing.effectTag |= EffectTag.Update;
    }
    
    return existing;
  }
  
  return null;
}

// 从链表中通过 key 查找 Fiber
function findFiberByKey(startFiber: Fiber, key: string | number): Fiber | null {
  let fiber = startFiber;
  while (fiber) {
    if (fiber.key === key) {
      return fiber;
    }
    fiber = fiber.sibling;
  }
  return null;
}

// 复用 Fiber 节点
function useFiber(fiber: Fiber, pendingProps: any): Fiber {
  // 获取或创建 alternate Fiber
  const clone = fiber.alternate
    ? cloneFiber(fiber)
    : fiber;
  
  // 重置状态
  clone.pendingProps = pendingProps;
  clone.effectTag = 0; // 表示无副作用
  clone.sibling = null;
  clone.child = null;
  
  return clone;
}

// 克隆 Fiber
function cloneFiber(fiber: Fiber): Fiber {
  const newFiber = {
    ...fiber,
    alternate: fiber,
    child: null,
    sibling: null,
    firstEffect: null,
    lastEffect: null,
    nextEffect: null,
  };
  
  return newFiber;
}

// 创建子 Fiber
function createChildFiber(parent: Fiber, newChild: ReactNode, index: number): Fiber | null {
  let newFiber: Fiber | null = null;
  
  // 文本节点
  if (typeof newChild === 'string' || typeof newChild === 'number') {
    newFiber = createFiberFromText(String(newChild), parent);
  }
  // React 元素
  else if (typeof newChild === 'object' && newChild !== null) {
    newFiber = createFiberFromElement(newChild as VNode, parent);
  }
  
  if (newFiber) {
    newFiber.return = parent;
    newFiber.index = index;
  }
  
  return newFiber;
}

// 删除剩余的子节点
function deleteRemainingChildren(parent: Fiber, childToDelete: Fiber | null): void {
  let child = childToDelete;
  while (child) {
    markDelete(child);
    child = child.sibling;
  }
}

// 浅比较两个对象
function shallowEqual(objA: any, objB: any): boolean {
  if (objA === objB) {
    return true;
  }
  
  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }
  
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  
  if (keysA.length !== keysB.length) {
    return false;
  }
  
  for (const key of keysA) {
    if (!keysB.includes(key) || objA[key] !== objB[key]) {
      return false;
    }
  }
  
  return true;
}
