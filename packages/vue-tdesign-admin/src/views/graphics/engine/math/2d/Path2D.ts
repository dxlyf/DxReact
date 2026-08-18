import { PathBuilder } from './PathBuilder'
import { PathStroker, StrokeOptions } from './PathStroker'
import { PathInstructionType } from './PathInstruction'
import { Box2 } from './Box2'
import { Vector2 } from './Vector2'
import { Matrix2D } from './Matrix2D'
import * as MathUtils from '../utils/MathUtils'

/**
 * 路径 2D 类
 *
 * 对标浏览器原生 Path2D：包装 PathBuilder 指令数据，
 * 提供 SVG path data 解析、Canvas 直接回放渲染、
 * 包围盒/命中检测等能力。GPU 后端可复用指令细分三角形。
 */
export class Path2D {
    readonly builder: PathBuilder

    constructor(source?: PathBuilder | string) {
        this.builder = new PathBuilder()
        if (source instanceof PathBuilder) {
            this.builder.addPath(source)
        } else if (typeof source === 'string') {
            SvgPathParser.parse(source, this.builder)
        }
    }

    // ---- 命令透传 ----

    moveTo(x: number, y: number): this {
        this.builder.moveTo(x, y)
        return this
    }

    lineTo(x: number, y: number): this {
        this.builder.lineTo(x, y)
        return this
    }

    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): this {
        this.builder.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
        return this
    }

    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): this {
        this.builder.quadraticCurveTo(cpx, cpy, x, y)
        return this
    }

    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise = false): this {
        this.builder.arc(x, y, radius, startAngle, endAngle, counterclockwise)
        return this
    }

    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): this {
        this.builder.arcTo(x1, y1, x2, y2, radius)
        return this
    }

    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation = 0, startAngle = 0, endAngle = 0, counterclockwise = false): this {
        this.builder.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise)
        return this
    }

    rect(x: number, y: number, width: number, height: number): this {
        this.builder.rect(x, y, width, height)
        return this
    }

    closePath(): this {
        this.builder.closePath()
        return this
    }

    addPath(path: Path2D | PathBuilder, transform?: Matrix2D): this {
        if (path instanceof Path2D) this.builder.addPath(path.builder, transform?.toArray() as unknown as { a: number; b: number; c: number; d: number; e: number; f: number })
        else this.builder.addPath(path, transform ? { a: transform.a, b: transform.b, c: transform.c, d: transform.d, e: transform.e, f: transform.f } : undefined)
        return this
    }

    get isEmpty(): boolean {
        return this.builder.isEmpty
    }

    get currentPoint(): Vector2 | null {
        return this.builder.currentPoint
    }

    // ---- 查询 ----

    getBounds(): Box2 {
        return this.builder.getBounds()
    }

    /** 扁平化点集（用于命中/细分） */
    flatten(maxError = 0.25): Vector2[] {
        return this.builder.flatten(maxError)
    }

    /**
     * 命中检测（填充区域） 
     * 使用射线投射算法判断点是否落在任一子路径围成的区域内。
     */
    contains(point: Vector2): boolean {
        const pts = this.flatten(0.5)
        const n = pts.length
        if (n < 3) return false
        let inside = false
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const a = pts[i], b = pts[j]
            const intersect = (a.y > point.y) !== (b.y > point.y) &&
                point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
            if (intersect) inside = !inside
        }
        return inside
    }

    /** 点到路径的最短距离（近似，用于描边命中检测） */
    distanceToPoint(point: Vector2): number {
        const pts = this.flatten(0.5)
        if (pts.length === 0) return Infinity
        let min = Infinity
        for (let i = 0; i < pts.length; i++) {
            const d = pts[i].distanceTo(point)
            if (d < min) min = d
        }
        return min
    }

    /** 应用变换生成新路径（复杂指令自动细分） */
    transform(m: Matrix2D): Path2D {
        const result = new Path2D()
        result.builder.addPath(this.builder, { a: m.a, b: m.b, c: m.c, d: m.d, e: m.e, f: m.f })
        return result
    }

    /** 生成描边路径 */
    strokePath(options: StrokeOptions): Path2D {
        return new Path2D(new PathStroker(options).stroke(this.builder))
    }

    // ---- Canvas 渲染 ----

    /** 将指令回放到 canvas 2d 上下文 */
    applyTo(ctx: CanvasRenderingContext2D): void {
        for (const inst of this.builder.instructions) {
            switch (inst.type) {
                case PathInstructionType.MoveTo:
                    ctx.moveTo(inst.x, inst.y)
                    break
                case PathInstructionType.LineTo:
                    ctx.lineTo(inst.x, inst.y)
                    break
                case PathInstructionType.BezierCurveTo:
                    ctx.bezierCurveTo(inst.cp1x, inst.cp1y, inst.cp2x, inst.cp2y, inst.x, inst.y)
                    break
                case PathInstructionType.QuadraticCurveTo:
                    ctx.quadraticCurveTo(inst.cpx, inst.cpy, inst.x, inst.y)
                    break
                case PathInstructionType.Arc:
                    ctx.arc(inst.x, inst.y, inst.radius, inst.startAngle, inst.endAngle, inst.counterclockwise)
                    break
                case PathInstructionType.ArcTo:
                    ctx.arcTo(inst.x1, inst.y1, inst.x2, inst.y2, inst.radius)
                    break
                case PathInstructionType.Ellipse:
                    ctx.ellipse(inst.x, inst.y, inst.radiusX, inst.radiusY, inst.rotation, inst.startAngle, inst.endAngle, inst.counterclockwise)
                    break
                case PathInstructionType.Rect:
                    ctx.rect(inst.x, inst.y, inst.width, inst.height)
                    break
                case PathInstructionType.ClosePath:
                    ctx.closePath()
                    break
            }
        }
    }

    fill(ctx: CanvasRenderingContext2D, fillStyle: string | CanvasGradient | CanvasPattern): void {
        ctx.save()
        ctx.fillStyle = fillStyle
        this.applyTo(ctx)
        ctx.fill()
        ctx.restore()
    }

    stroke(ctx: CanvasRenderingContext2D, strokeStyle: string | CanvasGradient | CanvasPattern, width = 1): void {
        ctx.save()
        ctx.strokeStyle = strokeStyle
        ctx.lineWidth = width
        this.applyTo(ctx)
        ctx.stroke()
        ctx.restore()
    }

    clip(ctx: CanvasRenderingContext2D): void {
        this.applyTo(ctx)
        ctx.clip()
    }

    clone(): Path2D {
        return new Path2D(this.builder.clone())
    }

    toString(): string {
        return `Path2D(${this.builder.instructionCount} instructions)`
    }
}

// ==================== SVG Path Data 解析器 ====================

/**
 * SVG path data 解析器（支持 M/L/H/V/C/S/Q/T/A/Z 及相对命令）
 */
export class SvgPathParser {
    static parse(d: string, builder: PathBuilder): void {
        const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi)
        if (!tokens) return
        let index = 0
        let current: Vector2 | null = null
        let start: Vector2 | null = null
        let lastCommand = ''
        let lastCubicControl: Vector2 | null = null
        let lastQuadraticControl: Vector2 | null = null

        const readNumber = (): number => {
            const t = tokens[index]
            if (t === undefined) return 0
            index++
            return parseFloat(t)
        }

        const readFlag = (): number => {
            const t = tokens[index]
            if (t === undefined) return 0
            index++
            return t === '1' ? 1 : 0
        }

        const isCommandToken = (): boolean => index < tokens.length && /^[a-zA-Z]$/.test(tokens[index])

        const applyRelative = (cmd: string, x: number, y: number): [number, number] => {
            if (cmd === cmd.toLowerCase() && current) return [x + current.x, y + current.y]
            return [x, y]
        }

        while (index < tokens.length) {
            let cmd = tokens[index]
            if (!/^[a-zA-Z]$/.test(cmd)) {
                // 重复上一次命令
                cmd = lastCommand
            } else {
                index++
            }
            lastCommand = cmd
            const isRel = cmd === cmd.toLowerCase()
            const upper = cmd.toUpperCase()

            switch (upper) {
                case 'M': {
                    let x = readNumber(), y = readNumber()
                    ;[x, y] = applyRelative(cmd, x, y)
                    builder.moveTo(x, y)
                    current = new Vector2(x, y)
                    start = current.clone()
                    lastCubicControl = null
                    lastQuadraticControl = null
                    // 后续坐标按 L 处理
                    let subCmd = isRel ? 'l' : 'L'
                    while (index < tokens.length && !isCommandToken()) {
                        let lx = readNumber(), ly = readNumber()
                        ;[lx, ly] = applyRelative(subCmd, lx, ly)
                        builder.lineTo(lx, ly)
                        current = new Vector2(lx, ly)
                    }
                    break
                }
                case 'L': {
                    let x = readNumber(), y = readNumber()
                    ;[x, y] = applyRelative(cmd, x, y)
                    builder.lineTo(x, y)
                    current = new Vector2(x, y)
                    lastCubicControl = null
                    lastQuadraticControl = null
                    break
                }
                case 'H': {
                    const hx = readNumber()
                    const x = isRel && current ? current.x + hx : hx
                    builder.lineTo(x, current?.y ?? 0)
                    current = new Vector2(x, current?.y ?? 0)
                    break
                }
                case 'V': {
                    const vy = readNumber()
                    const y = isRel && current ? current.y + vy : vy
                    builder.lineTo(current?.x ?? 0, y)
                    current = new Vector2(current?.x ?? 0, y)
                    break
                }
                case 'C': {
                    const c1x = readNumber(), c1y = readNumber()
                    const c2x = readNumber(), c2y = readNumber()
                    let x = readNumber(), y = readNumber()
                    let base = current ?? new Vector2()
                    if (isRel) {
                        builder.bezierCurveTo(c1x + base.x, c1y + base.y, c2x + base.x, c2y + base.y, x + base.x, y + base.y)
                        current = new Vector2(x + base.x, y + base.y)
                        lastCubicControl = new Vector2(c2x + base.x, c2y + base.y)
                    } else {
                        builder.bezierCurveTo(c1x, c1y, c2x, c2y, x, y)
                        current = new Vector2(x, y)
                        lastCubicControl = new Vector2(c2x, c2y)
                    }
                    lastQuadraticControl = null
                    break
                }
                case 'S': {
                    const c2x = readNumber(), c2y = readNumber()
                    let x = readNumber(), y = readNumber()
                    const base = current ?? new Vector2()
                    let c1: Vector2
                    if (lastCommand === 'C' || lastCommand === 'S' || lastCommand === 'c' || lastCommand === 's') {
                        c1 = base.clone().multiplyScalar(2).subtract(lastCubicControl ?? base)
                    } else {
                        c1 = base.clone()
                    }
                    let ex: number, ey: number
                    if (isRel) {
                        ex = x + base.x; ey = y + base.y
                    } else {
                        ex = x; ey = y
                    }
                    builder.bezierCurveTo(c1.x, c1.y, c2x + base.x * (isRel ? 1 : 0), c2y + base.y * (isRel ? 1 : 0), ex, ey)
                    current = new Vector2(ex, ey)
                    lastCubicControl = new Vector2(c2x + (isRel ? base.x : 0), c2y + (isRel ? base.y : 0))
                    lastQuadraticControl = null
                    break
                }
                case 'Q': {
                    const cpx = readNumber(), cpy = readNumber()
                    let x = readNumber(), y = readNumber()
                    const base = current ?? new Vector2()
                    if (isRel) {
                        builder.quadraticCurveTo(cpx + base.x, cpy + base.y, x + base.x, y + base.y)
                        current = new Vector2(x + base.x, y + base.y)
                        lastQuadraticControl = new Vector2(cpx + base.x, cpy + base.y)
                    } else {
                        builder.quadraticCurveTo(cpx, cpy, x, y)
                        current = new Vector2(x, y)
                        lastQuadraticControl = new Vector2(cpx, cpy)
                    }
                    lastCubicControl = null
                    break
                }
                case 'T': {
                    let x = readNumber(), y = readNumber()
                    const base = current ?? new Vector2()
                    let cp: Vector2
                    if (lastCommand === 'Q' || lastCommand === 'T' || lastCommand === 'q' || lastCommand === 't') {
                        cp = base.clone().multiplyScalar(2).subtract(lastQuadraticControl ?? base)
                    } else {
                        cp = base.clone()
                    }
                    let ex: number, ey: number
                    if (isRel) {
                        ex = x + base.x; ey = y + base.y
                    } else {
                        ex = x; ey = y
                    }
                    builder.quadraticCurveTo(cp.x, cp.y, ex, ey)
                    current = new Vector2(ex, ey)
                    lastQuadraticControl = new Vector2(cp.x, cp.y)
                    lastCubicControl = null
                    break
                }
                case 'A': {
                    const rx = Math.abs(readNumber())
                    const ry = Math.abs(readNumber())
                    const rot = MathUtils.toRadians(readNumber())
                    const largeArc = readFlag() === 1
                    const sweep = readFlag() === 1
                    let x = readNumber(), y = readNumber()
                    const base = current ?? new Vector2()
                    const ex = isRel ? x + base.x : x
                    const ey = isRel ? y + base.y : y
                    this.appendArc(builder, base.x, base.y, ex, ey, rx, ry, rot, largeArc, sweep)
                    current = new Vector2(ex, ey)
                    lastCubicControl = null
                    lastQuadraticControl = null
                    break
                }
                case 'Z': {
                    builder.closePath()
                    if (start) {
                        current = start.clone()
                    }
                    lastCubicControl = null
                    lastQuadraticControl = null
                    break
                }
                default:
                    // 未知命令：跳过该 token
                    index++
                    break
            }
        }
    }

    /** 圆弧端点参数化 → 中心参数化（SVG arc 标准转换） */
    private static appendArc(
        builder: PathBuilder,
        x0: number, y0: number,
        x1: number, y1: number,
        rx: number, ry: number,
        rot: number, largeArc: boolean, sweep: boolean,
    ): void {
        if (rx === 0 || ry === 0) {
            builder.lineTo(x1, y1)
            return
        }
        // 半径校正
        const phi = rot
        const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi)
        const dx2 = (x0 - x1) / 2, dy2 = (y0 - y1) / 2
        const xp = cosPhi * dx2 + sinPhi * dy2
        const yp = -sinPhi * dx2 + cosPhi * dy2
        let rx2 = Math.abs(rx), ry2 = Math.abs(ry)
        const lambda = (xp * xp) / (rx2 * rx2) + (yp * yp) / (ry2 * ry2)
        if (lambda > 1) {
            const s = Math.sqrt(lambda)
            rx2 *= s
            ry2 *= s
        }
        const num = rx2 * rx2 * ry2 * ry2 - rx2 * rx2 * yp * yp - ry2 * ry2 * xp * xp
        const den = rx2 * rx2 * yp * yp + ry2 * ry2 * xp * xp
        let coef = den === 0 ? 0 : Math.sqrt(Math.max(0, num / den))
        if (largeArc === sweep) coef = -coef
        const cxp = (coef * rx2 * yp) / ry2
        const cyp = (-coef * ry2 * xp) / rx2
        const cx = cosPhi * cxp - sinPhi * cyp + (x0 + x1) / 2
        const cy = sinPhi * cxp + cosPhi * cyp + (y0 + y1) / 2

        const angleBetween = (ux: number, uy: number, vx: number, vy: number): number => {
            const dot = ux * vx + uy * vy
            const len = Math.hypot(ux, uy) * Math.hypot(vx, vy)
            let a = Math.acos(MathUtils.clamp(dot / (len || 1), -1, 1))
            if (ux * vy - uy * vx < 0) a = -a
            return a
        }

        const startVecX = (xp - cxp) / rx2, startVecY = (yp - cyp) / ry2
        const endVecX = (-xp - cxp) / rx2, endVecY = (-yp - cyp) / ry2
        let startAngle = angleBetween(1, 0, startVecX, startVecY)
        let deltaAngle = angleBetween(startVecX, startVecY, endVecX, endVecY)
        if (!sweep && deltaAngle > 0) deltaAngle -= Math.PI * 2
        if (sweep && deltaAngle < 0) deltaAngle += Math.PI * 2

        // 采样弧线为折线（或输出 ellipse 指令）
        const segments = Math.max(4, Math.ceil((Math.abs(deltaAngle) / (Math.PI * 2)) * 48))
        const px = cosPhi * rx2, py = sinPhi * rx2
        const qx = -sinPhi * ry2, qy = cosPhi * ry2
        for (let i = 1; i <= segments; i++) {
            const a = startAngle + deltaAngle * (i / segments)
            const ex = cx + px * Math.cos(a) + qx * Math.sin(a)
            const ey = cy + py * Math.cos(a) + qy * Math.sin(a)
            builder.lineTo(ex, ey)
        }
    }
}
