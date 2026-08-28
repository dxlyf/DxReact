/**
 * Canvas2D CPU 渲染器 —— 类 Canvas 2D API 及其背后逻辑。
 *
 * 与 webgl（可编程状态机）和 webgpu（不可变管线）不同，
 * Canvas 2D 是"立即模式矢量光栅化"：
 *   1. 路径 = 用户坐标下的命令序列（moveTo/lineTo/贝塞尔/圆弧）
 *   2. 渲染时用 2D 仿射矩阵变换到设备坐标，曲线细分为折线
 *   3. 填充 = 扫描线算法（偶数-奇数 / 非零环绕规则判内外）
 *   4. 描边 = 把折线"膨胀"成多边形（线段矩形 + 端帽），再走同一套扫描线填充
 *   5. 像素写入用 source-over alpha 混合
 * 本实现把像素写入复用 webgl 目录的 CPUFramebuffer，教学上可对比：
 * 最终都是往同样的帧缓冲写 RGBA，差别只在"几何如何变成像素"。
 * 颜色样式支持：纯色 / 线性渐变 / 径向渐变（含双圆心）/ 圆锥渐变 / 图案平铺。
 */
import { CPUFramebuffer } from '../webgl/Framebuffer'
import { CPUTexture } from '../webgl/Texture'
import type { RasterImage } from '../webgl/types'
import { Mat2D } from './math'
import { Path2D } from './path'

// ==================== 颜色 ====================

/** RGBA（r/g/b 为 0-255，a 为 0-1） */
export type RGBA = [number, number, number, number]

/** 解析 CSS 颜色字符串 → RGBA。支持 #rgb/#rgba/#rrggbb/#rrggbbaa、rgb()/rgba()、常用命名色 */
export function parseColor(css: string): RGBA {
    let s = css.trim().toLowerCase()
    if (s.startsWith('#')) {
        let hex = s.slice(1)
        if (hex.length === 3 || hex.length === 4) {
            hex = hex.split('').map((c) => c + c).join('')
        }
        if (hex.length === 6 || hex.length === 8) {
            const r = parseInt(hex.slice(0, 2), 16)
            const g = parseInt(hex.slice(2, 4), 16)
            const b = parseInt(hex.slice(4, 6), 16)
            const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
            return [r, g, b, a]
        }
        return [0, 0, 0, 1]
    }
    const fn = s.match(/^rgba?\(([^)]+)\)$/)
    if (fn) {
        const parts = fn[1].split(',').map((p) => p.trim())
        const to255 = (v: string) => (v.endsWith('%') ? Math.round((Number(v.slice(0, -1)) / 100) * 255) : Number(v))
        const a = parts[3] !== undefined ? (parts[3].endsWith('%') ? Number(parts[3].slice(0, -1)) / 100 : Number(parts[3])) : 1
        return [to255(parts[0]), to255(parts[1]), to255(parts[2]), a]
    }
    const named: Record<string, RGBA> = {
        transparent: [0, 0, 0, 0],
        black: [0, 0, 0, 1],
        white: [255, 255, 255, 1],
        red: [255, 0, 0, 1],
        green: [0, 128, 0, 1],
        blue: [0, 0, 255, 1],
        yellow: [255, 255, 0, 1],
        cyan: [0, 255, 255, 1],
        magenta: [255, 0, 255, 1],
        gray: [128, 128, 128, 1],
        grey: [128, 128, 128, 1],
        orange: [255, 165, 0, 1],
        purple: [128, 0, 128, 1],
    }
    return named[s] ?? [0, 0, 0, 1]
}

/** 渐变接口（对应浏览器 CanvasGradient 接口；三个具体类都实现它） */
export interface CanvasGradient {
    addColorStop(offset: number, color: string): void
    colorAt(x: number, y: number): RGBA
}

/** 色标管理基类：共享 addColorStop 与 t → RGBA 插值（不对外导出） */
abstract class GradientBase implements CanvasGradient {
    private stops: { offset: number; color: RGBA }[] = []

    addColorStop(offset: number, color: string): void {
        const o = Math.max(0, Math.min(1, offset))
        const idx = this.stops.findIndex((s) => s.offset > o)
        const stop = { offset: o, color: parseColor(color) }
        if (idx < 0) this.stops.push(stop)
        else this.stops.splice(idx, 0, stop)
    }

    /** 由参数 t∈[0,1] 计算插值颜色 */
    protected colorAtT(t: number): RGBA {
        t = Math.max(0, Math.min(1, t))
        if (this.stops.length === 0) return [0, 0, 0, 1]
        if (this.stops.length === 1) return this.stops[0].color
        if (t <= this.stops[0].offset) return this.stops[0].color
        for (let i = 1; i < this.stops.length; i++) {
            const s2 = this.stops[i]
            if (t <= s2.offset) {
                const s1 = this.stops[i - 1]
                const span = s2.offset - s1.offset
                const f = span > 0 ? (t - s1.offset) / span : 0
                return [
                    s1.color[0] + (s2.color[0] - s1.color[0]) * f,
                    s1.color[1] + (s2.color[1] - s1.color[1]) * f,
                    s1.color[2] + (s2.color[2] - s1.color[2]) * f,
                    s1.color[3] + (s2.color[3] - s1.color[3]) * f,
                ]
            }
        }
        return this.stops[this.stops.length - 1].color
    }

    abstract colorAt(x: number, y: number): RGBA
}

/** 线性渐变（createLinearGradient(x0,y0,x1,y1)）：t = 点沿渐变轴的投影 */
export class CanvasLinearGradient extends GradientBase {
    constructor(
        readonly x0: number,
        readonly y0: number,
        readonly x1: number,
        readonly y1: number,
    ) {
        super()
    }

    colorAt(x: number, y: number): RGBA {
        const dx = this.x1 - this.x0, dy = this.y1 - this.y0
        const len2 = dx * dx + dy * dy
        const t = len2 > 0 ? ((x - this.x0) * dx + (y - this.y0) * dy) / len2 : 0
        return this.colorAtT(t)
    }
}

/**
 * 径向渐变（createRadialGradient(x0,y0,r0,x1,y1,r1)）。
 * 支持内/外圆圆心不同：对每个点 p，求最小的 t≥0 使 p 落在
 * 圆心 c(t) = c0 + t·(c1-c0)、半径 r(t) = r0 + t·(r1-r0) 的圆上，
 * 即解二次方程 |p - c(t)|² = r(t)²。同圆心时退化为 (d - r0)/(r1 - r0)。
 */
export class CanvasRadialGradient extends GradientBase {
    constructor(
        readonly x0: number,
        readonly y0: number,
        readonly r0: number,
        readonly x1: number,
        readonly y1: number,
        readonly r1: number,
    ) {
        super()
    }

    colorAt(x: number, y: number): RGBA {
        const px = x - this.x0, py = y - this.y0 // 点相对内圆圆心
        const cx = this.x1 - this.x0, cy = this.y1 - this.y0 // 圆心位移
        const dr = this.r1 - this.r0 // 半径增量
        // |(px,py) - t·(cx,cy)|² = (r0 + t·dr)²  →  a·t² + b·t + c = 0
        const a = cx * cx + cy * cy - dr * dr
        const b = -2 * (px * cx + py * cy + this.r0 * dr)
        const c = px * px + py * py - this.r0 * this.r0
        let t: number
        if (Math.abs(a) < 1e-12) {
            // 退化：圆心位移与半径增量成比例（线性情形）
            t = Math.abs(b) > 1e-12 ? -c / b : 0
        } else {
            const disc = b * b - 4 * a * c
            if (disc < 0) {
                // 无实根：点在圆锥之外（超出外圆），取 t=2 → clamp 到 1
                t = 2
            } else {
                const s = Math.sqrt(disc)
                const t1 = (-b - s) / (2 * a)
                const t2 = (-b + s) / (2 * a)
                // 取最小非负实根：点从内圆向外碰到第一条等比例圆
                if(t1>=0&&t1<=1&&t2>=0&&t2<=1){
                    t= Math.max(t1,t2)
                }else if(t1>=0&&t1<=1){
                    t=t1
                }else if(t2>=0&&t2<=1){
                    t=t2
                }else{
                    t=Math.max(t1,t2)
                }
            }
        }
        return this.colorAtT(t)
    }
}

/** 圆锥渐变（createConicGradient(startAngle,x,y)）：绕 (x,y) 从 startAngle 顺时针扫 2π */
export class CanvasConicGradient extends GradientBase {
    constructor(
        readonly startAngle: number,
        readonly x: number,
        readonly y: number,
    ) {
        super()
    }

    colorAt(x: number, y: number): RGBA {
        const a = Math.atan2(y - this.y, x - this.x)
        // y 向下 → atan2 顺时针为正；从 startAngle 起归一化到 [0,1)
        let t = (a - this.startAngle) / (Math.PI * 2)
        t -= Math.floor(t)
        return this.colorAtT(t)
    }
}

/**
 * 图案填充（模拟 canvas 的 createPattern）。以源图像平铺填充区域：
 * - repeat / repeat-x / repeat-y / no-repeat 控制两个轴向的平铺/裁剪
 * - 图案锚定在"用户坐标空间"：设备像素经当前变换的逆矩阵反算到用户坐标后取模采样，
 *   因此图案会跟随图形的 translate/rotate 一起变换（对齐 canvas 的默认行为）
 */
export class CanvasPattern {
    constructor(
        readonly image: ImageSource,
        readonly repetition: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat' = 'repeat',
    ) {}

    /** 在用户坐标 (ux,uy) 处采样图案颜色（nearest） */
    colorAt(ux: number, uy: number): RGBA {
        const w = this.image.width
        const h = this.image.height
        let u = ux, v = uy
        if (this.repetition === 'repeat' || this.repetition === 'repeat-x') {
            u = ((ux % w) + w) % w
        } else if (u < 0 || u >= w) {
            return [0, 0, 0, 0]
        }
        if (this.repetition === 'repeat' || this.repetition === 'repeat-y') {
            v = ((uy % h) + h) % h
        } else if (v < 0 || v >= h) {
            return [0, 0, 0, 0]
        }
        const i = (Math.floor(v) * w + Math.floor(u)) * 4
        const d = this.image.data
        return [d[i], d[i + 1], d[i + 2], d[i + 3]]
    }
}

/** 绘制样式：纯色字符串、渐变或图案 */
export type FillStyle = string | CanvasGradient | CanvasPattern

// ==================== 图像源 ====================

/** drawImage 可用的源：任何带 width/height/RGBA data 的对象（CPUTexture / CPUFramebuffer / ImageData / RasterImage） */
export interface ImageSource {
    readonly width: number
    readonly height: number
    readonly data: Uint8ClampedArray
}

// ==================== 渲染器 ====================

/** save/restore 压栈的状态快照 */
interface CanvasState {
    transform: Mat2D
    globalAlpha: number
    lineWidth: number
    lineCap: 'butt' | 'round' | 'square'
    lineJoin: 'miter' | 'round' | 'bevel'
    fillStyle: FillStyle
    strokeStyle: FillStyle
    clipPaths: ClipPath[]
}

/** 裁剪路径（设备坐标多边形；多个子路径按 evenodd 组合判定内外） */
type ClipPath = { points: [number, number][]; closed: boolean }

export class Canvas2DRenderer implements RasterImage {
    readonly width: number
    readonly height: number
    /** 像素写入目标：复用 webgl 的帧缓冲（教学点：Canvas 最终也写同一块 RGBA 缓冲） */
    private _fb: CPUFramebuffer

    // ----- 公开样式属性（对齐真实 canvas 2D API，save/restore 会快照） -----
    globalAlpha = 1
    lineWidth = 1
    lineCap: 'butt' | 'round' | 'square' = 'butt'
    lineJoin: 'miter' | 'round' | 'bevel' = 'miter'
    fillStyle: FillStyle = '#000000'
    strokeStyle: FillStyle = '#000000'

    /** 当前变换矩阵（私有，通过 translate/rotate/... 修改） */
    private _transform: Mat2D = Mat2D.identity()
    private stack: CanvasState[] = []
    private path: Path2D = new Path2D()
    /** 裁剪区：设备坐标多边形集合（clip 叠加，evenodd 判定） */
    private clipPaths: ClipPath[] = []

    constructor(width: number, height: number) {
        this.width = Math.floor(width)
        this.height = Math.floor(height)
        this._fb = new CPUFramebuffer(this.width, this.height)
    }

    get data(): Uint8ClampedArray {
        return this._fb.colorBuffer
    }

    toImageData(): ImageData {
        return this._fb.toImageData()
    }

    // ==================== 状态栈（save/restore + 变换） ====================

    save(): void {
        this.stack.push({
            transform: this._transform.clone(),
            globalAlpha: this.globalAlpha,
            lineWidth: this.lineWidth,
            lineCap: this.lineCap,
            lineJoin: this.lineJoin,
            fillStyle: this.fillStyle,
            strokeStyle: this.strokeStyle,
            clipPaths: this.clipPaths.map((p) => ({ closed: p.closed, points: p.points.map((pt) => [pt[0], pt[1]] as [number, number]) })),
        })
    }

    restore(): void {
        const s = this.stack.pop()
        if (!s) return
        this._transform = s.transform
        this.globalAlpha = s.globalAlpha
        this.lineWidth = s.lineWidth
        this.lineCap = s.lineCap
        this.lineJoin = s.lineJoin
        this.fillStyle = s.fillStyle
        this.strokeStyle = s.strokeStyle
        this.clipPaths = s.clipPaths
    }

    translate(tx: number, ty: number): void {
        this._transform.translate(tx, ty)
    }
    rotate(rad: number): void {
        this._transform.rotate(rad)
    }
    scale(sx: number, sy: number): void {
        this._transform.scale(sx, sy)
    }
    /** a/b/c/d/e/f 与 canvas 的 transform() 参数顺序一致（追加到当前矩阵之后） */
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        this._transform.multiply(new Mat2D(a, b, c, d, e, f))
    }
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        this._transform = new Mat2D(a, b, c, d, e, f)
    }
    resetTransform(): void {
        this._transform = Mat2D.identity()
    }
    getCurrentTransform(){
        return this._transform
    }

    // ==================== 路径 ====================

    get currentPath(): Path2D {
        return this.path
    }

    beginPath(): void {
        this.path.reset()
    }
    moveTo(x: number, y: number): void {
        this.path.moveTo(x, y)
    }
    lineTo(x: number, y: number): void {
        this.path.lineTo(x, y)
    }
    closePath(): void {
        this.path.closePath()
    }
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        this.path.quadraticCurveTo(cpx, cpy, x, y)
    }
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        this.path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
    }
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise = false): void {
        this.path.arc(x, y, radius, startAngle, endAngle, counterclockwise)
    }
    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise = false): void {
        this.path.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise)
    }
    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        this.path.arcTo(x1, y1, x2, y2, radius)
    }
    rect(x: number, y: number, width: number, height: number): void {
        this.path.rect(x, y, width, height)
    }

    // ==================== 渐变 / 图案工厂 ====================

    /** 线性渐变：沿 (x0,y0)→(x1,y1) 方向插值（用户坐标，随变换） */
    createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasLinearGradient {
        return new CanvasLinearGradient(x0, y0, x1, y1)
    }

    /** 径向渐变：内圆 (x0,y0,r0) → 外圆 (x1,y1,r1)（支持双圆心） */
    createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasRadialGradient {
        return new CanvasRadialGradient(x0, y0, r0, x1, y1, r1)
    }

    /** 圆锥渐变：绕圆心 (x,y) 顺时针旋转一圈，从 startAngle（弧度，0 = 正 x 轴）开始 */
    createConicGradient(startAngle: number, x: number, y: number): CanvasConicGradient {
        return new CanvasConicGradient(startAngle, x, y)
    }

    /** 图案填充：源图像按 repetition 平铺 */
    createPattern(image: ImageSource, repetition: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat' = 'repeat'): CanvasPattern {
        return new CanvasPattern(image, repetition)
    }

    /**
     * 把当前路径设为裁剪区（叠加到现有裁剪区）。
     * 之后所有绘制（fill/stroke/drawImage/rect）只影响裁剪区内像素；
     * 与 save/restore 配合可恢复裁剪区（真实 canvas 的 clip 语义）。
     * 判定采用整体 evenodd：所有子路径的射线命中数取奇偶，
     * 因此同一次 clip 内的嵌套子路径能正确挖洞（环形裁剪区）。
     */
    clip(fillRule: 'nonzero' | 'evenodd' = 'nonzero'): void {
        const polys = this.path.toPolygons()
        this.clipPaths.push(...this.toDevicePolys(polys))
        void fillRule
    }

    /** 点 (x,y)（设备坐标）是否在裁剪区内；无裁剪区时恒为 true */
    private inClip(x: number, y: number): boolean {
        if (this.clipPaths.length === 0) return true
        let inside = false
        for (const poly of this.clipPaths) {
            if (poly.points.length < 3) continue
            if (this.pointInPoly(x, y, poly.points)) inside = !inside
        }
        return inside
    }

    /** 射线法判断点是否在多边形内（evenodd） */
    private pointInPoly(x: number, y: number, pts: [number, number][]): boolean {
        let inside = false
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const xi = pts[i][0], yi = pts[i][1]
            const xj = pts[j][0], yj = pts[j][1]
            if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
                inside = !inside
            }
        }
        return inside
    }

    // ==================== 像素读写 ====================

    /** 读取像素 RGBA（0-255，a 0-255），越界返回 [0,0,0,0] */
    readPixel(x: number, y: number): [number, number, number, number] {
        return this._fb.readColor(x, y)
    }

    getImageData(x: number, y: number, width: number, height: number): ImageData {
        const img = new ImageData(width, height)
        const src = this._fb.colorBuffer
        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                const sx = x + px
                const sy = y + py
                if (sx >= 0 && sx < this.width && sy >= 0 && sy < this.height) {
                    const si = (sy * this.width + sx) * 4
                    const di = (py * width + px) * 4
                    img.data[di] = src[si]
                    img.data[di + 1] = src[si + 1]
                    img.data[di + 2] = src[si + 2]
                    img.data[di + 3] = src[si + 3]
                }
            }
        }
        return img
    }

    putImageData(image: ImageSource, x: number, y: number): void {
        const src = image.data
        const w = image.width
        const h = image.height
        for (let py = 0; py < h; py++) {
            const sy = y + py
            if (sy < 0 || sy >= this.height) continue
            for (let px = 0; px < w; px++) {
                const sx = x + px
                if (sx < 0 || sx >= this.width) continue
                const si = (py * w + px) * 4
                this._fb.writeColor(sx, sy, src[si], src[si + 1], src[si + 2], src[si + 3])
            }
        }
    }

    /** 清空整幅画布为透明 */
    clear(): void {
        this._fb.clearColor(0, 0, 0, 0)
        this._fb.clearDepth(1)
    }

    // ==================== 绘制：填充 / 描边 / 矩形 / 图像 ====================

    /** 填充当前路径。fillRule: 'nonzero'（默认）| 'evenodd' */
    fill(fillRule: 'nonzero' | 'evenodd' = 'nonzero'): void {
        const polys = this.path.toPolygons()
        const device = this.toDevicePolys(polys)
        const colorFn = this.resolveColor(this.fillStyle)
        this.rasterizePolygons(device, colorFn, fillRule)
    }

    /** 描边当前路径（线宽、端帽、连接样式按状态） */
    stroke(): void {
        const polys = this.path.toPolygons()
        const device = this.toDevicePolys(polys)
        const hulls = this.buildStrokeHulls(device)
        const colorFn = this.resolveColor(this.strokeStyle)
        // 描边几何全部合并后一次非零环绕填充：线段矩形重叠处自动视为内部，无需手动处理 join
        this.rasterizePolygons(hulls, colorFn, 'nonzero')
    }

    fillRect(x: number, y: number, width: number, height: number): void {
        this.beginPath()
        this.rect(x, y, width, height)
        this.fill()
    }

    strokeRect(x: number, y: number, width: number, height: number): void {
        this.beginPath()
        this.rect(x, y, width, height)
        this.stroke()
    }

    /** 清除矩形区域为透明（不受变换影响，同 canvas clearRect 语义） */
    clearRect(x: number, y: number, width: number, height: number): void {
        const x0 = Math.max(0, Math.floor(x))
        const y0 = Math.max(0, Math.floor(y))
        const x1 = Math.min(this.width, Math.ceil(x + width))
        const y1 = Math.min(this.height, Math.ceil(y + height))
        for (let py = y0; py < y1; py++) {
            for (let px = x0; px < x1; px++) {
                this._fb.writeColor(px, py, 0, 0, 0, 0)
            }
        }
    }

    /**
     * 绘制图像。参数形式与 canvas 一致：
     *   drawImage(img, dx, dy)
     *   drawImage(img, dx, dy, dw, dh)
     *   drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
     * 目标矩形受当前 transform 影响；通过逆矩阵对目标像素反算源坐标并双线性采样。
     */
    drawImage(img: ImageSource, ...args: number[]): void {
        let sx = 0, sy = 0, sw = img.width, sh = img.height
        let dx: number, dy: number, dw: number, dh: number
        if (args.length === 2) {
            ;[dx, dy] = args
            dw = img.width
            dh = img.height
        } else if (args.length === 4) {
            ;[dx, dy, dw, dh] = args
        } else if (args.length === 8) {
            ;[sx, sy, sw, sh, dx, dy, dw, dh] = args
        } else {
            throw new Error('drawImage: 需要 2 / 4 / 8 个坐标参数')
        }
        const inv = this._transform.invert()
        if (!inv || dw === 0 || dh === 0) return

        // 目标矩形（用户坐标）→ 设备坐标包围盒，只扫该区域
        const corners = [
            [dx, dy], [dx + dw, dy], [dx, dy + dh], [dx + dw, dy + dh],
        ].map(([x, y]) => this._transform.transformPoint(x, y))
        const minX = Math.max(0, Math.floor(Math.min(...corners.map((c) => c[0]))))
        const minY = Math.max(0, Math.floor(Math.min(...corners.map((c) => c[1]))))
        const maxX = Math.min(this.width - 1, Math.ceil(Math.max(...corners.map((c) => c[0]))))
        const maxY = Math.min(this.height - 1, Math.ceil(Math.max(...corners.map((c) => c[1]))))

        for (let py = minY; py <= maxY; py++) {
            for (let px = minX; px <= maxX; px++) {
                // 设备像素中心 → 用户坐标
                const [ux, uy] = inv.transformPoint(px + 0.5, py + 0.5)
                if (ux < dx || ux >= dx + dw || uy < dy || uy >= dy + dh) continue
                const u = (ux - dx) / dw
                const v = (uy - dy) / dh
                const col = this.sampleImage(img, sx + u * sw, sy + v * sh)
                if (col[3] > 0) this.blendPixel(px, py, col)
            }
        }
    }

    // ==================== 内部：几何处理 ====================

    /** 把用户坐标子路径变换到设备坐标 */
    private toDevicePolys(polys: { points: [number, number][]; closed: boolean }[]): { points: [number, number][]; closed: boolean }[] {
        const t = this._transform
        return polys.map((p) => ({
            closed: p.closed,
            points: p.points.map(([x, y]) => t.transformPoint(x, y)),
        }))
    }

    /** 颜色解析闭包：返回设备坐标 (x,y) → RGBA（已乘 globalAlpha） */
    private resolveColor(style: FillStyle): (x: number, y: number) => RGBA {
        if (style instanceof CanvasPattern) {
            const inv = this._transform.invert()
            return (x, y) => {
                const [ux, uy] = inv ? inv.transformPoint(x, y) : [x, y]
                const c = style.colorAt(ux, uy)
                return [c[0], c[1], c[2], c[3] * this.globalAlpha]
            }
        }
        if (this.isGradient(style)) {
            // 渐变参数是用户坐标，需经当前变换逆矩阵把设备像素反算回用户坐标
            // （与 CanvasPattern 一致；否则 scale(DPR) / rotate 下渐变中心会与路径错位）
            const inv = this._transform.invert()
            return (x, y) => {
                const [ux, uy] = inv ? inv.transformPoint(x, y) : [x, y]
                const c = style.colorAt(ux, uy)
                return [c[0], c[1], c[2], c[3] * this.globalAlpha]
            }
        }
        const c = parseColor(style)
        const a = c[3] * this.globalAlpha
        return () => [c[0], c[1], c[2], a]
    }

    /** 类型守卫：style 是三种渐变类之一（排除 CanvasPattern 后的带 colorAt 对象） */
    private isGradient(style: FillStyle): style is CanvasGradient {
        return typeof style === 'object' && style !== null && 'colorAt' in style
    }

    /**
     * 扫描线填充：对每个多边形，用"上闭下开"的半开区间规则求扫描线交点，
     * 再按填充规则（evenodd 两两配对 / nonzero 累积环绕数）确定内部区间。
     * 区间只用于界定"这一行哪些像素可能被覆盖"，真正的覆盖率由 fillSpan 的子采样判定。
     * 这是 CPU 矢量填充的核心算法，也是 canvas 背后"怎么把轮廓变成实心"的答案。
     */
    private rasterizePolygons(
        polys: { points: [number, number][]; closed: boolean }[],
        colorFn: (x: number, y: number) => RGBA,
        rule: 'nonzero' | 'evenodd',
    ): void {
        // 收集所有边（设备坐标；闭合标志决定是否补首尾边）
        const edges: { x0: number; y0: number; x1: number; y1: number; dir: number }[] = []
        let yMin = Infinity
        let yMax = -Infinity
        for (const poly of polys) {
            const pts = poly.points
            if (pts.length < 2) continue
            const count = poly.closed ? pts.length : Math.max(0, pts.length - 1)
            for (let i = 0; i < count; i++) {
                const p = pts[i]
                const q = pts[(i + 1) % pts.length]
                edges.push({ x0: p[0], y0: p[1], x1: q[0], y1: q[1], dir: 0 })
            }
            for (const [x, y] of pts) {
                if (y < yMin) yMin = y
                if (y > yMax) yMax = y
            }
        }
        if (edges.length === 0) return
        const y0 = Math.max(0, Math.floor(yMin))
        const y1 = Math.min(this.height, Math.ceil(yMax))
        if (y0 >= y1) return

        for (let py = y0; py < y1; py++) {
            const y = py + 0.5 // 扫描线取像素中心
            const xs: { x: number; dir: number }[] = []
            for (const e of edges) {
                const lo = Math.min(e.y0, e.y1)
                const hi = Math.max(e.y0, e.y1)
                // 半开区间 [lo, hi)：顶点恰好落在扫描线上时只算一次，避免重复计数
                if (y >= lo && y < hi) {
                    const t = (y - e.y0) / (e.y1 - e.y0)
                    xs.push({ x: e.x0 + t * (e.x1 - e.x0), dir: e.y1 > e.y0 ? 1 : -1 })
                }
            }
            xs.sort((a, b) => a.x - b.x)
            if (rule === 'evenodd') {
                for (let i = 0; i + 1 < xs.length; i += 2) {
                    this.fillSpan(py, xs[i].x, xs[i + 1].x, colorFn, polys, rule)
                }
            } else {
                // 非零环绕：从左到右累积方向，环绕数 ≠ 0 的区间在内部
                let winding = 0
                for (let i = 0; i < xs.length; i++) {
                    winding += xs[i].dir
                    if (winding !== 0) {
                        const startX = xs[i].x
                        let j = i
                        while (j + 1 < xs.length && winding !== 0) {
                            j++
                            winding += xs[j].dir
                        }
                        this.fillSpan(py, startX, xs[j].x, colorFn, polys, rule)
                        i = j
                    }
                }
            }
        }
    }

    /**
     * 填充扫描线 [x0, x1) 可能覆盖的像素行，抗锯齿采用 2×2 子采样覆盖率：
     * 对每个候选像素取 4 个亚像素点（±0.25 偏移），按填充规则统计命中数，
     * 覆盖率 cov = 命中/4，边缘像素按 cov 混合到背景、内部像素 cov=1 全量写入。
     * 相比 1D 解析覆盖率，2D 子采样对任意斜率的边都产生正确的灰色过渡（模拟 4x MSAA）。
     * 区间 [x0, x1) 只用于裁剪候选像素范围，实际内外由子采样点判定。
     */
    private fillSpan(
        py: number,
        x0: number,
        x1: number,
        colorFn: (x: number, y: number) => RGBA,
        polys: { points: [number, number][]; closed: boolean }[],
        rule: 'nonzero' | 'evenodd',
    ): void {
        if (x1 <= x0) return
        // 外扩 1 像素：斜边可能在区间边界像素内部穿过
        const px0 = Math.max(0, Math.floor(x0 - 0.5))
        const px1 = Math.min(this.width - 1, Math.ceil(x1 - 0.5))
        const subs = [
            [-0.25, -0.25], [0.25, -0.25],
            [-0.25, 0.25], [0.25, 0.25],
        ]
        for (let px = px0; px <= px1; px++) {
            let hits = 0
            for (const [sx, sy] of subs) {
                if (this.pointInShapes(px + 0.5 + sx, py + 0.5 + sy, polys, rule)) hits++
            }
            const cov = hits / 4
            if (cov <= 0) continue
            const c = colorFn(px + 0.5, py + 0.5)
            if (c[3] > 0) this.blendPixel(px, py, [c[0], c[1], c[2], c[3] * cov])
        }
    }

    /** 点 (x,y) 是否在一组多边形内（evenodd 奇偶 / nonzero 环绕数） */
    private pointInShapes(
        x: number,
        y: number,
        polys: { points: [number, number][]; closed: boolean }[],
        rule: 'nonzero' | 'evenodd',
    ): boolean {
        if (rule === 'evenodd') {
            let inside = false
            for (const poly of polys) {
                if (this.pointInPoly(x, y, poly.points)) inside = !inside
            }
            return inside
        }
        let winding = 0
        for (const poly of polys) {
            winding += this.windingNumber(x, y, poly.points)
        }
        return winding !== 0
    }

    /** 多边形环绕数：沿射线穿过边的方向累积（nonzero 规则用） */
    private windingNumber(x: number, y: number, pts: [number, number][]): number {
        let w = 0
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const xi = pts[i][0], yi = pts[i][1]
            const xj = pts[j][0], yj = pts[j][1]
            if (yi <= y) {
                if (yj > y && (xj - xi) * (y - yi) > (x - xi) * (yj - yi)) w++
            } else if (yj <= y && (xj - xi) * (y - yi) < (x - xi) * (yj - yi)) w--
        }
        return w
    }

    /**
     * 描边几何：把每条线段"膨胀"为矩形，加上端点帽，合并成一个多边形列表。
     * 关键教学点：描边本质是把一维的线变成二维的闭合多边形，然后复用填充算法。
     * 由于最终用非零环绕一次填充，相邻线段矩形重叠部分自动视为内部 → join 自然衔接。
     */
    private buildStrokeHulls(polys: { points: [number, number][]; closed: boolean }[]): { points: [number, number][]; closed: boolean }[] {
        const hulls: { points: [number, number][]; closed: boolean }[] = []
        const hw = this.lineWidth / 2
        if (hw <= 0) return hulls

        for (const poly of polys) {
            const pts = poly.points
            if (pts.length < 2) continue
            const n = poly.closed ? pts.length : pts.length - 1
            for (let i = 0; i < n; i++) {
                const p = pts[i]
                const q = pts[(i + 1) % pts.length]
                const dx = q[0] - p[0]
                const dy = q[1] - p[1]
                const len = Math.hypot(dx, dy)
                if (len < 1e-12) continue
                const nx = (-dy / len) * hw
                const ny = (dx / len) * hw
                hulls.push({
                    closed: true,
                    points: [
                        [p[0] + nx, p[1] + ny],
                        [q[0] + nx, q[1] + ny],
                        [q[0] - nx, q[1] - ny],
                        [p[0] - nx, p[1] - ny],
                    ],
                })
                // 端帽（仅开放路径的两端；闭合路径首尾相连无需端帽）
                if (!poly.closed) {
                    if (i === 0) this.appendCap(hulls, p[0], p[1], dx / len, dy / len, hw)
                    if (i === n - 1) this.appendCap(hulls, q[0], q[1], -dx / len, -dy / len, hw)
                }
            }
        }
        return hulls
    }

    /** 在端点 (x,y) 处、沿 (ux,uy) 方向添加端帽多边形（butt 不加 / square 加方块 / round 加半圆） */
    private appendCap(hulls: { points: [number, number][]; closed: boolean }[], x: number, y: number, ux: number, uy: number, hw: number): void {
        if (this.lineCap === 'butt') return
        if (this.lineCap === 'square') {
            // 向外延伸 hw 的方块
            hulls.push({
                closed: true,
                points: [
                    [x + ux * hw - uy * hw, y + uy * hw + ux * hw],
                    [x + ux * hw + uy * hw, y + uy * hw - ux * hw],
                    [x - uy * hw, y + ux * hw],
                    [x + uy * hw, y - ux * hw],
                ],
            })
        } else {
            // round：以端点为圆心的外半圆，向"背对线段方向"凸出。
            // 线段方向角 θ = atan2(uy,ux)，外半圆角度从 θ+π/2 扫到 θ+3π/2（半径 hw）。
            const theta = Math.atan2(uy, ux)
            const cap: [number, number][] = []
            for (let i = 0; i <= 16; i++) {
                const a = theta + Math.PI / 2 + (i / 16) * Math.PI
                cap.push([x + hw * Math.cos(a), y + hw * Math.sin(a)])
            }
            hulls.push({ closed: true, points: cap })
        }
    }

    /** 双线性采样源图像（u/v 为源像素坐标） */
    private sampleImage(img: ImageSource, u: number, v: number): RGBA {
        const w = img.width
        const h = img.height
        if (u < 0 || u >= w || v < 0 || v >= h) return [0, 0, 0, 0]
        const x0 = Math.floor(u)
        const y0 = Math.floor(v)
        const fx = u - x0
        const fy = v - y0
        const x1 = Math.min(w - 1, x0 + 1)
        const y1 = Math.min(h - 1, y0 + 1)
        const data = img.data
        const i00 = (y0 * w + x0) * 4
        const i10 = (y0 * w + x1) * 4
        const i01 = (y1 * w + x0) * 4
        const i11 = (y1 * w + x1) * 4
        const out: RGBA = [0, 0, 0, 0]
        for (let k = 0; k < 4; k++) {
            const top = data[i00 + k] * (1 - fx) + data[i10 + k] * fx
            const bot = data[i01 + k] * (1 - fx) + data[i11 + k] * fx
            out[k] = top * (1 - fy) + bot * fy
        }
        return out
    }

    /** source-over alpha 混合写入像素（先过裁剪区判定） */
    private blendPixel(px: number, py: number, c: RGBA): void {
        if (!this.inClip(px + 0.5, py + 0.5)) return
        const a = Math.max(0, Math.min(1, c[3]))
        if (a <= 0) return
        const dst = this._fb.readColor(px, py)
        const inv = 1 - a
        this._fb.writeColor(
            px, py,
            c[0] * a + dst[0] * inv,
            c[1] * a + dst[1] * inv,
            c[2] * a + dst[2] * inv,
            a * 255 + dst[3] * inv,
        )
    }

    // 供外部访问帧缓冲（与 webgl 的 CPUFramebuffer 一致接口）
    get framebuffer(): CPUFramebuffer {
        return this._fb
    }
}

export { Mat2D, Path2D }
export type { PathCommand, SubPath } from './path'
