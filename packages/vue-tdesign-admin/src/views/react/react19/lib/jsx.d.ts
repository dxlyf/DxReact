// ============================================================
// JSX 类型声明（作用于 react19 独立 tsconfig 作用域）
// 经典模式（jsx: react）下 TS 解析 JSX 元素/属性类型用到的全局 namespace
// ============================================================
declare const React: {
  createElement: (...args: any[]) => any
}

declare namespace JSX {
  interface Element {
    $$typeof: any
    type: any
    key: any
    ref: any
    props: any
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ElementType {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IntrinsicAttributes {}
  interface IntrinsicElements {
    [elemName: string]: any
  }
  interface ElementChildrenAttribute {
    children: any
  }
}
