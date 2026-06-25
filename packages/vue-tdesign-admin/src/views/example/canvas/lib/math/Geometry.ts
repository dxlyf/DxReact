import { type Vector2Like } from './Vector2'
import * as MathUtil from './MathUtil'

// ==================== 类型定义 ====================

/** 线宽对齐方式 */
export type LineAlign = 'center' | 'inner' | 'outer'

export interface RectLike {
    x: number
    y: number
    width: number
    height: number
}

export interface CircleLike {
    x: number
    y: number
    radius: number
}

export interface EllipseLike {
    x: number
    y: number
    radiusX: number
    radiusY: number
}

// ==================== 线段 / 直线 ====================

/**
 * 计算点到直线段的最短距离
 * @param point  目标点
 * @param start  线段起点
 * @param end    线段终点
 * @returns 点到线段的最短距离
 */
export const distanceToSegment = (point: Vector2Like, start: Vector2Like, end: Vector2Like): number => {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const lenSq = dx * dx + dy * dy
    if (lenSq < MathUtil.EPSILON) {
        // 线段退化为点
        const px = point.x - start.x
        const py = point.y - start.y
        return Math.sqrt(px * px + py * py)
    }
    // 投影参数 t 限制在 [0, 1]
    let t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lenSq
    t = MathUtil.clamp(t, 0, 1)
    const projX = start.x + t * dx
    const projY = start.y + t * dy
    const ddx = point.x - projX
    const ddy = point.y - projY
    return Math.sqrt(ddx * ddx + ddy * ddy)
}

/**
 * 计算点到无限直线的距离
 * @param point  目标点
 * @param lineStart  直线上一点
 * @param lineEnd    直线上另一点
 * @returns 点到直线的垂直距离
 */
export const distanceToLine = (point: Vector2Like, lineStart: Vector2Like, lineEnd: Vector2Like): number => {
    const dx = lineEnd.x - lineStart.x
    const dy = lineEnd.y - lineStart.y
    const lenSq = dx * dx + dy * dy
    if (lenSq < MathUtil.EPSILON) {
        const px = point.x - lineStart.x
        const py = point.y - lineStart.y
        return Math.sqrt(px * px + py * py)
    }
    // |cross(lineEnd-lineStart, point-lineStart)| / |lineEnd-lineStart|
    return Math.abs((point.x - lineStart.x) * dy - (point.y - lineStart.y) * dx) / Math.sqrt(lenSq)
}

/**
 * 判断点是否在线段上（支持线宽、误差精度、对齐方式）
 * @param point      目标点
 * @param start      线段起点
 * @param end        线段终点
 * @param lineWidth  线宽，默认 0（仅线本身）
 * @param epsilon    误差精度，默认 MathUtil.EPSILON
 * @param alignment  线宽对齐方式：'center'（中）/ 'inner'（内）/ 'outer'（外），默认 'center'
 * @returns 点是否在线段上
 */
export const isPointOnSegment = (
    point: Vector2Like,
    start: Vector2Like,
    end: Vector2Like,
    lineWidth: number = 0,
    epsilon: number = MathUtil.EPSILON,
    alignment: LineAlign = 'center',
): boolean => {
    const dist = distanceToSegment(point, start, end)
    const halfW = lineWidth / 2

    // 对齐方式确定距离阈值
    let threshold: number
    switch (alignment) {
        case 'inner':
            // 线宽全部向内缩，有效范围 = 线中心向内半个线宽
            threshold = halfW
            break
        case 'outer':
            // 线宽全部向外扩，有效范围 = 线中心向外半个线宽
            threshold = halfW
            break
        case 'center':
        default:
            // 线宽居中，两边各 halfW
            threshold = halfW
            break
    }
    threshold += epsilon

    // center 模式下还要检查投影是否在线段范围内
    // 投影检查确保点不在线段的延长线上
    const dx = end.x - start.x
    const dy = end.y - start.y
    const lenSq = dx * dx + dy * dy
    if (lenSq > MathUtil.EPSILON) {
        const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lenSq
        if (alignment === 'center' || alignment === 'inner') {
            if (t < -epsilon || t > 1 + epsilon) return false
        } else if (alignment === 'outer') {
            // outer 模式：端点处向外扩展半个线宽，检查端点投影容差
            const endpointOffset = halfW / Math.sqrt(lenSq)
            if (t < -endpointOffset - epsilon || t > 1 + endpointOffset + epsilon) return false
        }
    }

    return dist <= threshold
}

// ==================== 多边形 ====================

/**
 * 射线法判断点是否在多边形内部
 * @param point   目标点
 * @param polygon 多边形顶点数组（顺序任意，自动闭合，至少3个顶点）
 * @returns 点是否在多边形内部
 */
export const isPointInPolygon = (point: Vector2Like, polygon: Vector2Like[]): boolean => {
    if (polygon.length < 3) return false
    let inside = false
    const px = point.x
    const py = point.y
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x
        const yi = polygon[i].y
        const xj = polygon[j].x
        const yj = polygon[j].y
        if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
            inside = !inside
        }
    }
    return inside
}

/**
 * 计算点到多边形的距离（点在内部时为0，外部为到最近边的距离）
 * @param point   目标点
 * @param polygon 多边形顶点数组
 * @returns 点到多边形的最短距离
 */
export const distanceToPolygon = (point: Vector2Like, polygon: Vector2Like[]): number => {
    if (polygon.length < 3) return Infinity
    if (isPointInPolygon(point, polygon)) return 0
    let minDist = Infinity
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const d = distanceToSegment(point, polygon[i], polygon[j])
        if (d < minDist) minDist = d
    }
    return minDist
}

/**
 * 判断点是否在多边形的某条边上（支持线宽、误差精度、对齐方式）
 * @param point      目标点
 * @param polygon    多边形顶点数组
 * @param lineWidth  线宽，默认 0
 * @param epsilon    误差精度
 * @param alignment  线宽对齐方式
 * @returns 点是否在多边形的边上
 */
export const isPointOnPolygonEdge = (
    point: Vector2Like,
    polygon: Vector2Like[],
    lineWidth: number = 0,
    epsilon: number = MathUtil.EPSILON,
    alignment: LineAlign = 'center',
): boolean => {
    if (polygon.length < 3) return false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        if (isPointOnSegment(point, polygon[i], polygon[j], lineWidth, epsilon, alignment)) {
            return true
        }
    }
    return false
}

// ==================== 圆 ====================

/**
 * 判断点是否在圆内部（填充区域）
 * @param point   目标点
 * @param center  圆心
 * @param radius  半径
 * @param epsilon 误差精度
 * @returns 点是否在圆内
 */
export const isPointInCircle = (
    point: Vector2Like,
    center: Vector2Like,
    radius: number,
    epsilon: number = MathUtil.EPSILON,
): boolean => {
    const dx = point.x - center.x
    const dy = point.y - center.y
    return Math.sqrt(dx * dx + dy * dy) <= radius + epsilon
}

/**
 * 计算点到圆的距离（点在圆内为0，外部为到圆边的最短距离）
 * @param point   目标点
 * @param center  圆心
 * @param radius  半径
 * @returns 点到圆的最短距离
 */
export const distanceToCircle = (point: Vector2Like, center: Vector2Like, radius: number): number => {
    const dx = point.x - center.x
    const dy = point.y - center.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    return Math.max(0, dist - radius)
}

/**
 * 判断点是否在圆的边框上（支持线宽、误差精度、对齐方式）
 * @param point      目标点
 * @param center     圆心
 * @param radius     半径
 * @param lineWidth  线宽，默认 0
 * @param epsilon    误差精度
 * @param alignment  线宽对齐方式
 * @returns 点是否在圆的边框上
 */
export const isPointOnCircle = (
    point: Vector2Like,
    center: Vector2Like,
    radius: number,
    lineWidth: number = 0,
    epsilon: number = MathUtil.EPSILON,
    alignment: LineAlign = 'center',
): boolean => {
    const dx = point.x - center.x
    const dy = point.y - center.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    const halfW = lineWidth / 2
    const inner = radius - halfW
    const outer = radius + halfW

    switch (alignment) {
        case 'inner':
            // 线宽向内：点应在 [inner, radius] 之间
            return dist >= inner - epsilon && dist <= radius + epsilon
        case 'outer':
            // 线宽向外：点应在 [radius, outer] 之间
            return dist >= radius - epsilon && dist <= outer + epsilon
        case 'center':
        default:
            // 线宽居中：点应在 [inner, outer] 之间
            return dist >= inner - epsilon && dist <= outer + epsilon
    }
}

// ==================== 椭圆 ====================

/**
 * 判断点是否在椭圆内部（填充区域）
 * @param point   目标点
 * @param center  椭圆中心
 * @param radiusX X 轴半径
 * @param radiusY Y 轴半径
 * @param epsilon 误差精度
 * @returns 点是否在椭圆内
 */
export const isPointInEllipse = (
    point: Vector2Like,
    center: Vector2Like,
    radiusX: number,
    radiusY: number,
    epsilon: number = MathUtil.EPSILON,
): boolean => {
    const dx = (point.x - center.x) / radiusX
    const dy = (point.y - center.y) / radiusY
    return dx * dx + dy * dy <= 1 + epsilon
}

/**
 * 计算点到椭圆的近似距离（使用牛顿迭代法）
 * 点在椭圆内返回0，外部返回到椭圆边界的最短距离
 * @param point   目标点
 * @param center  椭圆中心
 * @param radiusX X 轴半径
 * @param radiusY Y 轴半径
 * @returns 点到椭圆的近似最短距离
 */
export const distanceToEllipse = (
    point: Vector2Like,
    center: Vector2Like,
    radiusX: number,
    radiusY: number,
): number => {
    const lx = (point.x - center.x) / radiusX
    const ly = (point.y - center.y) / radiusY
    const distSq = lx * lx + ly * ly

    if (distSq <= 1) return 0
    if (distSq < MathUtil.EPSILON) return 0

    // 牛顿迭代求椭圆上最近点（参数角度 θ）
    let theta = Math.atan2(ly, lx)
    const rxSq = radiusX * radiusX
    const rySq = radiusY * radiusY

    for (let i = 0; i < 5; i++) {
        const cos = Math.cos(theta)
        const sin = Math.sin(theta)
        const ex = radiusX * cos
        const ey = radiusY * sin
        const fx = -radiusX * sin
        const fy = radiusY * cos

        const dx = ex - (point.x - center.x)
        const dy = ey - (point.y - center.y)

        const f = fx * dx + fy * dy
        const df = (rxSq - rySq) * cos * sin * (dx * sin / radiusY + dy * cos / radiusX)
            - (rxSq * sin * sin + rySq * cos * cos)

        if (Math.abs(df) < MathUtil.EPSILON) break

        const delta = f / df
        if (Math.abs(delta) < MathUtil.EPSILON) break
        theta -= delta
    }

    const nearX = center.x + radiusX * Math.cos(theta)
    const nearY = center.y + radiusY * Math.sin(theta)
    const ndx = point.x - nearX
    const ndy = point.y - nearY
    return Math.sqrt(ndx * ndx + ndy * ndy)
}

/**
 * 判断点是否在椭圆的边框上（支持线宽、误差精度、对齐方式）
 * @param point      目标点
 * @param center     椭圆中心
 * @param radiusX    X 轴半径
 * @param radiusY    Y 轴半径
 * @param lineWidth  线宽，默认 0
 * @param epsilon    误差精度
 * @param alignment  线宽对齐方式
 * @returns 点是否在椭圆边框上
 */
export const isPointOnEllipse = (
    point: Vector2Like,
    center: Vector2Like,
    radiusX: number,
    radiusY: number,
    lineWidth: number = 0,
    epsilon: number = MathUtil.EPSILON,
    alignment: LineAlign = 'center',
): boolean => {
    // 使用近似距离判断
    const dist = distanceToEllipse(point, center, radiusX, radiusY)
    // 点在椭圆内说明不在边框上
    const lx = (point.x - center.x) / radiusX
    const ly = (point.y - center.y) / radiusY
    const inside = lx * lx + ly * ly <= 1

    const halfW = lineWidth / 2

    switch (alignment) {
        case 'inner':
            // 线宽向内：点需在椭圆内部且距离椭圆边界在线宽范围内
            if (!inside) return false
            return dist <= halfW + epsilon
        case 'outer':
            // 线宽向外：点需在椭圆外部且距离椭圆边界在线宽范围内
            if (inside) return false
            return dist <= halfW + epsilon
        case 'center':
        default:
            // 线宽居中：点距离椭圆边界在线宽一半范围内
            return dist <= halfW + epsilon
    }
}

// ==================== 矩形 ====================

/**
 * 判断点是否在矩形内部（填充区域）
 * @param point  目标点
 * @param rect   矩形 { x, y, width, height }
 * @param epsilon 误差精度
 * @returns 点是否在矩形内
 */
export const isPointInRect = (
    point: Vector2Like,
    rect: RectLike,
    epsilon: number = MathUtil.EPSILON,
): boolean => {
    return (
        point.x >= rect.x - epsilon &&
        point.x <= rect.x + rect.width + epsilon &&
        point.y >= rect.y - epsilon &&
        point.y <= rect.y + rect.height + epsilon
    )
}

/**
 * 判断点是否在矩形的某条边上（支持线宽、误差精度、对齐方式）
 * 对齐语义：
 *  - center: 边框线居中，halfW 在矩形内、halfW 在矩形外
 *  - inner:  边框线全部在矩形内部（线内描边）
 *  - outer:  边框线全部在矩形外部（线外描边）
 * @param point      目标点
 * @param rect       矩形 { x, y, width, height }
 * @param lineWidth  线宽，默认 0
 * @param epsilon    误差精度
 * @param alignment  线宽对齐方式
 * @returns 点是否在矩形的边上
 */
export const isPointOnRectEdge = (
    point: Vector2Like,
    rect: RectLike,
    lineWidth: number = 0,
    epsilon: number = MathUtil.EPSILON,
    alignment: LineAlign = 'center',
): boolean => {
    const { x, y, width, height } = rect
    const right = x + width
    const bottom = y + height

    const halfW = lineWidth / 2

    // 根据对齐方式确定边框的内外边界
    let innerX: number, innerY: number, innerR: number, innerB: number
    let outerX: number, outerY: number, outerR: number, outerB: number

    switch (alignment) {
        case 'inner':
            // 线在内部：内边界 = 矩形原始边界缩进 lineWidth，外边界 = 矩形原始边界
            innerX = x + lineWidth
            innerY = y + lineWidth
            innerR = right - lineWidth
            innerB = bottom - lineWidth
            outerX = x
            outerY = y
            outerR = right
            outerB = bottom
            break
        case 'outer':
            // 线在外部：内边界 = 矩形原始边界，外边界 = 矩形原始边界外扩 lineWidth
            innerX = x
            innerY = y
            innerR = right
            innerB = bottom
            outerX = x - lineWidth
            outerY = y - lineWidth
            outerR = right + lineWidth
            outerB = bottom + lineWidth
            break
        case 'center':
        default:
            // 线居中：内外各 halfW
            innerX = x - halfW
            innerY = y - halfW
            innerR = right + halfW
            innerB = bottom + halfW
            outerX = x - halfW
            outerY = y - halfW
            outerR = right + halfW
            outerB = bottom + halfW
            break
    }

    const px = point.x
    const py = point.y

    // 点必须在边框区域内（外边界内、不在内部实心区域）
    if (
        px < outerX - epsilon ||
        px > outerR + epsilon ||
        py < outerY - epsilon ||
        py > outerB + epsilon
    ) {
        return false
    }

    // 点不能在内部实心区域（center 模式下内边界 = 外边界，始终为 true，所以有额外的判断逻辑）
    if (alignment === 'center') {
        // center 模式：边框区域 = [x-halfW, x+halfW] U [right-halfW, right+halfW] 对 x
        //                    = [y-halfW, y+halfW] U [bottom-halfW, bottom+halfW] 对 y
        const onLeft = px >= x - halfW - epsilon && px <= x + halfW + epsilon
        const onRight = px >= right - halfW - epsilon && px <= right + halfW + epsilon
        const onTop = py >= y - halfW - epsilon && py <= y + halfW + epsilon
        const onBottom = py >= bottom - halfW - epsilon && py <= bottom + halfW + epsilon

        // 在水平条带上且在垂直范围，或在垂直条带上且在水平范围
        const inVStrip = py >= y - halfW - epsilon && py <= bottom + halfW + epsilon
        const inHStrip = px >= x - halfW - epsilon && px <= right + halfW + epsilon

        return (onLeft && inVStrip) || (onRight && inVStrip) || (onTop && inHStrip) || (onBottom && inHStrip)
    }

    // inner/outer 模式：边框区域是环形，排除内部实心
    const insideSolid =
        px > innerX + epsilon &&
        px < innerR - epsilon &&
        py > innerY + epsilon &&
        py < innerB - epsilon

    return !insideSolid
}


// ==================== 矩形（by 两对角点） ====================

/**
 * 用两个对角点创建 RectLike 对象
 * @param x1 对角点1 x
 * @param y1 对角点1 y
 * @param x2 对角点2 x
 * @param y2 对角点2 y
 * @returns RectLike
 */
export const rectFromPoints = (x1: number, y1: number, x2: number, y2: number): RectLike => ({
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
})
