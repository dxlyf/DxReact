export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

declare global{
    interface Window{
        gtag: (...args: any[]) => void;
    }
}


type UploadOptions = {
    maxConcurrency?: number;
};

export const runWithConcurrency = async <T, R>(
    tasks: T[],
    executor: (index:number,task: T) => Promise<R>,
    options: UploadOptions = {}
): Promise<R[]> => {
    const { maxConcurrency = 3 } = options;
    const results: R[] = new Array(tasks.length);
    const executing: Map<number, Promise<void>> = new Map();
    let taskIndex = 0;

    const executeTask = async (index: number, task: T): Promise<void> => {
        const result = await executor(index,task);
        results[index] = result;
        executing.delete(index);
    };

    while (taskIndex < tasks.length) {
        while (executing.size < maxConcurrency && taskIndex < tasks.length) {
            const currentIndex = taskIndex++;
            const promise = executeTask(currentIndex, tasks[currentIndex]);
            executing.set(currentIndex, promise);
        }

        if (executing.size > 0) {
            await Promise.race(executing.values());
        }
    }

    await Promise.all(executing.values());
    return results;
};

// file或blob对象转换为base64编码
export const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
    });
};

/**
 * 添加URL参数（不刷新页面）
 * @param {Object} params - 要添加的参数对象
 * @param {boolean} replace - 是否替换当前历史记录（默认为false）
 */
export function addUrlParams(params: Record<string, string>, replace = false) {
  const url = new URL(window.location.href)
  
  // 添加新参数
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  
  // 获取新URL（不包含hash）
  const newUrl = url.pathname + url.search + url.hash
  
  // 使用history API更新URL
  if (replace) {
    window.history.replaceState({ ...window.history.state }, '', newUrl)
  } else {
    window.history.pushState({ ...window.history.state }, '', newUrl)
  }
}

/**
 * 添加或修改多个URL参数
 * @param url 原始URL
 * @param params 参数对象
 * @returns 修改后的URL
 */
export function setUrlParams(url: string, params: Record<string, string | number | boolean>): string {
  const urlObj = new URL(url, window.location.origin)
  
  Object.entries(params).forEach(([key, value]) => {
    urlObj.searchParams.set(key, String(value))
  })
  
  return urlObj.toString()
}



