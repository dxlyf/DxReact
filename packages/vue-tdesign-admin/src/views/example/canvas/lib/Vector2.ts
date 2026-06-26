import { CachePool } from "./CachePool"
import * as MathUtils from "./MathUtils.ts"
export type Vector2Like = {
    x: number,
    y: number,
}
export const create = (x: number, y: number) => {
    return new Vector2(x, y)
}
export const fromValues = (out: Vector2Like, x: number, y: number) => {
    out.x = x
    out.y = y
    return out
}
/** 向量相加: out = a + b */
export const add = (out: Vector2Like, a: Vector2Like, b: Vector2Like) => {
    return fromValues(out, a.x + b.x, a.y + b.y)
}
/** 向量相减: out = a - b */
export const subtract = (out: Vector2Like, a: Vector2Like, b: Vector2Like) => {
    return fromValues(out, a.x - b.x, a.y - b.y)
}
/** 向量相乘: out = a * b */
export const multiply = (out: Vector2Like, a: Vector2Like, b: Vector2Like) => {
    return fromValues(out, a.x * b.x, a.y * b.y)
}
/** 向量相除: out = a / b */
export const divide = (out: Vector2Like, a: Vector2Like, b: Vector2Like) => {
    return fromValues(out, a.x / b.x, a.y / b.y)
}
/** 向量缩放: out = a * s */
export const multiplyScalar = (out: Vector2Like, a: Vector2Like, s: number) => {
    return fromValues(out, a.x * s, a.y * s)
}
/** 向量点积: a · b */
export const dot = (a: Vector2Like, b: Vector2Like): number => {
    return a.x * b.x + a.y * b.y
}
/** 二维向量叉积 (标量): a × b = a.x*b.y - a.y*b.x */
export const cross = (a: Vector2Like, b: Vector2Like): number => {
    return a.x * b.y - a.y * b.x
}
/** 向量长度（模） */
export const length = (a: Vector2Like): number => {
    return Math.sqrt(a.x * a.x + a.y * a.y)
}
/** 向量长度的平方（避免开方） */
export const lengthSq = (a: Vector2Like): number => {
    return a.x * a.x + a.y * a.y
}
/** 归一化: out = a / |a|，零向量返回零向量 */
export const normalize = (out: Vector2Like, a: Vector2Like) => {
    const len = Math.sqrt(a.x * a.x + a.y * a.y)
    if (len === 0) {
        return fromValues(out, 0, 0)
    }
    return fromValues(out, a.x / len, a.y / len)
}
/** 两点间距离: dist(a, b) = |a - b| */
export const distance = (a: Vector2Like, b: Vector2Like): number => {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return Math.sqrt(dx * dx + dy * dy)
}
/** 两点间距离的平方 */
export const distanceSq = (a: Vector2Like, b: Vector2Like): number => {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return dx * dx + dy * dy
}
/** 曼哈顿距离: |a.x - b.x| + |a.y - b.y| */
export const distanceManhattan = (a: Vector2Like, b: Vector2Like): number => {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}
/** 切比雪夫距离: max(|a.x - b.x|, |a.y - b.y|) */
export const distanceChebyshev = (a: Vector2Like, b: Vector2Like): number => {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))
}
/** 向量取反: out = -a */
export const negate = (out: Vector2Like, a: Vector2Like) => {
    return fromValues(out, -a.x, -a.y)
}
/** 线性插值: out = a + (b - a) * t */
export const lerp = (out: Vector2Like, a: Vector2Like, b: Vector2Like, t: number) => {
    return fromValues(out, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)
}
/** 绕原点旋转弧度: out = rotate(a, rad) */
export const rotate = (out: Vector2Like, a: Vector2Like, rad: number) => {
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    return fromValues(out, a.x * cos - a.y * sin, a.x * sin + a.y * cos)
}
/** 绕指定中心旋转弧度: out = rotateAround(a, center, rad) */
export const rotateAround = (out: Vector2Like, a: Vector2Like, center: Vector2Like, rad: number) => {
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const dx = a.x - center.x
    const dy = a.y - center.y
    return fromValues(out, center.x + dx * cos - dy * sin, center.y + dx * sin + dy * cos)
}
/** 平移: out = translate(a, tx, ty) */
export const translate = (out: Vector2Like, a: Vector2Like, tx: number, ty: number) => {
    return fromValues(out, a.x + tx, a.y + ty)
}
/** 缩放: out = scale(a, s)，等同于 multiplyScalar */
export const scale = (out: Vector2Like, a: Vector2Like, sx: number, sy: number) => {
    return fromValues(out, a.x * sx, a.y * sy)
}
/** 绕指定中心缩放: out = scaleAround(a, center, s) */
export const scaleAround = (out: Vector2Like, a: Vector2Like, sx: number, sy: number, cx: number, cy: number) => {
    const dx = a.x - cx
    const dy = a.y - cy
    return fromValues(out, cx + dx * sx, cy + dy * sy)
}
/** 中点: out = (a + b) / 2 */
export const midpoint = (out: Vector2Like, a: Vector2Like, b: Vector2Like) => {
    return fromValues(out, (a.x + b.x) / 2, (a.y + b.y) / 2)
}

/** 判断两个向量是否相等 */
export const equals = (a: Vector2Like, b: Vector2Like): boolean => {
    return a.x === b.x && a.y === b.y
}
/** 判断两个向量是否相等，允许误差 */
export const equalsEpsilon = (a: Vector2Like, b: Vector2Like, epsilon: number = MathUtils.EPSILON): boolean => {
    return Math.abs(a.x - b.x) <= epsilon && Math.abs(a.y - b.y) <= epsilon
}
/** 向量投影: a 在 b 上的投影 */
export const project = (out: Vector2Like, a: Vector2Like, b: Vector2Like) => {
    const dotValue = a.x * b.x + a.y * b.y
    const lenSq = b.x * b.x + b.y * b.y
    if (lenSq === 0) {
        return fromValues(out, 0, 0)
    }
    const s = dotValue / lenSq
    return fromValues(out, b.x * s, b.y * s)
}
/** 向量反射: out = reflect(a, normal)，normal 需为单位向量 */
export const reflect = (out: Vector2Like, a: Vector2Like, normal: Vector2Like) => {
    const d = a.x * normal.x + a.y * normal.y
    return fromValues(out, a.x - 2 * d * normal.x, a.y - 2 * d * normal.y)
}
/** 向量折射: out = refract(a, normal, eta)，normal 需为单位向量 */
export const refract = (out: Vector2Like, a: Vector2Like, normal: Vector2Like, eta: number) => {
    const d = a.x * normal.x + a.y * normal.y
    const k = 1 - eta * eta * (1 - d * d)
    if (k < 0) {
        return fromValues(out, 0, 0)
    }
    const sqrtK = Math.sqrt(k)
    return fromValues(out, eta * a.x - (eta * d + sqrtK) * normal.x, eta * a.y - (eta * d + sqrtK) * normal.y)
}
/** 逐分量取最小值: out = min(a, b) */
export const min = (out: Vector2Like, a: Vector2Like, b: Vector2Like) => {
    return fromValues(out, Math.min(a.x, b.x), Math.min(a.y, b.y))
}
/** 逐分量取最大值: out = max(a, b) */
export const max = (out: Vector2Like, a: Vector2Like, b: Vector2Like) => {
    return fromValues(out, Math.max(a.x, b.x), Math.max(a.y, b.y))
}
/** 逐分量钳制到 [minVal, maxVal]: out = clamp(a, minVal, maxVal) */
export const clamp = (out: Vector2Like, a: Vector2Like, minVal: number, maxVal: number) => {
    return fromValues(out, Math.min(Math.max(a.x, minVal), maxVal), Math.min(Math.max(a.y, minVal), maxVal))
}
/** 生成随机向量，各分量在 [min, max) 范围内 */
export const random = (out: Vector2Like, min: number = 0, max: number = 1): Vector2Like => {
    return fromValues(out, MathUtils.random(min, max), MathUtils.random(min, max))
}
/** 逐分量向下取整: out = floor(a) */
export const floor = (out: Vector2Like, a: Vector2Like) => {
    return fromValues(out, Math.floor(a.x), Math.floor(a.y))
}
/** 逐分量向上取整: out = ceil(a) */
export const ceil = (out: Vector2Like, a: Vector2Like) => {
    return fromValues(out, Math.ceil(a.x), Math.ceil(a.y))
}
/** 垂直向量: out = perp(a) = (-y, x) */
export const perp = (out: Vector2Like, a: Vector2Like) => {
    return fromValues(out, -a.y, a.x)
}
/** 垂直向量 (perp 的反方向): out = perpLeft(a) = (y, -x) */
export const perpLeft = (out: Vector2Like, a: Vector2Like) => {
    return fromValues(out, a.y, -a.x)
}
/** 逐分量向零取整: out = trunc(a) */
export const trunc = (out: Vector2Like, a: Vector2Like) => {
    return fromValues(out, Math.trunc(a.x), Math.trunc(a.y))
}
/** 向量的极角（弧度），范围 [-π, π] */
export const angle = (a: Vector2Like): number => {
    return Math.atan2(a.y, a.x)
}
/** a 到 b 的有符号夹角（弧度），范围 [-π, π] */
export const angleTo = (a: Vector2Like, b: Vector2Like): number => {
    return Math.atan2(cross(a, b), dot(a, b))
}
/** a 与 b 的无符号夹角（弧度），范围 [0, π] */
export const angleBetween = (a: Vector2Like, b: Vector2Like): number => {
    const d = dot(a, b)
    const la = length(a)
    const lb = length(b)
    if (la === 0 || lb === 0) return 0
    return Math.acos(Math.min(Math.max(d / (la * lb), -1), 1))
}
/** 斜切: out = skew(a, kx, ky)，kx 为 x 方向斜切系数，ky 为 y 方向斜切系数 */
export const skew = (out: Vector2Like, a: Vector2Like, kx: number, ky: number) => {
    return fromValues(out, a.x + a.y * kx, a.y + a.x * ky)
}
/** 投影标量 (有符号): a 在 b 方向上的有符号长度，即 dot(a, normalized(b)) */
export const scalarProject = (a: Vector2Like, b: Vector2Like): number => {
    const len = length(b)
    if (len === 0) return 0
    return dot(a, b) / len
}
/** 平行分量 (向量投影): a 在 b 上的平行分量，等同于 project */
export const projectParallel = project
/** 垂直分量 (向量 rejection): a 垂直于 b 的分量，out = a - project(a, b) */
export const projectPerpendicular = (out: Vector2Like, a: Vector2Like, b: Vector2Like) => {
    project(out, a, b)
    return fromValues(out, a.x - out.x, a.y - out.y)
}
/** 逐分量取符号: out = sign(a)，正数返回 1，负数返回 -1，零返回 0 */
export const sign = (out: Vector2Like, a: Vector2Like) => {
    return fromValues(out, Math.sign(a.x), Math.sign(a.y))
}
/** 逐分量绝对值: out = abs(a) */
export const abs = (out: Vector2Like, a: Vector2Like) => {
    return fromValues(out, Math.abs(a.x), Math.abs(a.y))
}
/** 对齐到网格: out = snapToGrid(a, gridSize) */
export const snapToGrid = (out: Vector2Like, a: Vector2Like, gridSize: number) => {
    return fromValues(out, Math.round(a.x / gridSize) * gridSize, Math.round(a.y / gridSize) * gridSize)
}
/** 限制最大长度: out = limit(a, maxLength) */
export const limit = (out: Vector2Like, a: Vector2Like, maxLength: number) => {
    const lenSq = a.x * a.x + a.y * a.y
    if (lenSq > maxLength * maxLength) {
        const len = Math.sqrt(lenSq)
        return fromValues(out, (a.x / len) * maxLength, (a.y / len) * maxLength)
    }
    return fromValues(out, a.x, a.y)
}
/** 归一化线性插值: out = nlerp(a, b, t)，比 lerp 更均匀地保持方向 */
export const nlerp = (out: Vector2Like, a: Vector2Like, b: Vector2Like, t: number) => {
    lerp(out, a, b, t)
    return normalize(out, out)
}
/** 球面线性插值: out = slerp(a, b, t)，保持角度匀速变化 */
export const slerp = (out: Vector2Like, a: Vector2Like, b: Vector2Like, t: number) => {
    const dotVal = Math.min(Math.max(dot(a, b), -1), 1)
    const omega = Math.acos(dotVal)
    if (Math.abs(omega) < MathUtils.EPSILON) {
        return lerp(out, a, b, t)
    }
    const sinOmega = Math.sin(omega)
    const k0 = Math.sin((1 - t) * omega) / sinOmega
    const k1 = Math.sin(t * omega) / sinOmega
    return fromValues(out, a.x * k0 + b.x * k1, a.y * k0 + b.y * k1)
}
/** 应用二维仿射变换矩阵: out = applyMatrix2D(a, m)，m 为 [a, b, c, d, tx, ty] */
export const applyMatrix2D = (out: Vector2Like, a: Vector2Like, m: Float32Array) => {
    return fromValues(out, a.x * m[0] + a.y * m[2] + m[4], a.x * m[1] + a.y * m[3] + m[5])
}

export class Vector2 implements Vector2Like {
    static pool = CachePool.create({
        initSize: 100,
        create: () => new Vector2(0, 0),
        init: (item) => {
            item.set(0, 0)
        },
    })
    static create(x: number = 0, y: number = 0): Vector2 {
        return new this(x, y)
    }
    static zero() {
        return this.create(0, 0)
    }
    static one() {
        return this.create(1, 1)
    }
    static from(v: Vector2Like): Vector2 {
        return this.create(v.x, v.y)
    }
    static fromAngle(angle: number): Vector2 {
        return this.fromRadian(MathUtils.degToRad(angle))
    }
    static fromRadian(radian: number): Vector2 {
        return this.fromCosSin(Math.cos(radian), Math.sin(radian))
    }
    static fromCosSin(cos: number, sin: number): Vector2 {
        return this.create(cos, sin)
    }
    _x: number = 0
    _y: number = 0
    constructor(x: number, y: number) {
        this._x = x
        this._y = y
    }
    get x() {
        return this._x
    }
    get y() {
        return this._y
    }
    set x(value: number) {
        this._x = value
    }
    set y(value: number) {
        this._y = value
    }
    /** 克隆当前向量 */
    clone(): Vector2 {
        return (this.constructor as typeof Vector2).create(this._x, this._y)
    }
    copy(v: Vector2Like): this {
        return this.set(v.x, v.y)
    }
    set(x: number, y: number) {
        if (this._x !== x || this._y !== y) {
            this._x = x
            this._y = y
        }
        return this
    }
    /** this += a */
    add(a: Vector2Like): this {
        return add(this, this, a) as this
    }
    /** this -= a */
    sub(a: Vector2Like): this {
        return subtract(this, this, a) as this
    }
    /** this *= s */
    multiplyScalar(s: number): this {
        return multiplyScalar(this, this, s) as this
    }
    div(a: Vector2Like): this {
        return divide(this, this, a) as this
    }
    /** this · a */
    dot(a: Vector2Like): number {
        return dot(this, a)
    }
    /** this × a (标量) */
    cross(a: Vector2Like): number {
        return cross(this, a)
    }
    /** 当前向量的长度 */
    length(): number {
        return length(this)
    }
    /** 当前向量长度的平方 */
    lengthSq(): number {
        return lengthSq(this)
    }
    /** 归一化当前向量，零向量不变 */
    normalize(): this {
        return normalize(this, this) as this
    }
    /** this 到 a 的距离 */
    distance(a: Vector2Like): number {
        return distance(this, a)
    }
    /** this 到 a 的曼哈顿距离 */
    distanceManhattan(a: Vector2Like): number {
        return distanceManhattan(this, a)
    }
    /** this 到 a 的切比雪夫距离 */
    distanceChebyshev(a: Vector2Like): number {
        return distanceChebyshev(this, a)
    }
    /** 取反: this = -this */
    negate(): this {
        return negate(this, this) as this
    }
    /** 向目标方向插值: this += (target - this) * t */
    lerp(target: Vector2Like, t: number): this {
        return lerp(this, this, target, t) as this
    }
    /** 平移: this += offset */
    translate(tx: number, ty: number): this {
        return translate(this, this, tx, ty) as this
    }
    /** 绕原点旋转弧度 */
    rotate(rad: number): this {
        return rotate(this, this, rad) as this
    }
    /** 绕指定中心旋转弧度 */
    rotateAround(center: Vector2Like, rad: number): this {
        return rotateAround(this, this, center, rad) as this
    }
    /** 斜切: this = skew(this, kx, ky) */
    skew(kx: number, ky: number): this {
        return skew(this, this, kx, ky) as this
    }
    /** 缩放: this *= s */
    scale(sx: number, sy: number): this {
        return scale(this, this, sx, sy) as this
    }
    /** 绕指定中心缩放 */
    scaleAround(sx: number, sy: number, center: Vector2Like,): this {
        return scaleAround(this, this, sx, sy, center.x, center.y) as this
    }
    /** 反射: this 沿法线 normal 反射 */
    reflect(normal: Vector2Like): this {
        return reflect(this, this, normal) as this
    }
    /** 逐分量取最小值: this = min(this, a) */
    min(a: Vector2Like): this {
        return min(this, this, a) as this
    }
    /** 逐分量取最大值: this = max(this, a) */
    max(a: Vector2Like): this {
        return max(this, this, a) as this
    }
    /** 逐分量钳制到 [minVal, maxVal] */
    clamp(minVal: number, maxVal: number): this {
        return clamp(this, this, minVal, maxVal) as this
    }
    /** 逐分量向下取整 */
    floor(): this {
        return floor(this, this) as this
    }
    /** 逐分量向上取整 */
    ceil(): this {
        return ceil(this, this) as this
    }
    /** 逐分量取整 */
    trunc(): this {
        return trunc(this, this) as this
    }
    /** 随机化当前向量 */
    random(minVal: number, maxVal: number): this {
        return random(this,minVal, maxVal) as this
    }
    /** 顺时针旋转90度: (x, y) -> (y, -x) */
    perp(): this {
        return perp(this, this) as this
    }
    /** 逆时针旋转90度: (x, y) -> (-y, x) */
    perpLeft(): this {
        return perpLeft(this, this) as this
    }
    /** 与另一个向量的无符号夹角（弧度），范围 [0, π] */
    angleBetween(a: Vector2Like): number {
        return angleBetween(this, a)
    }
    /** 在 b 方向上的投影标量 */
    scalarProject(b: Vector2Like): number {
        return scalarProject(this, b)
    }
    /** 垂直分量 (rejection): this 垂直于 b 的分量 */
    projectPerpendicular(b: Vector2Like): this {
        return projectPerpendicular(this, this, b) as this
    }
    /** 与另一个向量的投影标量 */
    project(a: Vector2Like): this {
        return project(this,this, a) as this
    }
    /** 逐分量取符号 */
    sign(): this {
        return sign(this, this) as this
    }
    /** 逐分量绝对值 */
    abs(): this {
        return abs(this, this) as this
    }
    /** 对齐到网格 */
    snapToGrid(gridSize: number): this {
        return snapToGrid(this, this, gridSize) as this
    }
    /** 限制最大长度 */
    limit(maxLength: number): this {
        return limit(this, this, maxLength) as this
    }
    /** 归一化线性插值: 向 target 方向插值并归一化 */
    nlerp(target: Vector2Like, t: number): this {
        return nlerp(this, this, target, t) as this
    }
    /** 球面线性插值: 向 target 方向做角度匀速插值 */
    slerp(target: Vector2Like, t: number): this {
        return slerp(this, this, target, t) as this
    }
    /** 应用二维仿射变换矩阵: m 为 [a, b, c, d, tx, ty] */
    applyMatrix2D(m: Float32Array): this {
        return applyMatrix2D(this, this, m) as this
    }
    /** 判断当前向量是否为有限向量 */
    isFinite(): boolean {
        return isFinite(this.x) && isFinite(this.y)
    }
    isZero(){
        return this.x===0 && this.y===0
    }
    isOne(){
        return this.x===1 && this.y===1
    }
    toArray(out: number[]): number[] {
        out[0] = this.x
        out[1] = this.y
        return out
    }
    /** 与另一个向量是否相等 */
    equals(a: Vector2Like): boolean {
        return equals(this, a)
    }
    /** 与另一个向量是否相等，允许误差 */
    equalsEpsilon(a: Vector2Like, epsilon: number = MathUtils.EPSILON): boolean {
        return equalsEpsilon(this, a, epsilon)
    }
    
}
