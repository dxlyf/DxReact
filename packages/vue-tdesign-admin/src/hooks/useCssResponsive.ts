// composables/useResponsive.ts
import { ref, onMounted, onUnmounted, computed, watch, type Ref } from 'vue'

/**
 * 断点配置接口
 */
export interface BreakpointConfig {
  xs?: string
  sm?: string
  md?: string
  lg?: string
  xl?: string
  xxl?: string
  [key: string]: string | undefined
}

/**
 * 默认断点配置（min-width 媒体查询）
 */
const DEFAULT_BREAKPOINTS: BreakpointConfig = {
  xs: '(min-width: 0px)',
  sm: '(min-width: 576px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 992px)',
  xl: '(min-width: 1200px)',
  xxl: '(min-width: 1400px)',
}

/**
 * 响应式状态接口
 */
export interface ResponsiveState {
  /** 当前窗口宽度 */
  width: Ref<number>
  /** 当前窗口高度 */
  height: Ref<number>
  /** 当前断点名称 */
  breakpoint: Ref<string>
  /** 匹配的断点集合 */
  matchedBreakpoints: Ref<Set<string>>
  /** 是否匹配指定查询 */
  matches: (query: string) => boolean
  /** 是否小于指定断点 */
  isLessThan: (breakpoint: string) => boolean
  /** 是否大于指定断点 */
  isGreaterThan: (breakpoint: string) => boolean
  /** 是否等于指定断点 */
  is: (breakpoint: string) => boolean
  /** 是否在两个断点之间 */
  isBetween: (minBreakpoint: string, maxBreakpoint: string) => boolean
  /** 是否为移动设备 */
  isMobile: Ref<boolean>
  /** 是否为平板设备 */
  isTablet: Ref<boolean>
  /** 是否为桌面设备 */
  isDesktop: Ref<boolean>
  /** 是否为宽屏设备 */
  isWideScreen: Ref<boolean>
  /** 是否为暗色模式 */
  isDarkMode: Ref<boolean>
  /** 是否支持触摸 */
  isTouchDevice: Ref<boolean>
  /** 是否为横屏 */
  isLandscape: Ref<boolean>
  /** 像素比 */
  pixelRatio: Ref<number>
}

/**
 * 媒体查询监听器存储
 */
interface MediaQueryListener {
  query: string
  mql: MediaQueryList
  handler: (e: MediaQueryListEvent) => void
}

/**
 * useResponsive Composable - 基于 matchMedia 实现
 * @param customBreakpoints 自定义断点配置
 * @returns 响应式状态和方法
 */
export function useResponsive(customBreakpoints?: BreakpointConfig): ResponsiveState {
  // 合并断点配置
  const breakpoints: BreakpointConfig = {
    ...DEFAULT_BREAKPOINTS,
    ...customBreakpoints,
  }

  // 过滤出有效的断点
  const validBreakpoints = Object.entries(breakpoints).filter(
    ([, query]) => query !== undefined
  ) as [string, string][]

  // 按查询条件排序（假设都是 min-width 查询）
  const sortedBreakpointEntries = validBreakpoints.sort((a, b) => {
    const aWidth = parseInt(a[1].match(/\d+/)?.[0] || '0')
    const bWidth = parseInt(b[1].match(/\d+/)?.[0] || '0')
    return aWidth - bWidth
  })

  // 响应式状态
  const width = ref<number>(0)
  const height = ref<number>(0)
  const matchedBreakpoints = ref<Set<string>>(new Set())
  const isDarkMode = ref<boolean>(false)
  const isTouchDevice = ref<boolean>(false)
  const isLandscape = ref<boolean>(false)
  const pixelRatio = ref<number>(1)

  // 存储所有媒体查询监听器
  const listeners: MediaQueryListener[] = []

  /**
   * 获取当前窗口尺寸
   */
  const updateWindowSize = () => {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  /**
   * 创建媒体查询监听器
   */
  const createMediaQueryListener = (
    query: string,
    callback: (matches: boolean) => void
  ): MediaQueryListener => {
    const mql = window.matchMedia(query)
    
    const handler = (e: MediaQueryListEvent) => {
      callback(e.matches)
    }
    
    // 初始状态
    callback(mql.matches)
    
    // 添加监听器
    mql.addEventListener('change', handler)
    
    return { query, mql, handler }
  }

  /**
   * 清除所有监听器
   */
  const cleanupListeners = () => {
    listeners.forEach(({ mql, handler }) => {
      mql.removeEventListener('change', handler)
    })
    listeners.length = 0
  }

  /**
   * 判断是否匹配指定媒体查询
   */
  const matches = (query: string): boolean => {
    return window.matchMedia(query).matches
  }

  /**
   * 获取当前断点名称
   */
  const breakpoint = computed<string>(() => {
    // 从大到小查找匹配的断点
    for (let i = sortedBreakpointEntries.length - 1; i >= 0; i--) {
      const [name, query] = sortedBreakpointEntries[i]
      if (matchedBreakpoints.value.has(name)) {
        return name
      }
    }
    return sortedBreakpointEntries[0]?.[0] || 'xs'
  })

  /**
   * 判断是否小于指定断点
   */
  const isLessThan = (targetBreakpoint: string): boolean => {
    const currentIndex = sortedBreakpointEntries.findIndex(([name]) => name === breakpoint.value)
    const targetIndex = sortedBreakpointEntries.findIndex(([name]) => name === targetBreakpoint)
    
    if (targetIndex === -1) {
      console.warn(`Breakpoint "${targetBreakpoint}" is not defined`)
      return false
    }
    
    return currentIndex < targetIndex
  }

  /**
   * 判断是否大于指定断点
   */
  const isGreaterThan = (targetBreakpoint: string): boolean => {
    const currentIndex = sortedBreakpointEntries.findIndex(([name]) => name === breakpoint.value)
    const targetIndex = sortedBreakpointEntries.findIndex(([name]) => name === targetBreakpoint)
    
    if (targetIndex === -1) {
      console.warn(`Breakpoint "${targetBreakpoint}" is not defined`)
      return false
    }
    
    return currentIndex > targetIndex
  }

  /**
   * 判断是否等于指定断点
   */
  const is = (targetBreakpoint: string): boolean => {
    if (!breakpoints[targetBreakpoint]) {
      console.warn(`Breakpoint "${targetBreakpoint}" is not defined`)
      return false
    }
    
    return breakpoint.value === targetBreakpoint
  }

  /**
   * 判断是否在两个断点之间
   */
  const isBetween = (minBreakpoint: string, maxBreakpoint: string): boolean => {
    const minIndex = sortedBreakpointEntries.findIndex(([name]) => name === minBreakpoint)
    const maxIndex = sortedBreakpointEntries.findIndex(([name]) => name === maxBreakpoint)
    const currentIndex = sortedBreakpointEntries.findIndex(([name]) => name === breakpoint.value)
    
    if (minIndex === -1 || maxIndex === -1) {
      console.warn('Invalid breakpoint names')
      return false
    }
    
    return currentIndex >= minIndex && currentIndex <= maxIndex
  }

  // 便捷的设备类型判断
  const isMobile = computed<boolean>(() => isLessThan('md'))
  const isTablet = computed<boolean>(() => isBetween('md', 'lg'))
  const isDesktop = computed<boolean>(() => isBetween('lg', 'xl'))
  const isWideScreen = computed<boolean>(() => isGreaterThan('xl'))

  // 初始化
  onMounted(() => {
    // 更新窗口尺寸
    updateWindowSize()
    
    // 监听窗口尺寸变化（用于获取具体的宽高值）
    window.addEventListener('resize', updateWindowSize)
    window.addEventListener('orientationchange', updateWindowSize)

    // 创建断点媒体查询监听器
    validBreakpoints.forEach(([name, query]) => {
      const listener = createMediaQueryListener(query, (matches) => {
        if (matches) {
          matchedBreakpoints.value = new Set([...matchedBreakpoints.value, name])
        } else {
          const newSet = new Set(matchedBreakpoints.value)
          newSet.delete(name)
          matchedBreakpoints.value = newSet
        }
      })
      listeners.push(listener)
    })

    // 暗色模式监听
    const darkModeListener = createMediaQueryListener(
      '(prefers-color-scheme: dark)',
      (matches) => {
        isDarkMode.value = matches
      }
    )
    listeners.push(darkModeListener)

    // 横屏监听
    const landscapeListener = createMediaQueryListener(
      '(orientation: landscape)',
      (matches) => {
        isLandscape.value = matches
      }
    )
    listeners.push(landscapeListener)

    // 像素比监听
    const updatePixelRatio = () => {
      pixelRatio.value = window.devicePixelRatio || 1
    }
    updatePixelRatio()
    
    // 匹配不同像素比的媒体查询
    const pixelRatioQueries = [1, 1.5, 2, 3]
    pixelRatioQueries.forEach(ratio => {
      const query = `(min-resolution: ${ratio}dppx)`
      const listener = createMediaQueryListener(query, (matches) => {
        if (matches) {
          pixelRatio.value = Math.max(pixelRatio.value, ratio)
        }
      })
      listeners.push(listener)
    })

    // 触摸设备检测
    isTouchDevice.value = matches('(hover: none) and (pointer: coarse)')
  })

  onUnmounted(() => {
    // 清理窗口监听器
    window.removeEventListener('resize', updateWindowSize)
    window.removeEventListener('orientationchange', updateWindowSize)
    
    // 清理所有媒体查询监听器
    cleanupListeners()
  })

  return {
    width,
    height,
    breakpoint,
    matchedBreakpoints,
    matches,
    isLessThan,
    isGreaterThan,
    is,
    isBetween,
    isMobile,
    isTablet,
    isDesktop,
    isWideScreen,
    isDarkMode,
    isTouchDevice,
    isLandscape,
    pixelRatio,
  }
}