import { Vector2Like } from "./Vector2"
import { nCr } from "./MathUtils"

/** 判断浮点数是否接近零 */
const isNearZero = (v: number, eps = 1e-10): boolean => Math.abs(v) <= eps

/** 德卡斯特里奥算法计算 N 阶贝塞尔曲线上参数 t 处的点 */
export const deCasteljau = (points: Vector2Like[], t: number): Vector2Like => {
    const n = points.length
    if (n === 0) return { x: 0, y: 0 }
    if (n === 1) return { x: points[0].x, y: points[0].y }

    // 迭代线性插值，每次减少一个点
    const work = points.map(p => ({ x: p.x, y: p.y }))
    for (let k = 1; k < n; k++) {
        for (let i = 0; i < n - k; i++) {
            work[i].x += (work[i + 1].x - work[i].x) * t
            work[i].y += (work[i + 1].y - work[i].y) * t
        }
    }
    return work[0]
}

/** 计算 N 阶贝塞尔曲线在 t 处的一阶导数（切向量） */
export const derivative = (points: Vector2Like[], t: number): Vector2Like => {
    return deCasteljau(derivativeControlPoints(points), t)
}

/** 计算 N 阶贝塞尔曲线一阶导数的控制点（共 n-1 个点） */
export const derivativeControlPoints = (points: Vector2Like[]): Vector2Like[] => {
    const n = points.length
    if (n < 2) return []
    const dp: Vector2Like[] = []
    for (let i = 0; i < n - 1; i++) {
        dp.push({
            x: (n - 1) * (points[i + 1].x - points[i].x),
            y: (n - 1) * (points[i + 1].y - points[i].y),
        })
    }
    return dp
}

/** 贝塞尔曲线伯恩斯坦基函数: B(i, n, t) = C(n, i) * t^i * (1-t)^(n-i) */
export const bernstein = (i: number, n: number, t: number): number => {

    return nCr(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i)
}

/** 基于伯恩斯坦基函数计算 N 阶贝塞尔曲线上参数 t 处的点: sum(P[i] * B(i, n, t), i=0..n) */
export const evaluate = (points: Vector2Like[], t: number): Vector2Like => {
    const n = points.length - 1
    let x = 0
    let y = 0
    for (let i = 0; i <= n; i++) {
        const b = bernstein(i, n, t)
        x += points[i].x * b
        y += points[i].y * b
    }
    return { x, y }
}

/** 基于伯恩斯坦基函数对数值序列求值: Σ values[i] * B(i, n, t) */
export const evaluateValues = (values: number[], t: number): number => {
    const n = values.length - 1
    let result = 0
    for (let i = 0; i <= n; i++) {
        result += values[i] * bernstein(i, n, t)
    }
    return result
}

/** 基于伯恩斯坦基函数计算 N 阶贝塞尔曲线在 t 处的一阶导数: n * Σ_{i=0}^{n-1} (P_{i+1} - P_i) * B_{i, n-1}(t) */
export const derivative1 = (points: Vector2Like[], t: number): Vector2Like => {
    const n = points.length - 1
    if (n < 1) return { x: 0, y: 0 }
    const m = n - 1
    let x = 0, y = 0
    for (let i = 0; i <= m; i++) {
        const b = bernstein(i, m, t)
        x += (points[i + 1].x - points[i].x) * b
        y += (points[i + 1].y - points[i].y) * b
    }
    return { x: x * n, y: y * n }
}

/** 基于伯恩斯坦基函数计算 N 阶贝塞尔曲线在 t 处的 k 阶导数
 *  d^k/dt^k B(t) = n!/(n-k)! * Σ_{i=0}^{n-k} Δ^k P_i * B_{i, n-k}(t)
 */
export const derivativeN = (points: Vector2Like[], k: number, t: number): Vector2Like => {
    const n = points.length - 1
    if (k <= 0) return evaluate(points, t)
    if (k > n) return { x: 0, y: 0 }

    // 计算 k 阶前向差分 Δ^k P_i
    const diff = points.map(p => ({ x: p.x, y: p.y }))
    for (let order = 0; order < k; order++) {
        for (let i = 0; i < n - order; i++) {
            diff[i].x = diff[i + 1].x - diff[i].x
            diff[i].y = diff[i + 1].y - diff[i].y
        }
    }

    // 阶乘因子: n!/(n-k)!
    const factor = factorial(n) / factorial(n - k)

    // 用降阶后的伯恩斯坦基求和
    const m = n - k
    let x = 0, y = 0
    for (let i = 0; i <= m; i++) {
        const b = bernstein(i, m, t)
        x += diff[i].x * b
        y += diff[i].y * b
    }

    return { x: x * factor, y: y * factor }
}

/** 阶乘 */
const factorial = (n: number): number => {
    let result = 1
    for (let i = 2; i <= n; i++) result *= i
    return result
}

/** 二阶贝塞尔曲线 evaluate */
export const quadraticEvaluate = (p0: Vector2Like, p1: Vector2Like, p2: Vector2Like, t: number): Vector2Like => {
    const mt = 1 - t
    return {
        x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
        y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
    }
}

/** 三阶贝塞尔曲线 evaluate */
export const cubicEvaluate = (p0: Vector2Like, p1: Vector2Like, p2: Vector2Like, p3: Vector2Like, t: number): Vector2Like => {
    const mt = 1 - t
    const mt2 = mt * mt
    const mt3 = mt2 * mt
    const t2 = t * t
    const t3 = t2 * t
    return {
        x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
        y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
    }
}

/** 二阶贝塞尔提升为三阶 */
export const quadraticToCubic = (p0: Vector2Like, p1: Vector2Like, p2: Vector2Like): [Vector2Like, Vector2Like, Vector2Like, Vector2Like] => {
    return [
        { x: p0.x, y: p0.y },
        { x: p0.x / 3 + (2 / 3) * p1.x, y: p0.y / 3 + (2 / 3) * p1.y },
        { x: (2 / 3) * p1.x + p2.x / 3, y: (2 / 3) * p1.y + p2.y / 3 },
        { x: p2.x, y: p2.y },
    ]
}

/** 贝塞尔曲线的弧长（数值积分 - Simpson 法则） */
export const arcLength = (points: Vector2Like[], segments: number = 16): number => {
    let length = 0
    const dt = 1 / segments
    let prev = deCasteljau(points, 0)
    for (let i = 1; i <= segments; i++) {
        const t = i * dt
        const curr = deCasteljau(points, t)
        const dx = curr.x - prev.x
        const dy = curr.y - prev.y
        length += Math.sqrt(dx * dx + dy * dy)
        prev = curr
    }
    return length
}

/** 贝塞尔曲线上 t 处的法向量（旋转 90° 的归一化切向量） */
export const normal = (points: Vector2Like[], t: number): Vector2Like => {
    const d = derivative(points, t)
    const len = Math.sqrt(d.x * d.x + d.y * d.y)
    if (len === 0) return { x: 0, y: 0 }
    return { x: -d.y / len, y: d.x / len }
}

/** 贝塞尔曲线在 t 处的曲率 */
export const curvature = (points: Vector2Like[], t: number): number => {
    const n = points.length
    if (n < 3) return 0

    // 一阶和二阶导数
    const d1 = derivative(points, t)

    // 二阶导数的控制点 = (n-1)(n-2) * (P[i+2] - 2P[i+1] + P[i])
    const dp2 = []
    for (let i = 0; i < n - 2; i++) {
        dp2.push({
            x: (n - 1) * (n - 2) * (points[i + 2].x - 2 * points[i + 1].x + points[i].x),
            y: (n - 1) * (n - 2) * (points[i + 2].y - 2 * points[i + 1].y + points[i].y),
        })
    }
    const d2 = dp2.length > 0 ? deCasteljau(dp2, t) : { x: 0, y: 0 }

    // k = |d1 × d2| / |d1|³
    const cross = d1.x * d2.y - d1.y * d2.x
    const lenSq = d1.x * d1.x + d1.y * d1.y
    if (lenSq === 0) return 0
    return Math.abs(cross) / Math.pow(lenSq, 1.5)
}

/**
 * 查找 N 阶贝塞尔曲线的极值 t 值（一阶导数为零处）
 * 对 N<=3 使用解析求解，更高阶使用数值方法
 * @returns 在 (0,1) 区间内的极值 t 值数组（已排序去重）
 */
export const extrema = (points: Vector2Like[]): number[] => {
    const n = points.length - 1
    if (n < 1) return []
    const roots: number[] = []

    const dp = derivativeControlPoints(points) // degree m = n-1

    // 通用方法：采样 + 二分法精炼
    const findRoots = (values: number[]): number[] => {
        const deg = values.length - 1
        const res: number[] = []

        // 采样 sign 变化
        const SAMPLES = Math.max(deg * 4, 20)
        const evaluateAt = (t: number): number => {
            // 用 deCasteljau 计算导数值
            const tmp = values.map(v => v)
            for (let k = 1; k <= deg; k++) {
                for (let i = 0; i <= deg - k; i++) {
                    tmp[i] += (tmp[i + 1] - tmp[i]) * t
                }
            }
            return tmp[0]
        }

        let prev = evaluateAt(0)
        for (let i = 1; i <= SAMPLES; i++) {
            const t = i / SAMPLES
            const curr = evaluateAt(t)
            if (prev * curr < 0 || isNearZero(curr)) {
                // 二分法精炼
                let lo = (i - 1) / SAMPLES, hi = t
                let mid = (lo + hi) / 2
                if (!isNearZero(curr)) {
                    for (let iter = 0; iter < 20; iter++) {
                        mid = (lo + hi) / 2
                        const v = evaluateAt(mid)
                        if (v * evaluateAt(lo) <= 0) hi = mid
                        else lo = mid
                        if (hi - lo < 1e-10) break
                    }
                    if (mid > 0 && mid < 1) res.push(mid)
                } else if (t > 0 && t < 1) {
                    res.push(t)
                }
            }
            prev = curr
        }

        return res
    }

    // x 分量导数的根
    const xValues = dp.map(p => p.x)
    for (const t of findRoots(xValues)) {
        if (t > 0 && t < 1 && !roots.some(r => isNearZero(r - t))) {
            roots.push(t)
        }
    }

    // y 分量导数的根
    const yValues = dp.map(p => p.y)
    for (const t of findRoots(yValues)) {
        if (t > 0 && t < 1 && !roots.some(r => isNearZero(r - t))) {
            roots.push(t)
        }
    }

    return roots.sort((a, b) => a - b)
}

/**
 * 查找贝塞尔曲线上最大曲率处的 t 值
 * @param samples - 初始采样点数（默认 20）
 * @returns 最大曲率对应的 t 值
 */
export const maxCurvature = (points: Vector2Like[], samples: number = 20): number => {
    // 采样找最佳初始值
    let bestT = 0
    let maxK = -Infinity
    for (let i = 0; i <= samples; i++) {
        const t = i / samples
        const k = curvature(points, t)
        if (k > maxK) {
            maxK = k
            bestT = t
        }
    }

    // 黄金分割搜索精炼
    const phi = (Math.sqrt(5) - 1) / 2
    let a = Math.max(0, bestT - 1 / samples)
    let b = Math.min(1, bestT + 1 / samples)
    let c = b - phi * (b - a)
    let d = a + phi * (b - a)
    const fc = curvature(points, c)
    const fd = curvature(points, d)

    for (let iter = 0; iter < 30; iter++) {
        if (Math.abs(b - a) < 1e-10) break
        if (fc > fd) {
            b = d
            d = c
            c = b - phi * (b - a)
        } else {
            a = c
            c = d
            d = a + phi * (b - a)
        }
    }

    return (a + b) / 2
}

/**
 * 计算点到 N 阶贝塞尔曲线的最小距离及对应 t 值
 * 采样 + Newton 迭代精炼
 * @param samples - 采样点数（默认 16）
 * @param iterations - Newton 迭代次数（默认 8）
 * @returns { t, distance } 最近点的 t 值和距离
 */
export const project = (points: Vector2Like[], px: number, py: number, samples: number = 16, iterations: number = 8): { t: number; distance: number } => {
    // 采样找最佳初始 t
    let bestT = 0
    let minDist2 = Infinity

    const evalPt = (t: number): { x: number; y: number } => {
        return deCasteljau(points, t)
    }

    for (let i = 0; i <= samples; i++) {
        const t = i / samples
        const p = evalPt(t)
        const dx = p.x - px
        const dy = p.y - py
        const d2 = dx * dx + dy * dy
        if (d2 < minDist2) {
            minDist2 = d2
            bestT = t
        }
    }

    // Newton 迭代求解 (B(t) - P) · B'(t) = 0
    let t = bestT
    for (let iter = 0; iter < iterations; iter++) {
        const p = evalPt(t)
        const d1 = derivative(points, t)
        const d2 = derivativeN(points, 2, t)

        // f(t) = (B-P) · B'
        const fx = p.x - px, fy = p.y - py
        const ft = fx * d1.x + fy * d1.y
        // f'(t) = B'·B' + (B-P)·B''
        const ft2 = d1.x * d1.x + d1.y * d1.y + fx * d2.x + fy * d2.y

        if (isNearZero(ft2)) break
        t = t - ft / ft2
        t = Math.max(0, Math.min(1, t))
    }

    // 用最终 t 计算距离
    const p = evalPt(t)
    const dx = p.x - px, dy = p.y - py
    const d2 = dx * dx + dy * dy
    if (d2 < minDist2) minDist2 = d2

    // 检查端点
    const p0 = evalPt(0), p1 = evalPt(1)
    const d0x = p0.x - px, d0y = p0.y - py
    const d1x = p1.x - px, d1y = p1.y - py
    const d02 = d0x * d0x + d0y * d0y
    const d12 = d1x * d1x + d1y * d1y

    if (d02 < minDist2) {
        minDist2 = d02
        t = 0
    }
    if (d12 < minDist2) {
        minDist2 = d12
        t = 1
    }

    return { t, distance: Math.sqrt(minDist2) }
}
