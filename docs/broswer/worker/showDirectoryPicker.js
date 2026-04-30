const testDirectoryPickerWorker = async () => {
    const log = (step, ...args) => console.log(`[Step ${step}]`, ...args)
    const handleMessageCode = `
        self.onmessage=async (e)=>{
            const {type,requestId,dirHandle,fileName,options,content}=e.data
            try{
                if (type==='getFileHandle') {
                    const fileHandle=await dirHandle.getFileHandle(fileName, options)
                    self.postMessage({type,requestId,success:true,data:fileHandle})
                }
                else if (type==='writeFile') {
                    const fileHandle=await dirHandle.getFileHandle(fileName, options)
                    const writer=await fileHandle.createWritable()
                    await writer.write(content)
                    await writer.close()
                    self.postMessage({type,requestId,success:true})
                }
                else if (type==='remove') {
                    // console.log(\`[Step $\{requestId\}]\`,data)
                    await dirHandle.removeEntry(fileName)
                    self.postMessage({type,requestId,success:true})
                }
            }catch(e){
                self.postMessage({type,requestId,success:false,msg:e.message||e,errorName:e.name})
            }
        }
    `
    const createWorker = (jsCode) => {
        const init = () => {
            const blobUrl = URL.createObjectURL(new Blob([jsCode], { type: 'application/javascript' }));
            const worker = new Worker(blobUrl)
            let requestId = 0
            let callbacks = new Map()
            worker.addEventListener('message', e => {
                const { type, success, requestId, fileHandle, msg, data } = e.data
                const callback = callbacks.get(requestId)
                if (callback) {
                    callbacks.delete(requestId)
                    if (success) {
                        callback.resolve(data)
                    } else {
                        callback.reject(msg)
                    }
                }
            })
            const sendMessage = (type, data = {}) => {
                return new Promise((resolve, reject) => {
                    callbacks.set(requestId, {
                        resolve,
                        reject
                    })
                    worker.postMessage({ type, requestId: requestId++, ...data })
                })
            }
            const timeHandle = (promise, timeout = 5000) => {
                return Promise.race([
                    promise,
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error(`操作超时，已等待 ${timeout} 毫秒`)), timeout)
                    )
                ])
            }
            const getFileHandle = (dirHandle, fileName, options = {}) => {
                return timeHandle(sendMessage('getFileHandle', { dirHandle, fileName, options }))
            }
            const writeFile = (dirHandle, fileName, options, content) => {
                return timeHandle(sendMessage('writeFile', { dirHandle, fileName, options, content }))
            }
            const removeFile = (dirHandle, fileName) => {
                return timeHandle(sendMessage('remove', { dirHandle, fileName }))
            }
            return {
                destroy: () => {
                    worker.terminate()
                    callbacks.clear()
                    URL.revokeObjectURL(blobUrl)
                },
                sendMessage,
                getFileHandle,
                writeFile,
                removeFile,
            }
        }
        const result=init()
        result.restart=()=>{
            result.destroy()
            Object.assign(result,init())
        }
        return result
    }
    // 在操作前，明确请求读写权限
    const verifyPermission = async (dirHandle, readWrite = true) => {
        const mode = readWrite ? 'readwrite' : 'read';
        // 检查当前权限状态
        if (await dirHandle.queryPermission({ mode }) === 'granted') {
            return true;
        }
        // 重新请求权限
        if (await dirHandle.requestPermission({ mode }) === 'granted') {
            return true;
        }
        return false;
    };

    //------------------------------------------------
    // 主逻辑
    //------------------------------------------------
    try {
        /**@type {FileSystemHandle} */
        const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'test' })
        // 使用前调用
        const hasPermission = await verifyPermission(dirHandle, true)
        if (!hasPermission) {
            throw new Error('目录权限被拒绝')
        } else {
            console.log('目录权限已授权')
        }
        const wk = createWorker(handleMessageCode)
        log(1, '目录:', dirHandle.name)
        // 模拟业务场景:并发写入多个文件
        const fileCount = 20;
        const files = Array.from({ length: fileCount }, (v, i) => `__test_concurrent_${i}.ts`)
        log(2, `准备并发写入${fileCount}个文件`)
        const errors = []
        await Promise.all(files.map(async (file) => {
            try {
                // const fileHandle=await getFileHandleWithTimeout(dirHandle, file,{create:true})
                // const w=await fileHandle.createWritable()
                // await w.write(`// test file concurrent ${file}\n export const value=${Date.now()};\n`)
                // await w.close()
                await wk.getFileHandle(dirHandle, file, { create: true })
                await wk.writeFile(dirHandle, file, { create: true }, `// test file concurrent ${file}\n export const value=${Date.now()};\n`)
                // console.log(`✅ 并发写入文件 ${file} 写入成功`)
            } catch (e) {
                if (typeof e.message==='string'&&e.message.indexOf('操作超时') !== -1) {
                    wk.restart()
                    console.log(`操作超时，已重启线程`)
                }
                errors.push({ file: file, error: e.message||e })
                log('ERR', `并发写入文件 ${file} 写入失败:`, e.name, e.message||e)
            }
        }))
        if (errors.length > 0) {
            log(3, `❌ 并发写入 ${errors.length}/${fileCount}  个文件写入失败`)
            console.table(errors)
            log(4, `⚠ 确认是并发写入 + 外部程序干扰导致的问题`)
        } else {
            log(3, `✅ 并发全部 ${fileCount} 个文件写入成功`)
        }
        // 第二轮：串行写入文件
        log(5, `准备串行写入${fileCount}个文件`)

        // 使用前调用
        // const hasPermission2=await verifyPermission(dirHandle, true)
        // if (!hasPermission2) {
        //     throw new Error('目录权限被拒绝') 
        // }else{
        //     console.log('目录权限已授权')
        // }
        const errors2 = []
        for (const [i, file] of files.entries()) {
            try {
                // const fh=await getFileHandleWithTimeout(dirHandle, name,{create:true})
                // const w=await fh.createWritable()
                // await w.write(`// test file serial ${name}\n export const value=${Date.now()};\n`)
                // await w.close()
                await wk.getFileHandle(dirHandle, file, { create: true })
                await wk.writeFile(dirHandle, file, { create: true }, `// test file serial ${file}\n export const value=${Date.now()};\n`)
                // console.log(`✅ 串行写入文件 ${name} 写入成功`)
            } catch (e) {
                if (typeof e.message==='string'&&e.message.indexOf('操作超时') !== -1) {
                    wk.restart()
                    console.log(`操作超时，已重启线程`)
                }
                errors2.push({ file: file, error: e.message ||e})
                log('ERR', `串行写入文件 ${file} 写入失败:`, e.name, e.message ||e)
            }
        }
        if (errors2.length > 0) {
            log(6, `❌ 串行写入也有${errors2.length}/${fileCount}  个文件写入失败`)
            // console.tab(errors2)
        } else {
            log(6, `✅ 串行全部 ${fileCount} 个文件写入成功`)
        }
        // 清理
        for (const file of files) {
            //await dirHandle.removeEntry(file).catch(()=>{})
            //  await wk.removeFile(dirHandle,file).catch(()=>{})
        }
        wk.destroy()
        log(7, `✅ 清理完成`)
        console.log('\n==============结论==================')
        if (errors.length > 0 && errors2.length === 0) {
            console.log(`❌ 并发写入失败,但串行写入成功`)
        } else if (errors.length === 0 && errors2.length > 0) {
            console.log(`❌ 串行写入失败,但并发写入成功`)
        } else {
            console.log(`✅ 全部写入成功`)
        }
    } catch (e) {
        log('出错', e)
    } finally {

    }
}


const testDirectoryPickerIndexedDB = async () => {
    const log = (step, ...args) => console.log(`[Step ${step}]`, ...args)
    // 创建一个带超时限制的 Promise 包装函数
    const getFileHandleWithTimeout = (dirHandle, fileName, options, timeout = 5000) => {
        return Promise.race([
            dirHandle.getFileHandle(fileName, options),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`操作超时，已等待 ${timeout} 毫秒`)), timeout)
            )
        ]);
    }
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
        async length() {
            const keys = await this.keys();
            return keys.length;
        }

        // 检查键是否存在
        async hasItem(key) {
            const value = await this.getItem(key);
            return value !== null;
        }
    }

    const indexedStorage = new IndexedStorage()

    // 在操作前，明确请求读写权限
    const verifyPermission = async (dirHandle, readWrite = true) => {
        const mode = readWrite ? 'readwrite' : 'read';
        // 检查当前权限状态
        if (await dirHandle.queryPermission({ mode }) === 'granted') {
            return true;
        }
        // 重新请求权限
        if (await dirHandle.requestPermission({ mode }) === 'granted') {
            return true;
        }
        return false;
    };

    //------------------------------------------------
    // 主逻辑
    //------------------------------------------------
    try {
        /**@type {FileSystemHandle} */
        let dirHandle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'test' })
        // 使用前调用
        const hasPermission = await verifyPermission(dirHandle, true)
        if (!hasPermission) {
            throw new Error('目录权限被拒绝')
        } else {
            console.log('目录权限已授权')
        }
        indexedStorage.setItem('dirHandle', dirHandle)
        log(1, '目录:', dirHandle.name)
        // 模拟业务场景:并发写入多个文件
        const fileCount = 20;
        const files = Array.from({ length: fileCount }, (v, i) => `__test_concurrent_${i}.ts`)
        log(2, `准备并发写入${fileCount}个文件`)
        const errors = []
        await Promise.all(files.map(async (file) => {
            try {
                const fileHandle = await getFileHandleWithTimeout(dirHandle, file, { create: true })
                const w = await fileHandle.createWritable()
                await w.write(`// test file concurrent ${file}\n export const value=${Date.now()};\n`)
                await w.close()
                // console.log(`✅ 并发写入文件 ${file} 写入成功`)
            } catch (e) {
                errors.push({ file: file, error: e.message })
                log('ERR', `并发写入文件 ${file} 写入失败:`, e.name, e.message)
            }
        }))
        if (errors.length > 0) {
            log(3, `❌ 并发写入 ${errors.length}/${fileCount}  个文件写入失败`)
            console.tab(errors)
            log(4, `⚠ 确认是并发写入 + 外部程序干扰导致的问题`)
        } else {
            log(3, `✅ 并发全部 ${fileCount} 个文件写入成功`)
        }
        // 第二轮：串行写入文件
        log(5, `准备串行写入${fileCount}个文件`)

        // 使用前调用
        // const hasPermission2 = await verifyPermission(dirHandle, true)
        // if (!hasPermission2) {
        //     throw new Error('目录权限被拒绝')
        // } else {
        //     console.log('目录权限已授权')
        // }
        dirHandle = await indexedStorage.getItem('dirHandle') // 刷新缓存状态
        const errors2 = []
        for (const [i, name] of files.entries()) {
            try {
                const fh = await getFileHandleWithTimeout(dirHandle, name, { create: true })
                const w = await fh.createWritable()
                await w.write(`// test file serial ${name}\n export const value=${Date.now()};\n`)
                await w.close()
                // console.log(`✅ 串行写入文件 ${name} 写入成功`)
            } catch (e) {
                errors2.push({ file: name, error: e.message })
                log('ERR', `串行写入文件 ${name} 写入失败:`, e.name, e.message)
            }
        }
        if (errors2.length > 0) {
            log(6, `❌ 串行写入也有${errors2.length}/${fileCount}  个文件写入失败`)
            // console.tab(errors2)
        } else {
            log(6, `✅ 串行全部 ${fileCount} 个文件写入成功`)
        }
        // 清理
        for (const file of files) {
            await dirHandle.removeEntry(file).catch(() => { })
        }
        log(7, `✅ 清理完成`)
        console.log('\n==============结论==================')
        if (errors.length > 0 && errors2.length === 0) {
            console.log(`❌ 并发写入失败,但串行写入成功`)
        } else if (errors.length === 0 && errors2.length > 0) {
            console.log(`❌ 串行写入失败,但并发写入成功`)
        } else {
            console.log(`✅ 全部写入成功`)
        }
    } catch (e) {
        log('出错', e)
    } finally {

    }
}

const testDirectoryPicker = async () => {
    const log = (step, ...args) => console.log(`[Step ${step}]`, ...args)
    // 创建一个带超时限制的 Promise 包装函数
    const getFileHandleWithTimeout = (dirHandle, fileName, options, timeout = 5000) => {
        return Promise.race([
            dirHandle.getFileHandle(fileName, options),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`操作超时，已等待 ${timeout} 毫秒`)), timeout)
            )
        ]);
    }

    // 在操作前，明确请求读写权限
    const verifyPermission = async (dirHandle, readWrite = true) => {
        const mode = readWrite ? 'readwrite' : 'read';
        // 检查当前权限状态
        if (await dirHandle.queryPermission({ mode }) === 'granted') {
            return true;
        }
        // 重新请求权限
        if (await dirHandle.requestPermission({ mode }) === 'granted') {
            return true;
        }
        return false;
    };

    //------------------------------------------------
    // 主逻辑
    //------------------------------------------------
    try {
        /**@type {FileSystemHandle} */
        const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'test' })
        // 使用前调用
        const hasPermission = await verifyPermission(dirHandle, true)
        if (!hasPermission) {
            throw new Error('目录权限被拒绝')
        } else {
            console.log('目录权限已授权')
        }
        log(1, '目录:', dirHandle.name)
        // 模拟业务场景:并发写入多个文件
        const fileCount = 20;
        const files = Array.from({ length: fileCount }, (v, i) => `__test_concurrent_${i}.ts`)
        log(2, `准备并发写入${fileCount}个文件`)
        const errors = []
        await Promise.all(files.map(async (file) => {
            try {
                const fileHandle = await getFileHandleWithTimeout(dirHandle, file, { create: true })
                const w = await fileHandle.createWritable()
                await w.write(`// test file concurrent ${file}\n export const value=${Date.now()};\n`)
                await w.close()
                // console.log(`✅ 并发写入文件 ${file} 写入成功`)
            } catch (e) {
                errors.push({ file: file, error: e.message })
                log('ERR', `并发写入文件 ${file} 写入失败:`, e.name, e.message)
            }
        }))
        if (errors.length > 0) {
            log(3, `❌ 并发写入 ${errors.length}/${fileCount}  个文件写入失败`)
            console.tab(errors)
            log(4, `⚠ 确认是并发写入 + 外部程序干扰导致的问题`)
        } else {
            log(3, `✅ 并发全部 ${fileCount} 个文件写入成功`)
        }
        // 第二轮：串行写入文件
        log(5, `准备串行写入${fileCount}个文件`)

        // 使用前调用
        const hasPermission2 = await verifyPermission(dirHandle, true)
        if (!hasPermission2) {
            throw new Error('目录权限被拒绝')
        } else {
            console.log('目录权限已授权')
        }
        const errors2 = []
        for (const [i, name] of files.entries()) {
            try {
                const fh = await getFileHandleWithTimeout(dirHandle, name, { create: true })
                const w = await fh.createWritable()
                await w.write(`// test file serial ${name}\n export const value=${Date.now()};\n`)
                await w.close()
                // console.log(`✅ 串行写入文件 ${name} 写入成功`)
            } catch (e) {
                errors2.push({ file: name, error: e.message })
                log('ERR', `串行写入文件 ${name} 写入失败:`, e.name, e.message)
            }
        }
        if (errors2.length > 0) {
            log(6, `❌ 串行写入也有${errors2.length}/${fileCount}  个文件写入失败`)
            // console.tab(errors2)
        } else {
            log(6, `✅ 串行全部 ${fileCount} 个文件写入成功`)
        }
        // 清理
        for (const file of files) {
            await dirHandle.removeEntry(file).catch(() => { })
        }
        log(7, `✅ 清理完成`)
        console.log('\n==============结论==================')
        if (errors.length > 0 && errors2.length === 0) {
            console.log(`❌ 并发写入失败,但串行写入成功`)
        } else if (errors.length === 0 && errors2.length > 0) {
            console.log(`❌ 串行写入失败,但并发写入成功`)
        } else {
            console.log(`✅ 全部写入成功`)
        }
    } catch (e) {
        log('出错', e)
    } finally {

    }
}