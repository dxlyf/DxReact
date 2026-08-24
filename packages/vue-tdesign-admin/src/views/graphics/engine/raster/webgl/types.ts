/**
 * CPU 光栅化系统 —— 公共类型定义。
 * 命名与概念对齐 WebGL：attribute / uniform / varying / program / draw mode。
 */
import type { CPUTexture } from './Texture'
import { Vec2, Vec3, Vec4 } from './math'
import type { Mat4 } from './math'

/** 图元绘制模式 */
export type DrawMode = 'points' | 'lines' | 'triangles'

/** 深度比较函数 */
export type DepthFunc = 'never' | 'less' | 'lequal' | 'greater' | 'gequal' | 'equal' | 'notequal' | 'always'

/** 模板操作（对应 gl.stencilOp 的 fail/zfail/zpass） */
export type StencilOp = 'keep' | 'zero' | 'replace' | 'incr' | 'decr' | 'invert' | 'incrWrap' | 'decrWrap'

/** 混合因子函数：由源/目标颜色计算通道乘法系数（对应 WebGL 的 blendFunc 因子） */
export type BlendFactorFn = (src: Vec4, dst: Vec4) => Vec4

/** 混合因子：src/dst 各一个系数函数 */
export interface BlendFactors {
    src: BlendFactorFn
    dst: BlendFactorFn
}

/** 清除标志位（可位或） */
export const ClearFlag = {
    COLOR: 1,
    DEPTH: 2,
    STENCIL: 4,
} as const
export type ClearFlags = number

/** uniform 允许的值类型 */
export type UniformValue =
    | number
    | Vec2
    | Vec3
    | Vec4
    | Mat4
    | Float32Array
    | CPUTexture

/** uniform 集合 */
export type Uniforms = Record<string, UniformValue>

/** 顶点属性声明（决定顶点缓冲的紧凑布局顺序） */
export interface AttribDecl {
    name: string
    /** 属性分量数（1/2/3/4） */
    size: number
}

/**
 * 顶点属性视图：包装当前顶点的属性值，按名取值。
 * 对应 WebGL 的 attribute location + vertexAttribPointer 布局。
 */
export class AttribView {
    private readonly indexMap: Map<string, number>

    constructor(
        /** attribute 名（顺序与 location 对应） */
        private readonly names: readonly string[],
        /** 与 names 对齐的逐属性值 */
        private readonly values: readonly (Float32Array | null)[],
    ) {
        this.indexMap = new Map()
        for (let i = 0; i < names.length; i++) this.indexMap.set(names[i], i)
    }

    has(name: string): boolean {
        return this.indexMap.has(name)
    }

    /** 返回属性值的拷贝数组（不存在或未启用时返回 null） */
    get(name: string): Float32Array | null {
        const i = this.indexMap.get(name)
        const v = i === undefined ? null : this.values[i]
        return v ? v.slice() : null
    }

    /** 返回单个标量属性 */
    getScalar(name: string): number {
        return this.get(name)?.[0] ?? 0
    }

    getVec2(name: string): Vec2 {
        const v = this.get(name)
        return new Vec2(v?.[0] ?? 0, v?.[1] ?? 0)
    }

    getVec3(name: string): Vec3 {
        const v = this.get(name)
        return new Vec3(v?.[0] ?? 0, v?.[1] ?? 0, v?.[2] ?? 0)
    }

    getVec4(name: string): Vec4 {
        const v = this.get(name)
        return new Vec4(v?.[0] ?? 0, v?.[1] ?? 0, v?.[2] ?? 0, v?.[3] ?? 1)
    }
}

/** 顶点着色器输出：裁剪坐标 + 传给片元着色器的 varying 数组 */
export interface VertexOutput {
    /** 裁剪空间（齐次）坐标，管线后续执行透视除法与视口变换 */
    position: Vec4
    /** 逐顶点 varying 数据（与顶点一一对应，光栅化时透视校正插值） */
    varyings: number[]
}

/** 片元着色器输入 */
export interface FragmentInput {
    /** 片元坐标（像素，0.5 对齐像素中心），z 为 [0,1] 深度 */
    fragCoord: Vec3
    /** 插值后的 varying 数据 */
    varyings: Float32Array
    /** 纹理采样：uv 在 [0,1]，返回 RGBA（各通道 [0,1]） */
    sample2D(texture: CPUTexture, uv: Vec2): Vec4
}

/** 着色器程序：顶点着色 + 片元着色（CPU 端为纯函数） */
export interface ShaderProgram {
    /** 顶点属性布局（决定顶点缓冲数据顺序） */
    attribs: readonly AttribDecl[]
    /** 顶点着色器：输入顶点属性与 uniform，输出裁剪坐标与 varying */
    vertex(attribs: AttribView, uniforms: Uniforms): VertexOutput
    /** 片元着色器：输入插值 varying，输出颜色（RGBA，各通道 [0,1]） */
    fragment(input: FragmentInput, uniforms: Uniforms): Vec4
}

/**
 * 顶点着色阶段"源码"。
 * 模拟 GLSL 的 vertex shader source：CPU 端用 JS 对象（函数）代替字符串。
 */
export interface VertexStageSource {
    /** attribute 声明（与 getAttribLocation 的索引对应） */
    attribs: readonly AttribDecl[]
    /** uniform 声明（模拟 GLSL 中声明的 uniform，供 getUniformLocation 校验） */
    uniforms?: readonly string[]
    /** varying 输出声明（顺序与 main 返回的 varyings 数组连续对应；字符串 = 单分量，对象可指定分量数） */
    varyings?: readonly (string | { name: string; size: number })[]
    main(attribs: AttribView, uniforms: Uniforms): VertexOutput
}

/** 片元着色阶段"源码"（模拟 GLSL fragment shader source） */
export interface FragmentStageSource {
    /** uniform 声明（模拟 GLSL 中声明的 uniform，供 getUniformLocation 校验） */
    uniforms?: readonly string[]
    main(input: FragmentInput, uniforms: Uniforms): Vec4
}

/** 光栅化结果读取接口 */
export interface RasterImage {
    readonly width: number
    readonly height: number
    /** RGBA 像素数据（Uint8ClampedArray，可直接构造 ImageData） */
    readonly data: Uint8ClampedArray
}
