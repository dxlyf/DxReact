import type { VNode, Props, ElementType, ReactNode } from './types';

// 创建虚拟 DOM 节点
export function h(type: ElementType | symbol, config?: Props, ...children: ReactNode[]): VNode {

  let key=null;
  let props:Props={};
  if(config){
     for(let [propKey,value] of Object.entries(config)){
        if(propKey==='key'){
          key=String(value);
        }else{
          props[propKey]=value;
        }
     }
  }
  // 处理子节点
  if(children.length>0){
    props.children=normalizeChildren(children);
  }
  return {
    type,
    props:props,
    key: key
  } as VNode;
}

// 规范化子节点
export function normalizeChildren(children: ReactNode[]): ReactNode {
  const result: ReactNode[] = [];
  
  flattenChildren(children, result);
  
  // 优化：如果只有一个子节点，直接返回该节点
  if (result.length === 1) {
    return result[0];
  }
  
  return result;
}

// 扁平化子节点数组
function flattenChildren(children: ReactNode[], result: ReactNode[]): void {
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    
    // 跳过 null 和 undefined
    if (child === null || child === undefined) {
      continue;
    }
    
    // 处理数组
    if (Array.isArray(child)) {
      flattenChildren(child, result);
    } 
    // 处理原始类型（字符串、数字、布尔值）
    else if (typeof child === 'string' || typeof child === 'number') {
      result.push(child);
    } 
    // 处理布尔值（除了 false）
    else if (typeof child === 'boolean') {
      if (child === false) {
        continue;
      }
      result.push(child);
    }
    // 处理 VNode
    else if (typeof child === 'object' && child.type !== undefined) {
      result.push(child);
    }
  }
}

// 克隆 VNode
export function cloneElement(element: VNode, props?: Props, ...children: ReactNode[]): VNode {
  const mergedProps: Props = { ...element.props, ...props };
  
  if (children.length > 0) {
    mergedProps.children = normalizeChildren(children) as VNode | VNode[] | undefined;
  }
  
  return {
    ...element,
    props: mergedProps
  };
}

// 创建文本节点的辅助函数
export function createTextNode(text: string | number): VNode {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: String(text)
    },
    key: null
  } as VNode;
}

// 创建文本节点的别名函数（与导入一致）
export function createTextVNode(text: string | number): VNode {
  return createTextNode(text);
}

// 检查是否为有效的 React 元素
export function isValidElement(obj: any): obj is VNode {
  return typeof obj === 'object' && obj !== null && 'type' in obj && 'props' in obj;
}

// 获取元素的类型字符串
export function getElementType(element: VNode): string {
  if (typeof element.type === 'string') {
    return element.type;
  } else if (typeof element.type === 'function') {
    return (element.type as any).displayName || element.type.name || 'Component';
  }
  return 'Unknown';
}

// 比较两个 VNode 是否相同（用于优化）
export function areNodesEqual(node1: VNode | null | undefined, node2: VNode | null | undefined): boolean {
  if (node1 === node2) return true;
  if (!node1 || !node2) return false;
  
  // 类型不同
  if (node1.type !== node2.type) return false;
  
  // key 不同
  if (node1.key !== node2.key) return false;
  
  // 对于文本节点，比较内容
  if (node1.type === 'TEXT_ELEMENT' && node2.type === 'TEXT_ELEMENT') {
    return node1.props.nodeValue === node2.props.nodeValue;
  }
  
  return true;
}

// 提取子节点数组
export function getChildrenArray(children: ReactNode): ReactNode[] {
  if (!children) return [];
  if (Array.isArray(children)) return children;
  return [children];
}

// 处理事件属性
export function extractEventHandlers(props: Props): { [key: string]: Function } {
  const events: { [key: string]: Function } = {};
  
  for (const key in props) {
    if (props.hasOwnProperty(key) && key.startsWith('on') && typeof props[key] === 'function') {
      events[key] = props[key];
    }
  }
  
  return events;
}

// 处理普通属性（非事件）
export function extractDOMProps(props: Props): Props {
  const domProps: Props = {};
  
  for (const key in props) {
    if (
      props.hasOwnProperty(key) &&
      !key.startsWith('on') &&
      key !== 'children' &&
      key !== 'key'
    ) {
      domProps[key] = props[key];
    }
  }
  
  return domProps;
}
