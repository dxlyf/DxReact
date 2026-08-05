// ============================================================
// 填充方式二：Cairo 风格——扫描线跨度 + 解析像素覆盖率
//
// 对应真实 Cairo（cairo image backend）的填充与抗锯齿方式：
//   cairo_fixed_t 是 24.8 定点数（8 位小数），扫描线转换器把多边形
//   逐像素带处理，得到多边形在每条扫描线上的"跨度"（span）。
//   抗锯齿不是采样，而是对每个像素求多边形与其像素矩形的**交集面积**
//   （解析几何），面积比例即覆盖率 → 8-bit alpha。
//
// 本实现（简化版）：
//   1. 顶点转 Q24.8 定点，构建边表（跳过水平边）
//   2. 对每个像素带 [row, row+1)，先在带内按"边的端点 y"切分子带——
//      子带内活性边集合恒定，保证奇偶配对稳定
//   3. 子带内活性边按 x 排序、奇偶配对（偶入奇出）
//   4. 对每条跨度用解析积分求其与像素矩形的交集面积（覆盖梯形），
//      面积在拐点处细分、逐段梯形求积——对直线边是精确的
//   5. 覆盖面积之和 = 像素覆盖率（像素面积为 1）
//
// 与 SSAA 的区别：不采样，直接解出面积，精度无损且更快。
// ============================================================

import type { PolyVertex, FillColor } from './fillScanlineSSAA'

/** Q24.8 固定浮点数（对齐 cairo_fixed_t：24 位整数 + 8 位小数） */
type Q24_8 = number
class Fx24 {
    static SHIFT = 8
    static VALUE = 1 << 8
    static from(v: number): Q24_8 { return Math.round(v * Fx24.VALUE) }
    static to(v: Q24_8): number { return v / Fx24.VALUE }
    static mul(a: Q24_8, b: Q24_8): Q24_8 { return Math.round((a * b) / Fx24.VALUE) }
    static div(a: Q24_8, b: Q24_8): Q24_8 {
        if (b === 0) return 0
        return Math.round((a * Fx24.VALUE) / b)
    }
}

/** 边表条目（全部为 Q24.8 定点） */
interface CairoEdge {
    x: Q24_8,     // 在 minY 处的 x
    minY: Q24_8,  // y 下限（含）
    maxY: Q24_8,  // y 上限（不含）
    slope: Q24_8, // Δx/Δy
}

/**
 * 解析积分：跨度 [L(y), R(y)]（均为 y 的线性函数）与像素列 [c0,c1]、
 * 带区间 [y0,y1] 的交集面积。
 *   L(y) = L0 + sL*(y−y0)，R(y) = R0 + sR*(y−y0)
 *   w(y) = max(0, min(R(y),c1) − max(L(y),c0))   —— 覆盖宽度
 * w(y) 是分段线性函数，拐点出现在 L/R 穿越 c0/c1 处。在拐点处切分后，
 * 每段宽度线性 → 梯形求积即精确（无需采样）。
 */
function spanPixelArea(
    L0: number, sL: number,
    R0: number, sR: number,
    y0: number, y1: number,
    c0: number, c1: number,
): number {
    const widthAt = (y: number): number => {
        const l = L0 + sL * (y - y0)
        const r = R0 + sR * (y - y0)
        return Math.max(0, Math.min(r, c1) - Math.max(l, c0))
    }
    // 收集拐点：L/R 与像素边界 c0/c1 的交点 y 坐标
    const kinks: number[] = [y0, y1]
    const lines: Array<[number, number, number]> = [
        [L0, sL, c0], [L0, sL, c1], [R0, sR, c0], [R0, sR, c1],
    ]
    for (const [base, s, bound] of lines) {
        if (Math.abs(s) < 1e-12) continue
        const y = y0 + (bound - base) / s
        if (y > y0 && y < y1) kinks.push(y)
    }
    kinks.sort((a, b) => a - b)
    let area = 0
    for (let i = 0; i + 1 < kinks.length; i++) {
        const a = kinks[i]
        const b = kinks[i + 1]
        if (b - a < 1e-12) continue
        area += ((widthAt(a) + widthAt(b)) / 2) * (b - a) // 梯形求积（分段线性 → 精确）
    }
    return area
}

/** 边在 y（定点）处的 x（定点） */
function xAt(e: CairoEdge, y: Q24_8): Q24_8 {
    return e.x + Fx24.mul(e.slope, y - e.minY)
}

/**
 * Cairo 风格：扫描线跨度 + 解析像素覆盖率填充。
 * @param vertices  多边形顶点（≥3）
 * @param imageData 目标像素缓冲
 * @param color     填充颜色
 */
export function fillPolygonCairo(vertices: PolyVertex[], imageData: ImageData, color: FillColor): void {
    if (vertices.length < 3) return

    // 1. 顶点转 Q24.8 定点
    const pts = vertices.map(d => ({ x: Fx24.from(d.x), y: Fx24.from(d.y) }))

    // 2. 建边表：跳过水平边
    const edges: CairoEdge[] = []
    for (let i = 0; i < pts.length; i++) {
        const p0 = pts[i]
        const p1 = pts[(i + 1) % pts.length]
        if (p0.y === p1.y) continue
        const minY = Math.min(p0.y, p1.y)
        const maxY = Math.max(p0.y, p1.y)
        const slope = Fx24.div(p1.x - p0.x, p1.y - p0.y)
        const x = p0.y < p1.y ? p0.x : p1.x
        edges.push({ x, minY, maxY, slope })
    }
    if (edges.length < 2) return

    const w = imageData.width
    const h = imageData.height
    const data = imageData.data
    // 每像素覆盖面积累加（像素面积为 1）
    const acc = new Float32Array(w * h)

    // 3. 逐像素带扫描
    for (let gy = 0; gy < h; gy++) {
        const bandY0 = gy
        const bandY1 = gy + 1
        // 3.1 带内切分子带：把落在带内的边端点 y 加入切分点
        const splits: number[] = [bandY0, bandY1]
        for (const e of edges) {
            const minYf = Fx24.to(e.minY)
            const maxYf = Fx24.to(e.maxY)
            if (minYf > bandY0 && minYf < bandY1) splits.push(minYf)
            if (maxYf > bandY0 && maxYf < bandY1) splits.push(maxYf)
        }
        splits.sort((a, b) => a - b)
        const uni: number[] = []
        for (const s of splits) {
            if (uni.length === 0 || Math.abs(s - uni[uni.length - 1]) > 1e-9) uni.push(s)
        }
        // 3.2 每个子带内：活性边恒定，排序配对后逐像素解析积分
        for (let si = 0; si + 1 < uni.length; si++) {
            const y0 = uni[si]
            const y1 = uni[si + 1]
            if (y1 - y0 < 1e-9) continue
            const y0f = Fx24.from(y0)
            const y1f = Fx24.from(y1)
            // 活性边：完整跨越子带（半开区间 [minY, maxY)）
            const act = edges.filter(e => e.minY <= y0f && e.maxY >= y1f)
            if (act.length < 2) continue
            // 奇偶配对：按子带顶端 x 排序（简化：子带内忽略边与边交叉的极端情况）
            act.sort((a, b) => xAt(a, y0f) - xAt(b, y0f))
            for (let k = 0; k + 1 < act.length; k += 2) {
                const L = act[k]
                const R = act[k + 1]
                const L0 = Fx24.to(xAt(L, y0f))
                const sL = Fx24.to(L.slope)
                const R0 = Fx24.to(xAt(R, y0f))
                const sR = Fx24.to(R.slope)
                for (let gx = 0; gx < w; gx++) {
                    const area = spanPixelArea(L0, sL, R0, sR, y0, y1, gx, gx + 1)
                    if (area > 0) acc[gy * w + gx] += area
                }
            }
        }
    }

    // 4. 覆盖率 → alpha（像素面积 1，acc 即覆盖率；防浮点误差超界取 min(1,…)）
    for (let i = 0; i < acc.length; i++) {
        if (acc[i] > 0) {
            const alpha = Math.min(1, acc[i])
            data[i * 4] = color.r
            data[i * 4 + 1] = color.g
            data[i * 4 + 2] = color.b
            data[i * 4 + 3] = Math.round(alpha * 255)
        }
    }
}
