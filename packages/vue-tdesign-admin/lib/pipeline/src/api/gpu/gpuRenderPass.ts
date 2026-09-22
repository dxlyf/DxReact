/**
 * WebGPU 的渲染通道。
 *
 * 与 GLRenderPass 一一对应：同样的状态去重、同样的 uniform 回写时机、同样的自动批处理，
 * 因此同一套使用代码在两端的行为一致（批处理判定直接复用 core/batch.ts）：
 *  - 管线 / VAO / 绑定组的状态去重：与当前相同则跳过（计入 stats.stateSkips）
 *  - uniform 回写时机：先提交未决批次再写值，避免已合并的绘制读到新值
 *  - 自动批处理：状态一致、非索引、顶点区间首尾相接的连续绘制合并成一次原生调用
 *
 * 差异保留（WebGPU 与 WebGL 无法抹平的地方，全部显式写在这里）：
 *  - 清屏由 loadOp 表达：WebGPU 没有 gl.clear 这样的独立清屏调用，"帧首清屏"只能写成
 *    颜色 / 深度附件上的 loadOp='clear' + clearValue，因此 clearColor / clearDepth /
 *    clearStencil 会被翻译进附件描述符，而不是像 GL 侧那样调用 gl.clear。
 *  - 状态设置有严格顺序：setPipeline 必须在 setVertexBuffer / setIndexBuffer 之前，
 *    所以本类要求先 pipeline() 再 vertexArray()（WebGPU 校验会直接拒绝反过来的顺序）。
 *  - WebGPU 没有 VAO：vertexArray() 退化为按 vao.bindings() 的顺序逐槽 setVertexBuffer，
 *    顶点缓冲布局（格式 / offset / stride / stepMode）在创建管线时就已固定。
 *  - drawIndexed 的参数序与 GL 不同：WebGPU 是
 *    drawIndexed(indexCount, instanceCount, firstIndex, baseVertex, firstInstance)，
 *    而 GL 是 drawElements(mode, count, type, offset) / drawElementsBaseVertex(..., baseVertex)，
 *    baseVertex 的位置完全不一样，这里的传参一律以 @webgpu/types 的签名为准。
 *  - viewport 默认覆盖整个附件，不需要 gl.viewport：本类不提供尺寸设置，
 *    要局部视口请直接下探 passEncoder.setViewport。
 *  - 提交模型是"命令编码器 + 队列"：构造时 createCommandEncoder + beginRenderPass，
 *    end() 时才 passEncoder.end() -> commandEncoder.finish() -> queue.submit()。
 *    因此所有绘制命令都在 end() 时一次性生效。
 */
import {
  RenderPass,
  type ColorAttachment,
  type Device,
  type DrawOptions,
  type FrameDescriptor,
} from '../../core/device.js';
import { invalidDescriptor, typeMismatch } from '../../core/errors.js';
import type { UniformValue } from '../../core/data.js';
import type { BindGroup } from '../../core/bindGroup.js';
import type { Pipeline } from '../../core/pipeline.js';
import type { Texture } from '../../core/texture.js';
import type { VertexArray } from '../../core/vertexArray.js';
import { DrawBatcher, type BatchState, type BatchSubmit } from '../../core/batch.js';
import { TextureFormat, type Color } from '../../core/types.js';
import { GPUBindGroup } from './gpuBindGroup.js';
import { GPUTexture } from './gpuTexture.js';
import { GPUVertexArray } from './gpuVertexArray.js';

/**
 * 原生缓冲句柄类型。
 * 不能直接写 `GPUBuffer`：gpuBuffer.ts 导出的同名类会遮蔽 @webgpu/types 的全局类型，
 * 这里统一从 createBuffer 的返回值取，既避开遮蔽也跟随类型版本。
 */
type NativeBuffer = ReturnType<GPUDevice['createBuffer']>;

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

/** 省略 colorAttachments 时的默认颜色目标：无 texture 即落到画布视图上。 */
const DEFAULT_COLOR_ATTACHMENT: ColorAttachment = {};
const BLACK: Color = { r: 0, g: 0, b: 0, a: 1 };

export class GPURenderPass extends RenderPass {
  private readonly device: Device;
  private readonly gpuDevice: GPUDevice;
  /** 画布当前帧的视图；离屏渲染时为 null */
  private readonly canvasView: GPUTextureView | null;
  private readonly commandEncoder: GPUCommandEncoder;
  private readonly passEncoder: GPURenderPassEncoder;
  private readonly batcher = new DrawBatcher();

  private currentPipeline: Pipeline | null = null;
  private currentVao: GPUVertexArray | null = null;
  private groups: (GPUBindGroup | null)[] = [];

  constructor(device: Device, descriptor: FrameDescriptor, gpuDevice: GPUDevice, canvasView: GPUTextureView | null) {
    super(descriptor);
    this.device = device;
    this.gpuDevice = gpuDevice;
    this.canvasView = canvasView;

    // 差异保留：WebGPU 的通道不是一个"立即生效"的状态机，而是被编码进命令缓冲，
    // 由 end() 一次性提交；这里只是把编码器与通道打开。
    this.commandEncoder = gpuDevice.createCommandEncoder({ label: `${this.label}-encoder` });
    this.passEncoder = this.commandEncoder.beginRenderPass({
      label: this.label,
      colorAttachments: this.resolveColorAttachments(descriptor),
      depthStencilAttachment: this.resolveDepthAttachment(descriptor),
    });
    this.nativeCall('beginRenderPass', this.resolveColorAttachments.length);
  }

  override pipeline(pipeline: Pipeline): void {
    this.assertOpen('pipeline');
    const gpu = pipeline.gpu;
    if (!gpu) {
      throw typeMismatch(`${this.label}: 需要 WebGPU 后端创建的管线`, {
        hint: '管线必须由同一个 device 的 createPipeline 创建。',
      });
    }
    this.device.stats.stateChanges++;
    if (this.currentPipeline === pipeline) {
      this.device.stats.skipState('pipeline');
      return;
    }
    this.commit();
    this.passEncoder.setPipeline(gpu.pipeline);
    this.nativeCall('setPipeline', pipeline.describe());
    this.currentPipeline = pipeline;
    this.device.stats.pipelineSwitches++;
  }

  override vertexArray(vertexArray: VertexArray): void {
    this.assertOpen('vertexArray');
    if (!(vertexArray instanceof GPUVertexArray)) {
      throw typeMismatch(`${this.label}: 需要 WebGPU 后端创建的顶点数组`, {
        hint: '用 pipeline.createVertexArray() 或 device.createVertexArray() 创建。',
      });
    }
    this.device.stats.stateChanges++;
    if (this.currentVao === vertexArray) {
      this.device.stats.skipState('vertexArray');
      return;
    }
    this.commit();
    // 差异保留：WebGPU 要求 setVertexBuffer / setIndexBuffer 之前必须先 setPipeline，
    // 所以这里强制"先 pipeline() 再 vertexArray()"，反过来会被原生校验拒绝。
    if (!this.currentPipeline) {
      throw invalidDescriptor(`${this.label}: vertexArray 之前必须先设置管线`, {
        hint: 'WebGPU 的 setVertexBuffer 依赖已绑定的管线（顶点布局在管线里）。',
      });
    }
    // 按管线布局的槽位声明顺序逐槽绑定；顺序错了 slotIndex 会整体错位
    vertexArray.bindings().forEach((binding, slot) => {
      this.passEncoder.setVertexBuffer(slot, binding.buffer.native as NativeBuffer, binding.offset);
      this.nativeCall('setVertexBuffer', slot, binding.offset);
    });
    // 索引缓冲在 WebGPU 下是绘制时绑定，不是创建 VAO 时绑定；
    // 注意参数序是 (buffer, indexFormat, offset)，与 wgpu 等绑定层的习惯相反
    const indexBuffer = vertexArray.gpuIndexBuffer;
    if (indexBuffer) {
      this.passEncoder.setIndexBuffer(indexBuffer.native, vertexArray.indexFormat, 0);
      this.nativeCall('setIndexBuffer', vertexArray.indexFormat);
    }
    this.currentVao = vertexArray;
  }

  override bindGroup(bindGroup: BindGroup, index?: number): void {
    this.assertOpen('bindGroup');
    if (!(bindGroup instanceof GPUBindGroup)) {
      throw typeMismatch(`${this.label}: 需要 WebGPU 后端创建的绑定组`);
    }
    const slot = index ?? bindGroup.group;
    this.device.stats.stateChanges++;
    if (this.groups[slot] === bindGroup) {
      this.device.stats.skipState('bindGroup');
      return;
    }
    this.commit();
    // 缓冲脏区间与待重建的原生绑定组在这里落地，之后才能安全地引用 native
    bindGroup.flush();
    this.passEncoder.setBindGroup(slot, bindGroup.native);
    this.nativeCall('setBindGroup', slot, bindGroup.describe());
    this.groups[slot] = bindGroup;
    this.device.stats.bindGroupWrites++;
  }

  override setUniform(name: string, value: UniformValue): void {
    this.assertOpen('setUniform');
    const pipeline = this.requirePipeline('setUniform');
    // 已合并的批次用的是旧值，必须先落地
    this.commit();
    // 差异保留：WebGPU 没有游离 uniform，值只能写进 uniform block；
    // 这里仍接受 `Block.member` 写法，裸名字交给管线写进合成块 $uniforms 的 staging。
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

    // 顶点缓冲脏区间、绑定组内容、未上传的 uniform staging 都在绘制前一次性落地
    vao.flush();
    for (const group of this.groups) group?.flush();
    this.flushUniforms(pipeline);

    const draw = this.resolveDraw(options, vao);

    // 索引绘制不参与合并：索引缓冲内的偏移连续性与顶点区间无关，合并语义易错
    if (draw.indexed) {
      this.commit();
      if (draw.indexCount <= 0) return;
      this.drawNative(draw, 1);
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
    // 幂等：重复 end() 不再报错，也不会重复提交
    if (this.ended) return;
    this.commit();
    this.passEncoder.end();
    const commandBuffer = this.commandEncoder.finish();
    this.gpuDevice.queue.submit([commandBuffer]);
    this.nativeCall('submit', 1);
    this.ended = true;
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private get label(): string {
    return this.descriptor.label ?? 'renderPass';
  }

  /**
   * 提交未决批次。
   * 任何可能改变绘制结果的操作之前都要调用；同时把当前管线的 uniform 块 staging 上传，
   * 否则合成块 / 参数块里刚写的值不会随队列提交生效。
   */
  private commit(): void {
    if (!this.batcher.pending) return;
    const pipeline = this.currentPipeline;
    if (pipeline) this.flushUniforms(pipeline);
    this.batcher.flush(this.emitBatch);
  }

  /**
   * 批次的落地回调。
   * 状态在批次挂起期间不可能被改动（改动前必先 commit），因此当前管线 / VAO 就是它的状态。
   */
  private emitBatch = (submit: BatchSubmit): void => {
    if (!this.currentPipeline) return;
    this.drawNative(
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

  private drawNative(draw: ResolvedDraw, merged: number): void {
    const stats = this.device.stats;
    const instanced = draw.instanceCount > 1;

    if (draw.indexed) {
      const vao = this.currentVao;
      if (!vao || !vao.gpuIndexBuffer) {
        throw invalidDescriptor(`${this.label}: 索引绘制需要 VAO 绑定索引缓冲`, {
          hint: '在 createVertexArray 时传 indexBuffer，或事后设置 vertexArray.indexBuffer。',
        });
      }
      // 差异保留：WebGPU 的 baseVertex 是第 4 个参数（GL 的 drawElementsBaseVertex 是第 5 个），
      // 且 firstInstance 是第 5 个参数；这里的顺序严格按 @webgpu/types 的签名。
      this.passEncoder.drawIndexed(
        draw.indexCount,
        draw.instanceCount,
        draw.firstIndex,
        draw.baseVertex,
        draw.firstInstance,
      );
      this.nativeCall('drawIndexed', draw.indexCount, draw.instanceCount, draw.firstIndex, draw.baseVertex);
    } else {
      // draw(vertexCount, instanceCount, firstVertex, firstInstance)：非实例化时 instanceCount 为 1
      this.passEncoder.draw(draw.vertexCount, draw.instanceCount, draw.firstVertex, draw.firstInstance);
      this.nativeCall('draw', draw.vertexCount, draw.instanceCount, draw.firstVertex);
    }

    if (instanced) stats.instancedDrawCalls++;
    else stats.drawCalls++;
    // 合并掉的次数记在这里：merged 是批次覆盖的原始绘制数
    if (merged > 1) stats.mergedDraws += merged - 1;
  }

  private resolveDraw(options: DrawOptions, vao: GPUVertexArray): ResolvedDraw {
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

  private requirePipeline(call: string): Pipeline {
    if (!this.currentPipeline) {
      throw invalidDescriptor(`${this.label}: ${call} 之前必须先设置管线`, {
        hint: 'renderPass.pipeline(pipeline) 会完成原生管线绑定。',
      });
    }
    return this.currentPipeline;
  }

  private requireVao(call: string): GPUVertexArray {
    if (!this.currentVao) {
      throw invalidDescriptor(`${this.label}: ${call} 之前必须先设置顶点数组`);
    }
    return this.currentVao;
  }

  /** 上传当前管线所有 uniform 块的脏区间（经 queue.writeBuffer）。 */
  private flushUniforms(pipeline: Pipeline): void {
    for (const block of pipeline.blocks) block.buffer?.flush();
  }

  /**
   * 解析颜色附件。
   *
   * 差异保留：清屏在这里被翻译成 loadOp='clear' + clearValue —— WebGPU 没有独立清屏调用。
   * null 槽位原样保留（WebGPU 允许），这样 attachment 下标与着色器的 @location 输出保持对应。
   */
  private resolveColorAttachments(descriptor: FrameDescriptor): (GPURenderPassColorAttachment | null)[] {
    // 省略 colorAttachments 即"渲染到画布的默认颜色目标"
    const declared = descriptor.colorAttachments ?? [DEFAULT_COLOR_ATTACHMENT];
    const result: (GPURenderPassColorAttachment | null)[] = [];
    for (const attachment of declared) {
      if (!attachment) {
        result.push(null);
        continue;
      }
      const where = `${this.label}: colorAttachments[${result.length}]`;
      const clear = attachment.clearColor ?? descriptor.clearColor ?? BLACK;
      const clears = attachment.clearColor !== undefined || descriptor.clearColor != null;
      result.push({
        view: attachment.texture ? this.textureView(attachment.texture, where) : this.canvasViewOrThrow(where),
        loadOp: attachment.loadOp ?? (clears ? 'clear' : 'load'),
        storeOp: attachment.storeOp ?? 'store',
        clearValue: { r: clear.r, g: clear.g, b: clear.b, a: clear.a },
        resolveTarget: attachment.resolveTarget ? this.textureView(attachment.resolveTarget, where) : undefined,
      });
      this.assertMipLevel(where, attachment.mipLevel);
    }
    return result;
  }

  /** 解析深度模板附件。清屏同样由 loadOp 表达；readOnly 映射到 depthReadOnly。 */
  private resolveDepthAttachment(descriptor: FrameDescriptor): GPURenderPassDepthStencilAttachment | undefined {
    const depth = descriptor.depthStencil;
    if (!depth) return undefined;
    if (!depth.texture) {
      throw invalidDescriptor(`${this.label}: WebGPU 的深度附件需要显式 texture`, {
        hint: 'WebGPU 没有"画布默认深度缓冲"；请创建带 RenderAttachment 用途的深度纹理。',
      });
    }
    const view = this.textureView(depth.texture, `${this.label}: depthStencil.texture`);
    if (depth.readOnly === true) {
      // depthReadOnly 为 true 时不允许再给 loadOp / storeOp，原生校验会拒绝
      return { view, depthReadOnly: true };
    }
    const clearDepth = depth.clearDepth ?? descriptor.clearDepth;
    const clearStencil = depth.clearStencil ?? descriptor.clearStencil;
    const clears = clearDepth !== undefined || clearStencil !== undefined;
    const loadOp = depth.loadOp ?? (clears ? 'clear' : 'load');
    const attachment: GPURenderPassDepthStencilAttachment = {
      view,
      depthLoadOp: loadOp,
      depthStoreOp: depth.storeOp ?? 'store',
      depthClearValue: clearDepth ?? 1,
    };
    // 模板位只在带模板的格式上存在；给纯深度格式设置模板操作是无意义的
    if (depth.texture.format === TextureFormat.Depth24PlusStencil8) {
      attachment.stencilLoadOp = loadOp;
      attachment.stencilStoreOp = depth.storeOp ?? 'store';
      attachment.stencilClearValue = clearStencil ?? 0;
    }
    return attachment;
  }

  /** 取纹理的默认视图；非 WebGPU 纹理直接报类型错。 */
  private textureView(texture: Texture, where: string): GPUTextureView {
    if (!(texture instanceof GPUTexture)) {
      throw typeMismatch(`${where} 需要 WebGPU 后端创建的纹理`, {
        hint: '用 device.createTexture() 创建，或省略来渲染到画布。',
      });
    }
    return texture.view;
  }

  private canvasViewOrThrow(where: string): GPUTextureView {
    if (!this.canvasView) {
      throw invalidDescriptor(`${where} 没有指定 texture，且当前帧没有画布视图`, {
        hint: '离屏渲染请在 colorAttachments 里显式给出 texture。',
      });
    }
    return this.canvasView;
  }

  /**
   * WebGPU 的 mip 层由视图（baseMipLevel）表达，本类只取纹理的默认全 mip 视图；
   * 非 0 的 mipLevel 无法在这里表达，明确报错而不是静默写到第 0 层。
   */
  private assertMipLevel(where: string, mipLevel: number | undefined): void {
    if (mipLevel !== undefined && mipLevel !== 0) {
      throw invalidDescriptor(`${where}: 本类只提供默认视图，mipLevel 必须为 0`, {
        hint: '需要渲染到指定 mip 时请自建 GPUTextureView 并下探 gpuDevice 编码通道。',
      });
    }
  }

  /** 记录一次真正落到原生 API 的调用（与 GLStateCache.call 对齐）。 */
  private nativeCall(name: string, ...args: unknown[]): void {
    this.device.stats.nativeCalls++;
    if (this.device.debug.logCommands) this.device.commands.record('gpu', name, args);
  }
}
