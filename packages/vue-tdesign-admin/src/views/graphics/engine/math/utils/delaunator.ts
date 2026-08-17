/**
 * 达拉诺塔（Delaunay）三角剖分
 *
 * 基于 Bowyer-Watson 算法，将平面点集剖分为满足空外接圆性质的三角形，
 * 用于渲染网格与几何细分。
 *
 * 用法：
 * ```
 * const d = new Delaunator([x0,y0, x1,y1, ...])
 * d.triangles   // 顶点索引数组，每 3 个索引构成一个三角形
 * d.halfedges   // 半边关系
 * ```
 */

export interface DelaunatorResult {
    /** 顶点索引数组（每 3 个一组为一个三角形） */
    triangles: number[]
    /** 半边边（i 的对面半边，-1 表示凸包边） */
    halfedges: number[]
    /** 点集坐标 [x0,y0,...] */
    coords: number[]
}

interface Point {
    x: number
    y: number
    index: number
}

interface TriangleRef {
    a: number
    b: number
    c: number
}

export class Delaunator {
    readonly coords: number[]
    readonly triangles: number[] = []
    readonly halfedges: number[] = []
    readonly hull: number[] = []

    private readonly points: Point[]

    constructor(coords: ArrayLike<number>) {
        if (coords.length % 2 !== 0) throw new Error('坐标数量必须是偶数')
        this.coords = Array.from(coords)
        this.points = []
        for (let i = 0; i < this.coords.length; i += 2) {
            this.points.push({ x: this.coords[i], y: this.coords[i + 1], index: i / 2 })
        }
        this.triangulate()
    }

    /** 直接执行 Bowyer-Watson 三角剖分 */
    private triangulate(): void {
        const n = this.points.length
        if (n < 3) return

        // 1. 构造包围全部点的超三角形
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const p of this.points) {
            if (p.x < minX) minX = p.x
            if (p.y < minY) minY = p.y
            if (p.x > maxX) maxX = p.x
            if (p.y > maxY) maxY = p.y
        }
        const dx = maxX - minX
        const dy = maxY - minY
        const dmax = Math.max(dx, dy)
        const midX = (minX + maxX) / 2
        const midY = (minY + maxY) / 2
        // 超三角形足够大以包含所有点
        const superTri = [
            { x: midX - 20 * dmax, y: midY - dmax, index: -1 },
            { x: midX, y: midY + 20 * dmax, index: -2 },
            { x: midX + 20 * dmax, y: midY - dmax, index: -3 },
        ]
        for (const v of superTri) this.superVerts.set(v.index, v)

        // 三角形列表（用顶点索引三元组）
        let triangles: TriangleRef[] = [{ a: -1, b: -2, c: -3 }]

        // 2. 逐个插入点
        for (const p of this.points) {
            // 找出外接圆包含 p 的三角形
            const badTriangles: Array<{ tri: TriangleRef; index: number }> = []
            for (let i = 0; i < triangles.length; i++) {
                const tri = triangles[i]
                const circum = this.circumcircle(this.getPoint(tri.a), this.getPoint(tri.b), this.getPoint(tri.c))
                if (this.inCircumcircle(circum, p)) {
                    badTriangles.push({ tri, index: i })
                }
            }

            // 收集多边形边界（未被共享的边）
            const boundary: Array<[number, number]> = []
            const removed = new Set(badTriangles.map((b) => b.index))
            for (const { tri } of badTriangles) {
                const edges: Array<[number, number]> = [
                    [tri.a, tri.b],
                    [tri.b, tri.c],
                    [tri.c, tri.a],
                ]
                for (const [e1, e2] of edges) {
                    const shared = this.hasSharedEdge(badTriangles, e1, e2, removed)
                    if (!shared) boundary.push([e1, e2])
                }
            }

            // 移除坏三角形
            triangles = triangles.filter((_, idx) => !removed.has(idx))

            // 用边界与插入点生成新三角形
            for (const [a, b] of boundary) {
                triangles.push({ a, b, c: p.index })
            }
        }

        // 3. 移除包含超三角形顶点的三角形
        triangles = triangles.filter((t) => t.a >= 0 && t.b >= 0 && t.c >= 0)

        // 4. 构建输出
        for (const t of triangles) {
            this.triangles.push(t.a, t.b, t.c)
        }
        this.buildHalfedges()
        this.buildHull()
    }

    private superVerts: Map<number, Point> = new Map()

    private getPoint(i: number): Point {
        if (i >= 0) return this.points[i]
        return this.superVerts.get(i) ?? { x: 0, y: 0, index: i }
    }

    private circumcircle(a: Point, b: Point, c: Point): { x: number; y: number; r2: number } {
        const ax = a.x, ay = a.y
        const bx = b.x, by = b.y
        const cx = c.x, cy = c.y
        const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))
        if (Math.abs(d) < 1e-12) {
            // 三点共线：返回一个很大的圆（避免除零）
            return { x: 0, y: 0, r2: Infinity }
        }
        const a2 = ax * ax + ay * ay
        const b2 = bx * bx + by * by
        const c2 = cx * cx + cy * cy
        const ux = (a2 * (by - cy) + b2 * (cy - ay) + c2 * (ay - by)) / d
        const uy = (a2 * (cx - bx) + b2 * (ax - cx) + c2 * (bx - ax)) / d
        const dx = ax - ux, dy = ay - uy
        return { x: ux, y: uy, r2: dx * dx + dy * dy }
    }

    private inCircumcircle(circum: { x: number; y: number; r2: number }, p: Point): boolean {
        if (circum.r2 === Infinity) return false
        const dx = p.x - circum.x
        const dy = p.y - circum.y
        return dx * dx + dy * dy <= circum.r2 + 1e-12
    }

    /** 检查边是否被其他坏三角形共享 */
    private hasSharedEdge(badTriangles: Array<{ tri: TriangleRef; index: number }>, e1: number, e2: number, removed: Set<number>): boolean {
        let count = 0
        for (const { tri, index } of badTriangles) {
            if (removed.has(index)) continue
            const hasA = tri.a === e1 || tri.b === e1 || tri.c === e1
            const hasB = tri.a === e2 || tri.b === e2 || tri.c === e2
            if (hasA && hasB) count++
        }
        return count > 1
    }

    private buildHalfedges(): void {
        const n = this.triangles.length
        this.halfedges.length = n
        this.halfedges.fill(-1)
        // 边 → 索引映射（key 为 min*max 编码）
        const map = new Map<number, number>()
        for (let i = 0; i < n; i += 3) {
            const a = this.triangles[i]
            const b = this.triangles[i + 1]
            const c = this.triangles[i + 2]
            this.linkEdge(map, i, a, b)
            this.linkEdge(map, i + 1, b, c)
            this.linkEdge(map, i + 2, c, a)
        }
    }

    private linkEdge(map: Map<number, number>, edgeIndex: number, v1: number, v2: number): void {
        const key = v1 < v2 ? v1 * 131071 + v2 : v2 * 131071 + v1
        const existing = map.get(key)
        if (existing === undefined) {
            map.set(key, edgeIndex)
        } else {
            this.halfedges[existing] = edgeIndex
            this.halfedges[edgeIndex] = existing
            map.delete(key)
        }
    }

    private buildHull(): void {
        const seen = new Map<number, number>() // from → to
        const used = new Set<number>()
        for (let i = 0; i < this.halfedges.length; i++) {
            if (this.halfedges[i] === -1) {
                const from = this.triangles[i]
                const to = this.triangles[i % 3 === 2 ? i - 2 : i + 1]
                if (from >= 0 && to >= 0) {
                    used.add(from)
                    used.add(to)
                    seen.set(from, to)
                }
            }
        }
        // 按顺序重建凸包（简单起见返回按 used 顶点）
        this.hull.length = 0
        if (seen.size === 0) {
            this.hull.push(...used)
            return
        }
        const start = seen.keys().next().value as number
        let cur = start
        do {
            this.hull.push(cur)
            cur = seen.get(cur) ?? -1
        } while (cur >= 0 && cur !== start && this.hull.length <= seen.size)
    }
}

/** 便捷函数：直接返回三角形索引 */
export function delaunator(coords: ArrayLike<number>): DelaunatorResult {
    const d = new Delaunator(coords)
    return {
        triangles: d.triangles,
        halfedges: d.halfedges,
        coords: d.coords,
    }
}

/** 便捷：返回三角形坐标（每 3 个坐标一组，与顶点索引对应） */
export function delaunatorToCoordinates(coords: ArrayLike<number>): number[] {
    const d = new Delaunator(coords)
    const result: number[] = []
    for (const idx of d.triangles) {
        result.push(d.coords[idx * 2], d.coords[idx * 2 + 1])
    }
    return result
}
