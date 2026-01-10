// React 19 主入口文件 - 整合所有模块

// 核心模块导出
export * from './types';
export * from './fiber';
export * from './scheduler';
export * from './hooks';
export * from './renderer';
export * from './jsx-runtime';

// React 19 主API
export const React19 = {
  // 渲染相关
  createElement: require('./jsx-runtime').createElement,
  cloneElement: require('./jsx-runtime').cloneElement,
  createRef: require('./jsx-runtime').createRef,
  forwardRef: require('./jsx-runtime').forwardRef,
  memo: require('./jsx-runtime').memo,
  lazy: require('./jsx-runtime').lazy,
  createContext: require('./jsx-runtime').createContext,
  Fragment: require('./jsx-runtime').Fragment,
  
  // Hooks
  useState: require('./hooks').useState,
  useEffect: require('./hooks').useEffect,
  useLayoutEffect: require('./hooks').useLayoutEffect,
  useMemo: require('./hooks').useMemo,
  useCallback: require('./hooks').useCallback,
  useRef: require('./hooks').useRef,
  useReducer: require('./hooks').useReducer,
  useImperativeHandle: require('./hooks').useImperativeHandle,
  useDebugValue: require('./hooks').useDebugValue,
  
  // 渲染器
  render: require('./renderer').render,
  unmountComponentAtNode: require('./renderer').unmountComponentAtNode,
  createPortal: require('./renderer').createPortal,
  
  // 版本信息
  version: '19.0.0-react-like',
};

// 默认导出
export default React19;

// 全局注册（可选）
if (typeof window !== 'undefined') {
  (window as any).React19 = React19;
}

// 开发环境警告
if (process.env.NODE_ENV !== 'production') {
  console.log(`
🚀 React 19 (React-like) v${React19.version} 已加载

✨ 特性:
- 仅支持函数组件
- 现代化Fiber架构
- 并发渲染支持
- 完整的Hooks系统
- 现代JSX语法

📚 使用示例:
import React from './react19';

function App() {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);
  
  return (
    <div>
      <h1>Hello React 19!</h1>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  );
}

React.render(<App />, document.getElementById('root'));
  `);
}