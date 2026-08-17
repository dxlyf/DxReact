import { Vector3 } from './Vector3'
import { Matrix4 } from './Matrix4'
import * as MathUtils from '../../utils/MathUtils'

/**
 * 三维包围盒（AABB3D）
 */
export class Box3 {
    min: Vector3
    max: Vector3

    constructor(min = new Vector3(Infinity, Infinity, Infinity), max = new Vector3(-Infinity, -Infinity, -Infinity)) {
        this.min = min
        this.max = max
    }

    static fromCenterAndSize(center: Vector3, size: Vector3): Box3 {
        const h = size.scale(0.5)
        return new Box3(center.sub(h), center.add(h))
    }

    static fromPoints(points: readonly Vector3[]): Box3 {
        const box = new Box3()
        for (const p of points) box.expandByPoint(p)
        return box
    }

    static readonly EMPTY = new Box3()

    get isEmpty(): boolean {
        return this.max.x < this.min.x || this.max.y < this.min.y || this.max.z < this.min.z
    }

    get size(): Vector3 {
        return this.isEmpty ? Vector3.ZERO : this.max.sub(this.min)
    }

    get center(): Vector3 {
        return this.min.add(this.max).scale(0.5)
    }

    get width(): number {
        return this.size.x
    }

    get height(): number {
        return this.size.y
    }

    get depth(): number {
        return this.size.z
    }

    set(min: Vector3, max: Vector3): this {
        this.min.copy(min)
        this.max.copy(max)
        return this
    }

    copy(b: Box3): this {
        this.min.copy(b.min)
        this.max.copy(b.max)
        return this
    }

    clone(): Box3 {
        return new Box3(this.min.clone(), this.max.clone())
    }

    expandByPoint(p: Vector3): this {
        if (this.isEmpty) {
            this.min.copy(p)
            this.max.copy(p)
        } else {
            this.min = Vector3.min(this.min, p)
            this.max = Vector3.max(this.max, p)
        }
        return this
    }

    expandByBox(b: Box3): this {
        if (b.isEmpty) return this
        this.min = Vector3.min(this.min, b.min)
        this.max = Vector3.max(this.max, b.max)
        return this
    }

    expandByScalar(v: number): this {
        this.min = this.min.scale(1).add(new Vector3(-v, -v, -v))
        this.max = this.max.add(new Vector3(v, v, v))
        return this
    }

    containsPoint(p: Vector3): boolean {
        return p.x >= this.min.x && p.x <= this.max.x && p.y >= this.min.y && p.y <= this.max.y && p.z >= this.min.z && p.z <= this.max.z
    }

    intersects(b: Box3): boolean {
        return this.max.x >= b.min.x && this.min.x <= b.max.x && this.max.y >= b.min.y && this.min.y <= b.max.y && this.max.z >= b.min.z && this.min.z <= b.max.z
    }

    /** 与球相交 */
    intersectsSphere(center: Vector3, radius: number): boolean {
        const cx = MathUtils.clamp(center.x, this.min.x, this.max.x)
        const cy = MathUtils.clamp(center.y, this.min.y, this.max.y)
        const cz = MathUtils.clamp(center.z, this.min.z, this.max.z)
        const dx = center.x - cx, dy = center.y - cy, dz = center.z - cz
        return dx * dx + dy * dy + dz * dz <= radius * radius
    }

    /** 与射线相交（slab 法） */
    intersectRay(origin: Vector3, dir: Vector3): number | null {
        let tmin = (this.min.x - origin.x) / dir.x
        let tmax = (this.max.x - origin.x) / dir.x
        if (tmin > tmax) [tmin, tmax] = [tmax, tmin]
        let tymin = (this.min.y - origin.y) / dir.y
        let tymax = (this.max.y - origin.y) / dir.y
        if (tymin > tymax) [tymin, tymax] = [tymax, tymin]
        if (tmin > tymax || tymin > tmax) return null
        if (tymin > tmin) tmin = tymin
        if (tymax < tmax) tmax = tymax
        let tzmin = (this.min.z - origin.z) / dir.z
        let tzmax = (this.max.z - origin.z) / dir.z
        if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin]
        if (tmin > tzmax || tzmin > tmax) return null
        if (tzmin > tmin) tmin = tzmin
        if (tzmax < tmax) tmax = tzmax
        return tmin >= 0 ? tmin : null
    }

    /** 变换后生成新的 AABB */
    applyMatrix4(m: Matrix4): this {
        const corners = this.corners().map((c) => m.applyToVector3(c))
        return this.set(
            Vector3.min(Vector3.min(Vector3.min(corners[0], corners[1]), Vector3.min(corners[2], corners[3])), Vector3.min(Vector3.min(corners[4], corners[5]), Vector3.min(corners[6], corners[7]))),
            Vector3.max(Vector3.max(Vector3.max(corners[0], corners[1]), Vector3.max(corners[2], corners[3])), Vector3.max(Vector3.max(corners[4], corners[5]), Vector3.max(corners[6], corners[7]))),
        )
    }

    /** 8 个角点 */
    corners(): Vector3[] {
        const { min, max } = this
        return [
            new Vector3(min.x, min.y, min.z), new Vector3(max.x, min.y, min.z),
            new Vector3(max.x, max.y, min.z), new Vector3(min.x, max.y, min.z),
            new Vector3(min.x, min.y, max.z), new Vector3(max.x, min.y, max.z),
            new Vector3(max.x, max.y, max.z), new Vector3(min.x, max.y, max.z),
        ]
    }

    /** 体积 */
    volume(): number {
        if (this.isEmpty) return 0
        const s = this.size
        return s.x * s.y * s.z
    }

    /** 点/射线最近距离 */
    distanceToPoint(p: Vector3): number {
        const cx = MathUtils.clamp(p.x, this.min.x, this.max.x)
        const cy = MathUtils.clamp(p.y, this.min.y, this.max.y)
        const cz = MathUtils.clamp(p.z, this.min.z, this.max.z)
        return Math.hypot(p.x - cx, p.y - cy, p.z - cz)
    }

    toString(): string {
        return `Box3(min=${this.min}, max=${this.max})`
    }
}
