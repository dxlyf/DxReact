/**
 * CPU 光栅化系统 —— 内置着色器。
 *
 * 分为"阶段"（stage）导出，配合 WebGL 风格的编译流程使用：
 *   const vs = gl.createShader(gl.VERTEX_SHADER)
 *   gl.shaderSource(vs, colorVertexStage)   // JS 对象代替 GLSL 字符串
 *   gl.compileShader(vs)
 *
 * 同时导出组合好的 colorShader / textureShader（ShaderProgram），
 * 便于脱离 WebGL 风格 API 直接调用 Rasterizer。
 */
import { Mat4, Vec2, Vec4 } from './math'
import { CPUTexture } from './Texture';
import type { AttribView, FragmentInput, FragmentStageSource, ShaderProgram, Uniforms, VertexOutput, VertexStageSource } from './types'

/** 读取 uniform 中的投影/变换矩阵（缺省为恒等） */
function resolveMVP(uniforms: Uniforms): { projection: Mat4; transform: Mat4 } {
    const projection = (uniforms.uProjection as Mat4 | undefined) ?? Mat4.identity()
    const transform = (uniforms.uTransform as Mat4 | undefined) ?? Mat4.identity()
    return { projection, transform }
}

// ========== 纯色着色器（aPosition + aColor -> 单色填充）==========

export const colorVertexStage: VertexStageSource = {
    attribs: [
        { name: 'aPosition', size: 2 },
        { name: 'aColor', size: 4 },
    ],
    uniforms: ['uProjection', 'uTransform'],
    main(attribs: AttribView, uniforms: Uniforms): VertexOutput {
        const pos = attribs.getVec4('aPosition') // (x, y, 0, 1)
        const color = attribs.get('aColor')
        const { projection, transform } = resolveMVP(uniforms)
        const clip = Mat4.multiply(projection, transform).transformVec4(pos)
        return {
            position: clip,
            varyings: color ? [color[0], color[1], color[2], color[3]] : [1, 1, 1, 1],
        }
    },
}

export const colorFragmentStage: FragmentStageSource = {
    main(input: FragmentInput, _uniforms: Uniforms): Vec4 {
        const c = input.varyings
        return new Vec4(c[0], c[1], c[2], c[3])
    },
}

// ========== 纹理着色器（aPosition + aUV -> 纹理采样）==========

export const textureVertexStage: VertexStageSource = {
    attribs: [
        { name: 'aPosition', size: 2 },
        { name: 'aUV', size: 2 },
    ],
    uniforms: ['uProjection', 'uTransform'],
    main(attribs: AttribView, uniforms: Uniforms): VertexOutput {
        const pos = attribs.getVec4('aPosition')
        const uv = attribs.get('aUV')
        const { projection, transform } = resolveMVP(uniforms)
        const clip = Mat4.multiply(projection, transform).transformVec4(pos)
        return {
            position: clip,
            varyings: uv ? [uv[0], uv[1]] : [0, 0],
        }
    },
}

export const textureFragmentStage: FragmentStageSource = {
    uniforms: ['uTexture', 'uColor'],
    main(input: FragmentInput, uniforms: Uniforms): Vec4 {
        const texture = uniforms.uTexture
        const color = (uniforms.uColor as Vec4 | undefined) ?? new Vec4(1, 1, 1, 1)
        const uv = new Vec2(input.varyings[0], input.varyings[1])
        const texColor = texture ? input.sample2D(texture as CPUTexture, uv) : new Vec4(1, 1, 1, 1)
        return new Vec4(
            texColor.x * color.x,
            texColor.y * color.y,
            texColor.z * color.z,
            texColor.w * color.w,
        )
    },
}

// ========== 组合好的 ShaderProgram（供 Rasterizer 直接使用）==========

export const colorShader: ShaderProgram = {
    attribs: colorVertexStage.attribs,
    vertex: colorVertexStage.main,
    fragment: colorFragmentStage.main,
}

export const textureShader: ShaderProgram = {
    attribs: textureVertexStage.attribs,
    vertex: textureVertexStage.main,
    fragment: textureFragmentStage.main,
}
