// ======================
// Type Check Utilities
// ======================
export async function objectToCryptoHash(obj, algorithm = 'SHA-256') {
  // 1. 对象序列化
  const str = JSON.stringify(obj);
  
  // 2. 编码为字节
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  
  // 3. 计算哈希
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  
  // 4. 转换为十六进制
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

// 简单但可能不是最优
export function objectToHash(obj:any) {
  const str = JSON.stringify(obj);
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  return hash.toString(36); // 转换为36进制字符串
}


// 最标准、碰撞率极低的方案
async function generateObjectHash(obj:any) {
  // 1. 将对象转换为规范化的 JSON 字符串（按键排序）
  const canonicalString = JSON.stringify(obj, Object.keys(obj).sort());
  
  // 2. 使用 Web Crypto API 生成哈希
  const encoder = new TextEncoder();
  const data = encoder.encode(canonicalString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // 3. 转换为十六进制字符串
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 同步版本（使用 SHA-1 作为备选）
function generateObjectHashSync(obj:any) {
  const str = JSON.stringify(obj, Object.keys(obj).sort());
  return sha1Sync(str);
}

function sha1Sync(message:string) {
  function rotateLeft(n:number, b:number) {
    return (n << b) | (n >>> (32 - b));
  }
  
  const H = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
  const messageLen = message.length;
  const totalLen = messageLen * 8;
  
  // 添加填充位
  let padded = message + '\x80';
  while ((padded.length * 8) % 512 !== 448) {
    padded += '\x00';
  }
  
  // 添加长度
  padded += String.fromCharCode((totalLen >>> 24) & 0xFF);
  padded += String.fromCharCode((totalLen >>> 16) & 0xFF);
  padded += String.fromCharCode((totalLen >>> 8) & 0xFF);
  padded += String.fromCharCode(totalLen & 0xFF);
  
  // 处理每个 512 位块
  for (let i = 0; i < padded.length; i += 64) {
    const chunk = padded.substr(i, 64);
    const words = [];
    
    for (let j = 0; j < 16; j++) {
      words[j] = (
        (chunk.charCodeAt(j * 4) & 0xFF) << 24 |
        (chunk.charCodeAt(j * 4 + 1) & 0xFF) << 16 |
        (chunk.charCodeAt(j * 4 + 2) & 0xFF) << 8 |
        (chunk.charCodeAt(j * 4 + 3) & 0xFF)
      );
    }
    
    for (let j = 16; j < 80; j++) {
      words[j] = rotateLeft(
        words[j - 3] ^ words[j - 8] ^ words[j - 14] ^ words[j - 16],
        1
      );
    }
    
    let [a, b, c, d, e] = H;
    
    for (let j = 0; j < 80; j++) {
      let f, k;
      
      if (j < 20) {
        f = (b & c) | ((~b) & d);
        k = 0x5A827999;
      } else if (j < 40) {
        f = b ^ c ^ d;
        k = 0x6ED9EBA1;
      } else if (j < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8F1BBCDC;
      } else {
        f = b ^ c ^ d;
        k = 0xCA62C1D6;
      }
      
      const temp = (rotateLeft(a, 5) + f + e + k + words[j]) >>> 0;
      e = d;
      d = c;
      c = rotateLeft(b, 30);
      b = a;
      a = temp;
    }
    
    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
  }
  
  // 转换为十六进制
  return H.map(h => h.toString(16).padStart(8, '0')).join('');
}

// 简单的MurmurHash3实现
function murmurHash3(key:string, seed = 0) {
  let h1 = seed;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  const remainder = key.length & 3;
  const bytes = key.length - remainder;
  
  for (let i = 0; i < bytes; i += 4) {
    let k1 = 
      (key.charCodeAt(i) & 0xff) |
      ((key.charCodeAt(i + 1) & 0xff) << 8) |
      ((key.charCodeAt(i + 2) & 0xff) << 16) |
      ((key.charCodeAt(i + 3) & 0xff) << 24);
    
    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);
    
    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = Math.imul(h1, 5) + 0xe6546b64;
  }
  
  if (remainder > 0) {
    let k1 = 0;
    
    if (remainder === 3) k1 ^= (key.charCodeAt(bytes + 2) & 0xff) << 16;
    if (remainder >= 2) k1 ^= (key.charCodeAt(bytes + 1) & 0xff) << 8;
    if (remainder >= 1) k1 ^= (key.charCodeAt(bytes) & 0xff);
    
    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);
    h1 ^= k1;
  }
  
  h1 ^= key.length;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;
  
  return (h1 >>> 0).toString(36);
}

function objectToMurmurHash(obj:any) {
  const str = JSON.stringify(obj);
  return murmurHash3(str);
}

// 如果不一定需要哈希，需要确定性标识符
function objectToBase64(obj:any) {
  // 先对对象进行规范化（排序键）
  function normalize(obj:any):any {
    if (Array.isArray(obj)) {
      return obj.map(normalize);
    } else if (obj && typeof obj === 'object') {
      return Object.keys(obj)
        .sort()
        .reduce((acc, key) => {
          acc[key] = normalize(obj[key]);
          return acc;
        }, {});
    }
    return obj;
  }
  
  const normalized = normalize(obj);
  const str = JSON.stringify(normalized);
  return btoa(unescape(encodeURIComponent(str)));
}

function djb2Hash(str:string) {
  let hash = 5381; // 初始值
  
  for (let i = 0; i < str.length; i++) {
    // 核心计算：混合当前字符到哈希中
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  
  // 转换为32位无符号整数
  hash = hash >>> 0;
  
  // 转换为更短的字符串表示
  return hash.toString(36); // 36进制：0-9a-z
}
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
export function delay(time:number){
    return new Promise((resolve)=>{
        setTimeout(()=>{
            resolve('')
        },time)
    })
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
  