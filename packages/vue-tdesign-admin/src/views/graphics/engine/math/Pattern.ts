import { Color } from './Color'
import { Matrix2D } from './2d/Matrix2D'

export type PatternRepetition = 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat'

/**
 * 图案填充
 *
 * 支持 CanvasImageSource（图片/画布/视频帧）图案，以及纯色像素图案。
 * transform 用于控制图案平铺的缩放 / 旋转 / 平移。
 */
export class Pattern {
    private _source: CanvasImageSource
    private _repetition: PatternRepetition
    private _transform: Matrix2D | null

    constructor(source: CanvasImageSource, repetition: PatternRepetition = 'repeat', transform?: Matrix2D) {
        this._source = source
        this._repetition = repetition
        this._transform = transform ?? null
    }

    get source(): CanvasImageSource {
        return this._source
    }

    get repetition(): PatternRepetition {
        return this._repetition
    }

    get transform(): Matrix2D | null {
        return this._transform
    }

    set transform(m: Matrix2D | null) {
        this._transform = m
    }

    /** 从纯色创建像素图案 */
    static fromColor(color: Color | string, size = 1): Pattern {
        const s = Math.max(1, Math.floor(size))
        const canvas = document.createElement('canvas')
        canvas.width = s
        canvas.height = s
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = Color.from(color).toString()
        ctx.fillRect(0, 0, s, s)
        return new Pattern(canvas)
    }

    /**
     * 构建 canvas 图案对象
     * @param ctx canvas 上下文
     * @returns CanvasPattern
     */
    createPattern(ctx: CanvasRenderingContext2D): CanvasPattern {
        const pattern = ctx.createPattern(this._source, this._repetition)
        if (!pattern) throw new Error('无法创建图案，source 无效')
        if (this._transform) pattern.setTransform(this._transform.toDOMMatrix())
        return pattern
    }

    apply(ctx: CanvasRenderingContext2D, target: 'fill' | 'stroke' = 'fill'): void {
        ctx[target === 'fill' ? 'fillStyle' : 'strokeStyle'] = this.createPattern(ctx)
    }

    clone(): Pattern {
        return new Pattern(this._source, this._repetition, this._transform?.clone() ?? null)
    }

    /**
     * 自定义图案渲染函数：可在任意后端绘制
     */
    static fromRenderer(render: (ctx: CanvasRenderingContext2D) => void, width: number, height: number): Pattern {
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.floor(width))
        canvas.height = Math.max(1, Math.floor(height))
        const ctx = canvas.getContext('2d')!
        render(ctx)
        return new Pattern(canvas)
    }
}
