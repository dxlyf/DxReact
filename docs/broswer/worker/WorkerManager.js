// worker-manager.js
class WorkerManager {
    constructor(workerType = 'dedicated') {
        this.workerType = workerType; // 'dedicated' 或 'shared'
        this.workers = new Map();
        this.callbacks = new Map();
        this.requestId = 0;
    }
    // 创建 Worker
    createWorker(name, scriptPath,isScriptString=false) {
        if (this.workers.has(name)) {
            console.warn(`Worker ${name} 已存在`);
            return this.workers.get(name);
        }
        if (isScriptString) {
            const blob = new Blob([scriptPath], { type: 'application/javascript' });
            scriptPath = URL.createObjectURL(blob);
        }
        let worker;
        if (this.workerType === 'shared') {
            worker = new SharedWorker(scriptPath);
            // SharedWorker 需要监听 port
            worker.port.start();
        } else {
            worker = new Worker(scriptPath);
        }

        const workerWrapper = {
            worker,
            blobUrl: isScriptString ? scriptPath : null,
            port: this.workerType === 'shared' ? worker.port : worker,
            listeners: new Map()
        };

        // 设置消息监听
        this.setupMessageListener(workerWrapper);

        this.workers.set(name, workerWrapper);
        return workerWrapper;
    }

    setupMessageListener(workerWrapper) {
        const target = workerWrapper.port;

        target.addEventListener('message', (event) => {
            const { requestId, type, data, error } = event.data;

            if (requestId && this.callbacks.has(requestId)) {
                const { resolve, reject } = this.callbacks.get(requestId);
                this.callbacks.delete(requestId);

                if (error) {
                    reject(new Error(error));
                } else {
                    resolve(data);
                }
            }

            // 触发自定义事件监听
            if (type && workerWrapper.listeners.has(type)) {
                const callbacks = workerWrapper.listeners.get(type);
                callbacks.forEach(cb => cb(data, event));
            }
        });

        target.addEventListener('error', (error) => {
            console.error('Worker error:', error);
        });

        if (this.workerType === 'dedicated') {
            workerWrapper.worker.addEventListener('error', (error) => {
                console.error('Worker error:', error);
            });
        }
    }

    // 发送消息并等待响应
    sendRequest(workerName, type, data, transfer = []) {
        return new Promise((resolve, reject) => {
            const workerWrapper = this.workers.get(workerName);
            if (!workerWrapper) {
                reject(new Error(`Worker ${workerName} 不存在`));
                return;
            }

            const requestId = ++this.requestId;
            this.callbacks.set(requestId, { resolve, reject, workerName });

            const message = { requestId, type, data };

            try {
                workerWrapper.port.postMessage(message, transfer);
            } catch (error) {
                this.callbacks.delete(requestId);
                reject(error);
            }
        });
    }

    // 监听特定类型的消息
    on(workerName, type, callback) {
        const workerWrapper = this.workers.get(workerName);
        if (!workerWrapper) {
            throw new Error(`Worker ${workerName} 不存在`);
        }

        if (!workerWrapper.listeners.has(type)) {
            workerWrapper.listeners.set(type, new Set());
        }

        workerWrapper.listeners.get(type).add(callback);
    }

    off(workerName, type, callback) {
        const workerWrapper = this.workers.get(workerName);
        if (!workerWrapper) return;

        if (callback) {
            workerWrapper.listeners.get(type)?.delete(callback);
        } else {
            workerWrapper.listeners.delete(type);
        }
    }

    // 终止 Worker
    terminate(workerName) {
        const workerWrapper = this.workers.get(workerName);
        if (!workerWrapper) return;

        if (this.workerType === 'dedicated') {
            workerWrapper.worker.terminate();
        } else {
            workerWrapper.port.close();
        }
        // 清理 blob URL
        if (workerWrapper.blobUrl) {
            URL.revokeObjectURL(workerWrapper.blobUrl);
        }
        this.workers.delete(workerName);
     
        // 清理该 Worker 相关的回调
        for (const [requestId, { workerName: reqWorkerName }] of this.callbacks) {
            if (reqWorkerName === workerName) {
                this.callbacks.delete(requestId);
            }
        }
    }

    // 终止所有 Worker
    terminateAll() {
        for (const [name] of this.workers) {
            this.terminate(name);
        }
    }
}