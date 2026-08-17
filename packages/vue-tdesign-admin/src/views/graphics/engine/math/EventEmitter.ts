/**
 * 事件发射器
 *
 * 提供类型安全的事件订阅/发布能力，事件语义对齐 DOM 习惯：
 * - on / once / off / emit / removeAll
 * - off 支持按回调、按上下文精确移除
 */
export type EventHandler<T = unknown> = (payload: T) => void

interface ListenerRecord<T = unknown> {
    handler: EventHandler<T>
    context: unknown
    once: boolean
    original?: EventHandler<T>
}

export class EventEmitter {
    private _listeners = new Map<string, ListenerRecord[]>()

    /**
     * 订阅事件
     * @param event 事件名
     * @param handler 回调
     * @param context 回调 this 上下文
     */
    on<T = unknown>(event: string, handler: EventHandler<T>, context?: unknown): this {
        const records = (this._listeners.get(event) ?? []) as ListenerRecord<T>[]
        records.push({ handler, context, once: false })
        this._listeners.set(event, records as ListenerRecord[])
        return this
    }

    /**
     * 订阅一次性事件，触发后自动移除
     */
    once<T = unknown>(event: string, handler: EventHandler<T>, context?: unknown): this {
        const records = (this._listeners.get(event) ?? []) as ListenerRecord<T>[]
        records.push({ handler, context, once: true, original: handler })
        this._listeners.set(event, records as ListenerRecord[])
        return this
    }

    /**
     * 取消订阅。
     * - 仅传 event：移除该事件全部监听
     * - 传 handler：仅移除该回调
     * - 传 context：仅移除该上下文下的回调（context 与 handler 任一匹配即移除，规则同 DOM）
     */
    off(event: string, handler?: EventHandler, context?: unknown): this {
        const records = this._listeners.get(event)
        if (!records) return this

        if (!handler && context === undefined) {
            this._listeners.delete(event)
            return this
        }

        const filtered = records.filter((record) => {
            // 移除所有该回调对应的记录（含 once 包装后的 original）
            if (handler && (record.handler === handler || record.original === handler)) return false
            if (context !== undefined && record.context === context) return false
            return true
        })

        if (filtered.length === 0) this._listeners.delete(event)
        else this._listeners.set(event, filtered)
        return this
    }

    /**
     * 触发事件
     * @param event 事件名
     * @param payload 传给回调的数据
     */
    emit<T = unknown>(event: string, payload?: T): this {
        const records = this._listeners.get(event)
        if (!records || records.length === 0) return this

        // 拷贝一份，允许回调内修改监听列表
        const snapshot = records.slice()
        for (const record of snapshot) {
            if (record.once) this.off(event, record.original ?? record.handler)
            record.handler.call(record.context, payload as T)
        }
        return this
    }

    /**
     * 移除全部事件的全部监听
     */
    removeAll(): this {
        this._listeners.clear()
        return this
    }

    /**
     * 是否存在指定事件的监听
     */
    hasListeners(event: string): boolean {
        return (this._listeners.get(event)?.length ?? 0) > 0
    }

    /** 当前监听的事件名列表 */
    get eventNames(): string[] {
        return Array.from(this._listeners.keys())
    }

    /** 指定事件的监听数量 */
    listenerCount(event: string): number {
        return this._listeners.get(event)?.length ?? 0
    }
}
