
export type IPoint = {
    x: number
    y: number
}
export enum PathVerb {
    MoveTo,
    LineTo,
    QuadraticTo,
    CubicTo,
    Close,
}
export const PathVerbCount = {
    [PathVerb.MoveTo]: 1,
    [PathVerb.LineTo]: 1,
    [PathVerb.QuadraticTo]: 2,
    [PathVerb.CubicTo]: 3,
    [PathVerb.Close]: 0,
}
export class Point {
    static create(x: number, y: number) {
        return new Point(x, y)
    }
    x: number
    y: number
    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
    dot(p: Point) {
        return this.x * p.x + this.y * p.y
    }
    // 计算点之间的角度
    angleTo(p: Point) {
        return Math.atan2(this.y - p.y, this.x - p.x)
    }
    cross(p: Point) {
        return this.x * p.y - this.y * p.x
    }
    length() {
        return Math.sqrt(this.x ** 2 + this.y ** 2)
    }
    // 计算点之间的距离
    distanceTo(p: Point) {
        return Math.sqrt((this.x - p.x) ** 2) + ((this.y - p.y) * (this.y - p.y))
    }
}

function windLine(x: number, y: number, x0: number, y0: number, x1: number, y1: number): number {
    // 水平线段：射线与线段平行，不贡献绕数
    if (y0 === y1) return 0

    // 半开区间 [min, max)：射线穿过顶点时只被一端计入，避免重复计数
    if (y < Math.min(y0, y1) || y >= Math.max(y0, y1)) return 0

    // 计算线段在 y 处的交点 x 坐标，若交点在射线左侧则计数
    if (x <= x0 + (x1 - x0) * (y - y0) / (y1 - y0)) {
        // 从下往上穿 → +1，从上往下穿 → -1
        return y1 > y0 ? 1 : -1
    }
    return 0
}
function normalizeAngle(angle: number): number {
    angle = angle % (2 * Math.PI);
    if (angle < 0) angle += 2 * Math.PI;
    return angle;
}

function normalizeAngles(startAngle: number, endAngle: number, ccw: boolean = false) {
    const tau = Math.PI * 2
    let newStartAngle = startAngle % tau;
    if (newStartAngle <= 0) {
        newStartAngle += tau;
    }
    let delta = newStartAngle - startAngle;
    startAngle = newStartAngle;
    endAngle += delta;

    if (!ccw && (endAngle - startAngle) >= tau) {
        endAngle = startAngle + tau;
    }
    else if (ccw && (startAngle - endAngle) >= tau) {
        endAngle = startAngle - tau;
    }
    else if (!ccw && startAngle > endAngle) {
        endAngle = startAngle + (tau - (startAngle - endAngle) % tau);
    }
    else if (ccw && startAngle < endAngle) {
        endAngle = startAngle - (tau - (endAngle - startAngle) % tau);
    }
    return { startAngle, endAngle }
}

export class Path2D {
    verbs: PathVerb[]
    points: IPoint[]
    lastMoveIndex: number = -1
    needMoveTo: boolean = true
    constructor() {
        this.verbs = []
        this.points = []
    }
    reset() {
        this.verbs = []
        this.points = []
        this.lastMoveIndex = -1
        this.needMoveTo = true
    }
    get lastVerb() {
        return this.verbs[this.verbs.length - 1]
    }
    get lastPoint() {
        return this.points[this.points.length - 1]
    }
    get lastMovePoint() {
        return this.points[this.lastMoveIndex]
    }
    get size() {
        return this.verbs.length
    }
    get isEmpty() {
        return this.verbs.length === 0
    }
    ensureMove(x:number=0,y:number=0) {
        if (this.needMoveTo) {
            if (this.isEmpty) {
                this.moveTo(x, y)
            } else {
                this.moveTo(this.lastPoint.x, this.lastPoint.y)
            }
        }
    }
    moveTo(x: number, y: number) {
        if (this.lastVerb === PathVerb.MoveTo) {
            this.lastPoint.x = x
            this.lastPoint.y = y
        } else {
            this.verbs.push(PathVerb.MoveTo)
            this.points.push({ x, y })
        }
        this.lastMoveIndex = this.points.length - 1
        this.needMoveTo = false
    }
    lineTo(x: number, y: number) {
        this.ensureMove()
        this.verbs.push(PathVerb.LineTo)
        this.points.push({ x, y })
    }
    quadraticCurveTo(cpX: number, cpY: number, x: number, y: number) {
        this.ensureMove()
        this.verbs.push(PathVerb.QuadraticTo)
        this.points.push({ x: cpX, y: cpY })
        this.points.push({ x, y })
    }
    bezierCurveTo(cpX1: number, cpY1: number, cpX2: number, cpY2: number, x: number, y: number) {
        this.ensureMove()
        this.verbs.push(PathVerb.CubicTo)
        this.points.push({ x: cpX1, y: cpY1 })
        this.points.push({ x: cpX2, y: cpY2 })
        this.points.push({ x, y })
    }
    conicTo(cpX: number, cpY: number, x: number, y: number, weight: number) {
        const k = (4 * weight) / (3 * (weight + 1))
        const lastPoint = this.lastPoint
        const cp1X = lastPoint.x + (cpX - lastPoint.x) * k
        const cp1Y = lastPoint.y + (cpY - lastPoint.y) * k
        const cp2X = x + (cpX - x) * k
        const cp2Y = y + (cpY - y) * k
        return this.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, x, y);
    }
    rect(x: number, y: number, width: number, height: number) {
        this.moveTo(x, y)
        this.lineTo(x + width, y)
        this.lineTo(x + width, y + height)
        this.lineTo(x, y + height)
        this.lineTo(x, y)
    }

    /**
     * 添加圆弧路径
     *
     * 将圆弧分成最多 90° 一段，每段用三次贝塞尔曲线近似。
     * 近似公式：k = 4/3 * tan(θ/4)，控制点沿切线方向偏移 k * radius。
     *
     * @param x - 圆心 X
     * @param y - 圆心 Y
     * @param radius - 半径
     * @param startAngle - 起始角度（弧度）
     * @param endAngle - 结束角度（弧度）
     * @param counterclockwise - 是否逆时针（默认顺时针）
     */
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise = false): void {
        const {startAngle:startNorm,endAngle:endNorm}=normalizeAngles(startAngle,endAngle,counterclockwise)
    
        const delta = endNorm - startNorm

        // 每段最多 90°，保证贝塞尔近似精度
        const segments = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 2)))
        const segAngle = delta / segments

        let currentAngle = startNorm
        for (let i = 0; i < segments; i++) {
            const segStart = currentAngle
            const segEnd = currentAngle + segAngle

            const startX = x + radius * Math.cos(segStart)
            const startY = y + radius * Math.sin(segStart)

            if (i === 0) {
                // 与 Canvas API 一致：有子路径则 lineTo 到起点，否则 moveTo
                if (this.isEmpty) {
                    this.moveTo(startX, startY)
                } else {
                    this.lineTo(startX, startY)
                }
            }

            // 三次贝塞尔近似圆弧段（k = 4/3 * tan(θ/4)）
            const theta = segAngle
            const k = (4 / 3) * Math.tan(theta / 4)

            // 起点控制点：沿起点切线方向外推
            const cp1X = startX - k * radius * Math.sin(segStart)
            const cp1Y = startY + k * radius * Math.cos(segStart)

            const endX = x + radius * Math.cos(segEnd)
            const endY = y + radius * Math.sin(segEnd)

            // 终点控制点：沿终点切线方向回推
            const cp2X = endX + k * radius * Math.sin(segEnd)
            const cp2Y = endY - k * radius * Math.cos(segEnd)

            this.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY)
            currentAngle = segEnd
        }
    }

    /**
     * 添加椭圆路径
     *
     * 参数化：E(t) = center + R(rotation) * (rx·cos(t), ry·sin(t))
     * 每段用三次贝塞尔曲线近似，控制点沿切线方向偏移。
     *
     * @param x - 椭圆中心 X
     * @param y - 椭圆中心 Y
     * @param radiusX - X 轴半径
     * @param radiusY - Y 轴半径
     * @param rotation - 旋转角度（弧度）
     * @param startAngle - 起始角度（弧度）
     * @param endAngle - 结束角度（弧度）
     * @param counterclockwise - 是否逆时针（默认顺时针）
     */
    ellipse(
        x: number, y: number,
        radiusX: number, radiusY: number,
        rotation: number,
        startAngle: number, endAngle: number,
        counterclockwise = false,
    ): void {

        const {startAngle:startNorm,endAngle:endNorm}=normalizeAngles(startAngle,endAngle,counterclockwise)
       
        const delta = endNorm - startNorm
        const segments = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 2)))
        const segAngle = delta / segments

        const cosRot = Math.cos(rotation)
        const sinRot = Math.sin(rotation)

        let currentAngle = startNorm
        for (let i = 0; i < segments; i++) {
            const segStart = currentAngle
            const segEnd = currentAngle + segAngle

            // 参数化椭圆点，含旋转
            const cosStart = Math.cos(segStart)
            const sinStart = Math.sin(segStart)
            const startX = x + cosRot * radiusX * cosStart - sinRot * radiusY * sinStart
            const startY = y + sinRot * radiusX * cosStart + cosRot * radiusY * sinStart

            if (i === 0) {
                if (this.isEmpty) {
                    this.moveTo(startX, startY)
                } else {
                    this.lineTo(startX, startY)
                }
            }

            // 三次贝塞尔近似椭圆弧段
            const theta = segAngle
            const k = (4 / 3) * Math.tan(theta / 4)

            // 端点沿切线方向偏移，切线方向为旋转后的 (-rx·sin(t), ry·cos(t))
            const tanX1 = -radiusX * sinStart
            const tanY1 = radiusY * cosStart
            const cp1X = startX + k * (cosRot * tanX1 - sinRot * tanY1)
            const cp1Y = startY + k * (sinRot * tanX1 + cosRot * tanY1)

            const cosEnd = Math.cos(segEnd)
            const sinEnd = Math.sin(segEnd)
            const endX = x + cosRot * radiusX * cosEnd - sinRot * radiusY * sinEnd
            const endY = y + sinRot * radiusX * cosEnd + cosRot * radiusY * sinEnd

            const tanX2 = -radiusX * sinEnd
            const tanY2 = radiusY * cosEnd
            const cp2X = endX - k * (cosRot * tanX2 - sinRot * tanY2)
            const cp2Y = endY - k * (sinRot * tanX2 + cosRot * tanY2)

            this.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY)
            currentAngle = segEnd
        }
    }

    /**
     * 添加圆弧连接（arcTo）
     *
     * 从当前点到 (x1, y1) 的线段与 (x1, y1) 到 (x2, y2) 的线段之间，
     * 绘制一个半径为 radius 的圆弧（与两条线段相切）。
     * 如果当前点与 (x1, y1) 不重合，会先画一条 lineTo 到切点。
     *
     * @param x1 - 第一条切线的终点 X
     * @param y1 - 第一条切线的终点 Y
     * @param x2 - 第二条切线的终点 X
     * @param y2 - 第二条切线的终点 Y
     * @param radius - 圆弧半径
     */
    arcTo2(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        if (this.isEmpty) {
            this.moveTo(x1, y1)
            return
        }

        const p0 = this.lastPoint
        const p0x = p0.x
        const p0y = p0.y

        // 向量 p0->p1 和 p1->p2
        const dx1 = x1 - p0x
        const dy1 = y1 - p0y
        const dx2 = x2 - x1
        const dy2 = y2 - y1

        // 计算两条边的长度
        const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)
        const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)

        if (len1 < 1e-10 || len2 < 1e-10 || radius < 1e-10) {
            this.lineTo(x1, y1)
            return
        }

        // 单位方向向量
        const ux1 = dx1 / len1
        const uy1 = dy1 / len1
        const ux2 = dx2 / len2
        const uy2 = dy2 / len2

        // 两条边之间的夹角（0 到 π）
        const cosAngle = ux1 * ux2 + uy1 * uy2
        const sinAngle = ux1 * uy2 - uy1 * ux2

        // 平行或接近平行时，直接 lineTo 到 (x1, y1)
        if (Math.abs(sinAngle) < 1e-10) {
            this.lineTo(x1, y1)
            return
        }

        // 拐角处的内角 = π - 外角（外角是 P0→P1 与 P1→P2 的夹角）
        const interiorAngle = Math.PI - Math.acos(Math.max(-1, Math.min(1, cosAngle)))
        // 拐角到切点的距离
        const d = radius / Math.tan(interiorAngle / 2)

        // 切点位置
        const t1x = x1 - d * ux1
        const t1y = y1 - d * uy1
        const t2x = x1 + d * ux2
        const t2y = y1 + d * uy2

        // 圆心：沿内角平分线方向偏移
        // 内角平分线方向 = u2 - u1（P1→P0 方向 -u1 与 P1→P2 方向 u2 的合方向）
        const bx = -ux1 + ux2
        const by = -uy1 + uy2
        const blen = Math.sqrt(bx * bx + by * by)
        const centerDist = radius / Math.sin(interiorAngle / 2)
        const cx = x1 + (bx / blen) * centerDist
        const cy = y1 + (by / blen) * centerDist

        // 起始角度和结束角度
        const startAngle = Math.atan2(t1y - cy, t1x - cx)
        const endAngle = Math.atan2(t2y - cy, t2x - cx)

        // 先 lineTo 到第一个切点
        this.lineTo(t1x, t1y)

        // 选择较短弧方向
        // arc() 中 delta > 0 为 CCW，delta < 0 为 CW
        // 且 counterclockwise = false 时 delta 归一化为正（CCW），true 时归一化为负（CW）
        let delta = endAngle - startAngle
        // 归一化到 [-π, π] 取较短弧
        if (delta > Math.PI) delta -= Math.PI * 2
        if (delta < -Math.PI) delta += Math.PI * 2

        // delta > 0 → 较短弧为 CCW → counterclockwise = false 使 arc() 走 CCW
        // delta < 0 → 较短弧为 CW  → counterclockwise = true  使 arc() 走 CW
        this.arc(cx, cy, radius, startAngle, startAngle + delta, delta < 0)
    }
    /**
     * 添加圆弧连接（arcTo）
     *
     * 从当前点到 (x1, y1) 的线段与 (x1, y1) 到 (x2, y2) 的线段之间，
     * 绘制一个半径为 radius 的圆弧（与两条线段相切）。
     * 如果当前点与 (x1, y1) 不重合，会先画一条 lineTo 到切点。
     *
     * @param x1 - 第一条切线的终点 X
     * @param y1 - 第一条切线的终点 Y
     * @param x2 - 第二条切线的终点 X
     * @param y2 - 第二条切线的终点 Y
     * @param radius - 圆弧半径
     */
    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        if (this.isEmpty) {
            this.moveTo(x1, y1)
            return
        }

        const p0 = this.lastPoint
        const p0x = p0.x
        const p0y = p0.y

        // 向量 p0->p1 和 p1->p2
        const dx1 = x1 - p0x
        const dy1 = y1 - p0y
        const dx2 = x2 - x1
        const dy2 = y2 - y1

        // 计算两条边的长度
        const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)
        const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)

        if (len1 < 1e-10 || len2 < 1e-10 || radius < 1e-10) {
            this.lineTo(x1, y1)
            return
        }

        // 单位方向向量
        const ux1 = dx1 / len1
        const uy1 = dy1 / len1
        const ux2 = dx2 / len2
        const uy2 = dy2 / len2

        // 两条边之间的夹角（0 到 π）
        const cosAngle = ux1 * ux2 + uy1 * uy2
        const sinAngle = ux1 * uy2 - uy1 * ux2

        // 平行或接近平行时，直接 lineTo 到 (x1, y1)
        if (Math.abs(sinAngle) < 1e-10) {
            this.lineTo(x1, y1)
            return
        }

        // 符号：顺时针为 -1，逆时针为 +1
        const sign = sinAngle > 0 ? 1 : -1
        // 圆心到拐角的距离（沿角平分线方向）
        const d = Math.abs(radius * Math.tan(Math.acos(cosAngle) / 2))

        // 切点位置
        const t1x = x1 - d * ux1
        const t1y = y1 - d * uy1
        const t2x = x1 + d * ux2
        const t2y = y1 + d * uy2

        // 圆心
        // 从切点沿法线方向偏移 radius，法线方向 = 切线方向旋转 90°
        const nx = -uy1
        const ny = ux1
        const cx = t1x + sign * radius * nx
        const cy = t1y + sign * radius * ny

        // 起始角度和结束角度
        const startAngle = Math.atan2(t1y - cy, t1x - cx)
        const endAngle = Math.atan2(t2y - cy, t2x - cx)

        // 先 lineTo 到第一个切点
        this.lineTo(t1x, t1y)

        // 绘制圆弧
        const counterclockwise = sign < 0
        this.arc(cx, cy, radius, startAngle, endAngle, counterclockwise)
    }

    /**
     * 添加圆角矩形路径
     *
     * 支持统一圆角或多个圆角分别指定。
     *
     * @param x - 矩形左上角 X
     * @param y - 矩形左上角 Y
     * @param w - 矩形宽度
     * @param h - 矩形高度
     * @param radii - 圆角半径（支持多种格式）
     *   - number: 所有角统一半径
     *   - [all]: 四个角统一半径 [r]
     *   - [tl, br]: 左上和右下相同，右上和左下相同
     *   - [tl, tr, br, bl]: 分别指定四个角
     */
    roundRect(x: number, y: number, w: number, h: number, radii?: number | number[]): void {
        // 解析圆角参数
        let r = 0
        let r2 = 0
        let r3 = 0
        let r4 = 0

        if (radii === undefined || radii === 0) {
            // 无圆角，就是普通矩形
            this.rect(x, y, w, h)
            return
        }

        if (typeof radii === 'number') {
            r = r2 = r3 = r4 = Math.min(radii, Math.min(w, h) / 2)
        } else {
            const arr = radii
            const len = arr.length
            if (len === 0) {
                this.rect(x, y, w, h)
                return
            }
            const maxR = Math.min(w, h) / 2
            r = Math.min(arr[0], maxR)
            if (len === 1) {
                r2 = r3 = r4 = r
            } else if (len === 2) {
                r2 = Math.min(arr[1], maxR)
                r3 = r
                r4 = r2
            } else if (len === 3) {
                r2 = Math.min(arr[1], maxR)
                r3 = Math.min(arr[2], maxR)
                r4 = r2
            } else {
                r2 = Math.min(arr[1], maxR)
                r3 = Math.min(arr[2], maxR)
                r4 = Math.min(arr[3], maxR)
            }
        }

        // 使用 arcTo 和 lineTo 构建圆角矩形
        this.moveTo(x + r, y)

        // 上边 → 右上角
        this.lineTo(x + w - r2, y)
        if (r2 > 0) this.arcTo(x + w, y, x + w, y + r2, r2)

        // 右边 → 右下角
        this.lineTo(x + w, y + h - r3)
        if (r3 > 0) this.arcTo(x + w, y + h, x + w - r3, y + h, r3)

        // 下边 → 左下角
        this.lineTo(x + r4, y + h)
        if (r4 > 0) this.arcTo(x, y + h, x, y + h - r4, r4)

        // 左边 → 左上角
        this.lineTo(x, y + r)
        if (r > 0) this.arcTo(x, y, x + r, y, r)

        this.close()
    }

    /**
     * 添加 SVG 椭圆弧路径（SVG Arc A/a 命令转换）
     *
     * 将 SVG 弧线的端点参数化（起点+终点+半径+旋转+大弧/扫掠标志）
     * 转换为中心参数化（圆心+半径+起始/终止角度），再委托 ellipse() 绘制。
     *
     * 算法遵循 SVG 规范：
     *   https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
     *
     * @param x1 - 起点 X
     * @param y1 - 起点 Y
     * @param x2 - 终点 X
     * @param y2 - 终点 Y
     * @param rx - X 轴半径
     * @param ry - Y 轴半径
     * @param rotation - 椭圆的旋转角度（弧度）
     * @param largeArcFlag - true=大弧, false=小弧
     * @param sweepFlag - true=顺时针, false=逆时针
     */
    ellipseSvgArc(
        x1: number, y1: number, x2: number, y2: number,
        rx: number, ry: number, rotation: number,
        largeArcFlag: boolean, sweepFlag: boolean,
    ): void {
        // 起点终点重合时跳过
        if (Math.abs(x1 - x2) < 1e-10 && Math.abs(y1 - y2) < 1e-10) return

        // 半轴取绝对值
        rx = Math.abs(rx)
        ry = Math.abs(ry)
        if (rx < 1e-10 || ry < 1e-10) {
            this.lineTo(x2, y2)
            return
        }

        const cosRot = Math.cos(rotation)
        const sinRot = Math.sin(rotation)

        // (1) 变换到未旋转坐标系
        const dx = (x1 - x2) / 2
        const dy = (y1 - y2) / 2
        const x1p = cosRot * dx + sinRot * dy
        const y1p = -sinRot * dx + cosRot * dy

        // (2) 确保半径足够大（缩放半轴）
        const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
        if (lambda > 1) {
            const sqrtLambda = Math.sqrt(lambda)
            rx *= sqrtLambda
            ry *= sqrtLambda
        }

        // (3) 计算未旋转坐标系下的圆心 (cxp, cyp)
        const rx2 = rx * rx
        const ry2 = ry * ry
        const x1p2 = x1p * x1p
        const y1p2 = y1p * y1p
        const sqrtArg = Math.max(0,
            (rx2 * ry2 - rx2 * y1p2 - ry2 * x1p2) / (rx2 * y1p2 + ry2 * x1p2),
        )
        const sign = largeArcFlag !== sweepFlag ? 1 : -1
        const sqrtVal = Math.sqrt(sqrtArg)
        const cxp = sign * sqrtVal * (rx * y1p / ry)
        const cyp = sign * sqrtVal * (-ry * x1p / rx)

        // (4) 变换回原始坐标系得到 (cx, cy)
        const cx = cosRot * cxp - sinRot * cyp + (x1 + x2) / 2
        const cy = sinRot * cxp + cosRot * cyp + (y1 + y2) / 2

        // (5) 计算起止角度（在未旋转椭圆坐标系下，除以半轴做归一化）
        const ux = (x1p - cxp) / rx
        const uy = (y1p - cyp) / ry
        const vx = (-x1p - cxp) / rx
        const vy = (-y1p - cyp) / ry
        const startAngle = Math.atan2(uy, ux)
        const endAngle = Math.atan2(vy, vx)

        // SVG sweepFlag=1 表示顺时针，对应 ellipse() 的 counterclockwise=false
        this.ellipse(cx, cy, rx, ry, rotation, startAngle, endAngle, !sweepFlag)
    }

    close() {
        if (!this.isEmpty) {
            if (this.lastVerb !== PathVerb.Close) {
                this.verbs.push(PathVerb.Close)
            }
            this.needMoveTo = true
        }
    }
    contains(px: number, py: number): boolean {
        let wind = 0
        this.visit({
            lineTo: (lastX, lastY, x, y) => {
                wind += windLine(px, py, lastX, lastY, x, y)
            },
            quadraticCurveTo: (lastX, lastY, cpX, cpY, x, y) => {
                wind += new QuadraticBezier([
                    { x: lastX, y: lastY },
                    { x: cpX, y: cpY },
                    { x, y },
                ]).windPoint(px, py)
            },
            cubicCurveTo: (lastX, lastY, cpX1, cpY1, cpX2, cpY2, x, y) => {
                wind += new CubicBezier([
                    { x: lastX, y: lastY },
                    { x: cpX1, y: cpY1 },
                    { x: cpX2, y: cpY2 },
                    { x, y },
                ]).windPoint(px, py)
            },
            close: (lastX, lastY) => {
                if (lastX !== this.lastMovePoint.x || lastY !== this.lastMovePoint.y) {

                    wind += windLine(px, py, lastX, lastY, this.lastMovePoint.x, this.lastMovePoint.y)
                }
            },
        })
        return wind !== 0
    }
    forEach(callback: (verb: PathVerb, index: number, points: IPoint[]) => void) {
        let start = 0, end = 0
        this.verbs.forEach((verb, index) => {
            const len = PathVerbCount[verb]
            start = end
            end = start + len
            callback(verb, index, this.points.slice(verb === PathVerb.MoveTo ? start : start - 1, end))
        })
    }
    visit(obj: {
        moveTo?: (x: number, y: number) => void
        lineTo?: (lastX: number, lastY: number, x: number, y: number) => void
        quadraticCurveTo?: (lastX: number, lastY: number, cpX: number, cpY: number, x: number, y: number) => void
        cubicCurveTo?: (lastX: number, lastY: number, cpX1: number, cpY1: number, cpX2: number, cpY2: number, x: number, y: number) => void
        close?: (lastX: number, lastY: number) => void
    }) {
        this.forEach((verb, index, points) => {
            switch (verb) {
                case PathVerb.MoveTo:
                    obj.moveTo?.(points[0].x, points[0].y)
                    break
                case PathVerb.LineTo:
                    obj.lineTo?.(points[0].x, points[0].y, points[1].x, points[1].y)
                    break
                case PathVerb.QuadraticTo:
                    obj.quadraticCurveTo?.(points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y)
                    break
                case PathVerb.CubicTo:
                    obj.cubicCurveTo?.(points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y)
                    break
                case PathVerb.Close:
                    obj.close?.(points[0].x, points[0].y)
                    break
            }
        })
    }
    toCanvasPath2D() {
        const path = new window.Path2D()
        this.forEach((verb, index, points) => {
            switch (verb) {
                case PathVerb.MoveTo:
                    path.moveTo(points[0].x, points[0].y)
                    break
                case PathVerb.LineTo:
                    path.lineTo(points[1].x, points[1].y)
                    break
                case PathVerb.QuadraticTo:
                    path.quadraticCurveTo(points[1].x, points[1].y, points[2].x, points[2].y)
                    break
                case PathVerb.CubicTo:
                    path.bezierCurveTo(points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y)
                    break
                case PathVerb.Close:
                    path.closePath()
                    break
            }
        })
        return path
    }

    /**
     * 计算路径的包围盒
     * @returns { minX, minY, maxX, maxY } 包围盒，路径为空时返回 null
     */
    getBounds(): { minX: number; minY: number; maxX: number; maxY: number } | null {
        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        let hasPoints = false

        const update = (x: number, y: number) => {
            minX = Math.min(minX, x)
            minY = Math.min(minY, y)
            maxX = Math.max(maxX, x)
            maxY = Math.max(maxY, y)
            hasPoints = true
        }

        this.visit({
            moveTo: (x, y) => update(x, y),
            lineTo: (lastX, lastY, x, y) => {
                update(lastX, lastY)
                update(x, y)
            },
            quadraticCurveTo: (lastX, lastY, cpX, cpY, x, y) => {
                const bounds = new QuadraticBezier([{ x: lastX, y: lastY }, { x: cpX, y: cpY }, { x, y }]).getBounds()
                update(bounds.minX, bounds.minY)
                update(bounds.maxX, bounds.maxY)
            },
            cubicCurveTo: (lastX, lastY, cpX1, cpY1, cpX2, cpY2, x, y) => {
                const bounds = new CubicBezier([
                    { x: lastX, y: lastY }, { x: cpX1, y: cpY1 }, { x: cpX2, y: cpY2 }, { x, y },
                ]).getBounds()
                update(bounds.minX, bounds.minY)
                update(bounds.maxX, bounds.maxY)
            },
            close: (lastX, lastY) => update(lastX, lastY),
        })

        return hasPoints ? { minX, minY, maxX, maxY } : null
    }
}
