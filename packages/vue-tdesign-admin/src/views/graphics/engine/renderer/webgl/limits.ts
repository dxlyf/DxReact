import type { GLContext, GLVersion } from "./types"

/** 上下文数值上限（只读，来自 gl.getParameter） */
export type Limits = {
    /** 片元着色器可用纹理单元数（MAX_TEXTURE_IMAGE_UNITS） */
    maxTextures: number
    /** 顶点着色器可用纹理单元数 */
    maxVertexTextures: number
    maxTextureSize: number
    maxCubemapSize: number
    maxRenderbufferSize: number
    maxAttributes: number
    maxVertexUniforms: number
    maxVaryings: number
    maxFragmentUniforms: number
    /** 多重采样上限（MAX_SAMPLES），WebGL1 无此参数，恒为 0 */
    maxSamples: number
    /** 当前帧缓冲采样数（SAMPLES），WebGL1 无此参数，恒为 0 */
    samples: number
    /** 可用纹理单元总数（所有着色阶段合计，MAX_COMBINED_TEXTURE_IMAGE_UNITS） */
    maxTextureUnits: number
    maxViewportDims: [number, number]
}

/** 采集当前上下文的数值上限；WebGL2 专有参数在 WebGL1 下返回 0 */
export function getLimits(gl: GLContext, version: GLVersion): Limits {
    const gl2 = gl as WebGL2RenderingContext
    const isWebGL2 = version === 'webgl2'
    return {
        maxTextures: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
        maxVertexTextures: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxCubemapSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
        maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
        maxAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
        maxVertexUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
        maxVaryings: gl.getParameter(gl.MAX_VARYING_VECTORS),
        maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
        maxSamples: isWebGL2 ? gl.getParameter(gl2.MAX_SAMPLES) : 0,
        samples: isWebGL2 ? gl.getParameter(gl2.SAMPLES) : 0,
        maxTextureUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
        maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
    }
}
