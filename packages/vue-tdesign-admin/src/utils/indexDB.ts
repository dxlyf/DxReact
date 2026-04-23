// afdfd
type IndexDBField = {
    name: string
    unique: boolean
    multiEntry: boolean
    type: string
}
export class IndexDB {
    dbName: string
    version: number
    db: IDBDatabase | null = null
    constructor(options: {
        dbName: string,
        version: number
    }) {
        this.dbName = options.dbName
        this.version = options.version
    }
    async initDB() {
        const db = await this.openIndexedDB(this.dbName, this.version)
        this.db = db
        if (!db.objectStoreNames.contains('default')) {
            console.log('创建默认表')
            await this.createTable('default')
        }
        console.log('当前数据表列表', Array.from(db.objectStoreNames))

    }
    async openIndexedDB(name: string, version: number) {
        return new Promise<IDBDatabase>((resolve, reject) => {
            const dbRequest = window.indexedDB.open(name, version)
            dbRequest.addEventListener('upgradeneeded', (event) => {
                console.log('数据库升级需要创建表')
                const db = dbRequest.result as IDBDatabase

                resolve(db)

            })
            dbRequest.addEventListener('success', () => {
                console.log('数据库打开成功')
                resolve(dbRequest.result)
            })
            dbRequest.addEventListener('error', () => {
                console.log('数据库打开失败')
                reject(dbRequest.error)
            })
        })
    }
    async createTable(tableName: string = 'default') {
        // if(!this.db){
        //     throw new Error('数据库未初始化')
        // }
        const objectStore = this.db.createObjectStore(tableName)

        // const transaction=this.db.transaction([tableName],'readwrite')
        //this.db.createObjectStore(tableName,{keyPath:'id',autoIncrement:true})
        // const objectStore=transaction.objectStore(tableName)    
        // 创建主键索引
       // objectStore.createIndex(tableName, tableName, { unique: true })

    }
    async setItem(key: any, value: any, tableName = 'default') {
        const transaction = this.db.transaction([tableName], 'readwrite')
        const objectStore = transaction.objectStore(tableName)
        const request=objectStore.put(value, key)
        return new Promise((resolve, reject) => {
            request.addEventListener('success', () => {
                console.log('设置成功')
                resolve(true)
            })
            request.addEventListener('error', () => {
                console.log('设置失败',request.error)
                reject(request.error)
            })
        })
    }
    async getItem(key: any, tableName = 'default') {
        const transaction = this.db.transaction([tableName], 'readonly')
        const objectStore = transaction.objectStore(tableName)
        const request =  objectStore.get(key)
        return new Promise((resolve, reject) => {
            request.addEventListener('success', () => {
                console.log('获取成功',request.result)
                resolve(request.result)
            })
            request.addEventListener('error', () => {
                console.log('获取失败',request.error)DB
                reject(null)
            })
        })
    }
}