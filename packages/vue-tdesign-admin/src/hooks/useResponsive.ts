import { ref, computed, onMounted, onUnmounted, type Ref, provide,inject } from 'vue';

// types/responsive.ts
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface BreakpointConfig {
  name: Breakpoint;
  minWidth: number;
  maxWidth?: number;
}

// config/breakpoints.ts
export const breakpoints: BreakpointConfig[] = [
  { name: 'xs', minWidth: 0, maxWidth: 639 },
  { name: 'sm', minWidth: 640, maxWidth: 767 },
  { name: 'md', minWidth: 768, maxWidth: 1023 },
  { name: 'lg', minWidth: 1024, maxWidth: 1279 },
  { name: 'xl', minWidth: 1280, maxWidth: 1535 },
  { name: '2xl', minWidth: 1536 },
];

// composables/useResponsive.ts

class ResponsiveManager {
  private static instance: ResponsiveManager;
  private mediaQueryLists: Map<Breakpoint, MediaQueryList>;
  private listeners: Map<Breakpoint, Set<(matches: boolean) => void>>;
  private fallbackMode: boolean = false;
  
  private constructor() {
    this.mediaQueryLists = new Map();
    this.listeners = new Map();
    this.initializeMediaQueries();
  }
  
  static getInstance(): ResponsiveManager {
    if (!ResponsiveManager.instance) {
      ResponsiveManager.instance = new ResponsiveManager();
    }
    return ResponsiveManager.instance;
  }
  
  private initializeMediaQueries(): void {
    breakpoints.forEach(breakpoint => {
      const query = breakpoint.maxWidth 
        ? `(min-width: ${breakpoint.minWidth}px) and (max-width: ${breakpoint.maxWidth}px)`
        : `(min-width: ${breakpoint.minWidth}px)`;
      
      try {
        const mql = window.matchMedia(query);
        this.mediaQueryLists.set(breakpoint.name, mql);
        this.listeners.set(breakpoint.name, new Set());
      } catch (error) {
        console.warn(`matchMedia failed for ${breakpoint.name}, using fallback`, error);
        this.fallbackMode = true;
      }
    });
  }
  
  private getFallbackBreakpoint(width: number): Breakpoint {
    for (const breakpoint of breakpoints) {
      if (breakpoint.maxWidth) {
        if (width >= breakpoint.minWidth && width <= breakpoint.maxWidth) {
          return breakpoint.name;
        }
      } else {
        if (width >= breakpoint.minWidth) {
          return breakpoint.name;
        }
      }
    }
    return '2xl';
  }
  
  matches(breakpoint: Breakpoint): boolean {
    if (this.fallbackMode) {
      const width = window.innerWidth;
      const currentBreakpoint = this.getFallbackBreakpoint(width);
      return currentBreakpoint === breakpoint;
    }
    
    const mql = this.mediaQueryLists.get(breakpoint);
    return mql ? mql.matches : false;
  }
  
  subscribe(breakpoint: Breakpoint, callback: (matches: boolean) => void): () => void {
    if (this.fallbackMode) {
      const handleResize = () => {
        const matches = this.matches(breakpoint);
        callback(matches);
      };
      
      window.addEventListener('resize', handleResize);
      handleResize(); // 立即执行一次
      
      return () => window.removeEventListener('resize', handleResize);
    }
    
    const mql = this.mediaQueryLists.get(breakpoint);
    if (!mql) return () => {};
    
    const listener = (e: MediaQueryListEvent) => callback(e.matches);
    mql.addEventListener('change', listener);
    
    const listenersSet = this.listeners.get(breakpoint);
    if (listenersSet) {
      listenersSet.add(callback);
    }
    
    return () => {
      mql.removeEventListener('change', listener);
      const listenersSet = this.listeners.get(breakpoint);
      if (listenersSet) {
        listenersSet.delete(callback);
      }
    };
  }
  
  getCurrentBreakpoint(): Breakpoint {
    for (const breakpoint of breakpoints) {
      if (this.matches(breakpoint.name)) {
        return breakpoint.name;
      }
    }
    return '2xl';
  }
}

// Vue 3 Composables
export function useResponsive() {
  const currentBreakpoint = ref<Breakpoint>('xs');
  const breakpointMatches = ref<Record<Breakpoint, boolean>>({} as Record<Breakpoint, boolean>);
  
  let unsubscribes: Array<() => void> = [];
  
  const init = () => {
    const manager = ResponsiveManager.getInstance();
    
    // 初始化所有断点的匹配状态
    const initialMatches: Record<Breakpoint, boolean> = {} as any;
    breakpoints.forEach(bp => {
      initialMatches[bp.name] = manager.matches(bp.name);
    });
    breakpointMatches.value = initialMatches;
    
    // 订阅所有断点
    unsubscribes = breakpoints.map(bp => {
      return manager.subscribe(bp.name, (matches) => {
        breakpointMatches.value = {
          ...breakpointMatches.value,
          [bp.name]: matches
        };
        
        // 更新当前断点
        if (matches) {
          currentBreakpoint.value = bp.name;
        }
      });
    });
    
    // 初始化当前断点
    currentBreakpoint.value = manager.getCurrentBreakpoint();
  };
  
  // 便捷方法
  const is = (breakpoint: Breakpoint) => {
    return breakpointMatches.value[breakpoint] || false;
  };
  
  const isGreaterThan = (breakpoint: Breakpoint) => {
    const bpOrder = breakpoints.map(b => b.name);
    const currentIndex = bpOrder.indexOf(currentBreakpoint.value);
    const targetIndex = bpOrder.indexOf(breakpoint);
    return currentIndex > targetIndex;
  };
  
  const isLessThan = (breakpoint: Breakpoint) => {
    const bpOrder = breakpoints.map(b => b.name);
    const currentIndex = bpOrder.indexOf(currentBreakpoint.value);
    const targetIndex = bpOrder.indexOf(breakpoint);
    return currentIndex < targetIndex;
  };
  
  // Vue 3 生命周期
  if (typeof window !== 'undefined') {
    onMounted(() => {
      init();
    });
    
    onUnmounted(() => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    });
  }
  
  // 计算属性
  const isMobile = computed(() => is('xs') || is('sm'));
  const isTablet = computed(() => is('md') || is('lg'));
  const isDesktop = computed(() => is('xl') || is('2xl'));
  
  return {
    currentBreakpoint,
    breakpointMatches,
    is,
    isGreaterThan,
    isLessThan,
    isMobile,
    isTablet,
    isDesktop,
  };
}

// 响应式指令
export const vResponsive = {
  mounted(el: HTMLElement, binding: any) {
    const { value } = binding;
    const manager = ResponsiveManager.getInstance();
    
    const updateClass = () => {
      // 移除所有可能的类
      Object.values(value).forEach((className: any) => {
        if (typeof className === 'string') {
          el.classList.remove(className);
        }
      });
      
      // 添加当前断点对应的类
      for (const [breakpoint, className] of Object.entries(value)) {
        if (manager.matches(breakpoint as Breakpoint)) {
          if (typeof className === 'string') {
            el.classList.add(className);
          }
          break;
        }
      }
    };
    
    // 订阅所有断点变化
    const unsubscribes = Object.keys(value).map(breakpoint => {
      return manager.subscribe(breakpoint as Breakpoint, () => updateClass());
    });
    
    updateClass();
    
    // 存储清理函数
    (el as any)._vResponsiveCleanup = () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  },
  
  unmounted(el: HTMLElement) {
    if ((el as any)._vResponsiveCleanup) {
      (el as any)._vResponsiveCleanup();
    }
  }
};

// 响应式组件包装器
export const ResponsiveWrapper = {
  name: 'ResponsiveWrapper',
  props: {
    as: {
      type: String,
      default: 'div'
    },
    classMap: {
      type: Object as () => Record<Breakpoint, string>,
      required: true
    }
  },
  setup(props: any, { slots }: any) {
    const { breakpointMatches } = useResponsive();
    
    const currentClass = computed(() => {
      for (const [breakpoint, className] of Object.entries(props.classMap)) {
        if (breakpointMatches.value[breakpoint as Breakpoint]) {
          return className;
        }
      }
      return '';
    });
    
    return () => {
      const Component = props.as;
      return h(Component, {
        class: currentClass.value
      }, slots.default?.());
    };
  }
};

// 提供注入方式（适用于复杂组件树）
const ResponsiveSymbol = Symbol('responsive');

export const provideResponsive = () => {
  const responsive = useResponsive();
  provide(ResponsiveSymbol, responsive);
  return responsive;
};

export const injectResponsive = () => {
  return inject(ResponsiveSymbol) as ReturnType<typeof useResponsive>;
};