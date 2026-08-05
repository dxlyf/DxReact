// ============================================================
// 填充方式一：扫描线 + 超采样抗锯齿（SSAA，Supersampling Anti-Aliasing）
//
// 原理：
//   把每个像素在 y 方向细分为 SUB_SAMPLES 条子扫描线，每条子扫描线用
//   扫描线算法（奇偶规则）求出多边形区间，统计区间与像素的重叠宽度，
//   最终覆盖率 = 各子扫描线覆盖宽度之和 / 子采样数。
//
// 本质是"采样"：覆盖率是多次采样的统计近似值，精度受子采样数限制，
// 属于 SSAA（超采样）思路——这也是当前 index.vue 中已有实现的方式。
//
// 定点格式：Q8.8（8 位整数 + 8 位小数），模拟 C 语言整数定点运算。
// ============================================================

/** 多边形顶点（网格浮点坐标，如 {x:2.3, y:5.6}） */
export interface PolyVertex { x: number, y: number }
/** 填充颜色（0-255） */
export interface FillColor { r: number, g: number, b: number }

/** Q8.8 固定浮点数：用 number 承载，模拟 16 位定点整数 */
type Q8_8 = number
class Fx8 {
    static SHIFT = 8
    static VALUE = 1 << 8      // 256
    static HALF = 1 << 7       // 128（四舍五入用）
    static from(v: number): Q8_8 { return Math.round(v * Fx8.VALUE) }
    static to(v: Q8_8): number { return v / Fx8.VALUE }
    static mul(a: Q8_8, b: Q8_8): Q8_8 { return Math.round((a * b) / Fx8.VALUE) }
    static div(a: Q8_8, b: Q8_8): Q8_8 {
        if (b === 0) return 0
        return Math.round((a * Fx8.VALUE) / b)
    }
}

/** 边表条目（全部为 Q8.8 定点）：x 为 minY 处的 x，slope = Δx/Δy */
interface ScanEdge {
    x: Q8_8,
    minY: Q8_8,
    maxY: Q8_8,
    slope: Q8_8,
}

/**
 * 扫描线 + 超采样抗锯齿填充。
 * @param vertices   多边形顶点（≥3 个，首尾自动闭合）
 * @param imageData  目标像素缓冲（每个格子 = 1 个像素）
 * @param color      填充颜色
 * @param subSamples 每像素 y 方向子采样数（越大越平滑、越慢）
 */
export function fillPolygonSSAA(
    vertices: PolyVertex[],
    imageData: ImageData,
    color: FillColor,
    subSamples = 8,
): void {
    if (vertices.length < 3) return

    // 1. 顶点转定点数
    const pts = vertices.map(d => ({ x: Fx8.from(d.x), y: Fx8.from(d.y) }))

    // 2. 构建边表：跳过水平边（与扫描线平行，无交点）
    const edges: ScanEdge[] = []
    for (let i = 0; i < pts.length; i++) {
        const p0 = pts[i]
        const p1 = pts[(i + 1) % pts.length]
        if (p0.y === p1.y) continue
        const minY = Math.min(p0.y, p1.y)
        const maxY = Math.max(p0.y, p1.y)
        const slope = Fx8.div(p1.x - p0.x, p1.y - p0.y)
        const x = p0.y < p1.y ? p0.x : p1.x
        edges.push({ x, minY, maxY, slope })
    }
    if (edges.length < 2) return

    const w = imageData.width
    const h = imageData.height
    const data = imageData.data
    const sub = subSamples

    // 3. 逐像素（网格单元）计算覆盖率
    for (let gy = 0; gy < h; gy++) {
        for (let gx = 0; gx < w; gx++) {
            const pxStart = Fx8.from(gx)      // 像素 x 左边界
            const pxEnd = Fx8.from(gx + 1)    // 像素 x 右边界（不含）
            let coverage = 0
            // 3.1 像素内 sub 条子扫描线（取中心线，避免命中顶点歧义）
            for (let sy = 0; sy < sub; sy++) {
                const scanY = Fx8.from(gy + (sy + 0.5) / sub)
                // 活性边：收集跨越该子扫描线的边
                const aet: Q8_8[] = []
                for (let j = 0; j < edges.length; j++) {
                    const e = edges[j]
                    if (scanY >= e.minY && scanY < e.maxY) {
                        aet.push(e.x + Fx8.mul(e.slope, scanY - e.minY))
                    }
                }
                // 3.2 交点排序 + 奇偶配对（偶入奇出）：[aet[0],aet[1]) [aet[2],aet[3]) …
                aet.sort((a, b) => a - b)
                for (let k = 0; k + 1 < aet.length; k += 2) {
                    const xs = aet[k]
                    const xe = aet[k + 1]
                    // 3.3 与像素 [pxStart, pxEnd) 的重叠宽度（≤1 像素）
                    const oStart = Math.max(pxStart, xs)
                    const oEnd = Math.min(pxEnd, xe)
                    if (oEnd > oStart) {
                        coverage += Fx8.div(oEnd - oStart, Fx8.VALUE)
                    }
                }
            }
            // 4. 覆盖率 = 覆盖宽度之和 / 子采样数（∈[0,1]）
            const alpha = Math.min(1, Fx8.to(coverage) / sub)
            if (alpha > 0) {
                const index = (gy * w + gx) * 4
                data[index] = color.r
                data[index + 1] = color.g
                data[index + 2] = color.b
                data[index + 3] = Math.round(alpha * 255)
            }
        }
    }
}
