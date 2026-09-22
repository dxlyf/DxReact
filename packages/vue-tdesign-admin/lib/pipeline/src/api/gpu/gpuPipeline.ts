/**
 * WebGPU 的渲染管线实现。
 *
 * 与 GL 侧（api/gl/glPipeline.ts）的差异（保留，不做抹平）：
 *  - WebGPU 没有"游离 uniform"：loose uniforms 会被管线合成为一个名为 $uniforms 的
 *    uniform block（PipelineBlockLayout.synthesized === true）。GL 侧会跳过它，
 *    这里相反 —— 必须为它建真实 UBO，并把成员视图暴露给 uniform(name)。
 *  - GPUBindGroupLayout 不能写成 layout: 'auto'：设备侧缓存（供 BindGroup 反查）需要
 *    一个稳定的布局对象，因此每个 bind group 的 entry 都由声明显式推导，再用
 *    createPipelineLayout({ bindGroupLayouts }) 建布局，并登记给设备
 *    （registerPipelineLayout），否则绑定组无法创建。
 *  - 顶点缓冲布局在 createRenderPipeline 时就固定：每槽一个 GPUVertexBufferLayout，
 *    arrayStride 取该槽声明推导出的跨度，attributes 来自 gpuVertexFormat。
 *  - 深度测试：WebGPU 没有"关闭深度测试"的开关，只能用 depthCompare='always' 表达
 *    （见 buildDepthStencil 的注释）。
 *  - shader module 的编译错误只能异步取回（getCompilationInfo），而构造函数不能 async，
 *    因此这里 fire-and-forget 地经 errorReporter 上报，而不是同步抛出。
 *
 * native 返回 GPURenderPipeline；需要下探时用 pipeline.gpu 拿到布局与绑定名反查表。
 * WebGL 侧的 gl 访问器在本后端恒为 null。
 */
import type { ResolvedAttributeDescriptor } from '../../core/attribute.js';
import type { UniformValue } from '../../core/data.js';
import type { Device } from '../../core/device.js';
import { ErrorCode, GraphicsError, errorReporter, invalidDescriptor } from '../../core/errors.js';
import {
  Pipeline,
  usesSeparateSampler,
  type ColorTargetState,
  type PipelineDescriptor,
  type PipelineLayoutView,
  type ResolvedStencilFace,
  type WebGPUPipeline,
} from '../../core/pipeline.js';
import type { Uniform } from '../../core/uniform.js';
import type { UniformBlock } from '../../core/uniformBlock.js';
import { GraphicsApi, ShaderStage, TextureDimension, VertexStepMode, type BlendComponent } from '../../core/types.js';
import {
  gpuBlendFactor,
  gpuBlendOperation,
  gpuCompare,
  gpuCullMode,
  gpuFrontFace,
  gpuSamplerBindingType,
  gpuSampleType,
  gpuStepMode,
  gpuStencilOperation,
  gpuTextureDimension,
  gpuTextureFormat,
  gpuTopology,
  gpuVertexFormat,
} from './format.js';
import type { GPUUniform } from './gpuUniform.js';
import { GPUUniformBlock } from './gpuUniformBlock.js';

/**
 * 设备侧的布局登记接口。
 * GPUGraphicsDevice 会实现 registerPipelineLayout()，把管线推导出的布局映射成
 * 一组 GPUBindGroupLayout（下标即 group 索引），供 GPUBindGroup 反查。
 */
interface PipelineLayoutSink {
  registerPipelineLayout(layout: PipelineLayoutView, layouts: readonly GPUBindGroupLayout[]): void;
}

/** ShaderStage 位掩码 -> GPUShaderStage 位掩码；未声明时默认顶点 + 片元。 */
function gpuVisibility(stage: ShaderStage | undefined): GPUShaderStageFlags {
  if (stage === undefined) return GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT;
  let flags: GPUShaderStageFlags = 0;
  if ((stage & ShaderStage.Vertex) !== 0) flags |= GPUShaderStage.VERTEX;
  if ((stage & ShaderStage.Fragment) !== 0) flags |= GPUShaderStage.FRAGMENT;
  if ((stage & ShaderStage.Compute) !== 0) flags |= GPUShaderStage.COMPUTE;
  if (flags === 0) {
    throw invalidDescriptor(`ShaderStage 值 ${stage} 无法转换为 GPUShaderStage`, {
      hint: '请使用 ShaderStage.Vertex / Fragment / Compute 的组合。',
    });
  }
  return flags;
}

export class GPUPipeline extends Pipeline {
  private readonly gpuDevice: GPUDevice;
  private readonly gpuPipeline: GPURenderPipeline;
  private readonly pipelineLayout: GPUPipelineLayout;
  private readonly colorTargets: GPUColorTargetState[];
  private readonly gpuDepthStencilFormat: GPUTextureFormat | undefined;
  private readonly vertexBufferLayouts: GPUVertexBufferLayout[];

  /** 显式推导的 bind group layout，下标即 group 索引；同时登记给设备供绑定组反查。 */
  readonly bindGroupLayouts: readonly GPUBindGroupLayout[];

  private readonly uniformMap = new Map<string, GPUUniform>();
  private readonly blockMap = new Map<string, GPUUniformBlock>();
  private readonly blockList: GPUUniformBlock[] = [];
  private readonly view: WebGPUPipeline;

  constructor(device: Device, descriptor: PipelineDescriptor, gpuDevice: GPUDevice) {
    super(device, descriptor);
    this.gpuDevice = gpuDevice;

    const wgsl = descriptor.shaders.wgsl;
    if (!wgsl) {
      throw invalidDescriptor(`${this.label}: WebGPU 后端需要 shaders.wgsl，未提供`, {
        hint: 'GLSL 只给 WebGL / WebGL2 使用；同一份管线声明可以同时提供 glsl 与 wgsl。',
      });
    }

    this.colorTargets = this.buildColorTargets();
    this.vertexBufferLayouts = this.buildVertexBufferLayouts();
    this.gpuDepthStencilFormat = this.depthStencilFormat ? gpuTextureFormat(this.depthStencilFormat) : undefined;
    this.bindGroupLayouts = this.createBindGroupLayouts();
    this.pipelineLayout = gpuDevice.createPipelineLayout({
      label: `${this.label}.layout`,
      bindGroupLayouts: this.bindGroupLayouts,
    });
    device.commands.record('gpu', 'createPipelineLayout', [this.label, this.bindGroupLayouts.length]);

    // 登记布局：GPUBindGroup 只能通过设备反查到 GPUBindGroupLayout，缺这一步绑定组建不出来
    const sink = device as Partial<PipelineLayoutSink>;
    if (typeof sink.registerPipelineLayout === 'function') {
      sink.registerPipelineLayout(this.layout, this.bindGroupLayouts);
    }

    const module = gpuDevice.createShaderModule({ label: `${this.label}.wgsl`, code: wgsl });
    this.reportCompilationErrors(module);
    this.gpuPipeline = this.buildRenderPipeline(module);
    this.buildBlocks();

    this.view = {
      pipeline: this.gpuPipeline,
      layout: this.pipelineLayout,
      bindGroupLayouts: this.bindGroupLayouts,
      bindingNames: this.layout.bindingNames(),
      device: gpuDevice,
      formats: this.colorTargets.map((target) => target.format),
      depthStencilFormat: this.gpuDepthStencilFormat,
      vertexBufferLayouts: this.vertexBufferLayouts,
    };
  }

  override get native(): GPURenderPipeline {
    return this.gpuPipeline;
  }

  override get gl(): null {
    return null;
  }

  override get gpu(): WebGPUPipeline {
    return this.view;
  }

  override uniform(name: string): Uniform | undefined {
    return this.uniformMap.get(name);
  }

  override block(name: string): UniformBlock {
    const block = this.blockMap.get(name);
    if (!block) {
      throw invalidDescriptor(`${this.label}: 未声明名为 ${name} 的 uniform 块`, {
        hint: `已声明的块: ${[...this.blockMap.keys()].join(', ') || '(空)'}`,
      });
    }
    return block;
  }

  override get blocks(): readonly UniformBlock[] {
    return this.blockList;
  }

  override setUniform(name: string, value: UniformValue): void {
    this.assertAlive('setUniform');
    // 含 '.' 的名字按 `块名.成员名` 路由到该块
    const dot = name.indexOf('.');
    if (dot > 0) {
      const blockName = name.slice(0, dot);
      const block = this.blockMap.get(blockName);
      if (!block) {
        throw invalidDescriptor(`${this.label}: 未声明名为 ${blockName} 的 uniform 块`, {
          hint: this.availableUniforms(),
        });
      }
      block.set(name.slice(dot + 1), value);
      return;
    }
    // 无 '.' 的名字必须命中合成块 $uniforms 的成员（即 loose uniform）
    const uniform = this.uniformMap.get(name);
    if (uniform) {
      uniform.set(value);
      return;
    }
    throw invalidDescriptor(`${this.label}: 未知的 uniform 名 ${name}`, { hint: this.availableUniforms() });
  }

  override setUniforms(values: Record<string, UniformValue>): void {
    for (const [name, value] of Object.entries(values)) this.setUniform(name, value);
  }

  protected override onDestroy(): void {
    // 块持有的成员视图由块自身释放，这里只断开引用
    for (const block of this.blockList) block.destroy();
    this.blockList.length = 0;
    this.blockMap.clear();
    this.uniformMap.clear();
    this.device.commands.record('gpu', 'releasePipeline', [this.label]);
  }

  // -------------------------------------------------------------------------
  // 构造期：布局与固定状态 -> 原生描述符
  // -------------------------------------------------------------------------

  /**
   * 由声明显式推导每个 bind group 的 GPUBindGroupLayout。
   *
   * 不用 layout: 'auto' 的原因：驱动推导出的布局对象无法被设备缓存复用，
   * 而 GPUBindGroup 必须用"与本管线完全一致"的布局来创建（见 gpuBindGroup.ts）。
   */
  private createBindGroupLayouts(): GPUBindGroupLayout[] {
    const layouts: GPUBindGroupLayout[] = [];
    for (let group = 0; group < this.layout.bindGroupCount; group++) {
      const entries: GPUBindGroupLayoutEntry[] = [];
      for (const block of this.layout.blocks.values()) {
        if (block.group !== group) continue;
        // 块声明没有 stage 字段，可见性默认顶点 + 片元
        entries.push({ binding: block.binding, visibility: gpuVisibility(undefined), buffer: { type: 'uniform' } });
      }
      for (const texture of this.layout.textures.values()) {
        if ((texture.group ?? 0) !== group) continue;
        const visibility = gpuVisibility(texture.stage);
        const binding = texture.binding ?? 0;
        entries.push({
          binding,
          visibility,
          texture: {
            sampleType: gpuSampleType(texture.sampleType ?? 'float'),
            viewDimension: gpuTextureDimension(texture.dimension ?? TextureDimension.D2),
          },
        });
        // WebGPU 的 texture 与 sampler 是两个 entry：sampler 紧跟纹理的 binding 之后
        if (usesSeparateSampler(texture.kind)) {
          entries.push({
            binding: binding + 1,
            visibility,
            sampler: { type: gpuSamplerBindingType(texture.sampler?.compare !== undefined) },
          });
        }
      }
      entries.sort((a, b) => a.binding - b.binding);
      layouts.push(this.gpuDevice.createBindGroupLayout({ label: `${this.label}.group${group}`, entries }));
    }
    return layouts;
  }

  /**
   * 顶点状态：按布局槽位声明顺序，每槽一个 GPUVertexBufferLayout。
   * 同槽属性共享该槽推导出的 stride 与 stepMode（GPUVertexArray 会拒绝混用）。
   */
  private buildVertexBufferLayouts(): GPUVertexBufferLayout[] {
    const resolved = new Map<string, ResolvedAttributeDescriptor>();
    for (const attribute of this.layout.attributeList) resolved.set(attribute.name, attribute);

    const layouts: GPUVertexBufferLayout[] = [];
    for (const attributes of this.layout.slots().values()) {
      const first = resolved.get(attributes[0].name)!;
      layouts.push({
        arrayStride: first.stride,
        stepMode: gpuStepMode(first.stepMode === VertexStepMode.Instance),
        attributes: attributes.map((attribute) => {
          const entry = resolved.get(attribute.name)!;
          return {
            shaderLocation: entry.location,
            offset: entry.offset,
            format: gpuVertexFormat(entry.format, entry.normalized),
          };
        }),
      });
    }
    return layouts;
  }

  /** 片元状态：targets 为空时用画布格式作为单个目标。 */
  private buildColorTargets(): GPUColorTargetState[] {
    const declared: readonly ColorTargetState[] =
      this.targets.length > 0 ? this.targets : [{ format: this.device.canvasFormat }];
    const blend = this.state.blendEnabled
      ? { color: this.blendComponent(this.state.blendColor), alpha: this.blendComponent(this.state.blendAlpha) }
      : undefined;
    return declared.map((target) => ({
      format: gpuTextureFormat(target.format),
      blend,
      // WebGPU 的 GPUColorWrite 位值 R=1,G=2,B=4,A=8，与"位序 RGBA"一致，可直接透传
      writeMask: target.writeMask,
    }));
  }

  private blendComponent(component: Required<BlendComponent>): GPUBlendComponent {
    return {
      srcFactor: gpuBlendFactor(component.srcFactor),
      dstFactor: gpuBlendFactor(component.dstFactor),
      operation: gpuBlendOperation(component.operation),
    };
  }

  /**
   * 深度模板状态。只有声明了 depthStencilFormat 才设置。
   *
   * 差异保留：WebGPU 没有"关闭深度测试"的布尔开关，只有 depthCompare。
   * state.depthTest === false 只能用 'always' 表达（任何深度都通过），
   * 这与 GL 侧 gl.DEPTH_TEST 关闭后 depthFunc 失效的语义一致。
   *
   * 另：depthBias / depthBiasSlopeScale / depthBiasClamp 在 WebGPU 里属于
   * GPUDepthStencilState（GL 侧是独立的 glPolygonOffset），因此只能在这里设置；
   * 没有深度附件时它们自然失效，与 GL 语义一致。
   */
  private buildDepthStencil(format: GPUTextureFormat): GPUDepthStencilState {
    const state = this.state;
    return {
      format,
      depthWriteEnabled: state.depthWrite,
      depthCompare: state.depthTest ? gpuCompare(state.depthCompare) : 'always',
      stencilFront: this.stencilFace(state.stencilFront),
      stencilBack: this.stencilFace(state.stencilBack),
      stencilReadMask: state.stencilReadMask,
      stencilWriteMask: state.stencilWriteMask,
      depthBias: state.depthBias,
      depthBiasSlopeScale: state.depthBiasSlopeScale,
      depthBiasClamp: state.depthBiasClamp,
    };
  }

  private stencilFace(face: ResolvedStencilFace): GPUStencilFaceState {
    return {
      compare: gpuCompare(face.compare),
      failOp: gpuStencilOperation(face.failOp),
      depthFailOp: gpuStencilOperation(face.depthFailOp),
      passOp: gpuStencilOperation(face.passOp),
    };
  }

  private buildPrimitive(): GPUPrimitiveState {
    const state = this.state;
    return {
      topology: gpuTopology(state.topology),
      cullMode: gpuCullMode(state.cullMode),
      frontFace: gpuFrontFace(state.frontFace),
    };
  }

  private buildRenderPipeline(module: GPUShaderModule): GPURenderPipeline {
    const pipeline = this.gpuDevice.createRenderPipeline({
      label: this.label,
      layout: this.pipelineLayout,
      vertex: {
        module,
        entryPoint: this.shaders.vertexEntryPoint ?? 'vs_main',
        buffers: this.vertexBufferLayouts,
      },
      fragment: {
        module,
        entryPoint: this.shaders.fragmentEntryPoint ?? 'fs_main',
        targets: this.colorTargets,
      },
      primitive: this.buildPrimitive(),
      depthStencil: this.gpuDepthStencilFormat ? this.buildDepthStencil(this.gpuDepthStencilFormat) : undefined,
      multisample: { count: this.sampleCount },
    });
    this.device.commands.record('gpu', 'createRenderPipeline', [this.label]);
    return pipeline;
  }

  /** 为每个块布局（含合成块 $uniforms）建真实 UBO，并登记 loose uniform 的成员视图。 */
  private buildBlocks(): void {
    for (const blockLayout of this.layout.blocks.values()) {
      const block = new GPUUniformBlock(this.device, blockLayout, this.gpuDevice);
      this.blockMap.set(blockLayout.name, block);
      this.blockList.push(block);
    }
    const synthesized = this.layout.synthesizedBlock();
    const synthBlock = synthesized ? this.blockMap.get(synthesized.name) : undefined;
    if (!synthBlock) return;
    // 合成块内每个成员就是一个 loose uniform，按布局偏移建好的视图直接暴露给 uniform(name)
    for (const name of this.layout.uniforms.keys()) {
      const uniform = synthBlock.uniform(name);
      if (uniform) this.uniformMap.set(name, uniform);
    }
  }

  /**
   * 取回 WGSL 编译日志并上报 error 级消息。
   * createShaderModule 本身不抛错，构造期又不能等待 Promise，因此这里 fire-and-forget。
   */
  private reportCompilationErrors(module: GPUShaderModule): void {
    if (typeof module.getCompilationInfo !== 'function') return;
    module
      .getCompilationInfo()
      .then((info) => {
        const errors = info.messages.filter((message) => message.type === 'error');
        if (errors.length === 0) return;
        errorReporter.report(
          new GraphicsError(`${this.label}: WGSL 编译失败`, {
            code: ErrorCode.ShaderCompileError,
            api: GraphicsApi.WebGPU,
            resource: this.label,
            details: errors.map((message) => `line ${message.lineNum}:${message.linePos} ${message.message}`).join('\n'),
          }),
          'error',
        );
      })
      .catch(() => {
        // 取不到编译信息不致命：管线创建失败时 createRenderPipeline 会给出原生错误
      });
  }

  private availableUniforms(): string {
    const loose = [...this.uniformMap.keys()];
    const blocks = [...this.blockMap.keys()];
    const names = [...loose, ...blocks.flatMap((block) => [...this.blockMap.get(block)!.layout.byName.keys()].map((member) => `${block}.${member}`))];
    return `可用名字: ${names.join(', ') || '(空)'}（含 '.' 的按 块名.成员名 路由）`;
  }
}
