import * as MathUtils from '../utils/MathUtils'

/**
 * 3×3 矩阵（列主序）
 *
 * 元素存储为列主序数组：elements[col * 3 + row]。
 * 用于 2D 齐次变换、法线变换等。
 */
export class Matrix3 {
    /** 列主序 9 个元素 */
    elements: number[]

    constructor(elements?: number[]) {
        this.elements = elements
            ? elements.slice(0, 9)
            : [
                1, 0, 0,
                0, 1, 0,
                0, 0, 1,
            ]
    }

    static readonly IDENTITY = new Matrix3()

    static fromArray(arr: number[]): Matrix3 {
        if (arr.length < 9) throw new Error('Matrix3.fromArray 需要 9 个元素')
        return new Matrix3(arr)
    }

    /** 元素赋值（列主序） */
    set(m11: number, m12: number, m13: number, m21: number, m22: number, m23: number, m31: number, m32: number, m33: number): this {
        const e = this.elements
        e[0] = m11; e[3] = m12; e[6] = m13
        e[1] = m21; e[4] = m22; e[7] = m23
        e[2] = m31; e[5] = m32; e[8] = m33
        return this
    }

    copy(m: Matrix3): this {
        this.elements = m.elements.slice()
        return this
    }

    clone(): Matrix3 {
        return new Matrix3(this.elements)
    }

    reset(): this {
        return this.set(1, 0, 0, 0, 1, 0, 0, 0, 1)
    }

    /** 矩阵乘法：this = this * m */
    multiply(m: Matrix3): this {
        const a = this.elements, b = m.elements
        const result = new Array(9)
        for (let c = 0; c < 3; c++) {
            for (let r = 0; r < 3; r++) {
                result[c * 3 + r] =
                    a[0 * 3 + r] * b[c * 3 + 0] +
                    a[1 * 3 + r] * b[c * 3 + 1] +
                    a[2 * 3 + r] * b[c * 3 + 2]
            }
        }
        this.elements = result
        return this
    }

    multiplied(m: Matrix3): Matrix3 {
        return this.clone().multiply(m)
    }

    premultiply(m: Matrix3): this {
        return this.copy(m.multiplied(this))
    }

    /** 矩阵 × 列向量 */
    applyToVector3(x: number, y: number, z: number): [number, number, number] {
        const e = this.elements
        return [
            e[0] * x + e[3] * y + e[6] * z,
            e[1] * x + e[4] * y + e[7] * z,
            e[2] * x + e[5] * y + e[8] * z,
        ]
    }

    transpose(): this {
        const e = this.elements
        return this.set(e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8])
    }

    transposeOf(m: Matrix3): this {
        this.copy(m)
        return this.transpose()
    }

    get determinant(): number {
        const e = this.elements
        const a = e[0], b = e[3], c = e[6]
        const d = e[1], f = e[4], g = e[7]
        const h = e[2], i = e[5], j = e[8]
        return a * (f * j - g * i) - b * (d * j - g * h) + c * (d * i - f * h)
    }

    invert(): this {
        const e = this.elements
        const det = this.determinant
        if (Math.abs(det) < MathUtils.EPSILON) throw new Error('Matrix3 不可逆')
        const inv = 1 / det
        const a = e[0], b = e[3], c = e[6]
        const d = e[1], f = e[4], g = e[7]
        const h = e[2], i = e[5], j = e[8]
        return this.set(
            (f * j - g * i) * inv, (c * i - b * j) * inv, (b * g - c * f) * inv,
            (g * h - d * j) * inv, (a * j - c * h) * inv, (c * d - a * g) * inv,
            (d * i - f * h) * inv, (b * h - a * i) * inv, (a * f - b * d) * inv,
        )
    }

    inverted(): Matrix3 {
        return this.clone().invert()
    }

    // ---- 构造 ----

    static translation(tx: number, ty: number): Matrix3 {
        return new Matrix3([1, 0, 0, 0, 1, 0, tx, ty, 1])
    }

    static rotation(rad: number): Matrix3 {
        const c = Math.cos(rad), s = Math.sin(rad)
        return new Matrix3([c, s, 0, -s, c, 0, 0, 0, 1])
    }

    static scaling(sx: number, sy: number): Matrix3 {
        return new Matrix3([sx, 0, 0, 0, sy, 0, 0, 0, 1])
    }

    equals(m: Matrix3, epsilon = 0): boolean {
        for (let i = 0; i < 9; i++) {
            if (Math.abs(this.elements[i] - m.elements[i]) > epsilon) return false
        }
        return true
    }

    toArray(): number[] {
        return this.elements.slice()
    }

    toString(): string {
        return `Matrix3(${this.elements.join(', ')})`
    }
}
