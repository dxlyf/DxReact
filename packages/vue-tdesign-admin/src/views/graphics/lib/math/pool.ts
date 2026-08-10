
type PoolOptons<T> = {
    initialSize?: number
    maxSize?: number
    create: () => T
    release: (obj: T) => void
}
export class Pool<T> {
    static create<T>(options: PoolOptons<T>): Pool<T> {
        return new Pool<T>(options)
    }
    private pool: T[]
    private options: PoolOptons<T>
    constructor(options: PoolOptons<T>) {
        this.options={
            maxSize:10,
            initialSize:0,
            ...options
        }
        this.pool = []
        
        if (this.options.initialSize) {
            for (let i = 0; i < this.options.initialSize; i++) {
                this.pool.push(this.options.create())
            }
        }
    }
    release(obj: T) {
        if(this.pool.length<this.options.maxSize){
            this.options.release(obj)
            this.pool.push(obj)
        }
    }
    acquire(): T {
        if(this.pool.length>0){
            const obj = this.pool.pop()
            return obj
        }
        return this.options.create()
    }
}