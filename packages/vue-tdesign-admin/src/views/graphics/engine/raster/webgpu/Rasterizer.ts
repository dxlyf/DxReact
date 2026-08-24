/**
 * WebGPU CPU 模拟 —— 光栅化器。
 *
 * 与 WebGL 版 Rasterizer 的差异（WebGPU 约定）：
 * 1. 裁剪空间 z 范围是 [0,w]（WebGL 是 [-w,w]），裁剪平面不同；
 * 2. NDC 深度 z∈[0,1]，直接映射到 [minDepth,maxDepth]（默认 [0,1]）；
 * 3. viewport 原点在左上角（WebGL 是左下），y 仍需要翻转（NDC y 向上）；
 * 4. 混合参数来自管线内的 GPUBlendState（factor + operation）；
 * 5. 模板有 front/back 两套状态，需要区分正面/背面三角形。
 */
import { Vec3, Vec4 } from './math'
import type { GPUTexture } from './Texture'
import type { InternalPipeline, WGSLFragmentInput } from './types'

// ==================== 混合（WebGPU GPUBlendState）====================

/** 裁剪空间顶点（顶点着色器输出） */
export interface ClipVertex {
    position: Vec4
    varyings: number[]
}

/** 视口（WebGPU 约定：左上原点） */
export interface GPUViewport {
    x: number
    y: number
    width: number
    height: number
    minDepth: number
    maxDepth: number
}

interface ScreenVertex {
    x: number
    y: number
    z: number
    invW: number
    varyings: number[]
}

/** 光栅化选项（每条 draw 命令构造一次） */
export interface WebGPURasterizerOptions {
    colorAttachment: GPUTexture | null
    depthAttachment: GPUTexture | null
    viewport: GPUViewport
    scissor: { x: number; y: number; width: number; height: number } | null
    pipeline: InternalPipeline
    bindings: Record<number, unknown>
    /** 模板参考值（来自 pass.setStencilReference） */
    stencilRef: number
}

// 裁剪平面：x,y∈[-w,w]，z∈[0,w]
const CLIP_PLANES = [
    { axis: 'x', sign: 1 }, // x <= w
    { axis: 'y', sign: 1 }, // y <= w
    { axis: 'z', sign: 1 }, // z <= w（远平面）
    { axis: 'x', sign: -1 }, // x >= -w
    { axis: 'y', sign: -1 }, // y >= -w
    { axis: 'z', sign: -1 }, // z >= 0（近平面，WebGPU 是 0 而不是 -w）
] as const

const EDGE_EPSILON = 1e-6

function inside(p: Vec4, axis: string, sign: number): boolean {
    const v = axis === 'x' ? p.x : axis === 'y' ? p.y : p.z
    if (axis === 'z' && sign === -1) return v >= -EDGE_EPSILON // z >= 0 近平面
    if (axis === 'z' && sign === 1) return v <= p.w + EDGE_EPSILON
    return sign === 1 ? v <= p.w + EDGE_EPSILON : v >= -p.w - EDGE_EPSILON
}

function intersectionT(a: Vec4, b: Vec4, axis: string, sign: number): number {
    if (axis === 'z' && sign === -1) {
        // 平面 z = 0
        if (Math.abs(b.z - a.z) < 1e-9) return 0
        return -a.z / (b.z - a.z)
    }
    const av = axis === 'x' ? a.x : axis === 'y' ? a.y : a.z
    const bv = axis === 'x' ? b.x : axis === 'y' ? b.y : b.z
    // 平面：sign * v = w  => f = sign*v - w = 0
    const fa = sign * av - a.w
    const fb = sign * bv - b.w
    if (Math.abs(fb - fa) < 1e-9) return 0
    return fa / (fa - fb)
}

function interpolateClip(a: ClipVertex, b: ClipVertex, t: number): ClipVertex {
    const p = new Vec4(
        a.position.x + (b.position.x - a.position.x) * t,
        a.position.y + (b.position.y - a.position.y) * t,
        a.position.z + (b.position.z - a.position.z) * t,
        a.position.w + (b.position.w - a.position.w) * t,
    )
    const varyings = a.varyings.map((v, i) => v + (b.varyings[i] - v) * t)
    return { position: p, varyings }
}

function clipPolygon(vertices: ClipVertex[], axis: string, sign: number): ClipVertex[] {
    const output: ClipVertex[] = []
    if (vertices.length === 0) return output
    let prev = vertices[vertices.length - 1]
    let prevInside = inside(prev.position, axis, sign)
    for (const curr of vertices) {
        const currInside = inside(curr.position, axis, sign)
        if (currInside) {
            if (!prevInside) output.push(interpolateClip(prev, curr, intersectionT(prev.position, curr.position, axis, sign)))
            output.push(curr)
        } else if (prevInside) {
            output.push(interpolateClip(prev, curr, intersectionT(prev.position, curr.position, axis, sign)))
        }
        prev = curr
        prevInside = currInside
    }
    return output
}

// ==================== 混合（WebGPU GPUBlendState）====================

function blendFactor(factor: string, src: Vec4, dst: Vec4, channel: 'rgb' | 'alpha'): number {
    // 通道选择：alpha 通道只用 src-alpha/dst-alpha 等
    const s = channel === 'alpha' ? src.w : src.x
    const d = channel === 'alpha' ? dst.w : dst.x
    switch (factor) {
        case 'zero': return 0
        case 'one': return 1
        case 'src': return s
        case 'one-minus-src': return 1 - s
        case 'src-alpha': return src.w
        case 'one-minus-src-alpha': return 1 - src.w
        case 'dst': return d
        case 'one-minus-dst': return 1 - d
        case 'dst-alpha': return dst.w
        case 'one-minus-dst-alpha': return 1 - dst.w
        case 'src-alpha-saturated': return channel === 'alpha' ? 1 : Math.min(src.w, 1 - dst.w)
        default: return 0 // constant 相关在本实现中按 0 处理
    }
}

function blendChannel(op: string, src: number, dst: number): number {
    switch (op) {
        case 'subtract': return src - dst
        case 'reverse-subtract': return dst - src
        case 'min': return Math.min(src, dst)
        case 'max': return Math.max(src, dst)
        default: return src + dst // add
    }
}

function blendColor(src: Vec4, dst: Vec4, state: { color: { srcFactor?: string; dstFactor?: string; operation?: string } }): Vec4 {
    const cf = state.color.srcFactor ?? 'one'
    const df = state.color.dstFactor ?? 'zero'
    const op = state.color.operation ?? 'add'
    return new Vec4(
        blendChannel(op, src.x * blendFactor(cf, src, dst, 'rgb'), dst.x * blendFactor(df, src, dst, 'rgb')),
        blendChannel(op, src.y * blendFactor(cf, src, dst, 'rgb'), dst.y * blendFactor(df, src, dst, 'rgb')),
        blendChannel(op, src.z * blendFactor(cf, src, dst, 'rgb'), dst.z * blendFactor(df, src, dst, 'rgb')),
        blendChannel(op, src.w * blendFactor(cf, src, dst, 'alpha'), dst.w * blendFactor(df, src, dst, 'alpha')),
    )
}

// ==================== 光栅化器 ====================

export class WebGPURasterizer {
    constructor(private options: WebGPURasterizerOptions) {}

    /** 绘制一组图元（顶点着色已完成，处于裁剪空间） */
    draw(vertices: ClipVertex[], topology: string): void {
        const { viewport, pipeline } = this.options
        const x0 = viewport.x
        const y0 = viewport.y
        const width = viewport.width
        const height = viewport.height

        // 图元装配：把顶点流拆成独立的点/线/三角形
        const primitives: number[][] = this.assemblePrimitives(vertices, topology)
        for (const ids of primitives) {
            // 齐次裁剪（z∈[0,w] 等 6 个平面）
            let clipped: ClipVertex[] = ids.map((id) => vertices[id])
            const need = ids.length
            for (const plane of CLIP_PLANES) {
                clipped = clipPolygon(clipped, plane.axis, plane.sign)
                if (clipped.length < need) break
            }
            if (clipped.length < need) continue

            // 透视除法 + 视口变换（WebGPU：NDC z∈[0,1]，viewport 左上原点）
            const screen: ScreenVertex[] = clipped.map((v) => {
                const invW = v.position.w !== 0 ? 1 / v.position.w : 0
                const nx = v.position.x * invW
                const ny = v.position.y * invW
                const nz = v.position.z * invW
                return {
                    x: x0 + (nx * 0.5 + 0.5) * width,
                    y: y0 + (0.5 - ny * 0.5) * height, // NDC y 向上 → 窗口 y 向下
                    z: nz * (viewport.maxDepth - viewport.minDepth) + viewport.minDepth,
                    invW,
                    varyings: v.varyings,
                }
            })

            if (need === 3) {
                // 裁剪可能把三角形变成多边形，用扇面三角化（fan triangulation）
                for (let i = 1; i + 1 < screen.length; i++) {
                    const a = screen[0]
                    const b = screen[i]
                    const c = screen[i + 1]
                    if (this.cullTriangle(a, b, c)) continue
                    this.rasterizeTriangle(a, b, c)
                }
            } else if (need === 2) {
                this.rasterizeLine(screen[0], screen[1])
            } else {
                this.rasterizePoint(screen[0])
            }
        }
    }

    /** 按拓扑把顶点流拆成图元（三角形带按奇偶翻转绕序） */
    private assemblePrimitives(vertices: ClipVertex[], topology: string): number[][] {
        const out: number[][] = []
        const n = vertices.length
        switch (topology) {
            case 'point-list':
                for (let i = 0; i < n; i++) out.push([i])
                break
            case 'line-list':
                for (let i = 0; i + 1 < n; i += 2) out.push([i, i + 1])
                break
            case 'line-strip':
                for (let i = 0; i + 1 < n; i++) out.push([i, i + 1])
                break
            case 'triangle-list':
                for (let i = 0; i + 2 < n; i += 3) out.push([i, i + 1, i + 2])
                break
            case 'triangle-strip': {
                for (let i = 0; i + 2 < n; i++) {
                    // 奇数编号三角形翻转顶点顺序以保持绕序一致
                    out.push(i % 2 === 0 ? [i, i + 1, i + 2] : [i + 1, i, i + 2])
                }
                break
            }
        }
        return out
    }

    /** 正面判定 + 剔除（窗口坐标，y 向下；视觉 CCW = 正面） */
    private cullTriangle(a: ScreenVertex, b: ScreenVertex, c: ScreenVertex): boolean {
        const { cullMode, frontFace } = this.options.pipeline
        if (cullMode === 'none') return false
        const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
        const front = frontFace === 'ccw' ? cross < 0 : cross > 0
        if (cullMode === 'front') return front
        if (cullMode === 'back') return !front
        return true
    }

    /** 三角形是否正面（供模板 stencilFront/stencilBack 选择） */
    private isFrontFace(a: ScreenVertex, b: ScreenVertex, c: ScreenVertex): boolean {
        const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
        return this.options.pipeline.frontFace === 'ccw' ? cross < 0 : cross > 0
    }

    private rasterizeTriangle(a: ScreenVertex, b: ScreenVertex, c: ScreenVertex): void {
        const { viewport, scissor } = this.options
        const minX = Math.max(viewport.x, Math.floor(Math.min(a.x, b.x, c.x)))
        const maxX = Math.min(viewport.x + viewport.width - 1, Math.ceil(Math.max(a.x, b.x, c.x)))
        const minY = Math.max(viewport.y, Math.floor(Math.min(a.y, b.y, c.y)))
        const maxY = Math.min(viewport.y + viewport.height - 1, Math.ceil(Math.max(a.y, b.y, c.y)))
        const area2 = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
        if (Math.abs(area2) < 1e-12) return

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (scissor && (x < scissor.x || x >= scissor.x + scissor.width || y < scissor.y || y >= scissor.y + scissor.height)) continue
                const px = x + 0.5
                const py = y + 0.5
                // 重心坐标（与面积同尺度）
                const w0 = (b.x - px) * (c.y - py) - (b.y - py) * (c.x - px)
                const w1 = (c.x - px) * (a.y - py) - (c.y - py) * (a.x - px)
                const w2 = (a.x - px) * (b.y - py) - (a.y - py) * (b.x - px)
                const l0 = w0 / area2
                const l1 = w1 / area2
                const l2 = w2 / area2
                if (l0 < -EDGE_EPSILON || l1 < -EDGE_EPSILON || l2 < -EDGE_EPSILON) continue
                this.processFragment(x, y, a, b, c, l0, l1, l2, this.isFrontFace(a, b, c))
            }
        }
    }

    private rasterizeLine(a: ScreenVertex, b: ScreenVertex): void {
        const { viewport, scissor } = this.options
        const dx = b.x - a.x
        const dy = b.y - a.y
        const steps = Math.max(Math.abs(dx), Math.abs(dy))
        if (steps === 0) {
            if (scissor && !this.inScissor(Math.round(a.x), Math.round(a.y))) return
            this.processFragment(Math.round(a.x), Math.round(a.y), a, b, a, 1, 0, 0, true)
            return
        }
        for (let i = 0; i <= steps; i++) {
            const t = i / steps
            const x = Math.round(a.x + dx * t)
            const y = Math.round(a.y + dy * t)
            if (x < viewport.x || x >= viewport.x + viewport.width || y < viewport.y || y >= viewport.y + viewport.height) continue
            if (scissor && !this.inScissor(x, y)) continue
            const varyings = a.varyings.map((v, idx) => v + (b.varyings[idx] - v) * t)
            const z = a.z + (b.z - a.z) * t
            const invW = a.invW + (b.invW - a.invW) * t
            const mid: ScreenVertex = { x, y, z, invW, varyings }
            this.processFragment(x, y, a, b, mid, 1 - t, t, 0, true)
        }
    }

    private rasterizePoint(a: ScreenVertex): void {
        const x = Math.round(a.x)
        const y = Math.round(a.y)
        const { viewport, scissor } = this.options
        if (x < viewport.x || x >= viewport.x + viewport.width || y < viewport.y || y >= viewport.y + viewport.height) return
        if (scissor && !this.inScissor(x, y)) return
        this.processFragment(x, y, a, a, a, 1, 0, 0, true)
    }

    private inScissor(x: number, y: number): boolean {
        const s = this.options.scissor
        if (!s) return true
        return x >= s.x && x < s.x + s.width && y >= s.y && y < s.y + s.height
    }

    /** 片元处理：插值 → 片元着色器 → 模板 → 深度 → 混合写入 */
    private processFragment(
        x: number,
        y: number,
        a: ScreenVertex,
        b: ScreenVertex,
        c: ScreenVertex,
        l0: number,
        l1: number,
        l2: number,
        frontFace: boolean,
    ): void {
        const { colorAttachment, depthAttachment, pipeline, bindings, stencilRef } = this.options

        // 透视校正 varying 插值
        const invInterp = l0 * a.invW + l1 * b.invW + l2 * c.invW
        const invW = invInterp !== 0 ? 1 / invInterp : 0
        const count = a.varyings.length
        const varyings = new Float32Array(count)
        for (let i = 0; i < count; i++) {
            varyings[i] = (l0 * a.varyings[i] * a.invW + l1 * b.varyings[i] * b.invW + l2 * c.varyings[i] * c.invW) * invW
        }
        const z = l0 * a.z + l1 * b.z + l2 * c.z

        // 模板测试（在片元着色器之前？真实 WebGPU 顺序：scissor → sample mask → stencil → depth → blending）
        // WebGPU 顺序：模板测试先于深度测试，都通过才执行片元着色器（early-z 之外）
        const hasStencil = !!(pipeline.stencil && depthAttachment?.stencilData)
        let stencilPassed = true
        if (hasStencil) {
            const st = pipeline.stencil!
            const face = frontFace ? st.front : st.back
            const ref = stencilRef & st.readMask
            const current = depthAttachment!.readStencil(x, y)
            const value = current & st.readMask
            const func = face.compare ?? 'always'
            if (!this.comparePass(func, ref, value)) {
                depthAttachment!.writeStencil(x, y, this.stencilOpValue(face.failOp ?? 'keep', current, stencilRef, st.writeMask))
                return
            }
            stencilPassed = true
        }

        // 深度测试（WebGPU 默认 depthCompare='always'、depthWriteEnabled=false）
        const depth = pipeline.depth
        let depthPassed = true
        if (depth && depthAttachment?.depthData) {
            const func = depth.compare
            const current = depthAttachment.readDepth(x, y)
            depthPassed = this.comparePass(func, z, current)
            if (!depthPassed) {
                if (hasStencil) {
                    const st = pipeline.stencil!
                    const face = frontFace ? st.front : st.back
                    const currentS = depthAttachment!.readStencil(x, y)
                    depthAttachment!.writeStencil(x, y, this.stencilOpValue(face.depthFailOp ?? 'keep', currentS, stencilRef, st.writeMask))
                }
                return
            }
        }

        // 都通过：执行片元着色器
        if (hasStencil) {
            const st = pipeline.stencil!
            const face = frontFace ? st.front : st.back
            const currentS = depthAttachment!.readStencil(x, y)
            depthAttachment!.writeStencil(x, y, this.stencilOpValue(face.passOp ?? 'keep', currentS, stencilRef, st.writeMask))
        }

        if (!pipeline.fragmentFn || !colorAttachment?.colorData) return
        const input: WGSLFragmentInput = {
            fragCoord: new Vec3(x, y, z),
            varyings,
            bindings,
        }
        const color = pipeline.fragmentFn(input)

        // 混合
        let out = color
        if (pipeline.blend?.[0]) {
            const dst = colorAttachment.readColor(x, y)
            out = blendColor(color, new Vec4(dst[0] / 255, dst[1] / 255, dst[2] / 255, dst[3] / 255), pipeline.blend[0])
        }
        const cr = Math.max(0, Math.min(1, out.x))
        const cg = Math.max(0, Math.min(1, out.y))
        const cb = Math.max(0, Math.min(1, out.z))
        const ca = Math.max(0, Math.min(1, out.w))
        colorAttachment.writeColor(x, y, Math.round(cr * 255), Math.round(cg * 255), Math.round(cb * 255), Math.round(ca * 255))

        // 深度写入（WebGPU 在片元着色器后、深度测试已通过）
        if (depth?.write && depthAttachment?.depthData) {
            depthAttachment.writeDepth(x, y, z)
        }
    }

    private comparePass(func: string, ref: number, value: number): boolean {
        switch (func) {
            case 'never': return false
            case 'less': return ref < value
            case 'equal': return ref === value
            case 'less-equal': return ref <= value
            case 'greater': return ref > value
            case 'not-equal': return ref !== value
            case 'greater-equal': return ref >= value
            case 'always': return true
        }
    }

    private stencilOpValue(op: string, current: number, ref: number, writeMask: number): number {
        let value: number
        switch (op) {
            case 'keep': value = current; break
            case 'zero': value = 0; break
            case 'replace': value = ref & 0xff; break
            case 'invert': value = ~current & 0xff; break
            case 'increment-clamp': value = Math.min(255, current + 1); break
            case 'decrement-clamp': value = Math.max(0, current - 1); break
            case 'increment-wrap': value = (current + 1) & 0xff; break
            case 'decrement-wrap': value = (current - 1) & 0xff; break
        }
        return (value & writeMask) | (current & ~writeMask)
    }
}
