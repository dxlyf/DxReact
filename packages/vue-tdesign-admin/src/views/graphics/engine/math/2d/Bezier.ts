import { Box2 } from './Box2'
import { Vector2 } from './Vector2'

/**
 * 贝塞尔曲线
 *
 * 支持二次与三次贝塞尔曲线，提供采样、包围盒、弧长近似、
 * 求值与切向计算。用于路径细分与动画插值。
 */
export class Bezier {
    // 三次贝塞尔四个控制点；二次曲线时 p1 作为二次控制点（isQuadratic=true）
    p0: Vector2
    p1: Vector2
    p2: Vector2
    p3: Vector2
    isQuadratic: boolean

    constructor(p0: Vector2, p1: Vector2, p2: Vector2, p3?: Vector2) {
        this.p0 = p0
        this.p1 = p1
        this.p2 = p2
        this.p3 = p3 ?? p2
        this.isQuadratic = p3 === undefined
    }

    static quadratic(p0: Vector2, cp: Vector2, p2: Vector2): Bezier {
        return new Bezier(p0, cp, p2)
    }

    static cubic(p0: Vector2, cp1: Vector2, cp2: Vector2, p3: Vector2): Bezier {
        return new Bezier(p0, cp1, cp2, p3)
    }

    /** 参数 t 处的点 */
    pointAt(t: number): Vector2 {
        const u = 1 - t
        if (this.isQuadratic) {
            const p0 = this.p0, p1 = this.p1, p2 = this.p2
            return new Vector2(
                u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
                u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
            )
        }
        const p0 = this.p0, p1 = this.p1, p2 = this.p2, p3 = this.p3
        const u2 = u * u, t2 = t * t
        return new Vector2(
            u2 * u * p0.x + 3 * u2 * t * p1.x + 3 * u * t2 * p2.x + t2 * t * p3.x,
            u2 * u * p0.y + 3 * u2 * t * p1.y + 3 * u * t2 * p2.y + t2 * t * p3.y,
        )
    }

    /** 参数 t 处的切向量（未归一化） */
    tangentAt(t: number): Vector2 {
        const u = 1 - t
        if (this.isQuadratic) {
            const p0 = this.p0, p1 = this.p1, p2 = this.p2
            return new Vector2(
                2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
                2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p1.y),
            )
        }
        const p0 = this.p0, p1 = this.p1, p2 = this.p2, p3 = this.p3
        const u2 = u * u, t2 = t * t
        return new Vector2(
            3 * u2 * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t2 * (p3.x - p2.x),
            3 * u2 * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t2 * (p3.y - p2.y),
        )
    }

    /** 归一化采样：按等弧长近似均匀采样（分段法） */
    getPoints(segments = 32): Vector2[] {
        const pts: Vector2[] = new Array(segments + 1)
        // 先粗采样估算累积弧长
        const fine = Math.max(segments * 4, 64)
        const lengths: number[] = new Array(fine + 1)
        lengths[0] = 0
        let prev = this.pointAt(0)
        for (let i = 1; i <= fine; i++) {
            const cur = this.pointAt(i / fine)
            lengths[i] = lengths[i - 1] + prev.distanceTo(cur)
            prev = cur
        }
        const total = lengths[fine]
        pts[0] = this.pointAt(0)
        let sampleIdx = 1
        const targetStep = total / segments
        let target = targetStep
        for (let i = 1; i <= fine && sampleIdx <= segments; i++) {
            while (lengths[i] >= target && sampleIdx <= segments) {
                // 线性插值 t
                const span = lengths[i] - lengths[i - 1]
                const frac = span === 0 ? 0 : (target - lengths[i - 1]) / span
                const t = (i - 1 + frac) / fine
                pts[sampleIdx++] = this.pointAt(t)
                target += targetStep
            }
        }
        if (pts[segments] === undefined) pts[segments] = this.pointAt(1)
        return pts
    }

    /** 近似弧长 */
    length(segments = 100): number {
        let len = 0
        let prev = this.pointAt(0)
        for (let i = 1; i <= segments; i++) {
            const cur = this.pointAt(i / segments)
            len += prev.distanceTo(cur)
            prev = cur
        }
        return len
    }

    /** 曲线包围盒（控制点凸包 + 精确极值细化） */
    getBounds(): Box2 {
        const box = new Box2()
        for (const p of this.controlPoints()) box.expandByPoint(p.x, p.y)
        // 用采样细化凸包包围盒
        const pts = this.getPoints(64)
        for (const p of pts) box.expandByPoint(p.x, p.y)
        return box
    }

    controlPoints(): Vector2[] {
        return this.isQuadratic ? [this.p0, this.p1, this.p2] : [this.p0, this.p1, this.p2, this.p3]
    }

    /** 分割为两段（de Casteljau），返回 [左段, 右段] */
    split(t: number): [Bezier, Bezier] {
        if (this.isQuadratic) {
            const p0 = this.p0, p1 = this.p1, p2 = this.p2
            const u = 1 - t
            const q0 = new Vector2(u * p0.x + t * p1.x, u * p0.y + t * p1.y)
            const q1 = new Vector2(u * p1.x + t * p2.x, u * p1.y + t * p2.y)
            const mid = new Vector2(u * q0.x + t * q1.x, u * q0.y + t * q1.y)
            return [Bezier.quadratic(p0.clone(), q0, mid), Bezier.quadratic(mid, q1, p2.clone())]
        }
        const p0 = this.p0, p1 = this.p1, p2 = this.p2, p3 = this.p3
        const u = 1 - t
        const a = new Vector2(u * p0.x + t * p1.x, u * p0.y + t * p1.y)
        const b = new Vector2(u * p1.x + t * p2.x, u * p1.y + t * p2.y)
        const c = new Vector2(u * p2.x + t * p3.x, u * p2.y + t * p3.y)
        const d = new Vector2(u * a.x + t * b.x, u * a.y + t * b.y)
        const e = new Vector2(u * b.x + t * c.x, u * b.y + t * c.y)
        const mid = new Vector2(u * d.x + t * e.x, u * d.y + t * e.y)
        return [
            Bezier.cubic(p0.clone(), a, d, mid),
            Bezier.cubic(mid, e, c, p3.clone()),
        ]
    }

    /** 扁平化细分（adaptive，基于直线近似误差） */
    flatten(maxError = 0.25): Vector2[] {
        const result: Vector2[] = [this.p0.clone()]
        const recurse = (b: Bezier, depth: number) => {
            const p0 = b.p0, p1 = b.p1, p2 = b.p2, p3 = b.p3
            // 近似误差：控制点到端点的最大距离
            let err = 0
            if (b.isQuadratic) {
                const d1 = this.distanceToLine(p1, p0, p2)
                err = d1
            } else {
                const d1 = this.distanceToLine(p1, p0, p3)
                const d2 = this.distanceToLine(p2, p0, p3)
                err = Math.max(d1, d2)
            }
            if (err <= maxError || depth >= 16) {
                result.push(p3.clone())
                return
            }
            const [l, r] = b.split(0.5)
            recurse(l, depth + 1)
            recurse(r, depth + 1)
        }
        recurse(this, 0)
        return result
    }

    private distanceToLine(p: Vector2, a: Vector2, b: Vector2): number {
        const abx = b.x - a.x, aby = b.y - a.y
        const len = Math.hypot(abx, aby)
        if (len === 0) return p.distanceTo(a)
        return Math.abs(abx * (a.y - p.y) - aby * (a.x - p.x)) / len
    }

    clone(): Bezier {
        return this.isQuadratic
            ? Bezier.quadratic(this.p0.clone(), this.p1.clone(), this.p2.clone())
            : Bezier.cubic(this.p0.clone(), this.p1.clone(), this.p2.clone(), this.p3.clone())
    }
}
