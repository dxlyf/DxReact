/**
 * 共享场景：一份管线声明 + 一份几何/纹理数据，三种后端复用。
 *
 * 这里刻意只依赖 core 层的统一类型（ShaderDataType / BufferUsage / TextureFormat ...），
 * 不写任何 WebGL / WebGPU 专有代码，因此同一个 createScene() 可以直接喂给三种设备。
 */
import {
  BufferUsage,
  FilterMode,
  GraphicsApi,
  PrimitiveTopology,
  SamplerBindingKind,
  ShaderDataType,
  ShaderStage,
  TextureDimension,
  TextureFormat,
  type Device,
  type Pipeline,
  type RenderPass,
  type VertexArray,
} from '../../dist/index.js';
import { fragmentGlsl, vertexGlsl, WGSL_SOURCE } from './shaders.js';

/** 交错顶点数据：[x, y, r, g, b, a, u, v] × 6。两个三角形顶点区间首尾相接，便于演示批处理合并。 */
const VERTICES = new Float32Array([
  // 三角形 1：顶点 0..2
  -0.6, -0.5, 1.0, 0.35, 0.35, 1.0, 0.0, 0.0,
  0.0, 0.7, 0.35, 1.0, 0.45, 1.0, 0.5, 1.0,
  0.6, -0.5, 0.35, 0.55, 1.0, 1.0, 1.0, 0.0,
  // 三角形 2：顶点 3..5
  -0.5, 0.4, 1.0, 0.9, 0.25, 1.0, 0.0, 0.0,
  0.5, 0.4, 0.25, 0.9, 1.0, 1.0, 1.0, 0.0,
  0.0, -0.6, 1.0, 0.5, 0.9, 1.0, 0.5, 1.0,
]);

/** 每个顶点的字节数：F32x2 + F32x4 + F32x2。 */
const VERTEX_STRIDE = 8 * 4;

/** 2x2 棋盘纹理（RGBA8）。 */
const PIXELS = new Uint8Array([
  255, 255, 255, 255, 48, 64, 128, 255,
  48, 64, 128, 255, 255, 255, 255, 255,
]);

const ATTRIBUTES = [
  { name: 'aPosition', format: ShaderDataType.F32x2 },
  { name: 'aColor', format: ShaderDataType.F32x4 },
  { name: 'aUv', format: ShaderDataType.F32x2 },
] as const;

const NEAREST = { magFilter: FilterMode.Nearest, minFilter: FilterMode.Nearest } as const;

export interface Scene {
  readonly pipeline: Pipeline;
  /** 在已开启的渲染通道里画一帧。 */
  render(pass: RenderPass, timeMs: number): void;
  dispose(): void;
}

export function createScene(device: Device): Scene {
  // WebGL1 没有 uniform 块：块成员会退化为同名 loose uniform，着色器源码要跟着切版本
  const webgl2 = device.api === GraphicsApi.WebGL2;

  const pipeline = device.createPipeline({
    label: 'checker-quad',
    shaders: {
      glsl: { vertex: vertexGlsl(webgl2), fragment: fragmentGlsl(webgl2) },
      wgsl: WGSL_SOURCE,
    },
    attributes: [...ATTRIBUTES],
    // 一份 uniform 块声明：WebGL2 原生 UBO / WebGL1 逐个 uniform / WebGPU uniform buffer
    blocks: { Globals: { uAngle: ShaderDataType.F32 } },
    // 一份纹理声明：WebGL 的组合采样器 / WebGPU 自动拆成 texture + sampler 两个 binding
    textures: {
      uTexture: {
        name: 'uTexture',
        kind: SamplerBindingKind.Sampler2D,
        stage: ShaderStage.Fragment,
        dimension: TextureDimension.D2,
        sampler: { ...NEAREST },
      },
    },
    state: { topology: PrimitiveTopology.TriangleList },
    targets: [{ format: device.canvasFormat }],
  });

  const vertexBuffer = device.createBuffer({
    label: 'quad.vertices',
    usage: BufferUsage.Vertex,
    data: VERTICES,
    stride: VERTEX_STRIDE,
  });

  // 属性声明在管线里，VAO 只需要提供顶点缓冲；stride/offset 由布局自动推导
  const vertexArray: VertexArray = pipeline.createVertexArray({ main: vertexBuffer });

  const texture = device.createTexture({
    label: 'checker',
    format: TextureFormat.RGBA8Unorm,
    width: 2,
    height: 2,
    data: PIXELS,
    sampler: { ...NEAREST },
  });

  // 块的真实 UBO 由管线持有：WebGL2 与 WebGPU 都能直接拿到，WebGL1 降级时为 null
  const globals = pipeline.block('Globals');
  const bindGroup = pipeline.createBindGroup({
    Globals: { kind: 'uniform', buffer: globals.buffer ?? undefined },
    uTexture: { kind: 'texture', texture },
  });

  return {
    pipeline,
    render(pass: RenderPass, timeMs: number): void {
      pass.pipeline(pipeline);
      pass.vertexArray(vertexArray);
      pass.bindGroup(bindGroup);
      // `块名.成员名` 写法在三端一致：GL 直接写 location，GPU 写进块的 staging
      pass.setUniform('Globals.uAngle', timeMs * 0.001);
      // 两次顶点区间首尾相接、状态未变的 draw 会被合并成一次原生调用
      pass.draw({ vertexCount: 3, firstVertex: 0 });
      pass.draw({ vertexCount: 3, firstVertex: 3 });
    },
    dispose(): void {
      bindGroup.destroy();
      vertexArray.destroy();
      texture.destroy();
      vertexBuffer.destroy();
      pipeline.destroy();
    },
  };
}
