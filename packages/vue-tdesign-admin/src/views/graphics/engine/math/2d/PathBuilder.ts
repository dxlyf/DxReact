import {
    PathInstruction,
    PathInstructionFactory,
    PathInstructionType,
} from './PathInstruction'
import { Box2 } from './Box2'
import { Vector2 } from './Vector2'
import { Arc } from './Arc'
import { Bezier } from './Bezier'

/**
 * 路径构建器
 *
 * 以命令式 API 构建路径指令序列，API 对齐 Canvas 2D Path2D。
 * 是路径数据的单一事实来源：Canvas 后端直接回放指令，
 * GPU 后端通过指令细分三角形。
 */
export class PathBuilder {
    readonly instructions: PathInstruction[] = []

    private _currentPoint: Vector2 | null = null

    /** 当前子路径起始点（用于 closePath 与弧线起点判断） */
    private _subpathStart: Vector2 | null = null

    private _bounds: Box2 = new Box2()
    private _boundsDirty = false

    get currentPoint(): Vector2 | null {
        return this._currentPoint?.clone() ?? null
    }

    get isEmpty(): boolean {
        return this.instructions.length === 0
    }

    /** 指令数量 */
    get instructionCount(): number {
        return this.instructions.length
    }

    // ---- 基础命令 ----

    moveTo(x: number, y: number): this {
        this.instructions.push(PathInstructionFactory.moveTo(x, y))
        this._currentPoint = new Vector2(x, y)
        this._subpathStart = new Vector2(x, y)
        this._boundsDirty = true
        return this
    }

    lineTo(x: number, y: number): this {
        this.instructions.push(PathInstructionFactory.lineTo(x, y))
        this._currentPoint = new Vector2(x, y)
        this._boundsDirty = true
        return this
    }

    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): this {
        this.instructions.push(PathInstructionFactory.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y))
        this._currentPoint = new Vector2(x, y)
        this._boundsDirty = true
        return this
    }

    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): this {
        this.instructions.push(PathInstructionFactory.quadraticCurveTo(cpx, cpy, x, y))
        this._currentPoint = new Vector2(x, y)
        this._boundsDirty = true
        return this
    }

    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise = false): this {
        this.instructions.push(PathInstructionFactory.arc(x, y, radius, startAngle, endAngle, counterclockwise))
        const sweep = this.computeSweep(startAngle, endAngle, counterclockwise)
        this._currentPoint = new Vector2(x + radius * Math.cos(startAngle + sweep), y + radius * Math.sin(startAngle + sweep))
        this._boundsDirty = true
        return this
    }

    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): this {
        this.instructions.push(PathInstructionFactory.arcTo(x1, y1, x2, y2, radius))
        if (this._currentPoint) {
            // 标准 arcTo：两点切线交点生成圆弧（Canvas 语义）
            const start = this._currentPoint
            this._currentPoint = this.computeArcToEndPoint(start.x, start.y, x1, y1, x2, y2, radius)
        }
        this._boundsDirty = true
        return this
    }

    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation = 0, startAngle = 0, endAngle = 0, counterclockwise = false): this {
        this.instructions.push(PathInstructionFactory.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise))
        const sweep = this.computeSweep(startAngle, endAngle, counterclockwise)
        this._currentPoint = this.ellipsePoint(x, y, radiusX, radiusY, rotation, startAngle + sweep)
        this._boundsDirty = true
        return this
    }

    rect(x: number, y: number, width: number, height: number): this {
        this.instructions.push(PathInstructionFactory.rect(x, y, width, height))
        this._currentPoint = new Vector2(x, y)
        this._subpathStart = new Vector2(x, y)
        this._boundsDirty = true
        return this
    }

    closePath(): this {
        this.instructions.push(PathInstructionFactory.closePath())
        if (this._subpathStart) {
            this._currentPoint = this._subpathStart.clone()
        }
        return this
    }

    // ---- 便捷命令 ----

    /** 添加另一构建器的全部指令 */
    addPath(builder: PathBuilder, transform?: { a: number; b: number; c: number; d: number; e: number; f: number }): this {
        if (transform) {
            for (const inst of builder.instructions) {
                const transformed = this.transformInstruction(inst, transform)
                this.instructions.push(...transformed)
            }
        } else {
            for (const inst of builder.instructions) this.instructions.push(inst)
        }
        if (builder._currentPoint) this._currentPoint = builder._currentPoint.clone()
        this._boundsDirty = true
        return this
    }

    /** 添加一条线段 */
    line(a: Vector2, b: Vector2): this {
        if (!this._currentPoint || !this._currentPoint.equals(a)) this.moveTo(a.x, a.y)
        return this.lineTo(b.x, b.y)
    }

    /** 绘制圆（作为完整子路径） */
    circle(x: number, y: number, radius: number): this {
        return this.moveTo(x + radius, y).arc(x, y, radius, 0, Math.PI * 2).closePath()
    }

    /** 绘制矩形 */
    rectPath(x: number, y: number, width: number, height: number): this {
        return this.moveTo(x, y).lineTo(x + width, y).lineTo(x + width, y + height).lineTo(x, y + height).closePath()
    }

    /** 绘制椭圆 */
    ellipsePath(x: number, y: number, radiusX: number, radiusY: number, rotation = 0): this {
        return this.moveTo(x + radiusX * Math.cos(rotation), y + radiusX * Math.sin(rotation))
            .ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2)
            .closePath()
    }

    // ---- 内部工具 ----

    private computeSweep(start: number, end: number, ccw: boolean): number {
        const twoPI = Math.PI * 2
        // start/end 可能为负数或超过一圈，先取模规范化到 [0, 2π)
        const s = ((start % twoPI) + twoPI) % twoPI
        const e = ((end % twoPI) + twoPI) % twoPI
        let sweep = e - s
        // 非逆时针返回正扫过角 [0, 2π]，逆时针返回负扫过角 [-2π, 0]
        if (ccw) {
            if (sweep > 0) sweep -= twoPI
            // 归一化后为 0 但 start≠end（如 0→2π），说明是整圆
            if (sweep === 0 && end !== start) sweep = -twoPI
        } else {
            if (sweep < 0) sweep += twoPI
            if (sweep === 0 && end !== start) sweep = twoPI
        }
        return sweep
    }

    private ellipsePoint(x: number, y: number, rx: number, ry: number, rot: number, angle: number): Vector2 {
        const ex = rx * Math.cos(angle)
        const ey = ry * Math.sin(angle)
        const cosR = Math.cos(rot), sinR = Math.sin(rot)
        return new Vector2(x + ex * cosR - ey * sinR, y + ex * sinR + ey * cosR)
    }

    private computeArcToEndPoint(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, r: number): Vector2 {
        // 起点→切点1 与 切点1→切点2 的两条边
        const d1x = x1 - x0, d1y = y1 - y0
        const d2x = x2 - x1, d2y = y2 - y1
        const len1 = Math.hypot(d1x, d1y)
        const len2 = Math.hypot(d2x, d2y)
        if (len1 === 0 || len2 === 0) return new Vector2(x1, y1)
        const u1x = d1x / len1, u1y = d1y / len1
        const u2x = d2x / len2, u2y = d2y / len2
        // 两线段夹角
        const cosAngle = u1x * u2x + u1y * u2y
        const angle = Math.acos(Math.min(1, Math.max(-1, cosAngle)))
        const halfAngle = angle / 2
        const radius = Math.min(r, Math.abs(len1 / Math.tan(halfAngle)))
        // 切点位于距交点半径 * tan(halfAngle) 处
        const tangentLen = radius / Math.tan(halfAngle)
        // 第二个切点（arcTo 终点）
        return new Vector2(x1 + u2x * tangentLen, y1 + u2y * tangentLen)
    }

    private transformInstruction(inst: PathInstruction, m: { a: number; b: number; c: number; d: number; e: number; f: number }): PathInstruction[] {
        const tx = (x: number, y: number): [number, number] => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]
        switch (inst.type) {
            case PathInstructionType.MoveTo: {
                const [x, y] = tx(inst.x, inst.y)
                return [PathInstructionFactory.moveTo(x, y)]
            }
            case PathInstructionType.LineTo: {
                const [x, y] = tx(inst.x, inst.y)
                return [PathInstructionFactory.lineTo(x, y)]
            }
            case PathInstructionType.BezierCurveTo: {
                const [c1x, c1y] = tx(inst.cp1x, inst.cp1y)
                const [c2x, c2y] = tx(inst.cp2x, inst.cp2y)
                const [x, y] = tx(inst.x, inst.y)
                return [PathInstructionFactory.bezierCurveTo(c1x, c1y, c2x, c2y, x, y)]
            }
            case PathInstructionType.QuadraticCurveTo: {
                const [cpx, cpy] = tx(inst.cpx, inst.cpy)
                const [x, y] = tx(inst.x, inst.y)
                return [PathInstructionFactory.quadraticCurveTo(cpx, cpy, x, y)]
            }
            case PathInstructionType.ClosePath:
                return [PathInstructionFactory.closePath()]
            default:
                // Arc / Ellipse / ArcTo / Rect 在一般变换下形态复杂，此处转为细分折线指令
                return this.flattenInstruction(inst, m)
        }
    }

    private flattenInstruction(inst: PathInstruction, m: { a: number; b: number; c: number; d: number; e: number; f: number }): PathInstruction[] {
        const pts = this.flattenToPoints(inst)
        if (pts.length === 0) return [PathInstructionFactory.moveTo(0, 0)]
        const first = pts[0]
        const result: PathInstruction[] = [PathInstructionFactory.moveTo(first.x, first.y)]
        for (let i = 1; i < pts.length; i++) {
            const p = pts[i]
            const [x, y] = [m.a * p.x + m.c * p.y + m.e, m.b * p.x + m.d * p.y + m.f]
            result.push(PathInstructionFactory.lineTo(x, y))
        }
        if (inst.type === PathInstructionType.Rect) result.push(PathInstructionFactory.closePath())
        return result
    }

    private flattenToPoints(inst: PathInstruction): Vector2[] {
        switch (inst.type) {
            case PathInstructionType.Arc: {
                const arc = new Arc(inst.x, inst.y, inst.radius, inst.startAngle, inst.endAngle, inst.counterclockwise)
                return arc.getPoints(32)
            }
            case PathInstructionType.Ellipse: {
                const pts: Vector2[] = []
                const sweep = this.computeSweep(inst.startAngle, inst.endAngle, inst.counterclockwise)
                const count = 32
                for (let i = 0; i <= count; i++) {
                    const a = inst.startAngle + sweep * (i / count)
                    pts.push(this.ellipsePoint(inst.x, inst.y, inst.radiusX, inst.radiusY, inst.rotation, a))
                }
                return pts
            }
            case PathInstructionType.ArcTo: {
                const start = this._currentPoint ?? new Vector2(inst.x1, inst.y1)
                const end = this.computeArcToEndPoint(start.x, start.y, inst.x1, inst.y1, inst.x2, inst.y2, inst.radius)
                return [start, end]
            }
            case PathInstructionType.Rect: {
                return [
                    new Vector2(inst.x, inst.y),
                    new Vector2(inst.x + inst.width, inst.y),
                    new Vector2(inst.x + inst.width, inst.y + inst.height),
                    new Vector2(inst.x, inst.y + inst.height),
                ]
            }
            default:
                return []
        }
    }

    // ---- 查询 ----

    /** 包围盒（惰性计算） */
    getBounds(): Box2 {
        if (this._boundsDirty || this._bounds.isEmpty) {
            this._bounds = this.computeBounds()
            this._boundsDirty = false
        }
        return this._bounds.clone()
    }

    private computeBounds(): Box2 {
        const box = new Box2()
        for (const inst of this.instructions) {
            switch (inst.type) {
                case PathInstructionType.MoveTo:
                case PathInstructionType.LineTo:
                    box.expandByPoint(inst.x, inst.y)
                    break
                case PathInstructionType.BezierCurveTo: {
                    const start = this.prevPoint(inst)
                    const bez = new Bezier(
                        start,
                        new Vector2(inst.cp1x, inst.cp1y),
                        new Vector2(inst.cp2x, inst.cp2y),
                        new Vector2(inst.x, inst.y),
                    )
                    box.union(bez.getBounds())
                    break
                }
                case PathInstructionType.QuadraticCurveTo: {
                    const start = this.prevPoint(inst)
                    const bez = new Bezier(
                        start,
                        new Vector2(inst.cpx, inst.cpy),
                        new Vector2(inst.x, inst.y),
                    )
                    box.union(bez.getBounds())
                    break
                }
                case PathInstructionType.Arc:
                    box.union(new Arc(inst.x, inst.y, inst.radius, inst.startAngle, inst.endAngle, inst.counterclockwise).getBounds())
                    break
                case PathInstructionType.Ellipse:
                    box.expandByPoint(inst.x - inst.radiusX, inst.y - inst.radiusY)
                    box.expandByPoint(inst.x + inst.radiusX, inst.y + inst.radiusY)
                    break
                case PathInstructionType.ArcTo:
                    box.expandByPoint(inst.x1, inst.y1)
                    box.expandByPoint(inst.x2, inst.y2)
                    break
                case PathInstructionType.Rect:
                    box.expandByPoint(inst.x, inst.y)
                    box.expandByPoint(inst.x + inst.width, inst.y + inst.height)
                    break
                case PathInstructionType.ClosePath:
                    break
            }
        }
        return box
    }

    private prevPoint(inst: PathInstruction): Vector2 {
        // 从当前指令索引往前找最近的已知点
        const idx = this.instructions.indexOf(inst)
        for (let i = idx - 1; i >= 0; i--) {
            const it = this.instructions[i]
            switch (it.type) {
                case PathInstructionType.MoveTo:
                case PathInstructionType.LineTo:
                    return new Vector2(it.x, it.y)
                case PathInstructionType.BezierCurveTo:
                case PathInstructionType.QuadraticCurveTo:
                    return new Vector2(it.x, it.y)
                case PathInstructionType.Arc:
                    return new Arc(it.x, it.y, it.radius, it.startAngle, it.endAngle, it.counterclockwise).endPoint
                case PathInstructionType.Ellipse: {
                    const sweep = this.computeSweep(it.startAngle, it.endAngle, it.counterclockwise)
                    return this.ellipsePoint(it.x, it.y, it.radiusX, it.radiusY, it.rotation, it.startAngle + sweep)
                }
                default:
                    break
            }
        }
        return new Vector2(0, 0)
    }

    /** 将路径扁平化为折线点集（供细分/拾取） */
    /** 按子路径分组返回扁平化点（供描边等使用），Rect/ClosePath 会标记为闭合 */
    getSubpaths(maxError = 0.25): Array<{ points: Vector2[]; closed: boolean }> {
        const subpaths: Array<{ points: Vector2[]; closed: boolean }> = []
        let current: Vector2[] = []
        let closed = false
        let cursor: Vector2 | null = null
        let subpathStart: Vector2 | null = null

        const flush = () => {
            if (current.length > 0) subpaths.push({ points: current, closed })
            current = []
            closed = false
        }
        const push = (p: Vector2) => {
            if (!cursor || !cursor.equals(p)) {
                current.push(p.clone())
                cursor = p.clone()
            }
        }

        for (const inst of this.instructions) {
            switch (inst.type) {
                case PathInstructionType.MoveTo:
                    flush()
                    subpathStart = new Vector2(inst.x, inst.y)
                    cursor = null
                    push(subpathStart)
                    break
                case PathInstructionType.LineTo:
                    push(new Vector2(inst.x, inst.y))
                    break
                case PathInstructionType.BezierCurveTo: {
                    const start = cursor ?? subpathStart ?? new Vector2()
                    const bez = new Bezier(start, new Vector2(inst.cp1x, inst.cp1y), new Vector2(inst.cp2x, inst.cp2y), new Vector2(inst.x, inst.y))
                    const pts = bez.flatten(maxError)
                    for (let i = 1; i < pts.length; i++) push(pts[i])
                    break
                }
                case PathInstructionType.QuadraticCurveTo: {
                    const start = cursor ?? subpathStart ?? new Vector2()
                    const bez = new Bezier(start, new Vector2(inst.cpx, inst.cpy), new Vector2(inst.x, inst.y))
                    const pts = bez.flatten(maxError)
                    for (let i = 1; i < pts.length; i++) push(pts[i])
                    break
                }
                case PathInstructionType.Arc: {
                    const arc = new Arc(inst.x, inst.y, inst.radius, inst.startAngle, inst.endAngle, inst.counterclockwise)
                    const pts = arc.getPoints(32)
                    for (let i = 0; i < pts.length; i++) push(pts[i])
                    break
                }
                case PathInstructionType.Ellipse: {
                    const sweep = this.computeSweep(inst.startAngle, inst.endAngle, inst.counterclockwise)
                    const count = 32
                    for (let i = 0; i <= count; i++) {
                        push(this.ellipsePoint(inst.x, inst.y, inst.radiusX, inst.radiusY, inst.rotation, inst.startAngle + sweep * (i / count)))
                    }
                    break
                }
                case PathInstructionType.ArcTo: {
                    const start = cursor ?? subpathStart ?? new Vector2()
                    const arcPts = this.arcToSampling(start.x, start.y, inst.x1, inst.y1, inst.x2, inst.y2, inst.radius)
                    for (let i = 0; i < arcPts.length; i++) push(arcPts[i])
                    cursor = this.computeArcToEndPoint(start.x, start.y, inst.x1, inst.y1, inst.x2, inst.y2, inst.radius)
                    break
                }
                case PathInstructionType.Rect:
                    flush()
                    subpaths.push({
                        points: [
                            new Vector2(inst.x, inst.y),
                            new Vector2(inst.x + inst.width, inst.y),
                            new Vector2(inst.x + inst.width, inst.y + inst.height),
                            new Vector2(inst.x, inst.y + inst.height),
                        ],
                        closed: true,
                    })
                    cursor = new Vector2(inst.x, inst.y)
                    subpathStart = cursor.clone()
                    break
                case PathInstructionType.ClosePath:
                    // 不追加重复起点：闭合由 closed 标记表达，避免描边把起点当独立顶点
                    closed = true
                    flush()
                    break
            }
        }
        flush()
        return subpaths
    }

    flatten(maxError = 0.25): Vector2[] {
        const points: Vector2[] = []
        let cursor: Vector2 | null = null
        let subpathStart: Vector2 | null = null
        const push = (p: Vector2) => {
            if (!cursor || !cursor.equals(p)) {
                points.push(p.clone())
                cursor = p.clone()
            }
        }
        for (const inst of this.instructions) {
            switch (inst.type) {
                case PathInstructionType.MoveTo:
                    cursor = null
                    subpathStart = new Vector2(inst.x, inst.y)
                    push(subpathStart)
                    break
                case PathInstructionType.LineTo:
                    push(new Vector2(inst.x, inst.y))
                    break
                case PathInstructionType.BezierCurveTo: {
                    const start = cursor ?? subpathStart ?? new Vector2()
                    const bez = new Bezier(start, new Vector2(inst.cp1x, inst.cp1y), new Vector2(inst.cp2x, inst.cp2y), new Vector2(inst.x, inst.y))
                    const pts = bez.flatten(maxError)
                    for (let i = 1; i < pts.length; i++) push(pts[i])
                    break
                }
                case PathInstructionType.QuadraticCurveTo: {
                    const start = cursor ?? subpathStart ?? new Vector2()
                    const bez = new Bezier(start, new Vector2(inst.cpx, inst.cpy), new Vector2(inst.x, inst.y))
                    const pts = bez.flatten(maxError)
                    for (let i = 1; i < pts.length; i++) push(pts[i])
                    break
                }
                case PathInstructionType.Arc: {
                    const arc = new Arc(inst.x, inst.y, inst.radius, inst.startAngle, inst.endAngle, inst.counterclockwise)
                    const pts = arc.getPoints(32)
                    for (let i = 0; i < pts.length; i++) push(pts[i])
                    break
                }
                case PathInstructionType.Ellipse: {
                    const sweep = this.computeSweep(inst.startAngle, inst.endAngle, inst.counterclockwise)
                    const count = 32
                    for (let i = 0; i <= count; i++) {
                        push(this.ellipsePoint(inst.x, inst.y, inst.radiusX, inst.radiusY, inst.rotation, inst.startAngle + sweep * (i / count)))
                    }
                    break
                }
                case PathInstructionType.ArcTo: {
                    const start = cursor ?? subpathStart ?? new Vector2()
                    const end = this.computeArcToEndPoint(start.x, start.y, inst.x1, inst.y1, inst.x2, inst.y2, inst.radius)
                    // 生成中间圆弧采样：用 arcTo 的圆参数采样
                    const arcPts = this.arcToSampling(start.x, start.y, inst.x1, inst.y1, inst.x2, inst.y2, inst.radius)
                    for (let i = 0; i < arcPts.length; i++) push(arcPts[i])
                    cursor = end
                    break
                }
                case PathInstructionType.Rect:
                    push(new Vector2(inst.x, inst.y))
                    push(new Vector2(inst.x + inst.width, inst.y))
                    push(new Vector2(inst.x + inst.width, inst.y + inst.height))
                    push(new Vector2(inst.x, inst.y + inst.height))
                    subpathStart = new Vector2(inst.x, inst.y)
                    break
                case PathInstructionType.ClosePath:
                    if (subpathStart && cursor) push(subpathStart)
                    break
            }
        }
        return points
    }

    private arcToSampling(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, r: number): Vector2[] {
        const d1x = x1 - x0, d1y = y1 - y0
        const d2x = x2 - x1, d2y = y2 - y1
        const len1 = Math.hypot(d1x, d1y)
        const len2 = Math.hypot(d2x, d2y)
        if (len1 === 0 || len2 === 0) return []
        const u1x = d1x / len1, u1y = d1y / len1
        const u2x = d2x / len2, u2y = d2y / len2
        const cosA = Math.min(1, Math.max(-1, u1x * u2x + u1y * u2y))
        const angle = Math.acos(cosA)
        const radius = Math.min(r, Math.abs(len1 / Math.tan(angle / 2)))
        const tangentLen = radius / Math.tan(angle / 2)
        const t1x = x1 - u1x * tangentLen, t1y = y1 - u1y * tangentLen
        const t2x = x1 + u2x * tangentLen, t2y = y1 + u2y * tangentLen
        // 圆心位于角平分线上距离 = radius / sin(angle/2)
        const bisectorLen = radius / Math.sin(angle / 2)
        const bx = x1 - (u1x + u2x) / 2, by = y1 - (u1y + u2y) / 2
        const bl = Math.hypot(bx, by) || 1
        const cx = x1 - (bx / bl) * bisectorLen, cy = y1 - (by / bl) * bisectorLen
        const a0 = Math.atan2(t1y - cy, t1x - cx)
        const a1 = Math.atan2(t2y - cy, t2x - cx)
        let sweep = a1 - a0
        while (sweep < 0) sweep += Math.PI * 2
        const count = 16
        const pts: Vector2[] = []
        for (let i = 1; i <= count; i++) {
            const a = a0 + sweep * (i / count)
            pts.push(new Vector2(cx + radius * Math.cos(a), cy + radius * Math.sin(a)))
        }
        return pts
    }

    /** 复制指令序列 */
    clone(): PathBuilder {
        const b = new PathBuilder()
        b.instructions.push(...this.instructions.map((i) => ({ ...i })))
        if (this._currentPoint) b._currentPoint = this._currentPoint.clone()
        if (this._subpathStart) b._subpathStart = this._subpathStart.clone()
        b._bounds = this._bounds.clone()
        b._boundsDirty = this._boundsDirty
        return b
    }

    reset(): this {
        this.instructions.length = 0
        this._currentPoint = null
        this._subpathStart = null
        this._bounds = new Box2()
        this._boundsDirty = false
        return this
    }

    toString(): string {
        return `PathBuilder(${this.instructions.length} instructions)`
    }
}
