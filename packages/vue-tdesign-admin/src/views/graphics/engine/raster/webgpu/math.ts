/**
 * WebGPU CPU 模拟 —— 数学库。
 * 向量/矩阵直接复用 webgl 版本（同一套列主序 Mat4），
 * 但 WebGPU 的 NDC 深度范围是 [0,1]（WebGL 是 [-1,1]），
 * 所以这里补充 WebGPU 约定的投影矩阵生成函数。
 */
export { Vec2, Vec3, Vec4, Mat4 } from '../webgl/math'
import { Mat4 } from '../webgl/math'

/**
 * WebGPU 透视投影矩阵（列主序）。
 * 与 WebGL 版 Mat4.perspective 的唯一区别：z∈[near,far] 映射到 NDC [0,1]。
 *   m[10] = far / (near - far)，m[14] = near*far / (near - far)
 * 推导：z_ndc = (far*z + near*far)/( (near-far)*z )，当 z=near → 0，z=far → 1。
 */
export function perspectiveZeroToOne(fovy: number, aspect: number, near: number, far: number): Mat4 {
    const f = 1 / Math.tan(fovy / 2)
    const nf = 1 / (near - far)
    const m = new Float32Array(16)
    m[0] = f / aspect
    m[5] = f
    m[10] = far * nf
    m[11] = -1
    m[14] = far * near * nf
    return new Mat4(m)
}

/** WebGPU 正交投影矩阵（列主序），z∈[near,far] → NDC [0,1] */
export function orthoZeroToOne(left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4 {
    const lr = 1 / (left - right)
    const bt = 1 / (bottom - top)
    const nf = 1 / (near - far)
    const m = new Float32Array(16)
    m[0] = -2 * lr
    m[5] = -2 * bt
    m[10] = nf
    m[12] = (left + right) * lr
    m[13] = (top + bottom) * bt
    m[14] = near * nf
    m[15] = 1
    return new Mat4(m)
}
