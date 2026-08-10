import type { EventEmitter as IEventEmitter, EventEmitterHandleArgs, EventEmitterHandle } from "../types/event_emitter"
export class EventEmitter<T extends Record<string, any>> implements IEventEmitter<T> {
    listeners: Map<string, Set<EventEmitterHandle>> = new Map()
    constructor() {

    }
    on<K extends Extract<keyof T, string>>(key: K, handler: EventEmitterHandle<T[K]>) {
        let handles = this.listeners.get(key)
        if (!handles) {
            handles = new Set()
        }
        handles.add(handler)
        this.listeners.set(key, handles)
    }
    off<K extends Extract<keyof T, string>>(key: K, handler?: EventEmitterHandle<T[K]>) {
        let handles = this.listeners.get(key)
        if (handles) {
            handles.delete(handler)
        } else {
            this.listeners.delete(key)
        }
    }
    emit<K extends Extract<keyof T, string>>(key: K, ...args: EventEmitterHandleArgs<T[K]>) {
        let handles = this.listeners.get(key)
        if (handles) {
            handles.forEach(handler => {
               (handler as EventEmitterHandle<T[K]>)(...args)
            })
        }
    }
    getListeners<K extends Extract<keyof T, string>>(key: K) {
        return Array.from(this.listeners.get(key) ||[])
    }
    removeAllListeners() {
        this.listeners.clear()
    }
}
