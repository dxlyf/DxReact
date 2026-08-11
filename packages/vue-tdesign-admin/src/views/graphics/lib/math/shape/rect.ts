import { ShapePrimitive } from "./shape_primitive"

/**
 * 矩形（轴对齐，AABB）。
 * @param x      左上角 x
 * @param y      左上角 y
 * @param width  宽
 * @param height 高
 */
export class Rect extends ShapePrimitive {
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
        this.updateBounds()
    }

    get cx(): number {
        return this.x + this.width / 2
    }

    get cy(): number {
        return this.y + this.height / 2
    }

    set(x: number, y: number, width: number, height: number): this {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        return this.updateBounds()
    }

    private updateBounds(): this {
        this.bounds.fromXYWH(this.x, this.y, this.width, this.height)
        return this
    }

    /**
     * 矩形 SDF（标准公式，对角圆润近似）：
     *   q = |p − 中心| − 半尺寸，再对 q 的负分量取 0 求长度，
     *   加上对角部分 min(max(qx,qy), 0) 处理内部距离。
     */
    signedDistance(x: number, y: number): number {
        const qx = Math.abs(x - this.cx) - this.width / 2
        const qy = Math.abs(y - this.cy) - this.height / 2
        const ax = Math.max(qx, 0)
        const ay = Math.max(qy, 0)
        return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0)
    }
}
