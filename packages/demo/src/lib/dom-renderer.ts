import type { Fiber, Props } from './types';
import { extractEventHandlers, extractDOMProps } from './vdom';
import { commitMount, commitUpdate, commitUnmount } from './components';
import { commitHookEffects, commitPassiveHookEffects } from './hooks';
import {EffectTag} from './types'
import { scheduleRootUpdate } from './scheduler';
// 创建 DOM 元素
export function createDOM(fiber: Fiber): Node {
  const { type, props } = fiber;
  let dom: Node;
  
  if (type === 'TEXT_ELEMENT') {
    // 创建文本节点
    dom = document.createTextNode(props.nodeValue || '');
  } else if (typeof type === 'string') {
    // 创建 DOM 元素
    dom = document.createElement(type);
    
    // 设置属性
    updateDOMProperties(dom as Element, {}, props);
  } else {
    // 组件节点，暂时不创建 DOM
    dom = document.createComment('<!-- Component -->');
  }
  
  return dom;
}

// 更新 DOM 属性
export function updateDOMProperties(
  dom: Element,
  prevProps: Props,
  nextProps: Props
): void {
  // 提取事件处理器
  const prevEvents = extractEventHandlers(prevProps);
  const nextEvents = extractEventHandlers(nextProps);
  
  // 提取普通属性
  const prevAttrs = extractDOMProps(prevProps);
  const nextAttrs = extractDOMProps(nextProps);
  
  // 移除旧事件处理器
  for (const eventName in prevEvents) {
    if (!(eventName in nextEvents)) {
      removeEvent(dom, eventName, prevEvents[eventName]);
    }
  }
  
  // 添加或更新新事件处理器
  for (const eventName in nextEvents) {
    if (prevEvents[eventName] !== nextEvents[eventName]) {
      removeEvent(dom, eventName, prevEvents[eventName]);
      addEvent(dom, eventName, nextEvents[eventName]);
    }
  }
  
  // 移除旧属性
  for (const attrName in prevAttrs) {
    if (!(attrName in nextAttrs) && attrName !== 'children') {
      removeAttribute(dom, attrName, prevAttrs[attrName]);
    }
  }
  
  // 添加或更新新属性
  for (const attrName in nextAttrs) {
    if (prevAttrs[attrName] !== nextAttrs[attrName] && attrName !== 'children') {
      setAttribute(dom, attrName, nextAttrs[attrName]);
    }
  }
}

// 设置单个属性
function setAttribute(dom: Element, name: string, value: any): void {
  // 特殊处理 className
  if (name === 'className') {
    dom.className = value || '';
    return;
  }
  
  // 特殊处理 style
  if (name === 'style') {
    if (typeof value === 'string') {
      dom.style.cssText = value;
    } else if (typeof value === 'object') {
      // 清除旧样式
      dom.style.cssText = '';
      // 设置新样式
      for (const styleName in value) {
        dom.style[styleName as any] = value[styleName];
      }
    }
    return;
  }
  
  // 特殊处理布尔属性
  if (typeof value === 'boolean') {
    if (value) {
      dom.setAttribute(name, '');
      dom[name] = true;
    } else {
      dom.removeAttribute(name);
      dom[name] = false;
    }
    return;
  }
  
  // 特殊处理表单元素的值
  if (name === 'value' && (dom instanceof HTMLInputElement || dom instanceof HTMLTextAreaElement)) {
    dom.value = value || '';
    return;
  }
  
  // 特殊处理 checked 属性
  if (name === 'checked' && dom instanceof HTMLInputElement) {
    dom.checked = !!value;
    return;
  }
  
  // 特殊处理 dangerouslySetInnerHTML
  if (name === 'dangerouslySetInnerHTML') {
    if (value && value.__html) {
      dom.innerHTML = value.__html;
    }
    return;
  }
  
  // 普通属性
  if (value !== null && value !== undefined) {
    dom.setAttribute(name, String(value));
  } else {
    dom.removeAttribute(name);
  }
}

// 移除单个属性
function removeAttribute(dom: Element, name: string, value: any): void {
  // 特殊处理 className
  if (name === 'className') {
    dom.className = '';
    return;
  }
  
  // 特殊处理 style
  if (name === 'style') {
    dom.style.cssText = '';
    return;
  }
  
  // 特殊处理布尔属性
  if (typeof value === 'boolean') {
    dom.removeAttribute(name);
    dom[name] = false;
    return;
  }
  
  // 特殊处理表单元素的值
  if (name === 'value' && (dom instanceof HTMLInputElement || dom instanceof HTMLTextAreaElement)) {
    dom.value = '';
    return;
  }
  
  // 特殊处理 checked 属性
  if (name === 'checked' && dom instanceof HTMLInputElement) {
    dom.checked = false;
    return;
  }
  
  // 普通属性
  dom.removeAttribute(name);
}

// 事件映射表
const eventMap: { [key: string]: string } = {
  onClick: 'click',
  onDoubleClick: 'dblclick',
  onMouseDown: 'mousedown',
  onMouseUp: 'mouseup',
  onMouseEnter: 'mouseenter',
  onMouseLeave: 'mouseleave',
  onMouseMove: 'mousemove',
  onMouseOver: 'mouseover',
  onMouseOut: 'mouseout',
  onKeyDown: 'keydown',
  onKeyUp: 'keyup',
  onKeyPress: 'keypress',
  onFocus: 'focus',
  onBlur: 'blur',
  onChange: 'change',
  onInput: 'input',
  onSubmit: 'submit',
  onScroll: 'scroll',
  onResize: 'resize',
};

// 添加事件监听器
function addEvent(dom: Element, eventName: string, handler: Function): void {
  const nativeEventName = eventMap[eventName] || eventName.slice(2).toLowerCase();
  
  // 创建合成事件处理函数
  const syntheticHandler = function(event: Event): void {
    // 创建合成事件对象
    const syntheticEvent = createSyntheticEvent(event);
    try {
      handler(syntheticEvent);
    } catch (error) {
      console.error('Error in event handler:', error);
    } finally {
      // 恢复原始事件
      event.preventDefault = syntheticEvent.nativePreventDefault;
      event.stopPropagation = syntheticEvent.nativeStopPropagation;
    }
  };
  
  // 存储处理函数引用，以便后续移除
  const eventKey = `__reactEvent_${nativeEventName}`;
  (dom as any)[eventKey] = syntheticHandler;
  
  // 添加事件监听
  dom.addEventListener(nativeEventName, syntheticHandler, false);
}

// 移除事件监听器
function removeEvent(dom: Element, eventName: string, handler: Function): void {
  if (!handler) return;
  
  const nativeEventName = eventMap[eventName] || eventName.slice(2).toLowerCase();
  const eventKey = `__reactEvent_${nativeEventName}`;
  
  // 获取存储的处理函数
  const syntheticHandler = (dom as any)[eventKey];
  
  if (syntheticHandler) {
    // 移除事件监听
    dom.removeEventListener(nativeEventName, syntheticHandler, false);
    // 清理引用
    (dom as any)[eventKey] = null;
  }
}

// 创建合成事件对象
function createSyntheticEvent(event: Event): any {
  const syntheticEvent: any = {};
  
  // 复制原始事件的属性
  for (const key in event) {
    if (typeof (event as any)[key] !== 'function') {
      syntheticEvent[key] = (event as any)[key];
    }
  }
  
  // 保存原始方法
  syntheticEvent.nativePreventDefault = event.preventDefault;
  syntheticEvent.nativeStopPropagation = event.stopPropagation;
  
  // 合成事件方法
  syntheticEvent.preventDefault = function(): void {
    this.defaultPrevented = true;
    if (this.nativePreventDefault) {
      this.nativePreventDefault();
    }
  };
  
  syntheticEvent.stopPropagation = function(): void {
    if (this.nativeStopPropagation) {
      this.nativeStopPropagation();
    }
  };
  
  return syntheticEvent;
}

// 将 Fiber 节点插入到 DOM
export function appendChildToContainer(container: Node, child: Node): void {
  container.appendChild(child);
}

// 在指定节点前插入
export function insertBefore(parent: Node, child: Node, beforeChild: Node | null): void {
  if (beforeChild) {
    parent.insertBefore(child, beforeChild);
  } else {
    parent.appendChild(child);
  }
}

// 从 DOM 中移除节点
export function removeChild(parent: Node, child: Node): void {
  parent.removeChild(child);
}

// 替换 DOM 节点
export function replaceChild(parent: Node, newChild: Node, oldChild: Node): void {
  parent.replaceChild(newChild, oldChild);
}

// 提交副作用
export function commitRoot(root: Fiber): void {
  // 处理插入操作
  commitPlacement(root);
  
  // 处理更新操作
  commitWork(root);
  
  // 处理删除操作
  commitDeletion(root);
  
  // 处理 layout effects
  commitLayoutEffects(root);
  
  // 处理 passive effects（在下一个微任务中）
  scheduleCallback(commitPassiveEffects, root);
}

// 处理插入操作
function commitPlacement(fiber: Fiber): void {
  if (!fiber.child) return;
  
  // 先处理子节点
  commitPlacement(fiber.child);
  
  // 处理兄弟节点
  let sibling = fiber.child.sibling;
  while (sibling) {
    commitPlacement(sibling);
    sibling = sibling.sibling;
  }
  
  // 处理当前节点的插入
  if (fiber.effectTag & EffectTag.Placement && fiber.stateNode) {
    const parentFiber = fiber.return;
    if (parentFiber && parentFiber.stateNode) {
      const parentNode = parentFiber.stateNode;
      let beforeNode = null;
      
      // 查找插入位置
      let nextFiber = fiber.sibling;
      while (nextFiber && !nextFiber.stateNode) {
        nextFiber = nextFiber.sibling;
      }
      
      if (nextFiber && nextFiber.stateNode) {
        beforeNode = nextFiber.stateNode;
      }
      
      // 执行插入
      insertBefore(parentNode, fiber.stateNode, beforeNode);
      
      // 清除标记
      fiber.effectTag &= ~EffectTag.Placement;
    }
  }
}

// 处理更新操作
function commitWork(fiber: Fiber): void {
  if (!fiber.child) return;
  
  // 先处理子节点
  commitWork(fiber.child);
  
  // 处理兄弟节点
  let sibling = fiber.child.sibling;
  while (sibling) {
    commitWork(sibling);
    sibling = sibling.sibling;
  }
  
  // 处理当前节点的更新
  if (fiber.effectTag & EffectTag.Update && fiber.stateNode) {
    // 如果是组件节点
    if (typeof fiber.type === 'function') {
      const instance = fiber.stateNode;
      if (instance && typeof instance === 'object' && 'componentDidUpdate' in instance) {
        const prevProps = fiber.alternate?.memoizedProps || {};
        const prevState = fiber.alternate?.memoizedState || {};
        commitUpdate(instance, prevProps, prevState);
      }
    } 
    // 如果是 DOM 节点
    else if (typeof fiber.type === 'string' && fiber.stateNode instanceof Element) {
      const dom = fiber.stateNode;
      const prevProps = fiber.alternate?.memoizedProps || {};
      const nextProps = fiber.memoizedProps || {};
      updateDOMProperties(dom, prevProps, nextProps);
    }
    
    // 清除标记
      fiber.effectTag &= ~EffectTag.Update;
  }
  
  // 处理挂载
  if (fiber.effectTag & EffectTag.Placement && fiber.stateNode && !fiber.alternate) {
    if (typeof fiber.type === 'function') {
      const instance = fiber.stateNode;
      if (instance && typeof instance === 'object' && 'componentDidMount' in instance) {
        commitMount(instance);
      }
    }
    
    // 已经在上面的Placement处理中清除了标记
  }
}

// 处理删除操作
function commitDeletion(fiber: Fiber): void {
  if (!fiber.firstEffect) return;
  
  let effect = fiber.firstEffect;
  while (effect) {
    if (effect.effectTag & EffectTag.Delete && effect.stateNode) {
      // 处理组件卸载
      if (typeof effect.type === 'function') {
        const instance = effect.stateNode;
        if (instance && typeof instance === 'object' && 'componentWillUnmount' in instance) {
          commitUnmount(instance);
        }
      }
      
      // 移除 DOM 节点
      const parentNode = effect.return?.stateNode;
      if (parentNode && effect.stateNode) {
        removeChild(parentNode, effect.stateNode);
      }
      
      // 清除标记
      effect.effectTag &= ~EffectTag.Delete;
    }
    
    effect = effect.nextEffect;
  }
}

// 处理布局效果
function commitLayoutEffects(fiber: Fiber): void {
  if (!fiber.child) return;
  
  // 先处理子节点
  commitLayoutEffects(fiber.child);
  
  // 处理兄弟节点
  let sibling = fiber.child.sibling;
  while (sibling) {
    commitLayoutEffects(sibling);
    sibling = sibling.sibling;
  }
  
  // 处理当前节点的 layout effects
  if (typeof fiber.type === 'function') {
    commitHookEffects(fiber);
  }
}

// 处理被动效果
function commitPassiveEffects(fiber: Fiber): void {
  if (!fiber.child) return;
  
  // 先处理子节点
  commitPassiveEffects(fiber.child);
  
  // 处理兄弟节点
  let sibling = fiber.child.sibling;
  while (sibling) {
    commitPassiveEffects(sibling);
    sibling = sibling.sibling;
  }
  
  // 处理当前节点的 passive effects
  if (typeof fiber.type === 'function') {
    commitPassiveHookEffects(fiber);
  }
}

// 调度回调
function scheduleCallback(callback: Function, fiber: Fiber): void {
  Promise.resolve().then(() => {
    callback(fiber);
  });
}

// 获取 DOM 容器
export function getContainer(container: Node | string): Node {
  if (typeof container === 'string') {
    const element = document.querySelector(container);
    if (!element) {
      throw new Error(`Container not found: ${container}`);
    }
    return element;
  }
  return container;
}

// 清空容器内容
export function emptyContainer(container: Node): void {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

// 渲染虚拟DOM到容器
export function render(element: any, container: Node | string): void {
  // 获取容器DOM节点
  const rootContainer = getContainer(container);
  
  // 清空容器
  emptyContainer(rootContainer);
  
  // 创建根Fiber节点
  const rootFiber = {
    type: 'root',
    stateNode: rootContainer,
    props: { children: element },
    alternate: null,
    child: null,
    sibling: null,
    return: null,
    effectTag: 0,
    memoizedProps: null,
    memoizedState: null,
    flags: 0,
    subtreeFlags: 0,
    firstEffect: null,
    lastEffect: null,
    nextEffect: null,
    priority: 0,
    expirationTime: 0,
    mode: 0,
    ref: null,
    key: null,
    pendingProps: { children: element },
  };
  
  // 调度根更新
  scheduleRootUpdate(rootFiber);
  
  console.log('Render scheduled with React-like fiber architecture');
}
