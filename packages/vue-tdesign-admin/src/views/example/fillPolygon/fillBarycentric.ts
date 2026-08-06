// ============================================================
// 填充方式：三角形 + 重心坐标（Barycentric Coordinates）抗锯齿
//
// 原理：
//   任意点 P 相对三角形 ABC 可表示为重心坐标 (u, v, w)：
//     P = u·A + v·B + w·C，且 u + v + w = 1
//   其中 u/v/w 分别是 P 到对边（BC/CA/AB）的距离占该边上高的比例：
//     u = S(PBC) / S(ABC)（带符号面积比）
//   当且仅当 u ≥ 0、v ≥ 0、w ≥ 0 时 P 在三角形内部（含边）。
//
//   对每个像素中心点 (px+0.5, py+0.5) 计算重心坐标：
//     - 权重 × 对应边的高 = 点到该边的带符号距离（像素单位）
//     - 取三个距离的最小值 dMin（负值表示点在三角形外）
//     - alpha = clamp(0.5 + dMin / aaWidth)：dMin≥0.5px 时全不透明，
//       边线处 0.5，向外 0.5px 内线性过渡到 0 → 抗锯齿
//   相比纯二分内外判定，这样边界像素按距离平滑过渡，不会漏填。
//
//   这是 GPU 光栅化中经典的「重心坐标 + 边缘距离」抗锯齿思路
//   （类似 triangle analytic coverage），适合三角形这一简单图元。
// ============================================================

/** 多边形顶点（网格浮点坐标，如 {x:2.3, y:5.6}） */
export interface PolyVertex { x: number, y: number }
/** 填充颜色（0-255） */
export interface FillColor { r: number, g: number, b: number }

/**
 * 计算 P 相对三角形 ABC 的重心坐标 (u, v, w)。
 * 使用带符号面积比（叉积）：u = cross(B-P, C-P) / cross(B-A, C-A) 等。
 * 返回 null 表示退化三角形（面积 0）。u/v/w ≥ 0 时 P 在三角形内。
 */
function barycentric(
    A: PolyVertex, B: PolyVertex, C: PolyVertex,
    P: PolyVertex,
): { u: number, v: number, w: number } | null {
    // 三角形有向面积的 2 倍（cross(B-A, C-A)）
    const area2 = (B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y)
    if (Math.abs(area2) < 1e-12) return null // 退化三角形
    // 三个子三角形有向面积的 2 倍
    const s1 = (B.x - P.x) * (C.y - P.y) - (C.x - P.x) * (B.y - P.y) // cross(B-P, C-P)
    const s2 = (C.x - P.x) * (A.y - P.y) - (A.x - P.x) * (C.y - P.y) // cross(C-P, A-P)
    const u = s1 / area2
    const v = s2 / area2
    const w = 1 - u - v
    return { u, v, w }
}

/**
 * 计算 P 相对三角形 ABC 的重心坐标 (u, v, w)。
 * 使用带符号面积比（叉积）：
 *   area = cross(B-A, C-A)
 *   u = cross(B-P, C-P) / area
 *   v = cross(C-P, A-P) / area
 *   w = cross(A-P, B-P) / area
 * 返回 { u, v, w, area, isInside }，isInside 表示是否在三角形内（含边）。
 */
function barycentric3(
    A: PolyVertex, B: PolyVertex, C: PolyVertex,
    P: PolyVertex,
) {
    const v0x = B.x - A.x, v0y = B.y - A.y
    const v1x = C.x - A.x, v1y = C.y - A.y
    const v2x = P.x - A.x, v2y = P.y - A.y
    // 叉积：cross(U, V) = Ux·Vy − Uy·Vx
    const dot00 = v0x * v0x + v0y * v0y
    const dot01 = v0x * v1x + v0y * v1y
    const dot02 = v0x * v2x + v0y * v2y
    const dot11 = v1x * v1x + v1y * v1y
    const dot12 = v1x * v2x + v1y * v2y
    // 使用逆矩阵法（克莱姆法则）求解重心坐标，退化三角形（面积 0）时返回 null
    const denom = dot00 * dot11 - dot01 * dot01
    if (Math.abs(denom) < 1e-12) return null
    const invDenom = 1 / denom
    const v = (dot11 * dot02 - dot01 * dot12) * invDenom
    const w = (dot00 * dot12 - dot01 * dot02) * invDenom
    const u = 1 - v - w
    return { u, v, w, isInside: u >= 0 && v >= 0 && w >= 0 }
}

function cross(a: PolyVertex, b: PolyVertex) {
    return a.x * b.y - a.y * b.x
}
function sub(a: PolyVertex, b: PolyVertex) {
    return { x: a.x - b.x, y: a.y - b.y }
}
function barycentric2(
    A: PolyVertex, B: PolyVertex, C: PolyVertex,
    P: PolyVertex,
) {
    const area = cross(sub(B, A), sub(C, A))
    if (Math.abs(area) < 1e-12) return 0
    const alpha = cross(sub(B, P), sub(C, P)) / area
    const beta = cross(sub(C, P), sub(A, P)) / area
    const gamma = 1 - alpha - beta  //cross(sub(A, P), sub(B, P)) / area
    return [alpha, beta, gamma]
}
/**
 * 用重心坐标填充三角形：内部全覆盖，边缘按重心坐标权重生成抗锯齿 alpha。
 * 顶点从 vertices 取前 3 个（多余顶点忽略，本填充仅针对三角形）。
 *
 * 抗锯齿实现：
 *   重心坐标权重 u/v/w 分别等于 P 到 BC/CA/AB 的距离 ÷ 该边上的高，
 *   所以「权重 × 高」就是 P 到对应边的带符号距离（像素单位，负值在外）。
 *   取三个距离的最小值 dMin（离最近边），
 *   alpha = clamp(0.5 + dMin / aaWidth)，aaWidth = 1 像素。
 *
 * @param vertices  三角形顶点（取前 3 个）
 * @param imageData 目标像素缓冲
 * @param color     填充颜色
 */
export function fillTriangleBarycentric(vertices: PolyVertex[], imageData: ImageData, color: FillColor): void {
    if (vertices.length < 3) return

    let A = vertices[0]
    let B = vertices[1]
    let C = vertices[2]

    // 归一化绕向为逆时针（CCW）：面积 < 0 时交换 B、C。
    // 这样重心坐标在内部恒为正，带符号距离方向统一，抗锯齿与绕向无关。
    let area2 = (B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y)
    if (area2 < 0) {
        const t = B; B = C; C = t
        area2 = -area2
    }
    if (area2 < 1e-12) return // 退化三角形

    const w = imageData.width
    const h = imageData.height
    const data = imageData.data

    // 三条边的边长：顶点到对边的距离 = 2×面积 / 边长（高）
    const lenBC = Math.hypot(C.x - B.x, C.y - B.y) || 1
    const lenCA = Math.hypot(A.x - C.x, A.y - C.y) || 1
    const lenAB = Math.hypot(B.x - A.x, B.y - A.y) || 1
    // 对应边上的高（像素单位）
    const hBC = area2 / lenBC // 顶点 A 到边 BC 的高
    const hCA = area2 / lenCA // 顶点 B 到边 CA 的高
    const hAB = area2 / lenAB // 顶点 C 到边 AB 的高

    // 抗锯齿过渡半宽（像素）：边线上 alpha=0.5，向内 0.5px 变 1，向外 0.5px 变 0
    const aaWidth = 1

    // 三角形包围盒（像素级），外扩 aaWidth 覆盖抗锯齿过渡带
    const minX = Math.max(0, Math.floor(Math.min(A.x, B.x, C.x) - aaWidth))
    const maxX = Math.min(w - 1, Math.ceil(Math.max(A.x, B.x, C.x) + aaWidth))
    const minY = Math.max(0, Math.floor(Math.min(A.y, B.y, C.y) - aaWidth))
    const maxY = Math.min(h - 1, Math.ceil(Math.max(A.y, B.y, C.y) + aaWidth))

    // 逐像素扫描包围盒
    for (let py = minY; py <= maxY; py++) {
        for (let px = minX; px <= maxX; px++) {
            // 像素中心点（+0.5 与网格像素坐标对齐）
            const P = { x: px + 0.5, y: py + 0.5 }

            const bc = barycentric(A, B, C, P)
            if (!bc) continue // 退化三角形，无面积可填

            // 重心权重 → 到对应边的带符号距离（像素，CCW 下内部为正）
            const dBC = bc.u * hBC // P 到 BC 的距离（对应权重 u）
            const dCA = bc.v * hCA // P 到 CA 的距离（对应权重 v）
            const dAB = bc.w * hAB // P 到 AB 的距离（对应权重 w）
            // 离最近边的距离（负值 = 在三角形外）
            const dMin = Math.min(dBC, dCA, dAB)

            // 覆盖率：边线处 0.5，向内线性增到 1，向外线性减到 0
            const alpha = Math.min(1, Math.max(0, 0.5 + dMin / aaWidth))
            if (alpha <= 0) continue

            const idx = (py * w + px) * 4
            data[idx] = color.r
            data[idx + 1] = color.g
            data[idx + 2] = color.b
            data[idx + 3] = Math.round(alpha * 255)
        }
    }
}
