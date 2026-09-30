import type { Context } from "./context"
import type { IResource } from "./resource"
import type { BufferDataUsage } from "./types"
import { VertexBuffer } from "./buffer"

/** 顶点属性分量类型（WebGL2 支持的全部类型） */
export type AttributeType = 'BYTE'
    | 'UNSIGNED_BYTE'
    | 'SHORT'
    | 'UNSIGNED_SHORT'
    | 'INT'
    | 'UNSIGNED_INT'
    | 'HALF_FLOAT'
    | 'FLOAT'

/** 单个属性的分量个数 */
export type AttributeSize = 1 | 2 | 3 | 4

/** 分量类型对应的字节数，用于自动推导 stride / offset */
const ATTRIBUTE_TYPE_BYTE_SIZE: Record<AttributeType, number> = {
    BYTE: 1,
    UNSIGNED_BYTE: 1,
    SHORT: 2,
    UNSIGNED_SHORT: 2,
    INT: 4,
    UNSIGNED_INT: 4,
    HALF_FLOAT: 2,
    FLOAT: 4,
}

/** 单条顶点属性声明，只需写关心的字段，其余走默认值 */
export type AttributeDescriptor = {
    /** 着色器中的属性名，便于与 program.getAttributeLocation(name) 对应 */
    name: string
    /** 分量个数 */
    size: AttributeSize
    /** 分量类型，缺省继承 AttributeBufferOptions.type */
    type?: AttributeType
    /** 是否把整型分量归一化成浮点写入（仅 BYTE/UNSIGNED_BYTE/SHORT/UNSIGNED_SHORT 有意义） */
    normalized?: boolean
    /** 强制按整型属性上传，缺省在 type 为 INT / UNSIGNED_INT 时自动开启 */
    integer?: boolean
    /** 字节偏移，缺省按前序属性紧凑排列自动计算 */
    offset?: number
    /** 字节跨度，缺省取 AttributeBufferOptions.stride */
    stride?: number
    /** 属性槽位，缺省按声明顺序依次取 0、1、2…… */
    location?: number
    /** 实例化渲染的分频（每推进多少个实例前进一次），缺省 0 */
    divisor?: number
}

export type AttributeBufferOptions = {
    /** 顶点属性声明列表 */
    attributes: AttributeDescriptor[]
    /** 交错数据的默认分量类型，缺省 FLOAT */
    type?: AttributeType
    /** 交错数据的字节跨度，缺省按所有属性紧凑排列自动计算 */
    stride?: number
    /** 复用的顶点缓冲，缺省内部新建（内部新建的随本对象一起销毁） */
    buffer?: VertexBuffer
}

/** 解析完成的属性布局，所有字段都已确定取值 */
export type ResolvedAttribute = {
    name: string
    location: number
    size: AttributeSize
    type: AttributeType
    normalized: boolean
    /** true 时走 vertexAttribIPointer，对应着色器里的 int / ivec / uint / uvec */
    integer: boolean
    stride: number
    offset: number
    divisor: number
}

/**
 * 顶点属性缓冲：把「一段交错顶点数据 + 一组属性声明」封装成一个可绑定对象
 * - 交错数据的 stride / offset 可自动推导，不必手算
 * - 支持非浮点分量、整型属性、归一化写入、实例化分频
 * - 底层 VertexBuffer 处理上下文丢失/恢复，bind() 时重设指针，恢复后照常可用
 */
export class AttributeBuffer implements IResource {
    static uid = 0

    isDisposed = false
    readonly uid: number
    ctx: Context
    /** 承载顶点数据的缓冲 */
    buffer: VertexBuffer
    /** 交错数据的字节跨度 */
    stride = 0
    /** 已解析的属性布局 */
    attributes: ResolvedAttribute[] = []
    /** 缓冲是否由本对象创建，外部传入的 buffer 不随本对象销毁 */
    protected ownsBuffer: boolean

    constructor(ctx: Context, options: AttributeBufferOptions) {
        this.ctx = ctx
        this.uid = AttributeBuffer.uid++
        this.ownsBuffer = options.buffer === undefined
        this.buffer = options.buffer ?? new VertexBuffer(ctx)
        this.resolveLayout(options)
        this.ctx.addDisposable(this)
    }

    protected get gl() {
        return this.ctx.gl
    }

    /**
     * 推导属性布局：
     * - 未指定 offset 的属性按紧凑排列依次摆放，并保证偏移落在自身分量字节数的整数倍上
     *   （否则 vertexAttribPointer 会直接报 INVALID_OPERATION）
     * - 未指定 stride 时取紧凑排列的总长度
     */
    protected resolveLayout(options: AttributeBufferOptions) {
        const defaultType = options.type ?? 'FLOAT'
        const descriptors = options.attributes
        const offsets: number[] = []
        let compactOffset = 0
        for (let i = 0; i < descriptors.length; i++) {
            const descriptor = descriptors[i]
            const byteSize = ATTRIBUTE_TYPE_BYTE_SIZE[descriptor.type ?? defaultType]
            const offset = descriptor.offset ?? Math.ceil(compactOffset / byteSize) * byteSize
            offsets[i] = offset
            compactOffset = offset + byteSize * descriptor.size
        }
        this.stride = options.stride ?? compactOffset
        this.attributes = descriptors.map((descriptor, i) => {
            const type = descriptor.type ?? defaultType
            return {
                name: descriptor.name,
                location: descriptor.location ?? i,
                size: descriptor.size,
                type: type,
                normalized: descriptor.normalized ?? false,
                // int / uint 属性无法归一化，只能走 vertexAttribIPointer
                integer: descriptor.integer ?? (type === 'INT' || type === 'UNSIGNED_INT'),
                stride: descriptor.stride ?? this.stride,
                offset: offsets[i],
                divisor: descriptor.divisor ?? 0,
            }
        })
    }

    /** 上传交错顶点数据，可绘制的顶点数见 count */
    setData(data: ArrayBufferView, usage: BufferDataUsage = 'STATIC_DRAW') {
        this.buffer.setData(data, usage)
    }

    /** 当前数据可绘制的顶点数（按 stride 推算） */
    get count() {
        if (this.stride <= 0) {
            return 0
        }
        return Math.floor(this.buffer.getSize() / this.stride)
    }

    /** 绑定缓冲，并把每条属性的指针（含实例化分频）重新设置到当前上下文 */
    bind() {
        const gl = this.gl
        this.buffer.bind()
        for (let i = 0; i < this.attributes.length; i++) {
            const attr = this.attributes[i]
            this.ctx.enableVertexAttribArray(attr.location)
            if (attr.integer) {
                gl.vertexAttribIPointer(attr.location, attr.size, gl[attr.type], attr.stride, attr.offset)
            }
            else {
                gl.vertexAttribPointer(attr.location, attr.size, gl[attr.type], attr.normalized, attr.stride, attr.offset)
            }
            if (attr.divisor !== 0) {
                gl.vertexAttribDivisor(attr.location, attr.divisor)
            }
        }
    }

    dispose(): void {
        if (this.isDisposed) {
            return
        }
        this.isDisposed = true
        if (this.ownsBuffer) {
            this.buffer.dispose()
        }
        this.attributes.length = 0
        this.ctx.resources.delete(this)
    }
}
