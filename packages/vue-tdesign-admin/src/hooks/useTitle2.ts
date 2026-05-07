// composables/useTitle.ts
import { ref, watch, onUnmounted, type Ref } from 'vue'

export interface UseTitleOptions {
  /** 是否在组件卸载时恢复原标题 */
  restoreOnUnmount?: boolean
  /** 标题模板，例如 '%s | My App' */
  template?: string
}

/**
 * 响应式的标题管理 composable
 * @param title 初始标题或响应式标题
 * @param options 配置选项
 * @returns 标题的响应式引用和控制方法
 */
export function useTitle(
  title?: string | Ref<string>,
  options: UseTitleOptions = {}
) {
  const { restoreOnUnmount = true, template } = options
  
  // 获取原始标题，用于恢复
  const originalTitle = document.title
  
  // 创建响应式标题
  const currentTitle = ref<string>(
    title ? (typeof title === 'string' ? title : title.value) : originalTitle
  )
  
  // 格式化标题的函数
  const formatTitle = (newTitle: string): string => {
    if (template && template.includes('%s')) {
      return template.replace('%s', newTitle)
    }
    return newTitle
  }
  
  // 设置标题的函数
  const setTitle = (newTitle: string) => {
    const formattedTitle = formatTitle(newTitle)
    document.title = formattedTitle
    currentTitle.value = newTitle
  }
  
  // 恢复标题
  const restoreTitle = () => {
    document.title = originalTitle
    currentTitle.value = originalTitle
  }
  
  // 如果传入的是响应式 title，监听其变化
  if (title && typeof title !== 'string') {
    watch(
      title,
      (newTitle) => {
        setTitle(newTitle)
      },
      { immediate: true }
    )
  } else if (title && typeof title === 'string') {
    // 如果传入的是字符串，直接设置
    setTitle(title)
  }
  
  // 监听 currentTitle 的变化（当直接修改 currentTitle.value 时）
  watch(currentTitle, (newTitle) => {
    setTitle(newTitle)
  })
  
  // 组件卸载时恢复原标题
  if (restoreOnUnmount) {
    onUnmounted(() => {
      restoreTitle()
    })
  }
  
  // 返回 API
  return {
    /** 当前标题的响应式引用 */
    title: currentTitle,
    /** 设置标题 */
    setTitle,
    /** 恢复原标题 */
    restoreTitle,
    /** 获取当前标题 */
    getTitle: () => document.title,
  }
}