/**
 * WebGL / WebGL2 设备。
 *
 * 它是"一次上下文获取 + 一份全局状态缓存 + 一组资源工厂"：
 *  - 同一个 Device 下所有资源共享一个 GLStateCache，因此跨资源的冗余状态设置也能被跳过
 *  - createPipeline 时建立 PipelineLayout -> GLPipeline 的反查表：GL 的绑定组必须先有
 *    程序才能解析名字（见 glBindGroup 的头注释），这张表把 pipeline.createBindGroup()
 *    传下来的布局还原成具体管线
 *  - 能力与限制在构造时一次性探测完，之后只读
 *
 * 差异保留：native 返回 WebGL(2)RenderingContext；device.gl 是同一对象的类型化入口，
 * device.gpu 恒为 null。WebGL1 与 WebGL2 的差别只体现在 capabilities 与各资源的行为上。
 */
import {
  Device,
  type DeviceInit,
  type FrameDescriptor,
  type RenderPass,
} from '../../core/device.js';
import type { DebugConfig } from '../../core/debug.js';
import { unsupported } from '../../core/errors.js';
import type { Buffer } from '../../core/buffer.js';
import type { BindGroup, BindGroupDescriptor } from '../../core/bindGroup.js';
import type { Pipeline, PipelineDescriptor, PipelineLayoutView } from '../../core/pipeline.js';
import type { Sampler, SamplerDescriptor, Texture, TextureDescriptor } from '../../core/texture.js';
import type { VertexArray, VertexArrayDescriptor } from '../../core/vertexArray.js';
import {
  GraphicsApi,
  TextureFormat,
  type DeviceCapabilities,
  type DeviceLimits,
} from '../../core/types.js';
import {
  gl2,
  isWebGL2,
  type GLExtensions,
  type GLContext,
  type InstancedArraysExtension,
  type VertexArrayObjectExtension,
} from './constants.js';
import { GLStateCache } from './glState.js';
import { GLBuffer } from './glBuffer.js';
import { GLTexture, GLSampler } from './glTexture.js';
import { GLVertexArray } from './glVertexArray.js';
import { GLPipeline } from './glPipeline.js';
import { GLBindGroup } from './glBindGroup.js';
import { GLRenderPass } from './glRenderPass.js';

export interface WebGLDeviceOptions {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  label?: string;
  debug?: boolean | Partial<DebugConfig>;
  /** 上下文属性；省略时用 alpha/depth/stencil 全开的常规配置 */
  contextAttributes?: WebGLContextAttributes;
  /** 是否优先申请 WebGL2 上下文，默认 true；false 则强制走 WebGL1 路径 */
  preferWebGL2?: boolean;
}

const DEFAULT_CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
  alpha: true,
  depth: true,
  stencil: true,
  antialias: true,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
};

function acquireContext(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  attributes: WebGLContextAttributes,
  preferWebGL2: boolean,
): GLContext | null {
  // HTMLCanvasElement 与 OffscreenCanvas 的 getContext 重载在联合类型上不可直接调用
  const getContext = canvas.getContext.bind(canvas) as (
    id: string,
    options?: WebGLContextAttributes,
  ) => unknown;
  if (preferWebGL2) {
    const context = getContext('webgl2', attributes);
    if (context) return context as WebGL2RenderingContext;
  }
  const fallback = getContext('webgl', attributes);
  return fallback ? (fallback as WebGLRenderingContext) : null;
}

function detectExtensions(gl: GLContext, webgl2: boolean): GLExtensions {
  const names = gl.getSupportedExtensions() ?? [];
  const queried = new Map<string, unknown>();
  const get = (name: string): unknown => {
    if (queried.has(name)) return queried.get(name);
    const value = gl.getExtension(name);
    queried.set(name, value);
    return value;
  };
  return {
    // 这两个扩展在 WebGL2 里已是核心，不申请也不再使用
    instancedArrays: webgl2 ? null : ((get('ANGLE_instanced_arrays') as InstancedArraysExtension | null) ?? null),
    vertexArrayObject: webgl2
      ? null
      : ((get('OES_vertex_array_object') as VertexArrayObjectExtension | null) ?? null),
    elementIndexUint: webgl2 || Boolean(get('OES_element_index_uint')),
    floatTextures: webgl2 || Boolean(get('OES_texture_float')),
    depthTextures: webgl2 || Boolean(get('WEBGL_depth_texture')),
    anisotropy: (get('EXT_texture_filter_anisotropic') as GLExtensions['anisotropy']) ?? null,
    names: [...names],
  };
}

function detectCapabilities(
  api: GraphicsApi,
  webgl2: boolean,
  extensions: GLExtensions,
): DeviceCapabilities {
  return {
    api,
    vertexArrayObjects: webgl2 || extensions.vertexArrayObject !== null,
    instancing: webgl2 || extensions.instancedArrays !== null,
    // WebGL1 没有 UBO，uniform 块会降级为逐成员 uniform 上传
    uniformBuffers: webgl2,
    storageBuffers: false,
    computeShaders: false,
    elementIndexUint: extensions.elementIndexUint,
    floatTextures: extensions.floatTextures,
    depthTextures: extensions.depthTextures,
    anisotropy: extensions.anisotropy !== null,
    extensions: extensions.names,
  };
}

function detectLimits(gl: GLContext, webgl2: boolean): DeviceLimits {
  const param = (name: number): number => gl.getParameter(name) as number;
  return {
    maxVertexAttributes: param(gl.MAX_VERTEX_ATTRIBS),
    maxTextureSize: param(gl.MAX_TEXTURE_SIZE),
    maxTextureUnits: param(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
    maxUniformBufferBindings: webgl2 ? param(gl2(gl).MAX_UNIFORM_BUFFER_BINDINGS) : 0,
    maxUniformBlockSize: webgl2 ? param(gl2(gl).MAX_UNIFORM_BLOCK_SIZE) : 0,
    // GL 没有绑定组概念，纹理单元就是"槽位"，这里按单元数上报
    maxBindGroups: param(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
    maxVertexBuffers: param(gl.MAX_VERTEX_ATTRIBS),
    // GL 的缓冲偏移量是 32 位有符号数，没有对应的查询参数
    maxBufferSize: 0x7fffffff,
  };
}

export class GLDevice extends Device {
  private readonly context: GLContext;
  readonly state: GLStateCache;
  /** 布局 -> 管线反查表；布局由管线独占持有，用 WeakMap 免去显式清理 */
  /** 布局视图 -> 程序；GL 侧绑定组要先有程序才能把名字解析成槽位 */
  private readonly pipelines = new WeakMap<PipelineLayoutView, GLPipeline>();
  /** 画布上下文事件的解绑函数；画布不支持事件（OffscreenCanvas）时为 null */
  private detachContextEvents: (() => void) | null = null;

  constructor(gl: GLContext, options: WebGLDeviceOptions) {
    const webgl2 = isWebGL2(gl);
    const api = webgl2 ? GraphicsApi.WebGL2 : GraphicsApi.WebGL;
    const extensions = detectExtensions(gl, webgl2);
    // 能力与限制先于 super() 算好：Device 的构造需要它们，而状态缓存又需要 Device 的统计对象
    const init: DeviceInit = {
      api,
      label: options.label ?? api,
      canvas: options.canvas,
      capabilities: detectCapabilities(api, webgl2, extensions),
      limits: detectLimits(gl, webgl2),
      debug: options.debug,
      canvasFormat: TextureFormat.RGBA8Unorm,
    };
    super(init);
    this.context = gl;
    this.state = new GLStateCache(gl, webgl2, extensions, this.stats, this.debug, this.commands);
    this.detachContextEvents = attachContextEvents(this);
  }

  override get native(): WebGLRenderingContext | WebGL2RenderingContext {
    return this.context;
  }

  override get gl(): GLContext {
    return this.context;
  }

  override get lost(): boolean {
    // 事件已到达但浏览器尚未更新 isContextLost() 的窗口内，也要算作丢失
    return this.contextLost || this.context.isContextLost();
  }

  /**
   * 上下文丢失处理（webglcontextlost）。
   * 事件本身已经 preventDefault，浏览器随后会尝试恢复上下文。
   * 此时所有原生对象失效、全局状态回到默认值，因此只作废缓存并通知订阅者停止绘制。
   */
  handleContextLost(event: WebGLContextEvent): void {
    this.state.invalidate();
    const reason = event.statusMessage || 'webglcontextlost';
    this.commands.record('gl', 'contextLost', [reason]);
    this.notifyContextLost(reason, true);
  }

  /**
   * 上下文恢复处理（webglcontextrestored）。
   * program / buffer / texture / VAO / sampler 全部作废且无法复原（库不保留 buffer 内容），
   * 因此把旧资源统一销毁：残留句柄会立刻报"已销毁"，而不是静默失效。
   * 订阅者在 onContextRestored 回调里按原描述符重建资源即可继续绘制。
   */
  handleContextRestored(): void {
    this.state.invalidate();
    this.resources.destroyAll();
    this.commands.record('gl', 'contextRestored', [this.label]);
    this.notifyContextRestored();
  }

  override get canvasSize(): { width: number; height: number } {
    const canvas = this.canvas;
    if (!canvas) return { width: 0, height: 0 };
    return { width: canvas.width, height: canvas.height };
  }

  override setCanvasSize(width: number, height: number): void {
    this.assertAlive('setCanvasSize');
    const canvas = this.canvas;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
    }
    // 绘制缓冲尺寸变了，viewport 必须跟着走（缓存会挡掉无变化的重复设置）
    this.state.viewport(0, 0, width, height);
  }

  // -------------------------------------------------------------------------
  // 资源工厂
  // -------------------------------------------------------------------------

  override createBuffer(descriptor: Parameters<Device['createBuffer']>[0]): Buffer {
    this.assertAlive('createBuffer');
    return new GLBuffer(this, descriptor, this.state);
  }

  override createTexture(descriptor: TextureDescriptor): Texture {
    this.assertAlive('createTexture');
    return new GLTexture(this, descriptor, this.state);
  }

  override createSampler(descriptor: SamplerDescriptor = {}): Sampler {
    this.assertAlive('createSampler');
    return new GLSampler(this, descriptor, this.state);
  }

  override createVertexArray(descriptor: VertexArrayDescriptor): VertexArray {
    this.assertAlive('createVertexArray');
    return new GLVertexArray(this, descriptor, this.state);
  }

  override createBindGroup(descriptor: BindGroupDescriptor): BindGroup {
    this.assertAlive('createBindGroup');
    const layout = descriptor.pipeline;
    if (!layout) {
      throw unsupported(`${descriptor.label ?? 'bindGroup'}: WebGL 的绑定组需要描述符里的 pipeline 布局`, {
        api: this.api,
        call: 'createBindGroup',
        hint: '用 pipeline.createBindGroup({ UBO名: { buffer }, 纹理名: { texture } }) 一步到位。',
      });
    }
    const pipeline = this.pipelines.get(layout);
    if (!pipeline) {
      throw unsupported(`${descriptor.label ?? 'bindGroup'}: 该布局不属于本设备创建的任何管线`, {
        api: this.api,
        call: 'createBindGroup',
        hint: 'GL 侧绑定组的纹理单元号与块绑定槽都来自具体程序，请改用 pipeline.createBindGroup()。',
      });
    }
    return new GLBindGroup(this, descriptor, this.state, pipeline);
  }

  override createPipeline(descriptor: PipelineDescriptor): Pipeline {
    this.assertAlive('createPipeline');
    const pipeline = new GLPipeline(this, descriptor, this.state);
    this.pipelines.set(pipeline.layout, pipeline);
    return pipeline;
  }

  override beginFrame(descriptor: FrameDescriptor = {}): RenderPass {
    this.assertAlive('beginFrame');
    return new GLRenderPass(this, this.state, descriptor);
  }

  protected override releaseNative(): void {
    // 主动销毁时不再关心丢失/恢复事件（后面 loseContext 会真的触发一次丢失事件）
    this.detachContextEvents?.();
    this.detachContextEvents = null;
    // 上下文一旦丢失，原生状态回到默认值，缓存必须整体作废
    this.state.invalidate();
    const loseContext = this.context.getExtension('WEBGL_lose_context') as { loseContext(): void } | null;
    loseContext?.loseContext();
  }
}

/**
 * 把 webglcontextlost / webglcontextrestored 挂到画布上，返回解绑函数。
 * OffscreenCanvas 不是 EventTarget，无法挂事件：它的上下文丢失只能由使用方自行感知。
 */
function attachContextEvents(device: GLDevice): () => void {
  const canvas = device.canvas;
  if (!canvas || typeof (canvas as Partial<EventTarget>).addEventListener !== 'function') return () => {};

  const target = canvas as EventTarget;
  const onLost = (event: Event): void => {
    // 必须阻止默认行为，否则浏览器不会尝试恢复上下文
    event.preventDefault();
    device.handleContextLost(event as WebGLContextEvent);
  };
  const onRestored = (): void => {
    device.handleContextRestored();
  };

  target.addEventListener('webglcontextlost', onLost, false);
  target.addEventListener('webglcontextrestored', onRestored, false);
  return () => {
    target.removeEventListener('webglcontextlost', onLost, false);
    target.removeEventListener('webglcontextrestored', onRestored, false);
  };
}

/** 从画布申请上下文并组装设备。默认优先 WebGL2，取不到再退回 WebGL1。 */
export function createWebGLDevice(options: WebGLDeviceOptions): GLDevice {
  const attributes = options.contextAttributes ?? DEFAULT_CONTEXT_ATTRIBUTES;
  const gl = acquireContext(options.canvas, attributes, options.preferWebGL2 !== false);
  if (!gl) {
    throw unsupported('无法获取 WebGL 上下文', {
      api: GraphicsApi.WebGL,
      call: 'createWebGLDevice',
      hint: '确认画布未被其它上下文占用，且浏览器支持 webgl2 / webgl。',
    });
  }
  return new GLDevice(gl, options);
}
