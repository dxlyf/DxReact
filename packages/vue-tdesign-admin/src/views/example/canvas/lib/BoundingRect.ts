import * as MathUtils from "./MathUtils"
import { Vector2Like } from "./Vector2"

export type BoundingRectLike = {
    minX: number
    minY: number
    maxX: number
    maxY: number
}

/** 创建一个 BoundingRect 实例 */
export const create = (minX: number = 0, minY: number = 0, maxX: number = 0, maxY: number = 0): BoundingRect => {
    return new BoundingRect(minX, minY, maxX, maxY)
}
/** 从中心点和半宽高创建 */
export const fromCenter = (cx: number, cy: number, halfWidth: number, halfHeight: number): BoundingRect => {
    return new BoundingRect(cx - halfWidth, cy - halfHeight, cx + halfWidth, cy + halfHeight)
}
/** 从位置和尺寸创建 */
export const fromXYWH = (x: number, y: number, w: number, h: number): BoundingRect => {
    return new BoundingRect(x, y, x + w, y + h)
}
/** 宽度 */
export const width = (rect: BoundingRectLike): number => {
    return rect.maxX - rect.minX
}
/** 高度 */
export const height = (rect: BoundingRectLike): number => {
    return rect.maxY - rect.minY
}
/** 中心 x */
export const centerX = (rect: BoundingRectLike): number => {
    return (rect.minX + rect.maxX) / 2
}
/** 中心 y */
export const centerY = (rect: BoundingRectLike): number => {
    return (rect.minY + rect.maxY) / 2
}
/** 面积 */
export const area = (rect: BoundingRectLike): number => {
    return (rect.maxX - rect.minX) * (rect.maxY - rect.minY)
}
/** 判断是否为空（无面积） */
export const isEmpty = (rect: BoundingRectLike): boolean => {
    return rect.minX >= rect.maxX || rect.minY >= rect.maxY
}
/** 判断点是否在矩形内（包含边界） */
export const containsPoint = (rect: BoundingRectLike, px: number, py: number): boolean => {
    return px >= rect.minX && px <= rect.maxX && py >= rect.minY && py <= rect.maxY
}
/** 判断矩形是否包含另一个矩形 */
export const containsRect = (rect: BoundingRectLike, other: BoundingRectLike): boolean => {
    return other.minX >= rect.minX && other.maxX <= rect.maxX &&
        other.minY >= rect.minY && other.maxY <= rect.maxY
}
/** 判断两个矩形是否相交 */
export const intersects = (a: BoundingRectLike, b: BoundingRectLike): boolean => {
    return a.minX <= b.maxX && a.maxX >= b.minX &&
        a.minY <= b.maxY && a.maxY >= b.minY
}
/** 计算并集: out = union(a, b) */
export const union = (out: BoundingRectLike, a: BoundingRectLike, b: BoundingRectLike): BoundingRectLike => {
    out.minX = Math.min(a.minX, b.minX)
    out.minY = Math.min(a.minY, b.minY)
    out.maxX = Math.max(a.maxX, b.maxX)
    out.maxY = Math.max(a.maxY, b.maxY)
    return out
}
/** 计算交集: out = intersect(a, b)，不相交时返回 empty */
export const intersect = (out: BoundingRectLike, a: BoundingRectLike, b: BoundingRectLike): BoundingRectLike | null => {
    const minX = Math.max(a.minX, b.minX)
    const minY = Math.max(a.minY, b.minY)
    const maxX = Math.min(a.maxX, b.maxX)
    const maxY = Math.min(a.maxY, b.maxY)
    if (minX > maxX || minY > maxY) return null
    out.minX = minX
    out.minY = minY
    out.maxX = maxX
    out.maxY = maxY
    return out
}
/** 向外扩展: out = expand(rect, amount) */
export const expand = (out: BoundingRectLike, rect: BoundingRectLike, amount: number): BoundingRectLike => {
    out.minX = rect.minX - amount
    out.minY = rect.minY - amount
    out.maxX = rect.maxX + amount
    out.maxY = rect.maxY + amount
    return out
}
/** 平移: out = translate(rect, dx, dy) */
export const translate = (out: BoundingRectLike, rect: BoundingRectLike, dx: number, dy: number): BoundingRectLike => {
    out.minX = rect.minX + dx
    out.minY = rect.minY + dy
    out.maxX = rect.maxX + dx
    out.maxY = rect.maxY + dy
    return out
}
/** 判断两个矩形是否相等 */
export const equals = (a: BoundingRectLike, b: BoundingRectLike): boolean => {
    return a.minX === b.minX && a.minY === b.minY && a.maxX === b.maxX && a.maxY === b.maxY
}
/** 判断两个矩形是否近似相等 */
export const equalsEpsilon = (a: BoundingRectLike, b: BoundingRectLike, epsilon: number = MathUtils.EPSILON): boolean => {
    return Math.abs(a.minX - b.minX) <= epsilon &&
        Math.abs(a.minY - b.minY) <= epsilon &&
        Math.abs(a.maxX - b.maxX) <= epsilon &&
        Math.abs(a.maxY - b.maxY) <= epsilon
}
/** 从一组点集创建包围盒 */
export const fromPoints = (points: Vector2Like[]): BoundingRect => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (let i = 0; i < points.length; i++) {
        const p = points[i]
        if (p.x < minX) minX = p.x
        if (p.y < minY) minY = p.y
        if (p.x > maxX) maxX = p.x
        if (p.y > maxY) maxY = p.y
    }
    return new BoundingRect(minX, minY, maxX, maxY)
}
/** 扩展包围盒以包含点: out = expandByPoint(rect, px, py) */
export const expandByPoint = (out: BoundingRectLike, rect: BoundingRectLike, px: number, py: number): BoundingRectLike => {
    out.minX = Math.min(rect.minX, px)
    out.minY = Math.min(rect.minY, py)
    out.maxX = Math.max(rect.maxX, px)
    out.maxY = Math.max(rect.maxY, py)
    return out
}
/** 应用二维仿射变换矩阵: 变换后新的包围盒 */
export const applyMatrix2D = (out: BoundingRectLike, rect: BoundingRectLike, m: Float32Array): BoundingRectLike => {
    const x0 = rect.minX, y0 = rect.minY
    const x1 = rect.maxX, y1 = rect.maxY
    // 变换四个角
    const p0x = x0 * m[0] + y0 * m[2] + m[4]
    const p0y = x0 * m[1] + y0 * m[3] + m[5]
    const p1x = x1 * m[0] + y0 * m[2] + m[4]
    const p1y = x1 * m[1] + y0 * m[3] + m[5]
    const p2x = x0 * m[0] + y1 * m[2] + m[4]
    const p2y = x0 * m[1] + y1 * m[3] + m[5]
    const p3x = x1 * m[0] + y1 * m[2] + m[4]
    const p3y = x1 * m[1] + y1 * m[3] + m[5]
    out.minX = Math.min(p0x, p1x, p2x, p3x)
    out.minY = Math.min(p0y, p1y, p2y, p3y)
    out.maxX = Math.max(p0x, p1x, p2x, p3x)
    out.maxY = Math.max(p0y, p1y, p2y, p3y)
    return out
}

export class BoundingRect implements BoundingRectLike {
    static default(){
        return new BoundingRect()
    }
    constructor(
        public minX: number = Infinity,
        public minY: number = Infinity,
        public maxX: number = -Infinity,
        public maxY: number = -Infinity,
    ) { }

    /** 宽度 */
    get width(): number {
        return this.maxX - this.minX
    }
    /** 高度 */
    get height(): number {
        return this.maxY - this.minY
    }
    /** 中心 x */
    get centerX(): number {
        return (this.minX + this.maxX) / 2
    }
    /** 中心 y */
    get centerY(): number {
        return (this.minY + this.maxY) / 2
    }
    /** 面积 */
    get area(): number {
        return (this.maxX - this.minX) * (this.maxY - this.minY)
    }
    /** 左边界 (minX 的别名) */
    get left(): number {
        return this.minX
    }
    /** 上边界 (minY 的别名) */
    get top(): number {
        return this.minY
    }
    /** 右边界 (maxX 的别名) */
    get right(): number {
        return this.maxX
    }
    /** 下边界 (maxY 的别名) */
    get bottom(): number {
        return this.maxY
    }
    empty(){
        this.set(0,0,0,0)
        return this
    }
    reset(){
        this.set(Infinity, Infinity, -Infinity, -Infinity)
        return this
    }
    /** 设置值 */
    set(minX: number, minY: number, maxX: number, maxY: number): this {
        this.minX = minX
        this.minY = minY
        this.maxX = maxX
        this.maxY = maxY
        return this
    }
    /** 从另一个矩形复制 */
    copy(rect: BoundingRectLike): this {
        return this.set(rect.minX, rect.minY, rect.maxX, rect.maxY)
    }
    /** 从位置和尺寸设置 */
    setXYWH(x: number, y: number, w: number, h: number): this {
        return this.set(x, y, x + w, y + h)
    }
    /** 判断是否为空 */
    isEmpty(): boolean {
        return isEmpty(this)
    }
    /** 判断点是否在矩形内 */
    containsPoint(px: number, py: number): boolean {
        return containsPoint(this, px, py)
    }
    /** 判断是否包含另一个矩形 */
    containsRect(other: BoundingRectLike): boolean {
        return containsRect(this, other)
    }
    /** 判断是否与另一个矩形相交 */
    intersects(other: BoundingRectLike): boolean {
        return intersects(this, other)
    }
    /** 与另一个矩形求并集: this = union(this, other) */
    union(other: BoundingRectLike): this {
        union(this, this, other)
        return this
    }
    /** 与另一个矩形求交集: this = intersect(this, other)，不相交则不变 */
    intersect(other: BoundingRectLike): this {
        const result = intersect(this, this, other)
        return result !== null ? this : this
    }
    /** 向外扩展 */
    expand(amount: number): this {
        expand(this, this, amount)
        return this
    }
    /** 扩展以包含点 */
    expandByPoint(px: number, py: number): this {
        expandByPoint(this, this, px, py)
        return this
    }
    fromPoints(points: Vector2Like[]): this {
        if (points.length === 0) {
            this.empty()
            return this
        }
        for (const point of points) {
            expandByPoint(this, this, point.x, point.y)
        }
        return this
    }
    /** 应用二维仿射变换矩阵 */
    applyMatrix2D(m: Float32Array): this {
        applyMatrix2D(this, this, m)
        return this
    }
    /** 平移 */
    translate(dx: number, dy: number): this {
        translate(this, this, dx, dy)
        return this
    }
    /** 克隆 */
    clone(): BoundingRect {
        return new BoundingRect(this.minX, this.minY, this.maxX, this.maxY)
    }
    /** 转换为 {x, y, width, height} */
    toXYWH(): { x: number; y: number; width: number; height: number } {
        return { x: this.minX, y: this.minY, width: this.width, height: this.height }
    }
    /** 判断与另一个矩形是否相等 */
    equals(other: BoundingRectLike): boolean {
        return equals(this, other)
    }
    /** 判断与另一个矩形是否近似相等 */
    equalsEpsilon(other: BoundingRectLike, epsilon: number = MathUtils.EPSILON): boolean {
        return equalsEpsilon(this, other, epsilon)
    }
}
