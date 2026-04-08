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



除了 `fetch`，另一个主流且成熟的选择是 **Axios**，以及最传统但兼容性最好的 **XMLHttpRequest (XHR)**。

我把这几种方式放在一起做了个对比，你可以根据实际场景来选择：

| 方案 | 设置自定义Header | 核心配置/方法 | 进度跟踪 | 适用场景 |
| :--- | :--- | :--- | :--- | :--- |
| **Axios** | `headers: { 'Authorization': 'Bearer token' }` | `responseType: 'blob'` 处理二进制流 | 支持 `onDownloadProgress` 回调 | **首选方案**。功能强大，API 简洁，同时支持浏览器和 Node.js |
| **XMLHttpRequest** | `xhr.setRequestHeader('key', 'value')` | `xhr.responseType = 'blob'` | 支持 `xhr.onprogress` 事件 | 兼容性极佳，适合需要兼容老旧浏览器的场景 |
| **Fetch** | `headers: { 'Authorization': 'Bearer token' }` | 配合 `Response.body` 流式处理 | 需手动实现，相对复杂 | 现代浏览器原生支持，无需引入额外库 |

---

### 💡 方案详解与代码示例

#### 1. Axios（推荐）
这是目前社区最流行的方法，它封装了复杂的底层逻辑，用起来非常顺手。下载文件时，关键在于设置 `responseType: 'blob'`，这样后端返回的文件流就会被正确处理。

```javascript
// 发送带自定义Header的POST请求，并下载文件
axios.post('/api/download', { userId: 123 }, {
    headers: {
        'Authorization': `Bearer ${yourToken}`,
        'Custom-Header': 'custom-value'
    },
    responseType: 'blob', // 必须设置，告诉axios返回的是二进制流
    onDownloadProgress: (progressEvent) => {
        // 可选：监听下载进度
        let percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`下载进度: ${percentCompleted}%`);
    }
}).then(response => {
    // 从响应头获取文件名（可能需要后端配合暴露该header）
    const contentDisposition = response.headers['content-disposition'];
    let fileName = 'download.file';
    if (contentDisposition) {
        // 解析文件名逻辑，可参考下文“注意事项”
    }

    // 创建一个Blob URL并触发下载
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url); // 释放内存
});
```

#### 2. XMLHttpRequest (原生)
虽然写法不如 Axios 简洁，但在某些特殊场景（如不引入外部库、兼容极旧浏览器）下，它依然是最佳选择。

```javascript
var xhr = new XMLHttpRequest();
xhr.open('GET', '/api/download', true);

// 设置自定义请求头
xhr.setRequestHeader('Authorization', 'Bearer ' + yourToken);
xhr.setRequestHeader('Custom-Header', 'custom-value');

// 关键设置：响应类型为blob，用于处理二进制数据
xhr.responseType = 'blob';

xhr.onload = function() {
    if (this.status === 200) {
        var blob = this.response;
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'filename.pdf'; // 设置下载文件名
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
};

xhr.send();
```

---

### ⚠️ 必须注意的坑

无论你选择哪种方式，在实际开发中都可能遇到下面几个棘手的问题，提前做好准备能省去很多麻烦：

1.  **获取响应头里的文件名**
    很多后端会把文件名放在 `Content-Disposition` 响应头里。但是，**前端默认是无法读取所有响应头的**。如果你的代码里 `response.headers['content-disposition']` 总是 `undefined`，那需要后端同事配合，在服务器响应里添加一个特殊的响应头，把自定义的 Header 暴露出来：
    ```http
    Access-Control-Expose-Headers: Content-Disposition
    ```
    设置之后，前端就能正常读取到文件名了。

2.  **处理文件下载的错误响应**
    当你设置 `responseType: 'blob'` 后，即使后端返回的是 400 或 500 的错误页面，它也会被当作一个 Blob 对象来处理。这会导致你的 `.catch` 代码块无法正常工作，页面上也无法显示错误信息。

    一个常见的处理技巧是检查返回 Blob 的 `type`。如果它变成了 `'application/json'`，那大概率是后端返回了一个包含错误信息的 JSON 对象：
    ```javascript
    // 在 axios 的 .then 里
    if (response.data.type === 'application/json') {
        // 通过 FileReader 读取错误信息并提示给用户
        const reader = new FileReader();
        reader.onload = function() {
            const errorInfo = JSON.parse(reader.result);
            alert('下载失败: ' + errorInfo.message);
        };
        reader.readAsText(response.data);
        return;
    }
    // 否则，正常执行下载逻辑...
    ```

3.  **跨域问题**
    如果你需要从 `https://api.example.com` 下载文件，而你的页面在 `https://www.my-site.com` 上，这就属于跨域请求。除了上面提到的 `Access-Control-Expose-Headers`，后端还需要正确设置 `Access-Control-Allow-Origin` 和 `Access-Control-Allow-Headers` 等CORS头，你的自定义Header才能发送成功。

你是要下载哪种类型的文件（比如 Excel 还是 PDF）？或者需要我帮你写一段针对你后端接口的完整代码吗？



这是一个经典的 CORS 跨域资源共享问题。你遇到的情况是：**预检请求（OPTIONS）没有该响应头，但正式请求有，前端却读不到**。

## 问题根源

浏览器的安全策略限制：即使正式响应返回了 `Content-Description` 或 `Content-Disposition` 头，前端 JavaScript 默认也无法读取，除非后端明确告知浏览器"这个响应头可以暴露给前端"。

## 解决方案

### 后端必须添加的配置（最关键）

后端需要在**正式响应**（不是预检响应）中添加响应头：

```http
Access-Control-Expose-Headers: Content-Description, Content-Disposition
```

或者更宽松地暴露多个自定义头：

```http
Access-Control-Expose-Headers: *, Content-Description, Content-Disposition
```

**注意：** 
- 预检请求（OPTIONS）返回什么头不重要
- 关键是**正式响应（GET/POST）**必须带上 `Access-Control-Expose-Headers`

### 完整的前后端交互示例

#### 后端代码示例（Node.js + Express）

```javascript
app.get('/download', (req, res) => {
    // 设置自定义响应头
    res.setHeader('Content-Description', 'File Transfer');
    res.setHeader('Content-Disposition', 'attachment; filename="example.pdf"');
    
    // 关键：暴露这些头给前端
    res.setHeader('Access-Control-Expose-Headers', 'Content-Description, Content-Disposition');
    res.setHeader('Access-Control-Allow-Origin', 'http://your-frontend-domain.com');
    
    // 返回文件流
    const fileStream = fs.createReadStream('example.pdf');
    fileStream.pipe(res);
});
```

#### 前端代码

```javascript
async function downloadFile() {
    try {
        const response = await fetch('https://api.example.com/download', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer your-token',
                'X-Custom-Header': 'custom-value'
            }
        });

        if (!response.ok) {
            throw new Error(`下载失败: ${response.status}`);
        }

        // 现在应该能读取到了
        const contentDescription = response.headers.get('Content-Description');
        const contentDisposition = response.headers.get('Content-Disposition');
        
        console.log('Content-Description:', contentDescription);
        console.log('Content-Disposition:', contentDisposition);
        
        // 解析文件名示例
        let filename = 'download.file';
        if (contentDisposition) {
            const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (match && match[1]) {
                filename = match[1].replace(/['"]/g, '');
            }
        }
        
        // 处理文件下载
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('下载出错:', error);
    }
}
```

## 调试方法

### 1. 检查 Network 面板

打开浏览器开发者工具 → Network 标签：

**查看预检请求（OPTIONS）:**
- 确认 OPTIONS 请求返回 204 或 200
- 检查响应头中是否有 `Access-Control-Allow-Headers`（确认你的自定义请求头被允许）

**查看正式请求（GET/POST）:**
- 找到下载文件的请求
- 在 Response Headers 中查看：
  - 是否有 `Content-Description` 和 `Content-Disposition`
  - **关键**：是否有 `Access-Control-Expose-Headers`

### 2. 前端验证代码

```javascript
// 添加调试代码
console.log('所有响应头:');
for (let pair of response.headers.entries()) {
    console.log(pair[0] + ': ' + pair[1]);
}

// 检查特定头是否可读
const exposedHeaders = response.headers.get('Access-Control-Expose-Headers');
console.log('后端暴露的头:', exposedHeaders);
```

## 常见问题排查

| 现象 | 可能原因 | 解决方法 |
|------|---------|---------|
| `response.headers.get()` 返回 `null` | 后端未设置 `Access-Control-Expose-Headers` | 要求后端添加该响应头 |
| 预检请求失败 | CORS 配置不完整 | 检查 OPTIONS 请求的响应头 |
| 自定义请求头被忽略 | 未在 `Access-Control-Allow-Headers` 中声明 | 后端添加你的自定义请求头到允许列表 |
| 只有部分头能读到 | 暴露的头列表不全 | 后端补充需要的头名称 |

## 临时替代方案（不推荐）

如果后端暂时无法修改配置，可以考虑：

1. **使用代理服务器**：通过自己的后端转发请求，绕过浏览器 CORS 限制
2. **使用 Blob URL + a 标签**：无法获取响应头，但至少能下载文件
3. **改用 iframe 或 form 提交**：但无法获取响应头信息

```javascript
// 临时方案：通过 URL 参数传递文件名
// 后端在生成下载链接时，将文件名编码到 URL 中
const downloadUrl = `https://api.example.com/download?filename=${encodeURIComponent('实际文件名.pdf')}`;
```

## 核心要点

记住这个 CORS 规则：
- **默认暴露的响应头只有**：`Cache-Control`, `Content-Language`, `Content-Type`, `Expires`, `Last-Modified`, `Pragma`
- **其他所有响应头**（包括 `Content-Description`、`Content-Disposition`、自定义头）都需要通过 `Access-Control-Expose-Headers` 显式暴露

你现在需要做的：**让后端在正式响应的响应头中添加 `Access-Control-Expose-Headers: Content-Description, Content-Disposition`**