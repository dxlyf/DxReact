import {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
    DependencyList,
  } from 'react';
  
  /* ============================================================
   * 🧩 1. 生命周期与状态类 Hooks
   * ============================================================ */
  
  /** 判断组件是否已挂载 */
  export function useMounted(): boolean {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
      setMounted(true);
      return () => setMounted(false);
    }, []);
    return mounted;
  }
  
  /** 只在组件挂载时执行一次 */
  export function useMount(fn: () => void) {
    useEffect(() => {
      fn();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  }
  
  /** 在组件卸载时执行 */
  export function useUnmount(fn: () => void) {
    const fnRef = useRef(fn);
    fnRef.current = fn;
    useEffect(() => fnRef.current, []);
  }
  
  /** 获取上一次的值 */
  export function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T>();
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  }
  
  /** 强制组件重新渲染 */
  export function useForceUpdate(): () => void {
    const [, setTick] = useState(0);
    return useCallback(() => setTick(t => t + 1), []);
  }
  
  /* ============================================================
   * ⚙️ 2. 防抖与节流类 Hooks
   * ============================================================ */
  
  export function useDebounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number,
    deps: any[] = []
  ): T {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const debounced = useCallback((...args: any[]) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    }, deps);
  
    useEffect(() => () => timer.current && clearTimeout(timer.current), []);
    return debounced as T;
  }
  
  export function useThrottle<T extends (...args: any[]) => any>(
    fn: T,
    limit: number,
    deps: any[] = []
  ): T {
    const lastCall = useRef(0);
    const throttled = useCallback((...args: any[]) => {
      const now = Date.now();
      if (now - lastCall.current >= limit) {
        fn(...args);
        lastCall.current = now;
      }
    }, deps);
    return throttled as T;
  }
  
  export function useDebouncedValue<T>(value: T, delay = 300): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
      const timer = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
  }
  
  export function useThrottledValue<T>(value: T, limit = 300): T {
    const [throttled, setThrottled] = useState(value);
    const last = useRef(0);
    useEffect(() => {
      const now = Date.now();
      if (now - last.current >= limit) {
        setThrottled(value);
        last.current = now;
      }
    }, [value, limit]);
    return throttled;
  }
  
  /* ============================================================
   * 🧠 3. 性能优化类 Hooks
   * ============================================================ */
  
  /** 保持函数引用稳定 */
  export function useMemoizedFn<T extends (...args: any[]) => any>(fn: T): T {
    const fnRef = useRef(fn);
    fnRef.current = fn;
    const memoFn = useCallback((...args: Parameters<T>) => fnRef.current(...args), []);
    return memoFn as T;
  }
  
  /** 深比较 effect */
  export function useDeepCompareEffect(effect: React.EffectCallback, deps: any[]) {
    const ref = useRef<string>();
    const depsJSON = JSON.stringify(deps);
    if (ref.current !== depsJSON) {
      ref.current = depsJSON;
    }
    useEffect(effect, [ref.current]);
  }
  
  /* ============================================================
   * 🕹️ 4. 动画与时间控制类 Hooks
   * ============================================================ */
  
  export function useInterval(callback: () => void, delay: number | null) {
    const savedCallback = useRef(callback);
    useEffect(() => (savedCallback.current = callback), [callback]);
  
    useEffect(() => {
      if (delay === null) return;
      const tick = () => savedCallback.current();
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }, [delay]);
  }
  
  export function useTimeout(callback: () => void, delay: number | null) {
    const savedCallback = useRef(callback);
    useEffect(() => (savedCallback.current = callback), [callback]);
  
    useEffect(() => {
      if (delay === null) return;
      const id = setTimeout(() => savedCallback.current(), delay);
      return () => clearTimeout(id);
    }, [delay]);
  }
  
  /** requestAnimationFrame Hook */
  export function useRaf(callback: (t: number) => void) {
    const callbackRef = useRef(callback);
    useEffect(() => (callbackRef.current = callback), [callback]);
  
    useEffect(() => {
      let frameId: number;
      const loop = (t: number) => {
        callbackRef.current(t);
        frameId = requestAnimationFrame(loop);
      };
      frameId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(frameId);
    }, []);
  }
  
  /* ============================================================
   * 🌍 5. 网络请求与状态 Hooks
   * ============================================================ */
  
  export function useAsync<T>(
    asyncFn: () => Promise<T>,
    deps: DependencyList = []
  ): [T | null, boolean, any, () => void] {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);
  
    const run = useCallback(() => {
      setLoading(true);
      setError(null);
      asyncFn()
        .then(setData)
        .catch(setError)
        .finally(() => setLoading(false));
    }, deps);
  
    useEffect(run, [run]);
    return [data, loading, error, run];
  }
  
  /** fetch 封装 Hook */
  export function useFetch<T = any>(url: string, options?: RequestInit, deps: any[] = []): [T | null, boolean, any] {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);
  
    useEffect(() => {
      let cancelled = false;
      setLoading(true);
      fetch(url, options)
        .then(res => res.json())
        .then(d => !cancelled && setData(d))
        .catch(e => !cancelled && setError(e))
        .finally(() => !cancelled && setLoading(false));
      return () => {
        cancelled = true;
      };
    }, deps);
  
    return [data, loading, error];
  }
  
  /** WebSocket Hook */
  export function useWebSocket(url: string) {
    const ws = useRef<WebSocket | null>(null);
    const [message, setMessage] = useState<string | null>(null);
  
    useEffect(() => {
      ws.current = new WebSocket(url);
      ws.current.onmessage = e => setMessage(e.data);
      return () => {
        ws.current?.close();
      };
    }, [url]);
  
    const send = (data: string) => ws.current?.send(data);
  
    return { message, send };
  }
  
  /** 网络状态 Hook */
  export function useOnlineStatus(): boolean {
    const [online, setOnline] = useState(navigator.onLine);
    useEffect(() => {
      const update = () => setOnline(navigator.onLine);
      window.addEventListener('online', update);
      window.addEventListener('offline', update);
      return () => {
        window.removeEventListener('online', update);
        window.removeEventListener('offline', update);
      };
    }, []);
    return online;
  }
  
  /* ============================================================
   * 🧭 6. DOM/交互类 Hooks
   * ============================================================ */
  
  /** 窗口大小监听 */
  export function useWindowSize() {
    const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    useEffect(() => {
      const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
      window.addEventListener('resize', handler);
      return () => window.removeEventListener('resize', handler);
    }, []);
    return size;
  }
  
  /** 滚动监听 */
  export function useScroll(ref?: React.RefObject<HTMLElement>) {
    const [pos, setPos] = useState({ x: 0, y: 0 });
    useEffect(() => {
      const el = ref?.current || window;
      const handler = () => {
        const scrollX = 'scrollX' in el ? (el as Window).scrollX : (el as HTMLElement).scrollLeft;
        const scrollY = 'scrollY' in el ? (el as Window).scrollY : (el as HTMLElement).scrollTop;
        setPos({ x: scrollX, y: scrollY });
      };
      el.addEventListener('scroll', handler);
      return () => el.removeEventListener('scroll', handler);
    }, [ref]);
    return pos;
  }
  
  /** 点击外部检测 */
  export function useClickOutside(ref: React.RefObject<HTMLElement>, handler: (e: MouseEvent) => void) {
    useEffect(() => {
      const listener = (e: MouseEvent) => {
        if (!ref.current || ref.current.contains(e.target as Node)) return;
        handler(e);
      };
      document.addEventListener('mousedown', listener);
      return () => document.removeEventListener('mousedown', listener);
    }, [ref, handler]);
  }
  
  /** 鼠标悬停 */
  export function useHover(ref: React.RefObject<HTMLElement>) {
    const [hovered, setHovered] = useState(false);
    useEffect(() => {
      const node = ref.current;
      if (!node) return;
      const onEnter = () => setHovered(true);
      const onLeave = () => setHovered(false);
      node.addEventListener('mouseenter', onEnter);
      node.addEventListener('mouseleave', onLeave);
      return () => {
        node.removeEventListener('mouseenter', onEnter);
        node.removeEventListener('mouseleave', onLeave);
      };
    }, [ref]);
    return hovered;
  }
  
  /** 元素尺寸监听 */
  export function useSize(ref: React.RefObject<HTMLElement>) {
    const [rect, setRect] = useState<DOMRect | null>(null);
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const observer = new ResizeObserver(([entry]) => setRect(entry.contentRect));
      observer.observe(el);
      return () => observer.disconnect();
    }, [ref]);
    return rect;
  }
  
  /* ============================================================
   * 💾 7. 存储类 Hooks
   * ============================================================ */
  
  export function useLocalStorage<T>(key: string, initialValue: T) {
    const [value, setValue] = useState<T>(() => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch {
        return initialValue;
      }
    });
  
    useEffect(() => {
      localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);
  
    return [value, setValue] as const;
  }
  
  export function useSessionStorage<T>(key: string, initialValue: T) {
    const [value, setValue] = useState<T>(() => {
      try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch {
        return initialValue;
      }
    });
  
    useEffect(() => {
      sessionStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);
  
    return [value, setValue] as const;
  }
  
  /* ============================================================
   * 🧮 8. 状态管理类 Hooks
   * ============================================================ */
  
  /** 简单事件总线 Hook */
  export function useEventBus<T = any>() {
    const listeners = useRef(new Set<(data: T) => void>());
  
    const emit = useCallback((data: T) => {
      listeners.current.forEach(fn => fn(data));
    }, []);
  
    const on = useCallback((fn: (data: T) => void) => {
      listeners.current.add(fn);
      return () => listeners.current.delete(fn);
    }, []);
  
    return { emit, on };
  }
  
  /** 撤销 / 重做 Hook */
  export function useUndoRedo<T>(initial: T) {
    const [history, setHistory] = useState<T[]>([initial]);
    const [index, setIndex] = useState(0);
    const state = history[index];
  
    const set = (val: T) => {
      const newHistory = history.slice(0, index + 1);
      newHistory.push(val);
      setHistory(newHistory);
      setIndex(index + 1);
    };
    const undo = () => setIndex(i => Math.max(0, i - 1));
    const redo = () => setIndex(i => Math.min(history.length - 1, i + 1));
  
    return { state, set, undo, redo, canUndo: index > 0, canRedo: index < history.length - 1 };
  }
  
  /** 全局状态 Hook */
  export function createGlobalState<T>(initial: T) {
    let value = initial;
    const listeners = new Set<React.Dispatch<React.SetStateAction<T>>>();
  
    const useGlobalState = (): [T, React.Dispatch<React.SetStateAction<T>>] => {
      const [state, setState] = useState(value);
      useEffect(() => {
        listeners.add(setState);
        return () => listeners.delete(setState);
      }, []);
      const set = useCallback((v: React.SetStateAction<T>) => {
        value = typeof v === 'function' ? (v as any)(value) : v;
        listeners.forEach(fn => fn(value));
      }, []);
      return [state, set];
    };
  
    return useGlobalState;
  }
  