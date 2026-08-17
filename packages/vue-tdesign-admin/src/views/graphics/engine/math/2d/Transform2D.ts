import { Vector2 } from './Vector2'
import { Matrix2D } from './Matrix2D'
import { Box2 } from './Box2'
import * as MathUtils from '../utils/MathUtils'

/**
 * 仿射变换（AffineTransform2D）
 *
 * 以平移/旋转/缩放/斜切组合描述变换，内部维护一个 Matrix2D。
 * 采用"本地变换 → 世界变换"的分层语义：
 * 调用链按顺序应用到局部空间（与 Canvas setTransform 类似，后调用的先应用）。
 */
export class Transform2D {
    private _matrix: Matrix2D

    /** 锚点（变换中心，局部坐标） */
    private _anchorX = 0
    private _anchorY = 0

    /** 平移 */
    private _tx = 0
    private _ty = 0

    /** 缩放 */
    private _scaleX = 1
    private _scaleY = 1

    /** 旋转（弧度） */
    private _rotation = 0

    /** 斜切（弧度） */
    private _skewX = 0
    private _skewY = 0

    private _dirty = true

    constructor() {
        this._matrix = new Matrix2D()
    }

    // ---- 属性 ----

    get anchorX(): number {
        return this._anchorX
    }

    get anchorY(): number {
        return this._anchorY
    }

    set anchor(value: { x: number; y: number }) {
        this.setAnchor(value.x, value.y)
    }

    setAnchor(x: number, y: number): this {
        if (this._anchorX !== x || this._anchorY !== y) {
            this._anchorX = x
            this._anchorY = y
            this._dirty = true
        }
        return this
    }

    get x(): number {
        return this._tx
    }

    set x(v: number) {
        if (this._tx !== v) {
            this._tx = v
            this._dirty = true
        }
    }

    get y(): number {
        return this._ty
    }

    set y(v: number) {
        if (this._ty !== v) {
            this._ty = v
            this._dirty = true
        }
    }

    get scaleX(): number {
        return this._scaleX
    }

    set scaleX(v: number) {
        if (this._scaleX !== v) {
            this._scaleX = v
            this._dirty = true
        }
    }

    get scaleY(): number {
        return this._scaleY
    }

    set scaleY(v: number) {
        if (this._scaleY !== v) {
            this._scaleY = v
            this._dirty = true
        }
    }

    get rotation(): number {
        return this._rotation
    }

    set rotation(v: number) {
        if (this._rotation !== v) {
            this._rotation = v
            this._dirty = true
        }
    }

    get skewX(): number {
        return this._skewX
    }

    set skewX(v: number) {
        if (this._skewX !== v) {
            this._skewX = v
            this._dirty = true
        }
    }

    get skewY(): number {
        return this._skewY
    }

    set skewY(v: number) {
        if (this._skewY !== v) {
            this._skewY = v
            this._dirty = true
        }
    }

    // ---- 组合操作（后调用的先应用，对齐 Canvas 语义） ----

    /** 平移 */
    translate(tx: number, ty: number): this {
        this._tx += tx
        this._ty += ty
        this._dirty = true
        return this
    }

    /** 绕锚点/原点旋转 */
    rotate(rad: number): this {
        this._rotation += rad
        this._dirty = true
        return this
    }

    /** 缩放 */
    scale(sx: number, sy = sx): this {
        this._scaleX *= sx
        this._scaleY *= sy
        this._dirty = true
        return this
    }

    /** 斜切 */
    skew(ax: number, ay: number): this {
        this._skewX += ax
        this._skewY += ay
        this._dirty = true
        return this
    }

    reset(): this {
        this._tx = this._ty = 0
        this._scaleX = this._scaleY = 1
        this._rotation = this._skewX = this._skewY = 0
        this._anchorX = this._anchorY = 0
        this._dirty = true
        return this
    }

    /** 组合另一个变换（this = other * this，即先应用 other） */
    append(other: Transform2D): this {
        this._matrix = other.getMatrix().multiply(this.getMatrix())
        // 分解回参数形式
        const decomposed = this._matrix.decompose()
        this._tx = decomposed.translation.x
        this._ty = decomposed.translation.y
        this._rotation = decomposed.rotation
        this._scaleX = decomposed.scale.x
        this._scaleY = decomposed.scale.y
        this._dirty = false
        return this
    }

    // ---- 矩阵计算 ----

    /** 计算本地变换矩阵（含锚点） */
    getMatrix(): Matrix2D {
        if (this._dirty) {
            // 锚点：先平移到锚点、执行变换、再平移回来
            const m = new Matrix2D()
            m.translate(this._tx, this._ty)
            m.translate(this._anchorX, this._anchorY)
            m.rotate(this._rotation)
            m.scale(this._scaleX, this._scaleY)
            m.skew(this._skewX, this._skewY)
            m.translate(-this._anchorX, -this._anchorY)
            this._matrix = m
            this._dirty = false
        }
        return this._matrix
    }

    /** 世界变换 = 父世界变换 × 本地变换 */
    getWorldMatrix(parentWorld?: Matrix2D): Matrix2D {
        const local = this.getMatrix()
        return parentWorld ? parentWorld.multiplied(local) : local.clone()
    }

    /** 本地 → 世界 */
    localToWorld(localPoint: Vector2): Vector2 {
        return this.getMatrix().applyToPoint(localPoint.x, localPoint.y)
    }

    /** 世界 → 本地（需要矩阵可逆） */
    worldToLocal(worldPoint: Vector2): Vector2 {
        return this.getMatrix().inverted().applyToPoint(worldPoint.x, worldPoint.y)
    }

    /** 变换包围盒（应用矩阵后的 AABB） */
    transformBounds(box: Box2): Box2 {
        const m = this.getMatrix()
        return box.transform(m.a, m.b, m.c, m.d, m.e, m.f)
    }

    /** 是否为单位变换 */
    isIdentity(): boolean {
        return (
            this._tx === 0 && this._ty === 0 &&
            this._scaleX === 1 && this._scaleY === 1 &&
            this._rotation === 0 &&
            this._skewX === 0 && this._skewY === 0 &&
            this._anchorX === 0 && this._anchorY === 0
        )
    }

    /** 分解后的平移分量 */
    get translation(): Vector2 {
        return new Vector2(this._tx, this._ty)
    }

    /** 分解后的缩放分量 */
    get scaleVector(): Vector2 {
        return new Vector2(this._scaleX, this._scaleY)
    }

    /** 旋转的度数形式 */
    get rotationDegrees(): number {
        return MathUtils.toDegrees(this._rotation)
    }

    set rotationDegrees(v: number) {
        this.rotation = MathUtils.toRadians(v)
    }

    /** 手动设置矩阵（破坏参数表示，直接用矩阵） */
    setFromMatrix(m: Matrix2D): this {
        this._matrix = m.clone()
        const d = m.decompose()
        this._tx = d.translation.x
        this._ty = d.translation.y
        this._rotation = d.rotation
        this._scaleX = d.scale.x
        this._scaleY = d.scale.y
        this._skewX = d.skew
        this._anchorX = 0
        this._anchorY = 0
        this._dirty = false
        return this
    }

    clone(): Transform2D {
        const t = new Transform2D()
        t._tx = this._tx; t._ty = this._ty
        t._scaleX = this._scaleX; t._scaleY = this._scaleY
        t._rotation = this._rotation
        t._skewX = this._skewX; t._skewY = this._skewY
        t._anchorX = this._anchorX; t._anchorY = this._anchorY
        t._matrix = this.getMatrix().clone()
        t._dirty = false
        return t
    }

    equals(other: Transform2D, epsilon = 1e-6): boolean {
        return this.getMatrix().equalsEpsilon(other.getMatrix(), epsilon)
    }

    toString(): string {
        return `Transform2D(x=${this._tx}, y=${this._ty}, rotation=${this._rotation}, scale=(${this._scaleX}, ${this._scaleY}))`
    }
}
