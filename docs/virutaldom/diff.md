虚拟DOM的diff算法是前端框架的核心，不同框架根据自身设计理念和优化目标选择了不同的实现路径。下面我将从算法原理和源码层面，深入解析Vue2、Vue3、React、Preact和Inferno的diff算法实现。

# 🔍 主流框架虚拟DOM Diff算法源码深度解析

虚拟DOM diff算法通过比较新旧虚拟DOM树的差异，以最小代价更新真实DOM，其性能直接影响到前端框架的渲染效率。各主流框架基于不同的设计理念和优化策略，实现了各有特色的diff算法。

## 1️⃣ Vue2 Diff算法：双端比较

### 算法原理
Vue2采用经典的**双端比较算法**，通过四个指针同时从新旧子节点的两端向中间移动，进行四次比对尝试，旨在高效处理常见的前后顺序操作。

### 核心源码分析

**patch过程入口**：
```javascript
// vue/patch.ts
return function patch(oldVnode, vnode, hydrating, removeOnly) {
  if (!isRealElement && sameVnode(oldVnode, vnode)) {
    // 值得比较时执行patchVnode
    patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly)
  } else {
    // 否则直接替换
    // ...
  }
}
```

**sameVnode判断逻辑**：
```javascript
// vue/patch.ts
function sameVnode(a, b) {
  return (
    a.key === b.key &&  // key相同
    a.tag === b.tag &&  // 标签相同
    a.isComment === b.isComment &&  // 同为注释节点
    isDef(a.data) === isDef(b.data) &&  // 都拥有data属性
    sameInputType(a, b)  // 相同input类型
  )
}
```

**updateChildren核心diff逻辑**：
```javascript
// vue/patch.ts
function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
  let oldStartIdx = 0
  let newStartIdx = 0
  let oldEndIdx = oldCh.length - 1
  let oldStartVnode = oldCh[0]
  let oldEndVnode = oldCh[oldEndIdx]
  let newEndIdx = newCh.length - 1
  let newStartVnode = newCh[0]
  let newEndVnode = newCh[newEndIdx]
  
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (sameVnode(oldStartVnode, newStartVnode)) {
      // 情况1: 旧头与新头相同
      patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx)
      oldStartVnode = oldCh[++oldStartIdx]
      newStartVnode = newCh[++newStartIdx]
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      // 情况2: 旧尾与新尾相同
      patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx)
      oldEndVnode = oldCh[--oldEndIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      // 情况3: 旧头与新尾相同
      patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx)
      // 移动节点到末尾
      nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm))
      oldStartVnode = oldCh[++oldStartIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      // 情况4: 旧尾与新头相同
      patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx)
      // 移动节点到开头
      nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm)
      oldEndVnode = oldCh[--oldEndIdx]
      newStartVnode = newCh[++newStartIdx]
    } else {
      // 情况5: 四种情况都不匹配，使用key映射查找
      if (isUndef(oldKeyToIdx)) oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
      idxInOld = isDef(newStartVnode.key) ? oldKeyToIdx[newStartVnode.key] : null
      if (isUndef(idxInOld)) {
        // 没有对应key，创建新元素
        createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx)
      } else {
        // 有对应key，检查是否可复用
        vnodeToMove = oldCh[idxInOld]
        if (sameVnode(vnodeToMove, newStartVnode)) {
          patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue, newCh, newStartIdx)
          oldCh[idxInOld] = undefined
          nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm)
        } else {
          // 相同key但不同元素，创建新元素
          createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx)
        }
      }
      newStartVnode = newCh[++newStartIdx]
    }
  }
}
```

### 算法特点
- **双端比较**：同时从两端开始比较，高效处理顺序调整
- **就地复用**：通过key和标签名判断节点是否可复用
- **贪心策略**：每次循环尽可能多地匹配节点

## 2️⃣ Vue3 Diff算法：最长递增子序列优化

### 算法原理
Vue3在Vue2双端比较的基础上，引入了**最长递增子序列（LIS）算法**来最小化节点移动操作。算法分为五个处理步骤，逐步细化比较过程。

### 核心源码分析

**patchKeyedChildren入口**：
```javascript
// packages/runtime-core/src/renderer.ts
function patchKeyedChildren(
  c1, // 旧子节点
  c2, // 新子节点  
  container,
  parentAnchor,
  parentComponent,
  parentSuspense,
  isSVG,
  optimized
) {
  let i = 0
  const l2 = c2.length
  let e1 = c1.length - 1
  let e2 = l2 - 1
  
  // 1. 从前往后同步
  while (i <= e1 && i <= e2) {
    const n1 = c1[i]
    const n2 = c2[i]
    if (isSameVNodeType(n1, n2)) {
      patch(n1, n2, container, null, parentComponent, parentSuspense, isSVG, optimized)
    } else {
      break
    }
    i++
  }
  
  // 2. 从后往前同步
  while (i <= e1 && i <= e2) {
    const n1 = c1[e1]
    const n2 = c2[e2]
    if (isSameVNodeType(n1, n2)) {
      patch(n1, n2, container, null, parentComponent, parentSuspense, isSVG, optimized)
    } else {
      break
    }
    e1--
    e2--
  }
  
  // 3. 新节点多于旧节点 - 挂载
  if (i > e1) {
    if (i <= e2) {
      const nextPos = e2 + 1
      const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor
      while (i <= e2) {
        patch(null, c2[i], container, anchor, parentComponent, parentSuspense, isSVG)
        i++
      }
    }
  }
  
  // 4. 旧节点多于新节点 - 卸载
  else if (i > e2) {
    while (i <= e1) {
      unmount(c1[i], parentComponent, parentSuspense, true)
      i++
    }
  }
  
  // 5. 乱序部分 - 使用key映射和最长递增子序列
  else {
    const s1 = i
    const s2 = i
    
    // 构建key到index的映射
    const keyToNewIndexMap = new Map()
    for (i = s2; i <= e2; i++) {
      const nextChild = c2[i]
      if (nextChild.key != null) {
        keyToNewIndexMap.set(nextChild.key, i)
      }
    }
    
    // 遍历旧节点，尝试patch匹配的节点或移除不存在的节点
    let j
    let patched = 0
    const toBePatched = e2 - s2 + 1
    let moved = false
    let maxNewIndexSoFar = 0
    
    const newIndexToOldIndexMap = new Array(toBePatched)
    for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0
    
    for (i = s1; i <= e1; i++) {
      const prevChild = c1[i]
      if (patched >= toBePatched) {
        // 所有新节点都已patch，移除剩余的旧节点
        unmount(prevChild, parentComponent, parentSuspense, true)
        continue
      }
      
      let newIndex
      if (prevChild.key != null) {
        newIndex = keyToNewIndexMap.get(prevChild.key)
      } else {
        // 没有key的情况，查找相同类型的节点
        for (j = s2; j <= e2; j++) {
          if (newIndexToOldIndexMap[j - s2] === 0 &&
            isSameVNodeType(prevChild, c2[j])) {
            newIndex = j
            break
          }
        }
      }
      
      if (newIndex === undefined) {
        unmount(prevChild, parentComponent, parentSuspense, true)
      } else {
        newIndexToOldIndexMap[newIndex - s2] = i + 1
        if (newIndex >= maxNewIndexSoFar) {
          maxNewIndexSoFar = newIndex
        } else {
          moved = true
        }
        patch(prevChild, c2[newIndex], container, null, parentComponent, parentSuspense, isSVG, optimized)
        patched++
      }
    }
    
    // 使用最长递增子序列确定最小移动操作
    const increasingNewIndexSequence = moved
      ? getSequence(newIndexToOldIndexMap)
      : EMPTY_ARR
    j = increasingNewIndexSequence.length - 1
    
    for (i = toBePatched - 1; i >= 0; i--) {
      const nextIndex = s2 + i
      const nextChild = c2[nextIndex]
      const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor
      
      if (newIndexToOldIndexMap[i] === 0) {
        // 挂载新节点
        patch(null, nextChild, container, anchor, parentComponent, parentSuspense, isSVG)
      } else if (moved) {
        // 没有在递增子序列中或为尾部节点，需要移动
        if (j < 0 || i !== increasingNewIndexSequence[j]) {
          move(nextChild, container, anchor, 2)
        } else {
          j--
        }
      }
    }
  }
}
```

**最长递增子序列算法**：
```javascript
// 获取最长递增子序列
function getSequence(arr) {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  
  return result
}
```

### 算法特点
- **分治策略**：将diff过程分解为五个明确的处理阶段
- **LIS优化**：通过最长递增子序列最小化节点移动次数
- **静态标记**：编译时优化减少运行时比较
- **Fragment支持**：原生支持多根节点组件

## 3️⃣ React Diff算法：Fiber架构下的分层比较

### 算法原理
React基于Fiber架构实现了**分层diff算法**，通过链表结构实现可中断的渲染过程。React的diff遵循三个关键策略：只比较同级节点、通过组件类型判断子树复用、使用key标识稳定节点。

### 核心源码分析

**reconcileChildren入口**：
```javascript
// ReactChildFiber.old.js
export function reconcileChildren(
  current,        // 当前fiber节点
  workInProgress, // 工作中的fiber节点  
  nextChildren,   // 新的ReactElement子元素
  renderLanes     // 渲染优先级
) {
  if (current === null) {
    // mount阶段
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderLanes,
    )
  } else {
    // update阶段 - 执行diff
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderLanes,
    )
  }
}
```

**单节点diff**：
```javascript
// ReactChildFiber.old.js
function reconcileSingleElement(
  returnFiber,
  currentFirstChild,
  element,
  lanes
) {
  const key = element.key
  let child = currentFirstChild
  
  while (child !== null) {
    // 1. 比较key
    if (child.key === key) {
      // 2. 比较type
      switch (child.tag) {
        default: {
          if (child.elementType === element.type) {
            // type相同，删除剩余兄弟节点，复用当前节点
            deleteRemainingChildren(returnFiber, child.sibling)
            const existing = useFiber(child, element.props)
            existing.ref = coerceRef(returnFiber, child, element)
            existing.return = returnFiber
            return existing
          }
          break
        }
      }
      // key相同但type不同，删除所有子节点
      deleteRemainingChildren(returnFiber, child)
      break
    } else {
      // key不同，删除当前子节点
      deleteChild(returnFiber, child)
    }
    child = child.sibling
  }
  
  // 创建新Fiber节点
  const created = createFiberFromElement(element, returnFiber.mode, lanes)
  created.ref = coerceRef(returnFiber, currentFirstChild, element)
  created.return = returnFiber
  return created
}
```

**多节点diff**：
```javascript
// ReactChildFiber.old.js
function reconcileChildrenArray(
  returnFiber,
  currentFirstChild,
  newChildren,
  lanes
) {
  let resultingFirstChild = null
  let previousNewFiber = null
  
  let oldFiber = currentFirstChild
  let lastPlacedIndex = 0
  let newIdx = 0
  let nextOldFiber = null
  
  // 第一轮遍历：处理节点更新
  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    if (oldFiber.index > newIdx) {
      nextOldFiber = oldFiber
      oldFiber = null
    } else {
      nextOldFiber = oldFiber.sibling
    }
    
    const newFiber = updateSlot(
      returnFiber,
      oldFiber,
      newChildren[newIdx],
      lanes
    )
    
    if (newFiber === null) {
      // key不匹配，跳出第一轮遍历
      if (oldFiber === null) {
        oldFiber = nextOldFiber
      }
      break
    }
    
    if (shouldTrackSideEffects) {
      if (oldFiber && newFiber.alternate === null) {
        // 没有复用，删除旧节点
        deleteChild(returnFiber, oldFiber)
      }
    }
    
    lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)
    
    if (previousNewFiber === null) {
      resultingFirstChild = newFiber
    } else {
      previousNewFiber.sibling = newFiber
    }
    previousNewFiber = newFiber
    oldFiber = nextOldFiber
  }
  
  // 新children遍历完成，删除剩余旧fiber
  if (newIdx === newChildren.length) {
    deleteRemainingChildren(returnFiber, oldFiber)
    return resultingFirstChild
  }
  
  // 旧fiber遍历完成，插入剩余新节点
  if (oldFiber === null) {
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(returnFiber, newChildren[newIdx], lanes)
      if (newFiber === null) {
        continue
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber
      } else {
        previousNewFiber.sibling = newFiber
      }
      previousNewFiber = newFiber
    }
    return resultingFirstChild
  }
  
  // 处理移动的节点（key相同的节点）
  const existingChildren = mapRemainingChildren(returnFiber, oldFiber)
  
  for (; newIdx < newChildren.length; newIdx++) {
    const newFiber = updateFromMap(
      existingChildren,
      returnFiber,
      newIdx,
      newChildren[newIdx],
      lanes
    )
    
    if (newFiber !== null) {
      if (shouldTrackSideEffects) {
        if (newFiber.alternate !== null) {
          // 从map中移除复用的节点
          existingChildren.delete(
            newFiber.key === null ? newIdx : newFiber.key
          )
        }
      }
      
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)
      
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber
      } else {
        previousNewFiber.sibling = newFiber
      }
      previousNewFiber = newFiber
    }
  }
  
  // 删除map中剩余的未复用节点
  if (shouldTrackSideEffects) {
    existingChildren.forEach(child => deleteChild(returnFiber, child))
  }
  
  return resultingFirstChild
}
```

### 算法特点
- **Fiber架构**：链表结构支持可中断渲染
- **分层比较**：只比较同级节点，复杂度O(n)
- **渐进更新**：将diff过程分解为多个工作单元
- **优先级调度**：根据更新优先级安排diff任务

## 4️⃣ Preact Diff算法：轻量级优化

### 算法原理
Preact作为React的轻量级替代，采用类似的diff策略，但在实现上更加简洁高效。Preact通过积极的启发式优化和简化的算法流程，在保证性能的同时大幅减小了代码体积。

### 核心源码分析

**diff函数入口**：
```javascript
// preact/src/diff.js
export function diff(parent, newVNode, oldVNode, globalContext, isSvg, excessDomChildren, commitQueue, oldDom, isHydrating) {
  // 处理不同类型节点的diff
  if (typeof newVNode === 'string' || typeof newVNode === 'number') {
    // 文本节点
    if (oldVNode !== undefined && oldVNode.splitText !== undefined && oldVNode.parentNode !== null) {
      if (oldVNode.nodeValue != newVNode) {
        oldVNode.nodeValue = newVNode
      }
    } else {
      // 创建新文本节点
      oldDom = createTextNode(newVNode, oldDom, parent)
    }
    return oldDom
  }
  
  // 组件diff
  if (typeof newVNode.type === 'function') {
    return diffElementNodes(oldDom, newVNode, oldVNode, globalContext, isSvg, excessDomChildren, commitQueue, isHydrating)
  }
  
  // 元素节点diff
  return diffElementNodes(oldDom, newVNode, oldVNode, globalContext, isSvg, excessDomChildren, commitQueue, oldDom, isHydrating)
}
```

**innerDiffNode处理子节点**：
```javascript
// preact/src/diff.js
function innerDiffNode(parent, newChildren, oldChildren, globalContext, isSvg, excessDomChildren, commitQueue, oldDom) {
  let oldChildrenLength = oldChildren.length
  let newChildrenLength = newChildren.length
  
  // 构建key到旧节点的映射
  let oldKeyToIdx = undefined
  let idxInOld = 0
  let newChild
  let oldChild
  
  // 遍历新子节点
  for (let i = 0; i < newChildrenLength; i++) {
    newChild = newChildren[i]
    if (newChild == null) continue
    
    // 查找对应的旧子节点
    oldChild = excessDomChildren[i]
    
    if (oldChild === null || oldChild === undefined) {
      // 根据key查找
      if (newChild.key != null) {
        if (oldKeyToIdx === undefined) {
          oldKeyToIdx = {}
          for (let j = 0; j < oldChildrenLength; j++) {
            oldChild = oldChildren[j]
            if (oldChild && oldChild.key != null) {
              oldKeyToIdx[oldChild.key] = j
            }
          }
        }
        idxInOld = oldKeyToIdx[newChild.key]
      } else {
        // 没有key，按顺序查找相同类型的节点
        for (let j = 0; j < oldChildrenLength; j++) {
          oldChild = oldChildren[j]
          if (oldChild && isSameNodeType(oldChild, newChild)) {
            idxInOld = j
            break
          }
        }
      }
    }
    
    let nextOldChild = null
    if (idxInOld != null && idxInOld >= 0) {
      oldChild = oldChildren[idxInOld]
      if (oldChild && isSameNodeType(oldChild, newChild)) {
        nextOldChild = diff(parent, newChild, oldChild, globalContext, isSvg, excessDomChildren, commitQueue, oldDom)
      }
    }
    
    // 没有找到可复用的节点，创建新节点
    if (nextOldChild == null) {
      nextOldChild = diff(parent, newChild, null, globalContext, isSvg, excessDomChildren, commitQueue, oldDom)
    }
    
    // 插入到正确位置
    if (nextOldChild !== oldDom) {
      parent.insertBefore(nextOldChild, oldDom || null)
    }
    
    oldDom = nextOldChild ? nextOldChild.nextSibling : oldDom
  }
  
  return oldDom
}
```

### 算法特点
- **轻量实现**：代码量远少于React，核心diff逻辑简洁
- **启发式优化**：采用积极的节点复用策略
- **DOM优先**：直接操作DOM，减少抽象层开销
- **快速匹配**：优先通过key匹配，其次通过类型和位置匹配

## 5️⃣ Inferno Diff算法：极致性能优化

### 算法原理
Inferno以极致性能为目标，在VNode结构中加入`flags`和`childFlags`进行编译时优化，显著减少运行时类型判断。同时借鉴了Vue3的最长递增子序列算法来优化节点移动。

### 核心源码分析

**VNode结构优化**：
```javascript
// packages/inferno/src/core/VNodes.ts
export interface VNode {
  children: InfernoNode
  childFlags: ChildFlags  // 子节点类型标记
  dom: Element | null
  className: string | null | undefined  
  flags: VNodeFlags      // 节点类型标记
  key: null | number | string
  props: any
  ref: any
  type: any
}

// 节点类型标记
export const enum VNodeFlags {
  HtmlElement = 1,
  ComponentClass = 1 << 1, 
  ComponentFunction = 1 << 2,
  Text = 1 << 3
  // ...
}

// 子节点类型标记  
export const enum ChildFlags {
  HasInvalidChildren = 0,
  HasVNodeChildren = 1 << 0,
  HasKeyedChildren = 1 << 1,
  HasNonKeyedChildren = 1 << 2
  // ...
}
```

**patchChildren基于flags的优化**：
```javascript
// packages/inferno/src/core/patching.ts
export function patchChildren(
  parentVNode: VNode,
  nextChildren: InfernoChildren,
  mountAll: boolean
) {
  const prevChildren = parentVNode.children
  const prevFlags = parentVNode.childFlags
  const nextFlags = parentVNode.childFlags
  
  // 根据childFlags选择最优处理路径
  switch (prevFlags) {
    case ChildFlags.HasInvalidChildren:
      switch (nextFlags) {
        case ChildFlags.HasInvalidChildren:
          // 新旧都没有子节点，不执行操作
          break
        case ChildFlags.HasVNodeChildren:
          // 挂载单个子节点
          mountChildren(parentVNode, nextChildren as VNode)
          break
        case ChildFlags.HasKeyedChildren:
        case ChildFlags.HasNonKeyedChildren:
          // 挂载多个子节点
          mountChildren(parentVNode, nextChildren as VNode[])
          break
      }
      break
      
    case ChildFlags.HasVNodeChildren:
      switch (nextFlags) {
        case ChildFlags.HasInvalidChildren:
          // 移除单个子节点
          removeChild(prevChildren as VNode)
          break
        case ChildFlags.HasVNodeChildren:
          // 单个子节点diff
          patchSingleChild(prevChildren as VNode, nextChildren as VNode)
          break
        case ChildFlags.HasKeyedChildren:
        case ChildFlags.HasNonKeyedChildren:
          // 替换为多个子节点
          removeChild(prevChildren as VNode)
          mountChildren(parentVNode, nextChildren as VNode[])
          break
      }
      break
      
    case ChildFlags.HasKeyedChildren:
      // 使用keyed diff算法，包含LIS优化
      patchKeyedChildren(
        prevChildren as VNode[],
        nextChildren as VNode[],
        parentVNode
      )
      break
      
    case ChildFlags.HasNonKeyedChildren:
      // 非keyed diff算法
      patchNonKeyedChildren(
        prevChildren as VNode[],  
        nextChildren as VNode[],
        parentVNode
      )
      break
  }
}
```

**patchKeyedChildren实现**：
```javascript
// packages/inferno/src/core/patching.ts
function patchKeyedChildren(
  oldChildren: VNode[],
  newChildren: VNode[],
  parentVNode: VNode
) {
  // 类似Vue3的五步diff策略
  // 1. 同步前缀
  // 2. 同步后缀  
  // 3. 处理新增节点
  // 4. 处理删除节点
  // 5. 乱序部分使用LIS算法
  
  // 构建key到index的映射
  const keyToNewIndexMap = new Map()
  for (let i = s2; i <= e2; i++) {
    const nextChild = newChildren[i]
    if (nextChild.key != null) {
      keyToNewIndexMap.set(nextChild.key, i)
    }
  }
  
  // 使用最长递增子序列优化移动操作
  const increasingNewIndexSequence = getSequence(newIndexToOldIndexMap)
  let j = increasingNewIndexSequence.length - 1
  
  for (let i = toBePatched - 1; i >= 0; i--) {
    const nextIndex = s2 + i
    const nextChild = newChildren[nextIndex]
    
    if (newIndexToOldIndexMap[i] === 0) {
      // 挂载新节点
      mount(nextChild, parentDom)
    } else if (j < 0 || i !== increasingNewIndexSequence[j]) {
      // 需要移动的节点
      moveChild(nextChild, parentDom, anchor)
    } else {
      j--
    }
  }
}
```

### 算法特点
- **编译时优化**：通过flags系统减少运行时类型判断
- **类型标记**：childFlags指导选择最优diff路径
- **性能优先**：极致优化关键渲染路径
- **混合策略**：结合Vue和React的优点

## 📊 算法对比总结

| 框架 | 算法策略 | 时间复杂度 | 关键优化 | 适用场景 |
|------|----------|------------|----------|----------|
| Vue2 | 双端比较 | O(n) | 四次指针比较、就地复用 | 常规列表操作 |
| Vue3 | 双端+LIS | O(n) | 最长递增子序列、静态提升 | 复杂列表重排 |
| React | 分层比较 | O(n) | Fiber可中断、优先级调度 | 大型应用、复杂交互 |
| Preact | 轻量diff | O(n) | 启发式匹配、DOM优先 | 小型应用、性能敏感 |
| Inferno | 标记优化 | O(n) | Flags系统、LIS移动优化 | 极致性能需求 |

## 💎 总结

各主流框架的diff算法虽然在实现策略上有所不同，但都遵循相同的基本原则：通过高效的节点复用减少DOM操作，通过智能的移动策略最小化布局重排。Vue2的双端比较擅长处理顺序调整，Vue3的LIS优化在复杂重排场景表现优异，React的Fiber架构支持可中断渲染，Preact以轻量简洁取胜，Inferno则追求极致的运行时性能。

理解这些diff算法的核心原理和实现细节，有助于我们在实际开发中编写更高效的代码，合理使用key属性，避免不必要的组件重渲染，从而提升应用的整体性能。