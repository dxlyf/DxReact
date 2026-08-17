import { ShapePrimitive } from './ShapePrimitive'
import { Box2 } from '../Box2'
import { Vector2 } from '../Vector2'
import { Matrix2D } from '../Matrix2D'
import { Polygon } from './Polygon'

/**
 * 圆
 */
export class Circle extends ShapePrimitive {
    x: number
    y: number
    radius: number

    constructor(x = 0, y = 0, radius = 0) {
        super()
        this.x = x
        this.y = y
        this.radius = radius
    }

    get centerX(): number {
        return this.x
    }

    get centerY(): number {
        return this.y
    }

    getBounds(): Box2 {
        return new Box2(this.x - this.radius, this.y - this.radius, this.x + this.radius, this.y + this.radius)
    }

    contains(point: Vector2): boolean {
        const dx = point.x - this.x, dy = point.y - this.y
        return dx * dx + dy * dy <= this.radius * this.radius
    }

    /** 有符号距离：距圆心的距离减去半径（精确） */
    signedDistance(x: number, y: number): number {
        return Math.hypot(x - this.x, y - this.y) - this.radius
    }

    getPoints(segments = 32): Vector2[] {
        const points: Vector2[] = new Array(segments)
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2
            points[i] = new Vector2(this.x + this.radius * Math.cos(angle), this.y + this.radius * Math.sin(angle))
        }
        return points
    }

    /** 圆与线段相交检测（用于拾取线/边） */
    intersectsSegment(a: Vector2, b: Vector2): boolean {
        const dx = b.x - a.x, dy = b.y - a.y
        const fx = a.x - this.x, fy = a.y - this.y
        const aa = dx * dx + dy * dy
        if (aa === 0) return this.contains(a)
        const bb = 2 * (fx * dx + fy * dy)
        const cc = fx * fx + fy * fy - this.radius * this.radius
        const disc = bb * bb - 4 * aa * cc
        if (disc < 0) return false
        const t1 = (-bb - Math.sqrt(disc)) / (2 * aa)
        const t2 = (-bb + Math.sqrt(disc)) / (2 * aa)
        return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)
    }

    override transform(m: Matrix2D): ShapePrimitive {
        // 一般仿射变换下圆变为椭圆；仅当为等比缩放时可保持圆
        const scaleX = Math.hypot(m.a, m.b)
        const scaleY = Math.hypot(m.c, m.d)
        if (Math.abs(scaleX - scaleY) < 1e-9) {
            const center = m.applyToPoint(this.x, this.y)
            return new Circle(center.x, center.y, this.radius * scaleX)
        }
        return Polygon.fromPoints(this.getPoints(32).map((p) => m.applyToPoint(p.x, p.y)))
    }

    clone(): Circle {
        return new Circle(this.x, this.y, this.radius)
    }

    toString(): string {
        return `Circle(${this.x}, ${this.y}, ${this.radius})`
    }
}
