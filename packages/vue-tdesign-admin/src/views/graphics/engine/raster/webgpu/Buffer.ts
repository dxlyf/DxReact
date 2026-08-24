/**
 * WebGPU CPU 模拟 —— GPUBuffer。
 * 模拟 GPU 显存缓冲：CPU 侧是一块 ArrayBuffer，通过 queue.writeBuffer 上传。
 */
export const BufferUsage = {
    MAP_READ: 0x0001,
    MAP_WRITE: 0x0002,
    COPY_SRC: 0x0004,
    COPY_DST: 0x0008,
    INDEX: 0x0010,
    VERTEX: 0x0020,
    UNIFORM: 0x0040,
    STORAGE: 0x0080,
    INDIRECT: 0x0100,
    QUERY_RESOLVE: 0x0200,
} as const

export interface GPUBufferDescriptor {
    size: number
    usage: number
    /** 创建时映射，创建后可立即 getMappedRange（真实 API 行为） */
    mappedAtCreation?: boolean
}

/** 模拟 GPUBuffer */
export class GPUBuffer {
    readonly size: number
    readonly usage: number
    /** CPU 侧数据视图（模拟 VRAM） */
    data: ArrayBuffer
    /** 当前是否处于映射状态 */
    private mapped = false

    constructor(desc: GPUBufferDescriptor) {
        this.size = desc.size
        this.usage = desc.usage
        this.data = new ArrayBuffer(desc.size)
        this.mapped = !!desc.mappedAtCreation
    }

    /** 向缓冲写入数据（真实 API 用 queue.writeBuffer；这里等价实现） */
    writeData(src: ArrayLike<number> | ArrayBufferView | ArrayBuffer, dstByteOffset = 0): void {
        const dst = new Uint8Array(this.data)
        if (src instanceof ArrayBuffer) {
            dst.set(new Uint8Array(src), dstByteOffset)
        } else if (ArrayBuffer.isView(src)) {
            dst.set(new Uint8Array(src.buffer, src.byteOffset, src.byteLength), dstByteOffset)
        } else {
            const arr = Array.from(src)
            const tmp = new Uint8Array(arr.length * 4)
            for (let i = 0; i < arr.length; i++) new DataView(tmp.buffer).setFloat32(i * 4, arr[i], true)
            dst.set(tmp, dstByteOffset)
        }
    }

    /** 读取整个缓冲为 Float32 数组（调试/校验用） */
    readFloats(): Float32Array {
        return new Float32Array(this.data)
    }

    /** 读取单个 Uint16/Uint32（索引读取用） */
    readIndex(index: number, format: 'uint16' | 'uint32'): number {
        const view = new DataView(this.data)
        return format === 'uint16' ? view.getUint16(index * 2, true) : view.getUint32(index * 4, true)
    }

    get mappedAtCreation(): boolean {
        return this.mapped
    }
}
