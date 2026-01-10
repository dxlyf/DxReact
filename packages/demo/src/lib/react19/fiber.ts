// React 19 Fiber 架构 - 只支持函数组件

import type { 
  Fiber, FiberTag, ElementType, Props, ReactNode, VNode, 
  EffectTag, Priority, FunctionComponent 
} from './types';

// 全局变量
let workInProgress: Fiber | null = null;
let currentRoot: Fiber | null = null;
let nextUnitOfWork: Fiber | null = null;
let pendingCommit: Fiber | null = null;

// 创建 Fiber 节点
export function createFiber(
  tag: FiberTag,
  type: ElementType,
  key: string | number | null,
  pendingProps: Props
): Fiber {
  return {
    tag,
    type,
    key,
    
    // 树结构
    return: null,
    child: null,
    sibling: null,
    index: 0,
    
    // 状态信息
    pendingProps,
    memoizedProps: pendingProps,
    memoizedState: null,
    stateNode: null,
    
    // 副作用系统
    flags: EffectTag.None,
    subtreeFlags: EffectTag.None,
    deletions: null,
    
    // 更新队列
    updateQueue: null,
    
    // 调度信息
    lanes: 0,
    childLanes: 0,
    
    // 备用节点
    alternate: null,
    
    // 渲染模式
    mode: 0,
  };
}

// 从虚拟节点创建 Fiber
export function createFiberFromElement(
  element: VNode,
  returnFiber: Fiber
): Fiber {
  let fiberTag: FiberTag;
  
  if (typeof element.type === 'string') {
    fiberTag = FiberTag.HostComponent;
  } else if (typeof element.type === 'function') {
    fiberTag = FiberTag.FunctionComponent;
  } else if (element.type === Symbol.for('react.fragment')) {
    fiberTag = FiberTag.Fragment;
  } else {
    throw new Error(`Unknown element type: ${element.type}`);
  }
  
  const fiber = createFiber(fiberTag, element.type, element.key, element.props);
  fiber.return = returnFiber;
  
  return fiber;
}

// 从文本创建 Fiber
export function createFiberFromText(
  text: string,
  returnFiber: Fiber
): Fiber {
  const fiber = createFiber(FiberTag.HostText, 'TEXT_ELEMENT', null, { nodeValue: text });
  fiber.return = returnFiber;
  return fiber;
}

// 创建工作中的 Fiber（用于双缓存）
export function createWorkInProgress(current: Fiber, pendingProps: Props): Fiber {
  let workInProgress = current.alternate;
  
  if (workInProgress === null) {
    // 创建新的工作节点
    workInProgress = createFiber(
      current.tag,
      current.type,
      current.key,
      pendingProps
    );
    
    workInProgress.stateNode = current.stateNode;
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // 复用现有节点
    workInProgress.pendingProps = pendingProps;
    workInProgress.flags = EffectTag.None;
    workInProgress.subtreeFlags = EffectTag.None;
    workInProgress.deletions = null;
  }
  
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.lanes = current.lanes;
  workInProgress.childLanes = current.childLanes;
  
  return workInProgress;
}

// 调和子节点（Diff 算法）
export function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: ReactNode
): void {
  if (current === null) {
    // 挂载阶段
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
  } else {
    // 更新阶段
    workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren);
  }
}

// 挂载子节点
function mountChildFibers(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChildren: ReactNode
): Fiber | null {
  return reconcileChildFibers(returnFiber, currentFirstChild, newChildren, false);
}

// 调和子节点
function reconcileChildFibers(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChildren: ReactNode,
  shouldTrackSideEffects: boolean = true
): Fiber | null {
  if (newChildren === null || newChildren === undefined) {
    return null;
  }
  
  if (typeof newChildren === 'string' || typeof newChildren === 'number') {
    return createFiberFromText(String(newChildren), returnFiber);
  }
  
  if (typeof newChildren === 'object' && 'type' in newChildren) {
    return createFiberFromElement(newChildren as VNode, returnFiber);
  }
  
  if (Array.isArray(newChildren)) {
    let previousNewFiber: Fiber | null = null;
    let firstChildFiber: Fiber | null = null;
    
    for (let i = 0; i < newChildren.length; i++) {
      const child = newChildren[i];
      const newFiber = reconcileChildFibers(returnFiber, null, child, shouldTrackSideEffects);
      
      if (newFiber !== null) {
        if (previousNewFiber === null) {
          firstChildFiber = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
    }
    
    return firstChildFiber;
  }
  
  return null;
}

// 开始工作单元
export function beginWork(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  switch (workInProgress.tag) {
    case FiberTag.HostRoot:
      return updateHostRoot(current, workInProgress);
    case FiberTag.FunctionComponent:
      return updateFunctionComponent(current, workInProgress);
    case FiberTag.HostComponent:
      return updateHostComponent(current, workInProgress);
    case FiberTag.HostText:
      return null; // 文本节点没有子节点
    case FiberTag.Fragment:
      return updateFragment(current, workInProgress);
    default:
      throw new Error(`Unknown fiber tag: ${workInProgress.tag}`);
  }
}

// 更新根节点
function updateHostRoot(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  const nextChildren = workInProgress.pendingProps.children;
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

// 更新函数组件
function updateFunctionComponent(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  const Component = workInProgress.type as FunctionComponent;
  const nextChildren = Component(workInProgress.pendingProps);
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

// 更新宿主组件
function updateHostComponent(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  const nextChildren = workInProgress.pendingProps.children;
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

// 更新 Fragment
function updateFragment(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  const nextChildren = workInProgress.pendingProps.children;
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

// 完成工作单元
export function completeWork(current: Fiber | null, workInProgress: Fiber): void {
  // 设置 memoizedProps
  workInProgress.memoizedProps = workInProgress.pendingProps;
  
  // 收集副作用
  bubbleProperties(workInProgress);
}

// 冒泡属性（收集子树副作用）
function bubbleProperties(workInProgress: Fiber): void {
  let subtreeFlags = EffectTag.None;
  let child = workInProgress.child;
  
  while (child !== null) {
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;
    child = child.sibling;
  }
  
  workInProgress.subtreeFlags = subtreeFlags;
}

// 提交副作用
export function commitRoot(root: Fiber): void {
  // 标记提交阶段
  const finishedWork = root;
  
  // 提交副作用
  commitMutationEffects(finishedWork);
  
  // 重置当前根节点
  currentRoot = finishedWork;
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

// 提交删除操作
function commitDeletion(fiber: Fiber): void {
  // 实现删除逻辑
}

// 提交插入操作
function commitPlacement(fiber: Fiber): void {
  // 实现插入逻辑
}

// 提交更新操作
function commitUpdate(fiber: Fiber): void {
  // 实现更新逻辑
}

// 获取下一个工作单元
export function getNextWorkUnit(): Fiber | null {
  return nextUnitOfWork;
}

// 设置下一个工作单元
export function setNextWorkUnit(unit: Fiber | null): void {
  nextUnitOfWork = unit;
}

// 获取当前工作中的 Fiber
export function getWorkInProgress(): Fiber | null {
  return workInProgress;
}

// 设置当前工作中的 Fiber
export function setWorkInProgress(fiber: Fiber | null): void {
  workInProgress = fiber;
}

// 获取当前根节点
export function getCurrentRoot(): Fiber | null {
  return currentRoot;
}

// 设置当前根节点
export function setCurrentRoot(root: Fiber | null): void {
  currentRoot = root;
}