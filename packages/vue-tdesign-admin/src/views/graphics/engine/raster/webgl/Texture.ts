/**
 * CPU 光栅化系统 —— 纹理。
 * RGBA8 数据存储 + 最近邻/双线性采样，支持 clamp / repeat 包装模式。
 */
import { Vec4 } from './math'
import type { Vec2 } from './math'

export type TextureFilter = 'nearest' | 'linear'
export type TextureWrap = 'clamp' | 'repeat'

/** CPU 纹理（模拟 WebGL 的 2D 纹理） */
export class CPUTexture {
    readonly width: number
    readonly height: number
    /** RGBA 像素数据（0-255） */
    readonly data: Uint8ClampedArray

    filter: TextureFilter = 'linear'
    wrapS: TextureWrap = 'clamp'
    wrapT: TextureWrap = 'clamp'

    constructor(width: number, height: number, data?: ArrayLike<number> | null) {
        if (width <= 0 || height <= 0) throw new Error('Texture size must be positive')
        this.width = Math.floor(width)
        this.height = Math.floor(height)
        this.data = new Uint8ClampedArray(this.width * this.height * 4)
        if (data) {
            const src = data instanceof Uint8ClampedArray ? data : Uint8ClampedArray.from(data)
            this.data.set(src.subarray(0, Math.min(src.length, this.data.length)))
        }
    }

    /** 从 ImageData / ImageBitmap 风格源创建（需要 RGBA Uint8ClampedArray） */
    static fromImageData(width: number, height: number, rgba: Uint8ClampedArray): CPUTexture {
        return new CPUTexture(width, height, rgba)
    }

    /** 创建单色纹理 */
    static solid(width: number, height: number, r: number, g: number, b: number, a = 255): CPUTexture {
        const tex = new CPUTexture(width, height)
        for (let i = 0; i < tex.data.length; i += 4) {
            tex.data[i] = r
            tex.data[i + 1] = g
            tex.data[i + 2] = b
            tex.data[i + 3] = a
        }
        return tex
    }

    /** 创建棋盘格纹理（调试纹理坐标用） */
    static checkerboard(width: number, height: number, cell = 8, c1 = [255, 255, 255, 255], c2 = [0, 0, 0, 255]): CPUTexture {
        const tex = new CPUTexture(width, height)
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const color = Math.floor(x / cell) % 2 === Math.floor(y / cell) % 2 ? c1 : c2
                const i = (y * width + x) * 4
                tex.data[i] = color[0]
                tex.data[i + 1] = color[1]
                tex.data[i + 2] = color[2]
                tex.data[i + 3] = color[3]
            }
        }
        return tex
    }

    /** 读取像素（RGBA，各通道 0-255），越界返回 [0,0,0,0] */
    getPixel(x: number, y: number): [number, number, number, number] {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return [0, 0, 0, 0]
        const i = (y * this.width + x) * 4
        return [this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]]
    }

    /** 写入像素（RGBA，各通道 0-255） */
    setPixel(x: number, y: number, r: number, g: number, b: number, a: number): void {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return
        const i = (y * this.width + x) * 4
        this.data[i] = r
        this.data[i + 1] = g
        this.data[i + 2] = b
        this.data[i + 3] = a
    }

    /**
     * 采样纹理：uv 为 [0,1] 纹理坐标，返回 RGBA（各通道 [0,1]）。
     * 支持 nearest / linear 过滤，clamp / repeat 包装。
     */
    sample(uv: Vec2): Vec4 {
        const { width, height } = this

        const wrap = (coord: number, mode: TextureWrap, size: number): number => {
            if (mode === 'repeat') {
                const v = coord - Math.floor(coord)
                return v < 0 ? v + 1 : v
            }
            return Math.min(1, Math.max(0, coord))
        }
        const u = wrap(uv.x, this.wrapS, width) * (width - 1)
        const v = wrap(uv.y, this.wrapT, height) * (height - 1)

        if (this.filter === 'nearest') {
            const [r, g, b, a] = this.getPixel(Math.round(u), Math.round(v))
            return new Vec4(r / 255, g / 255, b / 255, a / 255)
        }

        // 双线性
        const x0 = Math.floor(u)
        const y0 = Math.floor(v)
        const x1 = Math.min(x0 + 1, width - 1)
        const y1 = Math.min(y0 + 1, height - 1)
        const fx = u - x0
        const fy = v - y0

        const c00 = this.getPixel(x0, y0)
        const c10 = this.getPixel(x1, y0)
        const c01 = this.getPixel(x0, y1)
        const c11 = this.getPixel(x1, y1)

        const out = [0, 0, 0, 0]
        for (let i = 0; i < 4; i++) {
            const top = c00[i] * (1 - fx) + c10[i] * fx
            const bottom = c01[i] * (1 - fx) + c11[i] * fx
            out[i] = (top * (1 - fy) + bottom * fy) / 255
        }
        return new Vec4(out[0], out[1], out[2], out[3])
    }
}
