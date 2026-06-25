import {type PointLike,Point} from './Point'


export class CubicBezier {
    points: PointLike[]
    constructor(points: PointLike[]) {
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

        const minY = Math.min(p0.y, p1.y, p2.y, p3.y)
        const maxY = Math.max(p0.y, p1.y, p2.y, p3.y)
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