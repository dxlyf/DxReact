/**
 * 上传工具类
 * 支持功能：
 * 1. 普通文件上传
 * 2. 多文件上传
 * 3. 批量文件上传
 * 4. 大文件分片上传
 * 5. 上传进度追踪
 * 6. 断点续传
 * 7. 并发控制
 */

// ==================== 类型定义 ====================

export interface UploadOptions {
  /** 上传地址 */
  url: string;
  /** 请求方法 */
  method?: 'POST' | 'PUT' | 'PATCH';
  /** 请求头 */
  headers?: Record<string, string>;
  /** 是否携带凭证 */
  withCredentials?: boolean;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 分片大小（字节），默认 2MB */
  chunkSize?: number;
  /** 并发上传数量，默认 3 */
  concurrency?: number;
  /** 重试次数，默认 3 */
  retryCount?: number;
  /** 重试延迟（毫秒），默认 1000 */
  retryDelay?: number;
  /** 是否启用分片上传 */
  enableChunk?: boolean;
  /** 分片上传阈值（字节），默认 10MB */
  chunkThreshold?: number;
  /** 额外参数 */
  extraData?: Record<string, any>;
  /** 文件字段名 */
  fileFieldName?: string;
}

export interface UploadProgress {
  /** 已上传字节数 */
  loaded: number;
  /** 总字节数 */
  total: number;
  /** 上传百分比 */
  percent: number;
  /** 上传速度（字节/秒） */
  speed: number;
  /** 预计剩余时间（秒） */
  remainingTime: number;
}

export interface UploadTask {
  /** 任务ID */
  id: string;
  /** 文件对象 */
  file: File;
  /** 文件名 */
  name: string;
  /** 文件大小 */
  size: number;
  /** 文件类型 */
  type: string;
  /** 上传状态 */
  status: UploadStatus;
  /** 上传进度 */
  progress: UploadProgress;
  /** 响应数据 */
  response?: any;
  /** 错误信息 */
  error?: Error;
  /** 开始时间 */
  startTime?: number;
  /** 结束时间 */
  endTime?: number;
  /** 取消函数 */
  abort?: () => void;
}

export type UploadStatus =
  | 'pending'    // 等待中
  | 'uploading'  // 上传中
  | 'paused'     // 已暂停
  | 'completed'  // 已完成
  | 'error'      // 出错
  | 'cancelled'; // 已取消

export type UploadEventType =
  | 'start'
  | 'progress'
  | 'success'
  | 'error'
  | 'complete'
  | 'cancel'
  | 'pause'
  | 'resume';

export type UploadEventHandler = (
  type: UploadEventType,
  task: UploadTask,
  allTasks: UploadTask[]
) => void;

export interface ChunkInfo {
  index: number;
  start: number;
  end: number;
  data: Blob;
  retries: number;
}

// ==================== 工具函数 ====================

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

/**
 * 计算文件 MD5（用于断点续传）
 */
export async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== 上传器类 ====================

export class Uploader {
  private options: Required<UploadOptions>;
  private tasks: Map<string, UploadTask> = new Map();
  private eventHandlers: UploadEventHandler[] = [];
  private pausedTasks: Set<string> = new Set();

  constructor(options: UploadOptions) {
    this.options = {
      method: 'POST',
      headers: {},
      withCredentials: false,
      timeout: 30000,
      chunkSize: 2 * 1024 * 1024, // 2MB
      concurrency: 3,
      retryCount: 3,
      retryDelay: 1000,
      enableChunk: true,
      chunkThreshold: 10 * 1024 * 1024, // 10MB
      extraData: {},
      fileFieldName: 'file',
      ...options,
    };
  }

  // ==================== 事件处理 ====================

  /**
   * 监听上传事件
   */
  on(handler: UploadEventHandler): () => void {
    this.eventHandlers.push(handler);
    return () => {
      const index = this.eventHandlers.indexOf(handler);
      if (index > -1) {
        this.eventHandlers.splice(index, 1);
      }
    };
  }

  /**
   * 触发事件
   */
  private emit(type: UploadEventType, task: UploadTask): void {
    const allTasks = Array.from(this.tasks.values());
    this.eventHandlers.forEach(handler => {
      try {
        handler(type, task, allTasks);
      } catch (error) {
        console.error('Upload event handler error:', error);
      }
    });
  }

  // ==================== 核心上传方法 ====================

  /**
   * 上传单个文件
   */
  async upload(file: File, extraData?: Record<string, any>): Promise<UploadTask> {
    const task = this.createTask(file, extraData);
    this.tasks.set(task.id, task);

    try {
      this.emit('start', task);
      task.status = 'uploading';
      task.startTime = Date.now();

      // 判断是否使用分片上传
      const useChunk = this.options.enableChunk && file.size > this.options.chunkThreshold;

      if (useChunk) {
        await this.uploadWithChunk(task);
      } else {
        await this.uploadSingle(task);
      }

      task.status = 'completed';
      task.endTime = Date.now();
      this.emit('success', task);
      this.emit('complete', task);
    } catch (error) {
      task.status = 'error';
      task.error = error as Error;
      task.endTime = Date.now();
      this.emit('error', task);
      this.emit('complete', task);
      throw error;
    }

    return task;
  }

  /**
   * 上传多个文件
   */
  async uploadMultiple(
    files: File[],
    onProgress?: (progress: UploadProgress, task: UploadTask) => void
  ): Promise<UploadTask[]> {
    const tasks: UploadTask[] = [];

    for (const file of files) {
      const task = this.createTask(file);
      this.tasks.set(task.id, task);
      tasks.push(task);
    }

    // 使用并发控制上传
    const results = await this.concurrentUpload(tasks, onProgress);
    return results;
  }

  /**
   * 批量上传（支持队列管理）
   */
  async uploadBatch(
    files: File[],
    options?: {
      onProgress?: (progress: UploadProgress, task: UploadTask) => void;
      onTaskComplete?: (task: UploadTask) => void;
      onTaskError?: (task: UploadTask, error: Error) => void;
    }
  ): Promise<{ success: UploadTask[]; failed: UploadTask[] }> {
    const success: UploadTask[] = [];
    const failed: UploadTask[] = [];

    // 创建任务队列
    const queue = files.map(file => this.createTask(file));
    queue.forEach(task => this.tasks.set(task.id, task));

    // 并发控制
    const concurrency = this.options.concurrency;
    const executing: Promise<void>[] = [];

    for (const task of queue) {
      const promise = this.processTask(task, options).then(result => {
        if (result.success) {
          success.push(task);
          options?.onTaskComplete?.(task);
        } else {
          failed.push(task);
          options?.onTaskError?.(task, task.error!);
        }
      });

      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
        executing.splice(
          executing.findIndex(p => p === promise),
          1
        );
      }
    }

    await Promise.all(executing);

    return { success, failed };
  }

  // ==================== 私有方法 ====================

  /**
   * 创建上传任务
   */
  private createTask(file: File, extraData?: Record<string, any>): UploadTask {
    return {
      id: generateId(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: {
        loaded: 0,
        total: file.size,
        percent: 0,
        speed: 0,
        remainingTime: 0,
      },
      extraData,
    };
  }

  /**
   * 处理单个任务
   */
  private async processTask(
    task: UploadTask,
    options?: {
      onProgress?: (progress: UploadProgress, task: UploadTask) => void;
    }
  ): Promise<{ success: boolean }> {
    try {
      this.emit('start', task);
      task.status = 'uploading';
      task.startTime = Date.now();

      const useChunk = this.options.enableChunk && task.file.size > this.options.chunkThreshold;

      if (useChunk) {
        await this.uploadWithChunk(task, options?.onProgress);
      } else {
        await this.uploadSingle(task, options?.onProgress);
      }

      task.status = 'completed';
      task.endTime = Date.now();
      this.emit('success', task);
      this.emit('complete', task);

      return { success: true };
    } catch (error) {
      task.status = 'error';
      task.error = error as Error;
      task.endTime = Date.now();
      this.emit('error', task);
      this.emit('complete', task);

      return { success: false };
    }
  }

  /**
   * 单文件上传
   */
  private uploadSingle(
    task: UploadTask,
    onProgress?: (progress: UploadProgress, task: UploadTask) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let lastLoaded = 0;
      let lastTime = Date.now();

      // 设置取消函数
      task.abort = () => {
        xhr.abort();
        task.status = 'cancelled';
        this.emit('cancel', task);
        reject(new Error('Upload cancelled'));
      };

      // 进度监听
      xhr.upload.addEventListener('progress', event => {
        if (event.lengthComputable) {
          const now = Date.now();
          const timeDiff = (now - lastTime) / 1000;
          const loadedDiff = event.loaded - lastLoaded;
          const speed = timeDiff > 0 ? loadedDiff / timeDiff : 0;
          const remainingTime = speed > 0 ? (event.total - event.loaded) / speed : 0;

          task.progress = {
            loaded: event.loaded,
            total: event.total,
            percent: Math.round((event.loaded / event.total) * 100),
            speed,
            remainingTime,
          };

          lastLoaded = event.loaded;
          lastTime = now;

          this.emit('progress', task);
          onProgress?.(task.progress, task);
        }
      });

      // 完成监听
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            task.response = JSON.parse(xhr.responseText);
          } catch {
            task.response = xhr.responseText;
          }
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      });

      // 错误监听
      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
      xhr.addEventListener('timeout', () => reject(new Error('Upload timeout')));

      // 配置请求
      xhr.open(this.options.method, this.options.url, true);
      xhr.withCredentials = this.options.withCredentials;
      xhr.timeout = this.options.timeout;

      // 设置请求头
      Object.entries(this.options.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      // 发送数据
      const formData = new FormData();
      formData.append(this.options.fileFieldName, task.file);

      // 添加额外参数
      const extraData = { ...this.options.extraData, ...task.extraData };
      Object.entries(extraData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      xhr.send(formData);
    });
  }

  /**
   * 分片上传
   */
  private async uploadWithChunk(
    task: UploadTask,
    onProgress?: (progress: UploadProgress, task: UploadTask) => void
  ): Promise<void> {
    const chunks = this.createChunks(task.file);
    const uploadedChunks: Set<number> = new Set();
    let uploadedBytes = 0;

    // 尝试恢复已上传的分片
    await this.checkUploadedChunks(task, uploadedChunks);

    // 标记暂停状态
    let isPaused = false;
    task.abort = () => {
      isPaused = true;
      task.status = 'cancelled';
      this.emit('cancel', task);
    };

    // 并发上传分片
    const uploadChunk = async (chunk: ChunkInfo): Promise<void> => {
      if (isPaused || this.pausedTasks.has(task.id)) {
        throw new Error('Upload paused');
      }

      if (uploadedChunks.has(chunk.index)) {
        uploadedBytes += chunk.data.size;
        return;
      }

      let retries = 0;
      while (retries <= this.options.retryCount) {
        try {
          await this.uploadChunkData(task, chunk, (loaded, total) => {
            const currentLoaded = uploadedBytes + loaded;
            task.progress = {
              loaded: currentLoaded,
              total: task.file.size,
              percent: Math.round((currentLoaded / task.file.size) * 100),
              speed: 0,
              remainingTime: 0,
            };
            this.emit('progress', task);
            onProgress?.(task.progress, task);
          });

          uploadedChunks.add(chunk.index);
          uploadedBytes += chunk.data.size;

          // 保存上传进度
          this.saveChunkProgress(task, chunk.index);
          break;
        } catch (error) {
          retries++;
          if (retries > this.options.retryCount) {
            throw error;
          }
          await delay(this.options.retryDelay * retries);
        }
      }
    };

    // 使用并发控制上传分片
    const concurrency = this.options.concurrency;
    const pool: Promise<void>[] = [];

    for (const chunk of chunks) {
      const promise = uploadChunk(chunk);
      pool.push(promise);

      if (pool.length >= concurrency) {
        await Promise.race(pool);
        pool.splice(
          pool.findIndex(p => p === promise),
          1
        );
      }
    }

    await Promise.all(pool);

    // 合并分片
    await this.mergeChunks(task, chunks.length);
  }

  /**
   * 创建分片
   */
  private createChunks(file: File): ChunkInfo[] {
    const chunks: ChunkInfo[] = [];
    const chunkSize = this.options.chunkSize;
    let start = 0;
    let index = 0;

    while (start < file.size) {
      const end = Math.min(start + chunkSize, file.size);
      chunks.push({
        index,
        start,
        end,
        data: file.slice(start, end),
        retries: 0,
      });
      start = end;
      index++;
    }

    return chunks;
  }

  /**
   * 上传单个分片
   */
  private uploadChunkData(
    task: UploadTask,
    chunk: ChunkInfo,
    onProgress: (loaded: number, total: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', event => {
        if (event.lengthComputable) {
          onProgress(event.loaded, event.total);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Chunk upload failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
      xhr.addEventListener('timeout', () => reject(new Error('Upload timeout')));

      xhr.open(this.options.method, this.options.url, true);
      xhr.withCredentials = this.options.withCredentials;
      xhr.timeout = this.options.timeout;

      Object.entries(this.options.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      const formData = new FormData();
      formData.append(this.options.fileFieldName, chunk.data, task.file.name);
      formData.append('chunkIndex', chunk.index.toString());
      formData.append('totalChunks', Math.ceil(task.file.size / this.options.chunkSize).toString());
      formData.append('fileName', task.file.name);
      formData.append('fileSize', task.file.size.toString());

      // 添加额外参数
      const extraData = { ...this.options.extraData, ...task.extraData };
      Object.entries(extraData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      xhr.send(formData);
    });
  }

  /**
   * 检查已上传的分片
   */
  private async checkUploadedChunks(
    task: UploadTask,
    uploadedChunks: Set<number>
  ): Promise<void> {
    // 从 localStorage 恢复上传进度
    const key = `upload_${task.name}_${task.size}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        data.chunks.forEach((index: number) => uploadedChunks.add(index));
      } catch {
        // 忽略解析错误
      }
    }
  }

  /**
   * 保存分片进度
   */
  private saveChunkProgress(task: UploadTask, chunkIndex: number): void {
    const key = `upload_${task.name}_${task.size}`;
    const saved = localStorage.getItem(key);
    const data = saved ? JSON.parse(saved) : { chunks: [] };
    if (!data.chunks.includes(chunkIndex)) {
      data.chunks.push(chunkIndex);
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  /**
   * 合并分片
   */
  private async mergeChunks(task: UploadTask, totalChunks: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // 清除上传进度
          const key = `upload_${task.name}_${task.size}`;
          localStorage.removeItem(key);

          try {
            task.response = JSON.parse(xhr.responseText);
          } catch {
            task.response = xhr.responseText;
          }
          resolve();
        } else {
          reject(new Error(`Merge failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error')));

      xhr.open('POST', `${this.options.url}/merge`, true);
      xhr.withCredentials = this.options.withCredentials;
      xhr.timeout = this.options.timeout;

      Object.entries(this.options.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      const formData = new FormData();
      formData.append('fileName', task.file.name);
      formData.append('totalChunks', totalChunks.toString());

      xhr.send(formData);
    });
  }

  /**
   * 并发上传控制
   */
  private async concurrentUpload(
    tasks: UploadTask[],
    onProgress?: (progress: UploadProgress, task: UploadTask) => void
  ): Promise<UploadTask[]> {
    const concurrency = this.options.concurrency;
    const results: UploadTask[] = [];
    const executing: Promise<void>[] = [];

    for (const task of tasks) {
      const promise = this.processTask(task, { onProgress }).then(() => {
        results.push(task);
      });

      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);
    return results;
  }

  // ==================== 公共控制方法 ====================

  /**
   * 暂停上传
   */
  pause(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task && task.status === 'uploading') {
      this.pausedTasks.add(taskId);
      task.status = 'paused';
      this.emit('pause', task);
    }
  }

  /**
   * 恢复上传
   */
  resume(taskId: string): Promise<UploadTask> {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'paused') {
      return Promise.reject(new Error('Task not found or not paused'));
    }

    this.pausedTasks.delete(taskId);
    task.status = 'uploading';
    this.emit('resume', task);

    return this.processTask(task).then(() => task);
  }

  /**
   * 取消上传
   */
  cancel(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task && task.abort) {
      task.abort();
    }
  }

  /**
   * 取消所有上传
   */
  cancelAll(): void {
    this.tasks.forEach(task => {
      if (task.abort) {
        task.abort();
      }
    });
  }

  /**
   * 获取任务
   */
  getTask(taskId: string): UploadTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): UploadTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 移除任务
   */
  removeTask(taskId: string): boolean {
    return this.tasks.delete(taskId);
  }

  /**
   * 清空已完成任务
   */
  clearCompleted(): void {
    this.tasks.forEach((task, id) => {
      if (task.status === 'completed' || task.status === 'cancelled') {
        this.tasks.delete(id);
      }
    });
  }

  /**
   * 销毁上传器
   */
  destroy(): void {
    this.cancelAll();
    this.tasks.clear();
    this.eventHandlers = [];
    this.pausedTasks.clear();
  }
}

// ==================== 便捷函数 ====================

/**
 * 快速上传单个文件
 */
export function uploadFile(
  file: File,
  url: string,
  options?: Omit<UploadOptions, 'url'>
): Promise<UploadTask> {
  const uploader = new Uploader({ url, ...options });
  return uploader.upload(file);
}

/**
 * 快速上传多个文件
 */
export function uploadFiles(
  files: File[],
  url: string,
  options?: Omit<UploadOptions, 'url'>
): Promise<UploadTask[]> {
  const uploader = new Uploader({ url, ...options });
  return uploader.uploadMultiple(files);
}

/**
 * 快速批量上传
 */
export function uploadBatch(
  files: File[],
  url: string,
  options?: Omit<UploadOptions, 'url'> & {
    onProgress?: (progress: UploadProgress, task: UploadTask) => void;
    onTaskComplete?: (task: UploadTask) => void;
    onTaskError?: (task: UploadTask, error: Error) => void;
  }
): Promise<{ success: UploadTask[]; failed: UploadTask[] }> {
  const { onProgress, onTaskComplete, onTaskError, ...uploaderOptions } = options || {};
  const uploader = new Uploader({ url, ...uploaderOptions });
  return uploader.uploadBatch(files, { onProgress, onTaskComplete, onTaskError });
}

// ==================== 默认导出 ====================

export default Uploader;
