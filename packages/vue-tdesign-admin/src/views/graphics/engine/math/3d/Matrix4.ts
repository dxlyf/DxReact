import { Vector3 } from './Vector3'
import * as MathUtils from '../utils/MathUtils'

/**
 * 4×4 矩阵（列主序）
 *
 * 元素存储为列主序数组：elements[col * 4 + row]。
 * 提供平移/旋转/缩放/透视矩阵构造与组合、逆、转置等操作。
 */
export class Matrix4 {
    /** 列主序 16 个元素 */
    elements: number[]

    constructor(elements?: number[]) {
        this.elements = elements
            ? elements.slice(0, 16)
            : [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1,
            ]
    }

    static readonly IDENTITY = new Matrix4()

    static fromArray(arr: number[]): Matrix4 {
        if (arr.length < 16) throw new Error('Matrix4.fromArray 需要 16 个元素')
        return new Matrix4(arr)
    }

    set(m11: number, m12: number, m13: number, m14: number, m21: number, m22: number, m23: number, m24: number, m31: number, m32: number, m33: number, m34: number, m41: number, m42: number, m43: number, m44: number): this {
        const e = this.elements
        e[0] = m11; e[4] = m12; e[8] = m13; e[12] = m14
        e[1] = m21; e[5] = m22; e[9] = m23; e[13] = m24
        e[2] = m31; e[6] = m32; e[10] = m33; e[14] = m34
        e[3] = m41; e[7] = m42; e[11] = m43; e[15] = m44
        return this
    }

    copy(m: Matrix4): this {
        this.elements = m.elements.slice()
        return this
    }

    clone(): Matrix4 {
        return new Matrix4(this.elements)
    }

    reset(): this {
        return this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)
    }

    /** 矩阵乘法：this = this * m */
    multiply(m: Matrix4): this {
        const a = this.elements, b = m.elements
        const result = new Array(16)
        for (let c = 0; c < 4; c++) {
            for (let r = 0; r < 4; r++) {
                result[c * 4 + r] =
                    a[0 * 4 + r] * b[c * 4 + 0] +
                    a[1 * 4 + r] * b[c * 4 + 1] +
                    a[2 * 4 + r] * b[c * 4 + 2] +
                    a[3 * 4 + r] * b[c * 4 + 3]
            }
        }
        this.elements = result
        return this
    }

    multiplied(m: Matrix4): Matrix4 {
        return this.clone().multiply(m)
    }

    premultiply(m: Matrix4): this {
        return this.copy(m.multiplied(this))
    }

    /** 矩阵 × 列向量（齐次坐标） */
    applyToPoint(x: number, y: number, z: number, w = 1): [number, number, number, number] {
        const e = this.elements
        return [
            e[0] * x + e[4] * y + e[8] * z + e[12] * w,
            e[1] * x + e[5] * y + e[9] * z + e[13] * w,
            e[2] * x + e[6] * y + e[10] * z + e[14] * w,
            e[3] * x + e[7] * y + e[11] * z + e[15] * w,
        ]
    }

    /** 应用变换到三维点（透视除法后） */
    applyToVector3(v: Vector3): Vector3 {
        const [x, y, z, w] = this.applyToPoint(v.x, v.y, v.z, 1)
        return w !== 0 ? new Vector3(x / w, y / w, z / w) : new Vector3(x, y, z)
    }

    /** 应用变换到向量（忽略平移） */
    applyToVector(x: number, y: number, z: number): Vector3 {
        const e = this.elements
        return new Vector3(
            e[0] * x + e[4] * y + e[8] * z,
            e[1] * x + e[5] * y + e[9] * z,
            e[2] * x + e[6] * y + e[10] * z,
        )
    }

    transpose(): this {
        const e = this.elements
        return this.set(
            e[0], e[1], e[2], e[3],
            e[4], e[5], e[6], e[7],
            e[8], e[9], e[10], e[11],
            e[12], e[13], e[14], e[15],
        )
    }

    get determinant(): number {
        const e = this.elements
        const b00 = e[0] * e[5] - e[1] * e[4]
        const b01 = e[0] * e[6] - e[2] * e[4]
        const b02 = e[0] * e[7] - e[3] * e[4]
        const b03 = e[1] * e[6] - e[2] * e[5]
        const b04 = e[1] * e[7] - e[3] * e[5]
        const b05 = e[2] * e[7] - e[3] * e[6]
        const b06 = e[8] * e[13] - e[9] * e[12]
        const b07 = e[8] * e[14] - e[10] * e[12]
        const b08 = e[8] * e[15] - e[11] * e[12]
        const b09 = e[9] * e[14] - e[10] * e[13]
        const b10 = e[9] * e[15] - e[11] * e[13]
        const b11 = e[10] * e[15] - e[11] * e[14]
        return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06
    }

    invert(): this {
        const e = this.elements
        const b00 = e[0] * e[5] - e[1] * e[4]
        const b01 = e[0] * e[6] - e[2] * e[4]
        const b02 = e[0] * e[7] - e[3] * e[4]
        const b03 = e[1] * e[6] - e[2] * e[5]
        const b04 = e[1] * e[7] - e[3] * e[5]
        const b05 = e[2] * e[7] - e[3] * e[6]
        const b06 = e[8] * e[13] - e[9] * e[12]
        const b07 = e[8] * e[14] - e[10] * e[12]
        const b08 = e[8] * e[15] - e[11] * e[12]
        const b09 = e[9] * e[14] - e[10] * e[13]
        const b10 = e[9] * e[15] - e[11] * e[13]
        const b11 = e[10] * e[15] - e[11] * e[14]
        const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06
        if (Math.abs(det) < MathUtils.EPSILON) throw new Error('Matrix4 不可逆')
        const inv = 1 / det
        return this.set(
            (e[5] * b11 - e[6] * b10 + e[7] * b09) * inv,
            (e[2] * b10 - e[1] * b11 - e[3] * b09) * inv,
            (e[13] * b05 - e[14] * b04 + e[15] * b03) * inv,
            (e[10] * b04 - e[9] * b05 - e[11] * b03) * inv,
            (e[6] * b08 - e[4] * b11 - e[7] * b07) * inv,
            (e[0] * b11 - e[2] * b08 + e[3] * b07) * inv,
            (e[14] * b02 - e[12] * b05 - e[15] * b01) * inv,
            (e[8] * b05 - e[10] * b02 + e[11] * b01) * inv,
            (e[4] * b10 - e[5] * b08 + e[7] * b06) * inv,
            (e[1] * b08 - e[0] * b10 - e[3] * b06) * inv,
            (e[12] * b04 - e[13] * b02 + e[15] * b00) * inv,
            (e[9] * b02 - e[8] * b04 - e[11] * b00) * inv,
            (e[5] * b07 - e[4] * b09 - e[6] * b06) * inv,
            (e[0] * b09 - e[1] * b07 + e[2] * b06) * inv,
            (e[13] * b01 - e[12] * b03 - e[14] * b00) * inv,
            (e[8] * b03 - e[9] * b01 + e[10] * b00) * inv,
        )
    }

    inverted(): Matrix4 {
        return this.clone().invert()
    }

    // ---- 构造 ----

    static translation(x: number, y: number, z: number): Matrix4 {
        return new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1])
    }

    static rotationX(rad: number): Matrix4 {
        const c = Math.cos(rad), s = Math.sin(rad)
        return new Matrix4([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1])
    }

    static rotationY(rad: number): Matrix4 {
        const c = Math.cos(rad), s = Math.sin(rad)
        return new Matrix4([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1])
    }

    static rotationZ(rad: number): Matrix4 {
        const c = Math.cos(rad), s = Math.sin(rad)
        return new Matrix4([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
    }

    /** 绕任意轴旋转 */
    static rotationAxis(axis: Vector3, rad: number): Matrix4 {
        const a = axis.normalize()
        const x = a.x, y = a.y, z = a.z
        const c = Math.cos(rad), s = Math.sin(rad), t = 1 - c
        return new Matrix4([
            t * x * x + c, t * x * y + s * z, t * x * z - s * y, 0,
            t * x * y - s * z, t * y * y + c, t * y * z + s * x, 0,
            t * x * z + s * y, t * y * z - s * x, t * z * z + c, 0,
            0, 0, 0, 1,
        ])
    }

    static scaling(x: number, y: number, z: number): Matrix4 {
        return new Matrix4([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1])
    }

    /** 平移后加旋转缩放：由位置、四元数、缩放构建 */
    static compose(position: Vector3, quaternion: { x: number; y: number; z: number; w: number }, scale: Vector3): Matrix4 {
        const { x, y, z, w } = quaternion
        const x2 = x + x, y2 = y + y, z2 = z + z
        const xx = x * x2, xy = x * y2, xz = x * z2
        const yy = y * y2, yz = y * z2, zz = z * z2
        const wx = w * x2, wy = w * y2, wz = w * z2
        const sx = scale.x, sy = scale.y, sz = scale.z
        return new Matrix4([
            (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
            (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
            (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
            position.x, position.y, position.z, 1,
        ])
    }

    /** 透视投影矩阵 */
    static perspective(fovRadians: number, aspect: number, near: number, far: number): Matrix4 {
        const f = 1 / Math.tan(fovRadians / 2)
        const nf = 1 / (near - far)
        return new Matrix4([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, 2 * far * near * nf, 0,
        ])
    }

    /** 正交投影矩阵 */
    static orthographic(left: number, right: number, top: number, bottom: number, near: number, far: number): Matrix4 {
        const lr = 1 / (left - right)
        const bt = 1 / (bottom - top)
        const nf = 1 / (near - far)
        return new Matrix4([
            -2 * lr, 0, 0, 0,
            0, -2 * bt, 0, 0,
            0, 0, 2 * nf, 0,
            (left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1,
        ])
    }

    /** 从位置看向目标构建视图矩阵 */
    static lookAt(eye: Vector3, target: Vector3, up: Vector3 = Vector3.UP): Matrix4 {
        const z = eye.sub(target).normalize()
        const x = up.cross(z).normalize()
        const y = z.cross(x)
        return new Matrix4([
            x.x, y.x, z.x, 0,
            x.y, y.y, z.y, 0,
            x.z, y.z, z.z, 0,
            -x.dot(eye), -y.dot(eye), -z.dot(eye), 1,
        ])
    }

    /** 视图矩阵的平移列（eye 位置） */
    getPosition(): Vector3 {
        return new Vector3(this.elements[12], this.elements[13], this.elements[14])
    }

    equals(m: Matrix4, epsilon = 0): boolean {
        for (let i = 0; i < 16; i++) {
            if (Math.abs(this.elements[i] - m.elements[i]) > epsilon) return false
        }
        return true
    }

    toArray(): number[] {
        return this.elements.slice()
    }

    toString(): string {
        return `Matrix4(${this.elements.join(', ')})`
    }
}
