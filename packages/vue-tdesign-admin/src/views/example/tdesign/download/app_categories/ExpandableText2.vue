<template>
  <div class="vue-ellipsis-expand flex">
    <p
      ref="contentRef"
      class="flex-1"
      :class="['ellipsis-content', { 'is-clamped': isClamped, 'is-expanded': isExpanded }]"
      :style="{ '--lines': props.lines }"
    >
      <slot>{{ text }}</slot>
      
  </p>
        <button
      v-if="isOverflow"
      class="toggle-button float-right flex-none self-end text-xs"
      @click="toggleExpand"
    >
      {{ isExpanded ? collapseText : expandText }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, type Ref } from 'vue'

/**
 * 多行文本展开/收缩组件属性
 */
interface Props {
  /** 最大显示行数，超出则显示省略号 */
  lines?: number
  /** 文本内容（使用默认插槽时此属性无效） */
  text?: string
  /** 展开按钮文案 */
  expandText?: string
  /** 收缩按钮文案 */
  collapseText?: string
}

/**
 * 组件事件
 */
interface Emits {
  /** 展开/收缩状态变化时触发 */
  (e: 'toggle', isExpanded: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  lines: 3,
  text: '',
  expandText: '展开',
  collapseText: '收缩',
})

const emit = defineEmits<Emits>()

// DOM 元素引用
const contentRef: Ref<HTMLElement | null> = ref(null)

// 响应式状态
const isOverflow = ref(false)      // 内容是否超出指定行数
const isExpanded = ref(false)      // 是否处于展开状态
const isClamped = ref(false)       // 是否处于截断状态（用于样式）

/**
 * 检测内容是否溢出
 * 通过比较内容实际高度与 line-height * lines 的关系判断
 */
const checkOverflow = async () => {
  await nextTick()
  const element = contentRef.value
  if (!element) return

  // 克隆元素以获取真实高度，避免操作原始DOM
  const clone = element.cloneNode(true) as HTMLElement
  clone.style.position = 'absolute'
  clone.style.visibility = 'hidden'
  clone.style.width = element.offsetWidth + 'px'
  clone.style.maxHeight = 'none'
  clone.style.webkitLineClamp = 'unset'
  
  document.body.appendChild(clone)
  
  // 获取完整内容高度
  const fullHeight = clone.scrollHeight
  
  // 获取行高（如果未设置行高，则通过字体大小估算）
  const computedStyle = window.getComputedStyle(clone)
  let lineHeight = parseFloat(computedStyle.lineHeight)
  
  // 如果 lineHeight 为 normal（通常约 1.2），使用 fontSize * 1.2 估算
  if (isNaN(lineHeight)) {
    const fontSize = parseFloat(computedStyle.fontSize)
    lineHeight = fontSize * 1.2
  }
  
  // 计算指定行数的高度
  const maxHeight = lineHeight * props.lines
  
  // 判断是否溢出
  const hasOverflow = fullHeight > maxHeight + 0.5 // 添加小误差范围
  
  // 移除克隆元素
  document.body.removeChild(clone)
  
  // 更新溢出状态
  if (isOverflow.value !== hasOverflow) {
    isOverflow.value = hasOverflow
  }
  
  // 更新截断状态
  isClamped.value = !isExpanded.value && hasOverflow
  
  // 如果未溢出，确保收缩状态被重置
  if (!hasOverflow && isExpanded.value) {
    isExpanded.value = false
    emit('toggle', false)
  }
}

/**
 * 监听截断状态变化，更新样式类
 */
watch(isExpanded, (expanded) => {
  isClamped.value = !expanded && isOverflow.value
  emit('toggle', expanded)
})

/**
 * 切换展开/收缩状态
 */
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

// 监听文本变化和 lines 属性变化，重新检测溢出
watch(
  () => [props.text, props.lines],
  () => {
    checkOverflow()
  },
  { deep: false }
)

// 组件挂载后检测溢出
onMounted(() => {
  checkOverflow()
  // 监听窗口大小变化，重新检测溢出
  window.addEventListener('resize', checkOverflow)
})

// 组件卸载时移除事件监听
import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => {
  window.removeEventListener('resize', checkOverflow)
})
</script>

<style scoped>
.vue-ellipsis-expand {
  width: 100%;
}

.ellipsis-content {
  word-break: break-word;
  /* 可选：设置合适的行高，确保溢出检测准确 */
  line-height: 1.5;
}

.ellipsis-content.is-clamped {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--lines, 3);
  overflow: hidden;
}

.ellipsis-content.is-expanded {
  display: block;
  overflow: visible;
}

.toggle-button {
  margin-top: 4px;
  padding: 0;
  border: none;
  background: transparent;
  color: #3b82f6;
  cursor: pointer;
  font-size: 12px;
  line-height: 1.5;
  outline: none;
  user-select: none;
}

.toggle-button:hover {
  color: #2563eb;
  text-decoration: underline;
}

.toggle-button:active {
  color: #1d4ed8;
}
</style>