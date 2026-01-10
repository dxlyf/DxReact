// React 19 JSX 运行时 - 支持现代JSX语法

import type { VNode, Props } from './types';

// JSX元素工厂函数
export function jsx(type: any, props: Props, key?: string): VNode {
  return {
    type,
    props: {
      ...props,
      children: props.children || null,
    },
    key: key || null,
  };
}

// JSX片段工厂函数
export function jsxs(type: any, props: Props, key?: string): VNode {
  return jsx(type, props, key);
}

// Fragment组件
export const Fragment = Symbol.for('react.fragment');

// JSX开发环境运行时（用于调试）
export const jsxDEV = (type: any, props: Props, key?: string, isStaticChildren?: boolean, source?: any, self?: any): VNode => {
  const element = jsx(type, props, key);
  
  // 开发环境添加调试信息
  if (process.env.NODE_ENV !== 'production') {
    (element as any).__source = source;
    (element as any).__self = self;
  }
  
  return element;
};

// 验证JSX元素
export function isValidElement(element: any): boolean {
  return (
    element !== null &&
    typeof element === 'object' &&
    typeof element.type !== 'undefined' &&
    typeof element.props !== 'undefined'
  );
}

// 创建元素（兼容旧版API）
export function createElement(type: any, props?: Props, ...children: any[]): VNode {
  const normalizedProps: Props = { ...props };
  
  // 处理子元素
  if (children.length > 0) {
    normalizedProps.children = children.length === 1 ? children[0] : children;
  }
  
  // 处理key
  let key: string | null = null;
  if (normalizedProps.key !== undefined) {
    key = String(normalizedProps.key);
    delete normalizedProps.key;
  }
  
  return jsx(type, normalizedProps, key || undefined);
}

// 创建Fragment
export function createFragment(children: any[]): VNode {
  return {
    type: Fragment,
    props: {
      children,
    },
    key: null,
  };
}

// 克隆元素
export function cloneElement(element: VNode, props?: Props, ...children: any[]): VNode {
  if (!isValidElement(element)) {
    throw new Error('cloneElement: element is not a valid React element');
  }
  
  const newProps: Props = { ...element.props, ...props };
  
  // 处理子元素
  if (children.length > 0) {
    newProps.children = children.length === 1 ? children[0] : children;
  }
  
  // 处理key
  let key: string | null = element.key;
  if (props?.key !== undefined) {
    key = String(props.key);
  }
  
  return {
    ...element,
    props: newProps,
    key,
  };
}

// 子元素处理工具
export function Children {
  // 映射子元素
  map(children: any, fn: (child: any, index: number) => any): any[] {
    if (children == null) return [];
    
    const result: any[] = [];
    let index = 0;
    
    const traverse = (child: any) => {
      if (Array.isArray(child)) {
        child.forEach(traverse);
      } else {
        result.push(fn(child, index++));
      }
    };
    
    traverse(children);
    return result;
  },
  
  // 遍历子元素
  forEach(children: any, fn: (child: any, index: number) => void): void {
    if (children == null) return;
    
    let index = 0;
    
    const traverse = (child: any) => {
      if (Array.isArray(child)) {
        child.forEach(traverse);
      } else {
        fn(child, index++);
      }
    };
    
    traverse(children);
  },
  
  // 统计子元素数量
  count(children: any): number {
    if (children == null) return 0;
    
    let count = 0;
    
    const traverse = (child: any) => {
      if (Array.isArray(child)) {
        child.forEach(traverse);
      } else {
        count++;
      }
    };
    
    traverse(children);
    return count;
  },
  
  // 转换为数组
  toArray(children: any): any[] {
    return this.map(children, (child) => child);
  },
  
  // 只返回有效的子元素
  only(children: any): any {
    const array = this.toArray(children);
    
    if (array.length !== 1) {
      throw new Error('Children.only expected to receive a single React element child');
    }
    
    return array[0];
  },
}

// 创建Ref
export function createRef<T = any>(): { current: T | null } {
  return { current: null };
}

// 转发Ref
export function forwardRef<T, P = {}>(
  render: (props: P, ref: React.Ref<T>) => React.ReactElement | null
): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<T>> {
  return {
    $$typeof: Symbol.for('react.forward_ref'),
    render,
  } as any;
}

// Memo组件
export function memo<T extends React.ComponentType<any>>(
  Component: T,
  propsAreEqual?: (prevProps: React.ComponentProps<T>, nextProps: React.ComponentProps<T>) => boolean
): T {
  return {
    $$typeof: Symbol.for('react.memo'),
    type: Component,
    compare: propsAreEqual || null,
  } as any;
}

// 懒加载
export function lazy<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return {
    $$typeof: Symbol.for('react.lazy'),
    _payload: {
      _status: -1, // 未初始化
      _result: factory,
    },
    _init: (payload: any) => {
      if (payload._status === -1) {
        payload._status = 0; // 加载中
        payload._result().then(
          (module) => {
            payload._status = 1; // 加载成功
            payload._result = module.default;
          },
          (error) => {
            payload._status = 2; // 加载失败
            payload._result = error;
          }
        );
      }
      
      if (payload._status === 1) {
        return payload._result;
      } else {
        throw payload._result;
      }
    },
  } as any;
}

// 上下文API
export function createContext<T>(defaultValue: T): React.Context<T> {
  const contextSymbol = Symbol.for('react.context');
  
  const context: React.Context<T> = {
    $$typeof: contextSymbol,
    _currentValue: defaultValue,
    _currentValue2: defaultValue,
    Provider: null as any,
    Consumer: null as any,
  };
  
  context.Provider = {
    $$typeof: Symbol.for('react.provider'),
    _context: context,
  };
  
  context.Consumer = context;
  
  return context;
}

// 错误边界
export class ErrorBoundary extends (class {} as any) {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }
  
  render() {
    if ((this.state as any).hasError) {
      return (this.props as any).fallback || <div>Something went wrong.</div>;
    }
    
    return (this.props as any).children;
  }
}

// JSX运行时配置
export const JSXRuntime = {
  jsx,
  jsxs,
  jsxDEV,
  Fragment,
  createElement,
  createFragment,
  cloneElement,
  isValidElement,
  Children,
  createRef,
  forwardRef,
  memo,
  lazy,
  createContext,
  ErrorBoundary,
};

// 默认导出
export default JSXRuntime;