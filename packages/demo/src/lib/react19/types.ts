// React 19 类型定义 - 只支持函数组件

// 元素类型
export type ElementType = string | FunctionComponent;

// Props 类型
export interface Props {
  [key: string]: any;
  children?: ReactNode;
}

// React 节点类型
export type ReactNode = VNode | string | number | boolean | null | undefined | ReactNode[];

// 虚拟 DOM 节点
export interface VNode {
  type: ElementType;
  props: Props;
  key?: string | null;
}

// 函数组件类型
export type FunctionComponent<P = any> = (props: P) => ReactNode;

// Fiber 节点类型枚举
export const FiberTag = {
  FunctionComponent: 0,
  HostComponent: 1,
  HostText: 2,
  HostRoot: 3,
  Fragment: 4,
} as const;

export type FiberTag = typeof FiberTag[keyof typeof FiberTag];

// Effect 标签类型
export const EffectTag = {
  None: 0,
  Placement: 1,
  Update: 2,
  Delete: 4,
  Passive: 8,
  Layout: 16,
} as const;

export type EffectTag = typeof EffectTag[keyof typeof EffectTag];

// 优先级类型
export const Priority = {
  Immediate: 1,    // 同步优先级
  UserBlocking: 2,  // 用户交互
  Normal: 3,       // 普通更新
  Low: 4,          // 低优先级
  Idle: 5,         // 空闲时执行
} as const;

export type Priority = typeof Priority[keyof typeof Priority];

// Fiber 节点核心接口
export interface Fiber {
  // 标识信息
  tag: FiberTag;
  type: ElementType;
  key: string | number | null;
  
  // 树结构
  return: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  index: number;
  
  // 状态信息
  pendingProps: Props;
  memoizedProps: Props;
  memoizedState: any;
  stateNode: any; // DOM 节点或组件实例
  
  // 副作用系统
  flags: EffectTag;
  subtreeFlags: EffectTag;
  deletions: Fiber[] | null;
  
  // 更新队列
  updateQueue: any;
  
  // 调度信息
  lanes: number;
  childLanes: number;
  
  // 备用节点（用于双缓存）
  alternate: Fiber | null;
  
  // 渲染优先级
  mode: number;
}

// Hook 类型定义
export interface Hook {
  memoizedState: any;
  baseState: any;
  baseQueue: any;
  queue: any;
  next: Hook | null;
}

// 更新队列
export interface Update<State> {
  action: (state: State) => State;
  next: Update<State> | null;
  priority?: Priority;
}

// 渲染器配置接口
export interface HostConfig {
  // DOM 操作
  createElement: (type: string, props: Props) => HTMLElement;
  createTextNode: (text: string) => Text;
  appendChild: (parent: Node, child: Node) => void;
  removeChild: (parent: Node, child: Node) => void;
  insertBefore: (parent: Node, child: Node, before: Node | null) => void;
  
  // 属性操作
  setAttribute: (element: Element, key: string, value: any) => void;
  removeAttribute: (element: Element, key: string) => void;
  
  // 事件系统
  addEventListener: (element: Element, event: string, handler: EventListener) => void;
  removeEventListener: (element: Element, event: string, handler: EventListener) => void;
  
  // 文本内容
  setTextContent: (node: Node, text: string) => void;
}

// 调度器配置
export interface SchedulerConfig {
  // 时间切片配置
  yieldInterval: number;
  deadline: number;
  
  // 性能监控
  enableSchedulingProfiler: boolean;
}

// 渲染选项
export interface RenderOptions {
  // 并发模式
  concurrent: boolean;
  
  // 开发模式
  development: boolean;
  
  // 严格模式
  strictMode: boolean;
}

// 错误边界信息
export interface ErrorInfo {
  componentStack: string;
}

// 合成事件
export interface SyntheticEvent<T = Element> extends Event {
  currentTarget: EventTarget & T;
  target: EventTarget & T;
  type: string;
  bubbles: boolean;
  cancelable: boolean;
  defaultPrevented: boolean;
  eventPhase: number;
  isTrusted: boolean;
  timeStamp: number;
  
  // React 特定属性
  nativeEvent: Event;
  isDefaultPrevented: () => boolean;
  isPropagationStopped: () => boolean;
  persist: () => void;
}

// Context 类型
export interface Context<T> {
  Provider: FunctionComponent<{ value: T; children?: ReactNode }>;
  Consumer: FunctionComponent<{ children: (value: T) => ReactNode }>;
  _currentValue: T;
  displayName?: string;
}

// Ref 类型
export type Ref<T> = { current: T | null } | ((instance: T | null) => void);