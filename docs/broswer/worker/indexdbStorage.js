// indexed-storage.js
class IndexedStorage {
    constructor(dbName = 'IndexedStorage', storeName = 'keyvalue') {
        this.dbName = dbName;
        this.storeName = storeName;
        this.db = null;
        this.initPromise = null;
    }
    
    // 初始化数据库连接
    async init() {
        if (this.db) return this.db;
        
        if (!this.initPromise) {
            this.initPromise = new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, 1);
                
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    this.db = request.result;
                    resolve(this.db);
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName);
                    }
                };
            });
        }
        
        return this.initPromise;
    }
    
    // 设置值
    async setItem(key, value) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(value, key);
            
            request.onsuccess = () => resolve(value);
            request.onerror = () => reject(request.error);
        });
    }
    
    // 获取值
    async getItem(key) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);
            
            request.onsuccess = () => resolve(request.result ?? null);
            request.onerror = () => reject(request.error);
        });
    }
    
    // 删除值
    async removeItem(key) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    // 清空所有值
    async clear() {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    // 获取所有键
    async keys() {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAllKeys();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    // 获取所有值
    async values() {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    // 获取所有键值对
    async entries() {
        const keys = await this.keys();
        const entries = [];
        
        for (const key of keys) {
            const value = await this.getItem(key);
            entries.push([key, value]);
        }
        
        return entries;
    }
    
    // 获取长度
    async get length() {
        const keys = await this.keys();
        return keys.length;
    }
    
    // 检查键是否存在
    async hasItem(key) {
        const value = await this.getItem(key);
        return value !== null;
    }
}

// 创建默认实例
const indexedStorage = new IndexedStorage();

// 导出
export { IndexedStorage, indexedStorage };