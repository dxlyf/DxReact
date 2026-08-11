import { ShapePrimitive } from "./shape_primitive"

/**
 * 圆角矩形（轴对齐）。
 * @param x 左上角 x
 * @param y 左上角 y
 * @param width  宽
 * @param height 高
 * @param r 圆角半径：number（四角相同）或 [tl, tr, br, bl]（左上/右上/右下/左下，与 Canvas roundRect 一致）
 */
export class RoundRect extends ShapePrimitive {
    x: number
    y: number
    width: number
    height: number
    /** 圆角半径数组 [tl, tr, br, bl] */
    radii: number[]

    constructor(x = 0, y = 0, width = 0, height = 0, r: number | number[] = 0) {
        super()
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.radii = this.normalizeRadii(r)
        this.updateBounds()
    }

    get cx(): number {
        return this.x + this.width / 2
    }

    get cy(): number {
        return this.y + this.height / 2
    }

    set(x: number, y: number, width: number, height: number, r?: number | number[]): this {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        if (r !== undefined) this.radii = this.normalizeRadii(r)
        return this.updateBounds()
    }

    /** number → 四角相同；数组 → [tl,tr,br,bl] */
    private normalizeRadii(r: number | number[]): number[] {
        if (typeof r === 'number') return [r, r, r, r]
        return [r[0], r[1], r[2], r[3]]
    }

    /** 当前象限的圆角半径（y 轴向下，像素坐标） */
    private radiusOf(px: number, py: number): number {
        const [tl, tr, br, bl] = this.radii
        if (px < 0) return py < 0 ? tl : bl // 左
        return py < 0 ? tr : br // 右
    }

    private updateBounds(): this {
        this.bounds.fromXYWH(this.x, this.y, this.width, this.height)
        return this
    }

    /**
     * 圆角矩形 SDF：
     *   q = |p − 中心| − (半尺寸 − 圆角半径)，按象限选对应半径，
     *   sd = |max(q,0)| − r + min(max(qx,qy), 0)。
     * 矩形内部按最近边距离计，四角按对应圆弧计。
     */
    signedDistance(x: number, y: number): number {
        const px = x - this.cx
        const py = y - this.cy
        const r = this.radiusOf(px, py)
        const hw = this.width / 2
        const hh = this.height / 2
        const qx = Math.abs(px) - (hw - r)
        const qy = Math.abs(py) - (hh - r)
        const ax = Math.max(qx, 0)
        const ay = Math.max(qy, 0)
        return Math.hypot(ax, ay) - r + Math.min(Math.max(qx, qy), 0)
    }
}
