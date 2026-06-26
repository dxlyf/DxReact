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

        const minY = Math.min(p0.y,p1.y, p2.y)
        const maxY = Math.max(p0.y,p1.y, p2.y)
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
