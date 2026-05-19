import { ref, onMounted, onUnmounted, unref, type Ref } from 'vue'

export interface DraggablePosition {
  x: number
  y: number
}

export interface DraggableBounds {
  top?: number
  left?: number
  right?: number
  bottom?: number
}

export interface UseDraggableOptions {
  axis?: 'x' | 'y' | 'both'
  initialValue?: DraggablePosition
  bounds?: DraggableBounds | HTMLElement
  handle?: string
  disabled?: boolean
}

export interface UseDraggableReturn {
  position: DraggablePosition
  isDragging: Ref<boolean>
  reset: () => void
  setPosition: (pos: Partial<DraggablePosition>) => void
  stop: () => void
}

export function useDraggable(
  target: Ref<HTMLElement | null | undefined> | HTMLElement | null | undefined,
  options: UseDraggableOptions = {},
): UseDraggableReturn {
  const {
    axis = 'both',
    initialValue = { x: 0, y: 0 },
    bounds,
    handle,
    disabled = false,
  } = options

  const position = ref<DraggablePosition>({ ...initialValue })
  const isDragging = ref(false)

  let startPos: DraggablePosition = { x: 0, y: 0 }
  let startMousePos: DraggablePosition = { x: 0, y: 0 }
  let handleElement: HTMLElement | null = null
  let targetElement: HTMLElement | null = null

  const getBounds = (): DraggableBounds | null => {
    if (!bounds) return null
    if (bounds instanceof HTMLElement) {
      const rect = bounds.getBoundingClientRect()
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
      }
    }
    return bounds
  }

  const applyBounds = (pos: DraggablePosition): DraggablePosition => {
    const currentBounds = getBounds()
    if (!currentBounds || !targetElement) return pos

    const targetRect = targetElement.getBoundingClientRect()
    const targetWidth = targetRect.width
    const targetHeight = targetRect.height

    let { x, y } = pos

    if (currentBounds.left !== undefined) {
      x = Math.max(currentBounds.left, x)
    }
    if (currentBounds.right !== undefined) {
      x = Math.min(currentBounds.right - targetWidth, x)
    }
    if (currentBounds.top !== undefined) {
      y = Math.max(currentBounds.top, y)
    }
    if (currentBounds.bottom !== undefined) {
      y = Math.min(currentBounds.bottom - targetHeight, y)
    }

    return { x, y }
  }

  const onDragStart = (event: MouseEvent | TouchEvent) => {
    if (disabled) return

    const element = unref(target)
    if (!element) return

    const isTouch = 'touches' in event
    const clientX = isTouch ? (event as TouchEvent).touches[0].clientX : (event as MouseEvent).clientX
    const clientY = isTouch ? (event as TouchEvent).touches[0].clientY : (event as MouseEvent).clientY

    startPos = { ...position.value }
    startMousePos = { x: clientX, y: clientY }
    isDragging.value = true

    if (isTouch) {
      document.addEventListener('touchmove', onDragMove, { passive: false })
      document.addEventListener('touchend', onDragEnd)
    } else {
      document.addEventListener('mousemove', onDragMove)
      document.addEventListener('mouseup', onDragEnd)
    }
  }

  const onDragMove = (event: MouseEvent | TouchEvent) => {
    if (!isDragging.value) return

    event.preventDefault()

    const isTouch = 'touches' in event
    const clientX = isTouch ? (event as TouchEvent).touches[0].clientX : (event as MouseEvent).clientX
    const clientY = isTouch ? (event as TouchEvent).touches[0].clientY : (event as MouseEvent).clientY

    let dx = clientX - startMousePos.x
    let dy = clientY - startMousePos.y

    if (axis === 'x') dy = 0
    if (axis === 'y') dx = 0

    const newPos = applyBounds({
      x: startPos.x + dx,
      y: startPos.y + dy,
    })

    position.value = newPos
  }

  const onDragEnd = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', onDragEnd)
    document.removeEventListener('touchmove', onDragMove)
    document.removeEventListener('touchend', onDragEnd)
  }

  const setupHandle = () => {
    const element = unref(target)
    if (!element) return

    targetElement = element

    if (handle) {
      handleElement = element.querySelector<HTMLElement>(handle)
    }

    const triggerElement = handleElement || element

    triggerElement.addEventListener('mousedown', onDragStart)
    triggerElement.addEventListener('touchstart', onDragStart, { passive: false })
  }

  const stop = () => {
    onDragEnd()
    const element = unref(target)
    if (!element) return

    const triggerElement = handleElement || element
    triggerElement.removeEventListener('mousedown', onDragStart)
    triggerElement.removeEventListener('touchstart', onDragStart)
  }

  const reset = () => {
    position.value = { ...initialValue }
  }

  const setPosition = (pos: Partial<DraggablePosition>) => {
    position.value = {
      ...position.value,
      ...pos,
    }
  }

  onMounted(() => {
    setupHandle()
  })

  onUnmounted(() => {
    stop()
  })

  return {
    position,
    isDragging,
    reset,
    setPosition,
    stop,
  }
}
