// ============================================================
// 填充方式：libcg（FreeType ftgrays 移植）——cell 精确覆盖面积 + span 生成
//
// 对应真实 libcg 的 src/xft.c（XCG_FT_Raster_Render，即 FreeType ftgrays）：
//   1. 轮廓点转 8.8 定点（FT 用 26.6，此处对齐 libcg：PIXEL_BITS=8）
//   2. gray_render_line / gray_render_scanline：把每段边按像素边界切分，
//      逐 cell 累加 area（面积，16 位小数）与 cover（绕数增量）
//   3. gray_sweep：逐行扫描 cell 链表，累积 cover 生成灰度跨度：
//        - 无 cell 的缝隙且 cover≠0 → 全覆盖跨度
//        - cell 处 → 用 cell.area 算部分覆盖（梯形积分，解析精确）
//   4. gray_hline：area >> 9 缩成 8-bit coverage，EvenOdd 下 512 取模再镜像，
//      把 span 写入 gray_spans 缓冲（满 XCG_FT_MAX_GRAY_SPANS=256 时
//      flush 到 spans_generation_callback → cg_span_buffer_t）
//   5. 光栅完成后，消费方从 span 缓冲读 span 绘制（cg_fill_rect_from_spans）
//
// 与 fillFreetype.ts（26.6 简化版）同一算法，这里是原版 C 结构的忠实移植，
// 含垂直边特例、DIV_MOD 余数补偿、cell 链表、span 合并与批量 flush。
// ============================================================

import type { PolyVertex, FillColor } from './fillScanlineSSAA'

/** 定点参数（对齐 libcg xft.c：PIXEL_BITS = 8） */
const PIXEL_BITS = 8
const ONE_PIXEL = 1 << PIXEL_BITS // 256
const FRACT_MASK = ONE_PIXEL - 1

/** 与 XCG_FT_MAX_GRAY_SPANS 一致：span 缓冲上限，满则 flush 回调 */
const MAX_GRAY_SPANS = 256

const TRUNC = (x: number): number => x >> PIXEL_BITS
const FRACT = (x: number): number => x & FRACT_MASK
const UPSCALE = (x: number): number => x * (ONE_PIXEL >> 6) // 26.6 → 8.8（本移植直接以 8.8 构建，恒等）

/** CG_DIV255：除以 255 的快速近似（(x + x>>8 + 0x80) >> 8） */
const CG_DIV255 = (x: number): number => (x + (x >> 8) + 0x80) >> 8

/** XCG_FT_DIV_MOD：带余数非负补偿的整除 */
function divMod(dividend: number, divisor: number): { q: number; r: number } {
    let q = Math.trunc(dividend / divisor)
    let r = dividend % divisor
    if (r < 0) { q--; r += divisor }
    return { q, r }
}

/** cell（TCell）：一个像素内的面积/绕数累积 */
interface Cell {
    x: number       // 像素列（已减 min_ex）
    cover: number   // 绕数覆盖增量（8.8 单位，满像素=ONE_PIXEL）
    area: number    // 面积增量（16 位小数，像素²）
    next: Cell | null
}

/** XCG_FT_Span：一条水平灰度跨度（ftgrays 输出给回调的 span） */
export interface FtSpan {
    x: number
    len: number
    y: number
    coverage: number // 0-255
}

/** cg_span_t + cg_span_buffer_t 的 TS 移植（libcg 的 span 缓冲容器） */
export interface CgSpan extends FtSpan {}

/** cg_span_buffer_t：收集光栅器输出的全部 span + 包围矩形 */
export class CgSpanBuffer {
    spans: CgSpan[] = []
    x = 0
    y = 0
    w = -1
    h = -1

    reset(): void {
        this.spans.length = 0
        this.x = 0
        this.y = 0
        this.w = -1
        this.h = -1
    }

    /** cg_span_buffer_add：追加一条 span 并更新包围矩形 */
    add(x: number, y: number, len: number, coverage: number): void {
        this.spans.push({ x, y, len, coverage })
        if (this.w == -1) {
            this.x = x
            this.y = y
            this.w = len
            this.h = 1
        } else {
            if (this.x > x) this.x = x
            if (this.y > y) this.y = y
            if (this.w < x + len - this.x) this.w = x + len - this.x
            if (this.h < y + 1 - this.y) this.h = y + 1 - this.y
        }
    }

    /** spans_generation_callback 的等价：批量追加 flush 出来的 span */
    appendBatch(spans: FtSpan[], count: number): void {
        for (let i = 0; i < count; i++) {
            const s = spans[i]
            this.add(s.x, s.y, s.len, s.coverage)
        }
    }

    /** cg_span_buffer_contains：点是否被任一 span 覆盖 */
    contains(x: number, y: number): boolean {
        const ix = Math.floor(x)
        const iy = Math.floor(y)
        for (const s of this.spans) {
            if (s.y !== iy) continue
            if (ix >= s.x && ix < s.x + s.len) return true
        }
        return false
    }
}

type FillRule = 'evenodd' | 'nonzero'

/**
 * 消费 span 缓冲：按每个 span 覆盖一段 [x, x+len)，用 CG_DIV255 预乘 alpha
 * 混合到 ImageData（等价 libcg cg_fill_rect_from_spans 的纯色简化版）。
 * @returns 写入的 span 条数
 */
export function fillImageFromSpans(spanBuffer: CgSpanBuffer, imageData: ImageData, color: FillColor): number {
    const data = imageData.data
    const w = imageData.width
    let n = 0
    for (const s of spanBuffer.spans) {
        const a = s.coverage
        if (a === 0) continue
        const row = s.y * w
        for (let i = 0; i < s.len; i++) {
            const px = s.x + i
            if (px < 0 || px >= w || s.y < 0 || s.y >= imageData.height) continue
            const idx = (row + px) * 4
            // CG_DIV255 预乘（coverage/255 的定点近似）
            data[idx] = color.r
            data[idx + 1] = color.g
            data[idx + 2] = color.b
            data[idx + 3] = CG_DIV255(a * 255)
        }
        n++
    }
    return n
}

/** TWorker：光栅器状态（ftgrays worker 的 TS 移植） */
class GrayRaster {
    // 轮廓点（8.8 定点）
    pts: Array<{ x: number; y: number }> = []

    // 包围盒（像素单位，用于裁剪与行偏移）
    minEx = 0; maxEx = 0; minEy = 0; maxEy = 0
    countEx = 0; countEy = 0

    // 当前 cell 状态
    ex = 0; ey = 0
    area = 0; cover = 0
    invalid = true

    // 当前笔位置（8.8）
    x = 0; y = 0

    // 每行的 cell 链表头
    ycells: Array<Cell | null> = []

    evenOdd = false

    // ---- span 输出（对齐 xft.c：gray_spans 缓冲 + 回调）----
    // 预填充 span 槽位（对齐 C 的静态数组 gray_spans[XCG_FT_MAX_GRAY_SPANS]）
    graySpans: FtSpan[] = Array.from({ length: MAX_GRAY_SPANS }, () => ({ x: 0, len: 0, y: 0, coverage: 0 }))
    numGraySpans = 0
    skipSpans = 0
    /** spans_generation_callback 的目标（cg_span_buffer_t） */
    spanBuffer: CgSpanBuffer = new CgSpanBuffer()

    // ---- cell 管理 ----
    /** gray_find_cell：在该行链表里查找/插入 x 处的 cell（保持有序） */
    findCell(): Cell {
        let x = this.ex
        if (x > this.countEx) x = this.countEx
        let cell = this.ycells[this.ey]
        let prev: Cell | null = null
        while (cell !== null) {
            if (cell.x > x) break
            if (cell.x === x) return cell
            prev = cell
            cell = cell.next
        }
        const nc: Cell = { x, cover: 0, area: 0, next: cell }
        if (prev !== null) prev.next = nc
        else this.ycells[this.ey] = nc
        return nc
    }

    /** gray_record_cell：把累积的 area/cover 写入当前 cell */
    recordCell(): void {
        if ((this.area | this.cover) !== 0) {
            const cell = this.findCell()
            cell.area += this.area
            cell.cover += this.cover
        }
    }

    /** gray_set_cell：切换当前 cell（写回旧 cell，初始化新 cell） */
    setCell(ex: number, ey: number): void {
        ey -= this.minEy
        if (ex > this.maxEx) ex = this.maxEx
        ex -= this.minEx
        if (ex < 0) ex = -1
        if (ex !== this.ex || ey !== this.ey) {
            if (!this.invalid) this.recordCell()
            this.area = 0
            this.cover = 0
            this.ex = ex
            this.ey = ey
        }
        this.invalid = ey < 0 || ey >= this.countEy || ex >= this.countEx
    }

    /** gray_start_cell：move_to 时开始新 cell */
    startCell(ex: number, ey: number): void {
        if (ex > this.maxEx) ex = this.maxEx
        if (ex < this.minEx) ex = this.minEx - 1
        this.area = 0
        this.cover = 0
        this.ex = ex - this.minEx
        this.ey = ey - this.minEy
        this.invalid = false
        this.setCell(ex, ey)
    }

    // ---- 扫描线渲染 ----
    /** gray_render_scanline：单条扫描线（同一像素行内）按像素边界切分累加 */
    renderScanline(ey: number, x1: number, fy1: number, x2: number, fy2: number): void {
        let ex1 = TRUNC(x1)
        let ex2 = TRUNC(x2)
        if (fy1 === fy2) {
            this.setCell(ex2, ey)
            return
        }
        let fx1 = FRACT(x1)
        const fx2 = FRACT(x2)
        let yy = fy1
        if (ex1 !== ex2) {
            let dx = x2 - x1
            const dy = fy2 - fy1
            let p: number, first: number, incr: number
            if (dx > 0) { p = (ONE_PIXEL - fx1) * dy; first = ONE_PIXEL; incr = 1 }
            else { p = fx1 * dy; first = 0; incr = -1; dx = -dx }
            let { q: delta, r: mod } = divMod(p, dx)
            this.area += (fx1 + first) * delta
            this.cover += delta
            yy += delta
            ex1 += incr
            this.setCell(ex1, ey)
            if (ex1 !== ex2) {
                const liftRem = divMod(ONE_PIXEL * dy, dx)
                const lift = liftRem.q
                const rem = liftRem.r
                do {
                    delta = lift
                    mod += rem
                    if (mod >= dx) { mod -= dx; delta++ }
                    this.area += ONE_PIXEL * delta
                    this.cover += delta
                    yy += delta
                    ex1 += incr
                    this.setCell(ex1, ey)
                } while (ex1 !== ex2)
            }
            fx1 = ONE_PIXEL - first
        }
        const dy = fy2 - yy
        this.area += (fx1 + fx2) * dy
        this.cover += dy
    }

    /** gray_render_line：任意方向直线段的光栅化（含垂直边特例与跨行步进） */
    renderLine(toX: number, toY: number): void {
        let ey1 = TRUNC(this.y)
        let ey2 = TRUNC(toY)
        if (!((ey1 >= this.maxEy && ey2 >= this.maxEy) || (ey1 < this.minEy && ey2 < this.minEy))) {
            const fy1 = FRACT(this.y)
            const fy2 = FRACT(toY)
            if (ey1 === ey2) {
                this.renderScanline(ey1, this.x, fy1, toX, fy2)
            } else {
                let dx = toX - this.x
                let dy = toY - this.y
                if (dx === 0) {
                    // 垂直边特例（避免斜率无穷）
                    const ex = TRUNC(this.x)
                    const twoFx = FRACT(this.x) << 1
                    let first = dy > 0 ? ONE_PIXEL : 0
                    let delta = first - fy1
                    this.area += twoFx * delta
                    this.cover += delta
                    delta = first + first - ONE_PIXEL
                    const area = twoFx * delta
                    const maxEy1 = this.countEy + this.minEy
                    if (dy < 0) {
                        if (ey1 > maxEy1) { ey1 = maxEy1 > ey2 ? maxEy1 : ey2; this.setCell(ex, ey1) }
                        else { ey1--; this.setCell(ex, ey1) }
                        while (ey1 > ey2 && ey1 >= this.minEy) {
                            this.area += area; this.cover += delta; ey1--
                            this.setCell(ex, ey1)
                        }
                        if (ey1 !== ey2) { ey1 = ey2; this.setCell(ex, ey1) }
                    } else {
                        if (ey1 < this.minEy) { ey1 = this.minEy < ey2 ? this.minEy : ey2; this.setCell(ex, ey1) }
                        else { ey1++; this.setCell(ex, ey1) }
                        while (ey1 < ey2 && ey1 < maxEy1) {
                            this.area += area; this.cover += delta; ey1++
                            this.setCell(ex, ey1)
                        }
                        if (ey1 !== ey2) { ey1 = ey2; this.setCell(ex, ey1) }
                    }
                    delta = fy2 - ONE_PIXEL + first
                    this.area += twoFx * delta
                    this.cover += delta
                } else {
                    let p: number, first: number, incr: number
                    if (dy > 0) { p = (ONE_PIXEL - fy1) * dx; first = ONE_PIXEL; incr = 1 }
                    else { p = fy1 * dx; first = 0; incr = -1; dy = -dy }
                    const dm = divMod(p, dy)
                    let delta = dm.q
                    let mod = dm.r
                    let xx = this.x + delta
                    this.renderScanline(ey1, this.x, fy1, xx, first)
                    ey1 += incr
                    this.setCell(TRUNC(xx), ey1)
                    if (ey1 !== ey2) {
                        const liftRem = divMod(ONE_PIXEL * dx, dy)
                        const lift = liftRem.q
                        const rem = liftRem.r
                        do {
                            delta = lift
                            mod += rem
                            if (mod >= dy) { mod -= dy; delta++ }
                            const x2 = xx + delta
                            this.renderScanline(ey1, xx, ONE_PIXEL - first, x2, first)
                            xx = x2
                            ey1 += incr
                            this.setCell(TRUNC(xx), ey1)
                        } while (ey1 !== ey2)
                    }
                    this.renderScanline(ey1, xx, ONE_PIXEL - first, toX, fy2)
                }
            }
        }
        this.x = toX
        this.y = toY
    }

    // ---- 输出 ----
    /** flushSpan：span 缓冲已满（或收尾）时调用 spans_generation_callback 输出 */
    flushSpans(): void {
        if (this.numGraySpans > this.skipSpans) {
            const skip = this.skipSpans > 0 ? this.skipSpans : 0
            this.spanBuffer.appendBatch(this.graySpans, this.numGraySpans - skip)
        }
        this.skipSpans -= this.numGraySpans
        this.numGraySpans = 0
    }

    /**
     * gray_hline：一条连续同覆盖率的跨度。
     * 与相邻同 y/coverage 的 span 合并（span->x+span->len==x），
     * 缓冲满时 flush 给 spans_generation_callback。
     */
    hline(x: number, y: number, area: number, acount: number): void {
        let coverage = area >> (PIXEL_BITS * 2 + 1 - 8) // area >> 9 → 8-bit
        if (coverage < 0) coverage = -coverage
        if (this.evenOdd) {
            coverage &= 511
            if (coverage > 256) coverage = 512 - coverage
            else if (coverage === 256) coverage = 255
        } else {
            if (coverage >= 256) coverage = 255
        }
        y += this.minEy
        x += this.minEx
        if (coverage !== 0) {
            let span: FtSpan
            let count = this.numGraySpans
            span = this.graySpans[count - 1]
            // 与上一条 span 合并（同 y、无缝衔接、同覆盖率）
            if (count > 0 && span.y === y && span.x + span.len === x && span.coverage === coverage) {
                span.len += acount
                return
            }
            if (count >= MAX_GRAY_SPANS) {
                this.flushSpans()
                count = 0
                span = this.graySpans[0]
            } else {
                span = this.graySpans[count]
            }
            span.x = x
            span.len = acount
            span.y = y
            span.coverage = coverage
            this.numGraySpans++
        }
    }

    /** gray_sweep：逐行遍历 cell 链表，累积 cover 生成灰度跨度（写入 span 缓冲） */
    sweep(): void {
        for (let yindex = 0; yindex < this.countEy; yindex++) {
            let cell = this.ycells[yindex]
            let cover = 0
            let x = 0
            while (cell !== null) {
                if (cell.x > x && cover !== 0) {
                    // 缝隙：完整覆盖
                    this.hline(x, yindex, cover * (ONE_PIXEL * 2), cell.x - x)
                }
                cover += cell.cover
                const area = cover * (ONE_PIXEL * 2) - cell.area
                if (area !== 0 && cell.x >= 0) {
                    // cell 处：部分覆盖（解析面积）
                    this.hline(cell.x, yindex, area, 1)
                }
                x = cell.x + 1
                cell = cell.next
            }
            if (this.countEx > x && cover !== 0) {
                this.hline(x, yindex, cover * (ONE_PIXEL * 2), this.countEx - x)
            }
        }
        // 收尾 flush：gray_convert_glyph 末尾把残留 span 交给回调
        this.flushSpans()
    }

    // ---- 主流程 ----
    /** gray_move_to：移动到新子路径起点 */
    moveTo(x: number, y: number): void {
        if (!this.invalid) this.recordCell()
        this.startCell(TRUNC(x), TRUNC(y))
        this.x = x
        this.y = y
    }
}

/**
 * libcg（ftgrays）风格：cell 精确覆盖面积填充，先生成 span 再绘制。
 *
 * 流程对齐 libcg 的 cg_rasterize：
 *   1. 光栅化把 span 输出到 CgSpanBuffer（对应 spans_generation_callback）
 *   2. fillImageFromSpans 消费 span 缓冲（对应 cg_fill_rect_from_spans）
 *
 * 如需在回调后自行处理 span（裁剪、纹理、渐变等），可改用
 * rasterizeSpans() + fillImageFromSpans() 两阶段调用。
 *
 * @param vertices  多边形顶点（≥3）
 * @param imageData 目标像素缓冲
 * @param color     填充颜色
 * @param fillRule  填充规则，默认 'nonzero'
 */
export function fillPolygonLibcg(
    vertices: PolyVertex[],
    imageData: ImageData,
    color: FillColor,
    fillRule: FillRule = 'nonzero',
): void {
    if (vertices.length < 3) return

    // 1. 光栅化 → span 缓冲
    const spanBuffer = rasterizeSpans(vertices, fillRule)
    // 2. 消费 span 绘制到 ImageData
    fillImageFromSpans(spanBuffer, imageData, color)
}

/**
 * 光栅化：顶点 → cell 累积 → gray_sweep → span 缓冲（cg_span_buffer_t）。
 * @returns 生成的 span 缓冲（spans 数组 + x/y/w/h 包围矩形）
 */
export function rasterizeSpans(vertices: PolyVertex[], fillRule: FillRule = 'nonzero'): CgSpanBuffer {
    const ras = new GrayRaster()
    ras.evenOdd = fillRule === 'evenodd'

    // 1. 顶点转 8.8 定点（libcg 中 UPSCALE 由 26.6 放大到 8.8）
    ras.pts = vertices.map(v => ({ x: UPSCALE(Math.round(v.x * 64)), y: UPSCALE(Math.round(v.y * 64)) }))

    // 2. 包围盒（像素单位）：gray_compute_cbox
    let minEx = Infinity, maxEx = -Infinity, minEy = Infinity, maxEy = -Infinity
    for (const p of ras.pts) {
        if (p.x < minEx) minEx = p.x
        if (p.x > maxEx) maxEx = p.x
        if (p.y < minEy) minEy = p.y
        if (p.y > maxEy) maxEy = p.y
    }
    ras.minEx = minEx >> PIXEL_BITS
    ras.minEy = minEy >> PIXEL_BITS
    ras.maxEx = (maxEx + ONE_PIXEL - 1) >> PIXEL_BITS
    ras.maxEy = (maxEy + ONE_PIXEL - 1) >> PIXEL_BITS
    // count 是像素上限差值（半开区间），不是数量：maxEx-maxEy 是 exclusive 边界
    ras.countEx = ras.maxEx - ras.minEx
    ras.countEy = ras.maxEy - ras.minEy
    if (ras.countEy <= 0) return ras.spanBuffer
    ras.ycells = new Array(ras.countEy).fill(null)
    ras.invalid = true

    // 3. 轮廓驱动：moveTo 首点，lineTo 各边，闭合回起点
    const n = ras.pts.length
    ras.moveTo(ras.pts[0].x, ras.pts[0].y)
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n
        ras.renderLine(ras.pts[j].x, ras.pts[j].y)
    }

    // 4. 收尾：轮廓结束后仍有残留的 area/cover（最后一段扫描线在 setCell 之后
    //    累积），必须记录到当前 cell，否则顶部行的左侧覆盖会丢失
    if (!ras.invalid) ras.recordCell()

    // 5. 扫描输出：cell 链表 → gray_sweep → span 缓冲（flush 全部残留）
    ras.sweep()

    return ras.spanBuffer
}
