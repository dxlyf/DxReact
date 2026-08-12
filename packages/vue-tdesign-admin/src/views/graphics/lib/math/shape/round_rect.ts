import type { Vector2Like } from "../vector2"
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
     * 圆角矩形 SDF（标准 round-box 公式）：
     *   q = |p − 中心| − (半尺寸 − r)，sd = |max(q,0)| − r + min(max(qx,qy), 0)。
     * 标准公式「内部为负」，基类约定「内部为正」，故取反。
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
        return -(Math.hypot(ax, ay) - r + Math.min(Math.max(qx, qy), 0))
    }

    /**
     * 轮廓点：顶边起点 → 顺时针过 4 个圆角 → 回到起点前。
     * 圆角用圆弧近似（默认每角 8 段）。
     */
    buildPath(segmentsPerCorner: number = 8): Vector2Like[] {
        const { x, y, width, height } = this
        const [tl, tr, br, bl] = this.radii
        const pts: Vector2Like[] = []

        /** 生成一段圆弧 [a0, a1]（含两端），r ≤ 0 时退化为圆心点 */
        const pushArc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
            if (r <= 0) {
                pts.push({ x: cx, y: cy })
                return
            }
            const n = Math.max(1, Math.floor(segmentsPerCorner))
            for (let i = 0; i <= n; i++) {
                const a = a0 + ((a1 - a0) * i) / n
                pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) })
            }
        }

        // 起始点：顶边左端（未进圆角处）
        pts.push({ x: x + tl, y })
        // 右上角：-π/2 → 0
        pushArc(x + width - tr, y + tr, tr, -Math.PI / 2, 0)
        // 右下角：0 → π/2
        pushArc(x + width - br, y + height - br, br, 0, Math.PI / 2)
        // 左下角：π/2 → π
        pushArc(x + bl, y + height - bl, bl, Math.PI / 2, Math.PI)
        // 左上角：π → 3π/2（终点与起始点重合，去除避免重复）
        pushArc(x + tl, y + tl, tl, Math.PI, (Math.PI * 3) / 2)
        const last = pts[pts.length - 1]
        if (Math.abs(last.x - pts[0].x) < 1e-9 && Math.abs(last.y - pts[0].y) < 1e-9) {
            pts.pop()
        }
        return pts
    }
}
