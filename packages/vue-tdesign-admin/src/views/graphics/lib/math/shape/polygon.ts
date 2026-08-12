import type { Vector2Like } from "../vector2"
import { ShapePrimitive } from "./shape_primitive"

/**
 * 多边形（任意顶点数，支持凹多边形）。
 * @param points 顶点列表（顺序即边连接顺序），拷贝一份避免外部修改
 */
export class Polygon extends ShapePrimitive {
    points: Vector2Like[]

    constructor(points: Vector2Like[]) {
        super()
        this.points = points.map(p => ({ x: p.x, y: p.y }))
        this.updateBounds()
    }

    set(points: Vector2Like[]): this {
        this.points = points.map(p => ({ x: p.x, y: p.y }))
        return this.updateBounds()
    }

    private updateBounds(): this {
        this.bounds.fromPoints(this.points)
        return this
    }

    /**
     * 多边形 SDF（鲁棒版，对凹多边形也成立）：
     *   先射线法判内外；内部 → +到最近边的距离，外部 → −到最近边的距离。
     * 注意：内部 SDF 在凹顶点附近不是精确的距离场（到边的距离 ≤ 真实边界距离），
     * 但用于 contains / containsStroke 判据足够。
     */
    signedDistance(x: number, y: number): number {
        const d = this.distanceToEdges(x, y)
        return this.containsByRayCast(x, y) ? d : -d
    }

    /** 点到所有边的最近距离（点到线段） */
    private distanceToEdges(x: number, y: number): number {
        const n = this.points.length
        if (n < 2) return Infinity
        let min = Infinity
        for (let i = 0; i < n; i++) {
            const p0 = this.points[i]
            const p1 = this.points[(i + 1) % n]
            min = Math.min(min, pointSegmentDistance(x, y, p0, p1))
        }
        return min
    }

    /** 轮廓点：顶点列表（拷贝），不重复闭合点 */
    buildPath(): Vector2Like[] {
        return this.points.map(p => ({ x: p.x, y: p.y }))
    }

    /** 射线投射法（even-odd 规则），支持凹多边形与自交 */
    private containsByRayCast(x: number, y: number): boolean {
        const pts = this.points
        const n = pts.length
        let inside = false
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = pts[i].x, yi = pts[i].y
            const xj = pts[j].x, yj = pts[j].y
            // 水平向右的射线与边 (j→i) 相交判定
            if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
                inside = !inside
            }
        }
        return inside
    }
}

/** 点 P 到线段 (a, b) 的最短距离（垂足可能落在线段外，取最近端点） */
function pointSegmentDistance(x: number, y: number, a: Vector2Like, b: Vector2Like): number {
    const abx = b.x - a.x
    const aby = b.y - a.y
    const len2 = abx * abx + aby * aby
    if (len2 === 0) return Math.hypot(x - a.x, y - a.y)
    // t 投影参数，clamp 到 [0,1]
    const t = Math.max(0, Math.min(1, ((x - a.x) * abx + (y - a.y) * aby) / len2))
    return Math.hypot(x - (a.x + t * abx), y - (a.y + t * aby))
}
