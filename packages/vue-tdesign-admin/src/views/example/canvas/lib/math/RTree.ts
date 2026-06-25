// ══════════════════════════════════════════════
// RTree — 高性能空间索引
// ══════════════════════════════════════════════
//
// 基于 R-tree（Guttman 1984）的空间索引结构，支持：
//   - 快速范围查询（O(log n) 期望）
//   - 动态插入 / 删除
//   - 最近邻搜索（kNN）
//   - 批量加载（STR 策略，O(n) 构建）
//   - 自定义分叉度（node capacity）
//
// 适用场景：数万图形元素的画布拾取、碰撞检测、空间查询。

// ══════════════════════════════════════════════
// 基础类型
// ══════════════════════════════════════════════

/** 轴对齐包围盒 */
export interface BBox {
    minX: number
    minY: number
    maxX: number
    maxY: number
}

/**
 * RTree 中存储的元素。
 * 延展的泛型 T 可附加任意业务数据（如元素 ID、引用等）。
 */
export type RTreeItem<T = unknown> = {
    /** 元素包围盒 */
    bbox: BBox
    /** 业务数据 */
    data: T
}

/** 查询结果 */
export interface QueryResult<T = unknown> {
    /** 匹配元素 */
    item: RTreeItem<T>
    /** 查询点在包围盒内的相对位置（仅 pointQuery 时计算） */
    point?: { x: number; y: number }
}

// ══════════════════════════════════════════════
// RTree 节点（内部）
// ══════════════════════════════════════════════

interface RTreeNode<T = unknown> {
    /** 节点包围盒（所有子节点/元素的 MBR 并集） */
    bbox: BBox
    /** 子节点（内部节点）或 null（叶子节点） */
    children: RTreeNode<T>[] | null
    /** 叶子节点时存储的元素 */
    items: RTreeItem<T>[] | null
    /** 节点高度：0 = 叶子，>0 = 内部 */
    height: number
}

// ══════════════════════════════════════════════
// 工具函数
// ══════════════════════════════════════════════

/** 空包围盒 */
const EMPTY_BBOX: BBox = {
    minX: Infinity, minY: Infinity,
    maxX: -Infinity, maxY: -Infinity,
}

/** a 是否完全包含 b */
function contains(a: BBox, b: BBox): boolean {
    return a.minX <= b.minX && a.minY <= b.minY
        && a.maxX >= b.maxX && a.maxY >= b.maxY
}

/** a 与 b 是否相交 */
function intersects(a: BBox, b: BBox): boolean {
    return a.minX <= b.maxX && a.maxX >= b.minX
        && a.minY <= b.maxY && a.maxY >= b.minY
}

/** 扩展 a 以包含 b */
function expand(a: BBox, b: BBox): BBox {
    return {
        minX: Math.min(a.minX, b.minX),
        minY: Math.min(a.minY, b.minY),
        maxX: Math.max(a.maxX, b.maxX),
        maxY: Math.max(a.maxY, b.maxY),
    }
}

/** 计算 bbox 的面积 */
function area(b: BBox): number {
    return (b.maxX - b.minX) * (b.maxY - b.minY)
}

/** 计算 a 扩展以包含 b 后的面积增量 */
function enlargedArea(a: BBox, b: BBox): number {
    const dx = Math.max(a.maxX, b.maxX) - Math.min(a.minX, b.minX)
    const dy = Math.max(a.maxY, b.maxY) - Math.min(a.minY, b.minY)
    return dx * dy - area(a)
}

/** 点到包围盒的最小距离平方 */
function pointToBBoxDistSq(x: number, y: number, b: BBox): number {
    let dx = 0, dy = 0
    if (x < b.minX) dx = b.minX - x
    else if (x > b.maxX) dx = x - b.maxX
    if (y < b.minY) dy = b.minY - y
    else if (y > b.maxY) dy = y - b.maxY
    return dx * dx + dy * dy
}

/** 所有 bbox 的并集 MBR */
function unionBBox(bboxes: BBox[]): BBox {
    let result = { ...EMPTY_BBOX }
    for (const b of bboxes) result = expand(result, b)
    return result
}

// ══════════════════════════════════════════════
// 节点操作
// ══════════════════════════════════════════════

function isLeaf<T>(node: RTreeNode<T>): boolean {
    return node.height === 0
}

/** 创建叶子节点 */
function createLeafNode<T>(items: RTreeItem<T>[]): RTreeNode<T> {
    return {
        bbox: unionBBox(items.map(i => i.bbox)),
        children: null,
        items,
        height: 0,
    }
}

/** 创建内部节点 */
function createInternalNode<T>(children: RTreeNode<T>[], height: number): RTreeNode<T> {
    return {
        bbox: unionBBox(children.map(c => c.bbox)),
        children,
        items: null,
        height,
    }
}

/** 刷新节点的包围盒（递归合并子节点 / 元素的 bbox） */
function recalcBBox<T>(node: RTreeNode<T>): void {
    if (isLeaf(node) && node.items) {
        node.bbox = unionBBox(node.items.map(i => i.bbox))
    } else if (node.children) {
        node.bbox = unionBBox(node.children.map(c => c.bbox))
    }
}

// ══════════════════════════════════════════════
// 分裂策略
// ══════════════════════════════════════════════

/**
 * Quadratic Split（二次分裂，Guttman 1984）。
 *
 * 1. 选两个种子：放入同一节点后浪费面积最大的两个元素
 * 2. 对剩余元素，逐个分配给面积增量较小的组
 * 3. 当一组剩余容量不足以放完所有元素时，另一组全部吞入
 *
 * 复杂度 O(M²)，M 为节点容量。适合通用场景。
 */
function quadraticSplit<T>(
    entries: { bbox: BBox; node?: RTreeNode<T>; item?: RTreeItem<T> }[],
    minEntries: number,
): [typeof entries, typeof entries] {
    // Step 1: 选种子 — 对每对 (i,j) 计算合并后的浪费面积
    let worstWaste = -Infinity
    let seed1 = 0, seed2 = 0
    for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
            const combined = expand(entries[i].bbox, entries[j].bbox)
            const waste = area(combined) - area(entries[i].bbox) - area(entries[j].bbox)
            if (waste > worstWaste) {
                worstWaste = waste
                seed1 = i; seed2 = j
            }
        }
    }

    // 初始化两组
    const group1 = [entries[seed1]], group2 = [entries[seed2]]
    let bbox1 = entries[seed1].bbox, bbox2 = entries[seed2].bbox
    const remaining = entries.filter((_, i) => i !== seed1 && i !== seed2)

    while (remaining.length > 0) {
        // 若某组容量不够吞下剩余的，全部分配给该组
        if (group1.length + remaining.length === minEntries) {
            for (const e of remaining) { group1.push(e); bbox1 = expand(bbox1, e.bbox) }
            break
        }
        if (group2.length + remaining.length === minEntries) {
            for (const e of remaining) { group2.push(e); bbox2 = expand(bbox2, e.bbox) }
            break
        }

        // Step 2: 选下一个 — 分配给面积增量差异最大的元素
        let maxDiff = -Infinity, bestIdx = 0
        for (let i = 0; i < remaining.length; i++) {
            const d1 = enlargedArea(bbox1, remaining[i].bbox)
            const d2 = enlargedArea(bbox2, remaining[i].bbox)
            const diff = Math.abs(d1 - d2)
            if (diff > maxDiff) { maxDiff = diff; bestIdx = i }
        }

        const entry = remaining.splice(bestIdx, 1)[0]
        const d1 = enlargedArea(bbox1, entry.bbox)
        const d2 = enlargedArea(bbox2, entry.bbox)

        if (d1 < d2 || (d1 === d2 && group1.length <= group2.length)) {
            group1.push(entry); bbox1 = expand(bbox1, entry.bbox)
        } else {
            group2.push(entry); bbox2 = expand(bbox2, entry.bbox)
        }
    }

    return [group1, group2]
}

// ══════════════════════════════════════════════
// 插入
// ══════════════════════════════════════════════

/**
 * 选择插入子树 — 面积增量最小，平局时选面积小的子节点。
 */
function chooseSubtree<T>(node: RTreeNode<T>, bbox: BBox): number {
    let bestIdx = 0
    let bestEnl = Infinity, bestArea = Infinity

    for (let i = 0; i < node.children!.length; i++) {
        const child = node.children![i]
        const enl = enlargedArea(child.bbox, bbox)
        const ar = area(child.bbox)
        if (enl < bestEnl || (enl === bestEnl && ar < bestArea)) {
            bestEnl = enl; bestArea = ar; bestIdx = i
        }
    }
    return bestIdx
}

/**
 * 将分裂产生的新节点插入父节点。
 * 递归向上分裂直到根。path 包含从根到溢出节点的全部祖先（含溢出节点自身）。
 *
 * @param path - 祖先路径（从根开始），会被消费
 * @param newNode - 分裂产生的兄弟节点
 * @returns 新的树根（若根也分裂）
 */
function splitAndInsert<T>(
    path: RTreeNode<T>[],
    newNode: RTreeNode<T>,
    maxEntries: number,
    minEntries: number,
): RTreeNode<T> | null {
    while (path.length > 1) {
        path.pop()! // 弹出溢出节点自身
        const parent = path[path.length - 1] // 父节点（不移除，就地修改）
        parent.children!.push(newNode)
        recalcBBox(parent)

        if (parent.children!.length <= maxEntries) {
            // 父节点未溢出，向上刷新 bbox
            for (let i = path.length - 2; i >= 0; i--) {
                recalcBBox(path[i])
            }
            return null // 根未变
        }

        // 父节点溢出，继续分裂
        const entries = parent.children!.map(c => ({ bbox: c.bbox, node: c }))
        const [g1, g2] = quadraticSplit(entries, minEntries)
        parent.children = g1.map(e => e.node!)
        newNode = createInternalNode(g2.map(e => e.node!), parent.height)
        newNode.bbox = unionBBox(newNode.children!.map(c => c.bbox))
    }

    // 根也溢出了 → 创建新根
    const root = path[0]
    const newRoot = createInternalNode([root, newNode], root.height + 1)
    newRoot.bbox = unionBBox([root.bbox, newNode.bbox])
    return newRoot
}

/**
 * 递归插入元素到子树。
 * 沿途收集路径，溢出时通过 splitAndInsert 向上分裂。
 *
 * @returns 新的树根（若根分裂）；否则返回 null
 */
function insertRecursive<T>(
    node: RTreeNode<T>,
    bbox: BBox,
    data: T,
    maxEntries: number,
    minEntries: number,
    path: RTreeNode<T>[],
): RTreeNode<T> | null {
    path.push(node)

    if (isLeaf(node)) {
        const item: RTreeItem<T> = { bbox, data }
        node.items!.push(item)
        node.bbox = expand(node.bbox, bbox)

        if (node.items!.length <= maxEntries) return null

        // 叶子溢出 → 分裂
        const entries = node.items!.map(it => ({ bbox: it.bbox, item: it }))
        const [g1, g2] = quadraticSplit(entries, minEntries)
        node.items = g1.map(e => e.item!)
        const newNode = createLeafNode(g2.map(e => e.item!))
        node.bbox = unionBBox(node.items!.map(i => i.bbox))

        return splitAndInsert(path, newNode, maxEntries, minEntries)
    }

    // 内部节点：选子树向下递归
    const idx = chooseSubtree(node, bbox)
    const newRoot = insertRecursive(node.children![idx], bbox, data, maxEntries, minEntries, path)
    if (newRoot) return newRoot
    // 递归返回后沿途刷新 bbox（分裂已在 splitAndInsert 中通过 path 处理）
    recalcBBox(node)
    return null
}

// ══════════════════════════════════════════════
// 删除
// ══════════════════════════════════════════════

/**
 * 递归删除匹配的元素。
 * 返回 true 表示已删除，调用方需重新平衡。
 */
function removeRecursive<T>(
    node: RTreeNode<T>,
    predicate: (item: RTreeItem<T>) => boolean,
    path: RTreeNode<T>[],
    pathIndices: number[],
): boolean {
    if (isLeaf(node)) {
        const idx = node.items!.findIndex(predicate)
        if (idx === -1) return false
        node.items!.splice(idx, 1)
        recalcBBox(node)
        return true
    }

    for (let i = 0; i < node.children!.length; i++) {
        const child = node.children![i]
        path.push(node)
        pathIndices.push(i)

        if (removeRecursive(child, predicate, path, pathIndices)) {
            return true
        }

        path.pop()
        pathIndices.pop()
    }

    return false
}

/**
 * 条件化重新插入：删除导致节点元素数 < minEntries 时，
 * 回收该节点的剩余元素，重新插入树中。
 */
function condenseTree<T>(
    root: RTreeNode<T>,
    path: RTreeNode<T>[],
    pathIndices: number[],
    minEntries: number,
    maxEntries: number,
): RTreeNode<T> {
    const orphans: (RTreeItem<T> | RTreeNode<T>)[] = []

    // 收集欠载节点中的元素
    for (let i = path.length - 1; i >= 0; i--) {
        const parent = path[i]
        const idx = pathIndices[i]

        if (isLeaf(parent)) {
            if (parent.items!.length < minEntries) {
                orphans.push(...parent.items!)
                if (i === 0) {
                    // 根叶子被清空
                    return createLeafNode([])
                }
                path[i - 1].children!.splice(pathIndices[i - 1], 1)
            } else {
                recalcBBox(parent)
            }
        } else {
            if (parent.children!.length < minEntries) {
                orphans.push(...parent.children!)
                if (i === 0) {
                    if (parent.children!.length === 0) return createLeafNode([])
                    // 根节点只有一个孩子 → 提升
                    if (parent.children!.length === 1) return parent.children![0]
                    recalcBBox(parent)
                    return parent
                }
                path[i - 1].children!.splice(pathIndices[i - 1], 1)
            } else {
                recalcBBox(parent)
            }
        }
    }

    // 重新插入孤儿元素
    for (const orphan of orphans) {
        if ('height' in orphan && (orphan as RTreeNode<T>).children) {
            // 内部节点 → 展平所有元素重新插入
            const items: RTreeItem<T>[] = []
            collectItems(orphan as RTreeNode<T>, items)
            for (const item of items) {
                root = insertItem(root, item.bbox, item.data, maxEntries, minEntries)
            }
        } else {
            const item = orphan as RTreeItem<T>
            root = insertItem(root, item.bbox, item.data, maxEntries, minEntries)
        }
    }

    // 压缩树高
    while (root.children && root.children.length === 1 && !isLeaf(root)) {
        root = root.children[0]
    }

    return root
}

/** 从节点展平收集所有元素 */
function collectItems<T>(node: RTreeNode<T>, out: RTreeItem<T>[]): void {
    if (isLeaf(node)) {
        if (node.items) out.push(...node.items)
    } else if (node.children) {
        for (const child of node.children) collectItems(child, out)
    }
}

/** 插入单个元素（用于 condenseTree 重新插入孤儿元素） */
function insertItem<T>(
    root: RTreeNode<T>,
    bbox: BBox,
    data: T,
    maxEntries: number,
    minEntries: number,
): RTreeNode<T> {
    const path: RTreeNode<T>[] = []
    const newRoot = insertRecursive(root, bbox, data, maxEntries, minEntries, path)
    return newRoot ?? root
}

// ══════════════════════════════════════════════
// 批量加载（STR — Sort-Tile-Recursive）
// ══════════════════════════════════════════════

/**
 * STR（Sort-Tile-Recursive）批量加载。
 *
 *  1. 按 x 排序，分 tile
 *  2. 每个 tile 内按 y 排序
 *  3. 分组打包成叶子节点
 *  4. 递归构建上层
 *
 * 此为 bulkInsert 内部使用。
 */
function strPack<T>(items: RTreeItem<T>[], maxEntries: number): RTreeNode<T> {
    if (items.length === 0) return createLeafNode([])

    const n = items.length
    const leafCount = Math.ceil(n / maxEntries)
    if (leafCount === 1) return createLeafNode(items)

    // √(leafCount) 个 vertical slices
    const sliceSize = Math.ceil(Math.sqrt(leafCount))

    // Step 1: 按 x 中心排序
    items.sort((a, b) => {
        const ca = (a.bbox.minX + a.bbox.maxX) / 2
        const cb = (b.bbox.minX + b.bbox.maxX) / 2
        return ca - cb
    })

    const slices: RTreeItem<T>[][] = []
    for (let i = 0; i < n; i += sliceSize * maxEntries) {
        slices.push(items.slice(i, i + sliceSize * maxEntries))
    }

    // Step 2: 每个 slice 内按 y 排序，打包
    const leaves: RTreeNode<T>[] = []
    for (const slice of slices) {
        slice.sort((a, b) => {
            const ca = (a.bbox.minY + a.bbox.maxY) / 2
            const cb = (b.bbox.minY + b.bbox.maxY) / 2
            return ca - cb
        })
        for (let i = 0; i < slice.length; i += maxEntries) {
            const chunk = slice.slice(i, i + maxEntries)
            leaves.push(createLeafNode(chunk))
        }
    }

    // Step 3: 递归构建内部节点
    return strPackNodes(leaves, maxEntries)
}

function strPackNodes<T>(nodes: RTreeNode<T>[], maxEntries: number): RTreeNode<T> {
    if (nodes.length === 0) return createLeafNode([])
    if (nodes.length === 1) return nodes[0]

    const packed: RTreeNode<T>[] = []
    for (let i = 0; i < nodes.length; i += maxEntries) {
        const chunk = nodes.slice(i, i + maxEntries)
        packed.push(createInternalNode(chunk, chunk[0].height + 1))
    }
    return strPackNodes(packed, maxEntries)
}

// ══════════════════════════════════════════════
// kNN 最近邻（优先级队列）
// ══════════════════════════════════════════════

interface KNNEntry<T = unknown> {
    node: RTreeNode<T>
    dist: number
}

interface KNNResult<T = unknown> {
    item: RTreeItem<T>
    distSq: number
}

/** 最小堆（用于 kNN 优先级队列） */
class MinHeap<T> {
    private heap: T[] = []
    constructor(private compare: (a: T, b: T) => number) { }

    get size(): number { return this.heap.length }

    push(item: T): void {
        this.heap.push(item)
        this.siftUp(this.heap.length - 1)
    }

    pop(): T | undefined {
        if (this.heap.length === 0) return undefined
        const top = this.heap[0]
        const last = this.heap.pop()!
        if (this.heap.length > 0) {
            this.heap[0] = last
            this.siftDown(0)
        }
        return top
    }

    peek(): T | undefined { return this.heap[0] }

    private siftUp(idx: number): void {
        while (idx > 0) {
            const parent = (idx - 1) >> 1
            if (this.compare(this.heap[idx], this.heap[parent]) >= 0) break
            ;[this.heap[idx], this.heap[parent]] = [this.heap[parent], this.heap[idx]]
            idx = parent
        }
    }

    private siftDown(idx: number): void {
        const n = this.heap.length
        while (true) {
            let smallest = idx
            const left = 2 * idx + 1, right = 2 * idx + 2
            if (left < n && this.compare(this.heap[left], this.heap[smallest]) < 0) smallest = left
            if (right < n && this.compare(this.heap[right], this.heap[smallest]) < 0) smallest = right
            if (smallest === idx) break
            ;[this.heap[idx], this.heap[smallest]] = [this.heap[smallest], this.heap[idx]]
            idx = smallest
        }
    }
}

// ══════════════════════════════════════════════
// RTree 主类
// ══════════════════════════════════════════════

export interface RTreeOptions {
    /** 节点最大容量（默认 9），增大 = 查询更快但内存更多 */
    maxEntries?: number
}

/**
 * RTree 空间索引。
 *
 * @typeParam T - 元素附带的业务数据类型
 *
 * @example
 * ```ts
 * const tree = new RTree<{ id: string }>()
 *
 * // 批量插入
 * tree.bulkInsert([
 *   { bbox: { minX: 0, minY: 0, maxX: 10, maxY: 10 }, data: { id: 'a' } },
 *   { bbox: { minX: 5, minY: 5, maxX: 15, maxY: 15 }, data: { id: 'b' } },
 * ])
 *
 * // 范围查询
 * const results = tree.search({ minX: 0, minY: 0, maxX: 12, maxY: 12 })
 *
 * // 点查询
 * const hit = tree.searchPoint(8, 8)
 *
 * // kNN
 * const nearest = tree.nearest(0, 0, 5)
 * ```
 */
export class RTree<T = unknown> {
    private root: RTreeNode<T>
    private _maxEntries: number
    private _minEntries: number
    private _size = 0

    constructor(options: RTreeOptions = {}) {
        this._maxEntries = Math.max(4, options.maxEntries ?? 9)
        this._minEntries = Math.max(2, Math.floor(this._maxEntries * 0.4))
        this.root = createLeafNode([])
    }

    // ── 基本信息 ──

    /** 树中元素总数 */
    get size(): number { return this._size }

    /** 整棵树的包围盒（所有元素的 MBR） */
    get bbox(): BBox { return this.root.bbox }

    /** 清空树 */
    clear(): void {
        this.root = createLeafNode([])
        this._size = 0
    }

    // ── 插入 ──

    /**
     * 插入单个元素。
     * 复杂度 O(log n)。
     */
    insert(item: RTreeItem<T>): void {
        const path: RTreeNode<T>[] = []
        const newRoot = insertRecursive(
            this.root, item.bbox, item.data,
            this._maxEntries, this._minEntries, path,
        )
        if (newRoot) this.root = newRoot
        this._size++
    }

    /**
     * 批量插入（STR 策略）。
     * 比逐个 insert 高效 ~10x，适合初始加载。
     *
     * @param items - 要插入的全部元素
     */
    bulkInsert(items: RTreeItem<T>[]): void {
        if (items.length === 0) return

        // 合并现有元素
        const allItems = this.all()
        allItems.push(...items)

        this.root = strPack(allItems, this._maxEntries)
        this._size = allItems.length
    }

    // ── 删除 ──

    /**
     * 删除一个元素（引用相等判断）。
     * 复杂度 O(log n)，可能触发重新平衡。
     *
     * @returns 是否成功删除
     */
    remove(item: RTreeItem<T>): boolean {
        const path: RTreeNode<T>[] = []
        const indices: number[] = []

        const found = removeRecursive(this.root, i => i === item, path, indices)
        if (!found) return false

        this._size--
        this.root = condenseTree(this.root, path, indices, this._minEntries, this._maxEntries)
        return true
    }

    /**
     * 按谓词删除元素。
     *
     * @returns 删除的元素数量
     */
    removeBy(predicate: (item: RTreeItem<T>) => boolean): number {
        let count = 0
        const toRemove = this.search(this.bbox).filter(r => predicate(r.item))
        for (const { item } of toRemove) {
            if (this.remove(item)) count++
        }
        return count
    }

    // ── 查询 ──

    /**
     * 范围查询：返回所有与 query 相交的元素。
     * 复杂度 O(log n + k)，k 为结果数。
     */
    search(query: BBox): QueryResult<T>[] {
        const results: QueryResult<T>[] = []
        if (!intersects(this.root.bbox, query)) return results

        const stack: RTreeNode<T>[] = [this.root]
        while (stack.length > 0) {
            const node = stack.pop()!
            if (!intersects(node.bbox, query)) continue

            if (isLeaf(node)) {
                for (const item of node.items!) {
                    if (intersects(item.bbox, query)) {
                        results.push({ item })
                    }
                }
            } else {
                for (const child of node.children!) {
                    stack.push(child)
                }
            }
        }
        return results
    }

    /**
     * 点查询：返回所有包含点 (px, py) 的元素。
     */
    searchPoint(px: number, py: number): QueryResult<T>[] {
        const query: BBox = { minX: px, minY: py, maxX: px, maxY: py }
        return this.search(query)
    }

    /**
     * 判断是否存在与 query 相交的元素。
     * 比 search().length > 0 更高效（无结果收集开销）。
     */
    collides(query: BBox): boolean {
        if (!intersects(this.root.bbox, query)) return false

        const stack: RTreeNode<T>[] = [this.root]
        while (stack.length > 0) {
            const node = stack.pop()!
            if (!intersects(node.bbox, query)) continue

            if (isLeaf(node)) {
                for (const item of node.items!) {
                    if (intersects(item.bbox, query)) return true
                }
            } else {
                for (const child of node.children!) {
                    stack.push(child)
                }
            }
        }
        return false
    }

    /**
     * k 近邻搜索（kNN）。
     *
     * 使用优先级队列 + 最佳优先策略（BFS）。
     *
     * @param k - 返回前 k 个最近元素
     * @param maxDist - 最大搜索半径（Infinity = 不限）
     * @returns 按距离升序排列的最近元素列表
     */
    nearest(px: number, py: number, k = 1, maxDist = Infinity): KNNResult<T>[] {
        const results: KNNResult<T>[] = []
        const maxDistSq = maxDist * maxDist

        const heap = new MinHeap<KNNEntry<T>>((a, b) => a.dist - b.dist)
        heap.push({ node: this.root, dist: pointToBBoxDistSq(px, py, this.root.bbox) })

        while (heap.size > 0) {
            const entry = heap.pop()!
            if (results.length >= k && entry.dist > results[results.length - 1].distSq) break

            if (isLeaf(entry.node)) {
                for (const item of entry.node.items!) {
                    const dSq = pointToBBoxDistSq(px, py, item.bbox)
                    if (dSq > maxDistSq) continue

                    // 插入排序保持 results 有序
                    let insertAt = 0
                    while (insertAt < results.length && results[insertAt].distSq < dSq) insertAt++
                    if (insertAt === k) continue

                    results.splice(insertAt, 0, { item, distSq: dSq })
                    if (results.length > k) results.pop()
                }
            } else {
                for (const child of entry.node.children!) {
                    const dSq = pointToBBoxDistSq(px, py, child.bbox)
                    if (dSq > maxDistSq) continue
                    heap.push({ node: child, dist: dSq })
                }
            }
        }

        return results
    }

    /**
     * 查找距离点 (px, py) 最近的单个元素。
     * 比 nearest(px, py, 1) 更快（提前剪枝）。
     */
    nearestOne(px: number, py: number, maxDist = Infinity): KNNResult<T> | null {
        const results = this.nearest(px, py, 1, maxDist)
        return results.length > 0 ? results[0] : null
    }

    // ── 包含判断 ──

    /**
     * 查找所有完全包含 query 的元素。
     */
    searchContaining(query: BBox): QueryResult<T>[] {
        const results: QueryResult<T>[] = []
        if (!intersects(this.root.bbox, query)) return results

        const stack: RTreeNode<T>[] = [this.root]
        while (stack.length > 0) {
            const node = stack.pop()!
            if (!intersects(node.bbox, query)) continue

            if (isLeaf(node)) {
                for (const item of node.items!) {
                    if (contains(item.bbox, query)) {
                        results.push({ item })
                    }
                }
            } else {
                for (const child of node.children!) {
                    stack.push(child)
                }
            }
        }
        return results
    }

    // ── 遍历 ──

    /** 获取所有元素 */
    all(): RTreeItem<T>[] {
        const results: RTreeItem<T>[] = []
        this._collect(this.root, results)
        return results
    }

    /** 遍历所有元素 */
    forEach(fn: (item: RTreeItem<T>) => void): void {
        const stack: RTreeNode<T>[] = [this.root]
        while (stack.length > 0) {
            const node = stack.pop()!
            if (isLeaf(node)) {
                for (const item of node.items!) fn(item)
            } else {
                for (const child of node.children!) stack.push(child)
            }
        }
    }

    // ── 内部 ──

    private _collect(node: RTreeNode<T>, out: RTreeItem<T>[]): void {
        if (isLeaf(node)) {
            if (node.items) out.push(...node.items)
        } else if (node.children) {
            for (const child of node.children) this._collect(child, out)
        }
    }

    // ── 诊断 / 调试 ──

    /**
     * 树的高度。
     */
    get height(): number { return this.root.height }

    /**
     * 树中所有节点的总包围盒面积（衡量空间利用率）。
     * 值越大表示重叠越多、查询效率越差。
     */
    totalNodeArea(): number {
        let total = 0
        const stack: RTreeNode<T>[] = [this.root]
        while (stack.length > 0) {
            const node = stack.pop()!
            total += area(node.bbox)
            if (node.children) {
                for (const child of node.children) stack.push(child)
            }
        }
        return total
    }

    /**
     * 验证树结构完整性（用于调试）。
     * 返回 null 表示验证通过，否则返回错误描述。
     */
    validate(): string | null {
        return this._validateNode(this.root)
    }

    private _validateNode(node: RTreeNode<T>): string | null {
        if (isLeaf(node)) {
            if (!node.items) return '叶子节点 items 为 null'
            if (node.items.length > this._maxEntries) return '叶子节点元素数超 maxEntries'
            if (node.height !== 0) return '叶子节点 height 不为 0'
            for (const item of node.items) {
                if (!contains(node.bbox, item.bbox)) return '元素的 bbox 不在节点 bbox 内'
            }
        } else {
            if (!node.children) return '内部节点 children 为 null'
            if (node.children.length < this._minEntries && node !== this.root) {
                return '内部节点子节点数 < minEntries'
            }
            if (node.children.length > this._maxEntries) return '内部节点子节点数 > maxEntries'
            for (const child of node.children) {
                if (child.height >= node.height) return '子节点 height 不递减'
                if (!contains(node.bbox, child.bbox)) return '子节点 bbox 不在父节点 bbox 内'
                const err = this._validateNode(child)
                if (err) return err
            }
        }
        return null
    }
}
