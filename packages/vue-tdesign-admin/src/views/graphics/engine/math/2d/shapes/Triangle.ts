import { ShapePrimitive } from './ShapePrimitive'
import { Box2 } from '../Box2'
import { Vector2 } from '../Vector2'
import { Matrix2D } from '../Matrix2D'

/**
 * 三角形
 *
 * 顶点顺序按顺时针（屏幕坐标 y 向下）排列。
 */
export class Triangle extends ShapePrimitive {
    a: Vector2
    b: Vector2
    c: Vector2

    constructor(a: Vector2 = new Vector2(), b: Vector2 = new Vector2(1, 0), c: Vector2 = new Vector2(0, 1)) {
        super()
        this.a = a
        this.b = b
        this.c = c
    }

    /** 由坐标创建 */
    static fromCoords(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): Triangle {
        return new Triangle(new Vector2(ax, ay), new Vector2(bx, by), new Vector2(cx, cy))
    }

    getPoints(): Vector2[] {
        return [this.a.clone(), this.b.clone(), this.c.clone()]
    }

    getBounds(): Box2 {
        const box = new Box2()
        box.expandByPoint(this.a.x, this.a.y)
        box.expandByPoint(this.b.x, this.b.y)
        box.expandByPoint(this.c.x, this.c.y)
        return box
    }

    contains(point: Vector2): boolean {
        // 重心坐标法（含边界）
        const v0 = this.c.clone().subtract(this.a)
        const v1 = this.b.clone().subtract(this.a)
        const v2 = point.clone().subtract(this.a)
        const dot00 = v0.dot(v0), dot01 = v0.dot(v1), dot02 = v0.dot(v2)
        const dot11 = v1.dot(v1), dot12 = v1.dot(v2)
        const inv = 1 / (dot00 * dot11 - dot01 * dot01)
        const u = (dot11 * dot02 - dot01 * dot12) * inv
        const v = (dot00 * dot12 - dot01 * dot02) * inv
        return u >= 0 && v >= 0 && u + v <= 1
    }

    /** 质心 */
    centroid(): Vector2 {
        return new Vector2((this.a.x + this.b.x + this.c.x) / 3, (this.a.y + this.b.y + this.c.y) / 3)
    }

    /** 面积（无符号） */
    area(): number {
        return Math.abs((this.b.x - this.a.x) * (this.c.y - this.a.y) - (this.c.x - this.a.x) * (this.b.y - this.a.y)) / 2
    }

    /** 顶点角（弧度），返回 [A, B, C] */
    angles(): [number, number, number] {
        const ab = this.b.clone().subtract(this.a), ac = this.c.clone().subtract(this.a)
        const ba = this.a.clone().subtract(this.b), bc = this.c.clone().subtract(this.b)
        const ca = this.a.clone().subtract(this.c), cb = this.b.clone().subtract(this.c)
        return [ab.angleTo(ac), ba.angleTo(bc), ca.angleTo(cb)]
    }

    override transform(m: Matrix2D): Triangle {
        return new Triangle(m.applyToPoint(this.a.x, this.a.y), m.applyToPoint(this.b.x, this.b.y), m.applyToPoint(this.c.x, this.c.y))
    }

    clone(): Triangle {
        return new Triangle(this.a.clone(), this.b.clone(), this.c.clone())
    }

    toString(): string {
        return `Triangle(${this.a}, ${this.b}, ${this.c})`
    }
}
