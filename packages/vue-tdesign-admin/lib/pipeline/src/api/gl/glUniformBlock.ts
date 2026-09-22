/**
 * WebGL / WebGL2 的 uniform 块实现。
 *
 * 差异保留（这是三种 API 差别最大的一处，因此不做统一）：
 *  - WebGL2：真实 UBO。块有自己的 GLBuffer，数据按 std140 偏移写进 staging，
 *    flush 时先上传脏区间、再把缓冲 bindBufferBase 到块的 binding 槽位。
 *    块的 binding 由 uniformBlockBinding 在管线创建时一次性写死（见 glPipeline.ts）。
 *  - WebGL1：没有 UBO，GLSL ES 1.0 也不允许声明 uniform 块。此时进入
 *    degraded 模式：block.buffer === null，成员退化为同名 loose uniform，
 *    set() 直接转发给对应的 GLUniform。这一退化是显式可探测的
 *    （device.capabilities.uniformBuffers === false），不做静默模拟。
 *
 * 两端共用同一份 std140 布局结果，因此块的声明只写一次。
 */
import type { Device } from '../../core/device.js';
import type { Buffer } from '../../core/buffer.js';
import { type Std140MemberLayout, type UniformValue } from '../../core/data.js';
import { invalidDescriptor, typeMismatch, unsupported } from '../../core/errors.js';
import { BufferRole } from '../../core/handle.js';
import { UniformBlock, type UniformBlockDescriptor } from '../../core/uniformBlock.js';
import { BufferUsage } from '../../core/types.js';
import { gl2, type GLContext } from './constants.js';
import { GLBuffer } from './glBuffer.js';
import type { GLStateCache } from './glState.js';
import type { GLUniform } from './glUniform.js';

export class GLUniformBlock extends UniformBlock {
  private readonly gl: GLContext;
  private readonly state: GLStateCache;
  private readonly backing: GLBuffer | null;
  /** 外部接管的共享 UBO；为 null 时用内部 backing */
  private external: GLBuffer | null = null;
  /** 着色器里该块的索引；-1 表示着色器未使用该块（会被优化掉） */
  private readonly nativeIndex: number;

  /** 降级模式下按成员名对应的 loose uniform */
  private degradedMembers: readonly GLUniform[] = [];

  constructor(
    device: Device,
    descriptor: UniformBlockDescriptor,
    state: GLStateCache,
    nativeIndex = -1,
  ) {
    super(device, descriptor);
    this.gl = state.gl;
    this.state = state;
    this.nativeIndex = nativeIndex;
    if (state.webgl2) {
      this.backing = new GLBuffer(
        device,
        {
          label: `${this.name} UBO`,
          usage: BufferUsage.Uniform | BufferUsage.CopyDst,
          role: BufferRole.Uniform,
          size: this.size,
          frequency: this.frequency,
        },
        state,
      );
    } else {
      this.backing = null;
    }
  }

  get buffer(): Buffer | null {
    return this.external ?? this.backing;
  }

  get degraded(): boolean {
    return this.backing === null;
  }

  get dirty(): boolean {
    if (this.backing) return (this.external ?? this.backing).dirtyRange !== null;
    return this.degradedMembers.some((uniform) => uniform.dirty);
  }

  /**
   * WebGL2：把一块外部缓冲挂到本块的 binding 槽位，让多个管线共享同一份 UBO
   * （原生对应 bindBufferBase 的目标缓冲可以复用，这里只是把数据源换成它）。
   * 传 null 恢复块自建的内部 UBO。写入仍走 set()/setMany()，偏移按本块的 std140 布局。
   */
  useBuffer(buffer: Buffer | null): void {
    this.assertAlive('useBuffer');
    if (!this.backing) {
      throw unsupported(`${this.name}: WebGL1 没有 uniform 块，无法挂载外部 UBO`, {
        hint: 'capabilities.uniformBuffers === false 时块成员退化为同名 loose uniform，请用 set() 赋值。',
      });
    }
    if (buffer === null) {
      this.external = null;
      return;
    }
    if (!(buffer instanceof GLBuffer)) {
      throw typeMismatch(`${this.name}: useBuffer 只接受本后端创建的缓冲`, {
        hint: '用 device.createBuffer({ role: BufferRole.Uniform }) 创建。',
      });
    }
    if (buffer.role !== BufferRole.Uniform) {
      throw typeMismatch(`${this.name}: 缓冲 role 为 ${buffer.role}，uniform 块需要 ${BufferRole.Uniform}`);
    }
    if (buffer.size < this.size) {
      throw invalidDescriptor(
        `${this.name}: 共享 UBO 太小（${buffer.size} 字节 < 块布局的 ${this.size} 字节）`,
        { hint: '块的整体尺寸由 std140 布局决定，共享缓冲不得小于它。' },
      );
    }
    this.external = buffer;
  }

  /** 着色器里的块索引；-1 表示该块未被着色器使用。 */
  get blockIndex(): number {
    return this.nativeIndex;
  }

  /**
   * 降级模式接线：由 glPipeline 在创建块之后调用，把成员名映射到
   * 程序里同名的 loose uniform。WebGL2 下不需要，调用会被忽略。
   */
  attachMembers(uniforms: Iterable<GLUniform>): void {
    this.degradedMembers = [...uniforms];
  }

  set(member: string, value: UniformValue): void {
    this.assertAlive('set');
    const layout = this.requireLayout(member);
    const backing = this.external ?? this.backing;
    if (!backing) {
      const uniform = this.findDegradedMember(member);
      uniform.set(value);
      return;
    }
    // writeMember 内部会 seek 到成员偏移并按 std140 展开数组
    backing.writer().writeMember(layout, value);
    backing.markDirty(layout.offset, layout.byteSize);
  }

  setMany(values: Record<string, UniformValue>): void {
    this.assertAlive('setMany');
    for (const [member, value] of Object.entries(values)) this.set(member, value);
  }

  /**
   * 上传脏数据并绑定到块的槽位。
   * WebGL2 下调用者必须已 useProgram（块的 binding 是程序级状态）；
   * 降级模式下转发给成员的 uniform.flush()，同样要求程序已绑定。
   */
  flush(): void {
    this.assertAlive('flush');
    const backing = this.external ?? this.backing;
    if (!backing) {
      for (const uniform of this.degradedMembers) uniform.flush();
      return;
    }
    // 先上传数据，再绑定：反过来的话绑定期间缓冲内容还是旧的
    backing.flush();
    this.state.bindBufferBase(gl2(this.gl).UNIFORM_BUFFER, this.binding, backing.glBuffer);
  }

  protected override onDestroy(): void {
    // 内部 UBO 随块一起释放；外部共享缓冲的所有权在调用方
    if (!this.external) this.backing?.destroy();
    this.external = null;
    this.degradedMembers = [];
  }

  private requireLayout(member: string): Std140MemberLayout {
    const layout = this.member(member);
    if (!layout) {
      throw typeMismatch(
        `${this.describe()}: 不存在成员 ${member}；可用成员: ${[...this.layout.byName.keys()].join(', ')}`,
      );
    }
    return layout;
  }

  private findDegradedMember(member: string): GLUniform {
    for (const uniform of this.degradedMembers) {
      if (uniform.name === member) return uniform;
    }
    throw typeMismatch(
      `${this.describe()}: 降级模式下未接线成员 ${member}（着色器里可能不存在同名 uniform）`,
    );
  }
}
