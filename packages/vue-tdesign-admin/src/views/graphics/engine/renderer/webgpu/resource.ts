/**
 * WebGPU 资源统一接口
 * 所有持有原生 GPU* 句柄的封装类均实现该接口，
 * 由 Device 统一登记（resources），在 dispose 时集中回收。
 */
export interface IResource {
    isDisposed: boolean;
    dispose(): void;
}

/**
 * 可被 Device 按结构去重缓存的资源
 * - cacheKey 由 Device 命中/创建缓存时写入
 * - 资源 dispose 时据此把自己从 Device.cache 中移除，避免后续拿到已销毁对象
 */
export interface ICacheableResource extends IResource {
    cacheKey?: string;
}
