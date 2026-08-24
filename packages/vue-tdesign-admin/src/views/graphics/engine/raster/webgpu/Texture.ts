/**
 * WebGPU CPU 模拟 —— GPUTexture / GPUTextureView / GPUSampler。
 *
 * 纹理坐标约定（WebGPU）：原点在左上角，(0,0) 对应左上像素，y 向下。
 * 采样由 GPUSampler 执行，支持 min/mag 过滤与地址模式。
 */
import { Vec2, Vec4 } from './math'

export type GPUTextureFormat = 'rgba8unorm' | 'rgba8snorm' | 'depth32float' | 'depth24plus' | 'depth24plus-stencil8'

export interface GPUTextureDescriptor {
    size: [number, number] | { width: number; height: number; depthOrArrayLayers?: number }
    format: GPUTextureFormat
    usage: number
}

/** 模拟 GPUTexture（本实现默认 1 层、1 mip） */
export class GPUTexture {
    readonly width: number
    readonly height: number
    readonly format: GPUTextureFormat
    readonly usage: number
    /** 颜色数据（rgba8unorm，0-255） */
    colorData: Uint8ClampedArray | null = null
    /** 深度数据（depth32float，[0,1]） */
    depthData: Float32Array | null = null
    /** 模板数据（0-255） */
    stencilData: Uint8Array | null = null

    constructor(desc: GPUTextureDescriptor) {
        const size = Array.isArray(desc.size) ? { width: desc.size[0], height: desc.size[1] } : desc.size
        this.width = Math.floor(size.width)
        this.height = Math.floor(size.height)
        this.format = desc.format
        this.usage = desc.usage
        if (this.format === 'rgba8unorm' || this.format === 'rgba8snorm') {
            this.colorData = new Uint8ClampedArray(this.width * this.height * 4)
        } else {
            this.depthData = new Float32Array(this.width * this.height)
            if (this.format === 'depth24plus-stencil8') {
                this.stencilData = new Uint8Array(this.width * this.height)
            }
        }
    }

    /** 创建纹理视图（本实现视图即纹理本身） */
    createView(): GPUTextureView {
        return this
    }

    /** 写入颜色像素（RGBA 0-255） */
    writeColor(x: number, y: number, r: number, g: number, b: number, a: number): void {
        if (!this.colorData || x < 0 || x >= this.width || y < 0 || y >= this.height) return
        const i = (y * this.width + x) * 4
        this.colorData[i] = r
        this.colorData[i + 1] = g
        this.colorData[i + 2] = b
        this.colorData[i + 3] = a
    }

    /** 读取颜色像素（RGBA 0-255），越界返回 [0,0,0,0] */
    readColor(x: number, y: number): [number, number, number, number] {
        if (!this.colorData || x < 0 || x >= this.width || y < 0 || y >= this.height) return [0, 0, 0, 0]
        const i = (y * this.width + x) * 4
        return [this.colorData[i], this.colorData[i + 1], this.colorData[i + 2], this.colorData[i + 3]]
    }

    /** 读取深度（[0,1]），越界返回 1 */
    readDepth(x: number, y: number): number {
        if (!this.depthData || x < 0 || x >= this.width || y < 0 || y >= this.height) return 1
        return this.depthData[y * this.width + x]
    }

    /** 写入深度 */
    writeDepth(x: number, y: number, value: number): void {
        if (!this.depthData || x < 0 || x >= this.width || y < 0 || y >= this.height) return
        this.depthData[y * this.width + x] = value
    }

    /** 读取模板（0-255） */
    readStencil(x: number, y: number): number {
        if (!this.stencilData || x < 0 || x >= this.width || y < 0 || y >= this.height) return 0
        return this.stencilData[y * this.width + x]
    }

    /** 写入模板 */
    writeStencil(x: number, y: number, value: number): void {
        if (!this.stencilData || x < 0 || x >= this.width || y < 0 || y >= this.height) return
        this.stencilData[y * this.width + x] = value & 0xff
    }

    /** 导出为 ImageData（rgba8unorm 颜色纹理） */
    toImageData(): ImageData {
        if (!this.colorData) throw new Error('Texture has no color data')
        return new ImageData(this.colorData.slice(), this.width, this.height)
    }
}

/** GPUTextureView：本实现直接指向纹理 */
export type GPUTextureView = GPUTexture

// ==================== 采样器 ====================

export type GPUFilterMode = 'nearest' | 'linear'
export type GPUAddressMode = 'clamp-to-edge' | 'repeat' | 'mirror-repeat'

export interface GPUSamplerDescriptor {
    magFilter?: GPUFilterMode
    minFilter?: GPUFilterMode
    addressModeU?: GPUAddressMode
    addressModeV?: GPUAddressMode
}

/** 模拟 GPUSampler：负责纹理采样 */
export class GPUSampler {
    readonly magFilter: GPUFilterMode
    readonly minFilter: GPUFilterMode
    readonly addressModeU: GPUAddressMode
    readonly addressModeV: GPUAddressMode

    constructor(desc: GPUSamplerDescriptor = {}) {
        this.magFilter = desc.magFilter ?? 'nearest'
        this.minFilter = desc.minFilter ?? 'nearest'
        this.addressModeU = desc.addressModeU ?? 'clamp-to-edge'
        this.addressModeV = desc.addressModeV ?? 'clamp-to-edge'
    }

    /** 包装纹理坐标（按地址模式） */
    private wrap(coord: number, mode: GPUAddressMode): number {
        switch (mode) {
            case 'repeat':
                return coord - Math.floor(coord)
            case 'mirror-repeat': {
                const t = coord - Math.floor(coord)
                return Math.floor(coord) % 2 === 0 ? t : 1 - t
            }
            default:
                return Math.min(1, Math.max(0, coord))
        }
    }

    /** 采样颜色纹理：uv∈[0,1]（原点左上），返回 RGBA 各通道 [0,1] */
    sample(texture: GPUTexture, uv: Vec2): Vec4 {
        if (!texture.colorData) return new Vec4(0, 0, 0, 1)
        const u = this.wrap(uv.x, this.addressModeU) * (texture.width - 1)
        const v = this.wrap(uv.y, this.addressModeV) * (texture.height - 1)

        if (this.magFilter === 'nearest' && this.minFilter === 'nearest') {
            const [r, g, b, a] = texture.readColor(Math.round(u), Math.round(v))
            return new Vec4(r / 255, g / 255, b / 255, a / 255)
        }

        // 双线性
        const x0 = Math.floor(u)
        const y0 = Math.floor(v)
        const x1 = Math.min(x0 + 1, texture.width - 1)
        const y1 = Math.min(y0 + 1, texture.height - 1)
        const fx = u - x0
        const fy = v - y0
        const c00 = texture.readColor(x0, y0)
        const c10 = texture.readColor(x1, y0)
        const c01 = texture.readColor(x0, y1)
        const c11 = texture.readColor(x1, y1)
        const out = new Vec4()
        for (let i = 0; i < 4; i++) {
            const top = c00[i] * (1 - fx) + c10[i] * fx
            const bottom = c01[i] * (1 - fx) + c11[i] * fx
            const v = (top * (1 - fy) + bottom * fy) / 255
            if (i === 0) out.x = v
            else if (i === 1) out.y = v
            else if (i === 2) out.z = v
            else out.w = v
        }
        return out
    }
}
