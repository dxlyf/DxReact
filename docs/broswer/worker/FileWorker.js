// file-worker.js (专用 Worker)
// 支持文件路径操作

class FileWorker {
    constructor() {
        this.dirHandles = new Map(); // 存储目录句柄
        this.currentDir = null;
    }
    
    async handleMessage(event) {
        const { requestId, type, data } = event.data;
        
        try {
            let result;
            
            switch (type) {
                case 'init-dir':
                    result = await this.initDirectory(data);
                    break;
                case 'get-file':
                    result = await this.getFile(data);
                    break;
                case 'get-file-with-timeout':
                    result = await this.getFileWithTimeout(data);
                    break;
                case 'read-file':
                    result = await this.readFile(data);
                    break;
                case 'write-file':
                    result = await this.writeFile(data);
                    break;
                case 'list-files':
                    result = await this.listFiles(data);
                    break;
                case 'create-subdir':
                    result = await this.createSubDirectory(data);
                    break;
                case 'delete-file':
                    result = await this.deleteFile(data);
                    break;
                default:
                    throw new Error(`未知操作类型: ${type}`);
            }
            
            self.postMessage({
                requestId,
                data: result
            });
        } catch (error) {
            self.postMessage({
                requestId,
                error: error.message
            });
        }
    }
    
    async initDirectory({ dirHandle, dirId }) {
        // 存储目录句柄
        this.dirHandles.set(dirId || 'default', dirHandle);
        this.currentDir = dirHandle;
        return { success: true, dirId: dirId || 'default' };
    }
    
    async getFile({ fileName, dirId = 'default', create = true }) {
        const dirHandle = this.dirHandles.get(dirId);
        if (!dirHandle) {
            throw new Error('目录未初始化');
        }
        
        const fileHandle = await dirHandle.getFileHandle(fileName, { create });
        return { fileName, success: true };
    }
    
    async getFileWithTimeout({ fileName, dirId = 'default', create = true, timeout = 5000 }) {
        const dirHandle = this.dirHandles.get(dirId);
        if (!dirHandle) {
            throw new Error('目录未初始化');
        }
        
        // 使用 Promise.race，但注意：如果 getFileHandle 永久挂起，这个超时也无法挽救
        // 真正常用的是通过 Worker 终止机制
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`操作超时: ${timeout}ms`)), timeout);
        });
        
        const fileHandle = await Promise.race([
            dirHandle.getFileHandle(fileName, { create }),
            timeoutPromise
        ]);
        
        return { fileName, success: true };
    }
    
    async readFile({ fileName, dirId = 'default', encoding = 'utf-8' }) {
        const dirHandle = this.dirHandles.get(dirId);
        if (!dirHandle) {
            throw new Error('目录未初始化');
        }
        
        const fileHandle = await dirHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        
        if (encoding === 'binary') {
            const buffer = await file.arrayBuffer();
            return { content: buffer, type: 'binary' };
        } else {
            const content = await file.text();
            return { content, type: 'text' };
        }
    }
    
    async writeFile({ fileName, content, dirId = 'default' }) {
        const dirHandle = this.dirHandles.get(dirId);
        if (!dirHandle) {
            throw new Error('目录未初始化');
        }
        
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        
        if (typeof content === 'string') {
            await writable.write(content);
        } else if (content instanceof ArrayBuffer) {
            await writable.write(content);
        } else if (content instanceof Blob) {
            await writable.write(content);
        }
        
        await writable.close();
        return { fileName, success: true };
    }
    
    async listFiles({ dirId = 'default', recursive = false }) {
        const dirHandle = this.dirHandles.get(dirId);
        if (!dirHandle) {
            throw new Error('目录未初始化');
        }
        
        const files = [];
        
        async function traverse(dir, path = '') {
            for await (const entry of dir.values()) {
                const entryPath = path ? `${path}/${entry.name}` : entry.name;
                if (entry.kind === 'file') {
                    files.push({ name: entry.name, path: entryPath, kind: 'file' });
                } else if (recursive && entry.kind === 'directory') {
                    await traverse(entry, entryPath);
                }
            }
        }
        
        await traverse(dirHandle);
        return { files, count: files.length };
    }
    
    async createSubDirectory({ dirName, dirId = 'default' }) {
        const dirHandle = this.dirHandles.get(dirId);
        if (!dirHandle) {
            throw new Error('目录未初始化');
        }
        
        const subDir = await dirHandle.getDirectoryHandle(dirName, { create: true });
        return { dirName, success: true };
    }
    
    async deleteFile({ fileName, dirId = 'default' }) {
        const dirHandle = this.dirHandles.get(dirId);
        if (!dirHandle) {
            throw new Error('目录未初始化');
        }
        
        await dirHandle.removeEntry(fileName);
        return { fileName, success: true };
    }
}

// 初始化 Worker
const fileWorker = new FileWorker();
self.onmessage = (event) => fileWorker.handleMessage(event);