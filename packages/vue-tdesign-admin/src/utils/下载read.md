以下是使用 a 标签实现文件下载的完整方法，包含多种场景和错误处理：

## 📥 基础下载方法

### 1. **最简单的下载方法**

```javascript
/**
 * 使用 a 标签下载文件
 * @param {string} url - 文件下载地址
 * @param {string} filename - 下载的文件名（可选）
 */
function downloadByUrl(url, filename) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename || ''  // 如果不指定文件名，则使用 URL 中的文件名
  link.target = '_blank'  // 可选，在新标签页打开
  link.rel = 'noopener noreferrer'  // 安全考虑
  
  // 添加到文档，点击，然后移除
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
```

### 2. **下载 Blob 数据（适用于动态生成的内容）**

```javascript
/**
 * 下载 Blob 数据
 * @param {Blob} blob - 文件数据
 * @param {string} filename - 下载的文件名
 */
function downloadByBlob(blob, filename) {
  // 创建 Blob URL
  const blobUrl = window.URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // 释放 Blob URL
  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl)
  }, 100)
}
```

## 🚀 完整版下载方法

### 3. **功能完善的下载工具类**

```javascript
// download.js

class DownloadManager {
  /**
   * 下载文件
   * @param {Object} options - 下载选项
   * @param {string|Blob} options.data - 下载地址或 Blob 数据
   * @param {string} options.filename - 文件名
   * @param {string} [options.method='GET'] - 请求方法
   * @param {Object} [options.headers] - 请求头
   * @param {Object} [options.params] - URL 参数
   * @param {Function} [options.onProgress] - 下载进度回调
   * @param {boolean} [options.withToken=true] - 是否携带认证 token
   */
  static async download(options) {
    const {
      data,
      filename,
      method = 'GET',
      headers = {},
      params = {},
      onProgress,
      withToken = true
    } = options

    try {
      // 如果传入的是 Blob，直接下载
      if (data instanceof Blob) {
        this.downloadBlob(data, filename)
        return { success: true }
      }

      // 如果是 URL，通过请求下载
      return await this.downloadFromUrl({
        url: data,
        filename,
        method,
        headers,
        params,
        onProgress,
        withToken
      })
    } catch (error) {
      console.error('下载失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 从 URL 下载
   */
  static async downloadFromUrl(options) {
    const {
      url,
      filename,
      method = 'GET',
      headers = {},
      params = {},
      onProgress,
      withToken = true
    } = options

    // 构建 URL 参数
    const urlObj = new URL(url, window.location.origin)
    Object.keys(params).forEach(key => {
      urlObj.searchParams.append(key, params[key])
    })

    // 准备请求头
    const requestHeaders = { ...headers }
    if (withToken) {
      const token = localStorage.getItem('token')
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`
      }
    }

    try {
      // 发起请求
      const response = await fetch(urlObj.toString(), {
        method,
        headers: requestHeaders
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // 获取内容长度用于进度计算
      const contentLength = response.headers.get('content-length')
      const total = contentLength ? parseInt(contentLength, 10) : null

      // 读取响应数据
      const reader = response.body.getReader()
      const chunks = []
      let receivedLength = 0

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        chunks.push(value)
        receivedLength += value.length
        
        // 触发进度回调
        if (onProgress && total) {
          onProgress({
            loaded: receivedLength,
            total,
            percent: Math.round((receivedLength / total) * 100)
          })
        }
      }

      // 合并数据
      const blob = new Blob(chunks)
      
      // 获取文件名
      let finalFilename = filename
      if (!finalFilename) {
        // 从响应头或 URL 中获取文件名
        const contentDisposition = response.headers.get('content-disposition')
        if (contentDisposition) {
          const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
          if (match && match[1]) {
            finalFilename = match[1].replace(/['"]/g, '')
          }
        }
        
        if (!finalFilename) {
          // 从 URL 中提取文件名
          const urlParts = url.split('/')
          finalFilename = urlParts[urlParts.length - 1].split('?')[0] || 'download'
        }
      }

      // 下载文件
      this.downloadBlob(blob, finalFilename)
      
      return { success: true, filename: finalFilename, size: receivedLength }
    } catch (error) {
      throw error
    }
  }

  /**
   * 下载 Blob 数据
   */
  static downloadBlob(blob, filename) {
    // 检查是否是同源或可访问的 Blob URL
    const blobUrl = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 清理
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl)
    }, 100)
  }

  /**
   * 下载二进制数据
   */
  static downloadBuffer(buffer, filename, mimeType = 'application/octet-stream') {
    const blob = new Blob([buffer], { type: mimeType })
    this.downloadBlob(blob, filename)
  }

  /**
   * 下载文本内容
   */
  static downloadText(text, filename, mimeType = 'text/plain') {
    const blob = new Blob([text], { type: mimeType })
    this.downloadBlob(blob, filename)
  }

  /**
   * 下载 JSON 数据
   */
  static downloadJSON(data, filename) {
    const json = JSON.stringify(data, null, 2)
    this.downloadText(json, filename.endsWith('.json') ? filename : `${filename}.json`, 'application/json')
  }

  /**
   * 下载 Canvas 内容
   */
  static downloadCanvas(canvas, filename, format = 'png', quality = 1) {
    const mimeType = `image/${format}`
    canvas.toBlob((blob) => {
      this.downloadBlob(blob, filename.endsWith(`.${format}`) ? filename : `${filename}.${format}`)
    }, mimeType, quality)
  }
}
```

## 💡 使用示例

### 4. **各种使用场景**

```javascript
// 1. 简单 URL 下载
DownloadManager.download({
  data: 'https://example.com/file.pdf',
  filename: 'document.pdf'
})

// 2. 带参数的下载
DownloadManager.download({
  data: '/api/export',
  filename: 'report.xlsx',
  method: 'POST',
  params: {
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    format: 'xlsx'
  },
  headers: {
    'Content-Type': 'application/json'
  }
})

// 3. 下载动态生成的数据
const users = [
  { id: 1, name: '张三', email: 'zhangsan@example.com' },
  { id: 2, name: '李四', email: 'lisi@example.com' }
]

DownloadManager.downloadJSON(users, 'users.json')

// 4. 下载文本内容
DownloadManager.downloadText(
  '这是文件内容\n第二行内容',
  'notes.txt'
)

// 5. 下载 Canvas 图像
const canvas = document.getElementById('myCanvas')
DownloadManager.downloadCanvas(canvas, 'screenshot', 'png', 0.9)

// 6. 带进度条的下载
DownloadManager.download({
  data: '/api/large-file.zip',
  filename: 'large-file.zip',
  onProgress: (progress) => {
    console.log(`下载进度: ${progress.percent}%`)
    // 更新进度条
    updateProgressBar(progress.percent)
  }
}).then(result => {
  if (result.success) {
    console.log('下载完成:', result)
  } else {
    console.error('下载失败:', result.error)
  }
})
```

## 🛡️ 安全处理版本

### 5. **带安全检查和错误处理的下载**

```javascript
// secureDownload.js

class SecureDownload {
  /**
   * 安全的下载方法
   */
  static async secureDownload(url, filename, options = {}) {
    const {
      timeout = 30000,
      maxSize = 100 * 1024 * 1024, // 100MB
      allowedTypes = ['*'],
      validateResponse = true
    } = options

    // 验证 URL
    if (!this.isValidUrl(url)) {
      throw new Error('无效的下载地址')
    }

    // 创建 AbortController 用于超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Range': 'bytes=0-' // 尝试获取部分内容用于验证
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`下载失败: ${response.status}`)
      }

      // 检查文件大小
      const contentLength = response.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > maxSize) {
        throw new Error(`文件过大，最大允许 ${maxSize / 1024 / 1024}MB`)
      }

      // 检查文件类型
      const contentType = response.headers.get('content-type')
      if (!this.isAllowedType(contentType, allowedTypes)) {
        throw new Error(`不支持的文件类型: ${contentType}`)
      }

      // 获取完整文件
      const blob = await response.blob()

      // 可选：验证文件内容
      if (validateResponse) {
        await this.validateFileContent(blob, contentType)
      }

      // 下载文件
      this.downloadBlob(blob, filename)

      return {
        success: true,
        filename,
        size: blob.size,
        type: blob.type
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('下载超时')
      }
      throw error
    }
  }

  /**
   * 验证 URL 是否合法
   */
  static isValidUrl(url) {
    try {
      const urlObj = new URL(url, window.location.origin)
      // 防止跨站请求
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  /**
   * 检查文件类型是否允许
   */
  static isAllowedType(contentType, allowedTypes) {
    if (allowedTypes.includes('*')) return true
    return allowedTypes.some(type => contentType.includes(type))
  }

  /**
   * 验证文件内容（示例）
   */
  static async validateFileContent(blob, expectedType) {
    // 对于图片，可以尝试加载验证
    if (expectedType.startsWith('image/')) {
      return new Promise((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(blob)
        
        img.onload = () => {
          URL.revokeObjectURL(url)
          resolve()
        }
        
        img.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('无效的图片文件'))
        }
        
        img.src = url
      })
    }
    
    // 对于其他类型，可以检查文件头
    return true
  }

  /**
   * 下载 Blob
   */
  static downloadBlob(blob, filename) {
    const blobUrl = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl)
    }, 100)
  }
}
```

## 📱 Vue 组件示例

```vue
<template>
  <div class="download-manager">
    <!-- 简单下载按钮 -->
    <button @click="downloadFile" :disabled="downloading">
      {{ downloading ? '下载中...' : '下载文件' }}
    </button>

    <!-- 带进度的下载 -->
    <div v-if="showProgress" class="progress-container">
      <div class="progress-bar" :style="{ width: progress + '%' }"></div>
      <span>{{ progress }}%</span>
    </div>

    <!-- 批量下载 -->
    <div class="batch-download">
      <button 
        v-for="file in fileList" 
        :key="file.id"
        @click="downloadFile(file)"
      >
        {{ file.name }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { DownloadManager } from './download'

const downloading = ref(false)
const showProgress = ref(false)
const progress = ref(0)

const fileList = ref([
  { id: 1, name: '报告.pdf', url: '/api/report.pdf', size: '2.5MB' },
  { id: 2, name: '数据.xlsx', url: '/api/export', params: { format: 'xlsx' } },
  { id: 3, name: '图片.png', url: '/api/image.png' }
])

const downloadFile = async (file) => {
  downloading.value = true
  showProgress.value = true
  progress.value = 0

  try {
    const result = await DownloadManager.download({
      data: file.url,
      filename: file.name,
      params: file.params,
      onProgress: (p) => {
        progress.value = p.percent
      }
    })

    if (result.success) {
      console.log('下载成功:', result)
      // 显示成功提示
    }
  } catch (error) {
    console.error('下载失败:', error)
    // 显示错误提示
  } finally {
    downloading.value = false
    setTimeout(() => {
      showProgress.value = false
    }, 1000)
  }
}
</script>

<style scoped>
.progress-container {
  width: 300px;
  height: 30px;
  background: #f0f0f0;
  border-radius: 15px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  background: #42b983;
  transition: width 0.3s;
}

.progress-container span {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: #333;
  font-size: 12px;
}
</style>
```

## 📝 总结

| 方法 | 适用场景 | 优点 | 注意事项 |
|:---|:---|:---|:---|
| `downloadByUrl` | 静态文件下载 | 简单直接 | 跨域问题 |
| `downloadByBlob` | 动态生成内容 | 灵活可控 | 需要手动释放内存 |
| `DownloadManager` | 复杂下载需求 | 功能完整 | 代码稍复杂 |
| `SecureDownload` | 安全要求高 | 安全检查 | 性能开销 |

选择哪种方法取决于你的具体需求：
- 简单文件：用基础版
- 动态数据：用 Blob 版
- 复杂应用：用完整版
- 安全要求高：用安全版