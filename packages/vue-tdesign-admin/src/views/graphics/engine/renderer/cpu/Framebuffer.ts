/**
 * CPU 光栅化系统 —— 帧缓冲。
 * 颜色缓冲（RGBA8）+ 深度缓冲（Float32，[0,1]），模拟 WebGL 默认帧缓冲。
 */
import type { RasterImage } from './types'

/** CPU 帧缓冲：可作为绘制目标，也可读取像素导出图片 */
export class CPUFramebuffer implements RasterImage {
    private _width: number
    private _height: number
    /** RGBA 颜色缓冲（0-255） */
    private _color: Uint8ClampedArray
    /** 深度缓冲（[0,1]，越大越远） */
    private _depth: Float32Array

    constructor(width: number, height: number) {
        if (width <= 0 || height <= 0) throw new Error('Framebuffer size must be positive')
        this._width = Math.floor(width)
        this._height = Math.floor(height)
        this._color = new Uint8ClampedArray(this._width * this._height * 4)
        this._depth = new Float32Array(this._width * this._height)
    }

    get width(): number {
        return this._width
    }
    get height(): number {
        return this._height
    }
    get data(): Uint8ClampedArray {
        return this._color
    }
    get colorBuffer(): Uint8ClampedArray {
        return this._color
    }
    get depthBuffer(): Float32Array {
        return this._depth
    }

    /** 重置缓冲尺寸（数据清空） */
    resize(width: number, height: number): void {
        this._width = Math.max(1, Math.floor(width))
        this._height = Math.max(1, Math.floor(height))
        this._color = new Uint8ClampedArray(this._width * this._height * 4)
        this._depth = new Float32Array(this._width * this._height)
    }

    /** 清空颜色缓冲（RGBA，各通道 0-255） */
    clearColor(r: number, g: number, b: number, a = 255): void {
        const { _color } = this
        for (let i = 0; i < _color.length; i += 4) {
            _color[i] = r
            _color[i + 1] = g
            _color[i + 2] = b
            _color[i + 3] = a
        }
    }

    /** 清空深度缓冲（默认 1.0 = 最远） */
    clearDepth(value = 1): void {
        this._depth.fill(value)
    }

    /** 直接写颜色像素（RGBA 0-255） */
    writeColor(x: number, y: number, r: number, g: number, b: number, a: number): void {
        if (x < 0 || x >= this._width || y < 0 || y >= this._height) return
        const i = (y * this._width + x) * 4
        this._color[i] = r
        this._color[i + 1] = g
        this._color[i + 2] = b
        this._color[i + 3] = a
    }

    readColor(x: number, y: number): [number, number, number, number] {
        if (x < 0 || x >= this._width || y < 0 || y >= this._height) return [0, 0, 0, 0]
        const i = (y * this._width + x) * 4
        return [this._color[i], this._color[i + 1], this._color[i + 2], this._color[i + 3]]
    }

    readDepth(x: number, y: number): number {
        if (x < 0 || x >= this._width || y < 0 || y >= this._height) return 1
        return this._depth[y * this._width + x]
    }

    /** 写入深度像素（[0,1]） */
    writeDepth(x: number, y: number, value: number): void {
        if (x < 0 || x >= this._width || y < 0 || y >= this._height) return
        this._depth[y * this._width + x] = value
    }

    /** 转换为 ImageData（可直接 putImageData 到 canvas） */
    toImageData(): ImageData {
        const imageData = new ImageData(this._width, this._height)
        imageData.data.set(this._color)
        return imageData
    }
}
