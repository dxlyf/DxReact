// ============================================================
// 填充方式四：FreeType 灰度抗锯齿（ftgrays 风格）——精确 cell 覆盖 + 纯定点
//
// 对应真实 FreeType 的 smooth/gray 渲染器（src/smooth/ftgrays.c）：
//   - FT_Pos 是 26.6 定点数（6 位小数，1.0 = 64），全程整数运算、无浮点
//   - 算法源自 Raph Levien 的 LibArt：计算轮廓在**每个像素 cell 上的精确
//     覆盖率**（"computes the exact coverage of the outline on each pixel
//     cell by straight segments"），输出 8-bit 灰度覆盖图
//   - 像素中心约定为 (x+0.5, y+0.5)
//
// 本实现（忠实 ftgrays 结构）：
//   1. 顶点转 FT_Pos（26.6），构建边表（跳过水平边）
//   2. 每个像素行带 [row, row+1) 按边的端点 y 切分子带（band）——
//      子带内活性边集合恒定，保证奇偶配对稳定
//   3. 子带内活性边按 x 排序、奇偶配对（偶入奇出）
//   4. 每条跨度对穿过的每个像素 cell 用**定点梯形积分**求覆盖面积
//      （宽度 w(y) 分段线性，拐点处切分后逐段梯形，对直线边精确）
//   5. 覆盖面积 = 像素覆盖率 → 8-bit alpha
//
// 说明：FreeType / Cairo / Skia 的灰度抗锯齿同源于 LibArt 的"精确覆盖"
// 思想，数学上等价；三者差异在定点格式（26.6 / 24.8 / 16.16）与
// 驱动结构（cell 累加 / 跨度积分 / 边缘 ramp）。SSAA 则是完全不同的
// 采样近似路线。
// ============================================================

import type { PolyVertex, FillColor } from './fillScanlineSSAA'

/** FT_Pos 固定浮点数（对齐 FreeType：26.6 定点，1.0 = 64） */
type FT_Pos = number
class Fx26 {
    static SHIFT = 6
    static VALUE = 1 << 6      // 64
    static from(v: number): FT_Pos { return Math.round(v * Fx26.VALUE) }
    static to(v: FT_Pos): number { return v / Fx26.VALUE }
    /** 定点乘法：四舍五入保留精度 */
    static mul(a: FT_Pos, b: FT_Pos): FT_Pos { return Math.round((a * b) / Fx26.VALUE) }
    /** 定点除法：除零返回 0（水平边已在建表时跳过） */
    static div(a: FT_Pos, b: FT_Pos): FT_Pos {
        if (b === 0) return 0
        return Math.round((a * Fx26.VALUE) / b)
    }
}

/** 边表条目（FreeType 的 Edge，全部为 FT_Pos 26.6 定点） */
interface FteEdge {
    x: FT_Pos,     // 在 minY 处的 x
    minY: FT_Pos,  // y 下限（含）
    maxY: FT_Pos,  // y 上限（不含）
    slope: FT_Pos, // Δx/Δy
}

/** 边在 y（定点）处的 x（定点） */
function xAt(e: FteEdge, y: FT_Pos): FT_Pos {
    return e.x + Fx26.mul(e.slope, y - e.minY)
}

/**
 * 定点梯形积分：跨度 [L(y), R(y)] 与像素列 [c0,c1] 在带 [y0,y1] 上的覆盖面积。
 * 宽度 w(y) = max(0, min(R,c1) − max(L,c0)) 是分段线性函数，拐点出现在
 * L/R 穿越 c0/c1 处。在拐点处切分后每段线性 → 梯形求积即精确。
 * 全部用 FT_Pos 整数运算，最后转换为浮点面积。
 * 返回像素覆盖面积（像素面积 = 1.0）。
 */
function ftSpanArea(
    L0: FT_Pos, sL: FT_Pos,
    R0: FT_Pos, sR: FT_Pos,
    y0: FT_Pos, y1: FT_Pos,
    c0: FT_Pos, c1: FT_Pos,
): number {
    const widthAt = (y: FT_Pos): FT_Pos => {
        const l = L0 + Fx26.mul(sL, y - y0)
        const r = R0 + Fx26.mul(sR, y - y0)
        const lo = Math.max(l, c0)
        const hi = Math.min(r, c1)
        return hi > lo ? hi - lo : 0
    }
    // 拐点（定点）：L/R 穿越 c0/c1 的 y 坐标
    const kinks: FT_Pos[] = [y0, y1]
    const lines: Array<[FT_Pos, FT_Pos, FT_Pos]> = [
        [L0, sL, c0], [L0, sL, c1], [R0, sR, c0], [R0, sR, c1],
    ]
    for (const [base, s, bound] of lines) {
        if (s === 0) continue
        // y = y0 + (bound − base) / s（定点除法）
        const y = y0 + Fx26.div(bound - base, s)
        if (y > y0 && y < y1) kinks.push(y)
    }
    kinks.sort((a, b) => a - b)
    let areaQ = 0 // 单位：FT_Pos（VALUE）
    for (let i = 0; i + 1 < kinks.length; i++) {
        const a = kinks[i]
        const b = kinks[i + 1]
        if (b - a <= 0) continue
        // 梯形：(w(a)+w(b))/2 × (b−a)；分子先定点乘，最后统一除 2
        areaQ += Fx26.mul(widthAt(a) + widthAt(b), b - a)
    }
    return areaQ / (2 * Fx26.VALUE)
}

/**
 * FreeType 风格：精确 cell 覆盖 + 纯定点（26.6）灰度抗锯齿填充。
 * @param vertices  多边形顶点（≥3）
 * @param imageData 目标像素缓冲
 * @param color     填充颜色
 */
export function fillPolygonFreeType(vertices: PolyVertex[], imageData: ImageData, color: FillColor): void {
    if (vertices.length < 3) return

    // 1. 顶点转 FT_Pos（26.6）
    const pts = vertices.map(d => ({ x: Fx26.from(d.x), y: Fx26.from(d.y) }))

    // 2. 建边表：跳过水平边（与扫描线平行）
    const edges: FteEdge[] = []
    for (let i = 0; i < pts.length; i++) {
        const p0 = pts[i]
        const p1 = pts[(i + 1) % pts.length]
        if (p0.y === p1.y) continue
        const minY = Math.min(p0.y, p1.y)
        const maxY = Math.max(p0.y, p1.y)
        const slope = Fx26.div(p1.x - p0.x, p1.y - p0.y)
        const x = p0.y < p1.y ? p0.x : p1.x
        edges.push({ x, minY, maxY, slope })
    }
    if (edges.length < 2) return

    const w = imageData.width
    const h = imageData.height
    const data = imageData.data
    // 每像素覆盖面积累加（像素面积为 1.0）
    const acc = new Float32Array(w * h)

    // 3. 逐像素行带扫描（ftgrays 的 gray_sweep）
    for (let gy = 0; gy < h; gy++) {
        // 3.1 行带内按边端点 y 切分子带（band）
        const bandY0 = gy
        const bandY1 = gy + 1
        const splits: number[] = [bandY0, bandY1]
        for (const e of edges) {
            const minYf = Fx26.to(e.minY)
            const maxYf = Fx26.to(e.maxY)
            if (minYf > bandY0 && minYf < bandY1) splits.push(minYf)
            if (maxYf > bandY0 && maxYf < bandY1) splits.push(maxYf)
        }
        splits.sort((a, b) => a - b)
        const uni: number[] = []
        for (const s of splits) {
            if (uni.length === 0 || Math.abs(s - uni[uni.length - 1]) > 1e-9) uni.push(s)
        }
        // 3.2 子带内：活性边恒定，排序配对后逐像素定点积分
        for (let si = 0; si + 1 < uni.length; si++) {
            const y0 = uni[si]
            const y1 = uni[si + 1]
            if (y1 - y0 < 1e-9) continue
            const y0f = Fx26.from(y0)
            const y1f = Fx26.from(y1)
            const act = edges.filter(e => e.minY <= y0f && e.maxY >= y1f)
            if (act.length < 2) continue
            // 奇偶配对（偶入奇出）：按子带顶端 x 排序
            act.sort((a, b) => xAt(a, y0f) - xAt(b, y0f))
            for (let k = 0; k + 1 < act.length; k += 2) {
                const L = act[k]
                const R = act[k + 1]
                const L0 = xAt(L, y0f)
                const sL = L.slope
                const R0 = xAt(R, y0f)
                const sR = R.slope
                // 跨度可能穿过的像素列范围
                const xLmin = Math.min(Fx26.to(L0), Fx26.to(L0 + Fx26.mul(sL, y1f - y0f)))
                const xRmax = Math.max(Fx26.to(R0), Fx26.to(R0 + Fx26.mul(sR, y1f - y0f)))
                const colStart = Math.max(0, Math.floor(xLmin))
                const colEnd = Math.min(w - 1, Math.ceil(xRmax))
                for (let gx = colStart; gx <= colEnd; gx++) {
                    const area = ftSpanArea(
                        L0, sL, R0, sR,
                        y0f, y1f,
                        Fx26.from(gx), Fx26.from(gx + 1),
                    )
                    if (area > 0) acc[gy * w + gx] += area
                }
            }
        }
    }

    // 4. 覆盖率 → 8-bit alpha（FreeType 灰度输出即 8-bit coverage）
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
