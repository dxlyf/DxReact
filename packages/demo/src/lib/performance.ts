// 性能监控和优化工具

// 性能指标收集器
class PerformanceMonitor {
  private startTime: number = 0;
  private endTime: number = 0;
  private metrics: Map<string, { count: number; duration: number }> = new Map();
  private enabled: boolean = false;
  
  constructor(enabled: boolean = false) {
    this.enabled = enabled;
  }
  
  // 开始测量
  start(): void {
    if (this.enabled) {
      this.startTime = performance.now();
    }
  }
  
  // 结束测量并记录指标
  end(metricName: string): number {
    if (!this.enabled) return 0;
    
    this.endTime = performance.now();
    const duration = this.endTime - this.startTime;
    
    // 更新指标
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, { count: 0, duration: 0 });
    }
    
    const metric = this.metrics.get(metricName)!;
    metric.count++;
    metric.duration += duration;
    
    return duration;
  }
  
  // 直接记录指标
  record(metricName: string, duration: number): void {
    if (!this.enabled) return;
    
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, { count: 0, duration: 0 });
    }
    
    const metric = this.metrics.get(metricName)!;
    metric.count++;
    metric.duration += duration;
  }
  
  // 打印性能报告
  printReport(): void {
    if (!this.enabled || this.metrics.size === 0) {
      console.log('Performance monitoring is disabled or no metrics collected');
      return;
    }
    
    console.log('========== PERFORMANCE REPORT ==========');
    this.metrics.forEach((value, key) => {
      const avgDuration = value.duration / value.count;
      console.log(`${key}: ${value.count} calls, total ${value.duration.toFixed(2)}ms, avg ${avgDuration.toFixed(4)}ms`);
    });
    console.log('=======================================');
  }
  
  // 重置所有指标
  reset(): void {
    this.metrics.clear();
    this.startTime = 0;
    this.endTime = 0;
  }
}

// 创建全局性能监控实例
export const performanceMonitor = new PerformanceMonitor(false); // 默认禁用

// 性能优化工具函数

// 记忆化工具
class Memoizer {
  private cache: Map<string, { value: any; timestamp: number }> = new Map();
  private maxAge: number = 60000; // 默认缓存1分钟
  
  constructor(maxAge?: number) {
    if (maxAge) {
      this.maxAge = maxAge;
    }
  }
  
  // 设置缓存
  set(key: string, value: any): void {
    this.cache.set(key, { value, timestamp: Date.now() });
  }
  
  // 获取缓存
  get(key: string): any | undefined {
    const cached = this.cache.get(key);
    if (!cached) return undefined;
    
    // 检查缓存是否过期
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return undefined;
    }
    
    return cached.value;
  }
  
  // 清除特定缓存
  clear(key: string): void {
    this.cache.delete(key);
  }
  
  // 清除所有缓存
  clearAll(): void {
    this.cache.clear();
  }
}

// 创建全局记忆化实例
export const memoizer = new Memoizer();

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: any | null = null;
  
  return function(...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    
    if (timeSinceLastCall >= wait) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      func.apply(this, args);
    } else if (!timeoutId) {
      const remainingTime = wait - timeSinceLastCall;
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        func.apply(this, args);
      }, remainingTime);
    }
  };
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: any | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, wait);
  };
}

// 批量更新工具
class BatchUpdater {
  private callbacks: Array<() => void> = [];
  private isScheduled: boolean = false;
  private microtask: boolean = true;
  
  // 添加回调到批处理队列
  add(callback: () => void): void {
    this.callbacks.push(callback);
    this.schedule();
  }
  
  // 调度批处理执行
  private schedule(): void {
    if (this.isScheduled) return;
    
    this.isScheduled = true;
    
    if (this.microtask && typeof queueMicrotask === 'function') {
      queueMicrotask(() => this.flush());
    } else if (typeof Promise === 'function') {
      Promise.resolve().then(() => this.flush());
    } else {
      setTimeout(() => this.flush(), 0);
    }
  }
  
  // 执行所有回调
  private flush(): void {
    const callbacks = this.callbacks;
    this.callbacks = [];
    this.isScheduled = false;
    
    callbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in batch update:', error);
      }
    });
  }
  
  // 立即执行批处理
  flushSync(): void {
    if (this.isScheduled) {
      this.flush();
    }
  }
}

// 创建全局批处理更新实例
export const batchUpdater = new BatchUpdater();

// 批量更新高阶函数
export function batchedUpdates<T extends (...args: any[]) => any>(func: T): (...args: Parameters<T>) => void {
  return function(...args: Parameters<T>) {
    batchUpdater.add(() => func.apply(this, args));
  };
}

// 虚拟DOM优化：对象池
 class VNodePool {
  private pool: any[] = [];
  private maxSize: number = 100;
  
  constructor(maxSize?: number) {
    if (maxSize) {
      this.maxSize = maxSize;
    }
  }
  
  // 获取一个VNode对象
  get(): { type: any; props: any; key?: any } {
    if (this.pool.length > 0) {
      const vnode = this.pool.pop()!;
      // 重置属性
      vnode.type = null;
      vnode.props = {};
      vnode.key = undefined;
      return vnode;
    }
    
    return { type: null, props: {}, key: undefined };
  }
  
  // 回收一个VNode对象
  release(vnode: any): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(vnode);
    }
  }
  
  // 清空对象池
  clear(): void {
    this.pool = [];
  }
}

// 创建全局VNode对象池
export const vnodePool = new VNodePool();

// 导出性能相关工具
export {
  PerformanceMonitor,
  Memoizer,
  BatchUpdater,
  VNodePool,
};
