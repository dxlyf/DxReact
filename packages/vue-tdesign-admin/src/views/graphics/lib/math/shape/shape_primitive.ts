import { BoundingRect } from "../bounding_rect"
import { Vector2Like } from "../vector2"

/** 描边对齐方式：居中 / 内侧 / 外侧 */
export const STROKE_ALIGN_CENTER = 0
export const STROKE_ALIGN_INNER = 1
export const STROKE_ALIGN_OUTER = 2

/**
 * 图形基类。
 *
 * 用「带符号距离场（Signed Distance Field, SDF）」统一描述填充与描边：
 *   sd(x, y) > 0 → 点在形状内部
 *   sd(x, y) = 0 → 点在边界上
 *   sd(x, y) < 0 → 点在形状外部
 *
 * 子类只需实现 signedDistance() 与维护 bounds，
 * contains / containsStroke / getBounds 均由基类统一完成。
 */
export class ShapePrimitive {
    bounds: BoundingRect = BoundingRect.default()
    constructor() {
    }

    /**
     * 带符号距离场。默认不在任何形状内（返回 -Infinity）。
     * 子类必须重写：>0 内部，<0 外部，绝对值 = 到边界的距离。
     */
    signedDistance(x: number, y: number): number {
        return -Infinity
    }

    /** 点是否在形状内（含边界） */
    contains(x: number, y: number): boolean {
        return this.signedDistance(x, y) >= 0
    }

    /**
     * 点是否在描边内。
     * 描边宽度 width 的带：到边界距离 |sd| ∈ [0, width]，
     * 按对齐方式对齐到边界两侧：
     *   center —— |sd| ≤ width/2
     *   inner  —— 在内部且 sd ≤ width
     *   outer  —— 在外部且 |sd| ≤ width
     */
    containsStroke(x: number, y: number, width: number, align: number): boolean {
        if (width <= 0) return false
        const sd = this.signedDistance(x, y)
        const dist = Math.abs(sd)
        switch (align) {
            case STROKE_ALIGN_INNER:
                return sd >= 0 && dist <= width
            case STROKE_ALIGN_OUTER:
                return sd <= 0 && dist <= width
            case STROKE_ALIGN_CENTER:
            default:
                return dist <= width / 2
        }
    }

    getBounds(): BoundingRect {
        return this.bounds
    }
    buildPath():Vector2Like[]{
        return []
    }
}
