// @ts-nocheck
// ============================================================
// Mini React 19 演示页（react19/demo/app.tsx）
// 展示：Hooks 全家桶 / Context / 自动批处理 / 列表 key 复用 /
//       Suspense / ErrorBoundary / useTransition / 类组件
// 说明：JSX 运行时由 vite.config.ts 的 react19JsxPlugin 转换
//       （jsx: automatic, jsxImportSource: react19）；
//       TS 5.9 对自定义 jsxImportSource 的 JSX 类型检查存在
//       TS7026 问题，演示文件以 @ts-nocheck 跳过（lib 核心严格检查）
// ============================================================
import {
  Component,
  ErrorBoundary,
  Fragment,
  Suspense,
  createContext,
  use,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useTransition,
} from '../lib/index'

/* ==================== 1. Counter：useState + useEffect + useLayoutEffect + useRef ==================== */
function Counter() {
  const [count, setCount] = useState(0)
  const renders = useRef(0)
  renders.current++

  useEffect(() => {
    console.log('[Counter] useEffect: count =', count)
  }, [count])

  useLayoutEffect(() => {
    console.log('[Counter] useLayoutEffect')
  })

  return (
    <div className="card">
      <h3>1. Counter（useState / useEffect / useLayoutEffect / useRef）</h3>
      <p>
        count = <strong>{count}</strong>（本组件渲染 {renders.current} 次）
      </p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount((c) => c - 1)}>-1</button>
      <button onClick={() => setCount(0)}>reset</button>
    </div>
  )
}

/* ==================== 2. 自动批处理：事件内多次 setState 只渲染一次 ==================== */
function BatchingDemo() {
  const [a, setA] = useState(0)
  const [b, setB] = useState(0)
  const [renderCount, setRenderCount] = useState(0)

  const handleClick = () => {
    // 同一事件内多次 setState → 自动批处理 → 只触发一次渲染
    setA(a + 1)
    setB(b + 1)
    setRenderCount((c) => c + 1)
  }

  return (
    <div className="card">
      <h3>2. 自动批处理（事件委托 + batchedUpdates）</h3>
      <p>
        a = {a}，b = {b} —— 点击后本次渲染次数：<strong>{renderCount}</strong>
      </p>
      <button onClick={handleClick}>同时更新 a / b / 渲染计数</button>
      <p className="hint">控制台可见一次点击只触发一次渲染</p>
    </div>
  )
}

/* ==================== 3. Context：跨层级共享 ==================== */
const ThemeContext = createContext<'light' | 'dark'>('light')

function ThemedBox() {
  const theme = useContext(ThemeContext)
  return (
    <div
      className="card"
      style={{
        background: theme === 'dark' ? '#1f2937' : '#ffffff',
        color: theme === 'dark' ? '#f9fafb' : '#111827',
        border: '1px solid #d1d5db',
      }}
    >
      <h3>3. Context（createContext / useContext / Provider）</h3>
      <p>当前主题：{theme}</p>
    </div>
  )
}

/* ==================== 4. TodoList：useReducer + 列表 key 复用 ==================== */
type Todo = { id: number; text: string; done: boolean }
type TodoAction =
  | { type: 'add'; text: string }
  | { type: 'toggle'; id: number }
  | { type: 'remove'; id: number }
  | { type: 'shuffle' }

function todoReducer(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case 'add':
      return [...state, { id: Date.now(), text: action.text, done: false }]
    case 'toggle':
      return state.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t))
    case 'remove':
      return state.filter((t) => t.id !== action.id)
    case 'shuffle': {
      // 随机打乱顺序（不改变元素本身）→ 触发 key 复用的移动路径
      const next = [...state]
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[next[i], next[j]] = [next[j], next[i]]
      }
      return next
    }
    default:
      return state
  }
}

const initialTodos: Todo[] = [
  { id: 1, text: '学习 Fiber 架构', done: true },
  { id: 2, text: '实现 Lane 优先级调度', done: true },
  { id: 3, text: '实现 Suspense 挂起', done: false },
]

export function TodoList() {
  const [todos, dispatch] = useReducer(todoReducer, initialTodos)
  const [text, setText] = useState('')

  const addTodo = () => {
    if (text.trim() === '') return
    dispatch({ type: 'add', text })
    setText('')
  }

  return (
    <div className="card">
      <h3>4. TodoList（useReducer + 列表 key 复用）</h3>
      <div>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="输入新任务" />
        <button onClick={addTodo}>添加</button>
        <button onClick={() => dispatch({ type: 'shuffle' })}>随机排序</button>
      </div>
      <ul>
        <li>444444444</li>
        {todos.map((t) => (
          <li key={t.id}>
            <label>
              <input type="checkbox" checked={t.done} onChange={() => dispatch({ type: 'toggle', id: t.id })} />
              <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
            </label>
            <button onClick={() => dispatch({ type: 'remove', id: t.id })}>删除</button>
          </li>
        ))}
      </ul>
      <p className="hint">增删/勾选时观察：未移动项不会重新挂载（key 复用）；「随机排序」触发移动路径（Placement 重排，DOM 节点复用）</p>
    </div>
  )
}

/* ==================== 5. 类组件：生命周期 + setState ==================== */
class Clock extends Component<Record<string, never>, { time: string }> {
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(props: Record<string, never>) {
    super(props)
    this.state = { time: new Date().toLocaleTimeString() }
  }

  componentDidMount(): void {
    console.log('[Clock] componentDidMount')
    this.timer = setInterval(() => {
      this.setState({ time: new Date().toLocaleTimeString() })
    }, 1000)
  }

  componentDidUpdate(prevProps: any, prevState: any): void {
    console.log('[Clock] componentDidUpdate', prevState.time, '→', this.state.time)
  }

  componentWillUnmount(): void {
    console.log('[Clock] componentWillUnmount')
    if (this.timer !== null) clearInterval(this.timer)
  }

  render(): any {
    return (
      <div className="card">
        <h3>5. 类组件（extends Component + 生命周期）</h3>
        <p>⏰ {this.state.time}</p>
      </div>
    )
  }
}

/* ==================== 6. useTransition：低优先级更新 ==================== */
function generateList(query: string): string[] {
  return Array.from({ length: 200 }, (_, i) => `${query}-${i}`)
}

function TransitionDemo() {
  const [query, setQuery] = useState('')
  const [list, setList] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: any) => {
    const value = e.target.value
    setQuery(value) // 高优先级：输入框立即响应
    startTransition(() => {
      // 低优先级：大列表更新可被中断
      setList(generateList(value))
    })
  }

  return (
    <div className="card">
      <h3>6. useTransition / startTransition（低优先级更新）</h3>
      <input value={query} onChange={handleChange} placeholder="输入关键字生成大列表" />
      {isPending && <span style={{ color: '#f59e0b' }}> 渲染中（可被高优任务中断）…</span>}
      <div style={{ maxHeight: 120, overflow: 'auto', border: '1px solid #e5e7eb', padding: 8 }}>
        {list.map((item, i) => (
          <div key={i}>{item}</div>
        ))}
      </div>
    </div>
  )
}

/* ==================== 7. Suspense：throw promise 挂起 ==================== */
function createResource<T>(loader: () => Promise<T>) {
  let status: 'pending' | 'fulfilled' | 'rejected' = 'pending'
  let result: T = null as any
  let error: any = null
  const promise = loader().then(
    (v) => {
      status = 'fulfilled'
      result = v
    },
    (e) => {
      status = 'rejected'
      error = e
    },
  )
  return {
    promise,
    read(): T {
      if (status === 'fulfilled') return result
      if (status === 'rejected') throw error
      // pending：抛 promise → 被 Suspense 边界捕获 → 渲染 fallback
      throw promise
    },
  }
}

function AsyncContent({ resource }: { resource: ReturnType<typeof createResource<string>> }) {
  const data = resource.read()
  return <p>{data}</p>
}

function UseContent({ promise }: { promise: Promise<string> }) {
  const data = use(promise)
  return <p>{data}</p>
}

function SuspenseDemo() {
  const [resource, setResource] = useState<{
    slow: ReturnType<typeof createResource<string>>
    use: Promise<string>
  } | null>(null)
  return (
    <div className="card">
      <h3>7. Suspense + use（挂起 / fallback / 恢复）</h3>
      <button
        onClick={() => {
          if (resource !== null) {
            setResource(null)
            return
          }
          // 每次点击创建新的资源：未 resolve 前挂起渲染 fallback，就绪后恢复
          setResource({
            slow: createResource<string>(
              () => new Promise((resolve) => setTimeout(() => resolve('✅ 异步数据加载完成（Suspense + throw promise）'), 1500)),
            ),
            use: new Promise<string>((resolve) => setTimeout(() => resolve('✅ use() 消费的异步数据'), 1200)),
          })
        }}
      >
        {resource !== null ? '卸载' : '加载异步内容'}
      </button>
      {resource !== null && (
        <>
          <Suspense fallback={<p className="pending">⏳ 加载中（fallback）…</p>}>
            <AsyncContent resource={resource.slow} />
          </Suspense>
          <Suspense fallback={<p className="pending">⏳ 加载中（use）…</p>}>
            <UseContent promise={resource.use} />
          </Suspense>
        </>
      )}
    </div>
  )
}

/* ==================== 8. ErrorBoundary：错误捕获 ==================== */
function Bomb() {
  throw new Error('💥 组件渲染时抛出的错误')
}

function ErrorDemo() {
  const [show, setShow] = useState(false)
  return (
    <div className="card">
      <h3>8. ErrorBoundary（getDerivedStateFromError / componentDidCatch）</h3>
      <ErrorBoundary fallback={(error: any) => <p style={{ color: '#dc2626' }}>已捕获错误：{String(error)}</p>}>
        <button onClick={() => setShow(true)}>触发渲染错误</button>
        {show ? <Bomb /> : <p>点击上方按钮触发子组件抛错</p>}
      </ErrorBoundary>
    </div>
  )
}

/* ==================== 9. useMemo / useCallback / useId ==================== */
function MemoDemo() {
  const [n, setN] = useState(0)
  const [other, setOther] = useState(0)
  const id = useId()

  const fib = useMemo(() => {
    // 迭代计算（O(n)），避免指数递归在 n 较大时卡死；NaN 时循环不进入，返回安全值
    const compute = (x: number): number => {
      if (x <= 1) return x
      let a = 0
      let b = 1
      for (let i = 2; i <= x; i++) {
        const t = a + b
        a = b
        b = t
      }
      return b
    }
    return compute(n)
  }, [n])

  const onClick = useCallback(() => {
    setOther((o) => o + 1)
  }, [])

  return (
    <div className="card">
      <h3>9. useMemo / useCallback / useId</h3>
      <label htmlFor={`${id}-input`}>输入 n：</label>
      <input
        id={`${id}-input`}
        type="number"
        value={n}
        onChange={(e) => {
          // number input 中间态（如 '-'）会产生 NaN，归一为 0，避免渲染/计算异常
          const num = Number(e.target.value)
          setN(Number.isNaN(num) ? 0 : num)
        }}
      />
      <p>
        fib({n}) = <strong>{fib}</strong>（useMemo 缓存，仅 n 变化重算）
      </p>
      <button onClick={onClick}>other = {other}（useCallback 记忆）</button>
    </div>
  )
}

/* ==================== App 汇总 ==================== */
export function App() {
  return (
    <div className="react19-app">
      <h1>Mini React 19</h1>
      <p className="subtitle">
        自研迷你 React：Fiber reconciler + Lane 优先级调度 + 时间切片 + Hooks + Suspense + ErrorBoundary
      </p>

      <ThemeContext.Provider value="dark">
        <ThemedBox />
      </ThemeContext.Provider>

      <Counter />
      <BatchingDemo />
      <TodoList />
      <MemoDemo />
      <Clock />
      <TransitionDemo />
      <SuspenseDemo />
      <ErrorDemo />
    </div>
  )
}

// Fragment 引用占位（演示导出可用）
export { Fragment }
