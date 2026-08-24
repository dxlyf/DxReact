/**
 * Canvas2D CPU 渲染器 —— 路径。
 *
 * Canvas 的路径是"用户坐标下的命令序列"（立即模式），渲染时才按当前 transform 变换。
 * 曲线（二次/三次贝塞尔、圆弧、椭圆弧）在转多边形时自适应细分为折线段，
 * 填充/描边统一按多边形处理——这就是 canvas 能把任意曲线画出来的背后逻辑。
 */

/** 路径命令（args 为参数数组，语义见各命令构造方法） */
export interface PathCommand {
    type: 'moveTo' | 'lineTo' | 'quadraticCurveTo' | 'bezierCurveTo' | 'arc' | 'arcTo' | 'ellipse' | 'rect' | 'closePath'
    args: number[]
}

/** 扁平化后的子路径：点序列 + 是否闭合 */
export interface SubPath {
    points: [number, number][]
    closed: boolean
}

/** 曲线细分步数（越大越平滑） */
const QUAD_STEPS = 8
const CUBIC_STEPS = 12
const ARC_STEPS = 24

export class Path2D {
    private cmds: PathCommand[] = []

    get commands(): readonly PathCommand[] {
        return this.cmds
    }

    /** 清空路径 */
    reset(): void {
        this.cmds = []
    }

    moveTo(x: number, y: number): void {
        this.cmds.push({ type: 'moveTo', args: [x, y] })
    }

    lineTo(x: number, y: number): void {
        this.cmds.push({ type: 'lineTo', args: [x, y] })
    }

    /** 二次贝塞尔：当前点到 (x,y)，控制点 (cpx,cpy) */
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        this.cmds.push({ type: 'quadraticCurveTo', args: [cpx, cpy, x, y] })
    }

    /** 三次贝塞尔：当前点到 (x,y)，控制点 (cp1x,cp1y)/(cp2x,cp2y) */
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        this.cmds.push({ type: 'bezierCurveTo', args: [cp1x, cp1y, cp2x, cp2y, x, y] })
    }

    /** 圆弧（角度弧度制，默认顺时针即默认方向：canvas 中角度增加方向为顺时针因为 y 向下） */
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise = false): void {
        this.cmds.push({ type: 'arc', args: [x, y, radius, startAngle, endAngle, counterclockwise ? 1 : 0] })
    }

    /** 椭圆弧（rx/ry 半径） */
    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise = false): void {
        this.cmds.push({ type: 'ellipse', args: [x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise ? 1 : 0] })
    }

    /** 圆弧切线连接（arcTo）：当前点 → 与两条切线相切半径 r 的弧 → (x2,y2) */
    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        this.cmds.push({ type: 'arcTo', args: [x1, y1, x2, y2, radius] })
    }

    rect(x: number, y: number, width: number, height: number): void {
        this.cmds.push({ type: 'rect', args: [x, y, width, height] })
    }

    closePath(): void {
        this.cmds.push({ type: 'closePath', args: [] })
    }

    /**
     * 把路径扁平化为多边形（子路径列表）。
     * 所有曲线在此步细分为折线段；填充/描边后续只认折线。
     */
    toPolygons(): SubPath[] {
        const subs: SubPath[] = []
        let points: [number, number][] = []
        let hasPoint = false

        const flush = (closed: boolean) => {
            if (hasPoint) {
                subs.push({ points, closed })
            }
            points = []
            hasPoint = false
        }

        for (const cmd of this.cmds) {
            switch (cmd.type) {
                case 'moveTo': {
                    flush(false)
                    points.push([cmd.args[0], cmd.args[1]])
                    hasPoint = true
                    break
                }
                case 'lineTo': {
                    points.push([cmd.args[0], cmd.args[1]])
                    break
                }
                case 'quadraticCurveTo': {
                    const [cpx, cpy, x, y] = cmd.args
                    const [x0, y0] = points[points.length - 1]
                    for (let i = 1; i <= QUAD_STEPS; i++) {
                        const t = i / QUAD_STEPS
                        const mt = 1 - t
                        points.push([
                            mt * mt * x0 + 2 * mt * t * cpx + t * t * x,
                            mt * mt * y0 + 2 * mt * t * cpy + t * t * y,
                        ])
                    }
                    break
                }
                case 'bezierCurveTo': {
                    const [c1x, c1y, c2x, c2y, x, y] = cmd.args
                    const [x0, y0] = points[points.length - 1]
                    for (let i = 1; i <= CUBIC_STEPS; i++) {
                        const t = i / CUBIC_STEPS
                        const mt = 1 - t
                        const a = mt * mt * mt, b = 3 * mt * mt * t, c = 3 * mt * t * t, d = t * t * t
                        points.push([
                            a * x0 + b * c1x + c * c2x + d * x,
                            a * y0 + b * c1y + c * c2y + d * y,
                        ])
                    }
                    break
                }
                case 'arc': {
                    const [x, y, r, sa, ea, ccw] = cmd.args
                    this.appendArc(points, x, y, r, r, 0, sa, ea, ccw === 1)
                    if (points.length > 0) hasPoint = true
                    break
                }
                case 'ellipse': {
                    const [x, y, rx, ry, rot, sa, ea, ccw] = cmd.args
                    this.appendArc(points, x, y, rx, ry, rot, sa, ea, ccw === 1)
                    if (points.length > 0) hasPoint = true
                    break
                }
                case 'arcTo': {
                    this.appendArcTo(points, cmd.args)
                    if (points.length > 0) hasPoint = true
                    break
                }
                case 'rect': {
                    const [x, y, w, h] = cmd.args
                    flush(false)
                    points = [
                        [x, y],
                        [x + w, y],
                        [x + w, y + h],
                        [x, y + h],
                    ]
                    hasPoint = true
                    // rect 自带闭合：此子路径以闭合结束
                    subs.push({ points, closed: true })
                    points = []
                    hasPoint = false
                    break
                }
                case 'closePath': {
                    if (hasPoint) {
                        // 闭合标记：首尾点相同则合并，避免零长边
                        if (points.length > 1) {
                            const first = points[0]
                            const last = points[points.length - 1]
                            if (last[0] !== first[0] || last[1] !== first[1]) points.push([first[0], first[1]])
                        }
                        flush(true)
                    }
                    break
                }
            }
        }
        flush(false)
        return subs
    }

    /** 圆弧/椭圆弧采样为折线点（自动处理跨 2π 的多圈方向） */
    private appendArc(
        points: [number, number][],
        x: number, y: number,
        rx: number, ry: number,
        rotation: number,
        startAngle: number, endAngle: number,
        counterclockwise: boolean,
    ): void {
        let sweep = endAngle - startAngle
        // canvas 语义：默认顺时针（角增方向），ccw=true 时逆时针
        if (!counterclockwise) {
            while (sweep < 0) sweep += Math.PI * 2
        } else {
            while (sweep > 0) sweep -= Math.PI * 2
        }
        const cosR = Math.cos(rotation), sinR = Math.sin(rotation)
        const n = Math.max(4, Math.ceil(Math.abs(sweep) / (Math.PI * 2) * ARC_STEPS))
        // 弧起点：子路径为空时先落笔（canvas 语义：无当前点时 moveTo 到弧起点）
        if (points.length === 0) {
            const a0 = startAngle
            const px0 = rx * Math.cos(a0), py0 = ry * Math.sin(a0)
            points.push([x + cosR * px0 - sinR * py0, y + sinR * px0 + cosR * py0])
        }
        for (let i = 1; i <= n; i++) {
            const a = startAngle + sweep * (i / n)
            const px = rx * Math.cos(a), py = ry * Math.sin(a)
            points.push([
                x + cosR * px - sinR * py,
                y + sinR * px + cosR * py,
            ])
        }
    }

    /** arcTo：计算切点并插入圆弧采样点 */
    private appendArcTo(points: [number, number][], args: number[]): void {
        const [x1, y1, x2, y2, r] = args
        const [x0, y0] = points[points.length - 1]
        if (r <= 0) {
            points.push([x1, y1])
            return
        }
        // 向量 v1 = p0→p1, v2 = p1→p2；求圆心（p1 到两切线的垂足距离 d = r / sin(θ/2)）
        const dx1 = x1 - x0, dy1 = y1 - y0
        const dx2 = x2 - x1, dy2 = y2 - y1
        const len1 = Math.hypot(dx1, dy1), len2 = Math.hypot(dx2, dy2)
        if (len1 < 1e-12 || len2 < 1e-12) {
            points.push([x1, y1])
            return
        }
        const ux = dx1 / len1, uy = dy1 / len1       // p0→p1 单位向量
        const vx = dx2 / len2, vy = dy2 / len2       // p1→p2 单位向量
        const cosTheta = Math.max(-1, Math.min(1, ux * vx + uy * vy))
        const sinTheta = Math.sin(Math.acos(cosTheta)) // 夹角正弦（非负）
        if (sinTheta < 1e-6) {
            points.push([x1, y1])
            return
        }
        const d = r / Math.tan(Math.acos(cosTheta) / 2) // 从 p1 到切点的距离
        // 切点 t0 = p1 - d*u（p0→p1 方向），t1 = p1 + d*v（p1→p2 方向）
        const t0x = x1 - d * ux, t0y = y1 - d * uy
        const t1x = x1 + d * vx, t1y = y1 + d * vy
        // 圆心 = 从切点沿法线偏移 r。法线取与角平分线相反侧
        const nx = -uy, ny = ux // u 的法线
        // 圆心在 t0 处沿 n 或 -n：选择使圆心到 (x1,y1) 距离为 r 的那一侧
        const cx1 = t0x + nx * r, cy1 = t0y + ny * r
        const cx2 = t0x - nx * r, cy2 = t0y - ny * r
        const dist1 = Math.hypot(cx1 - x1, cy1 - y1)
        const cx = dist1 < r ? cx1 : cx2
        const cy = dist1 < r ? cy1 : cy2
        const sa = Math.atan2(t0y - cy, t0x - cx)
        const ea = Math.atan2(t1y - cy, t1x - cx)
        // 逆时针方向：p0→p1→p2 若构成右转则弧逆时针（这里按叉积判断）
        const cross = dx1 * dy2 - dy1 * dx2
        const counterclockwise = cross < 0
        points.push([t0x, t0y])
        this.appendArc(points, cx, cy, r, r, 0, sa, ea, counterclockwise)
        points.push([t1x, t1y])
    }
}
