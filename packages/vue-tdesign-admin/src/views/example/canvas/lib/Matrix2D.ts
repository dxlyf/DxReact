import { Vector2Like } from "./Vector2"

export type Matrix2DLike = number[] | Float32Array
export const mapPoint = (out: Vector2Like, matrix: Matrix2DLike, point: Vector2Like) => {
    const x = point.x
    const y = point.y
    out.x = matrix[0] * x + matrix[2] * y + matrix[4]
    out.y = matrix[1] * x + matrix[3] * y + matrix[5]
    return out
}
export const mapPoints = (out: Vector2Like[], matrix: Matrix2DLike, points: Vector2Like[]) => {
    for (let i = 0; i < points.length; i++) {
        mapPoint(out[i], matrix, points[i])
    }
    return out
}
export const fromValues=(out:Matrix2DLike,a: number, b: number, c: number, d: number, tx: number, ty: number)=>{
    out[0] = a
    out[1] = b
    out[2] = c
    out[3] = d
    out[4] = tx
    out[5] = ty
    return out
}
export const fromTranslateRotationScale=(out:Matrix2DLike,tx:number,ty:number,angle:number,sx:number,sy:number)=>{
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    out[0] = sx * cos
    out[1] = sx * sin
    out[2] = sy * -sin
    out[3] = sy * cos
    out[4] = tx
    out[5] = ty
    return out
}

export class Matrix2D extends Float32Array {
    static identity() {
        return new Matrix2D()
    }
    static fromValues(a: number, b: number, c: number, d: number, tx: number, ty: number) {
        return new Matrix2D().fromValues(a, b, c, d, tx, ty)
    }
    static fromArray(array: number[]) {
        return new Matrix2D().fromArray(array)
    }
    constructor() {
        super([1, 0, 0, 1, 0, 0])
    }
    get a() {
        return this[0]
    }
    get b() {
        return this[1]
    }
    get c() {
        return this[2]
    }
    get d() {
        return this[3]
    }
    get tx() {
        return this[4]
    }
    get ty() {
        return this[5]
    }
    fromArray(array: number[]) {
        this.set(array)
        return this
    }
    fromValues(a: number, b: number, c: number, d: number, tx: number, ty: number) {
        this[0] = a
        this[1] = b
        this[2] = c
        this[3] = d
        this[4] = tx
        this[5] = ty
        return this
    }
    isIdentity() {
        return this[0] === 1 && this[1] === 0 && this[2] === 0 && this[3] === 1 && this[4] === 0 && this[5] === 0
    }
    identity() {
        this.fromValues(1, 0, 0, 1, 0, 0)
        return this
    }
    multiplyMatrices(a: Matrix2D, b: Matrix2D) {
        return this.fromValues(
            a[0] * b[0] + a[2] * b[1],
            a[1] * b[0] + a[3] * b[1],
            a[0] * b[2] + a[2] * b[3],
            a[1] * b[2] + a[3] * b[3],
            a[0] * b[4] + a[2] * b[5],
            a[1] * b[4] + a[3] * b[5],
        )
    }
    multiply(matrix: Matrix2D) {
        return this.multiplyMatrices(this, matrix)
    }
    premultiply(matrix: Matrix2D) {
        return this.multiplyMatrices(matrix, this)
    }
    translate(tx: number, ty: number) {
        return this.fromValues(
            this[0],
            this[1],
            this[2],
            this[3],
            this[0] * tx + this[2] * ty + this[4],
            this[1] * tx + this[3] * ty + this[5],
        )
    }
    scale(sx: number, sy: number) {
        return this.fromValues(
            sx * this[0],
            sx * this[1],
            sy * this[2],
            sy * this[3],
            this[4],
            this[5],
        )
    }
    rotate(angle: number) {
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        return this.fromValues(
            this[0] * cos + this[2] * sin,
            this[1] * cos + this[3] * sin,
            this[0] * -sin + this[2] * cos,
            this[1] * -sin + this[3] * cos,
            this[4],
            this[5],
        )
    }
    /** 复制另一个矩阵的值 */
    copy(matrix: Matrix2DLike): this {
        this[0] = matrix[0]
        this[1] = matrix[1]
        this[2] = matrix[2]
        this[3] = matrix[3]
        this[4] = matrix[4]
        this[5] = matrix[5]
        return this
    }
    /** 克隆为新矩阵 */
    clone(): Matrix2D {
        return new Matrix2D().copy(this)
    }
    /** 计算行列式: det = a*d - b*c */
    determinant(): number {
        return this[0] * this[3] - this[1] * this[2]
    }
    /** 求逆矩阵，不可逆时返回单位矩阵 */
    invert() {
        return this.invertTo(this)
    }
    /** 计算逆矩阵并写入 out */
    invertTo(out: Matrix2D): Matrix2D {
        const a = this[0], b = this[1], c = this[2], d = this[3], tx = this[4], ty = this[5]
        const det = a * d - b * c
        if (det === 0) {
            return out.identity()
        }
        const invDet = 1 / det
        return out.fromValues(
            d * invDet,
            -b * invDet,
            -c * invDet,
            a * invDet,
            (c * ty - d * tx) * invDet,
            (b * tx - a * ty) * invDet,
        )
    }
    /** 变换点 (x, y)，结果写入 out */
    mapPoint(out: Vector2Like, point: Vector2Like): Vector2Like {
        return mapPoint(out, this, point)
    }
    /** 变换一组点，结果写入 out 数组 */
    mapPoints(out: Vector2Like[], points: Vector2Like[]): Vector2Like[] {
        return mapPoints(out, this, points)
    }
}