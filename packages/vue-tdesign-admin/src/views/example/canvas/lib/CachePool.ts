
type CachePoolPoolOptions<T> = {
    maxSize?: number
    initSize?: number
    create?: () => T
    init?: (item: T) => void
    release?: (item: T) => void

}
export class CachePool<T> {
    static create<T>(options: CachePoolPoolOptions<T>) {
        return new CachePool<T>(options)
    }
    pools: T[]
    options: Partial<CachePoolPoolOptions<T>>
    constructor(options: CachePoolPoolOptions<T>) {
        this.options = { maxSize: 100, initSize: 0, ...(options || {}) }
        this.pools = []
        if (this.options.initSize > 0) {
            this.initPoolSize(this.options.initSize)
        }
    }
    private initPoolSize(size: number) {
        for (let i = 0; i < size; i++) {
            this.pools.push(this.options.create())
        }
    }
    get() {
        if (this.pools.length > 0) {
            const item = this.pools.shift()
            this.options.init(item)
            return item
        }
        return this.options.create()
    }
    release(item: T) {
        if (this.pools.length < this.options.maxSize) {
            this.options.release?.(item)
            this.pools.push(item)
        }
    }
}