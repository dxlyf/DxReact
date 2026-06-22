export type EventHandle<D = any> = (data: D) => void
export type EventHandles = Record<string, any>
export class Event<T, D> {
    target: EventTarget = null
    currentTarget: EventTarget = null
    type: T
    data: D
    stopped: boolean = false
    immediateStopped: boolean = false
    constructor(type: T, data: D) {
        this.type = type
        this.data = data
    }
    stopPropagation(): void {
        this.stopped = true
    }
    stopImmediatePropagation(): void {
        this.stopped = true
        this.immediateStopped = true
    }
    composedPath(): EventTarget[] {
        const path = []
        let current = this.target
        while (current) {
            path.push(current)
            current = current.parent
        }
        return path
    }
}
export class EventTarget<T extends EventHandles = any> {
    declare parent: EventTarget<T> | null
    private listeners: Map<keyof T, EventHandle[]> = new Map()
    on<K extends keyof T>(type: K, handle: EventHandle<Event<K, T[K]>>): void {
        const listeners = this.listeners.get(type) || []
        listeners.push(handle)
        this.listeners.set(type, listeners)
    }
    once<K extends keyof T>(type: K, handle: EventHandle<Event<K, T[K]>>): void {
        const onceHandle = (e: Event<K, T[K]>) => {
            this.off(type, onceHandle)
            handle(e)
        }
        this.on(type, onceHandle)
    }
    dispatchEvent<K extends keyof T>(event: Event<K, T[K]>): void {
        const listeners = this.listeners.get(event.type)
        event.currentTarget = this
        if (listeners) {
            for (const handle of listeners) {
                handle(event)
                if (event.immediateStopped) {
                    break
                }
            }
        }
        if (!event.stopPropagation && this.parent) {
            this.parent.dispatchEvent(event)
        }
    }
    emit<K extends keyof T>(type: K,data?:T[K]): void {
        const event = new Event(type,data)
        event.target = this
        this.dispatchEvent(event)
    }
    off<K extends keyof T>(type: K, handle?: EventHandle<T[K]>): void {
        const listeners = this.listeners.get(type) || []
        if (!handle) {
            this.listeners.delete(type)
            return
        }
        const newListeners = listeners.filter(listener => listener !== handle)
        this.listeners.set(type, newListeners)
    }
    removeAllListeners(): void {
        this.listeners.clear()
    }
    getListeners<K extends keyof T>(type: K): EventHandle[] {
        return this.listeners.get(type) || []
    }
}