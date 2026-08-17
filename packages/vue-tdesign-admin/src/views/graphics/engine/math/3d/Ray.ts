import { Vector3 } from './Vector3'
import { Sphere } from './Sphere'
import { Box3 } from './Box3'
import { Plane } from './Plane'
import { Matrix4 } from './Matrix4'
import * as MathUtils from '../../utils/MathUtils'

/**
 * 射线（三维）
 */
export class Ray {
    origin: Vector3
    direction: Vector3

    constructor(origin = new Vector3(), direction = new Vector3(0, 0, -1)) {
        this.origin = origin
        this.direction = direction.normalize()
    }

    set(origin: Vector3, direction: Vector3): this {
        this.origin.copy(origin)
        this.direction.copy(direction.normalize())
        return this
    }

    copy(r: Ray): this {
        this.origin.copy(r.origin)
        this.direction.copy(r.direction)
        return this
    }

    clone(): Ray {
        return new Ray(this.origin.clone(), this.direction.clone())
    }

    /** t 处的点 */
    at(t: number): Vector3 {
        return this.origin.addScaled(this.direction, t)
    }

    /** 从射线上取离目标点最近的点 */
    closestPointToPoint(p: Vector3): Vector3 {
        const t = this.direction.dot(p.sub(this.origin))
        return t <= 0 ? this.origin.clone() : this.at(t)
    }

    /** 点到射线的最短距离 */
    distanceToPoint(p: Vector3): number {
        const t = this.direction.dot(p.sub(this.origin))
        if (t <= 0) return p.distanceTo(this.origin)
        return p.distanceTo(this.at(t))
    }

    /** 与球相交，返回最近交点 t（无交点返回 null） */
    intersectSphere(sphere: Sphere): number | null {
        const oc = this.origin.sub(sphere.center)
        const a = this.direction.dot(this.direction)
        const b = 2 * oc.dot(this.direction)
        const c = oc.dot(oc) - sphere.radius * sphere.radius
        const disc = b * b - 4 * a * c
        if (disc < 0) return null
        const sqrtDisc = Math.sqrt(disc)
        const t1 = (-b - sqrtDisc) / (2 * a)
        const t2 = (-b + sqrtDisc) / (2 * a)
        if (t1 >= 0 && t2 >= 0) return Math.min(t1, t2)
        if (t1 >= 0) return t1
        if (t2 >= 0) return t2
        return null
    }

    /** 与平面相交，返回 t（平行/无交点返回 null） */
    intersectPlane(plane: Plane): number | null {
        const denom = plane.normal.dot(this.direction)
        if (Math.abs(denom) < MathUtils.EPSILON) return null
        const t = -(plane.normal.dot(this.origin) + plane.constant) / denom
        return t >= 0 ? t : null
    }

    /** 与 AABB 相交，返回最近 t */
    intersectBox(box: Box3): number | null {
        return box.intersectRay(this.origin, this.direction)
    }

    /** 与三角形相交（Möller–Trumbore），返回 t 与重心坐标 */
    intersectTriangle(a: Vector3, b: Vector3, c: Vector3, backfaceCulling = false): { t: number; u: number; v: number } | null {
        const ab = b.sub(a)
        const ac = c.sub(a)
        const pvec = this.direction.cross(ac)
        const det = ab.dot(pvec)
        if (backfaceCulling && det < MathUtils.EPSILON) return null
        if (Math.abs(det) < MathUtils.EPSILON) return null
        const invDet = 1 / det
        const tvec = this.origin.sub(a)
        const u = tvec.dot(pvec) * invDet
        if (u < 0 || u > 1) return null
        const qvec = tvec.cross(ab)
        const v = this.direction.dot(qvec) * invDet
        if (v < 0 || u + v > 1) return null
        const t = ac.dot(qvec) * invDet
        return { t, u, v }
    }

    /** 射线变换（应用矩阵后） */
    applyMatrix4(m: Matrix4): this {
        const dir = m.applyToVector(this.direction.x, this.direction.y, this.direction.z)
        this.origin = m.applyToVector3(this.origin)
        this.direction = dir.normalize()
        return this
    }

    toString(): string {
        return `Ray(origin=${this.origin}, direction=${this.direction})`
    }
}
