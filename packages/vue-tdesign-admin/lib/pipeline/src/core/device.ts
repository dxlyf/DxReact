/**
 * 设备抽象（API 适配层的统一入口）。
 *
 * Device 是"一个已经拿到原生上下文的东西"：WebGL 下它是一个 WebGLRenderingContext /
 * WebGL2RenderingContext，WebGPU 下它是 GPUDevice + GPUCanvasContext。
 * 库在这里只做三件事：
 *   1. 资源工厂：createBuffer / createTexture / createVertexArray / createBindGroup / createPipeline
 *   2. 帧与绘制：beginFrame 返回 RenderPass，负责清屏、状态切换与绘制提交
 *   3. 统一的调试统计：资源注册表、调用统计、命令环形缓冲、能力探测
 *
 * 差异保留：Device 不抹平两个后端的差异，只提供同一套入口。
 * 需要下探时用 device.gl / device.gpu 直接拿到原生上下文（另一个后端返回 null）。
 */
import { ErrorCode, errorReporter, GraphicsError, type ErrorReporter } from './errors.js';
import { Resource, ResourceRegistry } from './resource.js';
import { CommandRecorder, defaultDebugConfig, type DebugConfig } from './debug.js';
import { DeviceStats } from './stats.js';
import type { Buffer, BufferDescriptor } from './buffer.js';
import type { BindGroup, BindGroupDescriptor } from './bindGroup.js';
import type { Pipeline, PipelineDescriptor } from './pipeline.js';
import type { Sampler, SamplerDescriptor, Texture, TextureDescriptor } from './texture.js';
import type { VertexArray, VertexArrayDescriptor } from './vertexArray.js';
import { GraphicsApi, type Color, type DeviceCapabilities, type DeviceLimits, type TextureFormat } from './types.js';
import type { UniformValue } from './data.js';

/** 帧描述符。省略 colorAttachments 即渲染到画布的默认颜色目标。 */
export interface ColorAttachment {
  /** null / 省略表示画布默认目标 */
  texture?: Texture | null;
  mipLevel?: number;
  /** 本次帧开始时如何处理已有内容 */
  loadOp?: 'clear' | 'load';
  storeOp?: 'store' | 'discard';
  clearColor?: Color;
  /** MSAA 解析目标（WebGPU 必需，WebGL 恒为默认帧缓冲） */
  resolveTarget?: Texture | null;
}

export interface DepthStencilAttachment {
  texture?: Texture | null;
  loadOp?: 'clear' | 'load';
  storeOp?: 'store' | 'discard';
  clearDepth?: number;
  clearStencil?: number;
  /** 只读深度（WebGPU 会据此设置 depthReadOnly） */
  readOnly?: boolean;
}

export interface FrameDescriptor {
  label?: string;
  /** 颜色附件列表。null 元素表示跳过该槽位 */
  colorAttachments?: readonly (ColorAttachment | null)[];
  depthStencil?: DepthStencilAttachment | null;
  /** 便捷清屏色，等价于给每个颜色附件设置 loadOp='clear' + clearColor */
  clearColor?: Color | null;
  clearDepth?: number;
  clearStencil?: number;
}

export interface DrawOptions {
  /** 顶点个数。省略时按当前 VAO 的属性跨度推算 */
  vertexCount?: number;
  instanceCount?: number;
  firstVertex?: number;
  firstInstance?: number;
  /** 指定则走索引绘制（drawElements / drawIndexed） */
  indexCount?: number;
  firstIndex?: number;
  /** 索引起始的顶点偏移：WebGL2 的 drawElementsBaseVertex / WebGPU 的 baseVertex */
  baseVertex?: number;
}

/**
 * 一帧的绘制通道。
 *
 * 它同时承担"状态脏标记"与"自动批处理"两个职责：
 *  - 重复设置同一个管线 / VAO / 绑定组会被跳过（计入 stats.stateSkips）
 *  - 状态不变且顶点区间连续的多次 draw 会被合并成一次原生调用（计入 stats.mergedDraws）
 * 任何会破坏批处理前提的操作（换管线、改 uniform、换绑定组）都会先提交未决批次。
 */
export abstract class RenderPass {
  readonly descriptor: FrameDescriptor;
  protected ended = false;

  protected constructor(descriptor: FrameDescriptor) {
    this.descriptor = descriptor;
  }

  get isEnded(): boolean {
    return this.ended;
  }

  /** 切换管线。与当前管线相同则跳过。 */
  abstract pipeline(pipeline: Pipeline): void;

  /** 切换顶点数组对象。与当前相同则跳过。 */
  abstract vertexArray(vertexArray: VertexArray): void;

  /** 绑定绑定组。index 省略时使用 bindGroup.group。 */
  abstract bindGroup(bindGroup: BindGroup, index?: number): void;

  /**
   * 设置 uniform 值。
   * WebGL 下立刻作用于当前 program；WebGPU 下写进 uniform block 的 staging，
   * 由提交批次时统一上传。两种情况下都会先提交未决批次，避免批次复用错值。
   */
  abstract setUniform(name: string, value: UniformValue): void;

  abstract setUniforms(values: Record<string, UniformValue>): void;

  /** 提交一次绘制。可合并时会自动并入上一个批次。 */
  abstract draw(options?: DrawOptions): void;

  /** 结束本通道：提交未决批次，WebGPU 侧 finish + submit。 */
  abstract end(): void;

  protected assertOpen(call: string): void {
    if (this.ended) {
      throw new GraphicsError(`${this.descriptor.label ?? 'renderPass'} 已结束，无法继续 ${call}`, {
        code: ErrorCode.BindingError,
        hint: 'end() 之后请重新调用 device.beginFrame()。',
      });
    }
  }
}

/** 设备初始化参数。适配层把自己的能力探测结果一并传进来。 */
export interface DeviceInit {
  api: GraphicsApi;
  label?: string;
  canvas?: HTMLCanvasElement | OffscreenCanvas | null;
  capabilities: DeviceCapabilities;
  limits: DeviceLimits;
  debug?: boolean | Partial<DebugConfig>;
  /** WebGPU 画布格式 / WebGL 侧的默认颜色格式 */
  canvasFormat: TextureFormat;
}

/**
 * 上下文丢失事件。
 *  - WebGL：画布的 webglcontextlost 触发，recoverable 为 true，
 *    等 webglcontextrestored 之后按回调提示重建资源即可继续绘制；
 *  - WebGPU：device.lost 触发，recoverable 为 false —— 设备不会恢复，
 *    必须重建 GPUDevice 与画布配置。
 */
export interface DeviceContextLostEvent {
  api: GraphicsApi;
  label: string;
  /** 丢失原因：WebGL 取 WebGLContextEvent.statusMessage，WebGPU 取 GPUDeviceLostInfo.message */
  reason: string;
  /** 是否可恢复；为 true 时恢复会触发 onContextRestored 回调 */
  recoverable: boolean;
}

export type DeviceContextLostHandler = (event: DeviceContextLostEvent) => void;
export type DeviceContextRestoredHandler = () => void;

export abstract class Device {
  readonly api: GraphicsApi;
  readonly label: string;
  readonly debug: DebugConfig;
  readonly stats = new DeviceStats();
  readonly commands: CommandRecorder;
  readonly capabilities: DeviceCapabilities;
  readonly limits: DeviceLimits;
  readonly canvasFormat: TextureFormat;
  readonly canvas: HTMLCanvasElement | OffscreenCanvas | null;
  readonly errorReporter: ErrorReporter = errorReporter;

  private readonly registry = new ResourceRegistry();
  private readonly contextLostHandlers = new Set<DeviceContextLostHandler>();
  private readonly contextRestoredHandlers = new Set<DeviceContextRestoredHandler>();
  private contextLostFlag = false;
  private destroyed = false;

  protected constructor(init: DeviceInit) {
    this.api = init.api;
    this.label = init.label ?? init.api;
    this.canvas = init.canvas ?? null;
    this.capabilities = init.capabilities;
    this.limits = init.limits;
    this.canvasFormat = init.canvasFormat;
    if (init.debug === undefined || init.debug === false) {
      this.debug = defaultDebugConfig(false);
    } else if (init.debug === true) {
      this.debug = defaultDebugConfig(true);
    } else {
      this.debug = { ...defaultDebugConfig(true), ...init.debug };
    }
    this.commands = new CommandRecorder(this.debug.enabled ? this.debug.commandHistorySize : 1);
  }

  // -------------------------------------------------------------------------
  // ResourceOwner
  // -------------------------------------------------------------------------

  registerResource(resource: Resource): void {
    this.registry.add(resource);
  }

  unregisterResource(resource: Resource): void {
    this.registry.remove(resource.id);
  }

  get resources(): ResourceRegistry {
    return this.registry;
  }

  // -------------------------------------------------------------------------
  // 资源工厂
  // -------------------------------------------------------------------------

  abstract createBuffer(descriptor: BufferDescriptor): Buffer;

  abstract createTexture(descriptor: TextureDescriptor): Texture;

  abstract createSampler(descriptor?: SamplerDescriptor): Sampler;

  abstract createVertexArray(descriptor: VertexArrayDescriptor): VertexArray;

  abstract createBindGroup(descriptor: BindGroupDescriptor): BindGroup;

  abstract createPipeline(descriptor: PipelineDescriptor): Pipeline;

  // -------------------------------------------------------------------------
  // 帧
  // -------------------------------------------------------------------------

  abstract beginFrame(descriptor?: FrameDescriptor): RenderPass;

  // -------------------------------------------------------------------------
  // 原生下探
  // -------------------------------------------------------------------------

  /** 原生上下文：WebGL 为 WebGL(2)RenderingContext，WebGPU 为 GPUDevice。 */
  abstract get native(): WebGLRenderingContext | WebGL2RenderingContext | GPUDevice;

  /** WebGL 上下文；非 GL 后端返回 null。 */
  get gl(): WebGLRenderingContext | WebGL2RenderingContext | null {
    return null;
  }

  /** WebGPU 设备；非 GPU 后端返回 null。 */
  get gpu(): GPUDevice | null {
    return null;
  }

  /** 上下文是否已丢失（WebGL 的 CONTEXT_LOST / WebGPU 的 device.lost）。 */
  abstract get lost(): boolean;

  /**
   * 注册上下文丢失监听，返回取消订阅函数。
   * 回调里应当停止提交绘制命令：此刻所有原生对象都已失效。
   */
  onContextLost(handler: DeviceContextLostHandler): () => void {
    this.contextLostHandlers.add(handler);
    return () => {
      this.contextLostHandlers.delete(handler);
    };
  }

  /**
   * 注册上下文恢复监听，返回取消订阅函数。
   * 回调里应当按原描述符重建资源，然后恢复绘制（旧资源已不可用）。
   */
  onContextRestored(handler: DeviceContextRestoredHandler): () => void {
    this.contextRestoredHandlers.add(handler);
    return () => {
      this.contextRestoredHandlers.delete(handler);
    };
  }

  /** 丢失事件是否已到达且尚未恢复。 */
  get contextLost(): boolean {
    return this.contextLostFlag;
  }

  /** 画布像素尺寸。 */
  abstract get canvasSize(): { width: number; height: number };

  /**
   * 设置画布像素尺寸。
   * WebGPU 侧会顺带重新 configure 画布上下文，避免尺寸与纹理不匹配。
   */
  abstract setCanvasSize(width: number, height: number): void;

  // -------------------------------------------------------------------------
  // 调试与销毁
  // -------------------------------------------------------------------------

  get disposed(): boolean {
    return this.destroyed;
  }

  /** 存活资源报告，定位泄漏时直接打印。 */
  report(): string {
    return [this.registry.report(), this.stats.format()].join('\n');
  }

  /** 重置本轮统计。 */
  resetStats(): void {
    this.stats.reset();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    const alive = this.registry.count();
    if (alive > 0 && this.debug.enabled && this.debug.trackResourceLeaks) {
      console.warn(`${this.label}: destroy 时仍有 ${alive} 个资源未释放\n${this.registry.report()}`);
    }
    this.registry.destroyAll();
    this.releaseNative();
    // 销毁之后不再有上下文事件可言，订阅者一并解除，避免回调持有已销毁的设备
    this.contextLostHandlers.clear();
    this.contextRestoredHandlers.clear();
  }

  /** 释放原生上下文（适配层实现）。 */
  protected abstract releaseNative(): void;

  /** 适配层检测到上下文丢失后调用；同一轮丢失只通知一次。 */
  protected notifyContextLost(reason: string, recoverable: boolean): void {
    if (this.contextLostFlag) return;
    this.contextLostFlag = true;
    const event: DeviceContextLostEvent = {
      api: this.api,
      label: this.label,
      reason,
      recoverable,
    };
    for (const handler of [...this.contextLostHandlers]) {
      // 用户回调里抛错不应该影响库的事件分发
      try {
        handler(event);
      } catch (error) {
        this.errorReporter.report(error);
      }
    }
  }

  /** 适配层在上下文恢复后调用（WebGL 独有）。 */
  protected notifyContextRestored(): void {
    this.contextLostFlag = false;
    for (const handler of [...this.contextRestoredHandlers]) {
      try {
        handler();
      } catch (error) {
        this.errorReporter.report(error);
      }
    }
  }

  protected assertAlive(call: string): void {
    if (this.destroyed) {
      throw new GraphicsError(`${this.label} 已销毁，无法执行 ${call}`, {
        code: ErrorCode.ResourceDisposed,
        hint: 'Device 销毁后所有资源都失效。',
      });
    }
  }
}
