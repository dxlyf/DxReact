import { Vector3 } from './Vector3'
import { Matrix4 } from './Matrix4'
import { Euler } from './Euler'
import * as MathUtils from '../../utils/MathUtils'

/**
 * 四元数
 *
 * 表示三维旋转，避免万向锁并便于平滑插值。
 */
export class Quaternion {
    x: number
    y: number
    z: number
    w: number

    constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x
        this.y = y
        this.z = z
        this.w = w
    }

    static readonly IDENTITY = new Quaternion()

    set(x: number, y: number, z: number, w: number): this {
        this.x = x; this.y = y; this.z = z; this.w = w
        return this
    }

    copy(q: Quaternion): this {
        this.x = q.x; this.y = q.y; this.z = q.z; this.w = q.w
        return this
    }

    clone(): Quaternion {
        return new Quaternion(this.x, this.y, this.z, this.w)
    }

    /** 从旋转轴与角度（弧度）设置 */
    setFromAxisAngle(axis: Vector3, angle: number): this {
        const half = angle / 2
        const s = Math.sin(half)
        const a = axis.normalize()
        this.x = a.x * s
        this.y = a.y * s
        this.z = a.z * s
        this.w = Math.cos(half)
        return this
    }

    /** 从欧拉角设置（顺序 ZYX，对齐常见引擎约定） */
    setFromEuler(euler: Euler): this {
        const { x, y, z } = euler
        const c1 = Math.cos(x / 2), c2 = Math.cos(y / 2), c3 = Math.cos(z / 2)
        const s1 = Math.sin(x / 2), s2 = Math.sin(y / 2), s3 = Math.sin(z / 2)
        switch (euler.order) {
            case 'XYZ':
                this.x = s1 * c2 * c3 + c1 * s2 * s3
                this.y = c1 * s2 * c3 - s1 * c2 * s3
                this.z = c1 * c2 * s3 + s1 * s2 * c3
                this.w = c1 * c2 * c3 - s1 * s2 * s3
                break
            case 'YXZ':
                this.x = s1 * c2 * c3 + c1 * s2 * s3
                this.y = c1 * s2 * c3 + s1 * c2 * s3
                this.z = c1 * c2 * s3 - s1 * s2 * c3
                this.w = c1 * c2 * c3 - s1 * s2 * s3
                break
            case 'ZXY':
                this.x = s1 * c2 * c3 - c1 * s2 * s3
                this.y = c1 * s2 * c3 + s1 * c2 * s3
                this.z = c1 * c2 * s3 + s1 * s2 * c3
                this.w = c1 * c2 * c3 - s1 * s2 * s3
                break
            case 'ZYX':
                this.x = s1 * c2 * c3 - c1 * s2 * s3
                this.y = c1 * s2 * c3 + s1 * c2 * s3
                this.z = c1 * c2 * s3 - s1 * s2 * c3
                this.w = c1 * c2 * c3 + s1 * s2 * s3
                break
            default:
                // YZX / XZY 略，采用 XYZ
                this.x = s1 * c2 * c3 + c1 * s2 * s3
                this.y = c1 * s2 * c3 - s1 * c2 * s3
                this.z = c1 * c2 * s3 + s1 * s2 * c3
                this.w = c1 * c2 * c3 - s1 * s2 * s3
        }
        return this.normalizeSelf()
    }

    /** 从旋转矩阵设置 */
    setFromRotationMatrix(m: Matrix4): this {
        const e = m.elements
        const m11 = e[0], m12 = e[4], m13 = e[8]
        const m21 = e[1], m22 = e[5], m23 = e[9]
        const m31 = e[2], m32 = e[6], m33 = e[10]
        const trace = m11 + m22 + m33
        if (trace > 0) {
            const s = 0.5 / Math.sqrt(trace + 1)
            this.w = 0.25 / s
            this.x = (m32 - m23) * s
            this.y = (m13 - m31) * s
            this.z = (m21 - m12) * s
        } else if (m11 > m22 && m11 > m33) {
            const s = 2 * Math.sqrt(1 + m11 - m22 - m33)
            this.w = (m32 - m23) / s
            this.x = 0.25 * s
            this.y = (m12 + m21) / s
            this.z = (m13 + m31) / s
        } else if (m22 > m33) {
            const s = 2 * Math.sqrt(1 + m22 - m11 - m33)
            this.w = (m13 - m31) / s
            this.x = (m12 + m21) / s
            this.y = 0.25 * s
            this.z = (m23 + m32) / s
        } else {
            const s = 2 * Math.sqrt(1 + m33 - m11 - m22)
            this.w = (m21 - m12) / s
            this.x = (m13 + m31) / s
            this.y = (m23 + m32) / s
            this.z = 0.25 * s
        }
        return this.normalizeSelf()
    }

    /** 从两个方向向量设置（最短旋转） */
    setFromUnitVectors(from: Vector3, to: Vector3): this {
        const f = from.normalize()
        const t = to.normalize()
        const dot = f.dot(t)
        if (dot > 1 - 1e-6) return this.set(0, 0, 0, 1)
        if (dot < -1 + 1e-6) {
            // 180°：任意垂直轴
            const axis = f.cross(new Vector3(1, 0, 0))
            const a = axis.lengthSq() < 1e-6 ? f.cross(new Vector3(0, 1, 0)) : axis
            return this.setFromAxisAngle(a.normalize(), Math.PI)
        }
        const axis = f.cross(t)
        const w = Math.sqrt(f.lengthSq() * t.lengthSq()) + dot
        return this.set(axis.x, axis.y, axis.z, w).normalizeSelf()
    }

    /** 长度 */
    length(): number {
        return Math.hypot(this.x, this.y, this.z, this.w)
    }

    lengthSq(): number {
        return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w
    }

    normalize(): Quaternion {
        const len = this.length()
        return len === 0 ? new Quaternion() : new Quaternion(this.x / len, this.y / len, this.z / len, this.w / len)
    }

    normalizeSelf(): this {
        const len = this.length()
        if (len !== 0) {
            this.x /= len; this.y /= len; this.z /= len; this.w /= len
        }
        return this
    }

    /** 共轭（逆，对单位四元数） */
    conjugate(): Quaternion {
        return new Quaternion(-this.x, -this.y, -this.z, this.w)
    }

    invert(): Quaternion {
        const lenSq = this.lengthSq()
        const c = this.conjugate()
        return lenSq === 0 ? c : new Quaternion(c.x / lenSq, c.y / lenSq, c.z / lenSq, c.w / lenSq)
    }

    /** 乘法：this * q（表示先 this 后 q 的旋转合成，返回新四元数） */
    multiply(q: Quaternion): Quaternion {
        const { x, y, z, w } = this
        const qx = q.x, qy = q.y, qz = q.z, qw = q.w
        return new Quaternion(
            w * qx + x * qw + y * qz - z * qy,
            w * qy - x * qz + y * qw + z * qx,
            w * qz + x * qy - y * qx + z * qw,
            w * qw - x * qx - y * qy - z * qz,
        )
    }

    /** 原位乘法 */
    multiplySelf(q: Quaternion): this {
        const r = this.multiply(q)
        return this.copy(r)
    }

    /** 旋转向量 */
    applyToVector3(v: Vector3): Vector3 {
        // v' = q * v * q^-1
        const q = this
        const qv = new Quaternion(v.x, v.y, v.z, 0)
        const result = q.multiply(qv).multiply(q.conjugate())
        return new Vector3(result.x, result.y, result.z)
    }

    /** 球面线性插值 */
    slerp(target: Quaternion, t: number): Quaternion {
        if (t <= 0) return this.clone()
        if (t >= 1) return target.clone()
        let cosHalfTheta = this.x * target.x + this.y * target.y + this.z * target.z + this.w * target.w
        let qTarget = target
        if (cosHalfTheta < 0) {
            qTarget = new Quaternion(-target.x, -target.y, -target.z, -target.w)
            cosHalfTheta = -cosHalfTheta
        }
        if (cosHalfTheta >= 1) return this.clone()
        const halfTheta = Math.acos(MathUtils.clamp(cosHalfTheta, -1, 1))
        const sinHalfTheta = Math.sqrt(1 - cosHalfTheta * cosHalfTheta)
        if (Math.abs(sinHalfTheta) < 1e-6) {
            return new Quaternion(
                MathUtils.lerp(this.x, qTarget.x, t),
                MathUtils.lerp(this.y, qTarget.y, t),
                MathUtils.lerp(this.z, qTarget.z, t),
                MathUtils.lerp(this.w, qTarget.w, t),
            )
        }
        const ra = Math.sin((1 - t) * halfTheta) / sinHalfTheta
        const rb = Math.sin(t * halfTheta) / sinHalfTheta
        return new Quaternion(
            this.x * ra + qTarget.x * rb,
            this.y * ra + qTarget.y * rb,
            this.z * ra + qTarget.z * rb,
            this.w * ra + qTarget.w * rb,
        )
    }

    /** 转旋转矩阵 */
    toRotationMatrix(): Matrix4 {
        const { x, y, z, w } = this
        const x2 = x + x, y2 = y + y, z2 = z + z
        const xx = x * x2, xy = x * y2, xz = x * z2
        const yy = y * y2, yz = y * z2, zz = z * z2
        const wx = w * x2, wy = w * y2, wz = w * z2
        return new Matrix4([
            1 - (yy + zz), xy + wz, xz - wy, 0,
            xy - wz, 1 - (xx + zz), yz + wx, 0,
            xz + wy, yz - wx, 1 - (xx + yy), 0,
            0, 0, 0, 1,
        ])
    }

    equals(q: Quaternion, epsilon = 0): boolean {
        return (
            Math.abs(this.x - q.x) <= epsilon &&
            Math.abs(this.y - q.y) <= epsilon &&
            Math.abs(this.z - q.z) <= epsilon &&
            Math.abs(this.w - q.w) <= epsilon
        )
    }

    toArray(): [number, number, number, number] {
        return [this.x, this.y, this.z, this.w]
    }

    toString(): string {
        return `Quaternion(${this.x}, ${this.y}, ${this.z}, ${this.w})`
    }
}
