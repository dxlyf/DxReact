/**
 * 耳剪算法（earcut）
 *
 * 将简单多边形（含洞）细分为多个三角形，用于渲染与拾取。
 *
 * 用法：
 * ```
 * // 外环 [x0,y0, x1,y1, ...]，洞索引 [n] 表示从第 n 个坐标开始的子多边形
 * const triangles = earcut([x0,y0, x1,y1, ...], holeIndices, 2)
 * // 返回顶点索引数组，每 3 个索引构成一个三角形
 * ```
 *
 * 基于 earcut 算法思想实现：双向链表 + 耳剪切 + 洞桥接。
 */

// 双向链表节点
interface Node {
    i: number
    x: number
    y: number
    prev: Node
    next: Node
    z: number | null
    prevZ: Node | null
    nextZ: Node | null
    steiner: boolean
}

export type EarcutOptions = {
    /** 面积阈值，低于该值视为退化 */
    minArea?: number
}

const EPSILON = 1e-9

export function earcut(
    data: ArrayLike<number>,
    holeIndices: ArrayLike<number> | null = null,
    dim = 2,
    options?: EarcutOptions,
): number[] {
    void options
    const hasHoles = holeIndices && holeIndices.length > 0
    const outerLen = hasHoles ? (holeIndices![0] as number) * dim : data.length
    let outerNode = linkedList(data, 0, outerLen, dim, true)
    const triangles: number[] = []

    if (!outerNode || outerNode.next === outerNode.prev) return triangles

    let minX = Infinity, minY = Infinity
    let maxX = -Infinity, maxY = -Infinity

    if (hasHoles) {
        const holes: Array<{ index: number; node: Node }> = []
        for (let i = 0; i < holeIndices!.length; i++) {
            const start = (holeIndices![i] as number) * dim
            const end = i < holeIndices!.length - 1 ? (holeIndices![i + 1] as number) * dim : data.length
            const list = linkedList(data, start, end, dim, false)
            if (list === list.next) list.steiner = true
            holes.push({ index: start, node: list })
        }
        eliminateHoles(outerNode, holes.map((h) => h.node))
    }

    // 计算包围盒用于索引
    let node = outerNode
    do {
        if (node.x < minX) minX = node.x
        if (node.y < minY) minY = node.y
        if (node.x > maxX) maxX = node.x
        if (node.y > maxY) maxY = node.y
        node = node.next
    } while (node !== outerNode)

    void minX
    void minY
    void maxX
    void maxY

    outerNode = sortLinked(outerNode)
    const result = earcutLinked(outerNode, triangles)
    return result ?? triangles
}

// 将区间 [start, end) 的坐标构建为双向链表
function linkedList(data: ArrayLike<number>, start: number, end: number, dim: number, clockwise: boolean): Node | null {
    let last: Node | null = null
    let first: Node | null = null
    if (clockwise === signedArea(data, start, end, dim) > 0) {
        for (let i = start; i < end; i += dim) {
            last = insertNode(i / dim, data[i], data[i + 1], last)
            if (!first) first = last
        }
    } else {
        for (let i = end - dim; i >= start; i -= dim) {
            last = insertNode(i / dim, data[i], data[i + 1], last)
            if (!first) first = last
        }
    }
    if (first && last && first !== last) {
        first.prev = last
        last.next = first
        return first
    }
    return null
}

function insertNode(i: number, x: number, y: number, last: Node | null): Node {
    const p: Node = { i, x, y, prev: null, next: null, z: null, prevZ: null, nextZ: null, steiner: false }
    if (last === null) {
        p.prev = p
        p.next = p
    } else {
        p.next = last.next
        p.prev = last
        last.next.prev = p
        last.next = p
    }
    return p
}

function signedArea(data: ArrayLike<number>, start: number, end: number, dim: number): number {
    let sum = 0
    for (let i = start, j = end - dim; i < end; i += dim) {
        sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1])
        j = i
    }
    return sum
}

// 洞桥接：找到洞到外环的可见桥接，合并链表
function eliminateHoles(outerNode: Node, holes: Node[]): Node | null {
    const queue: Node[] = []
    for (let i = 0; i < holes.length; i++) {
        const list = holes[i]
        const bbox = getBoundingBox(list)
        bbox[0] -= EPSILON
        bbox[1] -= EPSILON
        bbox[2] += EPSILON
        bbox[3] += EPSILON
        queue.push({ ...list, x: bbox[0], y: bbox[3] })
    }
    queue.sort((a, b) => a.x - b.x)

    let current = outerNode
    for (let i = 0; i < queue.length; i++) {
        const hole = queue[i]
        const merged = eliminateHole(current, hole)
        if (merged) current = merged
    }
    return current
}

function getBoundingBox(node: Node): number[] {
    let minX = Infinity, minY = Infinity
    let maxX = -Infinity, maxY = -Infinity
    let p = node
    do {
        if (p.x < minX) minX = p.x
        if (p.y < minY) minY = p.y
        if (p.x > maxX) maxX = p.x
        if (p.y > maxY) maxY = p.y
        p = p.next
    } while (p !== node)
    return [minX, minY, maxX, maxY]
}

function eliminateHole(outerNode: Node, holeNode: Node): Node | null {
    const bridge = findHoleBridge(outerNode, holeNode)
    if (!bridge) return null
    const bridgeReverse = splitPolygon(bridge, holeNode)
    filterPoints(bridgeReverse, bridgeReverse.next)
    return filterPoints(bridge, bridge.next)
}

// 查找洞中可见点与外环的桥接点
function findHoleBridge(outerNode: Node, holeNode: Node): Node | null {
    let p = outerNode
    const hx = holeNode.x
    const hy = holeNode.y
    let qx = -Infinity
    let m: Node | null = null

    // 找到外环上与洞 y 相交的边（水平射线）
    do {
        if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y) {
            const x = p.x + ((hy - p.y) * (p.next.x - p.x)) / (p.next.y - p.y)
            if (x <= hx && x > qx) {
                qx = x
                m = p.x < p.next.x ? p : p.next
                if (x === hx) return m
            }
        }
        p = p.next
    } while (p !== outerNode)

    if (!m) return null

    // 检查桥接是否与任何边相交
    const stop = m
    const mx = m.x
    const my = m.y
    let tanMin = Infinity

    p = m
    do {
        if (hx >= p.x && p.x >= mx && hx !== p.x &&
            pointInTriangle(
                hy < my ? hx : qx, hy,
                mx, my,
                hy < my ? qx : hx, hy,
                p.x, p.y,
            )) {
            const tan = Math.abs(hy - p.y) / (hx - p.x)
            if (locallyInside(p, holeNode) && (tan < tanMin || (tan === tanMin && (p.x > m.x || (p.x === m.x && sectorContainsSector(p)))))) {
                m = p
                tanMin = tan
            }
        }
        p = p.next
    } while (p !== stop)

    return m
}

function sectorContainsSector(p: Node): boolean {
    return !(area(p.prev, p, p.next) < 0)
}

function locallyInside(a: Node, b: Node): boolean {
    return area(a.prev, a, a.next) < 0
        ? area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0
        : area(a, b, a.prev) < 0 || area(a, a.next, b) < 0
}

function pointInTriangle(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, px: number, py: number): boolean {
    return (
        (cx - px) * (ay - py) - (ax - px) * (cy - py) >= 0 &&
        (ax - px) * (by - py) - (bx - px) * (ay - py) >= 0 &&
        (bx - px) * (cy - py) - (cx - px) * (by - py) >= 0
    )
}

// 拆分多边形：在 a 和 b 之间插入连接
function splitPolygon(a: Node, b: Node): Node {
    const a2: Node = { i: a.i, x: a.x, y: a.y, prev: null, next: null, z: null, prevZ: null, nextZ: null, steiner: a.steiner }
    const b2: Node = { i: b.i, x: b.x, y: b.y, prev: null, next: null, z: null, prevZ: null, nextZ: null, steiner: b.steiner }
    const an = a.next
    const bp = b.prev

    a.next = b
    b.prev = a
    a2.next = an
    an.prev = a2
    b2.next = a2
    a2.prev = b2
    bp.next = b2
    b2.prev = bp
    return b2
}

// 去除共线/重复节点
function filterPoints(start: Node | null, end: Node | null = null): Node | null {
    if (!start) return start
    if (!end) end = start
    let p = start
    let again = false
    do {
        again = false
        if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
            removeNode(p)
            p = end = p.prev
            if (p === p.next) break
            again = true
        } else {
            p = p.next
        }
    } while (again || p !== end)
    return end
}

function equals(p1: Node, p2: Node): boolean {
    return p1.x === p2.x && p1.y === p2.y
}

function removeNode(p: Node): void {
    p.next.prev = p.prev
    p.prev.next = p.next
    if (p.prevZ) p.prevZ.nextZ = p.nextZ
    if (p.nextZ) p.nextZ.prevZ = p.prevZ
}

function area(p: Node, q: Node, r: Node): number {
    return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y)
}

// 按角度排序（Z 排序优化）。
// 简化实现：按 x 值对链表做一次稳定排序，加速耳剪切时的点在三角形内测试。
function sortLinked(list: Node): Node {
    const nodes: Node[] = []
    let p = list
    do {
        nodes.push(p)
        p = p.next
    } while (p !== list)
    // 按 (x, y) 排序并重建链表
    nodes.sort((a, b) => a.x - b.x || a.y - b.y)
    for (let i = 0; i < nodes.length; i++) {
        const cur = nodes[i]
        const next = nodes[(i + 1) % nodes.length]
        cur.next = next
        next.prev = cur
        cur.z = i
        cur.prevZ = null
        cur.nextZ = null
    }
    return nodes[0]
}

// 耳剪切核心
function earcutLinked(ear: Node | null, triangles: number[]): number[] | null {
    if (!ear) return null
    let node = ear
    let stop = ear

    while (node.prev !== node.next) {
        const prev = node.prev
        const next = node.next

        if (isEar(node)) {
            // 剪切耳
            triangles.push(prev.i, node.i, next.i)
            removeNode(node)
            node = next.next
            stop = next.next
            continue
        }

        node = next
        if (node === stop) {
            // 无法剪切（退化多边形）：使用保守回退——取前三点
            const p0 = node
            const p1 = p0.next
            const p2 = p1.next
            if (p0 !== p1 && p1 !== p2 && p0 !== p2) {
                triangles.push(p0.i, p1.i, p2.i)
            }
            break
        }
    }
    return triangles
}

function isEar(ear: Node): boolean {
    const a = ear.prev
    const b = ear
    const c = ear.next
    if (area(a, b, c) >= 0) return false // 必须是凸角（逆时针）

    // 检查是否有其他点落在三角形内
    let p = ear.next.next
    while (p !== ear.prev) {
        if (
            pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
            area(p.prev, p, p.next) >= 0
        ) {
            return false
        }
        p = p.next
    }
    return true
}

/** 便捷：返回三角形坐标数组（每 3 个坐标一组） */
export function earcutToCoordinates(data: ArrayLike<number>, holeIndices: ArrayLike<number> | null = null, dim = 2): number[] {
    const indices = earcut(data, holeIndices, dim)
    const coords: number[] = []
    for (const idx of indices) {
        coords.push(data[idx * dim], data[idx * dim + 1])
    }
    return coords
}
