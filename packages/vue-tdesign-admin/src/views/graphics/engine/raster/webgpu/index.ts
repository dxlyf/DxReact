/**
 * WebGPU CPU 模拟 —— 完整管线。
 *
 * 目录结构：
 * - math.ts           向量/矩阵 + WebGPU 投影（NDC z∈[0,1]）
 * - types.ts          WGSL 着色器模拟 / 顶点布局 / 深度模板 / 混合类型
 * - Buffer.ts         GPUBuffer（显存缓冲模拟）
 * - Texture.ts        GPUTexture / GPUTextureView / GPUSampler
 * - Rasterizer.ts     WebGPU 约定光栅化（裁剪 z∈[0,w]、视口左上原点）
 * - WebGPURenderer.ts GPU 对象模型（GPU/Adapter/Device/Pipeline/CommandEncoder/RenderPass/Queue）
 *
 * 用法（对齐真实 WebGPU）：
 *   const adapter = await gpu.requestAdapter()
 *   const device = await adapter.requestDevice()
 *   const module = device.createShaderModule({ code: wgsl })
 *   const pipeline = device.createRenderPipeline({ vertex, fragment, primitive, depthStencil })
 *   const encoder = device.createCommandEncoder()
 *   const pass = encoder.beginRenderPass({ colorAttachments: [{ view, loadOp: 'clear', ... }] })
 *   pass.setPipeline(pipeline); pass.setVertexBuffer(0, buffer); pass.draw(3)
 *   pass.end(); device.queue.submit([encoder.finish()])
 */
export * from './math'
export * from './types'
export * from './Buffer'
export * from './Texture'
export * from './Rasterizer'
export * from './WebGPURenderer'
