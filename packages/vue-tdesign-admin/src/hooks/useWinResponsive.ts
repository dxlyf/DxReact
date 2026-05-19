// composables/useResponsive.ts
import { ref, onMounted, onUnmounted, computed, type Ref } from 'vue'

/**
 * 断点配置接口
 */
export interface BreakpointConfig {
  xs?: number
  sm?: number
  md?: number
  lg?: number
  xl?: number
  xxl?: number
  [key: string]: number | undefined
}

/**
 * 默认断点配置（参考 Bootstrap 5）
 */
const DEFAULT_BREAKPOINTS: Required<BreakpointConfig> = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
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
}

/**
 * useResponsive Composable
 * @param customBreakpoints 自定义断点配置
 * @returns 响应式状态和方法
 */
export function useResponsive(customBreakpoints?: Partial<BreakpointConfig>): ResponsiveState {
  // 合并断点配置
  const breakpoints: Required<BreakpointConfig> = {
    ...DEFAULT_BREAKPOINTS,
    ...customBreakpoints,
  }

  // 排序断点（从小到大）
  const sortedBreakpointKeys = Object.keys(breakpoints).sort(
    (a, b) => (breakpoints[a] || 0) - (breakpoints[b] || 0)
  )

  // 响应式状态
  const width = ref<number>(0)
  const height = ref<number>(0)

  /**
   * 获取当前断点名称
   */
  const breakpoint = computed<string>(() => {
    const currentWidth = width.value
    
    // 从大到小查找匹配的断点
    for (let i = sortedBreakpointKeys.length - 1; i >= 0; i--) {
      const key = sortedBreakpointKeys[i]
      const value = breakpoints[key]
      
      if (value !== undefined && currentWidth >= value) {
        return key
      }
    }
    
    return sortedBreakpointKeys[0]
  })

  /**
   * 判断当前宽度是否小于指定断点
   */
  const isLessThan = (targetBreakpoint: string): boolean => {
    const targetValue = breakpoints[targetBreakpoint]
    if (targetValue === undefined) {
      console.warn(`Breakpoint "${targetBreakpoint}" is not defined`)
      return false
    }
    
    const currentIndex = sortedBreakpointKeys.indexOf(breakpoint.value)
    const targetIndex = sortedBreakpointKeys.indexOf(targetBreakpoint)
    
    return currentIndex < targetIndex
  }

  /**
   * 判断当前宽度是否大于指定断点
   */
  const isGreaterThan = (targetBreakpoint: string): boolean => {
    const targetValue = breakpoints[targetBreakpoint]
    if (targetValue === undefined) {
      console.warn(`Breakpoint "${targetBreakpoint}" is not defined`)
      return false
    }
    
    const currentIndex = sortedBreakpointKeys.indexOf(breakpoint.value)
    const targetIndex = sortedBreakpointKeys.indexOf(targetBreakpoint)
    
    return currentIndex > targetIndex
  }

  /**
   * 判断当前宽度是否等于指定断点
   */
  const is = (targetBreakpoint: string): boolean => {
    if (breakpoints[targetBreakpoint] === undefined) {
      console.warn(`Breakpoint "${targetBreakpoint}" is not defined`)
      return false
    }
    
    return breakpoint.value === targetBreakpoint
  }

  /**
   * 判断当前宽度是否在两个断点之间
   */
  const isBetween = (minBreakpoint: string, maxBreakpoint: string): boolean => {
    const minIndex = sortedBreakpointKeys.indexOf(minBreakpoint)
    const maxIndex = sortedBreakpointKeys.indexOf(maxBreakpoint)
    const currentIndex = sortedBreakpointKeys.indexOf(breakpoint.value)
    
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

  /**
   * 窗口大小变化处理
   */
  let resizeTimer: ReturnType<typeof setTimeout> | null = null
  
  const handleResize = () => {
    // 防抖处理
    if (resizeTimer) {
      clearTimeout(resizeTimer)
    }
    
    resizeTimer = setTimeout(() => {
      width.value = window.innerWidth
      height.value = window.innerHeight
    }, 100)
  }

  // 生命周期
  onMounted(() => {
    // 初始化
    width.value = window.innerWidth
    height.value = window.innerHeight
    
    // 监听窗口变化
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
  })

  onUnmounted(() => {
    // 清理
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('orientationchange', handleResize)
    
    if (resizeTimer) {
      clearTimeout(resizeTimer)
    }
  })

  return {
    width,
    height,
    breakpoint,
    isLessThan,
    isGreaterThan,
    is,
    isBetween,
    isMobile,
    isTablet,
    isDesktop,
    isWideScreen,
  }
}