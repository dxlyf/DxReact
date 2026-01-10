import type { Fiber, VNode, Props, IComponent, ComponentClass, FunctionComponent, ReactNode } from './types';
import { setChildFibers } from './fiber';
import { reconcileChildren } from './diff';
import { h } from './vdom';
import { EffectTag } from './types';


// 组件基类
export abstract class Component<P = {}, S = {}>  implements IComponent{
  public props: Readonly<P> & { children?: ReactNode };
  public state: Readonly<S>;
  public refs: { [key: string]: any };
  
  constructor(props: P) {
    this.props = props as Readonly<P> & { children?: ReactNode };
    this.state = {} as S;
    this.refs = {};
  }
  
  // 设置状态
  public setState<K extends keyof S>(
    statePartial: Partial<S> | ((prevState: Readonly<S>, props: Readonly<P>) => Partial<S>),
    callback?: () => void
  ): void {
    // 这里会被更新器调用，实际的更新逻辑会在更新器中实现
    const updater = getComponentUpdater(this);
    updater.enqueueSetState(this, statePartial, callback, 'setState');
  }
  
  // 强制更新
  public forceUpdate(callback?: () => void): void {
    const updater = getComponentUpdater(this);
    updater.enqueueForceUpdate(this, callback, 'forceUpdate');
  }
  
  // 渲染方法，子类必须实现
  abstract public render(): ReactNode 
  
  // 生命周期方法
  public componentDidMount?(): void;
  public componentWillUnmount?(): void;
  public componentDidUpdate?(prevProps: P, prevState: S, snapshot?: any): void;
  public shouldComponentUpdate?(nextProps: Readonly<P>, nextState: Readonly<S>): boolean;
  public getSnapshotBeforeUpdate?(prevProps: Readonly<P>, prevState: Readonly<S>): any;
  public static getDerivedStateFromProps?: <P extends {}, S extends {}>(props: P, state: S) => Partial<S> | null;
}

// 组件更新器接口
interface ComponentUpdater {
  enqueueSetState(inst: Component, payload: any, callback?: () => void, callerName?: string): void;
  enqueueForceUpdate(inst: Component, callback?: () => void, callerName?: string): void;
}

// 全局组件更新器实例
let componentUpdater: ComponentUpdater | null = null;

// 获取组件更新器
function getComponentUpdater(inst: Component): ComponentUpdater {
  if (!componentUpdater) {
    throw new Error('Component updater not initialized');
  }
  return componentUpdater;
}

// 设置组件更新器（会在更新器模块中调用）
export function setComponentUpdater(updater: ComponentUpdater): void {
  componentUpdater = updater;
}

// 创建类组件实例
export function instantiateComponent(
  fiber: Fiber,
  props: Props
): Component | null {
  if (typeof fiber.type !== 'function') {
    return null;
  }
  
  const ComponentType = fiber.type as ComponentClass;
  const instance = new ComponentType(props);
  
  // 保存 Fiber 引用到实例
  (instance as any)._reactInternalFiber = fiber;
  
  return instance;
}

// 运行函数组件
export function renderFunctionComponent(
  fiber: Fiber,
  Component: FunctionComponent,
  props: Props
): ReactNode {
  try {
    // 设置当前 Fiber，供 Hooks 使用
    setCurrentFiber(fiber);
    
    // 重置 Hook 索引
    resetHooks();
    
    // 执行函数组件
    const children = Component(props);
    
    return children;
  } catch (error) {
    console.error('Error rendering function component:', error);
    return null;
  } finally {
    // 清理当前 Fiber
    setCurrentFiber(null);
  }
}

// 运行类组件
export function renderClassComponent(
  fiber: Fiber,
  instance: Component,
  props: Props
): ReactNode {
  try {
    // 更新 props
    instance.props = props as any;
    
    // 调用 getDerivedStateFromProps
    if (instance.constructor.getDerivedStateFromProps) {
      const nextState = instance.constructor.getDerivedStateFromProps(props, instance.state);
      if (nextState) {
        instance.state = { ...instance.state, ...nextState };
      }
    }
    
    // 调用 render
    const children = instance.render();
    
    return children;
  } catch (error) {
    console.error('Error rendering class component:', error);
    return null;
  }
}

// 处理类组件更新
export function updateClassComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: ComponentClass
): void {
  let instance: Component;
  let shouldUpdate = true;
  
  if (current) {
    // 组件已存在，复用实例
    instance = current.stateNode;
    workInProgress.stateNode = instance;
    
    // 更新 Fiber 引用
    (instance as any)._reactInternalFiber = workInProgress;
    
    // 调用 shouldComponentUpdate
    if (instance.shouldComponentUpdate) {
      shouldUpdate = instance.shouldComponentUpdate(
        workInProgress.pendingProps,
        workInProgress.memoizedState
      );
    }
  } else {
    // 组件是新创建的
    instance = instantiateComponent(workInProgress, workInProgress.pendingProps);
    workInProgress.stateNode = instance;
    
    // 标记为挂载
    workInProgress.effectTag |= EffectTag.Mounting;
  }
  
  if (shouldUpdate) {
    // 渲染组件
    const nextChildren = renderClassComponent(workInProgress, instance, workInProgress.pendingProps);
    
    // 协调子节点
    reconcileChildren(current, workInProgress, nextChildren);
  } else {
    // 跳过更新，复制子节点结构
    if (current) {
      workInProgress.child = current.child;
      if (workInProgress.child) {
        workInProgress.child.return = workInProgress;
      }
    }
  }
}

// 处理函数组件更新
export function updateFunctionComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: FunctionComponent
): void {
  // 渲染组件
  const nextChildren = renderFunctionComponent(workInProgress, Component, workInProgress.pendingProps);
  
  // 协调子节点
  reconcileChildren(current, workInProgress, nextChildren);
}

// 处理原生元素更新
export function updateHostComponent(
  current: Fiber | null,
  workInProgress: Fiber
): void {
  // 对于原生元素，我们只需要设置子节点
  const nextProps = workInProgress.pendingProps;
  let nextChildren = nextProps.children;
  
  // 协调子节点
  reconcileChildren(current, workInProgress, nextChildren);
}

// 处理文本节点更新
export function updateTextComponent(
  current: Fiber | null,
  workInProgress: Fiber
): void {
  // 文本节点没有子节点
  workInProgress.child = null;
}

// 根据 Fiber 类型处理更新
export function updateFiber(
  current: Fiber | null,
  workInProgress: Fiber
): void {
  const type = workInProgress.type;
  
  if (typeof type === 'function') {
    // 检查是否为类组件
    if (type.prototype && type.prototype.render) {
      // 类组件
      updateClassComponent(current, workInProgress, type as ComponentClass);
    } else {
      // 函数组件
      updateFunctionComponent(current, workInProgress, type as FunctionComponent);
    }
  } else if (type === 'TEXT_ELEMENT') {
    // 文本节点
    updateTextComponent(current, workInProgress);
  } else {
    // 原生元素
    updateHostComponent(current, workInProgress);
  }
}

// 处理组件挂载后的生命周期
export function commitMount(instance: Component): void {
  if (instance.componentDidMount) {
    instance.componentDidMount();
  }
}

// 处理组件更新后的生命周期
export function commitUpdate(
  instance: Component,
  prevProps: Props,
  prevState: ComponentState,
  snapshot?: any
): void {
  // 调用 getSnapshotBeforeUpdate
  let newSnapshot = undefined;
  if (instance.getSnapshotBeforeUpdate) {
    newSnapshot = instance.getSnapshotBeforeUpdate(prevProps, prevState);
  }
  
  // 调用 componentDidUpdate
  if (instance.componentDidUpdate) {
    instance.componentDidUpdate(prevProps, prevState, newSnapshot);
  }
}

// 处理组件卸载
export function commitUnmount(instance: Component): void {
  if (instance.componentWillUnmount) {
    instance.componentWillUnmount();
  }
}

// 创建错误边界组件
export function createErrorBoundary(
  Component: ComponentClass,
  errorMessage?: string
): ComponentClass {
  return class ErrorBoundary extends Component {
    public state = {
      hasError: false,
      error: null
    };
    
    public static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
      return { hasError: true, error };
    }
    
    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
      console.error('Error caught by boundary:', error, errorInfo);
    }
    
    public render(): ReactNode {
      if (this.state.hasError) {
        return h('div', null, errorMessage || 'Something went wrong.');
      }
      
      return super.render();
    }
  };
}

// 上下文相关 - 当前 Fiber
let currentFiber: Fiber | null = null;
let hookIndex = 0;

// 设置当前 Fiber
export function setCurrentFiber(fiber: Fiber | null): void {
  currentFiber = fiber;
}

// 获取当前 Fiber
export function getCurrentFiber(): Fiber | null {
  return currentFiber;
}

// 重置 Hook 索引
export function resetHooks(): void {
  hookIndex = 0;
}

// 获取当前 Hook 索引
export function getHookIndex(): number {
  return hookIndex++;
}

// 创建 PureComponent 组件
export class PureComponent<P = {}, S = {}> extends Component<P, S> {
  public shouldComponentUpdate(nextProps: Readonly<P>, nextState: Readonly<S>): boolean {
    return !shallowEqual(this.props, nextProps) || !shallowEqual(this.state, nextState);
  }
}

// 浅比较工具函数
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
