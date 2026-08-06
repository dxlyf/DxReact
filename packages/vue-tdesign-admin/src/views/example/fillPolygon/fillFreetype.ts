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
    static SHIFT = 6 // 小数位位数：2^6 = 64，即每个浮点单位对应 64 个定点单位
    static VALUE = 1 << 6      // 64：定点缩放因子，1.0（像素） = 64（定点）
    /**
     * 浮点 → 定点。四舍五入是为了让误差均匀分布在 ±0.5 定点单位内，
     * 避免向下取整导致的系统性偏移。
     */
    static from(v: number): FT_Pos { return Math.round(v * Fx26.VALUE) }
    /** 定点 → 浮点（仅用于求像素列范围等需要真实坐标的场景） */
    static to(v: FT_Pos): number { return v / Fx26.VALUE }
    /** 定点乘法：四舍五入保留精度 */
    static mul(a: FT_Pos, b: FT_Pos): FT_Pos { return Math.round((a * b) / Fx26.VALUE) }
    /**
     * 定点除法：除零返回 0（水平边已在建表时跳过）。
     * 先将被除数放大 VALUE 倍再除以除数，使商保持 26.6 定点格式。
     */
    static div(a: FT_Pos, b: FT_Pos): FT_Pos {
        if (b === 0) return 0
        return Math.round((a * Fx26.VALUE) / b)
    }
}

/** 边表条目（FreeType 的 Edge，全部为 FT_Pos 26.6 定点） */
interface FteEdge {
    x: FT_Pos,     // 在 minY 处的 x（边的最上端交点）
    minY: FT_Pos,  // y 下限（含）：边从这一行开始参与扫描
    maxY: FT_Pos,  // y 上限（不含）：到达这一行边即失效（半开区间 [minY, maxY)）
    slope: FT_Pos, // Δx/Δy：单位 y 增量对应的 x 增量（定点值）
}

/**
 * 求边在指定 y（定点）处的 x（定点）。
 * 边是直线：x(y) = x(minY) + slope × (y − minY)。
 * y 不在 [minY, maxY) 内时结果无意义，调用方需保证 y 在范围内。
 */
function xAt(e: FteEdge, y: FT_Pos): FT_Pos {
    return e.x + Fx26.mul(e.slope, y - e.minY)
}

/**
 * 定点梯形积分：跨度 [L(y), R(y)] 与像素列 [c0,c1] 在带 [y0,y1] 上的覆盖面积。
 * 宽度 w(y) = max(0, min(R,c1) − max(L,c0)) 是分段线性函数，拐点出现在
 * L/R 穿越 c0/c1 处。在拐点处切分后每段线性 → 梯形求积即精确。
 * 全部用 FT_Pos 整数运算，最后转换为浮点面积。
 * 返回像素覆盖面积（像素面积 = 1.0）。
 *
 * 参数说明（全部为 26.6 定点）：
 *   L0/sL：左边界 x 在 y0 处的值及其斜率（L(y) = L0 + sL·(y−y0)）
 *   R0/sR：右边界 x 在 y0 处的值及其斜率
 *   y0/y1：积分带的上下边界（半开区间）
 *   c0/c1：像素列的左右边界（即像素 [gx, gx+1] 的 x 范围）
 */
function ftSpanArea(
    L0: FT_Pos, sL: FT_Pos,
    R0: FT_Pos, sR: FT_Pos,
    y0: FT_Pos, y1: FT_Pos,
    c0: FT_Pos, c1: FT_Pos,
): number {
    /**
     * 在给定 y 处计算跨度与该像素列的重叠宽度。
     * 将左右边界分别钳制到像素列内，再求差值：
     *   lo = max(L(y), c0)  ← 左边界不能小于像素列左缘
     *   hi = min(R(y), c1)  ← 右边界不能大于像素列右缘
     * 若 hi ≤ lo 说明该 y 处跨度不覆盖此像素列，返回 0。
     */
    const widthAt = (y: FT_Pos): FT_Pos => {
        const l = L0 + Fx26.mul(sL, y - y0)
        const r = R0 + Fx26.mul(sR, y - y0)
        const lo = Math.max(l, c0)
        const hi = Math.min(r, c1)
        return hi > lo ? hi - lo : 0
    }
    // 拐点（定点）：L/R 穿越 c0/c1 的 y 坐标
    // 积分区间端点 [y0, y1] 始终在列内，先放入
    const kinks: FT_Pos[] = [y0, y1]
    // 四组可能产生拐点的"直线 × 边界"组合：
    // L 穿越 c0（左边界碰到像素列左缘）、L 穿越 c1（左边界碰到右缘）、
    // R 穿越 c0、R 穿越 c1。穿越处宽度函数改变斜率，必须切分。
    const lines: Array<[FT_Pos, FT_Pos, FT_Pos]> = [
        [L0, sL, c0], [L0, sL, c1], [R0, sR, c0], [R0, sR, c1],
    ]
    for (const [base, s, bound] of lines) {
        if (s === 0) continue // 斜率 0 的边界永不穿越，跳过
        // 求穿越点：bound = base + s·(y − y0) → y = y0 + (bound − base) / s（定点除法）
        const y = y0 + Fx26.div(bound - base, s)
        // 只保留严格落在开区间 (y0, y1) 内的拐点（端点已在 kinks 中）
        if (y > y0 && y < y1) kinks.push(y)
    }
    kinks.sort((a, b) => a - b)
    let areaQ = 0 // 单位：FT_Pos（VALUE），最终统一缩放回浮点面积
    for (let i = 0; i + 1 < kinks.length; i++) {
        const a = kinks[i]
        const b = kinks[i + 1]
        if (b - a <= 0) continue // 去重（定点值可能因取整重复）
        // 梯形公式：面积 = (上底 + 下底) × 高 / 2 = (w(a) + w(b)) × (b − a) / 2
        // 分子先定点乘，最后统一除 2，尽量减少中间取整损失
        areaQ += Fx26.mul(widthAt(a) + widthAt(b), b - a)
    }
    // 还原面积：定点面积 = areaQ / (2 × VALUE)，像素面积为 1.0
    return areaQ / (2 * Fx26.VALUE)
}

/**
 * FreeType 风格：精确 cell 覆盖 + 纯定点（26.6）灰度抗锯齿填充。
 * @param vertices  多边形顶点（≥3）
 * @param imageData 目标像素缓冲
 * @param color     填充颜色
 */
export function fillPolygonFreeType(vertices: PolyVertex[], imageData: ImageData, color: FillColor): void {
    if (vertices.length < 3) return // 少于 3 个顶点无法构成多边形

    // 1. 顶点转 FT_Pos（26.6）：之后所有几何计算均为整数运算
    const pts = vertices.map(d => ({ x: Fx26.from(d.x), y: Fx26.from(d.y) }))

    // 2. 建边表：跳过水平边（与扫描线平行，不参与奇偶配对）
    //    每条边记录：最上端 x、y 范围 [minY, maxY)（半开区间）、斜率 Δx/Δy
    const edges: FteEdge[] = []
    for (let i = 0; i < pts.length; i++) {
        const p0 = pts[i]
        const p1 = pts[(i + 1) % pts.length] // 首尾相接闭合多边形
        if (p0.y === p1.y) continue // 水平边跳过：奇偶填充中水平边不产生交叉
        const minY = Math.min(p0.y, p1.y)
        const maxY = Math.max(p0.y, p1.y)
        const slope = Fx26.div(p1.x - p0.x, p1.y - p0.y)
        // x 取 y 较小时（边的最上端）的横坐标，作为 xAt 的基准点
        const x = p0.y < p1.y ? p0.x : p1.x
        edges.push({ x, minY, maxY, slope })
    }
    if (edges.length < 2) return // 至少需要两条边才能构成闭合区域

    const w = imageData.width
    const h = imageData.height
    const data = imageData.data
    // 每像素覆盖面积累加（像素面积为 1.0）
    // 一个像素可能被多个跨度覆盖（多段闭合轮廓），需要累加而非覆盖
    const acc = new Float32Array(w * h)

    // 顶点包围盒（像素坐标）：只扫描多边形覆盖的行，跳过无内容的行
    // 多边形最小 y 所在的行带 [floor(minY), floor(minY)+1) 起即有覆盖；
    // 最大 y 所在行带同理，故行范围为 [floor(minY), floor(maxY)]
    let yMinPx = Infinity
    let yMaxPx = -Infinity
    for (const p of pts) {
        const y = Fx26.to(p.y)
        if (y < yMinPx) yMinPx = y
        if (y > yMaxPx) yMaxPx = y
    }
    const rowStart = Math.max(0, Math.floor(yMinPx))
    const rowEnd = Math.min(h - 1, Math.floor(yMaxPx))

    // 3. 逐像素行带扫描（对应 ftgrays 的 gray_sweep 主循环）
    for (let gy = rowStart; gy <= rowEnd; gy++) {
        // 3.1 行带 [gy, gy+1) 内按边的端点 y 切分子带（band）
        //     动机：行带内若有边起点/终点（minY/maxY），活性边集合会变化，
        //     破坏奇偶配对的稳定性。子带内活性边集合恒定 → 配对稳定可积分。
        const bandY0 = gy
        const bandY1 = gy + 1
        const splits: number[] = [bandY0, bandY1] // 先放入行带两端点
        for (const e of edges) {
            const minYf = Fx26.to(e.minY) // 边起点对应的行带内浮点 y
            const maxYf = Fx26.to(e.maxY) // 边终点对应的行带内浮点 y
            // 只有落在当前行带内部的端点才需要切分（两端点已包含）
            if (minYf > bandY0 && minYf < bandY1) splits.push(minYf)
            if (maxYf > bandY0 && maxYf < bandY1) splits.push(maxYf)
        }
        splits.sort((a, b) => a - b)
        // 去重：浮点端点可能与行带端点重合，或切分点相互重合
        const uni: number[] = []
        for (const s of splits) {
            if (uni.length === 0 || Math.abs(s - uni[uni.length - 1]) > 1e-9) uni.push(s)
        }
        // 3.2 子带内：活性边恒定，排序配对后逐像素定点积分
        for (let si = 0; si + 1 < uni.length; si++) {
            const y0 = uni[si]
            const y1 = uni[si + 1]
            if (y1 - y0 < 1e-9) continue // 跳过退化子带（宽度为 0）
            const y0f = Fx26.from(y0)
            const y1f = Fx26.from(y1)
            // 活性边：y 范围覆盖整个子带 [y0f, y1f] 的边
            // （minY ≤ y0f 边已进入，maxY ≥ y1f 边尚未退出）
            const act = edges.filter(e => e.minY <= y0f && e.maxY >= y1f)
            if (act.length < 2) continue // 少于两条边无法构成闭合跨度
            // 奇偶配对（偶入奇出）：按子带顶端 x 排序
            // 扫描线从左到右，偶数条边进入多边形内部，奇数条边离开
            act.sort((a, b) => xAt(a, y0f) - xAt(b, y0f))
            for (let k = 0; k + 1 < act.length; k += 2) {
                const L = act[k]      // 左边界（进入边）
                const R = act[k + 1]  // 右边界（离开边）
                const L0 = xAt(L, y0f) // 左边界在子带顶端的 x
                const sL = L.slope     // 左边界斜率
                const R0 = xAt(R, y0f) // 右边界在子带顶端的 x
                const sR = R.slope     // 右边界斜率
                // 跨度可能穿过的像素列范围：
                // 取左右边界在子带两端 x 值的最小/最大，得到跨度的 x 包围盒，
                // 只对这些列做积分（避免全行扫描）
                const xLmin = Math.min(Fx26.to(L0), Fx26.to(L0 + Fx26.mul(sL, y1f - y0f)))
                const xRmax = Math.max(Fx26.to(R0), Fx26.to(R0 + Fx26.mul(sR, y1f - y0f)))
                const colStart = Math.max(0, Math.floor(xLmin)) // 钳制到画布内
                const colEnd = Math.min(w - 1, Math.ceil(xRmax))
                for (let gx = colStart; gx <= colEnd; gx++) {
                    // 定点梯形积分：跨度与像素列 [gx, gx+1] 在子带 [y0f, y1f] 上的精确覆盖面积
                    const area = ftSpanArea(
                        L0, sL, R0, sR,
                        y0f, y1f,
                        Fx26.from(gx), Fx26.from(gx + 1), // 像素列边界转定点
                    )
                    if (area > 0) acc[gy * w + gx] += area // 累加到该像素
                }
            }
        }
    }

    // 4. 覆盖率 → 8-bit alpha（FreeType 灰度输出即 8-bit coverage）
    //    覆盖率上限钳制为 1.0，防止多跨度叠加后溢出
    for (let i = 0; i < acc.length; i++) {
        if (acc[i] > 0) {
            const alpha = Math.min(1, acc[i])
            data[i * 4] = color.r     // R
            data[i * 4 + 1] = color.g // G
            data[i * 4 + 2] = color.b // B
            data[i * 4 + 3] = Math.round(alpha * 255) // A：覆盖面积 × 255
        }
    }
}
