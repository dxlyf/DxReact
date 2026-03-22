<template>
  <div ref="containerRef" class="sticky-container" :style="containerStyle">
    <div ref="stickyRef" class="sticky-wrapper" :class="{ 'is-sticky': isSticky }" :style="stickyStyle">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, shallowRef } from 'vue'

interface Props {
  // 距离顶部偏移量
  offsetTop?: number
  // 距离底部偏移量（用于 bottom 定位）
  offsetBottom?: number
  // 指定父容器选择器
  container?: string | HTMLElement
  // z-index
  zIndex?: number
  // 是否禁用
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  offsetTop: 0,
  offsetBottom: undefined,
  container: undefined,
  zIndex: 100,
  disabled: false,
})

const containerRef = shallowRef<HTMLDivElement>()
const stickyRef = shallowRef<HTMLDivElement>()
const isSticky = ref(false)
const stickyHeight = ref(0)
const stickyWidth = ref(0)

// 容器样式 - 保持占位
const containerStyle = computed(() => {
  if (isSticky.value && props.offsetBottom === undefined) {
    return {
      height: `${stickyHeight.value}px`,
    }
  }
  return {}
})

// sticky 元素样式
const stickyStyle = computed(() => {
  if (props.disabled) return {}

  const style: Record<string, string> = {
    zIndex: String(props.zIndex),
  }

  if (isSticky.value) {
    style.position = 'fixed'

    if (props.offsetBottom !== undefined) {
      // bottom 定位模式
      style.bottom = `${props.offsetBottom}px`
    } else {
      // top 定位模式
      style.top = `${props.offsetTop}px`
      style.width = `${stickyWidth.value}px`
    }
  }

  return style
})

// 获取容器元素
const getContainer = (): HTMLElement | Window => {
  if (!props.container) return window
  if (typeof props.container === 'string') {
    return document.querySelector(props.container) || window
  }
  return props.container
}

// 获取容器矩形信息
const getContainerRect = () => {
  const container = getContainer()
  if (container === window) {
    return {
      top: 0,
      bottom: window.innerHeight,
      height: window.innerHeight,
    }
  }
  const rect = (container as HTMLElement).getBoundingClientRect()
  return {
    top: rect.top,
    bottom: rect.bottom,
    height: rect.height,
  }
}

// 检查是否需要 sticky
const checkSticky = () => {
  if (props.disabled || !containerRef.value) return

  const containerRect = getContainerRect()
  const stickyRect = stickyRef.value?.getBoundingClientRect()
  const wrapperRect = containerRef.value.getBoundingClientRect()

  if (!stickyRect) return

  // 记录元素尺寸
  stickyHeight.value = stickyRect.height
  stickyWidth.value = wrapperRect.width

  if (props.offsetBottom !== undefined) {
    // bottom 模式：当元素底部超出容器底部时固定
    const shouldStick = wrapperRect.bottom > containerRect.bottom - props.offsetBottom
    isSticky.value = shouldStick
  } else {
    // top 模式：当元素顶部到达偏移位置时固定
    const shouldStick = wrapperRect.top <= containerRect.top + props.offsetTop
    isSticky.value = shouldStick
  }
}

// 滚动/resize 处理
let rafId: number | null = null

const handleScroll = () => {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    checkSticky()
    rafId = null
  })
}

onMounted(() => {
  checkSticky()
  const container = getContainer()
  container.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll, { passive: true })

  // 监听容器变化
  if (container !== window && 'addEventListener' in container) {
    ;(container as HTMLElement).addEventListener('scroll', handleScroll, { passive: true })
  }
})

onUnmounted(() => {
  if (rafId) {
    cancelAnimationFrame(rafId)
  }
  const container = getContainer()
  container.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)

  if (container !== window && 'removeEventListener' in container) {
    ;(container as HTMLElement).removeEventListener('scroll', handleScroll)
  }
})

defineOptions({
  name: 'Sticky',
})
</script>

<style scoped>
.sticky-container {
  position: relative;
}

.sticky-wrapper {
  position: relative;
}

.sticky-wrapper.is-sticky {
  /* fixed 定位通过内联样式设置 */
}
</style>
