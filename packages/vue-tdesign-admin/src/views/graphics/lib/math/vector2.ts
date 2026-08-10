import { Pool } from "./pool"

export type Vector2Like = {
    x: number
    y: number
}
export class Vector2 {
    static pool = Pool.create<Vector2>({
        initialSize: 20,
        create: () => new Vector2(0, 0),
        release: (obj) => {
            obj.set(0,0)
        }
    })
    static create(x: number, y: number) {
        return new Vector2(x, y)
    }
    static default() {
        return this.create(0, 0)
    }
    static from(obj: Vector2Like) {
        return this.create(obj.x, obj.y)
    }
    _x: number
    _y: number
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
    set(x: number, y: number) {
        this._x = x
        this._y = y
        return this
    }
    copy(source: Vector2Like) {
        return this.set(source.x, source.y)
    }
    clone() {
        return (this.constructor as typeof Vector2).create(this.x, this.y)
    }
    addVectors(a: Vector2Like, b: Vector2Like) {
        return this.set(a.x + b.x, a.y + b.y)
    }
    multiplyVectors(a: Vector2Like, b: Vector2Like) {
        return this.set(a.x * b.x, a.y * b.y)
    }
    subtractVectors(a: Vector2Like, b: Vector2Like) {
        return this.set(a.x - b.x, a.y - b.y)
    }
    divideVectors(a: Vector2Like, b: Vector2Like) {
        return this.set(a.x / b.x, a.y / b.y)
    }
    add(a: Vector2Like) {
        return this.addVectors(this,a)
    }
    multiply(a: Vector2Like) {
        return this.multiplyVectors(this,a)
    }
    subtract(a: Vector2Like) {
        return this.subtractVectors(this,a)
    }
    divide(a: Vector2Like) {
        return this.divideVectors(this,a)
    }
    multiplyScalar(scalar: number) {
        return this.set(this.x * scalar, this.y * scalar)
    }
    dot(a: Vector2Like) {
        return this.x * a.x + this.y * a.y
    }
    cross(a: Vector2Like) {
        return this.x * a.y - this.y * a.x
    }
    squaredLength() {
        return this.x * this.x + this.y * this.y
    }
    length() {
        return Math.sqrt(this.squaredLength())
    }
    normalize() {
        const length = this.length()
        if (length === 0) {
            return this
        }
        const inverseLength = 1 / length
        return this.multiplyScalar(inverseLength)
    }
    distanceTo(a: Vector2Like) {
        return Math.sqrt((this.x - a.x) ** 2 + (this.y - a.y) ** 2)
    }
    perpendicular() {
        return this.set(-this.y, this.x)
    }
    negate() {
        return this.set(-this.x, -this.y)
    }
    isZero() {
        return this.x === 0 && this.y === 0
    }
    isOne() {
        return this.x === 1 && this.y === 1
    }
    equals(a: Vector2Like) {
        return this.x === a.x && this.y === a.y
    }
    equalsEpsilon(a: Vector2Like, epsilon: number = 1e-6) {
        return Math.abs(this.x - a.x) <= epsilon && Math.abs(this.y - a.y) <= epsilon
    }
}
