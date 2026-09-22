/**
 * WebGPU 的 uniform 块实现（原生 UBO）。
 *
 * 与 GL 侧的差异（保留，不做抹平）：
 *  - GL 侧 WebGL1 没有 UBO，会降级成"逐成员 loose uniform 上传"（buffer === null）。
 *    WebGPU 没有这条退路：uniform 值只能待在 uniform buffer 里，因此本实现永远
 *    持有真实 UBO，degraded 恒为 false。
 *  - 合成块：WebGPU 不存在游离 uniform，管线会把 loose uniforms 合成到 $uniforms
 *    （PipelineBlockLayout.synthesized === true）。GL 侧会跳过它，这里相反 —— 必须
 *    为它建真实 UBO，否则这些值无处可写。
 *  - 没有绑定动作：块的 binding 在创建 bind group layout 时就写死了，flush 只负责
 *    把脏区间经 queue.writeBuffer 上传。
 *
 * 块布局沿用 core 推导的同一份 std140 结果，因此块声明只写一次。
 */
import type { Buffer } from '../../core/buffer.js';
import type { UniformValue } from '../../core/data.js';
import type { Device } from '../../core/device.js';
import { typeMismatch } from '../../core/errors.js';
import type { PipelineBlockLayout } from '../../core/pipeline.js';
import { UniformBlock } from '../../core/uniformBlock.js';
import { BufferUsage } from '../../core/types.js';
import { GPUUniform } from './gpuUniform.js';

export class GPUUniformBlock extends UniformBlock {
  /** 真实 UBO，永不降级 */
  private readonly backing: Buffer;
  /** 成员名 -> 成员视图，供 setUniform('Block.member') 路由 */
  private readonly uniforms = new Map<string, GPUUniform>();

  constructor(device: Device, layout: PipelineBlockLayout, gpuDevice: GPUDevice) {
    super(device, {
      name: layout.name,
      members: layout.layout.members,
      binding: layout.binding,
      group: layout.group,
      frequency: layout.frequency,
      size: layout.layout.size,
    });
    // 合成块 $uniforms 在 WebGPU 下同样需要一块真实缓冲；一律走 device.createBuffer
    this.backing = device.createBuffer({
      label: `${this.name} UBO`,
      size: layout.layout.size,
      usage: BufferUsage.Uniform,
      frequency: layout.frequency,
    });
    for (const member of this.layout.members) {
      this.uniforms.set(
        member.name,
        new GPUUniform(
          device,
          { name: member.name, type: member.type, count: member.count },
          member.offset,
          this,
        ),
      );
    }
  }

  /** 真实 UBO；WebGPU 没有降级模式，永不返回 null。 */
  override get buffer(): Buffer | null {
    return this.backing;
  }

  /** WebGPU 没有"逐成员上传"的退路，恒为 false。 */
  override get degraded(): boolean {
    return false;
  }

  override get dirty(): boolean {
    return this.backing.dirtyRange !== null;
  }

  /** 取出某个成员视图；未声明时返回 undefined，由调用方决定报错方式。 */
  uniform(name: string): GPUUniform | undefined {
    return this.uniforms.get(name);
  }

  override set(member: string, value: UniformValue): void {
    this.assertAlive('set');
    this.requireUniform(member).set(value);
  }

  override setMany(values: Record<string, UniformValue>): void {
    this.assertAlive('setMany');
    for (const [member, value] of Object.entries(values)) this.set(member, value);
  }

  override flush(): void {
    this.assertAlive('flush');
    this.backing.flush();
  }

  protected override onDestroy(): void {
    // 成员视图由本对象创建，随之一并释放，避免注册表里留下孤儿
    for (const uniform of this.uniforms.values()) uniform.destroy();
    this.uniforms.clear();
    this.backing.destroy();
  }

  private requireUniform(member: string): GPUUniform {
    const uniform = this.uniforms.get(member);
    if (!uniform) {
      throw typeMismatch(
        `${this.describe()}: 不存在成员 ${member}；可用成员: ${[...this.layout.byName.keys()].join(', ')}`,
      );
    }
    return uniform;
  }
}
