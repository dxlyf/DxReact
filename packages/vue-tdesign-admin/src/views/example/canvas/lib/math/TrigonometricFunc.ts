import type { IPoint } from './Path2D'

// ══════════════════════════════════════════════
// 角度转换
// ══════════════════════════════════════════════

/** 弧度转角度 */
export function rad2deg(rad: number): number {
    return (rad * 180) / Math.PI
}

/** 角度转弧度 */
export function deg2rad(deg: number): number {
    return (deg * Math.PI) / 180
}

/** 将角度规范化到 [-π, π] 区间 */
export function normalizeAngle(angle: number): number {
    let a = angle
    while (a < -Math.PI) a += 2 * Math.PI
    while (a > Math.PI) a -= 2 * Math.PI
    return a
}

/** 将角度规范化到 [0, 2π) 区间 */
export function normalizeAnglePositive(angle: number): number {
    let a = angle % (2 * Math.PI)
    if (a < 0) a += 2 * Math.PI
    return a
}

/**
 * 计算从 a1 到 a2 的最短角差，结果在 [-π, π]。
 * 正值表示逆时针，负值表示顺时针。
 */
export function angleDiff(a1: number, a2: number): number {
    return normalizeAngle(a2 - a1)
}

/**
 * 在两个角度之间线性插值，走最短弧。
 * @param t - [0, 1] 插值因子
 */
export function lerpAngle(a1: number, a2: number, t: number): number {
    const da = angleDiff(a1, a2)
    return a1 + da * t
}

// ══════════════════════════════════════════════
// 点 / 向量运算
// ══════════════════════════════════════════════

/** 两点间的欧氏距离 */
export function distance(ax: number, ay: number, bx: number, by: number): number {
    return Math.hypot(ax - bx, ay - by)
}

/** IPoint 版本的距离 */
export function pointDistance(a: IPoint, b: IPoint): number {
    return Math.hypot(a.x - b.x, a.y - b.y)
}

/** 向量长度（模） */
export function length(x: number, y: number): number {
    return Math.hypot(x, y)
}

/** 单位向量，零向量返回 [0, 0] */
export function unit(dx: number, dy: number): [number, number] {
    const len = Math.hypot(dx, dy)
    return len < 1e-15 ? [0, 0] : [dx / len, dy / len]
}

/** 二维向量点积 */
export function dot(ax: number, ay: number, bx: number, by: number): number {
    return ax * bx + ay * by
}

/** 二维向量叉积的 z 分量 (ax*by - ay*bx) */
export function cross(ax: number, ay: number, bx: number, by: number): number {
    return ax * by - ay * bx
}

/** 两点中点 */
export function midpoint(ax: number, ay: number, bx: number, by: number): IPoint {
    return { x: (ax + bx) / 2, y: (ay + by) / 2 }
}

/** 点加向量 */
export function addPoint(a: IPoint, dx: number, dy: number): IPoint {
    return { x: a.x + dx, y: a.y + dy }
}

/** 两点相减得到向量 */
export function subPoint(a: IPoint, b: IPoint): { x: number; y: number } {
    return { x: a.x - b.x, y: a.y - b.y }
}

/** 向量缩放 */
export function scale(dx: number, dy: number, factor: number): [number, number] {
    return [dx * factor, dy * factor]
}

/**
 * 绕原点旋转向量 (dx, dy)。
 * @param angle - 旋转角度（弧度，逆时针为正）
 */
export function rotate(dx: number, dy: number, angle: number): [number, number] {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return [dx * cos - dy * sin, dx * sin + dy * cos]
}

/**
 * 左法线（逆时针旋转 90°）。
 * 在 canvas y-down 坐标系下，这是路径方向左侧。
 */
export function leftNormal(dx: number, dy: number): [number, number] {
    return [-dy, dx]
}

/**
 * 右法线（顺时针旋转 90°）。
 * 在 canvas y-down 坐标系下，这是路径方向右侧。
 */
export function rightNormal(dx: number, dy: number): [number, number] {
    return [dy, -dx]
}

/**
 * 向量 v 关于法线 n 的反射。
 * 常用于计算镜像方向。
 */
export function reflect(vx: number, vy: number, nx: number, ny: number): [number, number] {
    const d = dot(vx, vy, nx, ny)
    return [vx - 2 * d * nx, vy - 2 * d * ny]
}

/**
 * 点到直线的投影。
 * 直线由点 A 沿方向 (dirX, dirY) 定义。
 * @returns 投影点坐标和投影参数 t
 */
export function projectPointOnLine(
    px: number, py: number,
    ax: number, ay: number,
    dirX: number, dirY: number,
): { x: number; y: number; t: number } {
    const t = dot(px - ax, py - ay, dirX, dirY) / dot(dirX, dirY, dirX, dirY)
    return { x: ax + t * dirX, y: ay + t * dirY, t }
}

/**
 * 点到线段的最短距离。
 * A、B 为线段两端点。
 */
export function pointToSegmentDistance(
    px: number, py: number,
    ax: number, ay: number,
    bx: number, by: number,
): number {
    const abx = bx - ax, aby = by - ay
    const apx = px - ax, apy = py - ay
    const abLen2 = abx * abx + aby * aby
    if (abLen2 < 1e-15) return Math.hypot(apx, apy)

    let t = dot(apx, apy, abx, aby) / abLen2
    t = Math.max(0, Math.min(1, t))
    const cx = ax + t * abx, cy = ay + t * aby
    return Math.hypot(px - cx, py - cy)
}

// ══════════════════════════════════════════════
// 直线交点
// ══════════════════════════════════════════════

/**
 * 两条直线的交点。
 * 直线 1: A + s * dirA，直线 2: B + t * dirB。
 * 平行或重合时返回 null。
 */
export function lineIntersection(
    ax: number, ay: number, adx: number, ady: number,
    bx: number, by: number, bdx: number, bdy: number,
): IPoint | null {
    const det = cross(adx, ady, bdx, bdy)
    if (Math.abs(det) < 1e-12) return null
    const t = cross(bx - ax, by - ay, bdx, bdy) / det
    return { x: ax + t * adx, y: ay + t * ady }
}

/**
 * 两条线段的交点。
 * 线段有界时返回交点（含端点），否则只检查直线。
 * @param segmentMode - true 时限制在线段范围内
 * @returns 交点坐标和两线段上的参数 (t1, t2)
 */
export function segmentIntersection(
    ax: number, ay: number, bx: number, by: number,
    cx: number, cy: number, dx: number, dy: number,
    segmentMode = true,
): { x: number; y: number; t1: number; t2: number } | null {
    const adx = bx - ax, ady = by - ay
    const bdx = dx - cx, bdy = dy - cy
    const det = cross(adx, ady, bdx, bdy)
    if (Math.abs(det) < 1e-12) return null

    const acx = cx - ax, acy = cy - ay
    const t1 = cross(acx, acy, bdx, bdy) / det
    const t2 = cross(acx, acy, adx, ady) / det

    if (segmentMode) {
        if (t1 < -1e-12 || t1 > 1 + 1e-12 || t2 < -1e-12 || t2 > 1 + 1e-12) return null
    }

    return { x: ax + t1 * adx, y: ay + t1 * ady, t1, t2 }
}

// ══════════════════════════════════════════════
// 圆 / 弧运算
// ══════════════════════════════════════════════

/**
 * 根据圆心角计算圆上点的坐标。
 * @param angle - 弧度（从 x 轴正方向逆时针）
 */
export function pointOnCircle(cx: number, cy: number, r: number, angle: number): IPoint {
    return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
    }
}

/**
 * 从圆心指向点的角度。
 * 等价于 Math.atan2(py - cy, px - cx)。
 */
export function angleFromCenter(cx: number, cy: number, px: number, py: number): number {
    return Math.atan2(py - cy, px - cx)
}

/**
 * 两点与圆心构成的圆弧的圆心角（取最短弧）。
 */
export function arcCentralAngle(
    cx: number, cy: number,
    p1x: number, p1y: number,
    p2x: number, p2y: number,
): number {
    const a1 = angleFromCenter(cx, cy, p1x, p1y)
    const a2 = angleFromCenter(cx, cy, p2x, p2y)
    return Math.abs(angleDiff(a1, a2))
}

/**
 * 弧长 = 半径 * 圆心角（弧度）。
 */
export function arcLength(radius: number, centralAngleRad: number): number {
    return radius * centralAngleRad
}

// ══════════════════════════════════════════════
// 反三角函数恒等式（trig(invTrig(x))）
// ══════════════════════════════════════════════

/**
 * sin(arccos(x)) = √(1 - x²)，|x| ≤ 1
 *
 * 反余弦的正弦值总是非负（arccos ∈ [0, π] → sin ≥ 0）。
 */
export function sinAcos(x: number): number {
    return Math.sqrt(1 - x * x)
}

/**
 * cos(arcsin(x)) = √(1 - x²)，|x| ≤ 1
 *
 * 反正弦的余弦值总是非负（arcsin ∈ [-π/2, π/2] → cos ≥ 0）。
 */
export function cosAsin(x: number): number {
    return Math.sqrt(1 - x * x)
}

/**
 * tan(arcsin(x)) = x / √(1 - x²)，|x| < 1
 */
export function tanAsin(x: number): number {
    return x / Math.sqrt(1 - x * x)
}

/**
 * tan(arccos(x)) = √(1 - x²) / x，x ≠ 0
 */
export function tanAcos(x: number): number {
    return Math.sqrt(1 - x * x) / x
}

/**
 * sin(arctan(x)) = x / √(1 + x²)
 *
 * 推导：画直角三角形，对边 x，邻边 1 → 斜边 √(1+x²) → sin = 对边/斜边。
 */
export function sinAtan(x: number): number {
    return x / Math.sqrt(1 + x * x)
}

/**
 * cos(arctan(x)) = 1 / √(1 + x²)
 */
export function cosAtan(x: number): number {
    return 1 / Math.sqrt(1 + x * x)
}

// ══════════════════════════════════════════════
// 反三角函数复合公式（invTrig(trig(x)) 等）
// ══════════════════════════════════════════════

/** arcsin(x) + arccos(x) = π/2 */
export function asinPlusAcos(x: number): number {
    return Math.PI / 2
}

/** arctan(x) + arccot(x) = π/2 */
export function atanPlusAcot(x: number): number {
    return Math.PI / 2
}

/**
 * cos(arccos(x) / 2) = √((1 + x) / 2)，|x| ≤ 1
 *
 * 即半角公式：cos(θ/2) = √((1+cosθ)/2)，令 θ = arccos(x)。
 */
export function cosHalfAcos(x: number): number {
    return Math.sqrt((1 + x) / 2)
}

/**
 * sin(arccos(x) / 2) = √((1 - x) / 2)，|x| ≤ 1
 *
 * 半角：sin(θ/2) = √((1-cosθ)/2)，令 θ = arccos(x)。
 */
export function sinHalfAcos(x: number): number {
    return Math.sqrt((1 - x) / 2)
}

/**
 * sin(arcsin(x) / 2) = (√(1+x) - √(1-x)) / 2
 *
 * 源自半角恒等式和 sin(arcsin(x)/2) 的标准代数形式。
 */
export function sinHalfAsin(x: number): number {
    return (Math.sqrt(1 + x) - Math.sqrt(1 - x)) / 2
}

/**
 * cos(arcsin(x) / 2) = (√(1+x) + √(1-x)) / 2
 */
export function cosHalfAsin(x: number): number {
    return (Math.sqrt(1 + x) + Math.sqrt(1 - x)) / 2
}

/**
 * sin(2 · arcsin(x)) = 2x√(1 - x²)，|x| ≤ 1
 *
 * 即倍角：sin(2θ) = 2sinθcosθ，令 θ = arcsin(x)。
 */
export function sinDoubleAsin(x: number): number {
    return 2 * x * Math.sqrt(1 - x * x)
}

/**
 * cos(2 · arccos(x)) = 2x² - 1，|x| ≤ 1
 *
 * 即倍角：cos(2θ) = 2cos²θ - 1，令 θ = arccos(x)。
 */
export function cosDoubleAcos(x: number): number {
    return 2 * x * x - 1
}

/**
 * sin(2 · arccos(x)) = 2x√(1 - x²)，|x| ≤ 1
 */
export function sinDoubleAcos(x: number): number {
    return 2 * x * Math.sqrt(1 - x * x)
}

/**
 * cos(2 · arcsin(x)) = 1 - 2x²，|x| ≤ 1
 *
 * 即倍角：cos(2θ) = 1 - 2sin²θ，令 θ = arcsin(x)。
 */
export function cosDoubleAsin(x: number): number {
    return 1 - 2 * x * x
}

/**
 * arctan(1/x) = π/2 · sign(x) - arctan(x)，x ≠ 0
 *
 * 大于 0 时为 π/2 - arctan(x)，小于 0 时为 -π/2 - arctan(x)。
 */
export function atanReciprocal(x: number): number {
    if (x > 0) return Math.PI / 2 - Math.atan(x)
    return -Math.PI / 2 - Math.atan(x)
}

// ══════════════════════════════════════════════
// 插值与数值
// ══════════════════════════════════════════════

/** 线性插值 */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
}

/** IPoint 线性插值 */
export function lerpPoint(a: IPoint, b: IPoint, t: number): IPoint {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

/** 向量线性插值 */
export function lerpVec(ax: number, ay: number, bx: number, by: number, t: number): [number, number] {
    return [ax + (bx - ax) * t, ay + (by - ay) * t]
}

/** 将值限制在 [min, max] 区间内 */
export function clamp(value: number, min: number, max: number): number {
    return value < min ? min : value > max ? max : value
}

/** 将值从 [inMin, inMax] 映射到 [outMin, outMax] */
export function remap(
    value: number,
    inMin: number, inMax: number,
    outMin: number, outMax: number,
): number {
    if (Math.abs(inMax - inMin) < 1e-15) return outMin
    const t = (value - inMin) / (inMax - inMin)
    return outMin + clamp(t, 0, 1) * (outMax - outMin)
}

/** 将值从 [inMin, inMax] 映射到 [outMin, outMax]（不 clamp） */
export function remapUnclamped(
    value: number,
    inMin: number, inMax: number,
    outMin: number, outMax: number,
): number {
    if (Math.abs(inMax - inMin) < 1e-15) return outMin
    const t = (value - inMin) / (inMax - inMin)
    return outMin + t * (outMax - outMin)
}

// ══════════════════════════════════════════════
// 相位 / 平滑
// ══════════════════════════════════════════════

/**
 * 计算 sin(x) / x（sinc 函数），x = 0 时返回 1。
 * 常用于信号处理、平滑插值。
 */
export function sinc(x: number): number {
    if (Math.abs(x) < 1e-15) return 1
    return Math.sin(x) / x
}

/**
 * 贝塞尔平滑步进函数（3 次），t 在 [0, 1] 返回 [0, 1]。
 * 用于平滑过渡：端点为 0 和 1，中间段平滑。
 */
export function smoothstep(t: number): number {
    const c = clamp(t, 0, 1)
    return c * c * (3 - 2 * c)
}

/**
 * 更平滑的步进函数（5 次），一阶和二阶导数在端点处也连续。
 */
export function smootherstep(t: number): number {
    const c = clamp(t, 0, 1)
    return c * c * c * (c * (c * 6 - 15) + 10)
}

// ══════════════════════════════════════════════
// 倒数三角函数
// ══════════════════════════════════════════════

/** 正割 sec(θ) = 1 / cos(θ) */
export function sec(angle: number): number {
    return 1 / Math.cos(angle)
}

/** 余割 csc(θ) = 1 / sin(θ) */
export function csc(angle: number): number {
    return 1 / Math.sin(angle)
}

/** 余切 cot(θ) = 1 / tan(θ) = cos(θ) / sin(θ) */
export function cot(angle: number): number {
    return 1 / Math.tan(angle)
}

// ══════════════════════════════════════════════
// 诱导公式 / 归约公式 (Reduction)
// ══════════════════════════════════════════════

/**
 * 将任意角度归约到 [0, π/2) 并返回象限信息。
 * 用于将任意角的三角函数转化为锐角三角函数。
 *
 * @returns [锐角, 象限(1~4)]
 *
 * @example
 *   reduceAngle(rad2deg(225)) → [45°, 3]   // sin225 = -sin45
 */
export function reduceAngle(angle: number): [number, number] {
    const a = normalizeAnglePositive(angle)
    const q = Math.floor(a / (Math.PI / 2)) + 1
    const r = a % (Math.PI / 2)
    return [r, q]
}

/** 任意角的 sin 通过归约公式计算（避免直接 sin 可能的精度损失） */
export function sinReduced(angle: number): number {
    const [r, q] = reduceAngle(angle)
    const s = Math.sin(r), c = Math.cos(r)
    switch (q) {
        case 1: return s      // I:  sin(a) = sin(a)
        case 2: return c      // II: sin(π-a) = cos(a)  实际上是 sin(r+π/2)=cos(r)
        case 3: return -s     // III: sin(π+a) = -sin(a)
        case 4: return -c     // IV: sin(2π-a) = -cos(a) 实际上是 sin(r+3π/2)=-cos(r)
        default: return Math.sin(angle)
    }
}

/** 任意角的 cos 通过归约公式计算 */
export function cosReduced(angle: number): number {
    const [r, q] = reduceAngle(angle)
    const s = Math.sin(r), c = Math.cos(r)
    switch (q) {
        case 1: return c         // I
        case 2: return -s        // II: cos(π/2+r) = -sin(r)
        case 3: return -c        // III
        case 4: return s         // IV
        default: return Math.cos(angle)
    }
}

// ══════════════════════════════════════════════
// 恒等式：和差 / 倍角 / 半角
// ══════════════════════════════════════════════

/** sin(a ± b) = sin(a)cos(b) ± cos(a)sin(b) */
export function sinAdd(a: number, b: number, plus = true): number {
    if (plus) return Math.sin(a) * Math.cos(b) + Math.cos(a) * Math.sin(b)
    return Math.sin(a) * Math.cos(b) - Math.cos(a) * Math.sin(b)
}

/** cos(a ± b) = cos(a)cos(b) ∓ sin(a)sin(b) */
export function cosAdd(a: number, b: number, plus = true): number {
    if (plus) return Math.cos(a) * Math.cos(b) - Math.sin(a) * Math.sin(b)
    return Math.cos(a) * Math.cos(b) + Math.sin(a) * Math.sin(b)
}

/** tan(a ± b) = (tan(a) ± tan(b)) / (1 ∓ tan(a)tan(b)) */
export function tanAdd(a: number, b: number, plus = true): number {
    const ta = Math.tan(a), tb = Math.tan(b)
    if (plus) return (ta + tb) / (1 - ta * tb)
    return (ta - tb) / (1 + ta * tb)
}

/** sin(2a) = 2sin(a)cos(a) */
export function sinDouble(a: number): number {
    return 2 * Math.sin(a) * Math.cos(a)
}

/** cos(2a) = cos²(a) - sin²(a) = 2cos²(a) - 1 = 1 - 2sin²(a) */
export function cosDouble(a: number): number {
    return Math.cos(a) * Math.cos(a) - Math.sin(a) * Math.sin(a)
}

/** tan(2a) = 2tan(a) / (1 - tan²(a)) */
export function tanDouble(a: number): number {
    const t = Math.tan(a)
    return 2 * t / (1 - t * t)
}

/** sin(3a) = 3sin(a) - 4sin³(a) */
export function sinTriple(a: number): number {
    const s = Math.sin(a)
    return 3 * s - 4 * s * s * s
}

/** cos(3a) = 4cos³(a) - 3cos(a) */
export function cosTriple(a: number): number {
    const c = Math.cos(a)
    return 4 * c * c * c - 3 * c
}

/** tan(3a) = (3tan(a) - tan³(a)) / (1 - 3tan²(a)) */
export function tanTriple(a: number): number {
    const t = Math.tan(a)
    return (3 * t - t * t * t) / (1 - 3 * t * t)
}

/** sin(a/2) = ±√((1-cos(a))/2)（取正值） */
export function sinHalf(a: number, sign: number = 1): number {
    return sign * Math.sqrt((1 - Math.cos(a)) / 2)
}

/** cos(a/2) = ±√((1+cos(a))/2)（取正值） */
export function cosHalf(a: number, sign: number = 1): number {
    return sign * Math.sqrt((1 + Math.cos(a)) / 2)
}

/** tan(a/2) = ±√((1-cos(a))/(1+cos(a)))（取正值） */
export function tanHalf(a: number, sign: number = 1): number {
    const ca = Math.cos(a)
    return sign * Math.sqrt((1 - ca) / (1 + ca))
}

// ── 降幂公式 (Power-Reduction) ──

/** sin²(a) = (1 - cos(2a)) / 2 */
export function sinPower2(a: number): number {
    return (1 - Math.cos(2 * a)) / 2
}

/** cos²(a) = (1 + cos(2a)) / 2 */
export function cosPower2(a: number): number {
    return (1 + Math.cos(2 * a)) / 2
}

/** tan²(a) = (1 - cos(2a)) / (1 + cos(2a)) */
export function tanPower2(a: number): number {
    const c = Math.cos(2 * a)
    return (1 - c) / (1 + c)
}

// ── 万能公式 (Universal Substitution: t = tan(a/2)) ──

/**
 * 万能公式：sin(a)，令 t = tan(a/2)。
 * sin(a) = 2t / (1 + t²)
 */
export function sinFromHalfTan(t: number): number {
    return 2 * t / (1 + t * t)
}

/**
 * 万能公式：cos(a)，令 t = tan(a/2)。
 * cos(a) = (1 - t²) / (1 + t²)
 */
export function cosFromHalfTan(t: number): number {
    return (1 - t * t) / (1 + t * t)
}

/**
 * 万能公式：tan(a)，令 t = tan(a/2)。
 * tan(a) = 2t / (1 - t²)
 */
export function tanFromHalfTan(t: number): number {
    return 2 * t / (1 - t * t)
}

// ══════════════════════════════════════════════
// 积化和差 / 和差化积
// ══════════════════════════════════════════════

/** sin(A)cos(B) = 1/2[sin(A+B) + sin(A-B)] */
export function sinCosProduct(a: number, b: number): number {
    return 0.5 * (Math.sin(a + b) + Math.sin(a - b))
}

/** cos(A)sin(B) = 1/2[sin(A+B) - sin(A-B)] */
export function cosSinProduct(a: number, b: number): number {
    return 0.5 * (Math.sin(a + b) - Math.sin(a - b))
}

/** cos(A)cos(B) = 1/2[cos(A-B) + cos(A+B)] */
export function cosCosProduct(a: number, b: number): number {
    return 0.5 * (Math.cos(a - b) + Math.cos(a + b))
}

/** sin(A)sin(B) = 1/2[cos(A-B) - cos(A+B)] */
export function sinSinProduct(a: number, b: number): number {
    return 0.5 * (Math.cos(a - b) - Math.cos(a + b))
}

/** sin(P) + sin(Q) = 2 sin((P+Q)/2) cos((P-Q)/2) */
export function sinPlusSin(p: number, q: number): number {
    return 2 * Math.sin((p + q) / 2) * Math.cos((p - q) / 2)
}

/** sin(P) - sin(Q) = 2 cos((P+Q)/2) sin((P-Q)/2) */
export function sinMinusSin(p: number, q: number): number {
    return 2 * Math.cos((p + q) / 2) * Math.sin((p - q) / 2)
}

/** cos(P) + cos(Q) = 2 cos((P+Q)/2) cos((P-Q)/2) */
export function cosPlusCos(p: number, q: number): number {
    return 2 * Math.cos((p + q) / 2) * Math.cos((p - q) / 2)
}

/** cos(P) - cos(Q) = -2 sin((P+Q)/2) sin((P-Q)/2) */
export function cosMinusCos(p: number, q: number): number {
    return -2 * Math.sin((p + q) / 2) * Math.sin((p - q) / 2)
}

// ══════════════════════════════════════════════
// 三角形公式
// ══════════════════════════════════════════════

/**
 * 给定两边及夹角，计算第三边（余弦定理）。
 * c² = a² + b² - 2ab·cos(C)
 *
 * @param a, b - 已知两边长度
 * @param angleC - a 与 b 的夹角（弧度）
 * @returns 第三边长度
 */
export function lawOfCosines(a: number, b: number, angleC: number): number {
    return Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(angleC))
}

/**
 * 给定三边，计算角 A 的对角（余弦定理反求角）。
 * cos(A) = (b² + c² - a²) / (2bc)
 *
 * @param a - 对角为 A 的边
 * @param b, c - 另两边
 * @returns 角 A（弧度，[0, π]）
 */
export function lawOfCosinesAngle(a: number, b: number, c: number): number {
    return Math.acos(clamp((b * b + c * c - a * a) / (2 * b * c), -1, 1))
}

/**
 * 已知一边和两角，求对边（正弦定理）。
 * a / sin(A) = b / sin(B) = c / sin(C) = 2R
 */
export function lawOfSines(
    side: number,         // 已知边
    angleOpposite: number, // 已知边的对角（弧度）
    angleTarget: number,   // 目标角（弧度）
): number {
    return side * Math.sin(angleTarget) / Math.sin(angleOpposite)
}

/** 三角形面积 = 1/2 · a · b · sin(C)（两边及夹角） */
export function triangleArea(a: number, b: number, angleC: number): number {
    return 0.5 * a * b * Math.sin(angleC)
}

/** 三角形面积（海伦公式）：三边已知 */
export function triangleAreaHeron(a: number, b: number, c: number): number {
    const s = (a + b + c) / 2
    return Math.sqrt(s * (s - a) * (s - b) * (s - c))
}

// ══════════════════════════════════════════════
// 角平分线 / 方向平分线
// ══════════════════════════════════════════════

/**
 * 三角形角平分线长度（从顶点 A 出发）。
 *
 * l_a = (2bc · cos(A/2)) / (b + c)
 *
 * @param b, c - 顶点 A 的两邻边
 * @param angleA - 顶点 A 的对角（弧度）
 */
export function angleBisectorLength(b: number, c: number, angleA: number): number {
    return (2 * b * c * Math.cos(angleA / 2)) / (b + c)
}

/**
 * 角平分线分对边成比例：BD : DC = AB : AC。
 *
 * @returns 分点 D 将 BC 分成 BD:DC 的两段长度
 */
export function angleBisectorSplit(
    a: number,     // 对边 BC 总长
    b: number,     // 邻边 AB
    c: number,     // 邻边 AC
): { bd: number; dc: number } {
    const ratio = c / (b + c)
    const bd = a * ratio
    return { bd, dc: a - bd }
}

/**
 * 三角形内心坐标（三边交点）。
 * 内心到三边等距，为角平分线交点。
 *
 * 坐标 = (ax·a + bx·b + cx·c) / (a+b+c)（以边长为权重的加权重心）。
 */
export function incenter(
    ax: number, ay: number,
    bx: number, by: number,
    cx: number, cy: number,
    a?: number, b?: number, c?: number,
): IPoint {
    const sideA = a ?? distance(bx, by, cx, cy)  // 边 a = BC
    const sideB = b ?? distance(cx, cy, ax, ay)  // 边 b = CA
    const sideC = c ?? distance(ax, ay, bx, by)  // 边 c = AB
    const perimeter = sideA + sideB + sideC
    return {
        x: (sideA * ax + sideB * bx + sideC * cx) / perimeter,
        y: (sideA * ay + sideB * by + sideC * cy) / perimeter,
    }
}

/**
 * 三角形的旁心（与边 a 相对的旁心，即 ∠A 的内角平分线和 ∠B、∠C 的外角平分线交点）。
 *
 * 坐标权重：(-a, b, c) / (-a+b+c)。
 */
export function excenter(
    ax: number, ay: number,
    bx: number, by: number,
    cx: number, cy: number,
    a?: number, b?: number, c?: number,
): IPoint {
    const sideA = a ?? distance(bx, by, cx, cy)
    const sideB = b ?? distance(cx, cy, ax, ay)
    const sideC = c ?? distance(ax, ay, bx, by)
    const sum = -sideA + sideB + sideC
    return {
        x: (-sideA * ax + sideB * bx + sideC * cx) / sum,
        y: (-sideA * ay + sideB * by + sideC * cy) / sum,
    }
}

/**
 * 两条方向向量的角平分线方向（单位向量）。
 *
 * 给定单位向量 u 和 v，其和 u+v 的方向即为角平分线方向。
 * 若夹角 > π 则取较长对角线。
 *
 * @param ux, uy - 单位向量 1
 * @param vx, vy - 单位向量 2
 * @returns 角平分线的单位方向向量 [dx, dy]
 */
export function angleBisectorDirection(
    ux: number, uy: number,
    vx: number, vy: number,
): [number, number] {
    const sx = ux + vx, sy = uy + vy
    return unit(sx, sy)
}

/**
 * 两条方向向量夹角中点的角度。
 * 等价于 (atan2(u) + atan2(v)) / 2，必要时 +π 修正。
 *
 * @returns 角平分线角度（弧度）
 */
export function angleBisectorAngle(
    ux: number, uy: number,
    vx: number, vy: number,
): number {
    const a1 = Math.atan2(uy, ux)
    const a2 = Math.atan2(vy, vx)
    const mid = (a1 + a2) / 2
    const da = angleDiff(a1, a2)
    // 若夹角 > π，则平分线应取对侧
    return Math.abs(da) > Math.PI / 2 ? normalizeAngle(mid + Math.PI) : mid
}

// ══════════════════════════════════════════════
// 极坐标转换
// ══════════════════════════════════════════════

/** 直角坐标 (x, y) 转极坐标 (r, θ) */
export function toPolar(x: number, y: number): { r: number; theta: number } {
    return { r: Math.hypot(x, y), theta: Math.atan2(y, x) }
}

/** 极坐标 (r, θ) 转直角坐标 (x, y) */
export function toCartesian(r: number, theta: number): IPoint {
    return { x: r * Math.cos(theta), y: r * Math.sin(theta) }
}

// ══════════════════════════════════════════════
// 点在多边形/路径内的判定
// ══════════════════════════════════════════════

/**
 * 点到点序列的最近距离（多段线距离）。
 */
export function pointToPolylineDistance(
    px: number, py: number,
    pts: IPoint[],
): number {
    if (pts.length < 2) return pts.length === 1
        ? Math.hypot(px - pts[0].x, py - pts[0].y)
        : Infinity

    let minDist = Infinity
    for (let i = 0; i < pts.length - 1; i++) {
        const d = pointToSegmentDistance(px, py, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y)
        if (d < minDist) minDist = d
    }
    return minDist
}
