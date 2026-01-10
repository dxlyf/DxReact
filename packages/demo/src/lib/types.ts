// 框架核心类型定义

// 元素类型
export type ElementType = string | Function;

// Props 类型
export interface Props {
  [key: string]: any;
  children?: ReactNode | ReactNode[];
}

// 虚拟 DOM 节点类型
export interface VNode {
  type: ElementType;
  props: Props;
  key?: string | null;
}

// Fiber 节点类型枚举
export const FiberTag = {
  FunctionComponent: 0,
  ClassComponent: 1,
  HostComponent: 2,
  HostText: 3,
  HostRoot: 4,
} as const;

export type FiberTag = typeof FiberTag[keyof typeof FiberTag];

// Fiber 节点类型
export interface Fiber {
  ref: any;
  tag: FiberTag;
  type: ElementType;
  key?: string | number;
  props: Props;
  stateNode?: any; // 实际 DOM 节点或组件实例
  child?: Fiber | null;
  sibling?: Fiber | null;
  return?: Fiber | null;
  index?: number;
  depth?: number;
  effectTag?: EffectTag;
  firstEffect?: Fiber | null;
  lastEffect?: Fiber | null;
  nextEffect?: Fiber | null;
  alternate?: Fiber | null;
  memoizedProps?: Props;
  memoizedState?: any;
  updateQueue?: EffectQueue | null;
  pendingProps?: Props;
  priority?: Priority;
  flags?: EffectTag;
  subtreeFlags?: EffectTag;
  dependencies?: any;
  expirationTime?: number;
  mode?: number;
}

// Effect 标签类型
export const EffectTag = {
  None: 0,
  Placement: 1,
  Update: 2,
  Delete: 4,
  Capture: 8,
} as const;

export type EffectTag = typeof EffectTag[keyof typeof EffectTag];

// Update 类型
export interface Update<S> {
  action: (prevState: S) => S | S;
  next?: Update<S> | null;
  priority?: Priority;
}

// Effect Queue 类型
export interface EffectQueue {
  lastEffect: any | null;
}

// Hook 类型定义
export type EffectCallback = () => void | (() => void);
export type DependencyList = ReadonlyArray<any>;

// 优先级类型
export const Priority = {
  NoWork: 0,
  SynchronousPriority: 1,
  TaskPriority: 2,
  HighPriority: 3,
  NormalPriority: 4,
  LowPriority: 5,
  IdlePriority: 6,
} as const;

export type Priority = typeof Priority[keyof typeof Priority];

// 组件实例类型
export interface IComponent<P = any, S = any> {
  props: P;
  state: S;
  context: any;
  refs: { [key: string]: any };
  updater: Updater<S>;
  render(): ReactNode;
  componentDidMount?(): void;
  componentDidUpdate?(prevProps: P, prevState: S): void;
  componentWillUnmount?(): void;
  shouldComponentUpdate?(nextProps: P, nextState: S): boolean;
}

// Updater 类型
export interface Updater<S> {
  enqueueSetState(inst: IComponent<any, S>, payload: any, callback?: () => void): void;
}

// 函数组件类型
export type FunctionComponent<P = any> = (props: P) => VNode | null;

// 类组件构造函数类型
export type ComponentClass<P = any> = new (props: P) => IComponent<P>;

// Hooks 类型
export interface Hook {
  memoizedState: any;
  baseState: any;
  baseUpdate: Update<any> | null;
  queue: any;
  next: Hook | null;
}

// Context 类型
export interface Context<T> {
  Provider: ComponentClass<{ value: T; children: ReactNode }>;
  Consumer: ComponentClass<{ children: (value: T) => ReactNode }>;
  _currentValue: T;
  _currentValue2: T;
  _threadCount: number;
  defaultValue: T;
}

// ReactNode 类型
export type ReactNode = VNode | string | number | boolean | null | undefined | ReactNode[];

// DOM 元素类型
export type DOMElement = HTMLElement | SVGElement | Text;

// 调度回调类型
export type SchedulerCallback = () => void;

// 工作循环状态
export const WorkLoopState = {
  IDLE: 'idle',
  PENDING: 'pending',
  WORKING: 'working',
  COMPLETED: 'completed',
} as const;

export type WorkLoopState = typeof WorkLoopState[keyof typeof WorkLoopState];

// Host Config 接口（用于不同环境的渲染器）
export interface HostConfig {
  createElement: (type: string, props: Props) => any;
  createTextNode: (text: string) => any;
  appendChild: (parent: any, child: any) => void;
  removeChild: (parent: any, child: any) => void;
  insertBefore: (parent: any, child: any, beforeChild: any) => void;
  setAttribute: (node: any, key: string, value: any) => void;
  removeAttribute: (node: any, key: string) => void;
  addEventListener: (node: any, eventName: string, handler: Function) => void;
  removeEventListener: (node: any, eventName: string, handler: Function) => void;
}
