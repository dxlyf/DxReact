import { PathBuilder } from './PathBuilder'
import { Vector2 } from './Vector2'
import * as MathUtils from '../utils/MathUtils'

export type StrokeCap = 'butt' | 'round' | 'square'
export type StrokeJoin = 'miter' | 'round' | 'bevel'

export interface StrokeOptions {
    /** 线宽 */
    width: number
    /** 端帽样式 */
    cap?: StrokeCap
    /** 连接样式 */
    join?: StrokeJoin
    /** 斜接限制（仅 miter join） */
    miterLimit?: number
    /** 虚线模式（如 [10, 5]），空数组表示实线 */
    dash?: number[]
    /** 虚线偏移 */
    dashOffset?: number
}

/** 轮廓段：直线或圆弧 */
type ContourSeg =
    | { type: 'line'; x: number; y: number }
    | { type: 'arc'; x: number; y: number; radius: number; start: number; end: number; ccw: boolean }

interface SubPath {
    points: Vector2[]
    closed: boolean
}

/**
 * 路径描边器
 *
 * 根据 StrokeOptions 和 PathBuilder 路径数据，生成新的描边 PathBuilder 路径。
 *
 * 算法：
 * 1. 将路径扁平化为折线子路径（贝塞尔/圆弧已采样）
 * 2. 按虚线模式切分（可选）
 * 3. 对每个子路径沿法线方向偏移生成左右轮廓
 * 4. 处理 join（miter/round/bevel）与端点 cap（butt/round/square）
 * 5. 输出为新的闭合 PathBuilder 路径，可直接 fill 渲染
 */
export class PathStroker {
    private readonly options: Required<StrokeOptions>

    constructor(options: StrokeOptions) {
        if (options.width < 0) throw new Error('线宽不能为负数')
        this.options = {
            width: options.width,
            cap: options.cap ?? 'butt',
            join: options.join ?? 'miter',
            miterLimit: options.miterLimit ?? 4,
            dash: options.dash ?? [],
            dashOffset: options.dashOffset ?? 0,
        }
    }

    /**
     * 生成描边路径
     * @param source 源路径
     * @returns 新的 PathBuilder（闭合轮廓，可直接 fill 渲染为描边）
     */
    stroke(source: PathBuilder): PathBuilder {
        if (this.options.width === 0 || source.isEmpty) return new PathBuilder()
        const result = new PathBuilder()
        for (const sub of this.extractSubpaths(source)) {
            const segments = this.applyDash(sub)
            for (const seg of segments) {
                if (seg.visible && seg.points.length >= 2) {
                    this.strokeSegment(result, seg.points, seg.closed)
                }
            }
        }
        return result
    }

    private get half(): number {
        return this.options.width / 2
    }

    // ---- 子路径提取 ----

    private extractSubpaths(source: PathBuilder): SubPath[] {
        // 复用 PathBuilder 的子路径扁平化（处理了所有指令类型）
        return source.getSubpaths()
    }

    // ---- 虚线切分 ----

    private applyDash(sub: SubPath): Array<{ points: Vector2[]; closed: boolean; visible: boolean }> {
        const dash = this.options.dash
        if (dash.length === 0 || dash.every((d) => d <= 0)) {
            return [{ points: sub.points, closed: sub.closed, visible: true }]
        }
        const points = sub.points
        if (points.length < 2) return []

        // 计算各段长度与总长
        const segLens: number[] = []
        let total = 0
        for (let i = 0; i < points.length - 1; i++) {
            const len = points[i].distanceTo(points[i + 1])
            segLens.push(len)
            total += len
        }
        if (sub.closed && points.length > 2) {
            const len = points[points.length - 1].distanceTo(points[0])
            segLens.push(len)
            total += len
        }
        if (total === 0) return []

        const pattern = dash.length % 2 === 1 ? [...dash, ...dash] : dash
        const period = pattern.reduce((a, b) => a + b, 0) || 1

        // 生成可见区间（沿路径弧长）
        const visibleRanges: Array<[number, number]> = []
        let pos = -((this.options.dashOffset % period) + period) % period
        while (pos < total) {
            let drew = false
            for (let i = 0; i < pattern.length; i += 2) {
                const dashLen = pattern[i]
                const gapLen = pattern[i + 1] ?? 0
                if (pos >= total) break
                const end = Math.min(pos + dashLen, total)
                if (end > pos) visibleRanges.push([pos, end])
                drew = true
                pos = end + gapLen
            }
            if (!drew) break
        }

        const toPoint = (dist: number): Vector2 => {
            for (let i = 0; i < segLens.length; i++) {
                if (dist <= segLens[i] || i === segLens.length - 1) {
                    const frac = segLens[i] === 0 ? 0 : dist / segLens[i]
                    const a = points[i]
                    const b = sub.closed && i === segLens.length - 1 ? points[0] : points[i + 1]
                    return a.clone().lerp(b, MathUtils.clamp(frac, 0, 1))
                }
                dist -= segLens[i]
            }
            return points[points.length - 1].clone()
        }

        const result: Array<{ points: Vector2[]; closed: boolean; visible: boolean }> = []
        for (const [start, end] of visibleRanges) {
            const count = Math.max(2, Math.ceil(((end - start) / total) * 96))
            const pts: Vector2[] = []
            for (let i = 0; i <= count; i++) {
                pts.push(toPoint(start + (end - start) * (i / count)))
            }
            result.push({ points: pts, closed: false, visible: true })
        }
        return result
    }

    // ---- 单段描边 ----

    private strokeSegment(result: PathBuilder, points: Vector2[], closed: boolean): void {
        const half = this.half
        const n = points.length
        if (n < 2) return

        // 每条边：方向与法线（法线取左侧：(-dy, dx)）
        const norms: Vector2[] = []
        for (let i = 0; i < n; i++) {
            const a = points[i]
            const b = closed ? points[(i + 1) % n] : i < n - 1 ? points[i + 1] : null
            if (!b) break
            norms.push(b.clone().subtract(a).perpendicular().normalize())
        }

        const segs: ContourSeg[] = []

        if (closed) {
            // 闭合路径：单一闭合轮廓，沿左法线侧偏移
            // 顶点 i 的进入点 A_i = p[i] + n[i-1]*half，离开点 D_i = p[i] + n[i]*half
            // join 段把 A_i 连接到 A_{i+1}(=D_i)
            result.moveTo(points[0].x + norms[n - 1].x * half, points[0].y + norms[n - 1].y * half)
            for (let i = 0; i < n; i++) {
                const nIn = norms[(i - 1 + n) % n]
                const nOut = norms[i]
                result.lineTo(points[i].x + nIn.x * half, points[i].y + nIn.y * half)
                this.appendJoin(segs, points[i], nIn, nOut, half)
                for (const s of segs) this.appendContour(result, s)
                segs.length = 0
            }
            result.closePath()
            return
        }

        // 开放路径：左轮廓（正向）→ 终点 cap → 右轮廓（反向）→ 起点 cap
        // 左轮廓（外侧，法线正方向）
        result.moveTo(points[0].x + norms[0].x * half, points[0].y + norms[0].y * half)
        for (let i = 1; i < n - 1; i++) {
            // 顶点 i 进入点 A_i = p[i] + n[i-1]*half
            result.lineTo(points[i].x + norms[i - 1].x * half, points[i].y + norms[i - 1].y * half)
            this.appendJoin(segs, points[i], norms[i - 1], norms[i], half)
            for (const s of segs) this.appendContour(result, s)
            segs.length = 0
        }
        // 终点进入点 A_{n-1}
        result.lineTo(points[n - 1].x + norms[n - 2].x * half, points[n - 1].y + norms[n - 2].y * half)
        // 终点 cap
        this.appendCap(result, points[n - 1], points[n - 2], half, 'end')
        // 右轮廓（反向，法线负方向）
        result.lineTo(points[n - 1].x - norms[n - 2].x * half, points[n - 1].y - norms[n - 2].y * half)
        for (let i = n - 2; i >= 1; i--) {
            // 反向到达顶点 i：进入边为边 i，进入点 = p[i] - n[i]*half
            result.lineTo(points[i].x - norms[i].x * half, points[i].y - norms[i].y * half)
            // join：反向视角 nIn = -n[i], nOut = -n[i-1]
            this.appendJoin(segs, points[i], norms[i].clone().multiplyScalar(-1), norms[i - 1].clone().multiplyScalar(-1), half)
            for (const s of segs) this.appendContour(result, s)
            segs.length = 0
        }
        // 起点进入点（反向）
        result.lineTo(points[0].x - norms[0].x * half, points[0].y - norms[0].y * half)
        // 起点 cap
        this.appendCap(result, points[0], points[1], half, 'start')
        result.closePath()
    }

    /**
     * 计算顶点 join 轮廓段，把进入点 A(p + nIn*half) 连接到离开点 D(p + nOut*half)。
     * 外凸侧按 join 样式生成 miter/round/bevel；内凹侧一律 bevel 切角（经过离开点）。
     */
    private appendJoin(segs: ContourSeg[], center: Vector2, nIn: Vector2, nOut: Vector2, half: number): void {
        const cross = nIn.x * nOut.y - nIn.y * nOut.x
        // cross > 0：法线从 nIn 到 nOut 逆时针短弧（左侧外凸）
        const leftTurn = cross > 0

        // 内凹侧：直接 bevel 切角到离开点
        if (!leftTurn) {
            segs.push({ type: 'line', x: center.x + nOut.x * half, y: center.y + nOut.y * half })
            return
        }

        // 外凸侧：按 join 样式生成
        const n1 = nIn, n2 = nOut
        const join = this.options.join
        if (join === 'round') {
            const sameDir = n1.dot(n2) > 1 - 1e-6
            if (sameDir) {
                segs.push({ type: 'line', x: center.x + n1.x * half, y: center.y + n1.y * half })
                return
            }
            const start = Math.atan2(n1.y, n1.x)
            const end = Math.atan2(n2.y, n2.x)
            let delta = ((end - start) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
            // 逆时针短弧（delta < π）用 canvas 角度增大方向（ccw=false），否则反向
            const ccw = delta > Math.PI
            segs.push({ type: 'arc', x: center.x, y: center.y, radius: half, start, end, ccw })
        } else if (join === 'miter') {
            const miterDir = n1.clone().add(n2).normalize()
            const dot = n1.dot(miterDir)
            const miterLen = Math.abs(dot) < 1e-9 ? half * 100 : half / Math.abs(dot)
            if (miterLen <= this.options.miterLimit * half) {
                segs.push({ type: 'line', x: center.x + miterDir.x * miterLen, y: center.y + miterDir.y * miterLen })
            } else {
                // 超限退化为 bevel
                segs.push({ type: 'line', x: center.x + n2.x * half, y: center.y + n2.y * half })
            }
        } else {
            // bevel
            segs.push({ type: 'line', x: center.x + n2.x * half, y: center.y + n2.y * half })
        }
    }

    private appendContour(result: PathBuilder, seg: ContourSeg): void {
        if (seg.type === 'line') result.lineTo(seg.x, seg.y)
        else result.arc(seg.x, seg.y, seg.radius, seg.start, seg.end, seg.ccw)
    }

    /** 开放路径端点 cap */
    private appendCap(result: PathBuilder, end: Vector2, neighbor: Vector2, half: number, which: 'start' | 'end'): void {
        const dir = end.clone().subtract(neighbor).normalize()
        const cap = this.options.cap
        if (cap === 'square') {
            result.lineTo(end.x + dir.x * half, end.y + dir.y * half)
        } else if (cap === 'round') {
            // n = 左法线。调用前当前点位于端帽弧的起点：
            // end cap 为左点 (end + n*half)，start cap 为右点 (end - n*half)
            // 但 n 指向 cap 弧内一侧：end 时 n=左法线，start 时 dir 取反使 n 也取反
            const n = dir.perpendicular()
            // 从当前点角度 atan2(n.y,n.x) 绕 π 到对面点，ccw=true 使弧凸向路径外侧
            const start = Math.atan2(n.y, n.x)
            result.arc(end.x, end.y, half, start, start + Math.PI, true)
        }
        // butt：无扩展
    }
}
