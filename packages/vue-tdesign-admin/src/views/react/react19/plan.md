# React 19 类库实施计划

> 依据 [spec.md](./spec.md) 制定。目标：从零实现一个类似 React 19 的迷你 React 库，支持函数组件、Hooks、并发/同步渲染、Suspense、错误捕获、可插拔 reconcilerConfig（默认 DOM），并配套演示页。

## 一、实施范围（对照 spec 的完整功能清单）

| 能力 | 说明 |
| --- | --- |
| `createElement` / `jsx` / `jsxDEV` 工厂 | 支持 JSX 运行时 |
| Fiber 架构 | 双缓冲 alternate、fiber tag、flags、Lane 优先级 |
| Hooks 全家桶 | useState / useReducer / useEffect / useLayoutEffect / useRef / useMemo / useCallback / useContext / useId / startTransition / useTransition |
| Context | createContext / Provider / useContext，值变化触发重渲染 |
| 渲染循环 | workLoopConcurrent（并发）/ workLoopSync（同步），时间切片、可中断 |
| 调度器 | Lane 优先级 + 时间切片 + MessageChannel，高优先级打断低优先级 |
| reconcile + diff | key 复用、数组移动、节点增删改 |
| Suspense | fallback、Promise 挂起/恢复、嵌套 Suspense |
| 异常错误捕获 | Error Boundary（类组件 API）+ ErrorBoundary 便捷封装 + 错误冒泡 |
| 渲染入口 | `render`（同步）/ `createRoot(container).render`（并发默认） |
| reconcilerConfig | 核心与 DOM 宿主解耦，可插拔扩展 |
| 事件系统 | 根节点事件委托 + 自动批处理 |
| 演示页 | 管理后台内可运行的特性演示 |

## 二、总体技术方案

- 开发语言：全量 TypeScript 开发，开启 `strict` 严格模式；核心层与宿主层均使用 TS，不用 `any` 逃避类型（仅在与真实 React 源码对照处可放宽并加注释说明）。
- 类型设计：
  - 独立类型模块：Fiber、Hook、Update、Lane、Element、ReconcilerConfig、HostInstance 等核心类型集中定义于 `core/types.ts`。
  - JSX 类型增强：自定义 `JSX.IntrinsicElements`（DOM 元素属性）、`JSX.Element`、`FC<P>` 等，让演示页 JSX 获得完整类型提示。
  - 通过 `jsx: "react-jsx"` 的 TS 编译配置配合 `jsx-runtime.ts` 导出，实现 TS 编写 JSX 直接使用本库运行时。
- 架构设计：整体分为「核心（宿主无关）+ 宿主适配（DOM）」两层，从零编写。
- 目录结构（新建 `src/views/react/react19/lib/`）：

```
lib/
├── scheduler/          # Lane 优先级 + 时间切片调度
├── core/
│   ├── types.ts        # Fiber / Hook / Update / Lane / Element 等核心类型定义
│   ├── fiber.ts        # Fiber 数据结构、创建、双缓冲
│   ├── reconciler.ts   # workLoop、beginWork、completeWork、commit、reconcileChildren
│   ├── hooks.ts        # 全部 Hooks 实现
│   ├── suspense.ts     # Suspense 挂起/恢复逻辑
│   ├── errorBoundary.ts# 错误捕获与冒泡
│   └── host.ts         # reconcilerConfig 宿主接口定义
├── host/dom.ts         # 默认 DOM 渲染器（reconcilerConfig.dom）
├── events.ts           # 事件委托系统
├── index.ts            # 对外 API 聚合导出
└── jsx-runtime.ts      # jsx / jsxDEV
demo/                   # 演示页（功能开关 + 各特性 Demo）
```

- 工程配置：`react19/lib` 配置独立 tsconfig（`strict: true`、`jsx: "react-jsx"`、`moduleResolution` 等），与 Vue 主工程隔离编译；对外导出带 `.d.ts` 类型声明。

- 核心与宿主解耦方式：`reconcilerConfig` 定义 `createInstance / createTextInstance / appendChild / insertBefore / removeChild / updateProperties / handleEvent` 等接口，DOM 渲染器为其默认实现。

### 渲染与提交流程（对齐 React 源码调用链）

渲染（render 阶段，可中断）与提交（commit 阶段，不可中断）严格参照 React 19 真实源码 `react-reconciler/src/ReactFiberWorkLoop.js` 的调用链：

```
updateContainer               // ReactFiberReconciler.js:353  入口，创建 update 挂到 root
  └─ scheduleUpdateOnFiber    // ReactFiberWorkLoop.js:972    调度，向上标记 root 的 lanes
      └─ performWorkOnRoot    // ReactFiberWorkLoop.js:1122   根渲染入口，选择并发/同步
          ├─ renderRootSync / renderRootConcurrent            // 2601 / 2757
          │   └─ workLoopSync / workLoopConcurrent            // 2750 / 3034
          │       └─ performUnitOfWork                        // 3059
          │           ├─ beginWork              // ReactFiberBeginWork.js 创建子 Fiber
          │           └─ completeUnitOfWork     // 3346
          │               └─ completeWork       // ReactFiberCompleteWork.js 标记 flags
          └─ completeRoot                       // 3489 渲染结束，进入提交
              └─ commitRoot                     // 3703 不可中断，分阶段提交
```

对应关系（React 源码位置 → 本库实现模块）：

| React 源码函数 | 本库实现位置 | 职责 |
| --- | --- | --- |
| `updateContainer` / `scheduleUpdateOnFiber` | core/reconciler.ts | 入口与调度 |
| `performWorkOnRoot` | core/reconciler.ts | 并发/同步分派 |
| `renderRootSync` / `renderRootConcurrent` | core/reconciler.ts | 渲染阶段驱动 |
| `workLoopSync` / `workLoopConcurrent` | core/reconciler.ts | 可中断工作循环 |
| `performUnitOfWork` | core/reconciler.ts | 单 Fiber 递进 |
| `beginWork` | core/reconciler.ts（beginWork） | 生成子节点 |
| `completeUnitOfWork` / `completeWork` | core/reconciler.ts（completeWork） | 冒泡 flags |
| `completeRoot` / `commitRoot` | core/reconciler.ts（commitRoot） | 提交（不可中断） |

## 三、分阶段实施计划

### M0 工程骨架与核心数据结构

- 任务：
  1. 创建 `react19/lib` 目录结构与独立 tsconfig（`strict: true`、`jsx: "react-jsx"`）。
  2. 实现 `core/types.ts`：Fiber、Hook、Update、Lane、Element 等核心类型与 `createElement`。
  3. 实现 JSX 类型声明（`JSX.IntrinsicElements` / `JSX.Element` / `FC<P>`）。
  4. 实现 scheduler：Lane 优先级定义、任务队列、时间切片（MessageChannel）、scheduleCallback。
  5. 配置 JSX 运行时映射（演示页内 vite alias：`react/jsx-runtime` → lib）。
- 产出：可编译的 TS 骨架，含 Fiber + 调度器基础，`tsc --noEmit` 通过。
- 验收：骨架在 `strict` 模式下编译通过，Lane 与任务队列单测行为正确，核心类型全部显式声明。

### M1 reconciler 核心：渲染循环与 diff

- 任务：
  1. 按 React 调用链实现 `updateContainer` / `scheduleUpdateOnFiber` → `performWorkOnRoot` → `renderRootSync / renderRootConcurrent` → `workLoop` → `performUnitOfWork` 主链路。
  2. 实现 `beginWork`：单节点、文本节点、数组（key 复用、移动、删除）的 reconcileChildren。
  3. 实现 `completeUnitOfWork` → `completeWork`：flags 冒泡与宿主实例创建。
  4. 实现 `completeRoot` → `commitRoot`：placement / update / deletion 的分阶段提交。
  5. 实现 workLoopSync 与 workLoopConcurrent（基于 scheduler 时间切片、可中断）。
- 产出：core/reconciler.ts + core/fiber.ts 完整实现，函数命名与调用链对齐 React 源码。
- 验收：同步模式下函数组件与原生元素能正确挂载、更新、卸载；调试时可用 React 源码调用链逐层对照。

### M2 Hooks 与 Context

- 任务：
  1. 实现 Hook 挂载/更新链路（mount/update 按序复用）。
  2. 实现 useState / useReducer（含惰性初始化、函数式更新、update 队列）。
  3. 实现 useEffect / useLayoutEffect（依赖数组、清理函数、执行时机）。
  4. 实现 useRef / useMemo / useCallback。
  5. 实现 createContext / useContext（Provider 以特殊 Fiber tag 挂值，value 变化沿树标记更新）。
  6. 实现 useId（按 Fiber 路径生成稳定 ID）。
  7. 实现 startTransition / useTransition（调度到 Transition Lane）。
  8. Hook 调用规则校验：条件/循环中调用时报错提示。
- 产出：core/hooks.ts 完整实现。
- 验收：对应 spec 3.2 表格全部达成。

### M3 Suspense 与异常错误捕获

- 任务：
  1. 实现 Suspense：组件 throw Promise 挂起 → 展示 fallback → resolve 后重试；reject 走错误边界。
  2. 支持嵌套 Suspense，降级到最近边界。
  3. 实现 Error Boundary：类组件 `getDerivedStateFromError` / `componentDidCatch`，失败 Fiber 沿 return 链冒泡。
  4. 覆盖渲染、Effect / LayoutEffect 执行期错误。
  5. 提供 `ErrorBoundary` 便捷封装（props 传 fallback UI）。
  6. 未捕获错误冒泡到根时打印并降级展示。
- 产出：core/suspense.ts + core/errorBoundary.ts。
- 验收：对应 spec 3.4 / 3.5 与验收项 3、4。

### M4 渲染入口、并发完善与批处理 ✅ 已完成

- 任务：
  1. 实现 `createRoot(container)`：返回 `{ render, unmount }`，默认并发模式。
  2. `render(element, container)` 保留为同步入口。
  3. 并发完善：高优先级打断低优先级、Transition 可被丢弃、提交阶段同步完成。
  4. 自动批处理：事件回调内多次 setState 合并（事件系统接入批处理边界）。
- 产出：index.ts 渲染入口 API 对齐 spec 第四章。
- 验收：对应 spec 3.3、验收项 2。

### M5 reconcilerConfig 解耦与 DOM 渲染器

- 任务：
  1. 定义 `reconcilerConfig` 接口（创建/插入/移动/删除/更新属性/事件绑定等宿主操作）。
  2. 重构 commit 阶段与属性更新，全部改走 config 调用。
  3. 将 DOM 逻辑实现为 `reconcilerConfig.dom` 默认渲染器。
  4. 事件系统独立为 `events.ts`（根节点事件委托），并在 config 中暴露挂载点。
  5. 编写「扩展自定义宿主」的 README 说明。
- 产出：core/host.ts + host/dom.ts + events.ts + 宿主接口文档。
- 验收：对应 spec 3.6、验收项 6；核心层不出现 `document.` 直接调用。

### M6 演示页与联调 ✅ 已完成

- 任务：
  1. 在 `src/views/react/react19/` 下新增演示页视图并接入管理后台路由。
  2. Demo 分区：Hooks 全家桶、并发/同步切换、Suspense 加载与嵌套、错误边界、列表 diff key 复用、Context 跨层更新。
  3. 性能观察：并发模式连续 setState 不阻塞输入（可加粗略帧率/时间统计）。
- 产出：可运行的演示页。
- 验收：对应 spec 六、七全部验收项。

### M7 收尾：文档与自检

- 任务：
  1. 补充核心流程注释与设计说明（Fiber 工作循环、调度、提交）。
  2. 对照 spec 验收标准逐条自检，输出结论。
- 产出：README/注释 + 自检清单。
- 验收：spec 验收标准 1–6 全部通过。

## 四、任务拆分汇总

| 里程碑 | 主要内容 | 对应 spec 章节 | 状态 |
| --- | --- | --- | --- |
| M0 | 工程骨架：TS 配置 + 核心类型 + Fiber + 调度器 | 五 | ✅ |
| M1 | reconciler 核心：工作循环 + diff + commit | 五 | ✅ |
| M2 | Hooks 全家桶 + Context | 3.2 | ✅ |
| M3 | Suspense + 错误捕获 | 3.4、3.5 | ✅ |
| M4 | createRoot 并发入口、批处理、调度完善 | 3.3、四 | ✅ |
| M5 | reconcilerConfig 解耦 + DOM 渲染器 + 事件系统 | 3.6、五 | ✅ |
| M6 | 演示页与特性联调 | 六 | ✅ |
| M7 | 注释、文档、自检 | 七 | ⏳ 待执行 |

## 五、实施顺序依赖

- M1 依赖 M0（Fiber + 调度器就绪后才能跑工作循环）。
- M2 依赖 M1（Hooks 挂在组件渲染流程上）。
- M3 的 Suspense 依赖 M1 的 throw 处理链路；错误边界与 Suspense 的 reject 路径需协同设计（挂起的 Promise reject 走错误边界）。
- M4 依赖 M1 的调度器与 M5 之前的事件边界（批处理需要事件系统），可与 M5 并行推进。
- M6 依赖 M2–M5 全部就绪。

## 六、风险与注意事项

- TS 严格模式成本：Fiber 循环引用、Hook 链等数据结构在 `strict` 下类型约束较复杂，需在 `core/types.ts` 先行设计好类型再实现逻辑。
- 并发正确性：提交阶段必须同步完成（不可中断），避免 UI 撕裂。
- Suspense 与错误捕获的优先级冲突：Promise reject 与组件 throw 需统一走错误冒泡链路。
- 调度正确性：时间切片阈值、优先级抢占需保证最终一致性（低优先级更新不可丢失，可被丢弃后重建）。
- 范围控制：严格按 spec 第八章「范围外」收敛，不做 Server Components、useOptimistic 等。
