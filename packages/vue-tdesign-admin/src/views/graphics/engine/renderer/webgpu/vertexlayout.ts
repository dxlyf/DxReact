/**
 * 顶点布局自动推导
 * 手写 GPUVertexBufferLayout 时需要逐个属性计算 offset、并保证每个 attribute.offset
 * 落在其 format 字节大小的整数倍上，且 arrayStride 与全部属性紧凑排列一致——易错且繁琐。
 * 这里只声明「shaderLocation + format（+ 可选 offset）」，其余自动推导。
 */

/** 单个顶点属性声明 */
export interface VertexAttributeDesc {
    /** WGSL 中 @location(n) 的编号 */
    shaderLocation: number
    /** 顶点格式，决定该属性的字节大小与对齐 */
    format: GPUVertexFormat
    /** 字节偏移；缺省按前序属性紧凑排列并对齐到自身字节大小 */
    offset?: number
}

/** 单个顶点缓冲布局声明 */
export interface VertexBufferLayoutDesc {
    /** 该缓冲内全部属性的声明 */
    attributes: VertexAttributeDesc[]
    /** 顶点之间的字节跨度；缺省取全部属性紧凑排列的总长度 */
    arrayStride?: number
    /** 步进模式，缺省 vertex（逐顶点） */
    stepMode?: GPUVertexStepMode
}

/** 每种顶点格式的字节大小（WebGPU 规范规定的全部取值） */
const VERTEX_FORMAT_BYTE_SIZE: Record<GPUVertexFormat, number> = {
    'uint8': 1, 'uint8x2': 2, 'uint8x4': 4,
    'sint8': 1, 'sint8x2': 2, 'sint8x4': 4,
    'unorm8': 1, 'unorm8x2': 2, 'unorm8x4': 4,
    'snorm8': 1, 'snorm8x2': 2, 'snorm8x4': 4,
    'uint16': 2, 'uint16x2': 4, 'uint16x4': 8,
    'sint16': 2, 'sint16x2': 4, 'sint16x4': 8,
    'unorm16': 2, 'unorm16x2': 4, 'unorm16x4': 8,
    'snorm16': 2, 'snorm16x2': 4, 'snorm16x4': 8,
    'float16': 2, 'float16x2': 4, 'float16x4': 8,
    'float32': 4, 'float32x2': 8, 'float32x3': 12, 'float32x4': 16,
    'uint32': 4, 'uint32x2': 8, 'uint32x3': 12, 'uint32x4': 16,
    'sint32': 4, 'sint32x2': 8, 'sint32x3': 12, 'sint32x4': 16,
    'unorm10-10-10-2': 4,
    'snorm10-10-10-2': 4,
    'unorm8x4-bgra': 4,
}

/** 查询顶点格式的字节大小 */
export function computeVertexFormatSize(format: GPUVertexFormat): number {
    return VERTEX_FORMAT_BYTE_SIZE[format]
}

/** 向上对齐到 alignment 的整数倍 */
function align(offset: number, alignment: number): number {
    return alignment <= 1 ? offset : Math.ceil(offset / alignment) * alignment
}

/**
 * 把声明式顶点布局推导为 GPURenderPipelineDescriptor.vertex.buffers 所需的数组
 * - 未指定 offset 的属性按紧凑排列摆放，并对齐到自身字节大小
 * - 未指定 arrayStride 时取紧凑排列总长度
 */
export function deriveVertexBufferLayouts(descs: VertexBufferLayoutDesc[]): GPUVertexBufferLayout[] {
    return descs.map((desc) => {
        const attributes: GPUVertexAttribute[] = []
        let compactOffset = 0
        for (const attr of desc.attributes) {
            const size = computeVertexFormatSize(attr.format)
            const offset = attr.offset ?? align(compactOffset, size)
            attributes.push({ shaderLocation: attr.shaderLocation, format: attr.format, offset })
            compactOffset = offset + size
        }
        return {
            arrayStride: desc.arrayStride ?? compactOffset,
            stepMode: desc.stepMode ?? 'vertex',
            attributes,
        }
    })
}
