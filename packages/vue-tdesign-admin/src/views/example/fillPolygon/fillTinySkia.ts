// ============================================================
// 填充方式：tiny-skia（Skia CPU 光栅器）移植——winding 边扫描 + 4×4 超采样
//
// 对应真实 tiny-skia 的 scan/path.rs + scan/path_aa.rs（Skia SkScan 移植）：
//   1. 路径分解为 Edge（Line/Quadratic/Cubic），统一为 LineEdge：
//      x/dx（FDot16 16.16 定点）、first_y/last_y（超采样像素行）、winding=±1
//   2. walk_edges：逐条超采样行维护活性边表（AET），累积 winding，
//      (w & winding_mask)==0 翻转区间起止（EvenOdd 用掩码 1，NonZero 用 -1）
//   3. 边在行尾增量推进 x += dx，失序时双向链表重排
//   4. SuperBlitter：blit_h 把超采样区间的覆盖率按 run-length 写入
//      （左/右部分覆盖 + 中间全覆盖），4 行累加成一个像素的 alpha
//
// 关键参数：SUPERSAMPLE_SHIFT = 2 → 每像素 4×4 = 16 个子像素，
// 覆盖率是"采样统计"而非解析面积——与 SSAA 同源，但用 AET + 批量 blitter。
// 本移植忠实体现 walk_edges + 超采样覆盖率累加结构。
// ============================================================

import type { PolyVertex, FillColor } from './fillScanlineSSAA'

/** 超采样参数（对齐 Skia：SUPERSAMPLE_SHIFT = 2） */
const SUPERSAMPLE_SHIFT = 2
const SCALE = 1 << SUPERSAMPLE_SHIFT // 4：每像素在 x/y 方向各细分为 4 个子像素
const MASK = SCALE - 1               // 3

type FillRule = 'evenodd' | 'nonzero'

/** 边表条目（SkEdge 简化：仅直线边，多边形输入） */
interface SkEdge {
    x: number      // 当前行（超采样坐标）处的 x，行尾增量推进
    dx: number     // 每行超采样 y 的 x 增量
    firstY: number // 第一条超采样行（含）
    lastY: number  // 最后一条超采样行（含）
    winding: number // 1 或 -1（边方向）
}

/**
 * tiny-skia 风格：winding 边扫描 + 4×4 超采样覆盖率填充。
 * @param vertices  多边形顶点（≥3）
 * @param imageData 目标像素缓冲
 * @param color     填充颜色
 * @param fillRule  填充规则，默认 'evenodd'
 */
export function fillPolygonTinySkia(
    vertices: PolyVertex[],
    imageData: ImageData,
    color: FillColor,
    fillRule: FillRule = 'evenodd',
): void {
    if (vertices.length < 3) return

    const w = imageData.width
    const h = imageData.height
    const data = imageData.data

    // 1. 建边表（LineEdge::new）：坐标换算到超采样网格（×SCALE）
    //    firstY/lastY 用四舍五入对齐 fdot6::round（取整到超采样行）
    const edges: SkEdge[] = []
    for (let i = 0; i < vertices.length; i++) {
        const p0 = vertices[i]
        const p1 = vertices[(i + 1) % vertices.length]
        if (p0.y === p1.y) continue // 水平边（零高）跳过
        const winding = p0.y < p1.y ? 1 : -1
        const yMin = Math.min(p0.y, p1.y)
        const yMax = Math.max(p0.y, p1.y)
        const top = Math.round(yMin * SCALE)
        const bottom = Math.round(yMax * SCALE)
        if (top === bottom) continue
        // 斜率（超采样单位下不变：dx/dy）
        const dx = (p1.x - p0.x) / (p1.y - p0.y)
        // x 在 top 行处的值（超采样坐标）
        const xTop = (p0.y < p1.y ? p0.x : p1.x) * SCALE + dx * (top - yMin * SCALE)
        edges.push({ x: xTop, dx, firstY: top, lastY: bottom - 1, winding })
    }
    if (edges.length < 2) return

    // 每像素覆盖率累加（4×4=16 个子像素满覆盖 = 1.0）
    const acc = new Float32Array(w * h)
    // winding 掩码：EvenOdd 用 1（只看奇偶），NonZero 用 -1（看符号）
    const windingMask = fillRule === 'evenodd' ? 1 : -1

    // 2. walk_edges：逐条超采样行扫描
    const superRows = h * SCALE
    for (let sy = 0; sy < superRows; sy++) {
        // 活性边：当前行在其 [firstY, lastY] 范围内
        const act = edges.filter(e => e.firstY <= sy && e.lastY >= sy)
        if (act.length < 2) continue
        // 按当前 x 排序（AET 维护）
        act.sort((a, b) => a.x - b.x)

        let wsum = 0
        let left = 0
        for (const e of act) {
            const xr = Math.round(e.x) // fdot16 round_to_i32 → 超采样整数坐标
            if ((wsum & windingMask) === 0) {
                left = xr // 区间起点（进入多边形）
            }
            wsum += e.winding
            if ((wsum & windingMask) === 0) {
                emitSpan(left, xr, sy) // 区间终点（离开多边形）
            }
            e.x += e.dx // 行尾增量推进
        }
    }

    // 3. 覆盖率 → alpha
    const invArea = 1 / (SCALE * SCALE)
    for (let i = 0; i < acc.length; i++) {
        if (acc[i] > 0) {
            const alpha = Math.min(1, acc[i] * invArea)
            data[i * 4] = color.r
            data[i * 4 + 1] = color.g
            data[i * 4 + 2] = color.b
            data[i * 4 + 3] = Math.round(alpha * 255)
        }
    }

    // SuperBlitter.blit_h 的等价实现：把超采样区间 [left, right) 折算成
    // 每个像素列的子像素覆盖量（左/右部分 + 中间全部）
    function emitSpan(left: number, right: number, sy: number): void {
        if (right <= left) return
        const row = sy >> SUPERSAMPLE_SHIFT // 目标像素行
        // 区间覆盖的像素列范围
        const gx0 = Math.max(0, left >> SUPERSAMPLE_SHIFT)
        const gx1 = Math.min(w - 1, (right - 1) >> SUPERSAMPLE_SHIFT)
        for (let gx = gx0; gx <= gx1; gx++) {
            const lo = Math.max(left, gx * SCALE)
            const hi = Math.min(right, (gx + 1) * SCALE)
            const cov = hi - lo
            if (cov > 0) acc[row * w + gx] += cov
        }
    }
}
