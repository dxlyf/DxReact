import { Vector3 } from './Vector3'
import { Matrix4 } from './Matrix4'

/**
 * 线段（三维）
 */
export class Line3 {
    start: Vector3
    end: Vector3

    constructor(start = new Vector3(), end = new Vector3()) {
        this.start = start
        this.end = end
    }

    get direction(): Vector3 {
        return this.end.sub(this.start).normalize()
    }

    get length(): number {
        return this.start.distanceTo(this.end)
    }

    get lengthSq(): number {
        return this.start.distanceToSq(this.end)
    }

    set(start: Vector3, end: Vector3): this {
        this.start.copy(start)
        this.end.copy(end)
        return this
    }

    copy(line: Line3): this {
        this.start.copy(line.start)
        this.end.copy(line.end)
        return this
    }

    clone(): Line3 {
        return new Line3(this.start.clone(), this.end.clone())
    }

    /** t 处的点 */
    at(t: number): Vector3 {
        return this.start.lerp(this.end, t)
    }

    get center(): Vector3 {
        return this.at(0.5)
    }

    /** 线段上离点最近的点 */
    closestPointToPoint(p: Vector3): { point: Vector3; t: number } {
        const d = this.end.sub(this.start)
        const lenSq = d.lengthSq()
        if (lenSq === 0) return { point: this.start.clone(), t: 0 }
        const t = Math.max(0, Math.min(1, p.sub(this.start).dot(d) / lenSq))
        return { point: this.start.addScaled(d, t), t }
    }

    /** 点到线段最短距离 */
    distanceToPoint(p: Vector3): number {
        return p.distanceTo(this.closestPointToPoint(p).point)
    }

    /** 与另一线段最近的两点（返回 [t1, t2]） */
    closestPointsToLine(other: Line3): { t1: number; t2: number } {
        const p1 = this.start, p2 = this.end
        const p3 = other.start, p4 = other.end
        const d1 = p2.sub(p1)
        const d2 = p4.sub(p3)
        const r = p1.sub(p3)
        const a = d1.dot(d1), e = d2.dot(d2)
        const f = d2.dot(r)
        let t1 = 0, t2 = 0
        if (a <= 1e-9 && e <= 1e-9) {
            t1 = t2 = 0
        } else if (a <= 1e-9) {
            t1 = 0
            t2 = Math.max(0, Math.min(1, f / e))
        } else {
            const c = d1.dot(r)
            const b = d1.dot(d2)
            const denom = a * e - b * b
            if (denom !== 0) {
                t1 = Math.max(0, Math.min(1, (b * f - c * e) / denom))
            } else {
                t1 = 0
            }
            t2 = (b * t1 + f) / e
            if (t2 < 0) {
                t2 = 0
                t1 = Math.max(0, Math.min(1, -c / a))
            } else if (t2 > 1) {
                t2 = 1
                t1 = Math.max(0, Math.min(1, (b - c) / a))
            }
        }
        return { t1, t2 }
    }

    /** 是否相交 */
    intersects(other: Line3): boolean {
        const { t1, t2 } = this.closestPointsToLine(other)
        const p = this.at(t1)
        const q = other.at(t2)
        return p.distanceToSq(q) < 1e-10
    }

    applyMatrix4(m: Matrix4): this {
        this.start = m.applyToVector3(this.start)
        this.end = m.applyToVector3(this.end)
        return this
    }

    equals(line: Line3, epsilon = 0): boolean {
        return this.start.equals(line.start, epsilon) && this.end.equals(line.end, epsilon)
    }

    toString(): string {
        return `Line3(${this.start} → ${this.end})`
    }
}
