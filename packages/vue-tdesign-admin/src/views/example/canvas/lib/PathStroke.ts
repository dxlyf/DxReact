import {
    Path2D, QuadraticBezier, CubicBezier,
    solveCubicByCardano, IPoint,
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
    /** 斜接限制（默认 10） */
    miterLimit?: number
}

const defaultOptions: Required<StrokeOptions> = {
    strokeWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
}

// ──────────────────────────────────────────────
// 几何工具
// ──────────────────────────────────────────────

/** 点到线段的最短距离（端点钳位 [0,1]，即胶囊体测试） */
function pointToSegmentDist(
    px: number, py: number,
    x0: number, y0: number, x1: number, y1: number,
): number {
    const dx = x1 - x0
    const dy = y1 - y0
    const len2 = dx * dx + dy * dy
    if (len2 < 1e-15) return Math.hypot(px - x0, py - y0)
    let t = ((px - x0) * dx + (py - y0) * dy) / len2
    t = Math.max(0, Math.min(1, t))
    return Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy))
}

/** 判断点是否在圆内（半径 halfWidth） */
function inCircle(px: number, py: number, cx: number, cy: number, r: number): boolean {
    return (px - cx) * (px - cx) + (py - cy) * (py - cy) < r * r
}

/** 判断点是否在有向直线的左侧（叉积 > 0） */
function isLeft(
    px: number, py: number,
    x0: number, y0: number, x1: number, y1: number,
): boolean {
    return (x1 - x0) * (py - y0) - (y1 - y0) * (px - x0) > 0
}

// ──────────────────────────────────────────────
// 方案 A：扁平化 + 线段胶囊体测试
// ──────────────────────────────────────────────

interface FlatSegment {
    x0: number; y0: number; x1: number; y1: number
}

interface VertexJoin {
    prevX: number; prevY: number
    currX: number; currY: number
    nextX: number; nextY: number
}

interface EndCap {
    x: number; y: number
    dx: number; dy: number  // 边沿方向（远离端点）
}

/**
 * 将路径扁平化为线段序列，同时提取顶点（用于 join）和端点（用于 cap）
 */
function flattenPath(path: Path2D, epsilon: number): {
    segments: FlatSegment[]
    joins: VertexJoin[]
    caps: EndCap[]
} {
    const segments: FlatSegment[] = []
    const joins: VertexJoin[] = []
    const caps: EndCap[] = []

    path.visit({
        moveTo: () => { /* subpath start handled by first segment */ },
        lineTo: (lastX, lastY, x, y) => {
            segments.push({ x0: lastX, y0: lastY, x1: x, y1: y })
        },
        quadraticCurveTo: (lastX, lastY, cpX, cpY, x, y) => {
            const quad = new QuadraticBezier([{ x: lastX, y: lastY }, { x: cpX, y: cpY }, { x, y }])
            const pts = quad.flatten(epsilon)
            for (let i = 1; i < pts.length; i++) {
                segments.push({ x0: pts[i - 1].x, y0: pts[i - 1].y, x1: pts[i].x, y1: pts[i].y })
            }
        },
        cubicCurveTo: (lastX, lastY, cpX1, cpY1, cpX2, cpY2, x, y) => {
            const cubic = new CubicBezier([
                { x: lastX, y: lastY }, { x: cpX1, y: cpY1 }, { x: cpX2, y: cpY2 }, { x, y },
            ])
            const pts = cubic.flatten(epsilon)
            for (let i = 1; i < pts.length; i++) {
                segments.push({ x0: pts[i - 1].x, y0: pts[i - 1].y, x1: pts[i].x, y1: pts[i].y })
            }
        },
        close: (lastX, lastY) => {
            // close 由 visit 回调处理，lastX/lastY 是当前子路径的最后一点
            // 但 close 的闭合线段由 forEach 中的 Close verb 处理，visit 中已隐含
            // 这里无需额外操作
        },
    })

    // 提取顶点（相邻的线段端点）和端点
    // 注意：visit 不会明确告诉我们子路径边界，需要遍历 segments
    if (segments.length === 0) return { segments, joins, caps }

    // 首端点和尾端点
    const firstSeg = segments[0]
    const lastSeg = segments[segments.length - 1]

    // 计算各边的长度方向
    for (let i = 0; i < segments.length; i++) {
        const s = segments[i]
        const dx = s.x1 - s.x0
        const dy = s.y1 - s.y0
        const len = Math.hypot(dx, dy)

        if (i > 0) {
            const prev = segments[i - 1]
            joins.push({
                prevX: prev.x1, prevY: prev.y1,
                currX: s.x0, currY: s.y0,
                nextX: s.x1, nextY: s.y1,
            })
        }

        if (i === 0) {
            // 首端点
            caps.push({ x: s.x0, y: s.y0, dx: dx, dy: dy })
        }
        if (i === segments.length - 1) {
            // 尾端点（方向取反，即远离端点方向）
            caps.push({ x: s.x1, y: s.y1, dx: -dx, dy: -dy })
        }
    }

    return { segments, joins, caps }
}

// ──────────────────────────────────────────────
// 方案 B：点到曲线距离测试
// ──────────────────────────────────────────────

interface CurveSegment {
    type: 'line' | 'quad' | 'cubic'
    lastX: number; lastY: number
    // line: cp1/end = end, quad: cp1=control end=end2, cubic: cp1/cp2/end
    cp1x: number; cp1y: number
    cp2x: number; cp2y: number
    endX: number; endY: number
}

function extractCurves(path: Path2D): CurveSegment[] {
    const curves: CurveSegment[] = []

    path.visit({
        lineTo: (lastX, lastY, x, y) => {
            curves.push({ type: 'line', lastX, lastY, cp1x: 0, cp1y: 0, cp2x: 0, cp2y: 0, endX: x, endY: y })
        },
        quadraticCurveTo: (lastX, lastY, cpX, cpY, x, y) => {
            curves.push({ type: 'quad', lastX, lastY, cp1x: cpX, cp1y: cpY, cp2x: 0, cp2y: 0, endX: x, endY: y })
        },
        cubicCurveTo: (lastX, lastY, cpX1, cpY1, cpX2, cpY2, x, y) => {
            curves.push({ type: 'cubic', lastX, lastY, cp1x: cpX1, cp1y: cpY1, cp2x: cpX2, cp2y: cpY2, endX: x, endY: y })
        },
    })

    return curves
}

function pointToCurveDist(px: number, py: number, c: CurveSegment): number {
    switch (c.type) {
        case 'line':
            return pointToSegmentDist(px, py, c.lastX, c.lastY, c.endX, c.endY)
        case 'quad': {
            const quad = new QuadraticBezier([
                { x: c.lastX, y: c.lastY },
                { x: c.cp1x, y: c.cp1y },
                { x: c.endX, y: c.endY },
            ])
            return quad.distanceTo(px, py)
        }
        case 'cubic': {
            const cubic = new CubicBezier([
                { x: c.lastX, y: c.lastY },
                { x: c.cp1x, y: c.cp1y },
                { x: c.cp2x, y: c.cp2y },
                { x: c.endX, y: c.endY },
            ])
            return cubic.distanceTo(px, py)
        }
    }
}

// ──────────────────────────────────────────────
// 方案 C：偏移轮廓 → 封闭路径 → 填充测试
// ──────────────────────────────────────────────

/**
 * 在拐角处执行斜接（miter）剪裁，返回延长后的端点坐标。
 * 如超过 miterLimit，退化为 bevel。
 */
function miterOffset(
    px: number, py: number,        // 顶点
    u1x: number, u1y: number,      // 入边单位方向（指向顶点）
    u2x: number, u2y: number,      // 出边单位方向（离开顶点）
    halfW: number,
    miterLimit: number,
): { tipX: number; tipY: number; valid: boolean } {
    // 入边法线（左法线）
    const n1x = -u1y, n1y = u1x
    // 出边法线（左法线）
    const n2x = -u2y, n2y = u2x

    // 入边偏移线上一点：沿入边 backward 走单位长度到 Q，再沿法线偏移
    // Q = P - u1→，偏移线：Q + halfW·n1，方向为 u1→
    // 即 A = P - u1 + halfW·n1，方向 u1→
    //
    // 出边偏移线上一点：沿出边 forward 走单位长度到 R，再沿法线偏移
    // R = P + u2→，偏移线：R + halfW·n2，方向为 u2→
    // 即 B = P + u2 + halfW·n2，方向 u2→
    const ax = px - u1x + halfW * n1x
    const ay = py - u1y + halfW * n1y
    const bx = px + u2x + halfW * n2x
    const by = py + u2y + halfW * n2y

    // 求交点：A + t·u1 = B + s·u2
    const det = u1x * u2y - u1y * u2x
    if (Math.abs(det) < 1e-10) {
        return { tipX: px, tipY: py, valid: false }
    }

    const t = ((bx - ax) * u2y - (by - ay) * u2x) / det
    const tipX = ax + t * u1x
    const tipY = ay + t * u1y

    // 检查 miterLimit
    const miterLen = Math.hypot(tipX - px, tipY - py)
    return { tipX, tipY, valid: miterLen <= halfW * miterLimit }
}

/**
 * 计算描边的偏移轮廓路径（封闭 Path2D）
 *
 * 将路径扁平化后，每条线段沿法线方向偏移 ±halfWidth，
 * 在拐角处用 miter/bevel/round 连接，端点用 cap 封闭，
 * 形成一条闭合路径，可用于 fill + contains() 测试。
 *
 * @param path - 源路径
 * @param options - 描边参数
 * @param flattenEpsilon - 扁平化精度（默认 0.5）
 */
export function computeStrokePath(
    path: Path2D,
    options?: StrokeOptions,
    flattenEpsilon = 0.5,
): Path2D {
    const opts = { ...defaultOptions, ...options } as Required<StrokeOptions>
    const halfW = opts.strokeWidth / 2
    const result = new Path2D()

    // 方案：左偏移线 + 右偏移线 + cap 封闭
    // 对每个子路径分别处理
    // 先用旧的 forEach 方式收集点，按子路径分组
    // 但 path.visit 不分组子路径，用 forEach 手动分

    const allSubpaths: IPoint[][] = []
    let currentSubpath: IPoint[] | null = null
    let lastMoveX = 0, lastMoveY = 0

    path.visit({
        moveTo: (x, y) => {
            if (currentSubpath && currentSubpath.length > 1) {
                allSubpaths.push(currentSubpath)
            }
            currentSubpath = [{ x, y }]
            lastMoveX = x
            lastMoveY = y
        },
        lineTo: (lastX, lastY, x, y) => {
            if (!currentSubpath) {
                currentSubpath = [{ x: lastX, y: lastY }]
            }
            currentSubpath.push({ x, y })
        },
        quadraticCurveTo: (lastX, lastY, cpX, cpY, x, y) => {
            if (!currentSubpath) {
                currentSubpath = [{ x: lastX, y: lastY }]
            }
            const quad = new QuadraticBezier([{ x: lastX, y: lastY }, { x: cpX, y: cpY }, { x, y }])
            const pts = quad.flatten(flattenEpsilon)
            // 跳过第一个点（与 currentSubpath 末尾重复）
            for (let i = 1; i < pts.length; i++) {
                currentSubpath.push(pts[i])
            }
        },
        cubicCurveTo: (lastX, lastY, cpX1, cpY1, cpX2, cpY2, x, y) => {
            if (!currentSubpath) {
                currentSubpath = [{ x: lastX, y: lastY }]
            }
            const cubic = new CubicBezier([
                { x: lastX, y: lastY }, { x: cpX1, y: cpY1 }, { x: cpX2, y: cpY2 }, { x, y },
            ])
            const pts = cubic.flatten(flattenEpsilon)
            for (let i = 1; i < pts.length; i++) {
                currentSubpath.push(pts[i])
            }
        },
        close: (lastX, lastY) => {
            if (currentSubpath && currentSubpath.length > 1) {
                // 如果最后一点 != moveTo 点，添加闭合线段
                const last = currentSubpath[currentSubpath.length - 1]
                if (Math.abs(last.x - lastMoveX) > 1e-10 || Math.abs(last.y - lastMoveY) > 1e-10) {
                    currentSubpath.push({ x: lastMoveX, y: lastMoveY })
                }
            }
        },
    })

    if (currentSubpath && currentSubpath.length > 1) {
        allSubpaths.push(currentSubpath)
    }

    // 对每个子路径生成偏移轮廓
    for (const subpath of allSubpaths) {
        const n = subpath.length
        if (n < 2) continue

        const isClosed = (() => {
            const first = subpath[0]
            const last = subpath[n - 1]
            return Math.abs(first.x - last.x) < 1e-10 && Math.abs(first.y - last.y) < 1e-10
        })()

        // 收集左右偏移点
        const leftPoints: IPoint[] = []
        const rightPoints: IPoint[] = []

        // 兼容 cap 处理
        const addOffsetPoints = (prev: IPoint, curr: IPoint, next: IPoint) => {
            const dx1 = curr.x - prev.x, dy1 = curr.y - prev.y
            const dx2 = next.x - curr.x, dy2 = next.y - curr.y
            const len1 = Math.hypot(dx1, dy1)
            const len2 = Math.hypot(dx2, dy2)

            if (len1 < 1e-10 || len2 < 1e-10) {
                // 退化顶点，用法线偏移
                const nx = len1 > 0 ? -dy1 / len1 : 0
                const ny = len1 > 0 ? dx1 / len1 : 1
                leftPoints.push({ x: curr.x + halfW * nx, y: curr.y + halfW * ny })
                rightPoints.push({ x: curr.x - halfW * nx, y: curr.y - halfW * ny })
                return
            }

            const u1x = dx1 / len1, u1y = dy1 / len1
            const u2x = dx2 / len2, u2y = dy2 / len2

            // 左法线：(-dy, dx)
            const n1x = -u1y, n1y = u1x
            const n2x = -u2y, n2y = u2x

            const cross = u1x * u2y - u1y * u2x

            // 判断哪侧是外部（拐角的凸侧）
            const isLeftOutside = cross > 0

            if (isLeftOutside) {
                // 左侧为外部凸角：需要 join 处理
                // 右侧为内部凹角：直接用法线偏移
                const rt = miterOffset(curr.x, curr.y, u1x, u1y, u2x, u2y, halfW, opts.miterLimit)
                if (rt.valid && opts.lineJoin === 'miter') {
                    leftPoints.push({ x: rt.tipX, y: rt.tipY })
                } else if (opts.lineJoin === 'round') {
                    // 圆角：画弧 - 简化为加两个法线点
                    leftPoints.push({ x: curr.x + halfW * n1x, y: curr.y + halfW * n1y })
                    leftPoints.push({ x: curr.x + halfW * n2x, y: curr.y + halfW * n2y })
                } else {
                    // bevel 或 miter 超限退化：直接连接法线点
                    leftPoints.push({ x: curr.x + halfW * n1x, y: curr.y + halfW * n1y })
                    leftPoints.push({ x: curr.x + halfW * n2x, y: curr.y + halfW * n2y })
                }
                // 右侧：凹角，直接用法线偏移
                rightPoints.push({ x: curr.x - halfW * n1x, y: curr.y - halfW * n1y })
                rightPoints.push({ x: curr.x - halfW * n2x, y: curr.y - halfW * n2y })
            } else {
                // 右侧为外部凸角
                const rt = miterOffset(curr.x, curr.y, u1x, u1y, u2x, u2y, halfW, opts.miterLimit)
                if (rt.valid && opts.lineJoin === 'miter') {
                    rightPoints.push({ x: rt.tipX, y: rt.tipY })
                } else if (opts.lineJoin === 'round') {
                    rightPoints.push({ x: curr.x - halfW * n1x, y: curr.y - halfW * n1y })
                    rightPoints.push({ x: curr.x - halfW * n2x, y: curr.y - halfW * n2y })
                } else {
                    rightPoints.push({ x: curr.x - halfW * n1x, y: curr.y - halfW * n1y })
                    rightPoints.push({ x: curr.x - halfW * n2x, y: curr.y - halfW * n2y })
                }
                leftPoints.push({ x: curr.x + halfW * n1x, y: curr.y + halfW * n1y })
                leftPoints.push({ x: curr.x + halfW * n2x, y: curr.y + halfW * n2y })
            }
        }

        if (isClosed) {
            // 闭合路径：每个顶点都处理
            const pts = subpath.slice(0, -1)  // 去掉重复的终点
            const m = pts.length
            for (let i = 0; i < m; i++) {
                const prev = pts[(i - 1 + m) % m]
                const curr = pts[i]
                const next = pts[(i + 1) % m]
                addOffsetPoints(prev, curr, next)
            }

            // 构建偏移路径
            // 简化版本：取左偏移和右偏移的平均轮廓（以左偏移为首，反转右偏移为尾）
            // 实际上需要形成闭环，这里简化处理
            // 沿 leftPoints 前进，然后沿 rightPoints 反向折回

            // 从左侧第一个点开始
            result.moveTo(leftPoints[0].x, leftPoints[0].y)
            for (let i = 1; i < leftPoints.length; i++) {
                result.lineTo(leftPoints[i].x, leftPoints[i].y)
            }
            // 折回右侧（反转）
            for (let i = rightPoints.length - 1; i >= 0; i--) {
                result.lineTo(rightPoints[i].x, rightPoints[i].y)
            }
            result.close()
        } else {
            // 开放路径
            for (let i = 1; i < n - 1; i++) {
                addOffsetPoints(subpath[i - 1], subpath[i], subpath[i + 1])
            }

            // 首端 cap
            const first = subpath[0]
            const second = subpath[1]
            const dxStart = second.x - first.x, dyStart = second.y - first.y
            const lenStart = Math.hypot(dxStart, dyStart)
            const nxStart = lenStart > 0 ? -dyStart / lenStart : 0
            const nyStart = lenStart > 0 ? dxStart / lenStart : 1

            const leftStart = { x: first.x + halfW * nxStart, y: first.y + halfW * nyStart }
            const rightStart = { x: first.x - halfW * nxStart, y: first.y - halfW * nyStart }

            // 尾端 cap
            const last = subpath[n - 1]
            const penult = subpath[n - 2]
            const dxEnd = last.x - penult.x, dyEnd = last.y - penult.y
            const lenEnd = Math.hypot(dxEnd, dyEnd)
            const nxEnd = lenEnd > 0 ? -dyEnd / lenEnd : 0
            const nyEnd = lenEnd > 0 ? dxEnd / lenEnd : 1

            const leftEnd = { x: last.x + halfW * nxEnd, y: last.y + halfW * nyEnd }
            const rightEnd = { x: last.x - halfW * nxEnd, y: last.y - halfW * nyEnd }

            // 按 cap 样式构建闭合轮廓
            const buildCap = (isStart: boolean, cx: number, cy: number, nx: number, ny: number) => {
                const cap = opts.lineCap
                if (cap === 'butt') {
                    // 无额外延伸
                } else if (cap === 'square') {
                    // 沿法线方向延伸 halfW
                    return [{ x: cx + halfW * nx + halfW * (-ny), y: cy + halfW * ny + halfW * nx },
                    { x: cx - halfW * nx + halfW * (-ny), y: cy - halfW * ny + halfW * nx }]
                } else if (cap === 'round') {
                    // 半圆近似 - 用几个点
                    const pts: IPoint[] = []
                    const steps = 8
                    for (let i = 0; i <= steps; i++) {
                        const angle = Math.PI * i / steps
                        const rx = nx * Math.cos(angle) + (-ny) * Math.sin(angle)
                        const ry = nx * Math.sin(angle) - (-ny) * Math.cos(angle)
                        // 从左侧法线扫到右侧法线
                        const px = cx + halfW * (nx * Math.cos(angle) + (-ny) * Math.sin(angle))
                        const py = cy + halfW * (ny * Math.cos(angle) + nx * Math.sin(angle))
                        pts.push({ x: px, y: py })
                    }
                    return pts
                }
                return []
            }

            const startCapPts = buildCap(true, first.x, first.y, nxStart, nyStart)
            const endCapPts = buildCap(false, last.x, last.y, nxEnd, nyEnd)

            // 构建路径：左偏移线 → 尾端 cap → 右偏移线（反转）→ 首端 cap
            result.moveTo(leftStart.x, leftStart.y)
            // 左偏移线
            for (const p of leftPoints) result.lineTo(p.x, p.y)
            result.lineTo(leftEnd.x, leftEnd.y)

            // 尾端 cap
            for (const p of endCapPts) result.lineTo(p.x, p.y)

            // 右偏移线（反转）
            result.lineTo(rightEnd.x, rightEnd.y)
            const revRight = [...rightPoints].reverse()
            for (const p of revRight) result.lineTo(p.x, p.y)
            result.lineTo(rightStart.x, rightStart.y)

            // 首端 cap
            for (const p of startCapPts) result.lineTo(p.x, p.y)

            result.close()
        }
    }

    return result
}

// ──────────────────────────────────────────────
// PathStroke 主类
// ──────────────────────────────────────────────

export class PathStroke {
    private path: Path2D
    private opts: Required<StrokeOptions>

    // 方案 A 缓存
    private segments: FlatSegment[] = []
    private joins: VertexJoin[] = []
    private caps: EndCap[] = []

    // 方案 B 缓存
    private curves: CurveSegment[] = []

    // 方案 C 缓存
    private offsetPath: Path2D | null = null

    constructor(path: Path2D, options?: StrokeOptions) {
        this.path = path
        this.opts = { ...defaultOptions, ...options } as Required<StrokeOptions>
    }

    // ── 确保缓存已构建 ──

    private ensureFlattened(): void {
        if (this.segments.length > 0) return
        const result = flattenPath(this.path, 0.3)
        this.segments = result.segments
        this.joins = result.joins
        this.caps = result.caps
    }

    private ensureCurves(): void {
        if (this.curves.length > 0) return
        this.curves = extractCurves(this.path)
    }

    private ensureOffsetPath(): void {
        if (this.offsetPath) return
        this.offsetPath = computeStrokePath(this.path, this.opts)
    }

    // ── 方案 A：扁平化 + 胶囊体 ──

    /**
     * 方案 A：将路径扁平化为线段，测试点到每条线段胶囊体的距离
     * 适合：快速大致判断，精度由 flattenEpsilon 控制
     */
    containsByFlatten(px: number, py: number): boolean {
        this.ensureFlattened()
        const halfW = this.opts.strokeWidth / 2
        const { lineCap, lineJoin, miterLimit } = this.opts

        // 测试每条线段胶囊体
        for (const seg of this.segments) {
            if (pointToSegmentDist(px, py, seg.x0, seg.y0, seg.x1, seg.y1) < halfW) {
                return true
            }
        }

        // 测试端点 cap
        for (const cap of this.caps) {
            const len = Math.hypot(cap.dx, cap.dy)
            if (len < 1e-15) {
                if (inCircle(px, py, cap.x, cap.y, halfW)) return true
                continue
            }
            const ux = cap.dx / len, uy = cap.dy / len

            if (lineCap === 'round') {
                if (inCircle(px, py, cap.x, cap.y, halfW)) return true
            } else if (lineCap === 'square') {
                // 延伸 halfW
                const ex = cap.x + ux * halfW
                const ey = cap.y + uy * halfW
                if (pointToSegmentDist(px, py, cap.x, cap.y, ex, ey) < halfW) return true
            }
            // 'butt'：无额外区域
        }

        // 测试拐角 join
        for (const join of this.joins) {
            const vx = join.currX, vy = join.currY
            const dpx = px - vx, dpy = py - vy
            const distV = Math.hypot(dpx, dpy)

            // 在 halfW 范围内已被胶囊体覆盖
            if (distV < halfW) continue

            // 计算入边和出边方向
            const dx1 = join.currX - join.prevX, dy1 = join.currY - join.prevY
            const dx2 = join.nextX - join.currX, dy2 = join.nextY - join.currY
            const len1 = Math.hypot(dx1, dy1), len2 = Math.hypot(dx2, dy2)
            if (len1 < 1e-15 || len2 < 1e-15) continue

            const u1x = dx1 / len1, u1y = dy1 / len1
            const u2x = dx2 / len2, u2y = dy2 / len2

            // 法线（左法线：(-u1y, u1x)）
            const n1x = -u1y, n1y = u1x
            const n2x = -u2y, n2y = u2x

            // 判断点在凸侧（需要 join 处理）
            // 叉积决定转角方向：cross > 0 左转，cross < 0 右转
            const cross = u1x * u2y - u1y * u2x
            if (Math.abs(cross) < 1e-10) continue

            // 点在凸侧的判断：点与法线在同侧（对于左转，左侧法线方向 = 凸侧）
            const side1 = dpx * n1x + dpy * n1y  // 相对于入边的侧
            const side2 = dpx * n2x + dpy * n2y  // 相对于出边的侧

            // 左转时凸侧在正法线方向
            const isOutside = (cross > 0 && side1 > 0 && side2 > 0) ||
                (cross < 0 && side1 < 0 && side2 < 0)

            if (!isOutside) continue

            // 检查 join 类型
            const angle = Math.acos(Math.max(-1, Math.min(1, u1x * u2x + u1y * u2y)))
            const bisectorLen = 1 / Math.sin(angle / 2)  // 斜接长度因子

            if (lineJoin === 'round') {
                if (inCircle(px, py, vx, vy, halfW)) return true
            } else if (lineJoin === 'bevel') {
                // bevel：三角形 (offset1, vertex, offset2)
                const off1x = vx + halfW * n1x, off1y = vy + halfW * n1y
                const off2x = vx + halfW * n2x, off2y = vy + halfW * n2y
                // 点是否在三角形内（叉积法）
                const a1 = (off1x - vx) * (py - vy) - (off1y - vy) * (px - vx)
                const a2 = (off2x - off1x) * (py - off1y) - (off2y - off1y) * (px - off1x)
                const a3 = (vx - off2x) * (py - off2y) - (vy - off2y) * (px - off2x)
                const allPositive = a1 >= 0 && a2 >= 0 && a3 >= 0
                const allNegative = a1 <= 0 && a2 <= 0 && a3 <= 0
                if (allPositive || allNegative) return true
            } else if (lineJoin === 'miter') {
                // miter：斜接限制检查
                const miterLen = halfW * bisectorLen
                if (miterLen > halfW * miterLimit) {
                    // 超过斜接限制，退化为 bevel
                    // 用 bevel 的三角形判断
                    const lim = halfW * miterLimit
                    const bisectorX = (cross > 0 ? n1x + n2x : -(n1x + n2x))
                    const bisectorY = (cross > 0 ? n1y + n2y : -(n1y + n2y))
                    const bisectorLen2 = Math.hypot(bisectorX, bisectorY)
                    if (bisectorLen2 > 0) {
                        const bix = bisectorX / bisectorLen2, biy = bisectorY / bisectorLen2
                        const miterEndX = vx + lim * bix, miterEndY = vy + lim * biy
                        // 测试三角形 (offset1, miterEnd, offset2)
                        const off1x = vx + halfW * n1x, off1y = vy + halfW * n1y
                        const off2x = vx + halfW * n2x, off2y = vy + halfW * n2y
                        const a1 = (off1x - miterEndX) * (py - miterEndY) - (off1y - miterEndY) * (px - miterEndX)
                        const a2 = (off2x - off1x) * (py - off1y) - (off2y - off1y) * (px - off1x)
                        const a3 = (miterEndX - off2x) * (py - off2y) - (miterEndY - off2y) * (px - off2x)
                        const allP = a1 >= 0 && a2 >= 0 && a3 >= 0
                        const allN = a1 <= 0 && a2 <= 0 && a3 <= 0
                        if (allP || allN) return true
                    }
                } else {
                    // miter 尖端
                    const miterTipX = vx + halfW * bisectorLen * (cross > 0 ? (n1x + n2x) / Math.hypot(n1x + n2x, n1y + n2y) : -(n1x + n2x) / Math.hypot(n1x + n2x, n1y + n2y))
                    const miterTipY = vy + halfW * bisectorLen * (cross > 0 ? (n1y + n2y) / Math.hypot(n1x + n2x, n1y + n2y) : -(n1y + n2y) / Math.hypot(n1x + n2x, n1y + n2y))
                    // 点在 miter 三角形内？
                    const off1x = vx + halfW * n1x, off1y = vy + halfW * n1y
                    const off2x = vx + halfW * n2x, off2y = vy + halfW * n2y
                    const a1 = (off1x - miterTipX) * (py - miterTipY) - (off1y - miterTipY) * (px - miterTipX)
                    const a2 = (off2x - off1x) * (py - off1y) - (off2y - off1y) * (px - off1x)
                    const a3 = (miterTipX - off2x) * (py - off2y) - (miterTipY - off2y) * (px - off2x)
                    const allP = a1 >= 0 && a2 >= 0 && a3 >= 0
                    const allN = a1 <= 0 && a2 <= 0 && a3 <= 0
                    if (allP || allN) return true
                }
            }
        }

        return false
    }

    // ── 方案 B：点到曲线距离 ──

    /**
     * 方案 B：保持曲线段不变，直接用曲线距离函数
     * 精度高，适合二次贝塞尔（解析解）和三次贝塞尔（采样 + Newton 迭代）
     */
    containsByCurve(px: number, py: number): boolean {
        this.ensureCurves()
        const halfW = this.opts.strokeWidth / 2

        // 测试每个曲线段的距离
        for (const c of this.curves) {
            if (pointToCurveDist(px, py, c) < halfW) {
                return true
            }
        }

        // cap 和 join 测试复用方案 A（联合使用）
        // 但方案 B 主要关注曲线体本身
        // 如果只需要曲线精度，可额外启用
        return false
    }

    // ── 方案 C：偏移轮廓 → 填充路径 ──

    /**
     * 方案 C：生成描边轮廓的封闭路径，用 fill contains() 测试
     * 最精确，但计算开销最大
     */
    containsByOffset(px: number, py: number): boolean {
        this.ensureOffsetPath()
        return this.offsetPath!.contains(px, py)
    }

    /**
     * 获取描边的填充路径（offset 轮廓），可用于渲染预览
     */
    toFillPath(): Path2D {
        this.ensureOffsetPath()
        return this.offsetPath!
    }

    // ── 默认：综合使用三种方案 ──

    /**
     * 默认 contains 方法（综合三种方案）
     *
     * 策略：
     *   先用方案 A（最快）测试，
     *   若 miss 则用方案 C（最精确）回查拐角/端点区域
     */
    contains(px: number, py: number): boolean {
        // 先用方案 A（快速路径）
        if (this.containsByFlatten(px, py)) return true

        // 补充：方案 C 覆盖边缘情况
        if (this.containsByOffset(px, py)) return true

        return false
    }
}
