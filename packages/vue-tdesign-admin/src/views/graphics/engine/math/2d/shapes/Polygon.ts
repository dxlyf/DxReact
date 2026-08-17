import { ShapePrimitive, registerPolygonClass } from './ShapePrimitive'
import { Box2 } from '../Box2'
import { Vector2 } from '../Vector2'
import { Matrix2D } from '../Matrix2D'

/**
 * 多边形
 *
 * 顶点按顺序（顺时针或逆时针）排列，支持凸多边形与简单凹多边形。
 * 命中检测使用射线投射算法（含边界判断）。
 */
export class Polygon extends ShapePrimitive {
    points: Vector2[]

    constructor(points: Vector2[] = []) {
        super()
        this.points = points
    }

    get vertexCount(): number {
        return this.points.length
    }

    static fromPoints(points: Array<[number, number] | Vector2 | { x: number; y: number }>): Polygon {
        return new Polygon(points.map((p) => {
            if (p instanceof Vector2) return p.clone()
            if (Array.isArray(p)) return new Vector2(p[0], p[1])
            return new Vector2(p.x, p.y)
        }))
    }

    getBounds(): Box2 {
        const box = new Box2()
        for (const p of this.points) box.expandByPoint(p.x, p.y)
        return box
    }

    contains(point: Vector2): boolean {
        const pts = this.points
        const n = pts.length
        if (n < 3) return false
        let inside = false
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const a = pts[i], b = pts[j]
            const intersect = (a.y > point.y) !== (b.y > point.y) &&
                point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
            if (intersect) inside = !inside
        }
        return inside
    }

    getPoints(): Vector2[] {
        return this.points.map((p) => p.clone())
    }

    /** 有符号距离：最近边距离 + 内外符号，负=内部 */
    signedDistance(x: number, y: number): number {
        const dist = this.distanceToEdge(x, y)
        return this.contains(new Vector2(x, y)) ? -dist : dist
    }

    /** 周长 */
    perimeter(): number {
        const pts = this.points
        let len = 0
        for (let i = 0; i < pts.length; i++) {
            len += pts[i].distanceTo(pts[(i + 1) % pts.length])
        }
        return len
    }

    /** 凸包（Andrew 单调链算法），返回新多边形 */
    convexHull(): Polygon {
        const pts = this.points.map((p) => p.clone()).sort((a, b) => a.x - b.x || a.y - b.y)
        if (pts.length <= 3) return new Polygon(pts)
        const cross = (o: Vector2, a: Vector2, b: Vector2): number => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
        const lower: Vector2[] = []
        for (const p of pts) {
            while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
            lower.push(p)
        }
        const upper: Vector2[] = []
        for (let i = pts.length - 1; i >= 0; i--) {
            const p = pts[i]
            while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
            upper.push(p)
        }
        lower.pop()
        upper.pop()
        return new Polygon(lower.concat(upper))
    }

    /** 质心（面积加权） */
    centroid(): Vector2 {
        const pts = this.points
        const n = pts.length
        if (n === 0) return new Vector2()
        let cx = 0, cy = 0, area = 0
        for (let i = 0; i < n; i++) {
            const p = pts[i], q = pts[(i + 1) % n]
            const cross = p.x * q.y - q.x * p.y
            area += cross
            cx += (p.x + q.x) * cross
            cy += (p.y + q.y) * cross
        }
        area /= 2
        if (Math.abs(area) < 1e-12) {
            // 退化多边形：取顶点平均
            for (const p of pts) { cx += p.x; cy += p.y }
            return new Vector2(cx / n, cy / n)
        }
        return new Vector2(cx / (6 * area), cy / (6 * area))
    }

    /** 缩放（相对质心） */
    scale(factor: number): Polygon {
        const c = this.centroid()
        return new Polygon(this.points.map((p) => p.clone().subtract(c).multiplyScalar(factor).add(c)))
    }

    override transform(m: Matrix2D): Polygon {
        return new Polygon(this.points.map((p) => m.applyToPoint(p.x, p.y)))
    }

    clone(): Polygon {
        return new Polygon(this.points.map((p) => p.clone()))
    }

    toString(): string {
        return `Polygon(${this.points.map((p) => `(${p.x}, ${p.y})`).join(', ')})`
    }
}

// 模块初始化时注册自身，供 ShapePrimitive.transform 延迟使用（避免循环依赖）
registerPolygonClass(Polygon)
