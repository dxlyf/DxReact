import { fillPolygonSSAA } from './fillScanlineSSAA.ts'
import { fillPolygonCairo } from './fillCairo.ts'
import { fillPolygonSkia } from './fillSkia.ts'
import { fillPolygonFreeType } from './fillFreetype.ts'
import { fillPolygonTinySkia } from './fillTinySkia.ts'
import { fillPolygonLibcg } from './fillLibcg.ts'
import { fillTriangleBarycentric } from './fillBarycentric.ts'

const COLOR = { r: 255, g: 64, b: 64 }
const W = 128, H = 128

// 复杂多边形：绕中心旋转的星形多边形（36 个顶点），带亚像素坐标
function starPolygon(cx: number, cy: number, r1: number, r2: number, n: number): { x: number, y: number }[] {
    const pts: { x: number, y: number }[] = []
    for (let i = 0; i < n; i++) {
        const r = i % 2 === 0 ? r1 : r2
        const a = (i * Math.PI * 2) / n
        pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) })
    }
    return pts
}

function makeImage() {
    return { width: W, height: H, data: new Uint8ClampedArray(W * H * 4) } as any
}

function bench(name: string, fn: (img: any) => void, times = 50): number {
    // warmup
    fn(makeImage())
    const t0 = performance.now()
    for (let i = 0; i < times; i++) fn(makeImage())
    const t1 = performance.now()
    return (t1 - t0) / times // 每次毫秒
}

const star = starPolygon(W / 2 + 3.7, H / 2 - 2.3, 55, 20, 36)

const results: Array<[string, number]> = []
results.push(['SSAA 8×8 超采样', bench('ssaa', i => fillPolygonSSAA(star, i, COLOR))])
results.push(['Cairo 解析跨度', bench('cairo', i => fillPolygonCairo(star, i, COLOR))])
results.push(['Skia 边缘解析', bench('skia', i => fillPolygonSkia(star, i, COLOR))])
results.push(['FreeType cell', bench('ft', i => fillPolygonFreeType(star, i, COLOR))])
results.push(['TinySkia 4×4', bench('ts', i => fillPolygonTinySkia(star, i, COLOR, 'evenodd'))])
results.push(['Libcg cell', bench('lg', i => fillPolygonLibcg(star, i, COLOR, 'evenodd'))])
// 重心坐标只填三角形：用前 3 个顶点做对比（fair 对比，其他方法都吃 36 顶点）
results.push(['Barycentric 重心', bench('bc', i => fillTriangleBarycentric(star.slice(0, 3), i, COLOR))])

results.sort((a, b) => a[1] - b[1])
console.log(`画布 ${W}x${H}，星形多边形 36 顶点，50 次平均（ms/次）：`)
for (const [name, ms] of results) {
    console.log(`${name.padEnd(18)} ${ms.toFixed(3).padStart(8)} ms`)
}
