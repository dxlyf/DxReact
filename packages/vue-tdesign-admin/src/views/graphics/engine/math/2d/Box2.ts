/**
 * 轴对齐包围盒（AABB2D）
 *
 * 以 minX/minY/maxX/maxY 表示，提供合并、相交、包含、变换等操作。
 */
export class Box2 {
    minX: number
    minY: number
    maxX: number
    maxY: number

    constructor(minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity) {
        this.minX = minX
        this.minY = minY
        this.maxX = maxX
        this.maxY = maxY
    }

    /** 由中心与尺寸创建 */
    static fromCenter(cx: number, cy: number, width: number, height: number): Box2 {
        const hw = width / 2, hh = height / 2
        return new Box2(cx - hw, cy - hh, cx + hw, cy + hh)
    }

    /** 由两点创建 */
    static fromPoints(ax: number, ay: number, bx: number, by: number): Box2 {
        return new Box2(
            Math.min(ax, bx), Math.min(ay, by),
            Math.max(ax, bx), Math.max(ay, by),
        )
    }

    static readonly EMPTY = new Box2()

    get isEmpty(): boolean {
        return this.minX > this.maxX || this.minY > this.maxY
    }

    get width(): number {
        return this.isEmpty ? 0 : this.maxX - this.minX
    }

    get height(): number {
        return this.isEmpty ? 0 : this.maxY - this.minY
    }

    get centerX(): number {
        return (this.minX + this.maxX) / 2
    }

    get centerY(): number {
        return (this.minY + this.maxY) / 2
    }

    get sizeX(): number {
        return this.width
    }

    get sizeY(): number {
        return this.height
    }

    set(minX: number, minY: number, maxX: number, maxY: number): this {
        this.minX = minX; this.minY = minY
        this.maxX = maxX; this.maxY = maxY
        return this
    }

    copy(b: Box2): this {
        this.minX = b.minX; this.minY = b.minY
        this.maxX = b.maxX; this.maxY = b.maxY
        return this
    }

    clone(): Box2 {
        return new Box2(this.minX, this.minY, this.maxX, this.maxY)
    }

    /** 将点纳入包围盒 */
    expandByPoint(x: number, y: number): this {
        if (this.isEmpty) {
            this.set(x, y, x, y)
        } else {
            if (x < this.minX) this.minX = x
            if (y < this.minY) this.minY = y
            if (x > this.maxX) this.maxX = x
            if (y > this.maxY) this.maxY = y
        }
        return this
    }

    /** 合并另一个包围盒 */
    union(b: Box2): this {
        if (b.isEmpty) return this
        if (this.isEmpty) return this.copy(b)
        this.minX = Math.min(this.minX, b.minX)
        this.minY = Math.min(this.minY, b.minY)
        this.maxX = Math.max(this.maxX, b.maxX)
        this.maxY = Math.max(this.maxY, b.maxY)
        return this
    }

    /** 扩展边距 */
    expand(dx: number, dy = dx): this {
        this.minX -= dx; this.minY -= dy
        this.maxX += dx; this.maxY += dy
        return this
    }

    containsPoint(x: number, y: number): boolean {
        return x >= this.minX && x <= this.maxX && y >= this.minY && y <= this.maxY
    }

    containsBox(b: Box2): boolean {
        return b.minX >= this.minX && b.maxX <= this.maxX && b.minY >= this.minY && b.maxY <= this.maxY
    }

    /** 是否与另一包围盒相交（含边界） */
    intersects(b: Box2): boolean {
        return this.maxX >= b.minX && this.minX <= b.maxX && this.maxY >= b.minY && this.minY <= b.maxY
    }

    /** 计算重叠区域 */
    intersection(b: Box2): Box2 {
        const box = new Box2()
        if (!this.intersects(b)) return box
        box.minX = Math.max(this.minX, b.minX)
        box.minY = Math.max(this.minY, b.minY)
        box.maxX = Math.min(this.maxX, b.maxX)
        box.maxY = Math.min(this.maxY, b.maxY)
        return box
    }

    /** 两盒相交面积（分离轴为 0） */
    intersectionArea(b: Box2): number {
        if (!this.intersects(b)) return 0
        const w = Math.min(this.maxX, b.maxX) - Math.max(this.minX, b.minX)
        const h = Math.min(this.maxY, b.maxY) - Math.max(this.minY, b.minY)
        return w * h
    }

    /** 计算面积 */
    area(): number {
        return this.isEmpty ? 0 : this.width * this.height
    }

    /** 包围盒到点/圆的最短距离（用于拾取与碰撞） */
    distanceToPoint(x: number, y: number): number {
        if (this.containsPoint(x, y)) return 0
        const dx = Math.max(this.minX - x, 0, x - this.maxX)
        const dy = Math.max(this.minY - y, 0, y - this.maxY)
        return Math.hypot(dx, dy)
    }

    /**
     * 用仿射变换矩阵转换包围盒（按 4 角变换后取极值，得到精确的 AABB）
     * 矩阵为 [a, b, c, d, e, f]，变换公式：x' = a*x + c*y + e, y' = b*x + d*y + f
     */
    transform(a: number, b: number, c: number, d: number, e: number, f: number): this {
        if (this.isEmpty) return this
        const corners = [
            this.transformPoint(a, b, c, d, e, f, this.minX, this.minY),
            this.transformPoint(a, b, c, d, e, f, this.maxX, this.minY),
            this.transformPoint(a, b, c, d, e, f, this.maxX, this.maxY),
            this.transformPoint(a, b, c, d, e, f, this.minX, this.maxY),
        ]
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const p of corners) {
            if (p.x < minX) minX = p.x
            if (p.y < minY) minY = p.y
            if (p.x > maxX) maxX = p.x
            if (p.y > maxY) maxY = p.y
        }
        return this.set(minX, minY, maxX, maxY)
    }

    private transformPoint(a: number, b: number, c: number, d: number, e: number, f: number, x: number, y: number): { x: number; y: number } {
        return { x: a * x + c * y + e, y: b * x + d * y + f }
    }

    /** 是否（近似）等于另一包围盒 */
    equals(b: Box2, epsilon = 0): boolean {
        return (
            Math.abs(this.minX - b.minX) <= epsilon &&
            Math.abs(this.minY - b.minY) <= epsilon &&
            Math.abs(this.maxX - b.maxX) <= epsilon &&
            Math.abs(this.maxY - b.maxY) <= epsilon
        )
    }

    toString(): string {
        return `Box2(min(${this.minX}, ${this.minY}), max(${this.maxX}, ${this.maxY}))`
    }

    /** 静态：多个包围盒取并集 */
    static unionAll(boxes: readonly Box2[]): Box2 {
        const result = new Box2()
        for (const box of boxes) result.union(box)
        return result
    }

    static fromArray(arr: number[]): Box2 {
        if (arr.length < 4) throw new Error('Box2.fromArray 至少需要 4 个元素')
        return new Box2(arr[0], arr[1], arr[2], arr[3])
    }

    toArray(): [number, number, number, number] {
        return [this.minX, this.minY, this.maxX, this.maxY]
    }

    /** 四角点 */
    getCorners(): [number, number][] {
        return [
            [this.minX, this.minY],
            [this.maxX, this.minY],
            [this.maxX, this.maxY],
            [this.minX, this.maxY],
        ]
    }
}
