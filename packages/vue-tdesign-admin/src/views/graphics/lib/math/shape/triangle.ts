import type { Vector2Like } from "../vector2"
import { ShapePrimitive } from "./shape_primitive"

/**
 * 三角形（由三个顶点定义，任意绕向）。
 * @param a 顶点 A
 * @param b 顶点 B
 * @param c 顶点 C
 */
export class Triangle extends ShapePrimitive {
    a: Vector2Like
    b: Vector2Like
    c: Vector2Like

    constructor(a: Vector2Like, b: Vector2Like, c: Vector2Like) {
        super()
        this.a = { x: a.x, y: a.y }
        this.b = { x: b.x, y: b.y }
        this.c = { x: c.x, y: c.y }
        this.updateBounds()
    }

    set(a: Vector2Like, b: Vector2Like, c: Vector2Like): this {
        this.a = { x: a.x, y: a.y }
        this.b = { x: b.x, y: b.y }
        this.c = { x: c.x, y: c.y }
        return this.updateBounds()
    }

    private updateBounds(): this {
        this.bounds.fromPoints([this.a, this.b, this.c])
        return this
    }

    /**
     * 三角形 SDF：三条边半平面距离的最小值。
     * 边 (P0,P1) 的带符号距离 d = cross(P1−P0, P−P0) / |P1−P0|，
     * 统一为逆时针绕向（内部为正），内部任一点 sd > 0，最小值为 0 即落在边上。
     */
    signedDistance(x: number, y: number): number {
        const { a, b, c } = this
        // 有向面积 2 倍：< 0 表示顺时针，需要翻转距离符号
        const area2 = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)
        const sign = area2 >= 0 ? 1 : -1

        const d0 = crossDist(a, b, x, y)
        const d1 = crossDist(b, c, x, y)
        const d2 = crossDist(c, a, x, y)
        return Math.min(d0, d1, d2) * sign
    }
}

/** 点 P 到边 (P0,P1) 的带符号距离（P0→P1 左侧为正） */
function crossDist(p0: Vector2Like, p1: Vector2Like, x: number, y: number): number {
    const ex = p1.x - p0.x
    const ey = p1.y - p0.y
    const len = Math.hypot(ex, ey)
    if (len === 0) return Infinity
    return ((p1.x - p0.x) * (y - p0.y) - (p1.y - p0.y) * (x - p0.x)) / len
}
