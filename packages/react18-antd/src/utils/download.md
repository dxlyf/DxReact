在 TypeScript 中使用 fetch 下载文件并监听进度需要一些额外处理，因为原生的 fetch API 不直接提供进度事件。以下是几种实现方式：

## 方案一：使用 Response.body 和 ReadableStream（推荐）

```typescript
interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface DownloadOptions {
  url: string;
  onProgress?: (progress: DownloadProgress) => void;
  onComplete?: (blob: Blob) => void;
  onError?: (error: Error) => void;
}

class FileDownloader {
  async downloadFile(options: DownloadOptions): Promise<Blob> {
    const { url, onProgress, onComplete, onError } = options;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      if (!response.body) {
        throw new Error('ReadableStream not supported');
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        if (value) {
          chunks.push(value);
          loaded += value.length;
          
          if (onProgress && total > 0) {
            const percentage = Math.round((loaded / total) * 100);
            onProgress({
              loaded,
              total,
              percentage
            });
          }
        }
      }

      const blob = new Blob(chunks);
      
      if (onComplete) {
        onComplete(blob);
      }
      
      return blob;
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }
      throw error;
    }
  }

  // 辅助方法：下载并创建对象 URL
  async downloadAndCreateURL(options: DownloadOptions): Promise<string> {
    const blob = await this.downloadFile(options);
    return URL.createObjectURL(blob);
  }

  // 辅助方法：自动触发下载
  async downloadWithAutoSave(options: DownloadOptions & { filename: string }): Promise<void> {
    const blob = await this.downloadFile(options);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = options.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
```

## 方案二：使用 XMLHttpRequest（兼容性好）

```typescript
interface XHRDownloadOptions {
  url: string;
  onProgress?: (progress: DownloadProgress) => void;
  onComplete?: (blob: Blob) => void;
  onError?: (error: Error) => void;
  responseType?: XMLHttpRequestResponseType;
}

class XHRFileDownloader {
  downloadFile(options: XHRDownloadOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const { url, onProgress, onComplete, onError, responseType = 'blob' } = options;

      const xhr = new XMLHttpRequest();
      
      xhr.responseType = responseType;
      xhr.open('GET', url);

      xhr.onprogress = (event: ProgressEvent) => {
        if (onProgress && event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const blob = xhr.response;
          if (onComplete) {
            onComplete(blob);
          }
          resolve(blob);
        } else {
          const error = new Error(`HTTP error! status: ${xhr.status}`);
          if (onError) {
            onError(error);
          }
          reject(error);
        }
      };

      xhr.onerror = () => {
        const error = new Error('Network error');
        if (onError) {
          onError(error);
        }
        reject(error);
      };

      xhr.send();
    });
  }
}
```

## 使用示例

```typescript
// 使用 fetch 方案
const downloader = new FileDownloader();

// 示例1：基本下载
downloader.downloadFile({
  url: 'https://example.com/large-file.zip',
  onProgress: (progress) => {
    console.log(`下载进度: ${progress.percentage}% (${progress.loaded}/${progress.total})`);
  },
  onComplete: (blob) => {
    console.log('下载完成，文件大小:', blob.size);
  },
  onError: (error) => {
    console.error('下载失败:', error);
  }
});

// 示例2：下载并自动保存
downloader.downloadWithAutoSave({
  url: 'https://example.com/document.pdf',
  filename: 'document.pdf',
  onProgress: (progress) => {
    // 更新 UI 进度条
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
      progressBar.style.width = `${progress.percentage}%`;
    }
  },
  onError: (error) => {
    alert(`下载失败: ${error.message}`);
  }
});

// 使用 XHR 方案
const xhrDownloader = new XHRFileDownloader();

xhrDownloader.downloadFile({
  url: 'https://example.com/video.mp4',
  onProgress: (progress) => {
    console.log(`XHR 进度: ${progress.percentage}%`);
  },
  onComplete: (blob) => {
    const videoUrl = URL.createObjectURL(blob);
    const videoElement = document.createElement('video');
    videoElement.src = videoUrl;
    videoElement.controls = true;
    document.body.appendChild(videoElement);
  }
});
```

## React Hook 版本（如果在 React 中使用）

```typescript
import { useState, useCallback } from 'react';

interface UseFileDownloadResult {
  download: (url: string, filename?: string) => Promise<void>;
  progress: DownloadProgress | null;
  isLoading: boolean;
  error: Error | null;
}

export const useFileDownload = (): UseFileDownloadResult => {
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const download = useCallback(async (url: string, filename?: string) => {
    setIsLoading(true);
    setError(null);
    setProgress({ loaded: 0, total: 0, percentage: 0 });

    try {
      const downloader = new FileDownloader();
      
      if (filename) {
        await downloader.downloadWithAutoSave({
          url,
          filename,
          onProgress: setProgress,
        });
      } else {
        await downloader.downloadFile({
          url,
          onProgress: setProgress,
        });
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  }, []);

  return { download, progress, isLoading, error };
};

// 在 React 组件中使用
const DownloadComponent: React.FC = () => {
  const { download, progress, isLoading, error } = useFileDownload();

  const handleDownload = async () => {
    await download(
      'https://example.com/large-file.zip', 
      'large-file.zip'
    );
  };

  return (
    <div>
      <button onClick={handleDownload} disabled={isLoading}>
        {isLoading ? '下载中...' : '下载文件'}
      </button>
      
      {progress && (
        <div>
          <progress value={progress.percentage} max="100" />
          <span>{progress.percentage}%</span>
        </div>
      )}
      
      {error && <div style={{ color: 'red' }}>错误: {error.message}</div>}
    </div>
  );
};
```

## 注意事项

1. **CORS 限制**：确保目标服务器允许跨域请求
2. **Content-Length 头**：进度计算依赖于服务器返回的 Content-Length 头
3. **内存使用**：大文件下载时注意内存使用情况
4. **错误处理**：妥善处理网络错误和 HTTP 错误状态
5. **取消下载**：可以添加取消功能来中止下载

推荐使用 **方案一（fetch + ReadableStream）**，因为它更现代，且与 Promise 结合更好。