import { shallowRef, onUnmounted } from 'vue'
import type { ShallowRef } from 'vue'

export const breakpoints = {
  xs: '(max-width: 767px)',
  sm: '(min-width: 768px)',
  md: '(min-width: 992px)',
  lg: '(min-width: 1200px)',
  xl: '(min-width: 1400px)',
  xxl: '(min-width: 1880px)',
} as const

function createMediaQueryListener(query: string) {
  const mql = window.matchMedia(query)
  const matches = shallowRef<boolean>(mql.matches)
  const updateMatches = (e: MediaQueryListEvent) => {
    matches.value = e.matches
  }
  mql.addEventListener('change', updateMatches)
  const cleanup = () => {
    mql.removeEventListener('change', updateMatches)
  }
  return { matches, cleanup }
}

export function useMatchMedia(query: string): ShallowRef<boolean>
export function useMatchMedia<T extends Record<string, string>>(queries: T): { [K in keyof T]: ShallowRef<boolean> }
export function useMatchMedia<T extends Record<string, string>>(queryOrQueries: string | T) {
  if (typeof queryOrQueries === 'string') {
    const { matches, cleanup } = createMediaQueryListener(queryOrQueries)
    onUnmounted(cleanup)
    return matches
  }

  const result = {} as Record<string, ShallowRef<boolean>>
  const cleanups: (() => void)[] = []
  for (const key of Object.keys(queryOrQueries)) {
    const { matches, cleanup } = createMediaQueryListener(queryOrQueries[key])
    result[key] = matches
    cleanups.push(cleanup)
  }
  onUnmounted(() => {
    cleanups.forEach(fn => fn())
  })
  return result
}

export function useBreakpoints() {
  return useMatchMedia(breakpoints) as {
    [K in keyof typeof breakpoints]: ShallowRef<boolean>
  }
}
