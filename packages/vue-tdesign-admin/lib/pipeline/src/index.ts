/**
 * minigfx —— 同时支持 WebGL / WebGL2 / WebGPU 的底层图形库。
 *
 * 本文件只是把三层导出汇总到一处，方便使用方
 *   import { createWebGLDevice, createWebGPUDevice, BufferUsage } from '../dist/index.js';
 *
 * 三层结构（对应"不把三种 API 抽象成一种"的要求）：
 *   core/    三端共享的契约：统一枚举、资源标识符、资源基类、设备与管线的抽象、脏标记与批处理。
 *   api/gl/  WebGL / WebGL2 适配层：GLProgram、全局状态脏标记、WebGL1 的显式降级。
 *   api/gpu/ WebGPU 适配层：GPURenderPipeline、自动推导的 bind group layout、合成 uniform 块。
 *
 * 需要下探原生 API 时用 device.gl / device.gpu、pipeline.gl / pipeline.gpu、
 * resource.native 直接拿到原生对象；另一个后端对应返回 null。
 */

// 共享契约
export * from './core/types.js';
export * from './core/errors.js';
export * from './core/handle.js';
export * from './core/resource.js';
export * from './core/debug.js';
export * from './core/stats.js';

// 数据传输与更新
export * from './core/data.js';

// 资源
export * from './core/buffer.js';
export * from './core/texture.js';
export * from './core/attribute.js';
export * from './core/vertexArray.js';
export * from './core/uniform.js';
export * from './core/uniformBlock.js';
export * from './core/bindGroup.js';

// 管线与设备
export * from './core/pipeline.js';
export * from './core/device.js';

// 自动批处理
export * from './core/batch.js';

// WebGL / WebGL2 适配层
export * from './api/gl/constants.js';
export * from './api/gl/glState.js';
export * from './api/gl/glBuffer.js';
export * from './api/gl/glTexture.js';
export * from './api/gl/glAttribute.js';
export * from './api/gl/glVertexArray.js';
export * from './api/gl/glUniform.js';
export * from './api/gl/glUniformBlock.js';
export * from './api/gl/glBindGroup.js';
export * from './api/gl/glPipeline.js';
export * from './api/gl/glRenderPass.js';
export * from './api/gl/glDevice.js';

// WebGPU 适配层
export * from './api/gpu/format.js';
export * from './api/gpu/gpuBuffer.js';
export * from './api/gpu/gpuTexture.js';
export * from './api/gpu/gpuAttribute.js';
export * from './api/gpu/gpuVertexArray.js';
export * from './api/gpu/gpuUniform.js';
export * from './api/gpu/gpuUniformBlock.js';
export * from './api/gpu/gpuBindGroup.js';
export * from './api/gpu/gpuPipeline.js';
export * from './api/gpu/gpuRenderPass.js';
export * from './api/gpu/gpuDevice.js';
