/**
 * 渲染管线资源。
 *
 * 管线的职责是把"着色器 + 入参声明 + 固定状态"打包成一个对象，
 * 让使用方在创建之后可以用名字直接访问入参：
 *   pipeline.setUniform('uColor', [1, 0, 0, 1]);
 *   pipeline.block('Globals').set('uTime', t);
 *   pipeline.createVertexArray({ main: vbo });
 *   pipeline.createBindGroup({ Globals: { buffer: ubo }, uTexture: { texture: tex } });
 *
 * 差异保留（这是本文件最关键的设计）：
 *  - WebGL / WebGL2：管线对象 = 已链接的 GLProgram + 反射出的入参位置表。
 *    见 WebGLPipeline。属性有 attribute location，uniform 有 WebGLUniformLocation，
 *    uniform 块有 block index（WebGL2）。可以据此直接调用原生 API。
 *  - WebGPU：管线对象 = GPURenderPipeline + 自动推导的 GPUPipelineLayout /
 *    GPUBindGroupLayout。见 WebGPUPipeline。声明里的属性位置、binding 序号、
 *    uniform 块的尺寸都由声明推导，不需要手写 GPUBindGroupLayoutDescriptor。
 *    注意 WebGPU 没有"游离 uniform"：loose uniforms 会被自动打包进一个合成的
 *    uniform block（名为 $uniforms），其布局同样按 std140 推导。
 *
 * 两端共享同一份声明（PipelineDescriptor），因此同一套使用代码可以跑在三种 API 上，
 * 而 gl / gpu 两个访问器分别暴露各 API 的原生对象，需要下探时不会被挡住。
 */
import {
  resolveAttributeDescriptor,
  type AttributeDescriptor,
  type ResolvedAttributeDescriptor,
} from './attribute.js';
import type { BindGroup, BindGroupEntry } from './bindGroup.js';
import type { Buffer } from './buffer.js';
import { computeStd140Layout, type Std140Layout, type UniformValue } from './data.js';
import type { Device } from './device.js';
import { invalidDescriptor } from './errors.js';
import { ResourceKind } from './handle.js';
import { Resource } from './resource.js';
import type { SamplerDescriptor } from './texture.js';
import type { Uniform, UniformDescriptor } from './uniform.js';
import { normalizeBlockMembers, type UniformBlock, type UniformBlockDescriptor, type UniformBlockMembers } from './uniformBlock.js';
import {
  BlendFactor,
  BlendOperation,
  BufferFrequency,
  byteSize,
  CompareFunction,
  CullMode,
  FrontFace,
  PrimitiveTopology,
  SamplerBindingKind,
  ShaderDataType,
  ShaderStage,
  StencilOperation,
  TextureDimension,
  type TextureFormat,
  type PipelineState,
  type BlendComponent,
  type BlendState,
  type StencilFaceState,
} from './types.js';
import type { BufferBinding, VertexArray } from './vertexArray.js';

/** 游离 uniform 在 WebGPU 侧被合成到的块名。 */
export const SYNTHESIZED_UNIFORM_BLOCK = '$uniforms';

/** WebGPU 纹理绑定的采样类型。与 GPUTextureSampleType 对应。 */
export type TextureSampleType = 'float' | 'unfilterable-float' | 'depth' | 'sint' | 'uint';

/**
 * 纹理入参声明。
 *
 * WebGL 下 `texture` 与 `sampler` 是同一样东西（采样状态写在纹理对象上），
 * WebGPU 下必须成对出现的两个 entry 由库自动拆分，因此这里只声明一次。
 */
export interface TextureBindingDescriptor {
  name: string;
  /** 绑定形态，默认 Sampler2D */
  kind?: SamplerBindingKind;
  /** 显式指定 binding 序号（WebGPU）。省略时按声明顺序自动分配 */
  binding?: number;
  /** bind group 索引（WebGPU），默认 0 */
  group?: number;
  /** 可见的着色器阶段，WebGPU 建布局时使用 */
  stage?: ShaderStage;
  dimension?: TextureDimension;
  sampleType?: TextureSampleType;
  /** 声明纹理格式，WebGPU 建布局时可用于校验 */
  format?: TextureFormat;
  /** 纹理采样参数（WebGL 写在纹理上，WebGPU 生成独立 sampler） */
  sampler?: SamplerDescriptor;
}

/** 由声明推导出的 uniform 块布局。WebGL2 的 UBO 与 WebGPU 的 uniform buffer 共用。 */
export interface PipelineBlockLayout {
  name: string;
  /** WebGPU 的 binding 序号 / WebGL2 的 block binding */
  binding: number;
  group: number;
  frequency: BufferFrequency;
  layout: Std140Layout;
  /** 由 loose uniforms 合成（WebGPU 专用），GL 侧不会为它创建 UBO */
  synthesized?: boolean;
}

/**
 * 管线布局视图。
 *
 * 它是"着色器需要哪些入参"的只读描述，被 VertexArray 与 BindGroup 用来
 * 快速生成自己的入参（不需要再手写一遍属性声明或 binding 序号）。
 */
export interface PipelineLayoutView {
  readonly label: string;
  /** 属性名 -> 属性声明 */
  readonly attributes: ReadonlyMap<string, AttributeDescriptor>;
  readonly attributeList: readonly AttributeDescriptor[];
  /** uniform 名 -> uniform 声明 */
  readonly uniforms: ReadonlyMap<string, UniformDescriptor>;
  /** 块名 -> 块布局 */
  readonly blocks: ReadonlyMap<string, PipelineBlockLayout>;
  /** 纹理名 -> 纹理绑定声明 */
  readonly textures: ReadonlyMap<string, TextureBindingDescriptor>;
  /** 声明涉及的 bind group 数量（WebGL 侧恒为 1） */
  readonly bindGroupCount: number;
  /** 顶点缓冲槽名 -> 该槽的属性声明（保持声明顺序） */
  slots(): ReadonlyMap<string, readonly AttributeDescriptor[]>;
  /** loose uniforms 合成的块；没有 loose uniforms 时返回 null */
  synthesizedBlock(): PipelineBlockLayout | null;
  /** 名字对应的 binding 序号（uniform 块或纹理）；未声明时抛错 */
  bindingOf(name: string): number;
  /** 名字所在的 bind group 索引；未声明时视为默认组 */
  groupOf(name: string): number;
}

function isBlockDescriptor(value: UniformBlockMembers | UniformBlockDescriptor): value is UniformBlockDescriptor {
  return typeof value === 'object' && value !== null && 'members' in value;
}

function normalizeUniform(value: ShaderDataType | UniformDescriptor, name: string): UniformDescriptor {
  if (typeof value === 'string') return { name, type: value };
  return { ...value, name: value.name ?? name };
}

/** 由声明推导出的管线布局。两个适配层共用同一份推导结果，避免各写一套。 */
export class PipelineLayout implements PipelineLayoutView {
  readonly label: string;
  readonly attributes: Map<string, AttributeDescriptor>;
  readonly attributeList: ResolvedAttributeDescriptor[];
  readonly uniforms: Map<string, UniformDescriptor>;
  readonly blocks: Map<string, PipelineBlockLayout>;
  readonly textures: Map<string, TextureBindingDescriptor>;
  readonly bindGroupCount: number;

  private readonly slotMap = new Map<string, AttributeDescriptor[]>();
  private readonly synthesized: PipelineBlockLayout | null;
  /** 名字（块名 / 纹理名）-> 所属 bind group */
  private readonly groupByName = new Map<string, number>();

  constructor(descriptor: {
    label: string;
    attributes?: readonly AttributeDescriptor[];
    uniforms?: Record<string, ShaderDataType | UniformDescriptor>;
    blocks?: Record<string, UniformBlockMembers | UniformBlockDescriptor>;
    textures?: Record<string, TextureBindingDescriptor>;
    packUniforms?: boolean;
  }) {
    this.label = descriptor.label;
    this.attributes = new Map();
    this.attributeList = resolveAttributes(descriptor.attributes ?? [], this.label, this.attributes, this.slotMap);
    this.uniforms = new Map();
    this.blocks = new Map();
    this.textures = new Map();

    const uniformEntries = Object.entries(descriptor.uniforms ?? {});
    uniformEntries.forEach(([name, value], index) => {
      const uniform = normalizeUniform(value, name);
      this.uniforms.set(name, { ...uniform, location: uniform.location ?? index });
    });

    // binding 序号在同一个 group 内必须唯一，因此块与纹理共用一个分配计数器
    const counters = new Map<number, number>();
    const nextBinding = (group: number): number => {
      const current = counters.get(group) ?? 0;
      counters.set(group, current + 1);
      return current;
    };
    const claim = (group: number, binding?: number): number => {
      if (binding === undefined) return nextBinding(group);
      const current = counters.get(group) ?? 0;
      if (binding >= current) counters.set(group, binding + 1);
      return binding;
    };

    for (const [name, value] of Object.entries(descriptor.blocks ?? {})) {
      const block = isBlockDescriptor(value) ? value : { name, members: value };
      const group = block.group ?? 0;
      this.blocks.set(name, {
        name,
        group,
        binding: claim(group, block.binding),
        frequency: block.frequency ?? BufferFrequency.Dynamic,
        layout: computeStd140Layout(normalizeBlockMembers(block.members)),
      });
      this.groupByName.set(name, group);
    }

    for (const [name, texture] of Object.entries(descriptor.textures ?? {})) {
      const group = texture.group ?? 0;
      const resolved: TextureBindingDescriptor = { ...texture, name, group, binding: claim(group, texture.binding) };
      this.textures.set(name, resolved);
      this.groupByName.set(name, group);
      // WebGPU 下 texture 与 sampler 是两个 entry，为 sampler 预留一个序号
      if (usesSeparateSampler(resolved.kind)) claim(group, undefined);
    }

    const packUniforms = descriptor.packUniforms ?? true;
    this.synthesized =
      packUniforms && this.uniforms.size > 0
        ? {
            name: SYNTHESIZED_UNIFORM_BLOCK,
            group: 0,
            binding: nextBinding(0),
            frequency: BufferFrequency.Dynamic,
            synthesized: true,
            layout: computeStd140Layout(
              [...this.uniforms.values()].map((uniform) => ({
                name: uniform.name,
                type: uniform.type,
                count: uniform.count,
              })),
            ),
          }
        : null;
    if (this.synthesized) this.blocks.set(this.synthesized.name, this.synthesized);
    this.groupByName.set(SYNTHESIZED_UNIFORM_BLOCK, 0);

    this.bindGroupCount = Math.max(1, ...[...counters.keys()].map((group) => group + 1));
  }

  slots(): ReadonlyMap<string, readonly AttributeDescriptor[]> {
    return this.slotMap;
  }

  synthesizedBlock(): PipelineBlockLayout | null {
    return this.synthesized;
  }

  bindingOf(name: string): number {
    const block = this.blocks.get(name);
    if (block) return block.binding;
    const texture = this.textures.get(name);
    if (texture) return texture.binding ?? 0;
    throw invalidDescriptor(`${this.label}: 管线未声明名为 ${name} 的绑定项`, {
      hint: `已声明的绑定项: ${[...this.blocks.keys(), ...this.textures.keys()].join(', ') || '(空)'}`,
    });
  }

  groupOf(name: string): number {
    return this.groupByName.get(name) ?? 0;
  }

  /** 每个 bind group 内"binding 序号 -> 声明名"的反查表，调试与原生下探时用。 */
  bindingNames(): ReadonlyMap<number, string>[] {
    const result: Map<number, string>[] = [];
    for (let group = 0; group < this.bindGroupCount; group++) result.push(new Map());
    for (const block of this.blocks.values()) result[block.group]?.set(block.binding, block.name);
    for (const texture of this.textures.values()) {
      const target = result[texture.group ?? 0];
      if (!target) continue;
      target.set(texture.binding ?? 0, texture.name);
      if (usesSeparateSampler(texture.kind)) target.set((texture.binding ?? 0) + 1, `${texture.name}$sampler`);
    }
    return result;
  }
}

/** WebGPU 下是否需要为纹理单独生成一个 sampler entry。 */
export function usesSeparateSampler(kind: SamplerBindingKind | undefined): boolean {
  const resolved = kind ?? SamplerBindingKind.Sampler2D;
  return resolved !== SamplerBindingKind.Texture2D;
}

/**
 * 推导属性布局。
 *
 * 同槽属性按声明顺序紧密排列（可被显式 offset / stride 覆盖），
 * location 按整体声明顺序自动分配，除非显式指定。
 */
function resolveAttributes(
  descriptors: readonly AttributeDescriptor[],
  label: string,
  byName: Map<string, AttributeDescriptor>,
  slotMap: Map<string, AttributeDescriptor[]>,
): ResolvedAttributeDescriptor[] {
  const slotEnds = new Map<string, number>();
  const slotStrides = new Map<string, number>();

  for (const descriptor of descriptors) {
    const slot = descriptor.buffer ?? 'main';
    const offset = descriptor.offset ?? (slotEnds.get(slot) ?? 0);
    const end = offset + byteSize(descriptor.format);
    if (end > (slotEnds.get(slot) ?? 0)) slotEnds.set(slot, end);
    if (descriptor.stride !== undefined) {
      slotStrides.set(slot, Math.max(slotStrides.get(slot) ?? 0, descriptor.stride));
    }
  }
  for (const [slot, end] of slotEnds) {
    slotStrides.set(slot, Math.max(slotStrides.get(slot) ?? 0, end));
  }

  const resolved: ResolvedAttributeDescriptor[] = [];
  descriptors.forEach((descriptor, index) => {
    const slot = descriptor.buffer ?? 'main';
    const attribute = resolveAttributeDescriptor(descriptor, index, slotStrides.get(slot));
    if (byName.has(attribute.name)) {
      throw invalidDescriptor(`${label}: 属性名 ${attribute.name} 重复声明`);
    }
    resolved.push(attribute);
    byName.set(attribute.name, descriptor);
    const list = slotMap.get(slot) ?? [];
    list.push(descriptor);
    slotMap.set(slot, list);
  });
  return resolved;
}

// ---------------------------------------------------------------------------
// 固定状态
// ---------------------------------------------------------------------------

export interface ResolvedStencilFace {
  compare: CompareFunction;
  failOp: StencilOperation;
  depthFailOp: StencilOperation;
  passOp: StencilOperation;
}

/** 补齐默认值的固定状态。默认值与三种 API 的原生默认值一致（关闭剔除、关闭混合）。 */
export interface ResolvedPipelineState {
  topology: PrimitiveTopology;
  cullMode: CullMode;
  frontFace: FrontFace;
  depthBias: number;
  depthBiasSlopeScale: number;
  depthBiasClamp: number;
  depthTest: boolean;
  depthWrite: boolean;
  depthCompare: CompareFunction;
  stencilTest: boolean;
  stencilReadMask: number;
  stencilWriteMask: number;
  stencilFront: ResolvedStencilFace;
  stencilBack: ResolvedStencilFace;
  blendEnabled: boolean;
  blendColor: Required<BlendComponent>;
  blendAlpha: Required<BlendComponent>;
}

function resolveStencilFace(face: StencilFaceState | undefined): ResolvedStencilFace {
  return {
    compare: face?.compare ?? CompareFunction.Always,
    failOp: face?.failOp ?? StencilOperation.Keep,
    depthFailOp: face?.depthFailOp ?? StencilOperation.Keep,
    passOp: face?.passOp ?? StencilOperation.Keep,
  };
}

export function resolvePipelineState(state: PipelineState = {}): ResolvedPipelineState {
  const rasterizer = state.rasterizer ?? {};
  const depth = state.depthStencil ?? {};
  const blend: BlendState = state.blend ?? {};
  const color = blend.color ?? {};
  const alpha = blend.alpha ?? {};
  return {
    topology: state.topology ?? PrimitiveTopology.TriangleList,
    cullMode: rasterizer.cullMode ?? CullMode.None,
    frontFace: rasterizer.frontFace ?? FrontFace.CCW,
    depthBias: rasterizer.depthBias ?? 0,
    depthBiasSlopeScale: rasterizer.depthBiasSlopeScale ?? 0,
    depthBiasClamp: rasterizer.depthBiasClamp ?? 0,
    depthTest: depth.depthTest ?? false,
    depthWrite: depth.depthWrite ?? false,
    depthCompare: depth.depthCompare ?? CompareFunction.Less,
    stencilTest: depth.stencilTest ?? false,
    stencilReadMask: depth.stencilReadMask ?? 0xff,
    stencilWriteMask: depth.stencilWriteMask ?? 0xff,
    stencilFront: resolveStencilFace(depth.stencilFront),
    stencilBack: resolveStencilFace(depth.stencilBack),
    blendEnabled: blend.enabled ?? false,
    blendColor: {
      srcFactor: color.srcFactor ?? BlendFactor.One,
      dstFactor: color.dstFactor ?? BlendFactor.Zero,
      operation: color.operation ?? BlendOperation.Add,
    },
    blendAlpha: {
      srcFactor: alpha.srcFactor ?? BlendFactor.One,
      dstFactor: alpha.dstFactor ?? BlendFactor.Zero,
      operation: alpha.operation ?? BlendOperation.Add,
    },
  };
}

// ---------------------------------------------------------------------------
// 各 API 的渲染管线对象
// ---------------------------------------------------------------------------

/**
 * WebGL / WebGL2 的渲染管线对象。
 *
 * program 链接完成后由 GLPipeline 填充：入参位置表来自着色器反射，
 * 因此使用方不需要再手写一遍 uniform 名字对应的 location。
 */
export interface WebGLPipeline {
  readonly program: WebGLProgram;
  readonly vertexShader: WebGLShader;
  readonly fragmentShader: WebGLShader;
  /** 属性名 -> attribute location */
  readonly attributeLocations: ReadonlyMap<string, number>;
  /** uniform 名 -> WebGLUniformLocation */
  readonly uniformLocations: ReadonlyMap<string, WebGLUniformLocation>;
  /** uniform 块名 -> block index（仅 WebGL2） */
  readonly blockIndices: ReadonlyMap<string, number>;
  /** 被驱动优化掉、实际不存在的入参名（提前暴露而不是静默失败） */
  readonly inactive: readonly string[];
  readonly context: WebGLRenderingContext | WebGL2RenderingContext;
  /** 是否为 WebGL2 上下文 */
  readonly webgl2: boolean;
}

/** WebGPU 的渲染管线对象。 */
export interface WebGPUPipeline {
  readonly pipeline: GPURenderPipeline;
  readonly layout: GPUPipelineLayout;
  readonly bindGroupLayouts: readonly GPUBindGroupLayout[];
  /** 每个 bind group 的绑定名反查表（binding -> 声明名） */
  readonly bindingNames: readonly ReadonlyMap<number, string>[];
  readonly device: GPUDevice;
  /** 颜色目标格式 */
  readonly formats: readonly GPUTextureFormat[];
  readonly depthStencilFormat?: GPUTextureFormat;
  /** WebGPU 侧的顶点缓冲布局，按槽位声明顺序排列 */
  readonly vertexBufferLayouts: readonly GPUVertexBufferLayout[];
}

// ---------------------------------------------------------------------------
// Pipeline 资源
// ---------------------------------------------------------------------------

export interface PipelineShaders {
  /** WebGL / WebGL2 使用的 GLSL 源码 */
  glsl?: { vertex: string; fragment: string };
  /** WebGPU 使用的 WGSL 源码 */
  wgsl?: string;
  /** WGSL 顶点入口名，默认 vs_main */
  vertexEntryPoint?: string;
  /** WGSL 片元入口名，默认 fs_main */
  fragmentEntryPoint?: string;
}

export interface ColorTargetState {
  format: TextureFormat;
  blend?: BlendState;
  /** 颜色写入掩码（WebGPU 的 writeMask / WebGL 的 colorMask 位掩码，位序 RGBA） */
  writeMask?: number;
}

export interface PipelineDescriptor {
  label?: string;
  /** 着色器源码。三种 API 各用各的：GLSL 给 WebGL/WebGL2，WGSL 给 WebGPU */
  shaders: PipelineShaders;
  /** 属性声明（着色器入参的顶点侧部分） */
  attributes?: readonly AttributeDescriptor[];
  /** 游离 uniform 声明。WebGPU 侧会被自动打包成一个 uniform block */
  uniforms?: Record<string, ShaderDataType | UniformDescriptor>;
  /** uniform 块声明（std140） */
  blocks?: Record<string, UniformBlockMembers | UniformBlockDescriptor>;
  /** 纹理 / 采样器声明 */
  textures?: Record<string, TextureBindingDescriptor>;
  /** 固定状态 */
  state?: PipelineState;
  /** 渲染目标格式。WebGPU 必需，省略时用设备的画布格式 */
  targets?: readonly ColorTargetState[];
  /** 深度模板附件格式 */
  depthStencilFormat?: TextureFormat;
  sampleCount?: number;
  /** WebGPU：是否把 loose uniforms 合成 uniform block，默认 true */
  packUniforms?: boolean;
}

export interface VertexArrayOptions {
  label?: string;
  indexBuffer?: Buffer;
}

export interface BindGroupOptions {
  label?: string;
  group?: number;
}

export abstract class Pipeline extends Resource {
  /** 由声明推导的布局，可直接交给 VertexArray / BindGroup 复用 */
  readonly layout: PipelineLayout;
  readonly shaders: PipelineShaders;
  readonly state: ResolvedPipelineState;
  readonly targets: readonly ColorTargetState[];
  readonly depthStencilFormat: TextureFormat | null;
  readonly sampleCount: number;

  protected constructor(device: Device, descriptor: PipelineDescriptor) {
    super(device, ResourceKind.Pipeline, descriptor.label ?? 'pipeline');
    if (!descriptor.shaders || (!descriptor.shaders.glsl && !descriptor.shaders.wgsl)) {
      throw invalidDescriptor(`${this.label}: 必须提供 shaders.glsl 或 shaders.wgsl`);
    }
    this.shaders = descriptor.shaders;
    this.state = resolvePipelineState(descriptor.state);
    this.targets = descriptor.targets ?? [];
    this.depthStencilFormat = descriptor.depthStencilFormat ?? null;
    this.sampleCount = descriptor.sampleCount ?? 1;
    this.layout = new PipelineLayout({
      label: this.label,
      attributes: descriptor.attributes,
      uniforms: descriptor.uniforms,
      blocks: descriptor.blocks,
      textures: descriptor.textures,
      packUniforms: descriptor.packUniforms,
    });
  }

  protected get device(): Device {
    return this.owner as Device;
  }

  /** 原生管线对象：WebGL 为 WebGLProgram，WebGPU 为 GPURenderPipeline。 */
  abstract get native(): WebGLProgram | GPURenderPipeline;

  /** WebGL 侧的渲染管线对象（program + 入参位置表）；非 GL 后端返回 null。 */
  abstract get gl(): WebGLPipeline | null;

  /** WebGPU 侧的渲染管线对象（pipeline + 自动推导的布局）；非 GPU 后端返回 null。 */
  abstract get gpu(): WebGPUPipeline | null;

  /** 按名字取回游离 uniform 槽。 */
  abstract uniform(name: string): Uniform | undefined;

  /**
   * 设置游离 uniform 的值。
   * WebGL 下直接作用于 uniform location；WebGPU 下写进合成 uniform block 的 staging。
   */
  abstract setUniform(name: string, value: UniformValue): void;

  abstract setUniforms(values: Record<string, UniformValue>): void;

  /** 按名字取回 uniform 块。未声明时抛错，而不是静默返回 undefined。 */
  abstract block(name: string): UniformBlock;

  /** 所有 uniform 块（含 WebGPU 侧的合成块）。 */
  abstract get blocks(): readonly UniformBlock[];

  /** 用本管线的布局快速生成 VAO，只需提供顶点缓冲。 */
  createVertexArray(buffers: Record<string, Buffer | BufferBinding>, options: VertexArrayOptions = {}): VertexArray {
    return this.device.createVertexArray({
      label: options.label ?? `${this.label}.vao`,
      pipeline: this.layout,
      buffers,
      indexBuffer: options.indexBuffer,
    });
  }

  /** 用本管线的布局快速生成绑定组，binding 序号自动对齐。 */
  createBindGroup(entries: Record<string, BindGroupEntry> = {}, options: BindGroupOptions = {}): BindGroup {
    return this.device.createBindGroup({
      label: options.label ?? `${this.label}.bindGroup${options.group ?? 0}`,
      pipeline: this.layout,
      group: options.group ?? 0,
      entries,
    });
  }
}
