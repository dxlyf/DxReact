import * as MathUtils from '../../utils/MathUtils'

/**
 * 三维向量
 */
export class Vector3 {
    x: number
    y: number
    z: number

    constructor(x = 0, y = 0, z = 0) {
        this.x = x
        this.y = y
        this.z = z
    }

    static readonly ZERO = new Vector3(0, 0, 0)
    static readonly ONE = new Vector3(1, 1, 1)
    static readonly UP = new Vector3(0, 1, 0)
    static readonly DOWN = new Vector3(0, -1, 0)
    static readonly LEFT = new Vector3(-1, 0, 0)
    static readonly RIGHT = new Vector3(1, 0, 0)
    static readonly FORWARD = new Vector3(0, 0, -1)
    static readonly BACK = new Vector3(0, 0, 1)

    set(x: number, y: number, z: number): this {
        this.x = x; this.y = y; this.z = z
        return this
    }

    copy(v: Vector3): this {
        this.x = v.x; this.y = v.y; this.z = v.z
        return this
    }

    clone(): Vector3 {
        return new Vector3(this.x, this.y, this.z)
    }

    add(v: Vector3): Vector3 {
        return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z)
    }

    addScaled(v: Vector3, s: number): Vector3 {
        return new Vector3(this.x + v.x * s, this.y + v.y * s, this.z + v.z * s)
    }

    sub(v: Vector3): Vector3 {
        return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z)
    }

    multiply(v: Vector3): Vector3 {
        return new Vector3(this.x * v.x, this.y * v.y, this.z * v.z)
    }

    divide(v: Vector3): Vector3 {
        return new Vector3(this.x / v.x, this.y / v.y, this.z / v.z)
    }

    scale(s: number): Vector3 {
        return new Vector3(this.x * s, this.y * s, this.z * s)
    }

    negate(): Vector3 {
        return new Vector3(-this.x, -this.y, -this.z)
    }

    length(): number {
        return Math.hypot(this.x, this.y, this.z)
    }

    lengthSq(): number {
        return this.x * this.x + this.y * this.y + this.z * this.z
    }

    distanceTo(v: Vector3): number {
        return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z)
    }

    distanceToSq(v: Vector3): number {
        const dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z
        return dx * dx + dy * dy + dz * dz
    }

    dot(v: Vector3): number {
        return this.x * v.x + this.y * v.y + this.z * v.z
    }

    cross(v: Vector3): Vector3 {
        return new Vector3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x,
        )
    }

    normalize(): Vector3 {
        const len = this.length()
        return len === 0 ? new Vector3() : this.scale(1 / len)
    }

    normalizeSelf(): this {
        const len = this.length()
        if (len !== 0) {
            this.x /= len
            this.y /= len
            this.z /= len
        }
        return this
    }

    /** 限制最大长度 */
    clampLength(max: number): Vector3 {
        const len = this.length()
        return len > max ? this.scale(max / len) : this.clone()
    }

    lerp(v: Vector3, t: number): Vector3 {
        return new Vector3(MathUtils.lerp(this.x, v.x, t), MathUtils.lerp(this.y, v.y, t), MathUtils.lerp(this.z, v.z, t))
    }

    /** 与 v 之间的角度（弧度） */
    angleTo(v: Vector3): number {
        const denom = this.lengthSq() * v.lengthSq()
        if (denom === 0) return 0
        return Math.acos(MathUtils.clamp(this.dot(v) / Math.sqrt(denom), -1, 1))
    }

    project(v: Vector3): Vector3 {
        const d = v.dot(v)
        return d === 0 ? new Vector3() : v.scale(this.dot(v) / d)
    }

    /** 反射（法线 n 单位向量） */
    reflect(n: Vector3): Vector3 {
        return this.sub(n.scale(2 * this.dot(n)))
    }

    /** 与正交化（对 v1 正交化，返回自身减去在 v1 上的投影） */
    orthoNormalize(v1: Vector3): Vector3 {
        return this.sub(this.project(v1))
    }

    equals(v: Vector3, epsilon = 0): boolean {
        return Math.abs(this.x - v.x) <= epsilon && Math.abs(this.y - v.y) <= epsilon && Math.abs(this.z - v.z) <= epsilon
    }

    toArray(): [number, number, number] {
        return [this.x, this.y, this.z]
    }

    toString(): string {
        return `Vector3(${this.x}, ${this.y}, ${this.z})`
    }

    static fromArray(arr: number[]): Vector3 {
        return new Vector3(arr[0] ?? 0, arr[1] ?? 0, arr[2] ?? 0)
    }

    static min(a: Vector3, b: Vector3): Vector3 {
        return new Vector3(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.min(a.z, b.z))
    }

    static max(a: Vector3, b: Vector3): Vector3 {
        return new Vector3(Math.max(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z))
    }
}
