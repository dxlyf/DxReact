/**
 * WebGPU 设备。
 *
 * 与 WebGL 侧的差异（保留，不做抹平），也正是本文件存在的原因：
 *  - 初始化是异步的：WebGL 只用一个同步的 getContext，WebGPU 需要
 *    `navigator.gpu.requestAdapter()` -> `adapter.requestDevice()` 两级 await，
 *    因此工厂是 `createWebGPUDevice(): Promise<GPUGraphicsDevice>` 而不是同步函数。
 *  - 上下文就是设备：WebGL 的"上下文"与"设备"是同一个对象；
 *    WebGPU 的绘制入口是 GPUDevice，画布是一个独立的 GPUCanvasContext，
 *    它必须 `configure({ device, format, usage })` 之后才能 getCurrentTexture()。
 *    两者都在这里持有（native / gpu 返回 GPUDevice，canvasContext 返回画布上下文）。
 *  - 设备可异步丢失：WebGL 用同步的 isContextLost()；WebGPU 只能通过
 *    `device.lost` 这个 Promise 得知，因此这里 fire-and-forget 地记下丢失标志，
 *    丢失后拒绝创建新资源，而不是让原生调用以校验错误的形式延迟爆发。
 *  - 能力/限制来自 adapter（或复用设备自身）的 limits / features：
 *    WebGPU 没有 GL 的"扩展"概念，可选能力用 feature 名表达。
 *
 * 本文件导出的类名刻意叫 GPUGraphicsDevice 而不是 GPUDevice，
 * 避免遮蔽 @webgpu/types 的全局 GPUDevice 类型。
 */
import {
  Device,
  type DeviceInit,
  type FrameDescriptor,
} from '../../core/device.js';
import type { DebugConfig } from '../../core/debug.js';
import type { BufferDescriptor } from '../../core/buffer.js';
import type { BindGroupDescriptor } from '../../core/bindGroup.js';
import { disposedError, unsupported } from '../../core/errors.js';
import type { PipelineDescriptor, PipelineLayoutView } from '../../core/pipeline.js';
import type { SamplerDescriptor, TextureDescriptor } from '../../core/texture.js';
import type { VertexArrayDescriptor } from '../../core/vertexArray.js';
import {
  GraphicsApi,
  // TextureFormat 既当类型用（options.format），也当值用（无画布时的回退格式），必须值导入
  TextureFormat,
  type DeviceCapabilities,
  type DeviceLimits,
} from '../../core/types.js';
import { gpuTextureFormat } from './format.js';
import { GPUBuffer } from './gpuBuffer.js';
import { GPUSampler, GPUTexture } from './gpuTexture.js';
import { GPUVertexArray } from './gpuVertexArray.js';
import { GPUBindGroup } from './gpuBindGroup.js';
import { GPUPipeline } from './gpuPipeline.js';
import { GPURenderPass } from './gpuRenderPass.js';

export interface WebGPUDeviceOptions {
  canvas?: HTMLCanvasElement | OffscreenCanvas | null;
  device?: GPUDevice; // 复用已有设备
  adapter?: GPUAdapter; // 复用已有适配器
  powerPreference?: GPUPowerPreference;
  debug?: boolean | Partial<DebugConfig>;
  label?: string;
  /** 画布格式，默认 navigator.gpu.getPreferredCanvasFormat() */
  format?: TextureFormat;
  /** 是否要求 alpha 模式（configure 的 alphaMode），默认 'opaque' */
  alphaMode?: GPUCanvasAlphaMode;
  /** 明确不可用时是否抛错，默认 true（为 false 时返回一个 lost 状态的设备） */
  required?: boolean;
}

/**
 * 能力探测。
 *
 * 来源是 GPUAdapter / GPUDevice 的 features（ReadonlySet<GPUFeatureName>）。
 * 与 WebGL 的差异：WebGPU 没有"扩展"这一层，可选能力以 feature 名表达，
 * 因此这里既推导各项布尔能力，也把 feature 名原样放进 extensions 列表
 * （例如 'timestamp-query' / 'float32-filterable'），便于使用方自行判断。
 */
function detectCapabilities(features: ReadonlySet<string>): DeviceCapabilities {
  return {
    api: GraphicsApi.WebGPU,
    // WebGPU 没有原生 VAO（GPUVertexArray.native 恒为 null），属性布局在建管线时固定
    vertexArrayObjects: false,
    instancing: true,
    uniformBuffers: true,
    storageBuffers: true,
    computeShaders: true,
    elementIndexUint: true,
    floatTextures: true,
    depthTextures: true,
    // WebGPU 采样器没有各向异性过滤，也没有对应的 feature 可探测
    anisotropy: false,
    extensions: [...features],
  };
}

/**
 * 限制探测。
 *
 * WebGPU 的 limits 语义比 GL 更细（按着色器阶段分别限额），这里映射到 core 的统一字段；
 * 没有直接对应项的按最接近的语义取值，并在注释里标出来源。
 */
function detectLimits(limits: GPUSupportedLimits): DeviceLimits {
  return {
    maxVertexAttributes: limits.maxVertexAttributes,
    maxTextureSize: limits.maxTextureDimension2D,
    // GL 的"纹理单元"在 WebGPU 里对应每个着色器阶段可采样的纹理数
    maxTextureUnits: limits.maxSampledTexturesPerShaderStage,
    maxUniformBufferBindings: limits.maxUniformBuffersPerShaderStage,
    maxUniformBlockSize: limits.maxUniformBufferBindingSize,
    maxBindGroups: limits.maxBindGroups,
    maxVertexBuffers: limits.maxVertexBuffers,
    maxBufferSize: limits.maxBufferSize,
  };
}

/** 从画布取 WebGPU 上下文。联合类型的 getContext 重载无法直接调用，沿用 GL 侧的 bind + 断言写法。 */
function acquireCanvasContext(canvas: HTMLCanvasElement | OffscreenCanvas): GPUCanvasContext | null {
  const getContext = canvas.getContext.bind(canvas) as (id: 'webgpu') => GPUCanvasContext | null;
  return getContext('webgpu');
}

export class GPUGraphicsDevice extends Device {
  private readonly gpuDevice: GPUDevice;
  private readonly context: GPUCanvasContext | null;
  /** 画布配置；setCanvasSize 后原样重放，实际的纹理尺寸由画布自身决定 */
  private readonly canvasConfiguration: GPUCanvasConfiguration | null;
  /** 布局 -> bind group layout 反查表；布局由管线独占持有，用 WeakMap 免去显式清理 */
  private readonly layouts = new WeakMap<PipelineLayoutView, readonly GPUBindGroupLayout[]>();
  private deviceLost = false;

  constructor(gpuDevice: GPUDevice, adapter: GPUAdapter | null, options: WebGPUDeviceOptions) {
    // 无 canvas 时也要给出一个格式（管线默认渲染目标），失败时退回最通用的 RGBA8
    const preferred = (navigator.gpu?.getPreferredCanvasFormat() ?? TextureFormat.RGBA8Unorm) as TextureFormat;
    const format = options.format ?? preferred;
    // 复用路径可能只给了 device：GPUDevice 自身也暴露 limits / features，口径与 adapter 一致
    const limitsSource = adapter?.limits ?? gpuDevice.limits;
    const featuresSource = adapter?.features ?? gpuDevice.features;
    // 能力与限制必须先于 super() 算好：Device 的构造需要它们
    const init: DeviceInit = {
      api: GraphicsApi.WebGPU,
      label: options.label ?? GraphicsApi.WebGPU,
      canvas: options.canvas ?? null,
      capabilities: detectCapabilities(featuresSource),
      limits: detectLimits(limitsSource),
      debug: options.debug,
      canvasFormat: format,
    };
    super(init);
    this.gpuDevice = gpuDevice;

    const context = options.canvas ? acquireCanvasContext(options.canvas) : null;
    this.context = context;
    this.canvasConfiguration = context
      ? {
          device: gpuDevice,
          format: gpuTextureFormat(format),
          alphaMode: options.alphaMode ?? 'opaque',
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
        }
      : null;
    if (context) this.configureCanvas();

    // device.lost 是 Promise：丢失原因异步到达，这里 fire-and-forget 地记下标志与命令
    void gpuDevice.lost.then((info) => {
      this.deviceLost = true;
      this.commands.record('gpu', 'deviceLost', [info.reason, info.message]);
      // WebGPU 的设备不会恢复（recoverable=false）：必须重建 GPUDevice 与画布配置
      this.notifyContextLost(info.message || info.reason, false);
    });
  }

  override get native(): GPUDevice {
    return this.gpuDevice;
  }

  override get gpu(): GPUDevice {
    return this.gpuDevice;
  }

  /** 画布上下文；没有关联画布时为 null。 */
  get canvasContext(): GPUCanvasContext | null {
    return this.context;
  }

  override get lost(): boolean {
    return this.deviceLost;
  }

  override get canvasSize(): { width: number; height: number } {
    const canvas = this.canvas;
    if (!canvas) return { width: 0, height: 0 };
    return { width: canvas.width, height: canvas.height };
  }

  /** 设置画布像素尺寸并重新 configure 交换链（整数像素）。 */
  override setCanvasSize(width: number, height: number): void {
    this.assertAlive('setCanvasSize');
    const canvas = this.canvas;
    if (canvas) {
      canvas.width = Math.max(1, Math.floor(width));
      canvas.height = Math.max(1, Math.floor(height));
    }
    // 尺寸变了必须重新 configure，否则 getCurrentTexture 仍会给出旧尺寸的交换链纹理
    this.configureCanvas();
  }

  // -------------------------------------------------------------------------
  // 资源工厂
  // -------------------------------------------------------------------------

  override createBuffer(descriptor: BufferDescriptor): GPUBuffer {
    this.assertOperable('createBuffer');
    return new GPUBuffer(this, descriptor, this.gpuDevice);
  }

  override createTexture(descriptor: TextureDescriptor): GPUTexture {
    this.assertOperable('createTexture');
    return new GPUTexture(this, descriptor, this.gpuDevice);
  }

  override createSampler(descriptor?: SamplerDescriptor): GPUSampler {
    this.assertOperable('createSampler');
    return new GPUSampler(this, descriptor, this.gpuDevice);
  }

  override createVertexArray(descriptor: VertexArrayDescriptor): GPUVertexArray {
    this.assertOperable('createVertexArray');
    return new GPUVertexArray(this, descriptor);
  }

  override createBindGroup(descriptor: BindGroupDescriptor): GPUBindGroup {
    this.assertOperable('createBindGroup');
    return new GPUBindGroup(this, descriptor, this.gpuDevice);
  }

  override createPipeline(descriptor: PipelineDescriptor): GPUPipeline {
    this.assertOperable('createPipeline');
    const pipeline = new GPUPipeline(this, descriptor, this.gpuDevice);
    // 管线创建时登记布局 -> bind group layout，绑定组创建时按需反查（见 gpuBindGroup.ts）
    const gpu = pipeline.gpu;
    if (gpu) this.registerPipelineLayout(pipeline.layout, gpu.bindGroupLayouts);
    return pipeline;
  }

  override beginFrame(descriptor: FrameDescriptor = {}): GPURenderPass {
    this.assertOperable('beginFrame');
    // 画布当前帧的纹理视图只能每帧取一次，交给 RenderPass 作为默认颜色附件
    return new GPURenderPass(this, descriptor, this.gpuDevice, this.currentCanvasView());
  }

  // -------------------------------------------------------------------------
  // 布局登记（GPUBindGroup 反查用）
  // -------------------------------------------------------------------------

  /** 管线创建时登记，绑定组按需反查（GPUBindGroup 会调用）。 */
  registerPipelineLayout(layout: PipelineLayoutView, layouts: readonly GPUBindGroupLayout[]): void {
    this.layouts.set(layout, layouts);
  }

  /** GPUBindGroup 用它取自己 group 对应的布局；未登记时返回 undefined。 */
  bindGroupLayoutFor(layout: PipelineLayoutView): readonly GPUBindGroupLayout[] | undefined {
    return this.layouts.get(layout);
  }

  /** 画布当前帧的纹理视图（每帧调用一次即可）。 */
  currentCanvasView(): GPUTextureView | null {
    if (!this.context) return null;
    return this.context.getCurrentTexture().createView();
  }

  // -------------------------------------------------------------------------

  /** 把画布配置重放到上下文（构造与 setCanvasSize 共用）。 */
  private configureCanvas(): void {
    const context = this.context;
    const configuration = this.canvasConfiguration;
    if (!context || !configuration) return;
    context.configure(configuration);
    this.commands.record('gpu', 'configureCanvas', [this.canvasSize.width, this.canvasSize.height]);
  }

  /** 工厂方法入口的守卫：设备已销毁或 device.lost 之后不允许再创建资源。 */
  private assertOperable(call: string): void {
    this.assertAlive(call);
    if (this.deviceLost) {
      throw disposedError(this.label, call);
    }
  }

  protected override releaseNative(): void {
    // 先解除画布配置，避免设备销毁后画布仍持有已失效的交换链
    this.context?.unconfigure();
    this.deviceLost = true;
    this.commands.record('gpu', 'destroyDevice', [this.label]);
    this.gpuDevice.destroy();
  }
}

/**
 * 从适配器与设备组装 WebGPU 设备。因为 requestAdapter / requestDevice 都是异步的，
 * 工厂返回 Promise 而不是同步对象。`options.device` / `options.adapter` 可复用已有实例，
 * 跳过对应的请求步骤。
 */
export async function createWebGPUDevice(options: WebGPUDeviceOptions = {}): Promise<GPUGraphicsDevice> {
  const gpu = navigator.gpu;
  if (!gpu) {
    // required === false 时也不返回"半可用设备"：没有原生 API 就没有任何可下探的对象，
    // 返回 lost 设备只会把错误推迟到第一次使用时，这里直接抛错以保证失败尽早可见。
    throw unsupported('当前环境没有 navigator.gpu，无法创建 WebGPU 设备', {
      api: GraphicsApi.WebGPU,
      call: 'createWebGPUDevice',
      hint: '请确认运行在支持 WebGPU 的浏览器（Chrome 113+ / Edge 113+），且未被隐私策略禁用。',
    });
  }

  let adapter = options.adapter ?? null;
  if (!adapter) {
    adapter = await gpu.requestAdapter({ powerPreference: options.powerPreference });
  }
  if (!adapter) {
    throw unsupported('WebGPU 没有可用的适配器（requestAdapter 返回 null）', {
      api: GraphicsApi.WebGPU,
      call: 'requestAdapter',
      hint: '可能是显卡驱动被屏蔽或处于软件降级环境；可尝试打开浏览器的 WebGPU 实验开关。',
    });
  }

  const device = options.device ?? (await adapter.requestDevice({ label: options.label }));
  return new GPUGraphicsDevice(device, adapter, options);
}
