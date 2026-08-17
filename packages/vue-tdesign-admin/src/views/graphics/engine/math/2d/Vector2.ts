import * as MathUtils from '../utils/MathUtils'
import { Pool } from '../utils/Pool'

export type Vector2Like = {
    x: number
    y: number
}

/**
 * 二维向量
 *
 * 除 clone / static 工厂外，运算方法均就地更新自身（通过 set），返回 this。
 */
export class Vector2 {
    static readonly ZERO = new Vector2(0, 0)
    static readonly ONE = new Vector2(1, 1)
    static readonly UP = new Vector2(0, -1)
    static readonly DOWN = new Vector2(0, 1)
    static readonly LEFT = new Vector2(-1, 0)
    static readonly RIGHT = new Vector2(1, 0)

    /** 静态对象池：复用向量实例，减少高频场景 GC 压力 */
    static readonly pool = Pool.create<Vector2>({
        initialSize: 64,
        maxSize: 128,
        create: () => Vector2.default(),
        init: (v) => v.set(0, 0),
    })
    static default() {
        return this.create(0, 0)
    }
    static create(x: number, y: number) {
        return new Vector2(x, y)
    }
    static fromPoint(v: Vector2Like) {
        return new Vector2(v.x, v.y)
    }
    static fromArray(arr: [number, number] | number[]): Vector2 {
        return new Vector2(arr[0] ?? 0, arr[1] ?? 0)
    }

    static fromPolar(radius: number, angle: number): Vector2 {
        return new Vector2(radius * Math.cos(angle), radius * Math.sin(angle))
    }

    x: number
    y: number

    constructor(x = 0, y = 0) {
        this.x = x
        this.y = y
    }

    set(x: number, y: number): this {
        this.x = x
        this.y = y
        return this
    }

    copy(v: Vector2Like): this {
        this.x = v.x
        this.y = v.y
        return this
    }

    clone(): Vector2 {
        return new Vector2(this.x, this.y)
    }

    add(v: Vector2Like): this {
        return this.addVectors(this, v)
    }

    addVectors(a: Vector2Like, b: Vector2Like): this {
        return this.set(a.x + b.x, a.y + b.y)
    }

    addScaled(v: Vector2Like, s: number): this {
        return this.set(this.x + v.x * s, this.y + v.y * s)
    }

    subtractVectors(a: Vector2Like, b: Vector2Like): this {
        return this.set(a.x - b.x, a.y - b.y)
    }

    subtract(v: Vector2Like): this {
        return this.subtractVectors(this, v)
    }
    multiplyVectors(a: Vector2Like, b: Vector2Like) {
        return this.set(a.x * b.x, a.y * b.y)
    }
    multiply(v: Vector2Like): this {
        return this.set(this.x * v.x, this.y * v.y)
    }
    multiplyScalar(v: number): this {
        return this.set(this.x * v, this.y * v)
    }
    divideVectors(a: Vector2Like, b: Vector2Like) {
        return this.set(a.x / b.x, a.y / b.y)
    }
    divide(v: Vector2Like): this {
        return this.set(this.x / v.x, this.y / v.y)
    }
    translate(dx: number, dy: number) {
        return this.set(this.x + dx, this.y + dy)
    }
    rotate(radian: number, origin?: Vector2Like) {
        const cos = Math.cos(radian), sin = Math.sin(radian)
        const x = origin ? this.x - origin.x : this.x;
        const y = origin ? this.y - origin.y : this.y
        return this.set(x * cos - y * sin, x * sin + y * cos)
    }
    scale(sx: number, sy: number): this {
        return this.set(this.x * sx, this.y * sy)
    }

    negate(): this {
        return this.set(-this.x, -this.y)
    }

    length(): number {
        return Math.hypot(this.x, this.y)
    }

    lengthSquare(): number {
        return this.x * this.x + this.y * this.y
    }

    distanceTo(v: Vector2Like): number {
        return Math.hypot(this.x - v.x, this.y - v.y)
    }

    distanceToSquare(v: Vector2Like): number {
        const dx = this.x - v.x, dy = this.y - v.y
        return dx * dx + dy * dy
    }

    /** 曼哈顿距离（L1）：|dx| + |dy| */
    manhattanDistance(v: Vector2Like): number {
        return Math.abs(this.x - v.x) + Math.abs(this.y - v.y)
    }

    /** 切比雪夫距离（L∞）：max(|dx|, |dy|) */
    chebyshevDistance(v: Vector2Like): number {
        return Math.max(Math.abs(this.x - v.x), Math.abs(this.y - v.y))
    }

    dot(v: Vector2Like): number {
        return this.x * v.x + this.y * v.y
    }

    /** 二维叉积（返回标量，其绝对值为两向量围成平行四边形面积） */
    cross(v: Vector2Like): number {
        return this.x * v.y - this.y * v.x
    }

    /** 归一化并写回自身 */
    normalize(): this {
        const len = this.length()
        if (len !== 0) {
            this.x /= len
            this.y /= len
        }
        return this
    }

    /** 垂直向量（逆时针旋转 90°），写回自身 */
    perpendicular(): this {
        return this.set(-this.y, this.x)
    }
    angle(): number {
        return Math.atan2(this.y, this.x)
    }

    /**
     * 有符号角度（this → v），范围 [-π, π]
     * 公式：Math.atan2(cross(this, v), dot(this, v))
     * 正值表示 v 在 this 的逆时针（左侧）方向，负值表示顺时针（右侧）方向
     */
    signedAngleTo(v: Vector2Like): number {
        return Math.atan2(this.cross(v), this.dot(v))
    }
    /** 逆时针旋转 90°（数学坐标系），写回自身；等价于 perpendicular() */
    ccw(): this {
        return this.set(-this.y, this.x)
    }

    /** 顺时针旋转 90°（数学坐标系），写回自身 */
    cw(): this {
        return this.set(this.y, -this.x)
    }
    angleTo(v: Vector2Like): number {
        const dot = this.dot(v)
        const len = this.length() * Math.hypot(v.x, v.y)
        return len === 0 ? 0 : Math.acos(MathUtils.clamp(dot / len, -1, 1))
    }

    /** 两点间角度（this → v） */
    angleToPoint(v: Vector2Like): number {
        return Math.atan2(v.y - this.y, v.x - this.x)
    }

    /** 限制向量最大长度，写回自身 */
    clampLength(max: number): this {
        const len = this.length()
        if (len > max) return this.multiplyScalar(max / len)
        return this
    }

    /** 逐分量线性插值，写回自身 */
    lerp(v: Vector2Like, t: number): this {
        return this.set(MathUtils.lerp(this.x, v.x, t), MathUtils.lerp(this.y, v.y, t))
    }

    /** smoothstep 插值（Hermite：t*t*(3-2t)），写回自身 */
    smoothstep(min: number, max: number, v: Vector2Like): this {
        return this.set(
            MathUtils.smoothstep(min, max, v.x),
            MathUtils.smoothstep(min, max, v.y),
        )
    }

    /** 逐分量取最小值，写回自身 */
    min(v: Vector2Like): this {
        return this.set(Math.min(this.x, v.x), Math.min(this.y, v.y))
    }

    /** 逐分量取最大值，写回自身 */
    max(v: Vector2Like): this {
        return this.set(Math.max(this.x, v.x), Math.max(this.y, v.y))
    }

    /** 逐分量取小数部分（fract），写回自身 */
    fract(): this {
        return this.set(MathUtils.fract(this.x), MathUtils.fract(this.y))
    }

    /**
     * 折射（Snell 定律）
     * @param n 法线（单位向量）
     * @param eta 折射率比（入射介质 / 折射介质）
     */
    refract(n: Vector2Like, eta: number): this {
        const dot = this.dot(n)
        const k = 1 - eta * eta * (1 - dot * dot)
        if (k < 0) {
            // 全反射
            return this.set(0, 0)
        }
        return this.set(
            eta * this.x - (eta * dot + Math.sqrt(k)) * n.x,
            eta * this.y - (eta * dot + Math.sqrt(k)) * n.y,
        )
    }

    /** 投影到另一向量，写回自身 */
    project(v: Vector2Like): this {
        const d = v.x * v.x + v.y * v.y
        if (d === 0) return this.set(0, 0)
        const k = this.dot(v) / d
        return this.set(v.x * k, v.y * k)
    }

    /** 反射（法线 n 单位向量），写回自身 */
    reflect(n: Vector2Like): this {
        const d = 2 * this.dot(n)
        return this.set(this.x - n.x * d, this.y - n.y * d)
    }

    /** 逐分量向下取整，写回自身 */
    floor(): this {
        return this.set(Math.floor(this.x), Math.floor(this.y))
    }

    /** 逐分量向上取整，写回自身 */
    ceil(): this {
        return this.set(Math.ceil(this.x), Math.ceil(this.y))
    }

    /** 逐分量四舍五入，写回自身 */
    round(): this {
        return this.set(Math.round(this.x), Math.round(this.y))
    }
    applyMatrix2D(matrix:number[]){
        return this.set(
            matrix[0]*this.x+matrix[2]*this.y+matrix[4],
            matrix[1]*this.x+matrix[3]*this.y+matrix[5],
        )
    }
    
    toArray(): [number, number] {
        return [this.x, this.y]
    }
    
    toString(): string {
        return `Vector2(${this.x}, ${this.y})`
    }
    equals(v:Vector2Like){
        return this.x===v.x&&this.y===v.y
    }
    equalsElsilon(v: Vector2Like, epsilon = 1e-6): boolean {
        return Math.abs(this.x - v.x) <= epsilon && Math.abs(this.y - v.y) <= epsilon
    }
}
