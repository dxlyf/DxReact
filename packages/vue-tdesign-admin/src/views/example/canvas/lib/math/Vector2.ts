import { CachePool } from "./CachePool"
import * as MathUtil from './MathUtil'
export type Vector2Like = {
    x: number,
    y: number,
}
export const setVector2 = <T extends Vector2Like>(out: T, x: number, y: number): T => {
    out.x = x
    out.y = y
    return out
}
export const add = <T extends Vector2Like>(out: T, a: T, b: T): T => {
    return setVector2(out, a.x + b.x, a.y + b.y)
}
export const subtract = <T extends Vector2Like>(out: T, a: T, b: T): T => {
    return setVector2(out, a.x - b.x, a.y - b.y)
}
export const multiply = <T extends Vector2Like>(out: T, a: T, b: T): T => {
    return setVector2(out, a.x * b.x, a.y * b.y)
}
export const multiplyScalar = <T extends Vector2Like>(out: T, a: T, scale: number): T => {
    return setVector2(out, a.x * scale, a.y * scale)
}
export const divide = <T extends Vector2Like>(out: T, a: T, b: T): T => {
    return setVector2(out, a.x / b.x, a.y / b.y)
}
export const translate = <T extends Vector2Like>(out: T, a: T, tx: number, ty: number): T => {
    return setVector2(out, a.x + tx, a.y + ty)
}
export const rotate = <V extends Vector2Like>(out: V,v:V, angle: number) => {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return setVector2(out, cos * v.x - sin * v.y, sin * v.x + cos * v.y)
}
export const rotateCenter = <T extends Vector2Like>(out: T, a: T, angle: number,center: T ) => {
    const x = a.x - center.x
    const y = a.y - center.y
    return rotate(out,{x,y},angle)
}
export const scale = <T extends Vector2Like>(out: T, a: T, sx: number, sy: number): T => {
    return setVector2(out, a.x * sx, a.y * sy)
}
export const dot = (a: Vector2Like, b: Vector2Like) => {
    return a.x * b.x + a.y * b.y
}
export const cross = (a: Vector2Like, b: Vector2Like) => {
    return a.x * b.y - a.y * b.x
}
export const length = (a: Vector2Like) => {
    return Math.sqrt(a.x * a.x + a.y * a.y)
}
export const lengthSquared = (a: Vector2Like) => {
    return a.x * a.x + a.y * a.y
}
export const distance = (a: Vector2Like, b: Vector2Like) => {
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y))
}
export const project = <T extends Vector2Like>(out: T, v: T, n: T): T => {
    const t = dot(v, n) / dot(n, n)
    return setVector2(out, n.x * t, n.y * t)
}
/**
 * 向量 a 在向量 b 上的投影长度
 * 如果a和b是单位向量
 * k=dot(a,b)*len(a)=cosθ*len(a)
 * @param {Vector2} a - 被投影向量
 * @param {Vector2} b - 投影目标向量
 * @returns {number} 投影长度
 */
export const projectLength = <T extends Vector2Like>(a:T,b:T): number => {
    return dot(a, b) / length(b)
}
 /**
     * 向量 a 垂直于向量 b 的分量
     * @param {Vector2} a - 被投影向量
     * @param {Vector2} b - 投影目标向量
     * @returns {Vector2} 垂直分量
     */
export const reject = <T extends Vector2Like>(out: T, a: T, b: T): T => {
    const t = dot(a, b) / dot(b, b)
    return setVector2(out, a.x-b.x * t, a.y-b.y * t)
}
export const reflect = <T extends Vector2Like>(out: T, v: T, n: T): T => {
    const k = dot(v, n) / length(n)
    return setVector2(out, v.x - 2 * k * n.x, v.y - 2 * k * n.y)
}
export const reflectNormalized = <T extends Vector2Like>(out: T, v: T, n: T): T => {
    const k=2*dot(v,n)
    return setVector2(out, v.x - k * n.x, v.y - k * n.y)
}
/**
 * 
 * @param out 
 * @param v 入射向(单位向量 指向界面)
 * @param n 法向量(单位向量 指向入射侧，即指向光源方向)
 * @param eta1 入射介质的折射率 (介质的光学密度（真空为1，空气≈1.0003，水≈1.33，玻璃≈1.5）)
 * @param eta2 折射介质的折射率
 * @returns 
 */
export const refract = <T extends Vector2Like>(out: T, v: T, n: T, eta1: number, eta2: number): T => {
    let eta=eta1/eta2
    // 2. 计算入射角余弦（确保为正）
    let c = -dot(v,n)
    
    // 3. 法线方向修正：确保法线指向入射侧
    if (c < 0) {
        // 法线反了，翻转法线
        c = -dot(v,{x:-n.x,y:-n.y})
    }
    // 4. 计算判别式（决定是否全反射）
    const discriminant = 1 - eta * eta * (1 - c * c);
    // 5. 全反射检测
    if (discriminant < 0) {
        return null
    }
    // 6. 计算折射向量
    const sqrtDisc = Math.sqrt(discriminant);
    const factor = eta * c - sqrtDisc;
    const refracted ={
        x:v.x*eta+n.x*factor,
        y:v.y*eta+n.y*factor,
    }
    return setVector2(out, refracted.x, refracted.y)
}

export const normalize = <T extends Vector2Like>(out: T, a: T): T => {
    const len = length(a)
    if (len === 0) {
        return setVector2(out, 0, 0)
    }
    return setVector2(out, a.x / len, a.y / len)
}
export const setLength = <T extends Vector2Like>(out: T, a: T, newLen: number): T => {
    const len = length(a)
    if (len === 0) {
        return setVector2(out, 0, 0)
    }
    const m = newLen / len
    const x = a.x * m
    const y = a.y * m
    return setVector2(out, x, y)
}
export const angleTo = (a: Vector2Like, b: Vector2Like) => {
    const cos = dot(a, b) / (length(a) * length(b))
    return Math.acos(MathUtil.clamp(cos, -1, 1))
}
export const angleBetweenTo = (a: Vector2Like, b: Vector2Like) => {
    return Math.atan2(cross(a, b), dot(a, b))
}
export const angle = (a: Vector2Like) => {
    return Math.atan2(a.y, a.x)
}
export const negate = <T extends Vector2Like>(out: T, a: T): T => {
    return setVector2(out, -a.x, -a.y)
}
export const perpendicular = <T extends Vector2Like>(out: T, a: T): T => {
    return setVector2(out, -a.y, a.x)
}
export const ccw = <T extends Vector2Like>(out: T, a: T): T => {
    return setVector2(out, a.y, -a.x)
}
export const cw = <T extends Vector2Like>(out: T, a: T): T => {
    return setVector2(out, -a.y, a.x)
}
export const random = <T extends Vector2Like>(out: T, min: number, max: number): T => {
    return setVector2(out, MathUtil.random(min, max), MathUtil.random(max, min))
}
export const randomVector = <T extends Vector2Like>(out: T, min: T, max: T): T => {
    return setVector2(out, MathUtil.random(min.x, max.x), MathUtil.random(max.x, min.y))
}
export const min = <T extends Vector2Like>(out: T, a:T,b:T): T => {
    return setVector2(out, Math.min(a.x,b.x), Math.min(a.y,b.y))
}
export const max = <T extends Vector2Like>(out: T, a:T,b:T): T => {
    return setVector2(out, Math.max(a.x,b.x), Math.max(a.y,b.y))
}
export const floor = <T extends Vector2Like>(out: T, v: T): T => {
    return setVector2(out, Math.floor(v.x), Math.floor(v.y))
}
export const ceil = <T extends Vector2Like>(out: T, v: T): T => {
    return setVector2(out, Math.ceil(v.x), Math.ceil(v.y))
}
export const trunc = <T extends Vector2Like>(out: T, v: T): T => {
    return setVector2(out, Math.trunc(v.x), Math.trunc(v.y))
}
export const abs = <T extends Vector2Like>(out: T, v: T): T => {
    return setVector2(out, Math.abs(v.x), Math.abs(v.y))
}
export const clamp = <T extends Vector2Like>(out: T, a: T, min: number, max: number): T => {
    return setVector2(out, MathUtil.clamp(a.x, min, max), MathUtil.clamp(a.y, min, max))
}
export const clampVector = <T extends Vector2Like>(out: T, a: T, min: T, max: T): T => {
    return setVector2(out, MathUtil.clamp(a.x, min.x, max.x), MathUtil.clamp(a.y, min.y, max.y))
}


export const equals = <T extends Vector2Like>(a: T, b: T): boolean => {
    return MathUtil.equals(a.x, b.x) && MathUtil.equals(a.y, b.y)
}
export const equalsEpsilon = <T extends Vector2Like>(a: T, b: T, epsilon: number = MathUtil.EPSILON): boolean => {
    return MathUtil.equalsEpsilon(a.x, b.x, epsilon) && MathUtil.equalsEpsilon(a.y, b.y, epsilon)
}
export const fromRadian = <T extends Vector2Like>(out: T, angle: number): T => {
    return setVector2(out, Math.cos(angle), Math.sin(angle))
}
export const fromAngle = <T extends Vector2Like>(out: T, angle: number): T => {
    return fromRadian(out, MathUtil.degToRad(angle))
}

export class Vector2 extends Float32Array {
    static pool = CachePool.create({
        initSize: 100,
        create: () => Vector2.create(0, 0),
        init: (item) => {
            item[0] = 0
            item[1] = 0
        },
    })
    static create(x: number = 0, y: number = 0): Vector2 {
        return new this(x,y)
    }
    static default() {
        return this.zero()
    }
    static zero() {
        return this.create(0, 0)
    }
    static one() {
        return this.create(1, 1)
    }
    static fromAngle(angle: number): Vector2 {
        return fromAngle(this.default(), angle)
    }
    static fromRadian(radian: number): Vector2 {
        return fromRadian(this.default(), radian)
    }
    constructor(x: number = 0, y: number = 0) {
        super([x, y])
    }
    get x() {
        return this[0]
    }
    get y() {
        return this[1]
    }
    set x(value: number) {
        this[0] = value
    }
    set y(value: number) {
        this[1] = value
    }
    set(x: any, y: number) {
        if (this.x !== x || this.y !== y) {
            this.x = x
            this.y = y
        }
        return this
    }
    copy(out: Vector2Like) {
        return this.set(out.x, out.y)
    }
    clone(){
        return (this.constructor as typeof Vector2).create(this.x, this.y)
    }
    addVectors(a:Vector2Like,b:Vector2Like){
        return add(this,a,b) as Vector2
    }
    add(v: Vector2Like){
        return add(this,this,v) as Vector2
    }
    subtractVectors(a:Vector2Like,b:Vector2Like){
        return subtract(this,a,b) as Vector2
    }
    subtract(v: Vector2Like){
        return subtract(this,this,v) as Vector2
    }
    multiplyVectors(a:Vector2Like,b:Vector2Like){
        return multiply(this,a,b) as Vector2
    }
    multiply(v: Vector2Like){
        return multiply(this,this,v) as Vector2
    }
    multiplyScalar(scalar: number){
        return multiplyScalar(this,this,scalar) as Vector2
    }
    divideVectors(a:Vector2Like,b:Vector2Like){
        return divide(this,a,b) as Vector2
    }
    divide(v: Vector2Like){
        return divide(this,this,v) as Vector2
    }
    project(n: Vector2Like){
        return project(this,this,n) as Vector2
    }
    perpendicular(){
        return perpendicular(this,this) as Vector2
    }
    min(v: Vector2Like){
        return min(this,this,v) as Vector2
    }
    max(v: Vector2Like){
        return max(this,this,v) as Vector2
    }
    negate(){
        return negate(this,this) as Vector2
    }
    floor(){
        return floor(this,this) as Vector2
    }
    ceil(){
        return ceil(this,this) as Vector2
    }
    trunc(){
        return trunc(this,this) as Vector2
    }
    abs(){
        return abs(this,this) as Vector2
    }
    random(min: number = 0, max: number = 1){
        return random(this,min,max) as Vector2
    }
    clamp(min: number = 0, max: number = 1){
        return clamp(this,this,min,max) as Vector2
    }
    translate(tx: number, ty: number){
        return translate(this,this, tx, ty) as Vector2
    }
    scale(sx: number, sy: number){
        return scale(this,this, sx, sy) as Vector2
    }
    rotate(angle: number){
        return rotate(this,this, angle) as Vector2
    }
    reflect(n: Vector2Like): this {
        reflect(this, this, n)
        return this
    }
    refract(n: Vector2Like, eta1: number, eta2: number): this {
        refract(this, this, n, eta1, eta2)
        return this
    }
    isZero(){
        return this.x === 0 && this.y === 0
    }
    isOne(){
        return this.x === 1 && this.y === 1
    }
    equals(v: Vector2Like){
        return equals(this, v)
    }
    equalsEpsilon(v: Vector2Like, epsilon: number = MathUtil.EPSILON){
        return equalsEpsilon(this, v, epsilon)
    }

}