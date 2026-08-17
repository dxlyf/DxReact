import { ShapePrimitive } from './ShapePrimitive'
import { Box2 } from '../Box2'
import { Vector2 } from '../Vector2'
import { Matrix2D } from '../Matrix2D'
import { Polygon } from './Polygon'

/**
 * 矩形
 */
export class Rectangle extends ShapePrimitive {
    x: number
    y: number
    width: number
    height: number

    constructor(x = 0, y = 0, width = 0, height = 0) {
        super()
        this.x = x
        this.y = y
        this.width = width
        this.height = height
    }

    get left(): number {
        return this.x
    }

    get top(): number {
        return this.y
    }

    get right(): number {
        return this.x + this.width
    }

    get bottom(): number {
        return this.y + this.height
    }

    get centerX(): number {
        return this.x + this.width / 2
    }

    get centerY(): number {
        return this.y + this.height / 2
    }

    getBounds(): Box2 {
        return new Box2(this.x, this.y, this.x + this.width, this.y + this.height)
    }

    contains(point: Vector2): boolean {
        return point.x >= this.x && point.x <= this.x + this.width && point.y >= this.y && point.y <= this.y + this.height
    }

    /** 有符号距离：矩形 SDF（精确），负=内部 */
    signedDistance(x: number, y: number): number {
        const dx = Math.abs(x - this.centerX) - this.width / 2
        const dy = Math.abs(y - this.centerY) - this.height / 2
        const ox = Math.max(dx, 0), oy = Math.max(dy, 0)
        // 外部取到角点距离，内部取最近边距离取负
        return Math.hypot(ox, oy) + Math.min(Math.max(dx, dy), 0)
    }

    getPoints(): Vector2[] {
        return [
            new Vector2(this.x, this.y),
            new Vector2(this.x + this.width, this.y),
            new Vector2(this.x + this.width, this.y + this.height),
            new Vector2(this.x, this.y + this.height),
        ]
    }

    /** 从中心与尺寸创建 */
    static fromCenter(cx: number, cy: number, width: number, height: number): Rectangle {
        return new Rectangle(cx - width / 2, cy - height / 2, width, height)
    }

    /** 从两点创建 */
    static fromPoints(ax: number, ay: number, bx: number, by: number): Rectangle {
        return new Rectangle(Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax), Math.abs(by - ay))
    }

    /** 合并为外接矩形 */
    union(rect: Rectangle): Rectangle {
        const b = this.getBounds().union(rect.getBounds())
        return new Rectangle(b.minX, b.minY, b.width, b.height)
    }

    /** 旋转后生成一般四边形（有向矩形） */
    rotated(rad: number, center?: Vector2): Polygon {
        const cx = center?.x ?? this.centerX
        const cy = center?.y ?? this.centerY
        const points = this.getPoints().map((p) => {
            const dx = p.x - cx, dy = p.y - cy
            const cos = Math.cos(rad), sin = Math.sin(rad)
            return new Vector2(cx + dx * cos - dy * sin, cy + dx * sin + dy * cos)
        })
        return Polygon.fromPoints(points)
    }

    override transform(m: Matrix2D): ShapePrimitive {
        // 矩形应用一般仿射变换后仍可通过 4 角点表示为 Polygon
        return Polygon.fromPoints(this.getPoints().map((p) => m.applyToPoint(p.x, p.y)))
    }

    clone(): Rectangle {
        return new Rectangle(this.x, this.y, this.width, this.height)
    }

    toString(): string {
        return `Rectangle(${this.x}, ${this.y}, ${this.width}, ${this.height})`
    }
}
