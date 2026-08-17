import { Vector2 } from './Vector2'
import { Box2 } from './Box2'
import { Matrix2D } from './Matrix2D'

/**
 * 有向包围盒（OBB2D）
 *
 * 由中心、半尺寸与旋转角定义，用于更精确的碰撞检测与拾取。
 * 相对于 AABB 更贴合旋转后的图形。
 */
export class OBB {
    /** 中心点 */
    center: Vector2
    /** 半宽（x 方向）与半高（y 方向），相对局部坐标系 */
    halfSize: Vector2
    /** 旋转角（弧度） */
    rotation: number

    constructor(center: Vector2 = new Vector2(), halfSize: Vector2 = new Vector2(0.5, 0.5), rotation = 0) {
        this.center = center
        this.halfSize = halfSize
        this.rotation = rotation
    }

    get width(): number {
        return this.halfSize.x * 2
    }

    get height(): number {
        return this.halfSize.y * 2
    }

    /** 由 AABB 创建（无旋转） */
    static fromBox(box: Box2): OBB {
        return new OBB(
            new Vector2((box.minX + box.maxX) / 2, (box.minY + box.maxY) / 2),
            new Vector2(box.width / 2, box.height / 2),
        )
    }

    /** 由中心、宽高与旋转创建 */
    static fromCenter(cx: number, cy: number, width: number, height: number, rotation = 0): OBB {
        return new OBB(new Vector2(cx, cy), new Vector2(width / 2, height / 2), rotation)
    }

    /** 四个角点（世界坐标） */
    getCorners(): Vector2[] {
        const cos = Math.cos(this.rotation), sin = Math.sin(this.rotation)
        const hx = this.halfSize.x, hy = this.halfSize.y
        const axes: Array<[number, number]> = [
            [cos * hx, sin * hx],
            [-sin * hy, cos * hy],
        ]
        const p: Vector2[] = []
        for (const [ax, ay] of axes) {
            for (const [bx, by] of axes) {
                if (ax === axes[0][0] && ay === axes[0][1] && bx === axes[1][0] && by === axes[1][1]) continue
                if (ax === axes[1][0] && ay === axes[1][1] && bx === axes[0][0] && by === axes[0][1]) continue
                p.push(new Vector2(this.center.x + ax + bx, this.center.y + ay + by))
            }
        }
        return p
    }

    /** 轴对齐包围盒（OBB 的外接 AABB） */
    getBounds(): Box2 {
        const box = new Box2()
        for (const c of this.getCorners()) box.expandByPoint(c.x, c.y)
        return box
    }

    /** 局部坐标轴（单位向量） */
    getAxes(): [Vector2, Vector2] {
        const cos = Math.cos(this.rotation), sin = Math.sin(this.rotation)
        return [new Vector2(cos, sin), new Vector2(-sin, cos)]
    }

    /** 将世界坐标点变换到 OBB 局部坐标 */
    toLocal(point: Vector2): Vector2 {
        const dx = point.x - this.center.x
        const dy = point.y - this.center.y
        const cos = Math.cos(-this.rotation), sin = Math.sin(-this.rotation)
        return new Vector2(dx * cos - dy * sin, dx * sin + dy * cos)
    }

    /** 点是否在 OBB 内 */
    contains(point: Vector2): boolean {
        const local = this.toLocal(point)
        return Math.abs(local.x) <= this.halfSize.x && Math.abs(local.y) <= this.halfSize.y
    }

    /** 与另一 OBB 相交（SAT 分离轴定理） */
    intersects(other: OBB): boolean {
        const axes: Vector2[] = [...this.getAxes(), ...other.getAxes()]
        const cornersA = this.getCorners()
        const cornersB = other.getCorners()
        for (const axis of axes) {
            let minA = Infinity, maxA = -Infinity
            let minB = Infinity, maxB = -Infinity
            for (const c of cornersA) {
                const proj = c.dot(axis)
                if (proj < minA) minA = proj
                if (proj > maxA) maxA = proj
            }
            for (const c of cornersB) {
                const proj = c.dot(axis)
                if (proj < minB) minB = proj
                if (proj > maxB) maxB = proj
            }
            if (maxA < minB || maxB < minA) return false
        }
        return true
    }

    /** 与圆相交 */
    intersectsCircle(cx: number, cy: number, radius: number): boolean {
        const local = this.toLocal(new Vector2(cx, cy))
        const closestX = MathUtils_clamp(local.x, -this.halfSize.x, this.halfSize.x)
        const closestY = MathUtils_clamp(local.y, -this.halfSize.y, this.halfSize.y)
        const dx = local.x - closestX
        const dy = local.y - closestY
        return dx * dx + dy * dy <= radius * radius
    }

    /** 与 AABB 相交（通过 SAT 近似） */
    intersectsBox(box: Box2): boolean {
        return this.intersects(OBB.fromBox(box))
    }

    /** 应用变换，返回新的 OBB */
    transform(m: Matrix2D): OBB {
        // 变换后 OBB 局部轴会倾斜；近似取旋转/缩放后的中心与尺寸
        const center = m.applyToPoint(this.center.x, this.center.y)
        const sx = Math.hypot(m.a, m.b)
        const sy = Math.hypot(m.c, m.d)
        const rotation = Math.atan2(m.b, m.a) + this.rotation
        return new OBB(center, new Vector2(this.halfSize.x * sx, this.halfSize.y * sy), rotation)
    }

    clone(): OBB {
        return new OBB(this.center.clone(), this.halfSize.clone(), this.rotation)
    }

    toString(): string {
        return `OBB(center=${this.center}, halfSize=${this.halfSize}, rotation=${this.rotation})`
    }
}

function MathUtils_clamp(v: number, min: number, max: number): number {
    return v < min ? min : v > max ? max : v
}
