import type { Vector2Like } from "../vector2"
import { ShapePrimitive } from "./shape_primitive"

/**
 * 椭圆（轴对齐，无旋转）。
 * @param cx 圆心 x
 * @param cy 圆心 y
 * @param rx 半长轴（x 方向半径）
 * @param ry 半短轴（y 方向半径）
 */
export class Ellipse extends ShapePrimitive {
    cx: number
    cy: number
    rx: number
    ry: number

    constructor(cx = 0, cy = 0, rx = 0, ry = 0) {
        super()
        this.cx = cx
        this.cy = cy
        this.rx = rx
        this.ry = ry
        this.updateBounds()
    }

    set(cx: number, cy: number, rx: number, ry: number): this {
        this.cx = cx
        this.cy = cy
        this.rx = rx
        this.ry = ry
        return this.updateBounds()
    }

    private updateBounds(): this {
        this.bounds.fromXYWH(this.cx - this.rx, this.cy - this.ry, this.rx * 2, this.ry * 2)
        return this
    }

    /**
     * 椭圆 SDF（近似）：
     *   归一化坐标 n = ((x−cx)/rx, (y−cy)/ry)，
     *   sd = (1 − |n|) · min(rx, ry)。
     * 在轴上精确；45° 附近略有误差（最小半径缩放近似）。
     */
    signedDistance(x: number, y: number): number {
        const nx = (x - this.cx) / this.rx
        const ny = (y - this.cy) / this.ry
        const d = Math.hypot(nx, ny)
        return (1 - d) * Math.min(this.rx, this.ry)
    }

    /** 轮廓点：椭圆近似多边形（默认 64 段，逆时针），不重复闭合点 */
    buildPath(segments: number = 64): Vector2Like[] {
        const pts: Vector2Like[] = []
        const n = Math.max(3, Math.floor(segments))
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2
            pts.push({ x: this.cx + this.rx * Math.cos(a), y: this.cy + this.ry * Math.sin(a) })
        }
        return pts
    }
}
