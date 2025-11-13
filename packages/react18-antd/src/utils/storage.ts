class UniversalStorage {
    supportsIndexedDB:boolean
    dbName:string
    storeName:string
    db:IDBDatabase
    initialized:boolean
    constructor(dbName = 'UniversalDB', storeName = 'keyval') {
        this.dbName = dbName;
        this.storeName = storeName;
        this.db = null;
        this.supportsIndexedDB = 'indexedDB' in window;
        this.initialized = false;
    }

    /**
     * 初始化存储系统
     */
    async init() {
        if (this.initialized) return;
        
        if (this.supportsIndexedDB) {
            try {
                await this.initIndexedDB();
                console.log('使用 IndexedDB 作为存储后端');
            } catch (error) {
                console.warn('IndexedDB 初始化失败，降级到 localStorage:', error);
                this.supportsIndexedDB = false;
            }
        } else {
            console.log('使用 localStorage 作为存储后端');
        }
        
        this.initialized = true;
    }
    async getDb() {
        const databases = await indexedDB.databases();
        return databases
    }
    /**
     * 初始化 IndexedDB
     */
    initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            
            request.onupgradeneeded = (event) => {
                const oldVersion=event.oldVersion
                const newVersion=event.newVersion
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
        });
    }

    /**
     * 存储数据
     * @param {string} key - 键名
     * @param {any} value - 值（支持所有可序列化类型）
     * @returns {Promise<boolean>} 是否成功
     */
    async setItem(key:string, value:any) {
        await this.init();
        
        try {
            if (this.supportsIndexedDB) {
                return await this.setIndexedDB(key, value);
            } else {
                return this.setLocalStorage(key, value);
            }
        } catch (error) {
            console.error('存储数据失败:', error);
            return false;
        }
    }

    /**
     * 读取数据
     * @param {string} key - 键名
     * @returns {Promise<any>} 存储的值
     */
    async getItem(key) {
        await this.init();
        
        try {
            if (this.supportsIndexedDB) {
                return await this.getIndexedDB(key);
            } else {
                return this.getLocalStorage(key);
            }
        } catch (error) {
            console.error('读取数据失败:', error);
            return null;
        }
    }

    /**
     * 删除数据
     * @param {string} key - 键名
     * @returns {Promise<boolean>} 是否成功
     */
    async removeItem(key) {
        await this.init();
        
        try {
            if (this.supportsIndexedDB) {
                return await this.removeIndexedDB(key);
            } else {
                return this.removeLocalStorage(key);
            }
        } catch (error) {
            console.error('删除数据失败:', error);
            return false;
        }
    }

    /**
     * 清空所有数据
     * @returns {Promise<boolean>} 是否成功
     */
    async clear() {
        await this.init();
        
        try {
            if (this.supportsIndexedDB) {
                return await this.clearIndexedDB();
            } else {
                return this.clearLocalStorage();
            }
        } catch (error) {
            console.error('清空数据失败:', error);
            return false;
        }
    }

    /**
     * 获取所有键名
     * @returns {Promise<string[]>} 所有键名数组
     */
    async keys() {
        await this.init();
        
        try {
            if (this.supportsIndexedDB) {
                return await this.getIndexedDBKeys();
            } else {
                return this.getLocalStorageKeys();
            }
        } catch (error) {
            console.error('获取键名失败:', error);
            return [];
        }
    }

    // IndexedDB 操作方法
    setIndexedDB(key:string, value:any) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(value, key);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    getIndexedDB(key:string) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    removeIndexedDB(key:string) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    clearIndexedDB() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    getIndexedDBKeys() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAllKeys();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // localStorage 操作方法
    setLocalStorage(key:string, value:string) {
        try {
            const serializedValue = JSON.stringify({
                value: value,
                timestamp: Date.now()
            });
            localStorage.setItem(key, serializedValue);
            return true;
        } catch (error) {
            console.error('localStorage 存储失败:', error);
            return false;
        }
    }

    getLocalStorage(key:string) {
        try {
            const item = localStorage.getItem(key);
            if (item) {
                const parsed = JSON.parse(item);
                return parsed.value;
            }
            return null;
        } catch (error) {
            console.error('localStorage 读取失败:', error);
            return null;
        }
    }

    removeLocalStorage(key:string) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('localStorage 删除失败:', error);
            return false;
        }
    }

    clearLocalStorage() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('localStorage 清空失败:', error);
            return false;
        }
    }

    getLocalStorageKeys() {
        try {
            return Object.keys(localStorage);
        } catch (error) {
            console.error('获取 localStorage 键名失败:', error);
            return [];
        }
    }

    /**
     * 获取当前使用的存储类型
     * @returns {string} 'indexeddb' 或 'localstorage'
     */
    getStorageType() {
        return this.supportsIndexedDB ? 'indexeddb' : 'localstorage';
    }
}