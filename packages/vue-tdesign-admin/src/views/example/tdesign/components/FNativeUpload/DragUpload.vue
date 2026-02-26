<script setup lang="ts">
import { ref, computed } from 'vue'
import { useControllerValue } from '@/hooks/useControllerValue'

interface FileInfo {
  uid: number
  originalFile: File
  url?: string
  name: string
  thumbnail?: string
  status: 'success' | 'fail' | 'progress' | 'pending'
  percent: number
  response?: any
}

interface Props {
  modelValue?: FileInfo | null
  defaultValue?: FileInfo | null
  accept?: string
  maxSize?: number // MB
  action?: string
}

const props = withDefaults(defineProps<Props>(), {
  accept: 'image/*',
  maxSize: 10,
  action: '/api/upload'
})

const emit = defineEmits<{
  'update:modelValue': [value: FileInfo | null]
  change: [file: FileInfo | null]
  success: [response: any, file: FileInfo]
  error: [error: any, file: FileInfo]
}>()

// 使用受控值管理
const { value: fileInfo, setValue } = useControllerValue<FileInfo | null>(
  props,
  emit,
  { defaultValue: props.defaultValue ?? null }
)

const fileInputRef = ref<HTMLInputElement>()
const isDragOver = ref(false)
const uploadUid = ref(0)

// 计算属性
const hasFile = computed(() => fileInfo.value !== null)
const isUploading = computed(() => fileInfo.value?.status === 'progress')
const uploadPercent = computed(() => fileInfo.value?.percent ?? 0)
const previewUrl = computed(() => {
  if (!fileInfo.value) return ''
  return fileInfo.value.thumbnail || fileInfo.value.url
})

// 创建文件信息对象
const createFileInfo = (file: File): FileInfo => ({
  uid: uploadUid.value++,
  originalFile: file,
  name: file.name,
  percent: 0,
  status: 'pending',
  url: ''
})

// 文件转 Base64 预览
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.readAsDataURL(file)
  })
}

// 上传文件
const uploadFile = async (fileInfo: FileInfo) => {
  const updateFile = (updates: Partial<FileInfo>) => {
    const current = fileInfo
    Object.assign(current, updates)
  }

  updateFile({ status: 'progress' })

  // 生成预览图
  const base64 = await fileToBase64(fileInfo.originalFile)
  updateFile({ thumbnail: base64 })

  // 使用 XMLHttpRequest 上传
  const xhr = new XMLHttpRequest()

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100)
      updateFile({ percent })
    }
  }

  try {
    const response = await new Promise<any>((resolve, reject) => {
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText || '{}'))
        } else {
          reject(new Error(xhr.statusText))
        }
      }
      xhr.onerror = () => reject(new Error('上传失败'))
      xhr.open('POST', props.action, true)

      const formData = new FormData()
      formData.append('file', fileInfo.originalFile, fileInfo.name)
      xhr.send(formData)
    })

    updateFile({
      status: 'success',
      url: response?.data?.url || response?.url || base64,
      response
    })

    emit('success', response, fileInfo)
  } catch (error) {
    updateFile({ status: 'fail' })
    emit('error', error, fileInfo)
  }
}

// 处理文件选择
const handleFileSelect = async (file: File) => {
  // 检查文件大小
  if (file.size > props.maxSize * 1024 * 1024) {
    alert(`文件大小不能超过 ${props.maxSize}MB`)
    return
  }

  const newFileInfo = createFileInfo(file)
  setValue(newFileInfo)
  emit('change', newFileInfo)

  await uploadFile(newFileInfo)
}

// 点击上传
const handleClick = () => {
  fileInputRef.value?.click()
}

// 文件选择变化
const handleChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    handleFileSelect(file)
  }
  // 重置 input 以便可以重复选择同一文件
  target.value = ''
}

// 拖拽相关事件
const handleDragEnter = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isDragOver.value = true
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isDragOver.value = false
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isDragOver.value = false

  const file = e.dataTransfer?.files?.[0]
  if (file) {
    // 检查文件类型
    if (props.accept !== '*') {
      const acceptTypes = props.accept.split(',').map(t => t.trim())
      const isValidType = acceptTypes.some(type => {
        if (type.includes('*')) {
          return file.type.startsWith(type.replace('/*', ''))
        }
        return file.type === type || file.name.endsWith(type)
      })
      if (!isValidType) {
        alert(`请上传 ${props.accept} 类型的文件`)
        return
      }
    }
    handleFileSelect(file)
  }
}

// 删除文件
const handleRemove = () => {
  setValue(null)
  emit('change', null)
}

// 重新上传
const handleRetry = () => {
  if (fileInfo.value) {
    uploadFile(fileInfo.value)
  }
}
</script>

<template>
  <div class="w-full">
    <!-- 隐藏的原生 input -->
    <input
      ref="fileInputRef"
      type="file"
      :accept="accept"
      class="hidden"
      @change="handleChange"
    />

    <!-- 上传区域 -->
    <div
      v-if="!hasFile"
      class="relative w-full h-48 rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3"
      :class="[
        isDragOver
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
      ]"
      @click="handleClick"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @dragover="handleDragOver"
      @drop="handleDrop"
    >
      <!-- 上传图标 -->
      <svg
        class="w-12 h-12 text-gray-400"
        :class="{ 'text-blue-500': isDragOver }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>

      <!-- 提示文字 -->
      <div class="text-center">
        <p class="text-gray-600 font-medium">
          {{ isDragOver ? '释放以上传文件' : '点击或拖拽文件到此处上传' }}
        </p>
        <p class="text-gray-400 text-sm mt-1">
          支持 {{ accept }} 格式，最大 {{ maxSize }}MB
        </p>
      </div>
    </div>

    <!-- 文件预览区域 -->
    <div
      v-else
      class="relative w-full rounded-lg border border-gray-200 overflow-hidden bg-gray-50"
    >
      <!-- 图片预览 -->
      <div class="relative w-full h-48 flex items-center justify-center bg-gray-100">
        <img
          v-if="previewUrl && fileInfo?.originalFile.type.startsWith('image/')"
          :src="previewUrl"
          class="max-w-full max-h-full object-contain"
          alt="预览"
        />
        <div v-else class="flex flex-col items-center gap-2 text-gray-500">
          <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span class="text-sm">{{ fileInfo?.name }}</span>
        </div>

        <!-- 上传中遮罩 -->
        <div
          v-if="isUploading"
          class="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3"
        >
          <div class="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-blue-500 transition-all duration-200"
              :style="{ width: `${uploadPercent}%` }"
            />
          </div>
          <span class="text-white text-sm">{{ uploadPercent }}%</span>
        </div>

        <!-- 操作按钮 -->
        <div
          v-else
          class="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-4 opacity-0 hover:opacity-100"
        >
          <button
            v-if="fileInfo?.status === 'fail'"
            class="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
            @click="handleRetry"
            title="重新上传"
          >
            <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <button
            class="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
            @click="handleRemove"
            title="删除"
          >
            <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        <!-- 状态标识 -->
        <div
          v-if="fileInfo?.status === 'success'"
          class="absolute top-2 right-2 p-1 bg-green-500 rounded-full"
        >
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div
          v-if="fileInfo?.status === 'fail'"
          class="absolute top-2 right-2 p-1 bg-red-500 rounded-full"
        >
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>

      <!-- 文件信息 -->
      <div class="px-4 py-3 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ fileInfo?.name }}</p>
            <p class="text-xs text-gray-500">
              {{ (fileInfo?.originalFile.size! / 1024 / 1024).toFixed(2) }} MB
            </p>
          </div>
          <span
            class="px-2 py-1 text-xs rounded-full"
            :class="{
              'bg-green-100 text-green-700': fileInfo?.status === 'success',
              'bg-red-100 text-red-700': fileInfo?.status === 'fail',
              'bg-blue-100 text-blue-700': fileInfo?.status === 'progress',
              'bg-gray-100 text-gray-700': fileInfo?.status === 'pending'
            }"
          >
            {{ fileInfo?.status === 'success' ? '成功' : fileInfo?.status === 'fail' ? '失败' : fileInfo?.status === 'progress' ? '上传中' : '等待中' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
