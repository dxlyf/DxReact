// ======================
// Type Check Utilities
// ======================

export const isArray = Array.isArray;

export function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !isArray(value);
}

export function isFunction(value: any): value is (...args: any[]) => any {
  return typeof value === 'function';
}

export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

// ======================
// Deep Clone & Equality
// ======================

export function cloneDeep<T>(value: T): T {
  if (isArray(value)) {
    return value.map(v => cloneDeep(v)) as any;
  } else if (isObject(value)) {
    const result: Record<string, any> = {};
    for (const key in value) {
      result[key] = cloneDeep(value[key]);
    }
    return result as T;
  }
  return value;
}

export function isEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (isArray(a) && isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => isEqual(v, b[i]));
  }

  if (isObject(a) && isObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => isEqual(a[key], b[key]));
  }

  return false;
}

// ======================
// Object Path Utilities
// ======================

export function get(obj: any, path: string | string[], defaultValue?: any): any {
  const keys = Array.isArray(path) ? path : path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result == null) return defaultValue;
    result = result[key];
  }
  return result === undefined ? defaultValue : result;
}

export function set(obj: any, path: string | string[], value: any): any {
  const keys = Array.isArray(path) ? path : path.split('.');
  let curr = obj;
  keys.forEach((key, i) => {
    if (i === keys.length - 1) {
      curr[key] = value;
    } else {
      if (!isObject(curr[key]) && !isArray(curr[key])) {
        curr[key] = /^\d+$/.test(keys[i + 1]) ? [] : {};
      }
      curr = curr[key];
    }
  });
  return obj;
}

export function has(obj: any, path: string | string[]): boolean {
  const keys = Array.isArray(path) ? path : path.split('.');
  let curr = obj;
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(curr, key)) return false;
    curr = curr[key];
  }
  return true;
}

// ======================
// Object Utilities
// ======================

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) result[key] = obj[key];
  }
  return result;
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = {} as Omit<T, K>;
  for (const key in obj) {
    if (!keys.includes(key as K)) result[key] = obj[key];
  }
  return result;
}

export function merge<T extends object, S extends object>(target: T, source: S): T & S {
  const result: any = { ...target };
  for (const key in source) {
    const val = (source as any)[key];
    if (isObject(val) && isObject(result[key])) {
      result[key] = merge(result[key], val);
    } else {
      result[key] = cloneDeep(val);
    }
  }
  return result;
}

// ======================
// Function Utilities
// ======================

// export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
//   let timer: ReturnType<typeof setTimeout> | null = null;
//   return function(this: any, ...args: Parameters<T>) {
//     if (timer) clearTimeout(timer);
//     timer = setTimeout(() => fn.apply(this, args), delay);
//   } as T;
// }

export interface DebounceOptions {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  }
  
  export interface DebouncedFunction<T extends (...args: any[]) => any> {
    (...args: Parameters<T>): ReturnType<T> | undefined;
    cancel(): void;
    flush(): ReturnType<T> | undefined;
  }
  
  /**
   * 完整版 debounce（与 Lodash 行为一致）
   */
  export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait = 0,
    options: DebounceOptions = {}
  ): DebouncedFunction<T> {
    let timerId: ReturnType<typeof setTimeout> | undefined;
    let lastCallTime: number | undefined;
    let lastInvokeTime = 0;
    let result: ReturnType<T>;
    let lastArgs: Parameters<T> | undefined;
    let lastThis: any;
    const { leading = false, trailing = true, maxWait } = options;
  
    function invokeFunc(time: number) {
      lastInvokeTime = time;
      const args = lastArgs!;
      const thisArg = lastThis;
      lastArgs = lastThis = undefined;
      result = func.apply(thisArg, args);
      return result;
    }
  
    function startTimer(pendingFunc: () => void, wait: number) {
      return setTimeout(pendingFunc, wait);
    }
  
    function shouldInvoke(time: number) {
      if (lastCallTime === undefined) return true;
      const timeSinceLastCall = time - lastCallTime;
      const timeSinceLastInvoke = time - lastInvokeTime;
      return (
        timeSinceLastCall >= wait ||
        timeSinceLastCall < 0 ||
        (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
      );
    }
  
    function trailingEdge(time: number) {
      timerId = undefined;
      if (trailing && lastArgs) return invokeFunc(time);
      lastArgs = lastThis = undefined;
      return result;
    }
  
    function timerExpired() {
      const time = Date.now();
      if (shouldInvoke(time)) return trailingEdge(time);
      timerId = startTimer(timerExpired, remainingWait(time));
    }
  
    function remainingWait(time: number) {
      const timeSinceLastCall = time - lastCallTime!;
      const timeSinceLastInvoke = time - lastInvokeTime;
      const timeWaiting = wait - timeSinceLastCall;
      return maxWait === undefined
        ? timeWaiting
        : Math.min(timeWaiting, maxWait - timeSinceLastInvoke);
    }
  
    function leadingEdge(time: number) {
      lastInvokeTime = time;
      timerId = startTimer(timerExpired, wait);
      if (leading) return invokeFunc(time);
      return result;
    }
  
    function cancel() {
      if (timerId !== undefined) clearTimeout(timerId);
      lastInvokeTime = 0;
      lastCallTime = lastArgs = lastThis = timerId = undefined;
    }
  
    function flush() {
      return timerId === undefined ? result : trailingEdge(Date.now());
    }
  
    function debounced(this: any, ...args: Parameters<T>) {
      const time = Date.now();
      const isInvoking = shouldInvoke(time);
      lastArgs = args;
      lastThis = this;
      lastCallTime = time;
  
      if (isInvoking) {
        if (timerId === undefined) return leadingEdge(lastCallTime);
        if (maxWait !== undefined) {
          timerId = startTimer(timerExpired, wait);
          return invokeFunc(lastCallTime);
        }
      }
  
      if (timerId === undefined) timerId = startTimer(timerExpired, wait);
      return result;
    }
  
    (debounced as DebouncedFunction<T>).cancel = cancel;
    (debounced as DebouncedFunction<T>).flush = flush;
    return debounced as DebouncedFunction<T>;
  }
  export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
    func: T,
    wait = 0,
    options: DebounceOptions = {}
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    const debounced = debounce(func, wait, options);
  
    return (...args: Parameters<T>) =>
      new Promise<ReturnType<T>>(resolve => {
        const result = debounced(...args);
        if (result instanceof Promise) {
          result.then(resolve);
        } else {
          resolve(result as ReturnType<T>);
        }
      });
  }
    

export function throttle<T extends (...args: any[]) => any>(fn: T, limit: number) {
  let inThrottle = false;
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  } as T;
}

// ======================
// Array Utilities
// ======================

export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function flattenDeep(arr: any[]): any[] {
  return arr.reduce(
    (acc, val) => acc.concat(isArray(val) ? flattenDeep(val) : val),
    []
  );
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export function compact<T>(arr: T[]): NonNullable<T>[] {
  return arr.filter(Boolean) as NonNullable<T>[];
}
// ======================
// Set / Collection Utilities
// ======================

export function difference<T>(array: T[], values: T[]): T[] {
    const set = new Set(values);
    return array.filter(v => !set.has(v));
  }
  
  export function intersection<T>(...arrays: T[][]): T[] {
    if (arrays.length === 0) return [];
    return arrays.reduce((acc, arr) => acc.filter(v => arr.includes(v)));
  }
  
  export function union<T>(...arrays: T[][]): T[] {
    return Array.from(new Set(arrays.flat()));
  }
  
  // ======================
  // Array/Object Higher Utilities
  // ======================
  
  export function partition<T>(
    array: T[],
    predicate: (value: T, index: number, array: T[]) => boolean
  ): [T[], T[]] {
    const pass: T[] = [];
    const fail: T[] = [];
    array.forEach((item, i) => (predicate(item, i, array) ? pass : fail).push(item));
    return [pass, fail];
  }
  
  export function sortBy<T>(array: T[], iteratee: keyof T | ((v: T) => any)): T[] {
    const getter = typeof iteratee === 'function' ? iteratee : (v: T) => (v as any)[iteratee];
    return [...array].sort((a, b) => {
      const va = getter(a);
      const vb = getter(b);
      if (va > vb) return 1;
      if (va < vb) return -1;
      return 0;
    });
  }
  
  // ======================
  // Function Composition
  // ======================
  
  export function compose<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
    return (arg: T) => fns.reduceRight((res, fn) => fn(res), arg);
  }
  
  export function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
    return (arg: T) => fns.reduce((res, fn) => fn(res), arg);
  }
  
  // ======================
  // debounceLeading (立即触发版 debounce)
  // ======================
  
  export function debounceLeading<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => ReturnType<T> {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let result: ReturnType<T>;
    return function (this: any, ...args: Parameters<T>) {
      const callNow = !timer;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => (timer = null), delay);
      if (callNow) result = fn.apply(this, args);
      return result;
    };
  }
  
  // ======================
  // Math Utilities
  // ======================
  
  export function sum(arr: number[]): number {
    return arr.reduce((a, b) => a + b, 0);
  }
  
  export function average(arr: number[]): number {
    return arr.length ? sum(arr) / arr.length : NaN;
  }
  
  export function maxBy<T>(arr: T[], iteratee: (v: T) => number): T | undefined {
    if (arr.length === 0) return undefined;
    return arr.reduce((max, v) => (iteratee(v) > iteratee(max) ? v : max));
  }
  
  export function minBy<T>(arr: T[], iteratee: (v: T) => number): T | undefined {
    if (arr.length === 0) return undefined;
    return arr.reduce((min, v) => (iteratee(v) < iteratee(min) ? v : min));
  }
  