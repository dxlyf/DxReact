import { Box2 } from './Box2'
import { Vector2 } from './Vector2'
import { Matrix2D } from './Matrix2D'

/**
 * 弧线
 *
 * 描述一段圆弧（圆的一部分），提供采样、包围盒、
 * 起点/终点/角度信息。角度使用弧度制。
 */
export class Arc {
    x: number
    y: number
    radius: number
    startAngle: number
    endAngle: number
    counterclockwise: boolean

    constructor(x = 0, y = 0, radius = 0, startAngle = 0, endAngle = 0, counterclockwise = false) {
        this.x = x
        this.y = y
        this.radius = radius
        this.startAngle = startAngle
        this.endAngle = endAngle
        this.counterclockwise = counterclockwise
    }

    get center(): Vector2 {
        return new Vector2(this.x, this.y)
    }

    get startPoint(): Vector2 {
        return new Vector2(this.x + this.radius * Math.cos(this.startAngle), this.y + this.radius * Math.sin(this.startAngle))
    }

    get endPoint(): Vector2 {
        return new Vector2(this.x + this.radius * Math.cos(this.endAngle), this.y + this.radius * Math.sin(this.endAngle))
    }

    /** 弧线扫过的角度（带方向） */
    sweepAngle(): number {
        const twoPI = Math.PI * 2
        // start/end 可能为负数或超过一圈，先取模规范化到 [0, 2π)
        const s = ((this.startAngle % twoPI) + twoPI) % twoPI
        const e = ((this.endAngle % twoPI) + twoPI) % twoPI
        let sweep = e - s
        // 非逆时针返回正扫过角 [0, 2π)，逆时针返回负扫过角 (-2π, 0]
        if (this.counterclockwise) {
            if (sweep > 0) sweep -= twoPI
            if (sweep === 0 && this.endAngle !== this.startAngle) sweep = -twoPI
        } else {
            if (sweep < 0) sweep += twoPI
            if (sweep === 0 && this.endAngle !== this.startAngle) sweep = twoPI
        }
        return sweep
    }

    /** 是否为整圆（360°） */
    isFullCircle(epsilon = 1e-6): boolean {
        return Math.abs(Math.abs(this.sweepAngle()) - Math.PI * 2) < epsilon
    }

    /** 采样弧线上的点 */
    getPoints(segments = 32): Vector2[] {
        const sweep = this.sweepAngle()
        const count = Math.max(2, Math.ceil((Math.abs(sweep) / (Math.PI * 2)) * segments))
        const pts: Vector2[] = new Array(count + 1)
        for (let i = 0; i <= count; i++) {
            const angle = this.startAngle + sweep * (i / count)
            pts[i] = new Vector2(this.x + this.radius * Math.cos(angle), this.y + this.radius * Math.sin(angle))
        }
        return pts
    }

    /** 包围盒（若为整圆则是圆的外接矩形；否则扫描极值点） */
    getBounds(): Box2 {
        if (this.isFullCircle()) {
            return new Box2(this.x - this.radius, this.y - this.radius, this.x + this.radius, this.y + this.radius)
        }
        const box = new Box2()
        box.expandByPoint(this.x, this.y)
        const sweep = this.sweepAngle()
        // 检查 0/90/180/270 度是否在扫过的范围内
        const check = (angle: number) => {
            const local = ((angle - this.startAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
            const within = this.counterclockwise
                ? local <= -sweep + 1e-9
                : local <= sweep + 1e-9
            if (within) {
                box.expandByPoint(this.x + this.radius * Math.cos(angle), this.y + this.radius * Math.sin(angle))
            }
        }
        check(0)
        check(Math.PI / 2)
        check(Math.PI)
        check((Math.PI * 3) / 2)
        // 弧线端点
        box.expandByPoint(this.startPoint.x, this.startPoint.y)
        box.expandByPoint(this.endPoint.x, this.endPoint.y)
        return box
    }

    /** 弧上一点对应的参数角度（最近点） */
    angleAtPoint(p: Vector2): number {
        return Math.atan2(p.y - this.y, p.x - this.x)
    }

    /** 点是否落在弧线上（按半径容差与角度范围） */
    containsPoint(p: Vector2, radiusEpsilon = 1e-3): boolean {
        const dist = Math.hypot(p.x - this.x, p.y - this.y)
        if (Math.abs(dist - this.radius) > radiusEpsilon) return false
        const angle = this.angleAtPoint(p)
        const sweep = this.sweepAngle()
        let diff = ((angle - this.startAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
        if (!this.counterclockwise) {
            return diff <= sweep + 1e-9
        }
        // 逆时针：扫过的角度为负值
        diff = diff === 0 ? 0 : Math.PI * 2 - diff
        return diff <= -sweep + 1e-9
    }

    /** 将弧线以折线近似细分（含圆心路径，用于扇形） */
    getSectorPoints(segments = 32, includeCenter = true): Vector2[] {
        const pts = this.getPoints(segments)
        if (includeCenter) pts.push(new Vector2(this.x, this.y))
        return pts
    }

    transform(m: Matrix2D): Arc {
        // 一般仿射变换下圆弧变为椭圆弧，此处仅支持相似变换
        const scaleX = Math.hypot(m.a, m.b)
        const scaleY = Math.hypot(m.c, m.d)
        const center = m.applyToPoint(this.x, this.y)
        return new Arc(center.x, center.y, this.radius * (scaleX + scaleY) / 2, this.startAngle, this.endAngle, this.counterclockwise)
    }

    clone(): Arc {
        return new Arc(this.x, this.y, this.radius, this.startAngle, this.endAngle, this.counterclockwise)
    }

    toString(): string {
        return `Arc(${this.x}, ${this.y}, r=${this.radius}, ${this.startAngle}→${this.endAngle})`
    }
}
