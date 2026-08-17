import { Vector3 } from './Vector3'
import { Line3 } from './Line3'
import { Matrix4 } from './Matrix4'
import * as MathUtils from '../../utils/MathUtils'

/**
 * 平面（三维）
 *
 * 以法向量 n 与常数 d 表示：n·p + d = 0
 */
export class Plane {
    normal: Vector3
    constant: number

    constructor(normal = new Vector3(0, 1, 0), constant = 0) {
        this.normal = normal.normalize()
        this.constant = constant
    }

    /** 由法向量与平面上一点创建 */
    static fromNormalAndPoint(normal: Vector3, point: Vector3): Plane {
        const n = normal.normalize()
        return new Plane(n, -n.dot(point))
    }

    /** 由三点创建（逆时针） */
    static fromPoints(a: Vector3, b: Vector3, c: Vector3): Plane {
        const normal = b.sub(a).cross(c.sub(a)).normalize()
        return new Plane(normal, -normal.dot(a))
    }

    set(normal: Vector3, constant: number): this {
        this.normal.copy(normal).normalizeSelf()
        this.constant = constant
        return this
    }

    copy(p: Plane): this {
        this.normal.copy(p.normal)
        this.constant = p.constant
        return this
    }

    clone(): Plane {
        return new Plane(this.normal.clone(), this.constant)
    }

    /** 点相对平面的有符号距离（正 = 法向一侧） */
    distanceToPoint(p: Vector3): number {
        return this.normal.dot(p) + this.constant
    }

    /** 点所在侧：正/负/零 */
    sideOfPoint(p: Vector3): number {
        const d = this.distanceToPoint(p)
        return Math.abs(d) < MathUtils.EPSILON ? 0 : d > 0 ? 1 : -1
    }

    /** 球是否与平面相交（或在其上） */
    intersectsSphere(center: Vector3, radius: number): boolean {
        return Math.abs(this.distanceToPoint(center)) <= radius
    }

    /** 平面上的点 */
    projectPoint(p: Vector3): Vector3 {
        return p.sub(this.normal.scale(this.distanceToPoint(p)))
    }

    /** 与直线的交点（无交点返回 null） */
    intersectLine(line: Line3): Vector3 | null {
        const dir = line.end.sub(line.start)
        const denom = this.normal.dot(dir)
        if (Math.abs(denom) < MathUtils.EPSILON) return null
        const t = -this.distanceToPoint(line.start) / denom
        if (t < 0 || t > 1) return null
        return line.at(t)
    }

    /** 归一化法向量与常数（使 |n| = 1） */
    normalize(): this {
        const len = this.normal.length()
        if (len === 0) return this
        this.normal.divide(new Vector3(len, len, len))
        this.constant /= len
        return this
    }

    negate(): this {
        this.normal = this.normal.negate()
        this.constant = -this.constant
        return this
    }

    /** 应用矩阵变换（法线用逆转置矩阵变换） */
    applyMatrix4(m: Matrix4): this {
        const point = this.projectPoint(Vector3.ZERO)
        const normal = m.applyToVector(this.normal.x, this.normal.y, this.normal.z).normalize()
        const newPoint = m.applyToVector3(point)
        this.normal = normal
        this.constant = -normal.dot(newPoint)
        return this
    }

    toString(): string {
        return `Plane(normal=${this.normal}, constant=${this.constant})`
    }
}
