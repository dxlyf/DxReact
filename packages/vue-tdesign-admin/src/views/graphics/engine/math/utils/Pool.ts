export type PollOptions<T> = {
    /** 初始池大小 */
    initialSize?: number
    /** 最大池大小 */
    maxSize?: number
    create?:()=>T
    /** 初始化池 */
    init?: (t: T) => void
    /** 释放池 */
    release?: (t: T) => void
    /** 允许创建新实例 */
    allowCreate?: boolean
}

/** 与 PollOptions 同义（修正拼写） */
export type PoolOptions<T> = PollOptions<T>

/**
 * 对象池
 *
 * 通过复用对象减少高频场景下的 GC 压力。
 * acquire 优先复用池中空闲对象，池空时按 allowCreate 决定是否新建；
 * release 将对象归还池中（可触发 release 回调），超出 maxSize 的部分被丢弃。
 */
export class Pool<T> {
    static create<T>(options:PollOptions<T>): Pool<T> {
        return new Pool(options)
    }
    private readonly pools: T[]
    private readonly options: Required<PollOptions<T>>

    constructor(options: PollOptions<T> = {}) {
        this.pools = []
        this.options = {
            initialSize: options.initialSize ?? 0,
            maxSize: options.maxSize ?? 50,
            create:options.create,
            init: options.init,
            release: options.release,
            allowCreate: options.allowCreate ?? true,
        }
        if (this.options.initialSize > 0) this.preallocate(this.options.initialSize)
    }

    /** 当前池中空闲对象数量 */
    get size(): number {
        return this.pools.length
    }

    /** 池容量上限 */
    get maxSize(): number {
        return this.options.maxSize
    }

    /** 池是否已满 */
    get isFull(): boolean {
        return this.pools.length >= this.options.maxSize
    }

    /**
     * 取出一个对象
     * 优先复用池中对象；池为空时若允许创建则新建，否则返回 null
     */
    acquire(): T | null {
        const obj = this.pools.pop()
        if (obj !== undefined){
             this.options.init?.(obj)
             return obj
        }
        if (!this.options.allowCreate) return null
        return this.create()
    }

    /** 取出一个对象；不允许创建时抛错（适用于必须拿到实例的场景） */
    acquireRequired(): T {
        const obj = this.acquire()
        if (obj === null) throw new Error('Pool.acquireRequired: 池为空且不允许创建新实例')
        return obj
    }

    /**
     * 归还对象
     * 超出 maxSize 时丢弃；否则执行 release 回调并压回池中
     */
    release(obj: T): void {
        if (this.isFull) {
            this.options.release?.(obj)
            return
        }
        this.options.release?.(obj)
        this.pools.push(obj)
    }

    /** 创建新实例并执行 init 回调 */
    private create(): T {
        return this.options.create()
    }

    /** 预分配 initialSize 个实例 */
    private preallocate(count: number): void {
        const limit = Math.min(count, this.options.maxSize)
        for (let i = 0; i < limit; i++) {
            this.pools.push(this.create())
        }
    }

    /** 清空池（逐个执行 release 回调后丢弃） */
    clear(): void {
        while (this.pools.length > 0) {
            const obj = this.pools.pop()
            if (obj !== undefined) this.options.release?.(obj)
        }
    }

    /** 遍历池中所有空闲对象 */
    forEach(callback: (t: T) => void): void {
        for (let i = 0; i < this.pools.length; i++) {
            callback(this.pools[i])
        }
    }
}
