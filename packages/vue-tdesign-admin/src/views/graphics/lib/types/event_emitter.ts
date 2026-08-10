export type EventEmitterHandleArgs<T> = T extends any[] ? T : T[]

export type  EventEmitterHandle<T extends any = any> = (...args: EventEmitterHandleArgs<T>) => void

export interface EventEmitter<T extends Record<string, any>> {
    on<K extends Extract<keyof T, string>>(key: K, handler: EventEmitterHandle<T[K]>):void
    off<K extends Extract<keyof T, string>>(key: K, handler?: EventEmitterHandle<T[K]>):void
    emit<K extends Extract<keyof T, string>>(key: K, ...args: EventEmitterHandleArgs<T[K]>):void
    getListeners<K extends Extract<keyof T, string>>(key: K):EventEmitterHandle<T[K]>[]
    removeAllListeners():void
}