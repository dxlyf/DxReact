
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
export class QuadraticBezier {
    points: IPoint[]
    constructor(points: IPoint[]) {
        this.points = points
    }
    get p0() {
        return this.points[0]
    }
    get p1() {
        return this.points[1]
    }
    get p2() {
        return this.points[2]
    }
    // 计算贝塞尔曲线上的点
    evaluate(t: number) {
        return new Point(
            this.p0.x * (1 - t) * (1 - t) + this.p1.x * t * (1 - t) + this.p2.x * t * t,
            this.p0.y * (1 - t) * (1 - t) + this.p1.y * t * (1 - t) + this.p2.y * t * t
        )
    }
    // 获取极值的根（t值）
    getExtremaRoots(): number[] {
        const roots: number[] = [];
        // 二次贝塞尔曲线的导数为线性，极值点在导数为零处
        // B(t) = (1-t)^2 * P0 + 2t(1-t) * P1 + t^2 * P2
        // B'(t) = 2(1-t)(P1-P0) + 2t(P2-P1) = 2[(P1-P0) + t(P0 - 2P1 + P2)]
        // 令 B'(t) = 0，解得 t = (P0 - P1) / (P0 - 2P1 + P2)

        const ax = this.p0.x - 2 * this.p1.x + this.p2.x;
        const bx = this.p1.x - this.p0.x;
        if (ax !== 0) {
            const tx = bx / ax;
            if (tx > 0 && tx < 1) {
                roots.push(tx);
            }
        }

        const ay = this.p0.y - 2 * this.p1.y + this.p2.y;
        const by = this.p1.y - this.p0.y;
        if (ay !== 0) {
            const ty = by / ay;
            if (ty > 0 && ty < 1 && !roots.includes(ty)) {
                roots.push(ty);
            }
        }

        return roots.sort((a, b) => a - b);
    }

    // 获取边界框
    getBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
        const extrema = this.getExtremaRoots();
        const points: IPoint[] = [this.p0, this.p2];

        // 添加极值点
        for (const t of extrema) {
            points.push(this.evaluate(t));
        }

        let minX = points[0].x;
        let minY = points[0].y;
        let maxX = points[0].x;
        let maxY = points[0].y;

        for (const p of points) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }

        return { minX, minY, maxX, maxY };
    }

    /**
     * 计算点相对于二次贝塞尔曲线的绕数（用于点包含测试）
     * 从点 (px, py) 向右发射水平射线，统计曲线从上往下/从下往上穿过射线右侧的次数
     * @returns +1（从下往上穿过）、-1（从上往下穿过）、0（不相交）
     */
    windPoint(px: number, py: number): number {
        const { p0, p1, p2 } = this

        const minY = Math.min(p0.y, p2.y)
        const maxY = Math.max(p0.y, p2.y)
        if (py < minY || py > maxY) return 0

        // y(t) = (1-t)²·y0 + 2t(1-t)·y1 + t²·y2
        // 整理得：ay·t² + by·t + cy = 0
        // ay = y0 - 2y1 + y2, by = 2(y1 - y0), cy = y0 - py
        const ay = p0.y - 2 * p1.y + p2.y
        const by = 2 * (p1.y - p0.y)
        const cy = p0.y - py

        const roots = solveQuadratic(ay, by, cy)
        let wind = 0

        for (const t of roots) {
            if (t <= 0 || t >= 1) continue

            // x(t) = (1-t)²·x0 + 2t(1-t)·x1 + t²·x2
            const mt = 1 - t
            const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x
            if (x < px) continue // 在射线左侧

            // dy/dt = 2·ay·t + by
            const dy = 2 * ay * t + by
            if (dy > 0) wind += 1      // 从下往上穿过
            else if (dy < 0) wind -= 1 // 从上往下穿过
        }

        return wind
    }

    /**
     * 在参数 t 处分割二次贝塞尔曲线
     * @param t - 分割参数 [0, 1]
     * @returns [左半曲线, 右半曲线]
     */
    split(t: number): [QuadraticBezier, QuadraticBezier] {
        const { p0, p1, p2 } = this
        const mt = 1 - t

        // 德卡斯特里奥（De Casteljau）算法
        const a = { x: mt * p0.x + t * p1.x, y: mt * p0.y + t * p1.y }
        const b = { x: mt * p1.x + t * p2.x, y: mt * p1.y + t * p2.y }
        const c = { x: mt * a.x + t * b.x, y: mt * a.y + t * b.y }

        return [
            new QuadraticBezier([p0, a, c]),
            new QuadraticBezier([c, b, p2]),
        ]
    }

    /**
     * 将二次贝塞尔曲线扁平化为线段序列
     * @param epsilon - 近似误差容限（默认 0.5）
     * @returns IPoint[] 点序列（包含起点和终点）
     */
    flatten(epsilon = 0.5): IPoint[] {
        const points: IPoint[] = [this.p0]

        const recursive = (p0: IPoint, p1: IPoint, p2: IPoint) => {
            // 判断曲线是否足够平坦：控制点到弦的距离 < epsilon
            const vx = p2.x - p0.x
            const vy = p2.y - p0.y
            const len2 = vx * vx + vy * vy
            if (len2 > 0) {
                const t = ((p1.x - p0.x) * vx + (p1.y - p0.y) * vy) / len2
                const tClamped = Math.max(0, Math.min(1, t))
                const px = p0.x + tClamped * vx
                const py = p0.y + tClamped * vy
                const dx = p1.x - px
                const dy = p1.y - py
                if (dx * dx + dy * dy < epsilon * epsilon) {
                    points.push(p2)
                    return
                }
            }

            // 在 t=0.5 处分割并递归
            const mt = 0.5
            const a = { x: (p0.x + p1.x) * mt, y: (p0.y + p1.y) * mt }
            const b = { x: (p1.x + p2.x) * mt, y: (p1.y + p2.y) * mt }
            const c = { x: (a.x + b.x) * mt, y: (a.y + b.y) * mt }

            recursive(p0, a, c)
            recursive(c, b, p2)
        }

        recursive(this.p0, this.p1, this.p2)
        return points
    }

    /**
     * 计算点到二次贝塞尔曲线的最小距离
     * @param px - 点 X
     * @param py - 点 Y
     * @returns 点到曲线的最小距离
     */
    distanceTo(px: number, py: number): number {
        const { p0, p1, p2 } = this

        // Q(t) = A·t² + B·t + C
        // A = P0 - 2P1 + P2, B = 2(P1 - P0), C = P0
        const ax = p0.x - 2 * p1.x + p2.x
        const ay = p0.y - 2 * p1.y + p2.y
        const bx = 2 * (p1.x - p0.x)
        const by = 2 * (p1.y - p0.y)
        const cx = p0.x - px
        const cy = p0.y - py

        // 最小化 |Q(t) - P|² → 求导得三次方程
        // (2A·A)t³ + (3A·B)t² + (2A·C + B·B)t + B·C = 0
        const a = 2 * (ax * ax + ay * ay)
        const b = 3 * (ax * bx + ay * by)
        const c = 2 * (ax * cx + ay * cy) + (bx * bx + by * by)
        const d = bx * cx + by * cy

        // 提取实根并加入端点候选
        const candidates = solveCubicByCardano(a, b, c, d)
        candidates.push(0, 1)

        let minDist2 = Infinity
        for (const t of candidates) {
            if (t < 0 || t > 1) continue
            const mt = 1 - t
            const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x
            const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
            const dx = x - px, dy = y - py
            const d2 = dx * dx + dy * dy
            if (d2 < minDist2) minDist2 = d2
        }

        return Math.sqrt(minDist2)
    }
}
export class CubicBezier {
    points: IPoint[]
    constructor(points: IPoint[]) {
        this.points = points
    }
    get p0() {
        return this.points[0]
    }
    get p1() {
        return this.points[1]
    }
    get p2() {
        return this.points[2]
    }
    get p3() {
        return this.points[3]
    }
    // 计算贝塞尔曲线上的点
    evaluate(t: number) {
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        const t2 = t * t;
        const t3 = t2 * t;
        return new Point(
            mt3 * this.p0.x + 3 * mt2 * t * this.p1.x + 3 * mt * t2 * this.p2.x + t3 * this.p3.x,
            mt3 * this.p0.y + 3 * mt2 * t * this.p1.y + 3 * mt * t2 * this.p2.y + t3 * this.p3.y
        );
    }

    // 获取极值的根（t值）
    getExtremaRoots(): number[] {
        const roots: number[] = [];

        // 三次贝塞尔曲线的导数为二次
        // B(t) = (1-t)^3 * P0 + 3t(1-t)^2 * P1 + 3t^2(1-t) * P2 + t^3 * P3
        // B'(t) = 3(1-t)^2(P1-P0) + 6t(1-t)(P2-P1) + 3t^2(P3-P2)
        // 整理得：3[(P0-3P1+3P2-P3)t^2 + 2(-P0+2P1-P2)t + (P1-P0)] = 0

        const ax = 3 * (-this.p0.x + 3 * this.p1.x - 3 * this.p2.x + this.p3.x);
        const bx = 6 * (this.p0.x - 2 * this.p1.x + this.p2.x);
        const cx = 3 * (this.p1.x - this.p0.x);

        const xRoots = solveQuadratic(ax, bx, cx);
        for (const t of xRoots) {
            if (t > 0 && t < 1) {
                roots.push(t);
            }
        }

        const ay = 3 * (-this.p0.y + 3 * this.p1.y - 3 * this.p2.y + this.p3.y);
        const by = 6 * (this.p0.y - 2 * this.p1.y + this.p2.y);
        const cy = 3 * (this.p1.y - this.p0.y);

        const yRoots = solveQuadratic(ay, by, cy);
        for (const t of yRoots) {
            if (t > 0 && t < 1 && !roots.includes(t)) {
                roots.push(t);
            }
        }

        return roots.sort((a, b) => a - b);
    }

    // 获取边界框
    getBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
        const extrema = this.getExtremaRoots();
        const points: IPoint[] = [this.p0, this.p3];

        // 添加极值点
        for (const t of extrema) {
            points.push(this.evaluate(t));
        }

        let minX = points[0].x;
        let minY = points[0].y;
        let maxX = points[0].x;
        let maxY = points[0].y;

        for (const p of points) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }

        return { minX, minY, maxX, maxY };
    }

    /**
     * 计算点相对于三次贝塞尔曲线的绕数（用于点包含测试）
     * 从点 (px, py) 向右发射水平射线，统计曲线从上往下/从下往上穿过射线右侧的次数
     * @returns +1（从下往上穿过）、-1（从上往下穿过）、0（不相交）
     */
    windPoint(px: number, py: number): number {
        const { p0, p1, p2, p3 } = this

        const minY = Math.min(p0.y, p3.y)
        const maxY = Math.max(p0.y, p3.y)
        if (py < minY || py > maxY) return 0

        // y(t) = (1-t)³·y0 + 3t(1-t)²·y1 + 3t²(1-t)·y2 + t³·y3
        // 整理得：ay·t³ + by·t² + cy·t + dy = 0
        // ay = y3 - 3y2 + 3y1 - y0
        // by = 3(y2 - 2y1 + y0)
        // cy = 3(y1 - y0)
        // dy = y0 - py
        const cay = p3.y - 3 * p2.y + 3 * p1.y - p0.y
        const cby = 3 * (p2.y - 2 * p1.y + p0.y)
        const ccy = 3 * (p1.y - p0.y)
        const cdy = p0.y - py

        const roots = solveCubicByCardano(cay, cby, ccy, cdy)
        let wind = 0

        for (const t of roots) {
            if (t <= 0 || t >= 1) continue

            const mt = 1 - t
            const mt2 = mt * mt
            const mt3 = mt2 * mt
            const t2 = t * t
            const t3 = t2 * t
            const x = mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x
            if (x < px) continue

            // dy/dt = 3·ay·t² + 2·by·t + cy
            const dydt = 3 * cay * t2 + 2 * cby * t + ccy
            if (dydt > 0) wind += 1
            else if (dydt < 0) wind -= 1
        }

        return wind
    }

    /**
     * 在参数 t 处分割三次贝塞尔曲线
     * @param t - 分割参数 [0, 1]
     * @returns [左半曲线, 右半曲线]
     */
    split(t: number): [CubicBezier, CubicBezier] {
        const { p0, p1, p2, p3 } = this
        const mt = 1 - t

        // 德卡斯特里奥（De Casteljau）算法
        const a = { x: mt * p0.x + t * p1.x, y: mt * p0.y + t * p1.y }
        const b = { x: mt * p1.x + t * p2.x, y: mt * p1.y + t * p2.y }
        const c = { x: mt * p2.x + t * p3.x, y: mt * p2.y + t * p3.y }
        const d = { x: mt * a.x + t * b.x, y: mt * a.y + t * b.y }
        const e = { x: mt * b.x + t * c.x, y: mt * b.y + t * c.y }
        const f = { x: mt * d.x + t * e.x, y: mt * d.y + t * e.y }

        return [
            new CubicBezier([p0, a, d, f]),
            new CubicBezier([f, e, c, p3]),
        ]
    }

    /**
     * 将三次贝塞尔曲线扁平化为线段序列
     * @param epsilon - 近似误差容限（默认 0.5）
     * @returns IPoint[] 点序列（包含起点和终点）
     */
    flatten(epsilon = 0.5): IPoint[] {
        const points: IPoint[] = [this.p0]

        const recursive = (p0: IPoint, p1: IPoint, p2: IPoint, p3: IPoint) => {
            // 判断曲线是否足够平坦：弦与中间控制点的最大距离 < epsilon
            const dx = p3.x - p0.x
            const dy = p3.y - p0.y
            const len2 = dx * dx + dy * dy

            if (len2 > 0) {
                // 控制点到弦的距离近似
                const d1 = Math.abs((p1.x - p3.x) * dy - (p1.y - p3.y) * dx) / Math.sqrt(len2)
                const d2 = Math.abs((p2.x - p3.x) * dy - (p2.y - p3.y) * dx) / Math.sqrt(len2)
                if (d1 <= epsilon && d2 <= epsilon) {
                    points.push(p3)
                    return
                }
            }

            // 在 t=0.5 处分割并递归
            const mt = 0.5
            const a = { x: (p0.x + p1.x) * mt, y: (p0.y + p1.y) * mt }
            const b = { x: (p1.x + p2.x) * mt, y: (p1.y + p2.y) * mt }
            const c = { x: (p2.x + p3.x) * mt, y: (p2.y + p3.y) * mt }
            const d = { x: (a.x + b.x) * mt, y: (a.y + b.y) * mt }
            const e = { x: (b.x + c.x) * mt, y: (b.y + c.y) * mt }
            const f = { x: (d.x + e.x) * mt, y: (d.y + e.y) * mt }

            recursive(p0, a, d, f)
            recursive(f, e, c, p3)
        }

        recursive(this.p0, this.p1, this.p2, this.p3)
        return points
    }

    /**
     * 计算点到三次贝塞尔曲线的最小距离
     *
     * 三次贝塞尔的最小距离问题导数为五次方程，无解析解。
     * 采用采样 + Newton 迭代逼近：
     *   1. 均匀采样 N 个点，取最近点的 t 值
     *   2. 在该 t 附近用 Newton 法迭代求精
     *
     * @param px - 点 X
     * @param py - 点 Y
     * @param samples - 采样点数（默认 12）
     * @param iterations - Newton 迭代次数（默认 8）
     * @returns 点到曲线的最小距离
     */
    distanceTo(px: number, py: number, samples = 12, iterations = 8): number {
        const { p0, p1, p2, p3 } = this

        // 系数表示：C(t) = a·t³ + b·t² + c·t + d
        const ax = -p0.x + 3 * p1.x - 3 * p2.x + p3.x
        const ay = -p0.y + 3 * p1.y - 3 * p2.y + p3.y
        const bx = 3 * p0.x - 6 * p1.x + 3 * p2.x
        const by = 3 * p0.y - 6 * p1.y + 3 * p2.y
        const cx = -3 * p0.x + 3 * p1.x
        const cy = -3 * p0.y + 3 * p1.y
        const dx = p0.x - px
        const dy = p0.y - py

        // C'(t) = 3a·t² + 2b·t + c
        const ddx = 3 * ax, ddy = 3 * ay
        const ddx2 = ddx * 2, ddy2 = ddy * 2
        // C''(t) = 6a·t + 2b
        const nddx = 6 * ax, nddy = 6 * ay
        const nddx2 = 2 * bx * 2, nddy2 = 2 * by * 2

        // 粗采样找最佳初始 t
        let bestT = 0
        let minDist2 = Infinity

        for (let i = 0; i <= samples; i++) {
            const t = i / samples
            const mt = 1 - t
            const mt2 = mt * mt
            const mt3 = mt2 * mt
            const t2 = t * t
            const t3 = t2 * t
            const x = mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x - px
            const y = mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y - py
            const d2 = x * x + y * y
            if (d2 < minDist2) {
                minDist2 = d2
                bestT = t
            }
        }

        // Newton 迭代：f(t) = (C(t)-P)·C'(t) = 0
        // t_{n+1} = t - f(t) / f'(t)
        // f'(t) = C'(t)·C'(t) + (C(t)-P)·C''(t)
        let t = bestT

        for (let i = 0; i < iterations; i++) {
            // C(t) - P
            const mt = 1 - t
            const mt2 = mt * mt
            const mt3 = mt2 * mt
            const t2 = t * t
            const t3 = t2 * t
            const fx = mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x - px
            const fy = mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y - py

            // C'(t)
            const ddx_t = ddx * t2 + ddx2 * t + cx
            const ddy_t = ddy * t2 + ddy2 * t + cy

            // C''(t)
            const nddx_t = nddx * t + nddx2
            const nddy_t = nddy * t + nddy2

            // f(t) = (C-P)·C'
            const ft = fx * ddx_t + fy * ddy_t
            // f'(t) = C'·C' + (C-P)·C''
            const ft2 = ddx_t * ddx_t + ddy_t * ddy_t + fx * nddx_t + fy * nddy_t

            if (Math.abs(ft2) < 1e-15) break
            t = t - ft / ft2
            t = Math.max(0, Math.min(1, t))
        }

        // 用最终 t 计算距离
        {
            const mt = 1 - t
            const x = mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x - px
            const y = mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y - py
            const d2 = x * x + y * y
            if (d2 < minDist2) minDist2 = d2
        }

        // 检查端点
        const d0x = p0.x - px, d0y = p0.y - py
        const d3x = p3.x - px, d3y = p3.y - py
        minDist2 = Math.min(minDist2, d0x * d0x + d0y * d0y, d3x * d3x + d3y * d3y)

        return Math.sqrt(minDist2)
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
    ensureMove() {
        if (this.needMoveTo) {
            if (this.isEmpty) {
                this.moveTo(0, 0)
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

const _EPS = 1e-10

/**
 * 判断浮点数是否接近零
 */
function isNearZero(v: number, eps = _EPS): boolean {
    return Math.abs(v) < eps
}

/**
 * 求解一元二次方程 ax² + bx + c = 0（a ≠ 0）
 * @param a - 二次项系数
 * @param b - 一次项系数
 * @param c - 常数项
 * @returns 实根数组（可能 0、1、2 个根）
 */
export function solveQuadratic(a: number, b: number, c: number): number[] {
    if (isNearZero(a)) {
        if (isNearZero(b)) return []
        return [-c / b]
    }

    const delta = b * b - 4 * a * c

    if (delta < -_EPS) return []

    if (isNearZero(delta)) {
        return [-b / (2 * a)]
    }

    const sqrtDelta = Math.sqrt(delta)
    return [(-b - sqrtDelta) / (2 * a), (-b + sqrtDelta) / (2 * a)]
}

/**
 * 卡尔丹公式求解一元三次方程 ax³ + bx² + cx + d = 0（a ≠ 0）
 *
 * 令 x = y - b/(3a)，化为缺项三次方程 y³ + py + q = 0
 * 判别式 Δ = (q/2)² + (p/3)³
 *
 * @param a - 三次项系数
 * @param b - 二次项系数
 * @param c - 一次项系数
 * @param d - 常数项
 * @returns 实根数组（可能 1、2、3 个根）
 */
export function solveCubicByCardano(a: number, b: number, c: number, d: number): number[] {
    if (isNearZero(a)) return solveQuadratic(b, c, d)

    // 除以 a，化为首一三次方程
    const A = b / a
    const B = c / a
    const C = d / a

    // 令 x = y - A/3
    const p = B - A * A / 3
    const q = C - A * B / 3 + 2 * A * A * A / 27

    const offset = -A / 3

    // 判别式
    const delta = (q / 2) * (q / 2) + (p / 3) * (p / 3) * (p / 3)

    const roots: number[] = []

    if (delta > _EPS) {
        // 一个实根
        const sqrtDelta = Math.sqrt(delta)
        const u = Math.cbrt(-q / 2 + sqrtDelta)
        const v = Math.cbrt(-q / 2 - sqrtDelta)
        roots.push(u + v + offset)
    } else if (isNearZero(delta)) {
        // 两个实根（一个单根和一个重根）
        const u = Math.cbrt(-q / 2)
        roots.push(2 * u + offset)
        roots.push(-u + offset)
    } else {
        // 三个实根（用三角函数法）
        const r = Math.sqrt(-(p / 3) * (p / 3) * (p / 3))
        const theta = Math.acos(-q / (2 * r))
        const sqrtP = Math.sqrt(-p / 3)
        for (let k = 0; k < 3; k++) {
            roots.push(2 * sqrtP * Math.cos((theta + 2 * Math.PI * k) / 3) + offset)
        }
    }

    return roots.sort((a, b) => a - b)
}

/**
 * 盛金公式求解一元三次方程 ax³ + bx² + cx + d = 0（a ≠ 0）
 *
 * A = b² - 3ac
 * B = bc - 9ad
 * C = c² - 3bd
 * Δ = B² - 4AC
 *
 * @param a - 三次项系数
 * @param b - 二次项系数
 * @param c - 一次项系数
 * @param d - 常数项
 * @returns 实根数组（可能 1、2、3 个根）
 */
export function solveCubicByShengjin(a: number, b: number, c: number, d: number): number[] {
    if (isNearZero(a)) return solveQuadratic(b, c, d)

    const A = b * b - 3 * a * c
    const B = b * c - 9 * a * d
    const C = c * c - 3 * b * d
    const delta = B * B - 4 * A * C

    if (isNearZero(A) && isNearZero(B)) {
        // 三重根
        return [-b / (3 * a)]
    }

    if (delta > _EPS) {
        // 一个实根
        const y1 = A * b + 3 * a * ((-B + Math.sqrt(delta)) / 2)
        const y2 = A * b + 3 * a * ((-B - Math.sqrt(delta)) / 2)
        const x = (-b - (Math.cbrt(y1) + Math.cbrt(y2))) / (3 * a)
        return [x]
    }

    if (isNearZero(delta)) {
        // 两个实根（一个单根和一个重根）
        const K = B / A
        const x1 = -b / a + K
        const x2 = -K / 2
        return [x1, x2].sort((a, b) => a - b)
    }

    // 三个实根（Δ < 0）
    const T = (2 * A * b - 3 * a * B) / (2 * Math.sqrt(A * A * A))
    const theta = Math.acos(T)
    const sqrtA = Math.sqrt(A)
    const roots: number[] = []
    for (let k = 0; k < 3; k++) {
        const x = (-b - 2 * sqrtA * Math.cos((theta + 2 * Math.PI * k) / 3)) / (3 * a)
        roots.push(x)
    }
    return roots.sort((a, b) => a - b)
}