/**
 * 数学工具函数
 *
 * 提供数值钳制、插值、角度换算、随机、极坐标转换等常用工具。
 */

export const DEG_TO_RAD = Math.PI / 180
export const RAD_TO_DEG = 180 / Math.PI
export const EPSILON = 1e-6

/** 钳制到 [min, max] */
export function clamp(value: number, min: number, max: number): number {
    return value < min ? min : value > max ? max : value
}

/** 归一化到 [0, 1) */
export function fract(value: number): number {
    return value - Math.floor(value)
}

/** 线性插值：a + (b - a) * t */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
}

/** 反向插值：返回 t 使得 lerp(a, b, t) = v */
export function inverseLerp(a: number, b: number, v: number): number {
    return a !== b ? (v - a) / (b - a) : 0
}

/** 将 v 从 [a, b] 映射到 [c, d] */
export function map(v: number, a: number, b: number, c: number, d: number): number {
    return c + ((v - a) / (b - a)) * (d - c)
}

/** 平滑插值（Hermite）：t * t * (3 - 2t) */
export function smoothstep(a: number, b: number, x: number): number {
    const t = clamp((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)
}

export function toRadians(degrees: number): number {
    return degrees * DEG_TO_RAD
}

export function toDegrees(radians: number): number {
    return radians * RAD_TO_DEG
}

/** 判断两个数值在给定容差内相等 */
export function nearlyEqual(a: number, b: number, epsilon = EPSILON): boolean {
    return Math.abs(a - b) < epsilon
}

export function isPowerOfTwo(value: number): boolean {
    return value > 0 && (value & (value - 1)) === 0
}

/** 向上取最近的 2 的幂 */
export function ceilPowerOfTwo(value: number): number {
    if (value <= 0) return 1
    let p = 1
    while (p < value) p <<= 1
    return p
}

/** 符号函数：正 1 / 负 -1 / 零 0 */
export function sign(value: number): number {
    return value > 0 ? 1 : value < 0 ? -1 : 0
}

/** [min, max) 区间随机数 */
export function random(min = 0, max = 1): number {
    return min + Math.random() * (max - min)
}

/** [min, max] 区间随机整数 */
export function randomInt(min: number, max: number): number {
    return Math.floor(random(min, max + 1))
}

/** 从数组随机取一个元素 */
export function randomItem<T>(array: readonly T[]): T {
    return array[Math.floor(Math.random() * array.length)]
}

/** 随机颜色（16 进制） */
export function randomColor(): number {
    return (Math.random() * 0xffffff) | 0
}

/** 角度归一化到 [-PI, PI] */
export function normalizeAngle(angle: number): number {
    angle %= Math.PI * 2
    if (angle > Math.PI) angle -= Math.PI * 2
    if (angle < -Math.PI) angle += Math.PI * 2
    return angle
}

/** 两个角度差，结果在 [-PI, PI] */
export function angleDifference(a: number, b: number): number {
    return normalizeAngle(a - b)
}

/** 角度插值（沿最短路径） */
export function lerpAngle(a: number, b: number, t: number): number {
    return a + angleDifference(b, a) * t
}

/** 极坐标 → 直角坐标 */
export function polar(radius: number, angle: number): { x: number; y: number } {
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }
}

/** 直角坐标 → 极坐标 */
export function cartesianToPolar(x: number, y: number): { radius: number; angle: number } {
    return { radius: Math.hypot(x, y), angle: Math.atan2(y, x) }
}

/** 数值取整到最近的 step 倍数 */
export function roundTo(value: number, step: number): number {
    return Math.round(value / step) * step
}

/** 线性贝塞尔插值（可扩展为 n 阶） */
export function bezier(controlPoints: readonly number[], t: number): number {
    // De Casteljau 算法
    let pts = controlPoints.slice()
    while (pts.length > 1) {
        const next: number[] = []
        for (let i = 0; i < pts.length - 1; i++) {
            next.push(lerp(pts[i], pts[i + 1], t))
        }
        pts = next
    }
    return pts[0]
}

/** 三次缓动曲线（cubic-bezier 求值，用于动画） */
export function cubicBezier(p1x: number, p1y: number, p2x: number, p2y: number, t: number): number {
    const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx
    const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by
    // 二分求 x 对应 t
    let lo = 0, hi = 1
    for (let i = 0; i < 20; i++) {
        const mid = (lo + hi) / 2
        const x = ((ax * mid + bx) * mid + cx) * mid
        if (x < t) lo = mid
        else hi = mid
    }
    const u = (lo + hi) / 2
    return ((ay * u + by) * u + cy) * u
}
