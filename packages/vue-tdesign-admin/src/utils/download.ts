/**
 * 下载工具
 * 支持远程文件下载，批量并行或串行下载
 */

/**
 * 下载选项
 */
export interface DownloadOptions {
  /** 文件名 */
  filename?: string;
  /** 是否显示下载进度 */
  showProgress?: boolean;
  /** 自定义请求头 */
  headers?: Record<string, string>;
  /** 超时时间（毫秒） */
  timeout?: number;
}

/**
 * 批量下载选项
 */
export interface BatchDownloadOptions extends DownloadOptions {
  /** 下载模式：parallel（并行）或serial（串行） */
  mode?: 'parallel' | 'serial';
  /** 最大并行下载数（仅在parallel模式下有效） */
  maxParallel?: number;
}

/**
 * 下载结果
 */
export interface DownloadResult {
  /** 下载是否成功 */
  success: boolean;
  /** 下载的文件URL */
  url: string;
  /** 文件名 */
  filename?: string;
  /** 错误信息（如果失败） */
  error?: string;
}

/**
 * 下载单个文件
 * @param url 下载URL
 * @param options 下载选项
 * @returns Promise<DownloadResult>
 */
export const downloadFile = async (url: string, options: DownloadOptions = {}): Promise<DownloadResult> => {
  const {
    filename = url.split('/').pop() || 'download',
    showProgress = false,
    headers = {},
    timeout = 30000
  } = options;

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    let timeoutId: NodeJS.Timeout;

    xhr.open('GET', url, true);
    xhr.responseType = 'blob';

    // 设置请求头
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    // 处理进度
    if (showProgress) {
      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          console.log(`下载进度: ${percentComplete.toFixed(2)}%`);
        }
      };
    }

    // 处理完成
    xhr.onload = () => {
      clearTimeout(timeoutId);
      if (xhr.status === 200) {
        try {
          const blob = xhr.response;
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
          resolve({ success: true, url, filename });
        } catch (error) {
          resolve({ success: false, url, error: error instanceof Error ? error.message : '下载失败' });
        }
      } else {
        resolve({ success: false, url, error: `HTTP错误: ${xhr.status}` });
      }
    };

    // 处理错误
    xhr.onerror = () => {
      clearTimeout(timeoutId);
      resolve({ success: false, url, error: '网络错误' });
    };

    // 处理超时
    xhr.ontimeout = () => {
      clearTimeout(timeoutId);
      resolve({ success: false, url, error: '下载超时' });
    };

    // 设置超时
    timeoutId = setTimeout(() => {
      xhr.abort();
      resolve({ success: false, url, error: '下载超时' });
    }, timeout);

    xhr.send();
  });
};

/**
 * 批量下载文件
 * @param urls 下载URL列表
 * @param options 批量下载选项
 * @returns Promise<DownloadResult[]>
 */
export const batchDownload = async (urls: string[], options: BatchDownloadOptions = {}): Promise<DownloadResult[]> => {
  const {
    mode = 'parallel',
    maxParallel = 5,
    ...downloadOptions
  } = options;

  if (mode === 'serial') {
    // 串行下载
    const results: DownloadResult[] = [];
    for (const url of urls) {
      const result = await downloadFile(url, downloadOptions);
      results.push(result);
    }
    return results;
  } else {
    // 并行下载，控制最大并行数
    const results: DownloadResult[] = [];
    const queue = [...urls];
    const activeDownloads: Promise<void>[] = [];

    while (queue.length > 0 || activeDownloads.length > 0) {
      // 启动新的下载，直到达到最大并行数
      while (activeDownloads.length < maxParallel && queue.length > 0) {
        const url = queue.shift()!;
        const downloadPromise = downloadFile(url, downloadOptions).then(result => {
          results.push(result);
          // 从活动下载中移除
          const index = activeDownloads.indexOf(downloadPromise);
          if (index > -1) {
            activeDownloads.splice(index, 1);
          }
        });
        activeDownloads.push(downloadPromise);
      }

      // 等待至少一个下载完成
      if (activeDownloads.length > 0) {
        await Promise.race(activeDownloads);
      }
    }

    return results;
  }
};

/**
 * 下载工具类
 */
export class Downloader {
  /**
   * 下载单个文件
   */
  static download(url: string, options?: DownloadOptions) {
    return downloadFile(url, options);
  }

  /**
   * 批量下载文件
   */
  static batch(urls: string[], options?: BatchDownloadOptions) {
    return batchDownload(urls, options);
  }

  /**
   * 并行下载文件
   */
  static parallel(urls: string[], options?: BatchDownloadOptions) {
    return batchDownload(urls, { ...options, mode: 'parallel' });
  }

  /**
   * 串行下载文件
   */
  static serial(urls: string[], options?: BatchDownloadOptions) {
    return batchDownload(urls, { ...options, mode: 'serial' });
  }
}

export default {
  download: downloadFile,
  batch: batchDownload,
  Downloader
};