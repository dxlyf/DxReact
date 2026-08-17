import { Quaternion } from './Quaternion'
import { Matrix4 } from './Matrix4'
import * as MathUtils from '../../utils/MathUtils'

export type EulerOrder = 'XYZ' | 'YXZ' | 'ZXY' | 'ZYX' | 'YZX' | 'XZY'

/**
 * 欧拉角
 *
 * 以 x/y/z 三个轴向旋转角（弧度）表示，默认顺序 ZYX。
 */
export class Euler {
    x: number
    y: number
    z: number
    order: EulerOrder

    constructor(x = 0, y = 0, z = 0, order: EulerOrder = 'ZYX') {
        this.x = x
        this.y = y
        this.z = z
        this.order = order
    }

    static readonly DEFAULT_ORDER: EulerOrder = 'ZYX'

    set(x: number, y: number, z: number, order?: EulerOrder): this {
        this.x = x; this.y = y; this.z = z
        if (order) this.order = order
        return this
    }

    copy(e: Euler): this {
        this.x = e.x; this.y = e.y; this.z = e.z; this.order = e.order
        return this
    }

    clone(): Euler {
        return new Euler(this.x, this.y, this.z, this.order)
    }

    /** 转四元数 */
    toQuaternion(): Quaternion {
        return new Quaternion().setFromEuler(this)
    }

    /** 转旋转矩阵 */
    toRotationMatrix(): Matrix4 {
        return this.toQuaternion().toRotationMatrix()
    }

    /** 从四元数设置 */
    setFromQuaternion(q: Quaternion): this {
        const matrix = new Matrix4().copy(q.toRotationMatrix())
        return this.setFromRotationMatrix(matrix)
    }

    /** 从旋转矩阵设置（按 order 分解） */
    setFromRotationMatrix(m: Matrix4): this {
        const e = m.elements
        const m11 = e[0], m12 = e[4], m13 = e[8]
        const m21 = e[1], m22 = e[5], m23 = e[9]
        const m31 = e[2], m32 = e[6], m33 = e[10]

        switch (this.order) {
            case 'XYZ': {
                this.y = Math.asin(MathUtils.clamp(m13, -1, 1))
                if (Math.abs(m13) < 0.9999999) {
                    this.x = Math.atan2(-m23, m33)
                    this.z = Math.atan2(-m12, m11)
                } else {
                    this.x = Math.atan2(m32, m22)
                    this.z = 0
                }
                break
            }
            case 'YXZ': {
                this.x = Math.asin(-MathUtils.clamp(m23, -1, 1))
                if (Math.abs(m23) < 0.9999999) {
                    this.y = Math.atan2(m13, m33)
                    this.z = Math.atan2(m21, m22)
                } else {
                    this.y = Math.atan2(-m31, m11)
                    this.z = 0
                }
                break
            }
            case 'ZXY': {
                this.x = Math.asin(MathUtils.clamp(m32, -1, 1))
                if (Math.abs(m32) < 0.9999999) {
                    this.y = Math.atan2(-m31, m33)
                    this.z = Math.atan2(-m12, m22)
                } else {
                    this.y = 0
                    this.z = Math.atan2(m21, m11)
                }
                break
            }
            case 'ZYX':
            default: {
                this.y = Math.asin(-MathUtils.clamp(m31, -1, 1))
                if (Math.abs(m31) < 0.9999999) {
                    this.x = Math.atan2(m32, m33)
                    this.z = Math.atan2(m21, m11)
                } else {
                    this.x = 0
                    this.z = Math.atan2(-m12, m22)
                }
                break
            }
            case 'YZX': {
                this.z = Math.asin(MathUtils.clamp(m21, -1, 1))
                if (Math.abs(m21) < 0.9999999) {
                    this.x = Math.atan2(-m23, m22)
                    this.y = Math.atan2(-m31, m11)
                } else {
                    this.x = 0
                    this.y = Math.atan2(m13, m33)
                }
                break
            }
            case 'XZY': {
                this.z = Math.asin(-MathUtils.clamp(m12, -1, 1))
                if (Math.abs(m12) < 0.9999999) {
                    this.x = Math.atan2(m32, m22)
                    this.y = Math.atan2(m13, m11)
                } else {
                    this.x = Math.atan2(-m23, m33)
                    this.y = 0
                }
                break
            }
        }
        return this
    }

    /** 度数快捷访问 */
    get xDegrees(): number {
        return MathUtils.toDegrees(this.x)
    }

    set xDegrees(v: number) {
        this.x = MathUtils.toRadians(v)
    }

    get yDegrees(): number {
        return MathUtils.toDegrees(this.y)
    }

    set yDegrees(v: number) {
        this.y = MathUtils.toRadians(v)
    }

    get zDegrees(): number {
        return MathUtils.toDegrees(this.z)
    }

    set zDegrees(v: number) {
        this.z = MathUtils.toRadians(v)
    }

    equals(e: Euler, epsilon = 0): boolean {
        return (
            Math.abs(this.x - e.x) <= epsilon &&
            Math.abs(this.y - e.y) <= epsilon &&
            Math.abs(this.z - e.z) <= epsilon &&
            this.order === e.order
        )
    }

    toArray(): [number, number, number] {
        return [this.x, this.y, this.z]
    }

    toString(): string {
        return `Euler(${this.x}, ${this.y}, ${this.z}, order=${this.order})`
    }
}
