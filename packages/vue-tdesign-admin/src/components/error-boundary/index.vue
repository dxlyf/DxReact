<!-- ErrorBoundary.vue -->
<template>
  <slot v-if="!hasError" />
  <div v-else class="error-boundary">
    <div class="error-container">
      <slot name="fallback" :error="error" :resetError="resetError">
        <div class="default-fallback">
          <h3 class="error-title">组件发生错误</h3>
          <p class="error-message">{{ error?.message || '未知错误' }}</p>
          <div class="error-stack" v-if="showStack && error?.stack">
            <details>
              <summary>查看错误堆栈</summary>
              <pre class="stack-trace">{{ error.stack }}</pre>
            </details>
          </div>
          <div class="error-actions">
            <button @click="resetError" class="reset-button">
              重试
            </button>
            <button @click="reportError" class="report-button" v-if="enableReport">
              上报错误
            </button>
          </div>
        </div>
      </slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onErrorCaptured, provide, inject, reactive } from 'vue'

// 定义错误边界上下文类型
export interface ErrorBoundaryContext {
  hasError: boolean
  error: Error | null
  resetError: () => void
}

// 错误边界的 Props 类型
export interface ErrorBoundaryProps {
  fallback?: (props: { error: Error; resetError: () => void }) => any
  onError?: (error: Error, info: string) => void
  onReset?: () => void
  showStack?: boolean
  enableReport?: boolean
  reportUrl?: string
}

// 创建 Symbol 作为注入的 key
export const ERROR_BOUNDARY_CONTEXT = Symbol('error-boundary-context')

export default defineComponent({
  name: 'ErrorBoundary',
  
  props: {
    // 自定义错误回调
    onError: {
      type: Function as () => (error: Error, info: string) => void,
      default: null
    },
    // 自定义重置回调
    onReset: {
      type: Function as () => void,
      default: null
    },
    // 是否显示错误堆栈
    showStack: {
      type: Boolean,
      default: false
    },
    // 是否启用错误上报
    enableReport: {
      type: Boolean,
      default: false
    },
    // 错误上报地址
    reportUrl: {
      type: String,
      default: ''
    }
  },
  
  setup(props, { slots }) {
    const hasError = ref(false)
    const error = ref<Error | null>(null)
    const errorInfo = ref<string>('')

    // 重置错误状态
    const resetError = () => {
      hasError.value = false
      error.value = null
      errorInfo.value = ''
      props.onReset?.()
    }

    // 上报错误
    const reportError = async () => {
      if (!props.enableReport || !props.reportUrl) return
      
      try {
        const errorData = {
          message: error.value?.message,
          stack: error.value?.stack,
          componentStack: errorInfo.value,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        }

        await fetch(props.reportUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorData)
        })
        
        console.log('错误已上报')
      } catch (reportError) {
        console.error('错误上报失败:', reportError)
      }
    }

    // 捕获错误
    onErrorCaptured((err, instance, info) => {
      hasError.value = true
      error.value = err
      errorInfo.value = info
      
      // 调用自定义错误处理
      props.onError?.(err, info)
      
      // 阻止错误继续向上冒泡
      return false
    })

    // 提供错误边界上下文给子组件
    const context: ErrorBoundaryContext = reactive({
      hasError: hasError.value,
      error: error.value,
      resetError
    })

    provide(ERROR_BOUNDARY_CONTEXT, context)

    return {
      hasError,
      error,
      errorInfo,
      resetError,
      reportError,
      showStack: props.showStack,
      enableReport: props.enableReport
    }
  }
})
</script>

<style scoped>
.error-boundary {
  padding: 20px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fff;
  text-align: center;
}

.error-container {
  max-width: 600px;
  margin: 0 auto;
}

.default-fallback {
  padding: 40px 20px;
}

.error-title {
  color: #ff4d4f;
  font-size: 18px;
  margin-bottom: 12px;
  font-weight: 600;
}

.error-message {
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
  line-height: 1.6;
}

.error-stack {
  margin: 20px 0;
  text-align: left;
}

.error-stack summary {
  cursor: pointer;
  color: #1890ff;
  font-size: 14px;
  margin-bottom: 8px;
  outline: none;
}

.stack-trace {
  background: #f6f6f6;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #666;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.error-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.reset-button,
.report-button {
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
}

.reset-button {
  background: #1890ff;
  color: white;
}

.reset-button:hover {
  background: #40a9ff;
}

.report-button {
  background: #f6f6f6;
  color: #666;
  border: 1px solid #d9d9d9;
}

.report-button:hover {
  background: #e8e8e8;
}
</style>