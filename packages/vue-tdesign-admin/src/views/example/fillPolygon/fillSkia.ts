// ============================================================
// 填充方式三：Skia CPU 风格——解析边缘覆盖率（Analytic Edge Coverage）
//
// 对应真实 Skia 的 CPU 光栅化（SkScan::AntiFillPath + SkAnalyticEdge）：
//   SkFixed 是 16.16 定点数（16 位小数，比 cairo 的 8 位小数更精确）。
//   对每条扫描线维护活性边，被边缘穿过的像素用**解析几何**计算边缘
//   在该像素内形成的覆盖梯形面积（左边缘 ramp + 右边缘 ramp），
//   完全位于多边形内部的像素直接填满（alpha=1），不参与面积计算。
//
// 本实现（简化版）：
//   1. 顶点转 SkFixed（16.16），构建边表
//   2. 像素带内按边端点 y 切分子带，子带内活性边排序、奇偶配对
//   3. 对每条跨度逐像素：
//        - 两端都完全覆盖 → 内部像素，直接整带填满（面积 = 带高）
//        - 否则 → 解析梯形积分求覆盖面积（edge ramp）
//   4. 覆盖面积之和 = 像素覆盖率
//
// 与 Cairo 的差别主要在架构：Cairo 按"跨度 → 像素"积分；
// Skia 按"边缘 → 像素"驱动（边缘 ramp + 内部全填），
// 数学上对直线边两者等价，这里忠实体现 Skia 的边缘驱动结构。
// ============================================================

import type { PolyVertex, FillColor } from './fillScanlineSSAA'

/** SkFixed 固定浮点数（对齐 Skia：16 位整数 + 16 位小数） */
type Q16_16 = number
class Fx16 {
    static SHIFT = 16
    static VALUE = 1 << 16
    static from(v: number): Q16_16 { return Math.round(v * Fx16.VALUE) }
    static to(v: Q16_16): number { return v / Fx16.VALUE }
    static mul(a: Q16_16, b: Q16_16): Q16_16 { return Math.round((a * b) / Fx16.VALUE) }
    static div(a: Q16_16, b: Q16_16): Q16_16 {
        if (b === 0) return 0
        return Math.round((a * Fx16.VALUE) / b)
    }
}

/** 边表条目（SkEdge，全部为 SkFixed） */
interface SkiaEdge {
    x: Q16_16,     // 在 minY 处的 x
    minY: Q16_16,  // y 下限（含）
    maxY: Q16_16,  // y 上限（不含）
    slope: Q16_16, // Δx/Δy
}

/** 解析梯形积分：跨度 [L(y), R(y)] 与像素列 [c0,c1] 在带 [y0,y1] 上的覆盖面积 */
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
    // 拐点：L/R 穿越像素边界 c0/c1 的位置（宽度分段线性）
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
        area += ((widthAt(a) + widthAt(b)) / 2) * (b - a)
    }
    return area
}

/**
 * Skia 风格边缘覆盖率：跨度 [L,R] 对像素列 [c0,c1] 的覆盖面积。
 *  - 内部像素（带的两端都被完全覆盖）→ 直接返回整带面积，跳过积分
 *  - 边缘像素 → 解析梯形积分（edge ramp 面积）
 */
function edgeRampCoverage(
    L0: number, sL: number,
    R0: number, sR: number,
    y0: number, y1: number,
    c0: number, c1: number,
): number {
    const widthAt = (y: number): number => {
        const l = L0 + sL * (y - y0)
        const r = R0 + sR * (y - y0)
        return Math.min(r, c1) - Math.max(l, c0)
    }
    // 内部像素快速路径：两端都完全覆盖，则整个带内都覆盖
    if (widthAt(y0) >= 1 - 1e-9 && widthAt(y1) >= 1 - 1e-9) {
        return y1 - y0
    }
    return spanPixelArea(L0, sL, R0, sR, y0, y1, c0, c1)
}

/** 边在 y（定点）处的 x（定点） */
function xAt(e: SkiaEdge, y: Q16_16): Q16_16 {
    return e.x + Fx16.mul(e.slope, y - e.minY)
}

/**
 * Skia 风格：解析边缘覆盖率填充。
 * @param vertices  多边形顶点（≥3）
 * @param imageData 目标像素缓冲
 * @param color     填充颜色
 */
export function fillPolygonSkia(vertices: PolyVertex[], imageData: ImageData, color: FillColor): void {
    if (vertices.length < 3) return

    // 1. 顶点转 SkFixed（16.16）
    const pts = vertices.map(d => ({ x: Fx16.from(d.x), y: Fx16.from(d.y) }))

    // 2. 建边表（SkEdge）：跳过水平边
    const edges: SkiaEdge[] = []
    for (let i = 0; i < pts.length; i++) {
        const p0 = pts[i]
        const p1 = pts[(i + 1) % pts.length]
        if (p0.y === p1.y) continue
        const minY = Math.min(p0.y, p1.y)
        const maxY = Math.max(p0.y, p1.y)
        const slope = Fx16.div(p1.x - p0.x, p1.y - p0.y)
        const x = p0.y < p1.y ? p0.x : p1.x
        edges.push({ x, minY, maxY, slope })
    }
    if (edges.length < 2) return

    const w = imageData.width
    const h = imageData.height
    const data = imageData.data
    const acc = new Float32Array(w * h)

    // 3. 逐像素带扫描（SkScan 行扫，边缘驱动）
    for (let gy = 0; gy < h; gy++) {
        const bandY0 = gy
        const bandY1 = gy + 1
        // 3.1 带内切分子带（边端点事件）
        const splits: number[] = [bandY0, bandY1]
        for (const e of edges) {
            const minYf = Fx16.to(e.minY)
            const maxYf = Fx16.to(e.maxY)
            if (minYf > bandY0 && minYf < bandY1) splits.push(minYf)
            if (maxYf > bandY0 && maxYf < bandY1) splits.push(maxYf)
        }
        splits.sort((a, b) => a - b)
        const uni: number[] = []
        for (const s of splits) {
            if (uni.length === 0 || Math.abs(s - uni[uni.length - 1]) > 1e-9) uni.push(s)
        }
        // 3.2 子带内：活性边排序配对，逐像素求边缘覆盖率
        for (let si = 0; si + 1 < uni.length; si++) {
            const y0 = uni[si]
            const y1 = uni[si + 1]
            if (y1 - y0 < 1e-9) continue
            const y0f = Fx16.from(y0)
            const y1f = Fx16.from(y1)
            const act = edges.filter(e => e.minY <= y0f && e.maxY >= y1f)
            if (act.length < 2) continue
            act.sort((a, b) => xAt(a, y0f) - xAt(b, y0f))
            for (let k = 0; k + 1 < act.length; k += 2) {
                const L = act[k]
                const R = act[k + 1]
                const L0 = Fx16.to(xAt(L, y0f))
                const sL = Fx16.to(L.slope)
                const R0 = Fx16.to(xAt(R, y0f))
                const sR = Fx16.to(R.slope)
                // 像素列范围：从跨度左端 floor 到右端 ceil
                const xLmin = Math.min(L0, L0 + sL * (y1 - y0))
                const xRmax = Math.max(R0, R0 + sR * (y1 - y0))
                const colStart = Math.max(0, Math.floor(xLmin))
                const colEnd = Math.min(w - 1, Math.ceil(xRmax))
                for (let gx = colStart; gx <= colEnd; gx++) {
                    const cov = edgeRampCoverage(L0, sL, R0, sR, y0, y1, gx, gx + 1)
                    if (cov > 0) acc[gy * w + gx] += cov
                }
            }
        }
    }

    // 4. 覆盖率 → alpha
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
