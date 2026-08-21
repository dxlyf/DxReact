/**
 * CPU 光栅化系统 —— 光栅化器。
 *
 * 模拟 WebGL 固定功能流水线中的光栅化阶段：
 * 1. 图元装配（primitive assembly）：按索引/顺序提取顶点
 * 2. 齐次裁剪（homogeneous clipping）：对 w 边界外的顶点做 Sutherland-Hodgman 裁剪
 * 3. 透视除法 + 视口变换（viewport transform）
 * 4. 背面剔除（triangle winding）
 * 5. 扫描线光栅化（edge function），perspective-correct varying 插值
 * 6. 深度测试（depth test）+ 深度写入
 * 7. 颜色混合（blending）
 */
import type { CPUFramebuffer } from './Framebuffer'
import { Vec3, Vec4 } from './math'
import type { BlendFactors, DepthFunc, DrawMode, FragmentInput, ShaderProgram, Uniforms } from './types'

/** 光栅化配置（对应 WebGL 状态机中的 enable/disable 项） */
export interface RasterizerOptions {
    viewport: { x: number; y: number; width: number; height: number }
    mode: DrawMode
    /** 剔除面：对应 gl.cullFace(FRONT/BACK/FRONT_AND_BACK) */
    cullFace: 'none' | 'front' | 'back' | 'both'
    /** 正面绕序：对应 gl.frontFace(CW/CCW)，注意屏幕 y 向下 */
    frontFace: 'cw' | 'ccw'
    /** 是否启用深度测试 */
    depthTest: boolean
    /** 是否写入深度 */
    depthWrite: boolean
    depthFunc: DepthFunc
    /** 是否启用混合 */
    blend: boolean
    /** 混合因子（对应 gl.blendFunc） */
    blendFactors: BlendFactors
    /** 当前绑定的帧缓冲 */
    framebuffer: CPUFramebuffer
}

/** 每个顶点的完整数据（用于裁剪时的线性插值） */
export interface ClipVertex {
    /** 裁剪坐标 */
    position: Vec4
    /** varying 数据 */
    varyings: number[]
}

/** 裁剪后的屏幕空间顶点 */
interface ScreenVertex {
    x: number
    y: number
    /** [0,1] 深度 */
    z: number
    /** 透视校正的 1/w（用于 varying 插值） */
    invW: number
    varyings: number[]
}

const CLIP_PLANES = [
    { axis: 'x', sign: 1 },
    { axis: 'y', sign: 1 },
    { axis: 'z', sign: 1 },
    { axis: 'x', sign: -1 },
    { axis: 'y', sign: -1 },
    { axis: 'z', sign: -1 },
] as const

/** 边缘测试容差：容忍浮点误差导致的边界像素被误剔除 */
const EDGE_EPSILON = 1e-6

/** 判断裁剪坐标是否在某个近裁剪平面内侧（-w <= 分量 <= w） */
function inside(p: Vec4, axis: string, sign: number): boolean {
    const v = axis === 'x' ? p.x : axis === 'y' ? p.y : p.z
    return sign === 1 ? v <= p.w : v >= -p.w
}

/** 求边上两点的交点 t 参数（线段与平面 -w <= v <= w 的交点） */
function intersectionT(a: Vec4, b: Vec4, axis: string, sign: number): number {
    const av = axis === 'x' ? a.x : axis === 'y' ? a.y : a.z
    const bv = axis === 'x' ? b.x : axis === 'y' ? b.y : b.z
    // 平面方程：sign * v = w  =>  f = sign * v - w = 0
    const fa = sign * av - a.w
    const fb = sign * bv - b.w
    if (Math.abs(fb - fa) < 1e-9) return 0
    return fa / (fa - fb)
}

/** 线段插值出新的裁剪顶点 */
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

/** 对多边形逐平面裁剪（Sutherland-Hodgman） */
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

/**
 * 深度比较函数映射
 */
function depthTestPass(func: DepthFunc, z: number, depth: number): boolean {
    switch (func) {
        case 'never': return false
        case 'less': return z < depth
        case 'lequal': return z <= depth
        case 'greater': return z > depth
        case 'gequal': return z >= depth
        case 'equal': return z === depth
        case 'notequal': return z !== depth
        case 'always': return true
    }
}

/**
 * 颜色混合（对应 WebGL 的混合方程 out = src*srcFactor + dst*dstFactor）：
 * src 为新片元颜色（0-1），dst 为缓冲颜色（0-1），因子由 blendFactors 提供。
 */
function blend(src: Vec4, dst: Vec4, factors: BlendFactors): Vec4 {
    const sf = factors.src(src, dst)
    const df = factors.dst(src, dst)
    return new Vec4(
        src.x * sf.x + dst.x * df.x,
        src.y * sf.y + dst.y * df.y,
        src.z * sf.z + dst.z * df.z,
        src.w * sf.w + dst.w * df.w,
    )
}

/** CPU 光栅化器：执行整个片元生成与写入流程 */
export class Rasterizer {
    private fragmentInput!: FragmentInput

    constructor(private options: RasterizerOptions) {}

    /**
     * 绘制一个图元集合（顶点着色已完成的 ClipVertex 数组）。
     * @param program 着色器程序（用于片元着色）
     * @param uniforms 片元着色器 uniform
     * @param vertices 所有已通过顶点着色器、处于裁剪空间的顶点
     * @param indices 可选索引；为空则按顺序取
     */
    draw(program: ShaderProgram, uniforms: Uniforms, vertices: ClipVertex[], indices: Uint16Array | Uint32Array | null): void {
        const { framebuffer, viewport } = this.options
        const width = viewport.width
        const height = viewport.height
        const x0 = viewport.x
        const y0 = viewport.y
        const mode = this.options.mode

        // 1. 图元装配 + 逐图元处理
        const counts: Record<DrawMode, number> = { points: 1, lines: 2, triangles: 3 }
        const perPrim = counts[mode]
        const total = indices ? indices.length : vertices.length
        const primCount = Math.floor(total / perPrim)

        for (let p = 0; p < primCount; p++) {
            // 取出图元的顶点索引
            const ids: number[] = []
            for (let k = 0; k < perPrim; k++) {
                const id = indices ? indices[p * perPrim + k] : p * perPrim + k
                ids.push(id)
            }

            // 2. 齐次裁剪
            let clipped: ClipVertex[] = ids.map((id) => vertices[id])
            if (mode !== 'points') {
                for (const plane of CLIP_PLANES) {
                    clipped = clipPolygon(clipped, plane.axis, plane.sign)
                    if (clipped.length < perPrim) break
                }
            }
            if (clipped.length < perPrim) continue

            // 3. 透视除法 + 视口变换
            const screen: ScreenVertex[] = clipped.map((v) => {
                const ndc = v.position.perspectiveDivide()
                const sx = x0 + ((ndc.x + 1) / 2) * width
                // WebGL 左下原点；这里 y 翻转使屏幕原点在左上（与 2D canvas 一致）
                const sy = y0 + ((1 - ndc.y) / 2) * height
                const sz = (ndc.z + 1) / 2
                return {
                    x: sx,
                    y: sy,
                    z: sz,
                    invW: v.position.w !== 0 ? 1 / v.position.w : 0,
                    varyings: v.varyings,
                }
            })

            if (mode === 'triangles') {
                // 4. 正面判定 + 剔除（屏幕空间叉积；屏幕 y 向下，CCW 正面 cross<0）
                if (this.cullTriangle(screen[0], screen[1], screen[2])) continue
                this.rasterizeTriangle(program, uniforms, screen[0], screen[1], screen[2])
            } else if (mode === 'lines') {
                this.rasterizeLine(program, uniforms, screen[0], screen[1])
            } else {
                this.rasterizePoint(program, uniforms, screen[0])
            }
        }
    }

    /**
     * 判断三角形是否被剔除。
     * WebGL 约定：frontFace=CCW 时，裁剪空间（y 向上）中逆时针为正面；
     * 屏幕空间 y 向下翻转了绕序，因此正面 <-> 屏幕叉积为负。
     */
    private cullTriangle(a: ScreenVertex, b: ScreenVertex, c: ScreenVertex): boolean {
        if (this.options.cullFace === 'none') return false
        const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
        const front = this.options.frontFace === 'ccw' ? cross < 0 : cross > 0
        if (this.options.cullFace === 'both') return true
        if (this.options.cullFace === 'front') return front
        return !front // 'back'
    }

    /**
     * 三角形光栅化：edge function 扫描 + 重心坐标插值。
     */
    private rasterizeTriangle(program: ShaderProgram, uniforms: Uniforms, a: ScreenVertex, b: ScreenVertex, c: ScreenVertex): void {
        const { framebuffer, viewport } = this.options
        const x0 = viewport.x
        const y0 = viewport.y
        const width = viewport.width
        const height = viewport.height

        const minX = Math.max(x0, Math.floor(Math.min(a.x, b.x, c.x)))
        const maxX = Math.min(x0 + width - 1, Math.ceil(Math.max(a.x, b.x, c.x)))
        const minY = Math.max(y0, Math.floor(Math.min(a.y, b.y, c.y)))
        const maxY = Math.min(y0 + height - 1, Math.ceil(Math.max(a.y, b.y, c.y)))

        // edge function 系数（面积 ×2）
        const area2 = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
        if (Math.abs(area2) < 1e-12) return

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                // 像素中心（0.5 偏移，对应 WebGL 的半像素约定）
                const px = x + 0.5
                const py = y + 0.5

                const w0 = (b.x - a.x) * (py - a.y) - (b.y - a.y) * (px - a.x)
                const w1 = (c.x - b.x) * (py - b.y) - (c.y - b.y) * (px - b.x)
                const w2 = (a.x - c.x) * (py - c.y) - (a.y - c.y) * (px - c.x)

                const l0 = w0 / area2
                const l1 = w1 / area2
                const l2 = w2 / area2

                // 背面剔除已做（area2 > 0 为正面），若 area2 < 0 说明是背面且未剔除，跳过
                if (l0 < -EDGE_EPSILON || l1 < -EDGE_EPSILON || l2 < -EDGE_EPSILON) continue

                this.processFragment(program, uniforms, x, y, a, b, c, l0, l1, l2)
            }
        }
    }

    /** 线段光栅化（DDA） */
    private rasterizeLine(program: ShaderProgram, uniforms: Uniforms, a: ScreenVertex, b: ScreenVertex): void {
        const { framebuffer, viewport } = this.options
        const x0 = viewport.x
        const y0 = viewport.y
        const width = viewport.width
        const height = viewport.height

        const dx = b.x - a.x
        const dy = b.y - a.y
        const steps = Math.max(Math.abs(dx), Math.abs(dy))
        if (steps === 0) {
            this.processFragment(program, uniforms, Math.round(a.x), Math.round(a.y), a, b, a, 1, 0, 0)
            return
        }

        for (let i = 0; i <= steps; i++) {
            const t = i / steps
            const x = Math.round(a.x + dx * t)
            const y = Math.round(a.y + dy * t)
            if (x < x0 || x >= x0 + width || y < y0 || y >= y0 + height) continue
            const varyings = a.varyings.map((v, idx) => v + (b.varyings[idx] - v) * t)
            const z = a.z + (b.z - a.z) * t
            const invW = a.invW + (b.invW - a.invW) * t
            const av: ScreenVertex = { x, y, z, invW, varyings }
            this.processFragment(program, uniforms, x, y, a, b, av, 1 - t, t, 0)
        }
    }

    /** 点光栅化 */
    private rasterizePoint(program: ShaderProgram, uniforms: Uniforms, a: ScreenVertex): void {
        const x = Math.round(a.x)
        const y = Math.round(a.y)
        const { viewport } = this.options
        if (x < viewport.x || x >= viewport.x + viewport.width || y < viewport.y || y >= viewport.y + viewport.height) return
        this.processFragment(program, uniforms, x, y, a, a, a, 1, 0, 0)
    }

    /**
     * 片元处理：透视校正插值 → 片元着色 → 深度测试 → 混合写入。
     */
    private processFragment(
        program: ShaderProgram,
        uniforms: Uniforms,
        x: number,
        y: number,
        a: ScreenVertex,
        b: ScreenVertex,
        c: ScreenVertex,
        l0: number,
        l1: number,
        l2: number,
    ): void {
        const { framebuffer, depthTest, depthWrite, depthFunc, blend: doBlend } = this.options

        // perspective-correct 插值：先用 1/w 加权重心坐标，再除插值后的 1/w
        const interpolatedInvW = l0 * a.invW + l1 * b.invW + l2 * c.invW
        const invInterp = interpolatedInvW !== 0 ? 1 / interpolatedInvW : 0
        const varyingCount = a.varyings.length
        const varyings = new Float32Array(varyingCount)
        for (let i = 0; i < varyingCount; i++) {
            const w = l0 * a.varyings[i] * a.invW + l1 * b.varyings[i] * b.invW + l2 * c.varyings[i] * c.invW
            varyings[i] = w * invInterp
        }
        const z = l0 * a.z + l1 * b.z + l2 * c.z

        const fragCoord = new Vec3(x, y, z)
        this.fragmentInput = { fragCoord, varyings, sample2D: (tex, uv) => tex.sample(uv) }
        const color = program.fragment(this.fragmentInput, uniforms)

        // 深度测试
        if (depthTest) {
            const depth = framebuffer.readDepth(x, y)
            if (!depthTestPass(depthFunc, z, depth)) return
        }

        // 混合 + 写入
        const dst = framebuffer.readColor(x, y)
        const out = doBlend ? blend(color, new Vec4(dst[0] / 255, dst[1] / 255, dst[2] / 255, dst[3] / 255), this.options.blendFactors) : color

        framebuffer.writeColor(x, y, Math.round(out.x * 255), Math.round(out.y * 255), Math.round(out.z * 255), Math.round(out.w * 255))
        if (depthWrite) framebuffer.writeDepth(x, y, z)
    }
}
