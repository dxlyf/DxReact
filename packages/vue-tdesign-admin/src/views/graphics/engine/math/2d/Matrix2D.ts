import { Vector2 } from './Vector2'
import * as MathUtils from '../utils/MathUtils'

export type Matrix2DLike = number[]|Float32Array

/** 列向量表示：| a c e |
 *             | b d f |
 *             | 0 0 1 |
 * 本类继承 Float32Array（长度 6），元素以 [a, b, c, d, e, f] 顺序存储。
 */
export class Matrix2D extends Float32Array {
    static readonly IDENTITY = new Matrix2D()

    static default(): Matrix2D {
        return new Matrix2D(1, 0, 0, 1, 0, 0)
    }

    static fromValues(a = 1, b = 0, c = 0, d = 1, e = 0, f = 0): Matrix2D {
        return new Matrix2D(a, b, c, d, e, f)
    }

    /** 由数组 [a, b, c, d, e, f] 创建 */
    static fromArray(arr: Matrix2DLike): Matrix2D {
        if (arr.length < 6) throw new Error('Matrix2D.fromArray 至少需要 6 个元素')
        return new Matrix2D(arr[0], arr[1], arr[2], arr[3], arr[4], arr[5])
    }

    static fromTranslation(tx: number, ty: number): Matrix2D {
        return new Matrix2D(1, 0, 0, 1, tx, ty)
    }

    static fromRotation(rad: number): Matrix2D {
        const cos = Math.cos(rad), sin = Math.sin(rad)
        return new Matrix2D(cos, sin, -sin, cos, 0, 0)
    }

    static fromScaling(sx: number, sy = sx): Matrix2D {
        return new Matrix2D(sx, 0, 0, sy, 0, 0)
    }

    static fromSkewing(ax: number, ay: number): Matrix2D {
        return new Matrix2D(1, Math.tan(ay), Math.tan(ax), 1, 0, 0)
    }

    constructor(a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) {
        super([a, b, c, d, e, f])
    }

    get a(): number { return this[0] }
    set a(v: number) { this[0] = v }
    get b(): number { return this[1] }
    set b(v: number) { this[1] = v }
    get c(): number { return this[2] }
    set c(v: number) { this[2] = v }
    get d(): number { return this[3] }
    set d(v: number) { this[3] = v }
    get e(): number { return this[4] }
    set e(v: number) { this[4] = v }
    get f(): number { return this[5] }
    set f(v: number) { this[5] = v }

    /**
     * 赋值矩阵（覆盖原生 set，同时兼容原生 set(array, offset)）
     */
    set(a: ArrayLike<number> | number, b = 0, c = 0, d = 0, e = 0, f = 0): this {
        if (typeof a === 'number') {
            this[0] = a
            this[1] = b
            this[2] = c
            this[3] = d
            this[4] = e
            this[5] = f
        } else {
            super.set(a, b)
        }
        return this
    }

    copy(m: Matrix2DLike): this {
        return this.set(m)
    }

    clone(): Matrix2D {
        const m = new Matrix2D()
        m.copy(this)
        return m
    }

    reset(): this {
        return this.set(1, 0, 0, 1, 0, 0)
    }

    /** 应用变换到点，返回新点 */
    applyToPoint(x: number, y: number, out?: Vector2): Vector2 {
        const px = this.a * x + this.c * y + this.e
        const py = this.b * x + this.d * y + this.f
        if (out) return out.set(px, py)
        return new Vector2(px, py)
    }

    /** 应用变换到向量（忽略平移），返回新向量 */
    applyToVector(x: number, y: number, out?: Vector2): Vector2 {
        const px = this.a * x + this.c * y
        const py = this.b * x + this.d * y
        if (out) return out.set(px, py)
        return new Vector2(px, py)
    }

    /**
     * 矩阵乘法：this = this * m（后应用的变换先乘）
     */
    multiply(m: Matrix2DLike): this {
        const a = this.a, b = this.b, c = this.c, d = this.d, e = this.e, f = this.f
        const ma = m[0], mb = m[1], mc = m[2], md = m[3], me = m[4], mf = m[5]
        this.a = a * ma + c * mb
        this.b = b * ma + d * mb
        this.c = a * mc + c * md
        this.d = b * mc + d * md
        this.e = a * me + c * mf + e
        this.f = b * me + d * mf + f
        return this
    }

    /** 返回 this * m 的新矩阵 */
    multiplied(m: Matrix2DLike): Matrix2D {
        return this.clone().multiply(m)
    }

    /**
     * 矩阵连乘：this = this * m1 * m2 * ...
     * 依次 multiply 传入的矩阵
     */
    multiplyMatrices(...matrices: Matrix2DLike[]): this {
        for (const m of matrices) this.multiply(m)
        return this
    }

    /** 静态连乘：返回 m1 * m2 * ... 的新矩阵 */
    static multiplyMatrices(...matrices: Matrix2DLike[]): Matrix2D {
        if (matrices.length === 0) return new Matrix2D()
        const result = Matrix2D.fromArray(matrices[0])
        for (let i = 1; i < matrices.length; i++) result.multiply(matrices[i])
        return result
    }

    /** 前置乘法：this = m * this */
    premultiply(m: Matrix2DLike): this {
        const ma = m[0], mb = m[1], mc = m[2], md = m[3], me = m[4], mf = m[5]
        const a = this.a, b = this.b, c = this.c, d = this.d, e = this.e, f = this.f
        this.a = ma * a + mc * b
        this.b = mb * a + md * b
        this.c = ma * c + mc * d
        this.d = mb * c + md * d
        this.e = ma * e + mc * f + me
        this.f = mb * e + md * f + mf
        return this
    }

    /** 求逆（可能为奇异矩阵） */
    invert(): this {
        const { a, b, c, d, e, f } = this
        const det = a * d - c * b
        if (Math.abs(det) < MathUtils.EPSILON) {
            throw new Error('Matrix2D 不可逆（行列式为 0）')
        }
        const inv = 1 / det
        this.a = d * inv
        this.b = -b * inv
        this.c = -c * inv
        this.d = a * inv
        this.e = (c * f - d * e) * inv
        this.f = (b * e - a * f) * inv
        return this
    }
    inverted(): Matrix2D {
        return this.clone().invert()
    }

    determinant(): number {
        return this.a * this.d - this.c * this.b
    }

    /** 行列式近似为 0 时返回 true */
    isSingular(epsilon = MathUtils.EPSILON): boolean {
        return Math.abs(this.determinant()) < epsilon
    }

    /** 平移 */
    translate(tx: number, ty: number): this {
        return this.multiply(Matrix2D.fromTranslation(tx, ty))
    }

    /** 旋转 */
    rotate(rad: number): this {
        return this.multiply(Matrix2D.fromRotation(rad))
    }

    /** 缩放 */
    scale(sx: number, sy = sx): this {
        return this.multiply(Matrix2D.fromScaling(sx, sy))
    }

    /** 斜切 */
    skew(ax: number, ay: number): this {
        return this.multiply(Matrix2D.fromSkewing(ax, ay))
    }

    /** 分解：平移 + 旋转 + 缩放（返回分解结果） */
    decompose(): { translation: Vector2; rotation: number; scale: Vector2; skew: number } {
        const a = this.a, b = this.b, c = this.c, d = this.d
        const skewX = Math.atan2(-c, d)
        const delta = Math.abs(skewX) > Math.PI / 2 ? -1 : 1
        const scaleX = delta * Math.hypot(a, b)
        const scaleY = delta * Math.hypot(c, d)
        const rotation = Math.atan2(b, a)
        const skew = Math.atan2(c, d) - rotation
        return {
            translation: new Vector2(this.e, this.f),
            rotation,
            scale: new Vector2(scaleX, scaleY),
            skew,
        }
    }

    toArray(): [number, number, number, number, number, number] {
        return [this.a, this.b, this.c, this.d, this.e, this.f]
    }

    toDOMMatrix(): DOMMatrix {
        return new DOMMatrix([this.a, this.b, this.c, this.d, this.e, this.f])
    }

    toCSS(): string {
        return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`
    }

    equalsEpsilon(m: Matrix2DLike, epsilon = 1e-6): boolean {
        return (
            Math.abs(this.a - m[0]) <= epsilon &&
            Math.abs(this.b - m[1]) <= epsilon &&
            Math.abs(this.c - m[2]) <= epsilon &&
            Math.abs(this.d - m[3]) <= epsilon &&
            Math.abs(this.e - m[4]) <= epsilon &&
            Math.abs(this.f - m[5]) <= epsilon
        )
    }

    toString(): string {
        return `Matrix2D(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`
    }
}
