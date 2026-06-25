import {
    Path2D, QuadraticBezier, CubicBezier, IPoint,
} from './Path2D'

export type LineCap = 'butt' | 'round' | 'square'
export type LineJoin = 'miter' | 'round' | 'bevel'

export interface StrokeOptions {
    /** 描边宽度（默认 1） */
    strokeWidth?: number
    /** 端点样式（默认 'butt'） */
    lineCap?: LineCap
    /** 拐角样式（默认 'miter'） */
    lineJoin?: LineJoin
    /** miter 斜接限制，超过则退化为 bevel（默认 10） */
    miterLimit?: number
}

const defaultOptions: Required<StrokeOptions> = {
    strokeWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
}

// ══════════════════════════════════════════════
// 几何工具
// ══════════════════════════════════════════════

/** 两点欧氏距离 */
function dist(ax: number, ay: number, bx: number, by: number): number {
    return Math.hypot(ax - bx, ay - by)
}

/** 单位向量，零向量返回 [0, 0] */
function unit(dx: number, dy: number): [number, number] {
    const len = Math.hypot(dx, dy)
    return len < 1e-15 ? [0, 0] : [dx / len, dy / len]
}

/** 二维向量叉积的 z 分量 (ax*by - ay*bx) */
function cross(ax: number, ay: number, bx: number, by: number): number {
    return ax * by - ay * bx
}

/** 将角度差规范化到 [-π, π] 区间 */
function normalizeAngle(d: number): number {
    while (d < -Math.PI) d += 2 * Math.PI
    while (d > Math.PI) d -= 2 * Math.PI
    return d
}

// ══════════════════════════════════════════════
// 子路径扁平化
// ══════════════════════════════════════════════

/**
 * 将 Path2D 拆分为子路径点序列。
 * 曲线段（quad/cubic）通过 flatten() 离散化为线段，所有顶点构成连续折线。
 */
function extractSubpaths(path: Path2D, flattenEpsilon: number): IPoint[][] {
    const subpaths: IPoint[][] = []
    let current: IPoint[] | null = null
    let lastMoveX = 0, lastMoveY = 0

    path.visit({
        moveTo: (x, y) => {
            if (current && current.length > 1) subpaths.push(current)
            current = [{ x, y }]
            lastMoveX = x; lastMoveY = y
        },
        lineTo: (_lx, _ly, x, y) => {
            if (!current) current = [{ x: _lx, y: _ly }]
            current.push({ x, y })
        },
        quadraticCurveTo: (lx, ly, cpx, cpy, x, y) => {
            if (!current) current = [{ x: lx, y: ly }]
            const quad = new QuadraticBezier([{ x: lx, y: ly }, { x: cpx, y: cpy }, { x, y }])
            const pts = quad.flatten(flattenEpsilon)
            for (let i = 1; i < pts.length; i++) current.push(pts[i])
        },
        cubicCurveTo: (lx, ly, cp1x, cp1y, cp2x, cp2y, x, y) => {
            if (!current) current = [{ x: lx, y: ly }]
            const cubic = new CubicBezier([
                { x: lx, y: ly }, { x: cp1x, y: cp1y }, { x: cp2x, y: cp2y }, { x, y },
            ])
            const pts = cubic.flatten(flattenEpsilon)
            for (let i = 1; i < pts.length; i++) current.push(pts[i])
        },
        close: (_lx, _ly) => {
            if (current && current.length > 1) {
                const last = current[current.length - 1]
                if (Math.abs(last.x - lastMoveX) > 1e-10 || Math.abs(last.y - lastMoveY) > 1e-10) {
                    current.push({ x: lastMoveX, y: lastMoveY })
                }
            }
        },
    })

    if (current && current.length > 1) subpaths.push(current)
    return subpaths
}

// ══════════════════════════════════════════════
// 轮廓元素：点（直线段）或 弧（round join）
// ══════════════════════════════════════════════

/**
 * 弧元素 — 用于 round join 和 round cap。
 * 在 emitContour 中通过 Path2D.arc() 渲染，而非手写 lineTo 近似。
 */
interface ArcEntry {
    _arc: true
    cx: number; cy: number   // 圆心
    r: number                // 半径
    a1: number; a2: number   // 起止角度 (弧度)
    ccw: boolean             // 是否逆时针
}

type ContourEntry = IPoint | ArcEntry

const isArc = (e: ContourEntry): e is ArcEntry => '_arc' in e

/**
 * 将轮廓元素序列写入 Path2D。
 * @param reversed - 反向遍历时交换弧的起止角度并翻转方向
 */
function emitContour(result: Path2D, entries: ContourEntry[], reversed: boolean): void {
    const n = entries.length
    for (let i = 0; i < n; i++) {
        const e = entries[reversed ? n - 1 - i : i]
        if (isArc(e)) {
            if (reversed) {
                result.arc(e.cx, e.cy, e.r, e.a2, e.a1, !e.ccw)
            } else {
                result.arc(e.cx, e.cy, e.r, e.a1, e.a2, e.ccw)
            }
        } else {
            result.lineTo(e.x, e.y)
        }
    }
}

// ══════════════════════════════════════════════
// 拐角偏移计算
// ══════════════════════════════════════════════

/**
 * 计算拐角处 4 个法线偏移点。
 *
 * 入边方向 u1（指向顶点），出边方向 u2（离开顶点），
 * 左法线 n = (-u.y, u.x)，右侧用 -n。
 *
 * left1/right1 — 入边方向偏移点
 * left2/right2 — 出边方向偏移点
 */
function cornerOffsets(
    cx: number, cy: number,
    u1x: number, u1y: number,
    u2x: number, u2y: number,
    halfW: number,
): { left1: IPoint; left2: IPoint; right1: IPoint; right2: IPoint } {
    const n1x = -u1y, n1y = u1x
    const n2x = -u2y, n2y = u2x
    return {
        left1:  { x: cx + halfW * n1x, y: cy + halfW * n1y },
        left2:  { x: cx + halfW * n2x, y: cy + halfW * n2y },
        right1: { x: cx - halfW * n1x, y: cy - halfW * n1y },
        right2: { x: cx - halfW * n2x, y: cy - halfW * n2y },
    }
}

/** 两条直线交点（参数化：A + s·dirA, B + t·dirB），平行时返回 null */
function lineIntersection(
    ax: number, ay: number, adx: number, ady: number,
    bx: number, by: number, bdx: number, bdy: number,
): IPoint | null {
    const det = cross(adx, ady, bdx, bdy)
    if (Math.abs(det) < 1e-12) return null
    const t = cross(bx - ax, by - ay, bdx, bdy) / det
    return { x: ax + t * adx, y: ay + t * ady }
}

/**
 * 计算 miter 斜接交点。
 * @param sign - +1 左轮廓（左法线），-1 右轮廓（右法线）
 * @returns 交点坐标；超 miterLimit 或平行时返回 null（退化为 bevel）
 */
function miterPoint(
    cx: number, cy: number,
    u1x: number, u1y: number, u2x: number, u2y: number,
    halfW: number, miterLimit: number,
    sign: 1 | -1,
): IPoint | null {
    const n1x = sign * (-u1y), n1y = sign * (u1x)
    const n2x = sign * (-u2y), n2y = sign * (u2x)
    // 入边偏移线起点（沿入边反向走 1 单位再沿法线偏移）
    const a = { x: cx - u1x + halfW * n1x, y: cy - u1y + halfW * n1y }
    // 出边偏移线起点（沿出边正向走 1 单位再沿法线偏移）
    const b = { x: cx + u2x + halfW * n2x, y: cy + u2y + halfW * n2y }
    const pt = lineIntersection(a.x, a.y, u1x, u1y, b.x, b.y, u2x, u2y)
    if (!pt) return null
    if (dist(pt.x, pt.y, cx, cy) > halfW * miterLimit) return null
    return pt
}

// ══════════════════════════════════════════════
// 核心：计算描边轮廓
// ══════════════════════════════════════════════

/**
 * 根据源路径和描边参数生成描边轮廓的封闭 Path2D。
 *
 * ## 算法流程
 *
 * 1. **扁平化** — 将路径拆分为子路径，曲线用 flatten 离散为线段序列
 * 2. **偏移** — 沿每个顶点的入边/出边法线生成左右两侧的偏移点
 * 3. **Join 连接** — 在拐角处按 lineJoin 样式连接偏移线段间隙：
 *    - miter: 两条偏移线的交点（超 miterLimit 退化为 bevel）
 *    - round: 以顶点为圆心、halfW 为半径的弧（通过 Path2D.arc()）
 *    - bevel: 直接连接两个偏移点
 * 4. **Cap 封闭** — 在开放路径首尾端点按 lineCap 样式封闭轮廓
 * 5. **构建轮廓** — 左轮廓 + cap + 右轮廓（反转）形成闭合区域
 *
 * @param path - 源路径
 * @param options - 描边参数
 * @param flattenEpsilon - 曲线扁平化精度（默认 0.5）
 * @returns 描边轮廓的封闭 Path2D，可用于 fill + contains() 或渲染
 */
export function computeStrokePath(
    path: Path2D,
    options?: StrokeOptions,
    flattenEpsilon = 0.5,
): Path2D {
    const opts = { ...defaultOptions, ...options }
    const halfW = opts.strokeWidth / 2
    const result = new Path2D()
    const subpaths = extractSubpaths(path, flattenEpsilon)

    for (const pts of subpaths) {
        const n = pts.length
        if (n < 2) continue

        // 判断子路径是否闭合（首尾点重合）
        const first = pts[0], last = pts[n - 1]
        const closed = dist(first.x, first.y, last.x, last.y) < 1e-10
        // 闭合路径去掉重复的尾点
        const workingPts = closed ? pts.slice(0, -1) : pts
        const m = workingPts.length

        // 左右轮廓：收集点 + 弧
        const leftContour: ContourEntry[] = []
        const rightContour: ContourEntry[] = []

        for (let i = 0; i < m; i++) {
            const prev = workingPts[(i - 1 + m) % m]
            const curr = workingPts[i]
            const next = workingPts[(i + 1) % m]

            // 入边/出边的单位方向向量
            const [u1x, u1y] = unit(curr.x - prev.x, curr.y - prev.y)
            const [u2x, u2y] = unit(next.x - curr.x, next.y - curr.y)
            const cr = cross(u1x, u1y, u2x, u2y)

            // 计算法线偏移点
            const off = cornerOffsets(curr.x, curr.y, u1x, u1y, u2x, u2y, halfW)

            // 开放路径的首尾顶点：仅取法线偏移点（留给 cap 处理），不做 join
            const isEndpoint = !closed && (i === 0 || i === m - 1)
            if (isEndpoint) {
                if (i === 0) {
                    leftContour.push(off.left2)
                    rightContour.push(off.right2)
                } else {
                    leftContour.push(off.left1)
                    rightContour.push(off.right1)
                }
                continue
            }

            // 共线顶点：直接连接偏移点
            if (Math.abs(cr) < 1e-10) {
                leftContour.push(off.left1)
                rightContour.push(off.right1)
                continue
            }

            // 两侧轮廓都需要 join 处理
            applyJoin(leftContour,  off.left1,  off.left2,  curr.x, curr.y, u1x, u1y, u2x, u2y, halfW, opts, 1)
            applyJoin(rightContour, off.right1, off.right2, curr.x, curr.y, u1x, u1y, u2x, u2y, halfW, opts, -1)
        }

        if (closed) {
            buildClosedOutline(result, leftContour, rightContour)
        } else {
            buildOpenOutline(result, workingPts, leftContour, rightContour, halfW, opts)
        }
    }

    return result
}

/**
 * 按 lineJoin 样式向轮廓追加连接元素。
 *
 * round 分支推入 off1(起点) → ArcEntry → off2(终点)，
 * 确保正向和反向遍历时画笔已在正确位置，arc() 不会画多余连接线。
 */
function applyJoin(
    contour: ContourEntry[],
    off1: IPoint, off2: IPoint,
    cx: number, cy: number,
    u1x: number, u1y: number,
    u2x: number, u2y: number,
    halfW: number,
    opts: Required<StrokeOptions>,
    sign: 1 | -1,
): void {
    switch (opts.lineJoin) {
        case 'miter': {
            const mpt = miterPoint(cx, cy, u1x, u1y, u2x, u2y, halfW, opts.miterLimit, sign)
            if (mpt) {
                contour.push(mpt)
            } else {
                // 超限或平行 → 退化为 bevel
                contour.push(off1, off2)
            }
            break
        }
        case 'round': {
            const a1 = Math.atan2(off1.y - cy, off1.x - cx)
            const a2 = Math.atan2(off2.y - cy, off2.x - cx)
            const da = normalizeAngle(a2 - a1)
            contour.push(off1)
            contour.push({
                _arc: true,
                cx, cy, r: halfW,
                a1, a2,
                // 小弧方向：da > 0 为逆时针
                ccw: da > 0,
            })
            contour.push(off2)
            break
        }
        case 'bevel':
        default:
            contour.push(off1, off2)
            break
    }
}

/**
 * 构建封闭子路径的描边轮廓。
 * 左轮廓前向 → 右轮廓反向 → close 形成闭环。
 */
function buildClosedOutline(
    result: Path2D,
    left: ContourEntry[],
    right: ContourEntry[],
): void {
    // 左轮廓第一个元素一定是 IPoint（顶点偏移点）
    const first = left[0]
    result.moveTo((first as IPoint).x, (first as IPoint).y)
    emitContour(result, left.slice(1), false)
    emitContour(result, right, true)
    result.close()
}

/**
 * 构建开放子路径的描边轮廓（含端点 cap）。
 *
 * 走线顺序：
 *   ls (左起点) → 左轮廓 → le (左终点)
 *   → 尾端 cap (... → re (右终点))
 *   → 右轮廓(反转) → rs (右起点)
 *   → 首端 cap (... → 回到 ls)
 *   → close
 */
function buildOpenOutline(
    result: Path2D,
    pts: IPoint[],
    left: ContourEntry[],
    right: ContourEntry[],
    halfW: number,
    opts: Required<StrokeOptions>,
): void {
    const m = pts.length

    // ── 首端点 ──
    const p0 = pts[0], p1 = pts[1]
    const [dx0, dy0] = unit(p1.x - p0.x, p1.y - p0.y)
    const [nx0, ny0] = [-dy0, dx0]           // 左法线
    const ls = { x: p0.x + halfW * nx0, y: p0.y + halfW * ny0 }
    const rs = { x: p0.x - halfW * nx0, y: p0.y - halfW * ny0 }

    // ── 尾端点 ──
    const pe = pts[m - 1], pp = pts[m - 2]
    const [dxe, dye] = unit(pe.x - pp.x, pe.y - pp.y)
    const [nxe, nye] = [-dye, dxe]
    const le = { x: pe.x + halfW * nxe, y: pe.y + halfW * nye }
    const re = { x: pe.x - halfW * nxe, y: pe.y - halfW * nye }

    // 左轮廓 → 尾端 cap → 右轮廓（反转）→ 首端 cap
    result.moveTo(ls.x, ls.y)
    emitContour(result, left, false)
    result.lineTo(le.x, le.y)

    capToPath(result, pe.x, pe.y, le, re, dxe, dye, halfW, opts.lineCap, false)

    result.lineTo(re.x, re.y)
    emitContour(result, right, true)
    result.lineTo(rs.x, rs.y)

    capToPath(result, p0.x, p0.y, ls, rs, dx0, dy0, halfW, opts.lineCap, true)

    result.close()
}

// ══════════════════════════════════════════════
// Cap 绘制
// ══════════════════════════════════════════════

/**
 * 选择 round cap 弧线的方向。
 *
 * 尾端的弧从 offLeft 画到 offRight，应经过切线方向（前方）；
 * 首端的弧从 offRight 画到 offLeft，应经过切线反方向（背后）。
 *
 * 实现：尝试 da 的两种方向，选中点 (mid1) 或对跖点 (mid2) 更接近 expected 方向的那一个。
 */
function capArcCCW(
    a1: number, a2: number,
    expectedX: number, expectedY: number,
): boolean {
    const da = normalizeAngle(a2 - a1)
    const midNormal = a1 + da / 2          // 小弧中点
    const midFlip   = midNormal + Math.PI   // 大弧中点（对跖点）
    const expAngle  = Math.atan2(expectedY, expectedX)

    const dNormal = Math.abs(normalizeAngle(expAngle - midNormal))
    const dFlip   = Math.abs(normalizeAngle(expAngle - midFlip))

    // 选中点更近的方向
    return dNormal <= dFlip ? da > 0 : da <= 0
}

/**
 * 向 Path2D 追加端点 cap。
 *
 * @param cx, cy - 端点坐标
 * @param offLeft, offRight - 左右侧偏移点
 * @param dx, dy - 切线方向（尾端：离开端点的方向；首端调整为反方向）
 * @param isStart - 首端为 true（方向取反）
 */
function capToPath(
    result: Path2D,
    cx: number, cy: number,
    offLeft: IPoint, offRight: IPoint,
    dx: number, dy: number,
    halfW: number,
    cap: LineCap,
    isStart: boolean,
): void {
    switch (cap) {
        case 'butt':
            // 直接从 offLeft / offRight 直线连接（已由外部 lineTo 处理）
            break

        case 'square': {
            // 沿切线方向再延伸 halfW，形成矩形 cap
            const sx = isStart ? -dx : dx
            const sy = isStart ? -dy : dy
            // 首端从 offRight 开始画回 offLeft，尾端从 offLeft 画到 offRight
            const from = isStart ? offRight : offLeft
            const to   = isStart ? offLeft : offRight
            result.lineTo(from.x + halfW * sx, from.y + halfW * sy)
            result.lineTo(to.x + halfW * sx, to.y + halfW * sy)
            break
        }

        case 'round': {
            // 首端从 offRight 画到 offLeft（经过切线反方向）
            // 尾端从 offLeft 画到 offRight（经过切线方向）
            const from = isStart ? offRight : offLeft
            const to   = isStart ? offLeft : offRight
            const a1 = Math.atan2(from.y - cy, from.x - cx)
            const a2 = Math.atan2(to.y - cy, to.x - cx)
            // 尾端期望弧经过切线方向，首端期望经过反方向
            const ex = isStart ? -dx : dx
            const ey = isStart ? -dy : dy
            result.arc(cx, cy, halfW, a1, a2, capArcCCW(a1, a2, ex, ey))
            break
        }
    }
}

// ══════════════════════════════════════════════
// PathStroke 类
// ══════════════════════════════════════════════

/**
 * PathStroke 提供描边区域的命中检测。
 *
 * 内部通过 computeStrokePath 生成 offset 轮廓 Path2D，
 * 再利用 Path2D.contains()（winding number）判断点是否在描边区域内。
 *
 * @example
 * ```
 * const stroke = new PathStroke()
 * const outline = stroke.stroke(myPath, { strokeWidth: 10, lineJoin: 'round' })
 * ctx.fill(outline.toCanvasPath2D())
 * ```
 */
export class PathStroke {
    private offsetPath: Path2D | null = null

    /**
     * 生成描边轮廓并缓存。
     * @returns 描边区域的封闭 Path2D
     */
    stroke(path: Path2D, options: StrokeOptions = defaultOptions, flattenEpsilon = 0.5): Path2D {
        if (!this.offsetPath) {
            this.offsetPath = computeStrokePath(path, options, flattenEpsilon)
        }
        return this.offsetPath
    }

    /** 判断点 (px, py) 是否在描边区域内 */
    contains(px: number, py: number): boolean {
        if (!this.offsetPath) return false
        return this.offsetPath.contains(px, py)
    }
}
