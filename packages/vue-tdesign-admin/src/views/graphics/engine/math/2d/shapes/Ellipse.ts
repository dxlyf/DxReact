import { ShapePrimitive } from './ShapePrimitive'
import { Box2 } from '../Box2'
import { Vector2 } from '../Vector2'
import { Matrix2D } from '../Matrix2D'
import { Circle } from './Circle'
import { Polygon } from './Polygon'

/**
 * 椭圆（支持半径旋转 rotation）
 */
export class Ellipse extends ShapePrimitive {
    x: number
    y: number
    radiusX: number
    radiusY: number
    rotation: number

    constructor(x = 0, y = 0, radiusX = 0, radiusY = 0, rotation = 0) {
        super()
        this.x = x
        this.y = y
        this.radiusX = radiusX
        this.radiusY = radiusY
        this.rotation = rotation
    }

    getBounds(): Box2 {
        if (this.rotation === 0) {
            return new Box2(this.x - this.radiusX, this.y - this.radiusY, this.x + this.radiusX, this.y + this.radiusY)
        }
        // 旋转椭圆用参数方程极值推导
        const a = this.radiusX, b = this.radiusY, t = this.rotation
        const cosT = Math.cos(t), sinT = Math.sin(t)
        const ux = Math.hypot(a * cosT, b * sinT)
        const uy = Math.hypot(a * sinT, b * cosT)
        return new Box2(this.x - ux, this.y - uy, this.x + ux, this.y + uy)
    }

    contains(point: Vector2): boolean {
        const dx = point.x - this.x, dy = point.y - this.y
        // 变换到未旋转椭圆坐标系
        const cos = Math.cos(-this.rotation), sin = Math.sin(-this.rotation)
        const lx = dx * cos - dy * sin
        const ly = dx * sin + dy * cos
        const rx = this.radiusX, ry = this.radiusY
        if (rx === 0 || ry === 0) return false
        return (lx * lx) / (rx * rx) + (ly * ly) / (ry * ry) <= 1
    }

    /**
     * 有符号距离：Newton 迭代求椭圆上最近点（数值近似），负=内部
     */
    signedDistance(x: number, y: number): number {
        const rx = this.radiusX, ry = this.radiusY
        if (rx <= 0 || ry <= 0) return Infinity
        // 变换到未旋转椭圆坐标系
        const cos = Math.cos(-this.rotation), sin = Math.sin(-this.rotation)
        const dx = x - this.x, dy = y - this.y
        const lx = dx * cos - dy * sin
        const ly = dx * sin + dy * cos
        // 中心点：距离为负的短轴
        if (lx === 0 && ly === 0) return -Math.min(rx, ry)
        // 迭代求解参数角 t，使 (点-椭圆点)·切线 = 0
        let t = Math.atan2(ry * ly, rx * lx)
        for (let i = 0; i < 20; i++) {
            const ex = rx * Math.cos(t), ey = ry * Math.sin(t)
            const tanx = -rx * Math.sin(t), tany = ry * Math.cos(t)
            const gx = ex - lx, gy = ey - ly
            const f = gx * tanx + gy * tany
            const df = tanx * tanx + tany * tany - gx * rx * Math.cos(t) - gy * ry * Math.sin(t)
            if (df === 0) break
            const step = f / df
            t -= step
            if (Math.abs(step) < 1e-9) break
        }
        const ex = rx * Math.cos(t), ey = ry * Math.sin(t)
        const dist = Math.hypot(ex - lx, ey - ly)
        const inside = (lx * lx) / (rx * rx) + (ly * ly) / (ry * ry) <= 1
        return inside ? -dist : dist
    }

    getPoints(segments = 32): Vector2[] {
        const points: Vector2[] = new Array(segments)
        const cosR = Math.cos(this.rotation), sinR = Math.sin(this.rotation)
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2
            const ex = this.radiusX * Math.cos(angle)
            const ey = this.radiusY * Math.sin(angle)
            points[i] = new Vector2(this.x + ex * cosR - ey * sinR, this.y + ex * sinR + ey * cosR)
        }
        return points
    }

    static fromCircle(circle: Circle, radiusY?: number): Ellipse {
        return new Ellipse(circle.x, circle.y, circle.radius, radiusY ?? circle.radius)
    }

    override transform(m: Matrix2D): ShapePrimitive {
        return Polygon.fromPoints(this.getPoints(32).map((p) => m.applyToPoint(p.x, p.y)))
    }

    clone(): Ellipse {
        return new Ellipse(this.x, this.y, this.radiusX, this.radiusY, this.rotation)
    }

    toString(): string {
        return `Ellipse(${this.x}, ${this.y}, ${this.radiusX}, ${this.radiusY})`
    }
}
