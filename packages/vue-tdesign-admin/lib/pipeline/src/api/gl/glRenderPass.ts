/**
 * WebGL / WebGL2 的渲染通道。
 *
 * 它把 beginFrame -> 设状态 -> draw -> end 这条链条里最琐碎的部分做掉：
 *  - 帧首清屏与 viewport：只在 beginFrame 时做一次
 *  - 管线 / VAO / 绑定组的状态去重：与当前相同则跳过（计入 stats.stateSkips）
 *  - uniform 回写时机：先提交未决批次再写值，避免已合并的绘制读到新值
 *  - 自动批处理：状态一致、非索引、顶点区间首尾相接的连续绘制合并成一次原生调用
 *
 * 差异保留：
 *  - 渲染目标恒为默认帧缓冲。colorAttachments 里出现纹理时明确报错，而不是静默忽略
 *  - WebGL1 的实例化绘制走 ANGLE_instanced_arrays；缺扩展时抛 unsupported
 *  - drawElementsBaseVertex 只有 WebGL2 才有，且 lib.dom 未声明，按存在性判定
 */
import {
  RenderPass,
  type Device,
  type DrawOptions,
  type FrameDescriptor,
} from '../../core/device.js';
import { invalidDescriptor, typeMismatch, unsupported } from '../../core/errors.js';
import type { UniformValue } from '../../core/data.js';
import type { BindGroup } from '../../core/bindGroup.js';
import type { Pipeline } from '../../core/pipeline.js';
import type { VertexArray } from '../../core/vertexArray.js';
import { DrawBatcher, type BatchState, type BatchSubmit } from '../../core/batch.js';
import { gl2, glTopology, type GLContext } from './constants.js';
import type { GLStateCache } from './glState.js';
import { GLBindGroup } from './glBindGroup.js';
import { GLPipeline } from './glPipeline.js';
import { GLVertexArray } from './glVertexArray.js';

/** 归一后的绘制参数：索引与非索引共用一份结构，避免分支里到处判空。 */
interface ResolvedDraw {
  indexed: boolean;
  firstVertex: number;
  vertexCount: number;
  firstIndex: number;
  indexCount: number;
  baseVertex: number;
  firstInstance: number;
  instanceCount: number;
}

/** lib.dom 未声明 drawElementsBaseVertex，按可选方法探测。 */
interface BaseVertexContext {
  drawElementsBaseVertex?: (
    mode: number,
    count: number,
    type: number,
    offset: number,
    baseVertex: number,
  ) => void;
}

export class GLRenderPass extends RenderPass {
  private readonly device: Device;
  private readonly state: GLStateCache;
  private readonly gl: GLContext;
  private readonly batcher = new DrawBatcher();

  private currentPipeline: GLPipeline | null = null;
  private currentVao: GLVertexArray | null = null;
  private groups: (GLBindGroup | null)[] = [];

  constructor(device: Device, state: GLStateCache, descriptor: FrameDescriptor) {
    super(descriptor);
    this.device = device;
    this.state = state;
    this.gl = state.gl;
    this.prepareFrame(descriptor);
  }

  /** 自动批处理开关。关闭后每次 draw 都落到原生调用，便于与原生行为对照。 */
  get batching(): boolean {
    return this.batcher.enabled;
  }

  set batching(enabled: boolean) {
    this.batcher.enabled = enabled;
    if (!enabled) this.commit();
  }

  override pipeline(pipeline: Pipeline): void {
    this.assertOpen('pipeline');
    if (!(pipeline instanceof GLPipeline)) {
      throw typeMismatch(`${this.descriptor.label ?? 'renderPass'}: 需要 WebGL 后端创建的管线`, {
        hint: '管线必须由同一个 device 的 createPipeline 创建。',
      });
    }
    this.device.stats.stateChanges++;
    if (this.currentPipeline === pipeline) {
      this.state.skip('pipeline');
      return;
    }
    this.commit();
    // 绑定程序 + 回写 uniform + 应用固定状态；重复设置由 GLStateCache 挡掉
    pipeline.apply();
    this.currentPipeline = pipeline;
    this.device.stats.pipelineSwitches++;
  }

  override vertexArray(vertexArray: VertexArray): void {
    this.assertOpen('vertexArray');
    if (!(vertexArray instanceof GLVertexArray)) {
      throw typeMismatch(`${this.descriptor.label ?? 'renderPass'}: 需要 WebGL 后端创建的顶点数组`, {
        hint: '用 pipeline.createVertexArray() 或 device.createVertexArray() 创建。',
      });
    }
    this.device.stats.stateChanges++;
    if (this.currentVao === vertexArray) {
      this.state.skip('vertexArray');
      return;
    }
    this.commit();
    this.currentVao = vertexArray;
  }

  override bindGroup(bindGroup: BindGroup, index?: number): void {
    this.assertOpen('bindGroup');
    if (!(bindGroup instanceof GLBindGroup)) {
      throw typeMismatch(`${this.descriptor.label ?? 'renderPass'}: 需要 WebGL 后端创建的绑定组`);
    }
    const slot = index ?? bindGroup.group;
    this.device.stats.stateChanges++;
    if (this.groups[slot] === bindGroup) {
      this.state.skip('bindGroup');
      return;
    }
    this.commit();
    this.groups[slot] = bindGroup;
    this.device.stats.bindGroupWrites++;
  }

  override setUniform(name: string, value: UniformValue): void {
    this.assertOpen('setUniform');
    const pipeline = this.requirePipeline('setUniform');
    // 已合并的批次用的是旧值，必须先落地
    this.commit();
    const dot = name.indexOf('.');
    if (dot > 0) {
      pipeline.block(name.slice(0, dot)).set(name.slice(dot + 1), value);
      return;
    }
    pipeline.setUniform(name, value);
  }

  override setUniforms(values: Record<string, UniformValue>): void {
    for (const [name, value] of Object.entries(values)) this.setUniform(name, value);
  }

  override draw(options: DrawOptions = {}): void {
    this.assertOpen('draw');
    const pipeline = this.requirePipeline('draw');
    const vao = this.requireVao('draw');

    // 顶点缓冲脏区间、属性指针、绑定组内容、未回写的 uniform 都在绘制前一次性落地
    vao.flush();
    for (const group of this.groups) group?.flush();
    if (pipeline.hasPendingUniforms) pipeline.flushUniforms();

    const draw = this.resolveDraw(options, vao);
    const mode = glTopology(pipeline.state.topology, this.gl);

    // 索引绘制不参与合并：索引缓冲内的偏移连续性与顶点区间无关，合并语义易错
    if (draw.indexed) {
      this.commit();
      if (draw.indexCount <= 0) return;
      this.drawNative(mode, draw, 1);
      return;
    }
    if (draw.vertexCount <= 0) return;

    const state: BatchState = {
      pipeline: pipeline.handle,
      vertexArray: vao.handle,
      groups: this.groups.map((group) => (group ? group.handle : null)),
      index: null,
      topology: pipeline.state.topology,
    };
    if (!this.batcher.tryMerge(state, draw)) {
      this.commit();
      this.batcher.start(state, draw);
    }
  }

  override end(): void {
    if (this.ended) return;
    this.commit();
    this.ended = true;
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  /** 提交未决批次。任何可能改变绘制结果的操作之前都要调用。 */
  private commit(): void {
    if (this.batcher.pending) this.batcher.flush(this.emitBatch);
  }

  /**
   * 批次的落地回调。
   * 状态在批次挂起期间不可能被改动（改动前必先 commit），因此当前管线 / VAO 就是它的状态。
   */
  private emitBatch = (submit: BatchSubmit): void => {
    const pipeline = this.currentPipeline;
    if (!pipeline) return;
    this.drawNative(
      glTopology(pipeline.state.topology, this.gl),
      {
        indexed: false,
        firstVertex: submit.draw.firstVertex,
        vertexCount: submit.draw.vertexCount,
        firstIndex: 0,
        indexCount: 0,
        baseVertex: 0,
        firstInstance: submit.draw.firstInstance,
        instanceCount: submit.draw.instanceCount,
      },
      submit.merged,
    );
  };

  private drawNative(mode: number, draw: ResolvedDraw, merged: number): void {
    const stats = this.device.stats;
    const gl = this.gl;
    const instanced = draw.instanceCount > 1;

    if (draw.indexed) {
      const vao = this.currentVao;
      const indexBuffer = vao?.indexBuffer ?? null;
      if (!vao || !indexBuffer) {
        throw invalidDescriptor(`${this.descriptor.label ?? 'renderPass'}: 索引绘制需要 VAO 绑定索引缓冲`, {
          hint: '在 createVertexArray 时传 indexBuffer，或事后设置 vertexArray.indexBuffer。',
        });
      }
      const type = vao.indexType;
      const offset = draw.firstIndex * indexBuffer.elementSize;
      if (instanced) {
        this.drawElementsInstanced(mode, draw, type, offset);
      } else if (draw.baseVertex !== 0) {
        const context = gl as unknown as BaseVertexContext;
        const fn = context.drawElementsBaseVertex;
        if (!fn) {
          throw unsupported(
            `${this.descriptor.label ?? 'renderPass'}: 当前上下文不支持 baseVertex（需要 WebGL2 的 drawElementsBaseVertex）`,
            { api: this.device.api, hint: '把 baseVertex 设为 0，或在顶点数据里预先偏移。' },
          );
        }
        fn.call(gl, mode, draw.indexCount, type, offset, draw.baseVertex);
        this.state.call('drawElementsBaseVertex', draw.indexCount, draw.baseVertex);
      } else {
        gl.drawElements(mode, draw.indexCount, type, offset);
        this.state.call('drawElements', draw.indexCount);
      }
    } else if (instanced) {
      if (this.state.webgl2) {
        gl2(gl).drawArraysInstanced(mode, draw.firstVertex, draw.vertexCount, draw.instanceCount);
        this.state.call('drawArraysInstanced', draw.vertexCount, draw.instanceCount);
      } else {
        const extension = this.state.extensions.instancedArrays;
        if (!extension) {
          throw unsupported(
            `${this.descriptor.label ?? 'renderPass'}: WebGL1 缺少 ANGLE_instanced_arrays 扩展，无法实例化绘制`,
            { api: this.device.api, hint: '先检查 device.capabilities.instancing。' },
          );
        }
        extension.drawArraysInstancedANGLE(mode, draw.firstVertex, draw.vertexCount, draw.instanceCount);
        this.state.call('drawArraysInstancedANGLE', draw.vertexCount, draw.instanceCount);
      }
    } else {
      gl.drawArrays(mode, draw.firstVertex, draw.vertexCount);
      this.state.call('drawArrays', draw.vertexCount);
    }

    if (instanced) stats.instancedDrawCalls++;
    else stats.drawCalls++;
    if (merged > 1) stats.mergedDraws += merged - 1;
  }

  private drawElementsInstanced(mode: number, draw: ResolvedDraw, type: number, offset: number): void {
    if (this.state.webgl2) {
      gl2(this.gl).drawElementsInstanced(mode, draw.indexCount, type, offset, draw.instanceCount);
      this.state.call('drawElementsInstanced', draw.indexCount, draw.instanceCount);
      return;
    }
    const extension = this.state.extensions.instancedArrays;
    if (!extension) {
      throw unsupported(
        `${this.descriptor.label ?? 'renderPass'}: WebGL1 缺少 ANGLE_instanced_arrays 扩展，无法实例化绘制`,
        { api: this.device.api, hint: '先检查 device.capabilities.instancing。' },
      );
    }
    extension.drawElementsInstancedANGLE(mode, draw.indexCount, type, offset, draw.instanceCount);
    this.state.call('drawElementsInstancedANGLE', draw.indexCount, draw.instanceCount);
  }

  private resolveDraw(options: DrawOptions, vao: GLVertexArray): ResolvedDraw {
    return {
      indexed: options.indexCount !== undefined,
      firstVertex: options.firstVertex ?? 0,
      vertexCount: options.vertexCount ?? vao.vertexCapacity,
      firstIndex: options.firstIndex ?? 0,
      indexCount: options.indexCount ?? 0,
      baseVertex: options.baseVertex ?? 0,
      firstInstance: options.firstInstance ?? 0,
      instanceCount: options.instanceCount ?? 1,
    };
  }

  private requirePipeline(call: string): GLPipeline {
    if (!this.currentPipeline) {
      throw invalidDescriptor(`${this.descriptor.label ?? 'renderPass'}: ${call} 之前必须先设置管线`, {
        hint: 'renderPass.pipeline(pipeline) 会同时完成程序绑定与固定状态应用。',
      });
    }
    return this.currentPipeline;
  }

  private requireVao(call: string): GLVertexArray {
    if (!this.currentVao) {
      throw invalidDescriptor(`${this.descriptor.label ?? 'renderPass'}: ${call} 之前必须先设置顶点数组`);
    }
    return this.currentVao;
  }

  /** 帧首一次性设置：viewport、写掩码放开、清屏。 */
  private prepareFrame(descriptor: FrameDescriptor): void {
    const gl = this.gl;
    const attachments = descriptor.colorAttachments ?? [];
    for (const attachment of attachments) {
      if (attachment?.texture) {
        throw unsupported(
          `${descriptor.label ?? 'renderPass'}: WebGL 后端只渲染到默认帧缓冲，colorAttachments 不能指定 texture`,
          {
            api: this.device.api,
            hint: 'GL 侧请省略 colorAttachments；离屏渲染需自行管理 framebuffer 并下探 device.gl。',
          },
        );
      }
    }

    const size = this.device.canvasSize;
    this.state.viewport(0, 0, size.width, size.height);

    const primary = attachments.find((attachment) => attachment) ?? null;
    const depth = descriptor.depthStencil ?? null;
    const color = descriptor.clearColor ?? primary?.clearColor ?? (primary?.loadOp === 'clear' ? BLACK : null);
    const clearDepth = descriptor.clearDepth ?? depth?.clearDepth;
    const clearStencil = descriptor.clearStencil ?? depth?.clearStencil;
    if (!color && clearDepth === undefined && clearStencil === undefined) return;

    // 写掩码会拦住 clear，先全部放开；由随后的管线状态重新设置
    this.state.colorMask(true, true, true, true);
    let bits = 0;
    if (color) {
      gl.clearColor(color.r, color.g, color.b, color.a);
      bits |= gl.COLOR_BUFFER_BIT;
    }
    if (clearDepth !== undefined) {
      this.state.depthMask(true);
      gl.clearDepth(clearDepth);
      bits |= gl.DEPTH_BUFFER_BIT;
    }
    if (clearStencil !== undefined) {
      this.state.stencilMaskSeparate(gl.FRONT, 0xff);
      this.state.stencilMaskSeparate(gl.BACK, 0xff);
      gl.clearStencil(clearStencil);
      bits |= gl.STENCIL_BUFFER_BIT;
    }
    gl.clear(bits);
    this.state.call('clear', bits);
  }
}

const BLACK = { r: 0, g: 0, b: 0, a: 1 };
