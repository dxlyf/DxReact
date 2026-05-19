import { ref, onMounted, onUnmounted, unref, type Ref } from 'vue'

export interface SortableEvent {
  oldIndex: number
  newIndex: number
  data: any
  clonedData: any
}

export interface UseDraggableSortOptions {
  animation?: number
  handle?: string
  disabled?: boolean
  onStart?: (event: SortableEvent) => void
  onEnd?: (event: SortableEvent) => void
  onAdd?: (event: SortableEvent) => void
}

export interface UseDraggableSortReturn {
  isDragging: Ref<boolean>
  draggingIndex: Ref<number | null>
  dragOverIndex: Ref<number | null>
}

export function useDraggableSort<T = any>(
  target: Ref<HTMLElement | null | undefined>,
  list: Ref<T[]>,
  options: UseDraggableSortOptions = {},
): UseDraggableSortReturn {
  const {
    handle,
    disabled = false,
    onStart,
    onEnd,
    onAdd,
  } = options

  const isDragging = ref(false)
  const draggingIndex = ref<number | null>(null)
  const dragOverIndex = ref<number | null>(null)

  let dragData: T | null = null
  let dragElement: HTMLElement | null = null
  let placeholder: HTMLElement | null = null

  const getItemIndex = (element: HTMLElement): number | null => {
    const container = unref(target)
    if (!container) return null

    const items = Array.from(container.children)
    const index = items.indexOf(element)
    return index >= 0 ? index : null
  }

  const createPlaceholder = (): HTMLElement => {
    const el = document.createElement('div')
    el.style.opacity = '0'
    el.style.pointerEvents = 'none'
    el.style.transition = 'all 0.15s ease'
    return el
  }

  const onDragStartHandler = (event: DragEvent, index: number) => {
    if (disabled) return

    const container = unref(target)
    if (!container) return

    const item = container.children[index] as HTMLElement
    if (!item) return

    isDragging.value = true
    draggingIndex.value = index
    dragData = list.value[index]

    event.dataTransfer?.setData('text/plain', String(index))
    event.dataTransfer!.effectAllowed = 'move'

    if (event.dataTransfer) {
      event.dataTransfer.setDragImage(item, event.offsetX, event.offsetY)
    }

    dragElement = item
    item.style.opacity = '0.4'

    placeholder = createPlaceholder()
    placeholder.style.height = `${item.offsetHeight}px`
    item.parentNode?.insertBefore(placeholder, item.nextSibling)

    onStart?.({
      oldIndex: index,
      newIndex: index,
      data: dragData,
      clonedData: { ...dragData },
    })
  }

  const onDragOverHandler = (event: DragEvent, index: number) => {
    if (disabled) return
    event.preventDefault()

    const container = unref(target)
    if (!container || draggingIndex.value === null) return

    const fromIndex = draggingIndex.value
    const toIndex = index

    if (fromIndex === toIndex) return

    dragOverIndex.value = toIndex

    const items = Array.from(container.children).filter(
      (child) => child !== placeholder,
    )

    const targetItem = items[toIndex] as HTMLElement
    if (!targetItem || targetItem === dragElement) return

    const placeholderRect = placeholder?.getBoundingClientRect()
    const targetRect = targetItem.getBoundingClientRect()
    const mouseY = event.clientY

    const insertAfter = mouseY > targetRect.top + targetRect.height / 2

    if (placeholder) {
      if (insertAfter) {
        targetItem.after(placeholder)
      } else {
        targetItem.before(placeholder)
      }
    }

    const newItems = Array.from(container.children).filter(
      (child) => child !== dragElement && child !== placeholder,
    )
    const newIndex = placeholder
      ? Array.from(container.children).indexOf(placeholder)
      : toIndex

    draggingIndex.value = newIndex
    list.value = list.value.slice()
    const [movedItem] = list.value.splice(fromIndex, 1)
    list.value.splice(newIndex, 0, movedItem)
  }

  const onDropHandler = (event: DragEvent) => {
    if (disabled) return
    event.preventDefault()

    isDragging.value = false
    const rawIndex = event.dataTransfer?.getData('text/plain')
    const fromIndex = rawIndex ? Number(rawIndex) : draggingIndex.value

    if (dragElement) {
      dragElement.style.opacity = ''
    }

    if (placeholder) {
      placeholder.remove()
      placeholder = null
    }

    const toIndex = draggingIndex.value

    if (fromIndex !== null && toIndex !== null && fromIndex !== toIndex) {
      onEnd?.({
        oldIndex: fromIndex,
        newIndex: toIndex,
        data: dragData,
        clonedData: { ...dragData },
      })
    }

    draggingIndex.value = null
    dragOverIndex.value = null
    dragData = null
    dragElement = null
  }

  const onDragEndHandler = () => {
    isDragging.value = false

    if (dragElement) {
      dragElement.style.opacity = ''
    }

    if (placeholder) {
      placeholder.remove()
      placeholder = null
    }

    const fromIndex = draggingIndex.value

    if (fromIndex !== null) {
      onEnd?.({
        oldIndex: fromIndex,
        newIndex: fromIndex,
        data: dragData,
        clonedData: { ...dragData },
      })
    }

    draggingIndex.value = null
    dragOverIndex.value = null
    dragData = null
    dragElement = null
  }

  const setupItems = () => {
    const container = unref(target)
    if (!container) return

    Array.from(container.children).forEach((child, index) => {
      const item = child as HTMLElement
      item.draggable = true

      let triggerElement: HTMLElement = item

      if (handle) {
        const handleEl = item.querySelector<HTMLElement>(handle)
        if (handleEl) {
          triggerElement = handleEl
        }
      }

      triggerElement.setAttribute('data-draggable-index', String(index))

      triggerElement.addEventListener('dragstart', (event) => {
        const idx = Number(triggerElement.getAttribute('data-draggable-index'))
        onDragStartHandler(event, idx)
      })

      item.addEventListener('dragover', (event) => {
        const idx = Number(item.getAttribute('data-draggable-index'))
        onDragOverHandler(event, idx)
      })

      item.addEventListener('drop', onDropHandler)
    })
  }

  const containerDragOver = (event: DragEvent) => {
    event.preventDefault()
  }

  const containerDrop = (event: DragEvent) => {
    event.preventDefault()

    const container = unref(target)
    if (!container) return

    const items = Array.from(container.children).filter(
      (child) => child !== placeholder,
    )
    const lastIndex = items.length

    if (draggingIndex.value !== null && draggingIndex.value !== lastIndex) {
      list.value = list.value.slice()
      const [movedItem] = list.value.splice(draggingIndex.value, 1)
      list.value.splice(lastIndex, 0, movedItem)

      onAdd?.({
        oldIndex: draggingIndex.value,
        newIndex: lastIndex,
        data: dragData,
        clonedData: { ...dragData },
      })

      onEnd?.({
        oldIndex: draggingIndex.value,
        newIndex: lastIndex,
        data: dragData,
        clonedData: { ...dragData },
      })
    }

    isDragging.value = false
    draggingIndex.value = null
    dragOverIndex.value = null
    dragData = null
    dragElement = null

    if (placeholder) {
      placeholder.remove()
      placeholder = null
    }
  }

  onMounted(() => {
    const container = unref(target)
    if (!container) return

    setupItems()

    container.addEventListener('dragover', containerDragOver)
    container.addEventListener('drop', containerDrop)
    container.addEventListener('dragend', onDragEndHandler)
  })

  onUnmounted(() => {
    const container = unref(target)
    if (!container) return

    container.removeEventListener('dragover', containerDragOver)
    container.removeEventListener('drop', containerDrop)
    container.removeEventListener('dragend', onDragEndHandler)
  })

  return {
    isDragging,
    draggingIndex,
    dragOverIndex,
  }
}
