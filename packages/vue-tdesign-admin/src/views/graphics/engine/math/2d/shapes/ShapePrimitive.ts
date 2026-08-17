import { Box2 } from '../Box2'
import { Vector2 } from '../Vector2'
import { Matrix2D } from '../Matrix2D'
import type { Polygon } from './Polygon'

// 延迟解析 Polygon 类（由 Polygon.ts 模块初始化时注册），避免与 Polygon 循环依赖
let polygonCtor: (typeof Polygon) | null = null

/** 注册 Polygon 构造器（Polygon.ts 内部调用） */
export function registerPolygonClass(ctor: typeof Polygon): void {
    polygonCtor = ctor
}

/**
 * 图形原始类
 *
 * 所有 2D 基础几何图形（矩形/圆/椭圆/多边形/三角形）的抽象基类，
 * 提供统一的包围盒、命中检测、点集采样与变换能力。
 * 供拾取系统、包围盒计算与渲染细分使用。
 */
export abstract class ShapePrimitive {
    /**
     * 计算轴对齐包围盒
     */
    abstract getBounds(): Box2

    /**
     * 判断点是否在图形内部（含边界）
     * @param point 世界坐标点
     */
    abstract contains(point: Vector2): boolean

    /**
     * 计算点到轮廓的有符号距离（SDF）
     * @param x 点的 x 坐标
     * @param y 点的 y 坐标
     * @returns 负值=点在图形内部，正值=点在外部，0=在轮廓上
     */
    abstract signedDistance(x: number, y: number): number

    /**
     * 返回图形轮廓上的采样点序列
     * @param segments 每 360° 的采样段数（用于圆/椭圆/弧线）
     * @returns 轮廓点数组
     */
    abstract getPoints(segments?: number): Vector2[]

    /**
     * 应用仿射变换，返回新图形
     * 由于变换后可能不再是同类图形（如矩形旋转后为一般四边形），默认实现：
     * 先取轮廓点变换，再转换为 Polygon。
     */
    transform(m: Matrix2D): ShapePrimitive {
        const points = this.getPoints().map((p) => m.applyToPoint(p.x, p.y))
        if (polygonCtor) return polygonCtor.fromPoints(points)
        // Polygon 尚未注册（未加载 Polygon 模块），退化为原图形
        return this
    }

    /** 图形的面积 */
    area(): number {
        const points = this.getPoints(64)
        if (points.length < 3) return 0
        let sum = 0
        for (let i = 0; i < points.length; i++) {
            const p = points[i]
            const q = points[(i + 1) % points.length]
            sum += p.x * q.y - q.x * p.y
        }
        return Math.abs(sum) / 2
    }

    /** 与另一图形的包围盒是否相交（粗略检测） */
    intersects(other: ShapePrimitive): boolean {
        return this.getBounds().intersects(other.getBounds())
    }

    /**
     * 判断点是否落在描边区域内（近似：以轮廓采样线段求最近距离）
     * @param x 点的 x 坐标
     * @param y 点的 y 坐标
     * @param lineWidth 描边线宽
     * @param alignment 描边对齐：0 = 居中，1 = 内侧，-1 = 外侧
     * @returns 是否命中描边区域
     */
    containsStroke(x: number, y: number, lineWidth: number, alignment: number = 0): boolean {
        if (lineWidth <= 0) return false
        const dist = this.distanceToEdge(x, y)
        if (alignment === 1) {
            // 内侧描边：点在图形内部，且距轮廓不超过线宽
            return this.contains(new Vector2(x, y)) && dist <= lineWidth
        }
        if (alignment === -1) {
            // 外侧描边：点在图形外部，且距轮廓不超过线宽
            return !this.contains(new Vector2(x, y)) && dist <= lineWidth
        }
        // 居中描边（默认）：距轮廓不超过半个线宽
        return dist <= lineWidth / 2
    }

    /** 计算点到图形轮廓的最小距离（按轮廓采样线段近似） */
    protected distanceToEdge(x: number, y: number, segments = 64): number {
        const points = this.getPoints(segments)
        if (points.length < 2) return Infinity
        let min = Infinity
        for (let i = 0; i < points.length; i++) {
            const a = points[i]
            const b = points[(i + 1) % points.length]
            const d = pointToSegmentDistance(x, y, a.x, a.y, b.x, b.y)
            if (d < min) min = d
        }
        return min
    }

    abstract clone(): ShapePrimitive
}

/** 点到线段的最短距离 */
function pointToSegmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
    const abx = bx - ax, aby = by - ay
    const lenSq = abx * abx + aby * aby
    let t = 0
    if (lenSq > 0) {
        t = ((px - ax) * abx + (py - ay) * aby) / lenSq
        t = Math.min(1, Math.max(0, t))
    }
    const dx = ax + abx * t - px
    const dy = ay + aby * t - py
    return Math.hypot(dx, dy)
}
