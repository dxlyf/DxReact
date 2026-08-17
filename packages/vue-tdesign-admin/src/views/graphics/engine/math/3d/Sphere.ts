import { Vector3 } from './Vector3'
import { Box3 } from './Box3'
import { Matrix4 } from './Matrix4'

/**
 * 球体
 */
export class Sphere {
    center: Vector3
    radius: number

    constructor(center = new Vector3(), radius = 0) {
        this.center = center
        this.radius = radius
    }

    set(center: Vector3, radius: number): this {
        this.center.copy(center)
        this.radius = radius
        return this
    }

    copy(s: Sphere): this {
        this.center.copy(s.center)
        this.radius = s.radius
        return this
    }

    clone(): Sphere {
        return new Sphere(this.center.clone(), this.radius)
    }

    get diameter(): number {
        return this.radius * 2
    }

    get volume(): number {
        return (4 / 3) * Math.PI * this.radius ** 3
    }

    get surfaceArea(): number {
        return 4 * Math.PI * this.radius ** 2
    }

    containsPoint(p: Vector3): boolean {
        return p.distanceToSq(this.center) <= this.radius * this.radius
    }

    intersectsSphere(s: Sphere): boolean {
        const r = this.radius + s.radius
        return this.center.distanceToSq(s.center) <= r * r
    }

    /** 由点集拟合最小包围球（Ritter 近似算法） */
    static fromPoints(points: readonly Vector3[]): Sphere {
        const sphere = new Sphere()
        if (points.length === 0) return sphere
        // 找相距最远的两点（近似）
        let a = points[0], b = points[1] ?? points[0]
        let maxDist = -1
        for (const p of points) {
            for (const q of points) {
                const d = p.distanceToSq(q)
                if (d > maxDist) {
                    maxDist = d
                    a = p
                    b = q
                }
            }
        }
        sphere.center.copy(a.lerp(b, 0.5))
        sphere.radius = a.distanceTo(b) / 2
        // 迭代扩张（Ritter 近似）
        for (const p of points) {
            const d = p.distanceTo(sphere.center)
            if (d > sphere.radius) {
                // 新半径 = (旧半径 + d) / 2，中心向 p 移动使 p 落在球面上
                sphere.radius = (sphere.radius + d) / 2
                const dir = p.sub(sphere.center).normalize()
                sphere.center = sphere.center.addScaled(dir, d - sphere.radius)
            }
        }
        return sphere
    }

    /** 外接 AABB */
    getBounds(): Box3 {
        const r = this.radius
        return new Box3(
            new Vector3(this.center.x - r, this.center.y - r, this.center.z - r),
            new Vector3(this.center.x + r, this.center.y + r, this.center.z + r),
        )
    }

    /** 应用变换（仅支持缩放/平移等，非均匀缩放会变椭球，近似处理） */
    applyMatrix4(m: Matrix4): this {
        const center = m.applyToVector3(this.center)
        const sx = Math.hypot(m.elements[0], m.elements[1], m.elements[2])
        const sy = Math.hypot(m.elements[4], m.elements[5], m.elements[6])
        const sz = Math.hypot(m.elements[8], m.elements[9], m.elements[10])
        const maxScale = Math.max(sx, sy, sz)
        this.center.copy(center)
        this.radius *= maxScale
        return this
    }

    /** 球面上一点（经度/纬度参数化） */
    pointAt(lat: number, lon: number): Vector3 {
        const r = this.radius
        return new Vector3(
            this.center.x + r * Math.cos(lat) * Math.cos(lon),
            this.center.y + r * Math.sin(lat),
            this.center.z + r * Math.cos(lat) * Math.sin(lon),
        )
    }

    toString(): string {
        return `Sphere(center=${this.center}, radius=${this.radius})`
    }
}
