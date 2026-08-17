import * as MathUtils from '../../utils/MathUtils'

/**
 * 四维向量
 *
 * 常用于齐次坐标或 RGBA 颜色。
 */
export class Vector4 {
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

    set(x: number, y: number, z: number, w: number): this {
        this.x = x; this.y = y; this.z = z; this.w = w
        return this
    }

    copy(v: Vector4): this {
        this.x = v.x; this.y = v.y; this.z = v.z; this.w = v.w
        return this
    }

    clone(): Vector4 {
        return new Vector4(this.x, this.y, this.z, this.w)
    }

    add(v: Vector4): Vector4 {
        return new Vector4(this.x + v.x, this.y + v.y, this.z + v.z, this.w + v.w)
    }

    sub(v: Vector4): Vector4 {
        return new Vector4(this.x - v.x, this.y - v.y, this.z - v.z, this.w - v.w)
    }

    multiply(v: Vector4): Vector4 {
        return new Vector4(this.x * v.x, this.y * v.y, this.z * v.z, this.w * v.w)
    }

    divide(v: Vector4): Vector4 {
        return new Vector4(this.x / v.x, this.y / v.y, this.z / v.z, this.w / v.w)
    }

    scale(s: number): Vector4 {
        return new Vector4(this.x * s, this.y * s, this.z * s, this.w * s)
    }

    negate(): Vector4 {
        return new Vector4(-this.x, -this.y, -this.z, -this.w)
    }

    length(): number {
        return Math.hypot(this.x, this.y, this.z, this.w)
    }

    lengthSq(): number {
        return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w
    }

    dot(v: Vector4): number {
        return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w
    }

    normalize(): Vector4 {
        const len = this.length()
        return len === 0 ? new Vector4() : this.scale(1 / len)
    }

    /** 齐次除法：将 (x,y,z) 除以 w，返回 Vector3 兼容的数组 */
    applyPerspectiveDivide(): [number, number, number] {
        return this.w !== 0 ? [this.x / this.w, this.y / this.w, this.z / this.w] : [this.x, this.y, this.z]
    }

    lerp(v: Vector4, t: number): Vector4 {
        return new Vector4(
            MathUtils.lerp(this.x, v.x, t),
            MathUtils.lerp(this.y, v.y, t),
            MathUtils.lerp(this.z, v.z, t),
            MathUtils.lerp(this.w, v.w, t),
        )
    }

    equals(v: Vector4, epsilon = 0): boolean {
        return (
            Math.abs(this.x - v.x) <= epsilon &&
            Math.abs(this.y - v.y) <= epsilon &&
            Math.abs(this.z - v.z) <= epsilon &&
            Math.abs(this.w - v.w) <= epsilon
        )
    }

    toArray(): [number, number, number, number] {
        return [this.x, this.y, this.z, this.w]
    }

    toString(): string {
        return `Vector4(${this.x}, ${this.y}, ${this.z}, ${this.w})`
    }

    static fromArray(arr: number[]): Vector4 {
        return new Vector4(arr[0] ?? 0, arr[1] ?? 0, arr[2] ?? 0, arr[3] ?? 1)
    }
}
