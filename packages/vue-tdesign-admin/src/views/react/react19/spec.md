# React 19 类库实现需求

## 一、业务描述

从零实现一个类似 React 19 的迷你 React 库（下称「本库」），以教学与工程实践为目的，深度还原 React 核心设计思想，而非追求 API 全量兼容。支持函数组件、Hooks、并发与同步渲染、Suspense、异常错误捕获、可插拔的 reconcilerConfig（默认内置 DOM 渲染器）等特性，并能够在一个简单的演示页面中完整运行。

## 二、目标与定位

- 不依赖任何第三方运行时，核心代码不引用 `react` / `react-dom`。
- 采用 Fiber 架构，实现可中断的渲染流程，为并发特性提供基础。
- 公开 API 风格对齐 React 19（如 `createRoot`、`useState`、`useEffect` 等），便于使用者无成本迁移与对比。
- 产物可通过打包器（Vite 等）直接运行，作为 Vue 后台管理系统中的演示模块展示。

## 三、功能需求

### 3.1 函数组件与 JSX

- 支持函数组件（Function Component），组件首字母大写约定与 React 一致。
- 提供 `createElement(type, props, ...children)` 及 `jsx` / `jsxDEV` 工厂，支持 JSX 运行时（`react/jsx-runtime`）。
- 支持组件组合、嵌套、Fragment、条件渲染、列表渲染（`key` 复用）。

### 3.2 Hooks

需实现以下 Hooks，语义与 React 一致，并保证在函数组件内按固定顺序调用：

| Hook | 要求 |
| --- | --- |
| `useState` | 支持函数式更新、惰性初始化 |
| `useReducer` | 支持多种 action 类型与初始化/懒初始化 |
| `useEffect` | 支持依赖数组、清理函数，执行时机在提交后 |
| `useLayoutEffect` | 执行时机在提交前（同步） |
| `useRef` | 跨渲染保持引用 |
| `useMemo` / `useCallback` | 依赖变化时重新计算/重建 |
| `useContext` | 跨层级共享数据，提供 `createContext`，值变化触发重渲染 |
| `useId` | 生成稳定唯一 ID（可选，用于 SSR 友好） |

- 未满足 Hook 调用规则的场景（如条件调用、循环中调用）需给出明确报错提示。

### 3.3 渲染模式：并发渲染与同步渲染

- 同步渲染：`render` 一次性完成整棵树的渲染与提交，适合首屏与简单场景。
- 并发渲染：`createRoot(...).render(...)` 默认并发模式，支持：
  - 基于优先级的调度（紧急/过渡任务），高优先级任务可打断低优先级任务；
  - 可中断渲染：render 阶段可暂停/恢复/放弃，提交阶段不可中断；
  - 过渡更新：提供 `startTransition`，标记低优先级更新，允许中途丢弃以保持 UI 响应；
  - 自动批处理（Automatic Batching）：同一事件内多次 setState 合并为一次渲染。
- 两种模式共用一套 Fiber 工作循环，通过配置开关切换。

### 3.4 Suspense

- 提供 `Suspense` 组件，支持 `fallback`。
- 组件内可 throw 一个 Promise（或返回带 `then` 的对象）以触发挂起（suspend）。
- 挂起后展示 fallback，Promise resolve 后重试渲染；失败（reject）时交由最近的错误边界处理。
- 支持嵌套 Suspense、`use` Hook（可选：支持 Promise 资源）。

### 3.5 异常错误捕获

- 实现 Error Boundary（类组件 `componentDidCatch` / `getDerivedStateFromError`），未捕获错误向上冒泡直至根。
- 提供 `ErrorBoundary` 便捷封装，支持以 props 形式提供 fallback UI。
- 渲染、生命周期、Effect 中抛出的错误均能被捕获。

### 3.6 reconcilerConfig（可插拔渲染器）

- 核心 reconciler 与宿主环境解耦，通过 `reconcilerConfig` 抽象宿主相关能力。
- 默认内置 DOM 渲染器（`reconcilerConfig.dom`），支持：
  - 原生元素（div/span/input 等）的创建、属性与事件绑定/解绑、样式处理；
  - 文本节点；
  - 插入/移动/删除节点的增删改（diff 阶段基于 key 的复用与移动）。
- 预留宿主扩展点：文档中说明如何基于 config 实现其他宿主（如 Canvas、自定义环境）。

## 四、对外 API 设计

```ts
// 核心 API
createElement / jsx / jsxDEV
Fragment, Suspense, ErrorBoundary(便捷封装)
createContext, useContext
useState, useReducer, useEffect, useLayoutEffect,
useRef, useMemo, useCallback, useContext, useId
startTransition, useTransition(可选)
useSyncExternalStore(可选)

// 渲染入口
render(element, container)          // 同步渲染
createRoot(container).render(element) // 并发渲染（默认）
reconcilerConfig.dom                // 默认 DOM 渲染器配置
```

## 五、架构需求

- 模块划分：`scheduler`（调度）、`reconciler`（协调）、`fiber`（节点与工作循环）、`hooks`、`domRenderer`（宿主）、`events`（事件系统）等。
- 并发模式下：workLoop 支持时间切片（基于 `MessageChannel` 或 `requestIdleCallback` 模拟），可被高优先级任务打断。
- 提交阶段保证同步完成，避免撕裂 UI。

## 六、非功能需求

- 代码整洁、有类型（TypeScript），关键流程有注释说明设计意图。
- 演示页展示核心特性：函数组件、各 Hooks、并发/同步切换、Suspense 加载态、错误捕获、列表 diff 复用。
- 兼容现代浏览器（Chrome/Edge/Firefox 最新版）。

## 七、验收标准

1. 演示页中函数组件、全部必选 Hooks、Fragment、列表 key 复用均能正常工作。
2. 同步渲染与并发渲染可切换，切换后行为一致；并发模式下连续 setState 不卡顿（被时间切片分片处理）。
3. Suspense 挂起时展示 fallback，数据就绪后恢复渲染；嵌套 Suspense 正确降级到最近边界。
4. 组件树中任意位置抛错，能被最近的 Error Boundary 捕获并展示 fallback UI。
5. 不依赖 `react` / `react-dom`，核心代码可独立打包运行。
6. reconcilerConfig 中 DOM 渲染器覆盖元素创建、属性/事件、节点增删改，且支持按文档扩展其他宿主。

## 八、范围外（非目标）

- 不实现完整 React 完整版的所有 API（如 Server Components、Actions、Form Actions、`useOptimistic` 等）。
- 不做生产级性能优化（如 bailout 优化、缓存编译），重在正确性与设计还原。
