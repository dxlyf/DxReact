import { ShapePrimitive } from "./shape_primitive"

/**
 * 圆形。
 * @param cx 圆心 x
 * @param cy 圆心 y
 * @param r  半径
 */
export class Circle extends ShapePrimitive {
    cx: number
    cy: number
    r: number

    constructor(cx = 0, cy = 0, r = 0) {
        super()
        this.cx = cx
        this.cy = cy
        this.r = r
        this.updateBounds()
    }

    set(cx: number, cy: number, r: number): this {
        this.cx = cx
        this.cy = cy
        this.r = r
        return this.updateBounds()
    }

    private updateBounds(): this {
        this.bounds.fromXYWH(this.cx - this.r, this.cy - this.r, this.r * 2, this.r * 2)
        return this
    }

    /**
     * SDF：sd = r − dist(点, 圆心)。
     * 圆心处最大（= r），边界上 0，向外为负。
     */
    signedDistance(x: number, y: number): number {
        return this.r - Math.hypot(x - this.cx, y - this.cy)
    }
}
