import { Color } from './Color'
import * as MathUtils from './utils/MathUtils'

export interface GradientStop {
    offset: number // 0-1
    color: Color
}

export type GradientColorStop =
    | [offset: number, color: Color | string]
    | { offset: number; color: Color | string }

function toStop(stop: GradientColorStop): GradientStop {
    if (Array.isArray(stop)) {
        return { offset: MathUtils.clamp(stop[0], 0, 1), color: Color.from(stop[1]) }
    }
    return { offset: MathUtils.clamp(stop.offset, 0, 1), color: Color.from(stop.color) }
}

/**
 * 渐变基类
 *
 * 统一颜色停靠点管理，子类负责具体的渐变参数与采样。
 * 可转换为 canvas 渐变对象（apply 方法）供 Canvas2D 后端直接使用。
 */
export abstract class Gradient {
    protected _stops: GradientStop[] = []

    protected constructor(stops: GradientColorStop[] = []) {
        this.addStops(stops)
    }

    get stops(): readonly GradientStop[] {
        return this._stops
    }

    /** 追加一个或多个颜色停靠点（会按 offset 排序） */
    addStop(offset: number, color: Color | string): this {
        this._stops.push({ offset: MathUtils.clamp(offset, 0, 1), color: Color.from(color) })
        this.sortStops()
        return this
    }

    addStops(stops: GradientColorStop[]): this {
        for (const stop of stops) this._stops.push(toStop(stop))
        this.sortStops()
        return this
    }

    removeStop(index: number): this {
        this._stops.splice(index, 1)
        return this
    }

    private sortStops(): void {
        this._stops.sort((a, b) => a.offset - b.offset)
    }

    /** 在给定 t（0-1）处插值颜色 */
    sample(t: number): Color {
        const stops = this._stops
        if (stops.length === 0) return Color.TRANSPARENT.clone()
        t = MathUtils.clamp(t, 0, 1)
        if (t <= stops[0].offset) return stops[0].color.clone()
        if (t >= stops[stops.length - 1].offset) return stops[stops.length - 1].color.clone()
        for (let i = 0; i < stops.length - 1; i++) {
            const a = stops[i], b = stops[i + 1]
            if (t >= a.offset && t <= b.offset) {
                const span = b.offset - a.offset
                const k = span === 0 ? 0 : (t - a.offset) / span
                return a.color.lerp(b.color, k)
            }
        }
        return stops[stops.length - 1].color.clone()
    }

    /** 构建 canvas 渐变对象 */
    abstract createGradient(ctx: CanvasRenderingContext2D): CanvasGradient

    apply(ctx: CanvasRenderingContext2D, target: 'fill' | 'stroke' = 'fill'): void {
        const gradient = this.createGradient(ctx)
        for (const stop of this._stops) gradient.addColorStop(stop.offset, stop.color.toString())
        ctx[target === 'fill' ? 'fillStyle' : 'strokeStyle'] = gradient
    }

    clone(): Gradient {
        const ctor = this.constructor as new (stops: GradientColorStop[]) => Gradient
        return new ctor(this._stops.map((s) => [s.offset, s.color.clone()] as GradientColorStop))
    }
}

/** 线性渐变 */
export class LinearGradient extends Gradient {
    x0: number
    y0: number
    x1: number
    y1: number

    constructor(x0: number, y0: number, x1: number, y1: number, stops: GradientColorStop[] = []) {
        super(stops)
        this.x0 = x0
        this.y0 = y0
        this.x1 = x1
        this.y1 = y1
    }

    createGradient(ctx: CanvasRenderingContext2D): CanvasGradient {
        return ctx.createLinearGradient(this.x0, this.y0, this.x1, this.y1)
    }
    
}

export type RadialGradientLayout = 'circle' | 'ellipse'

/** 径向渐变（支持椭圆形态） */
export class RadialGradient extends Gradient {
    x0: number // 内圆圆心
    y0: number
    r0: number // 内圆半径
    x1: number // 外圆圆心
    y1: number
    r1: number // 外圆半径
    layout: RadialGradientLayout

    constructor(
        x0: number, y0: number, r0: number,
        x1: number, y1: number, r1: number,
        stops: GradientColorStop[] = [],
        layout: RadialGradientLayout = 'circle',
    ) {
        super(stops)
        this.x0 = x0; this.y0 = y0; this.r0 = r0
        this.x1 = x1; this.y1 = y1; this.r1 = r1
        this.layout = layout
    }

    createGradient(ctx: CanvasRenderingContext2D): CanvasGradient {
        if (this.layout === 'circle') {
            return ctx.createRadialGradient(this.x0, this.y0, this.r0, this.x1, this.y1, this.r1)
        }
        // 椭圆形态：先按圆形创建，再通过 canvas 变换缩放实现（标准做法）
        ctx.save()
        // 以椭圆中心为原点缩放到圆，再构建渐变
        const cx = this.x1, cy = this.y1
        ctx.translate(cx, cy)
        ctx.scale(1, this.r1 / Math.max(this.r0, this.r1))
        ctx.translate(-cx, -cy)
        const gradient = ctx.createRadialGradient(this.x0, this.y0, this.r0, this.x1, this.y1, this.r1)
        ctx.restore()
        return gradient
    }

    apply(ctx: CanvasRenderingContext2D, target: 'fill' | 'stroke' = 'fill'): void {
        const gradient = this.createGradient(ctx)
        for (const stop of this._stops) gradient.addColorStop(stop.offset, stop.color.toString())
        ctx[target === 'fill' ? 'fillStyle' : 'strokeStyle'] = gradient
    }
}

/** 圆锥/角渐变（Canvas 原生不支持，按 360° 分段多边形采样） */
export class ConicGradient extends Gradient {
    startAngle: number
    cx: number
    cy: number

    constructor(startAngle: number, cx: number, cy: number, stops: GradientColorStop[] = []) {
        super(stops)
        this.startAngle = startAngle
        this.cx = cx
        this.cy = cy
    }

    createGradient(ctx: CanvasRenderingContext2D): CanvasGradient {
        void ctx
        throw new Error('ConicGradient 无法直接构建 CanvasGradient，请使用 sample() 自行光栅化')
    }
}
