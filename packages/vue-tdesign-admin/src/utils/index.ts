export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))



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