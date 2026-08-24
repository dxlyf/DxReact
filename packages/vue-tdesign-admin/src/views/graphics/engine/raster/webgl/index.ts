/**
 * CPU 光栅化系统 —— 模拟 WebGL 完整管线。
 *
 * 目录结构：
 * - math.ts          向量/矩阵库
 * - types.ts         attribute/uniform/varying/着色器接口
 * - Texture.ts       CPU 纹理与采样
 * - Framebuffer.ts   颜色/深度帧缓冲
 * - Rasterizer.ts    齐次裁剪、光栅化、深度测试、混合
 * - CPURenderer.ts   WebGL 风格状态机渲染器（API 对齐 gl）
 * - shaders.ts       内置阶段着色器（模拟 GLSL 源码）
 */
export * from './math'
export * from './types'
export * from './Texture'
export * from './Framebuffer'
export * from './Rasterizer'
export * from './CPURenderer'
export * from './shaders'
