/**
 * WebGL / WebGL2 的顶点属性实现。
 *
 * 差异保留：
 *  - WebGL 的属性必须在绘制前用 vertexAttribPointer 写入指针。本类把
 *    "绑定缓冲 + 设置指针 + enable + divisor" 收敛成一个 apply()，
 *    由 GLVertexArray 在正确时机（写入 VAO 时 / 脏标记未命中时）调用。
 *  - WebGL2 的整数属性必须走 vertexAttribIPointer；WebGL1 遇到整数属性由
 *    vertexFormatInfo 直接抛 unsupported，不做静默降级。
 *  - WebGL1 的 divisor 来自 ANGLE_instanced_arrays；既无扩展又需要逐实例时同样抛错。
 *
 * 脏标记：pointerApplied 记录"指针是否已按当前绑定写入"。命中时
 * GLVertexArray 会整段跳过原生调用，这是避免每帧重设指针的关键。
 * 注意 pointer 状态在 WebGL2 / OES_vertex_array_object 下是 VAO 的一部分，
 * 因此一个 GLAttribute 实例只应归属于一个 VAO（GLVertexArray 构造时创建）。
 */
import { Attribute, type ResolvedAttributeDescriptor } from '../../core/attribute.js';
import type { Buffer } from '../../core/buffer.js';
import { invalidDescriptor, typeMismatch, unsupported } from '../../core/errors.js';
import { BufferRole } from '../../core/handle.js';
import type { ResourceOwner } from '../../core/resource.js';
import { gl2, vertexFormatInfo, type GLExtensions, type GLContext, type VertexFormatInfo } from './constants.js';
import { GLBuffer } from './glBuffer.js';
import type { GLStateCache } from './glState.js';

export class GLAttribute extends Attribute {
  private readonly gl: GLContext;
  private readonly state: GLStateCache;
  private readonly extensions: GLExtensions;
  private readonly webgl2: boolean;
  private readonly formatInfo: VertexFormatInfo;

  private source: GLBuffer | null = null;

  /** 指针是否已按当前绑定写入（WebGL 脏标记的落点） */
  private pointerApplied = false;
  /** 顶点属性数组当前是否处于 enable 状态 */
  private pointerEnabled = false;
  /** 已生效的 divisor；null 表示未知（下一次必然重设） */
  private appliedDivisor: number | null = null;

  constructor(owner: ResourceOwner, descriptor: ResolvedAttributeDescriptor, state: GLStateCache) {
    super(owner, descriptor);
    this.state = state;
    this.gl = state.gl;
    this.extensions = state.extensions;
    this.webgl2 = state.webgl2;
    // 格式合法性在构造期就确认，避免首次绘制才发现格式不被当前上下文支持
    this.formatInfo = vertexFormatInfo(descriptor.format, state.gl);
  }

  override get buffer(): Buffer | null {
    return this.source;
  }

  get vertexBuffer(): GLBuffer | null {
    return this.source;
  }

  get enabled(): boolean {
    return this.pointerApplied && this.pointerEnabled;
  }

  get appliedDivisorValue(): number {
    return this.appliedDivisor ?? this.descriptor.divisor;
  }

  setBuffer(buffer: Buffer | null, options: { offset?: number; stride?: number } = {}): void {
    this.assertAlive('setBuffer');
    if (buffer !== null && !(buffer instanceof GLBuffer)) {
      throw typeMismatch(`属性 ${this.name} 只能绑定 WebGL 缓冲，收到其它后端的 Buffer`);
    }
    if (buffer && buffer.role !== BufferRole.Vertex) {
      throw invalidDescriptor(
        `属性 ${this.name} 只能绑定 role=Vertex 的缓冲，收到 ${buffer.role}`,
      );
    }
    const offset = options.offset ?? this.descriptor.offset;
    const stride = options.stride ?? this.descriptor.stride;
    if (!Number.isInteger(offset) || offset < 0) {
      throw invalidDescriptor(`属性 ${this.name} 的 offset 必须是非负整数，收到 ${offset}`);
    }
    if (!Number.isInteger(stride) || stride <= 0) {
      throw invalidDescriptor(`属性 ${this.name} 的 stride 必须是正整数，收到 ${stride}`);
    }
    if (stride < offset + this.byteSize) {
      throw invalidDescriptor(
        `属性 ${this.name} 的 stride(${stride}) 小于 offset(${offset}) + 元素大小(${this.byteSize})`,
      );
    }
    const unchanged =
      this.source === buffer && this.descriptor.offset === offset && this.descriptor.stride === stride;
    this.source = buffer;
    this.descriptor.offset = offset;
    this.descriptor.stride = stride;
    if (!unchanged) this.markDirty();
  }

  markDirty(): void {
    // pointer / enable / divisor 都是 VAO 的一部分，因此一并作废
    this.pointerApplied = false;
    this.appliedDivisor = null;
    if (this.source === null) this.pointerEnabled = false;
  }

  /**
   * 把属性状态写入当前上下文（调用者必须已绑定本属性所属的 VAO）。
   * 返回 true 表示确实发生了原生调用，false 表示脏标记命中、整段跳过。
   */
  apply(): boolean {
    this.assertAlive('apply');
    const source = this.source;
    if (source === null) return this.disable();

    if (this.pointerApplied && this.appliedDivisor === this.descriptor.divisor) {
      this.state.skip('attribute');
      return false;
    }

    const location = this.location;
    const { type, components, integer } = this.formatInfo;
    // toNullable 语义：WebGL 的 pointer 参数就是缓冲区对象，这里统一走状态缓存
    this.state.bindBuffer(source.target, source.glBuffer);

    if (integer) {
      // integer 为真意味着格式属于 I32/U32 系，在 WebGL1 上 vertexFormatInfo 已提前抛错
      gl2(this.gl).vertexAttribIPointer(location, components, type, this.descriptor.stride, this.byteOffset);
      this.state.call('vertexAttribIPointer', location, components, type, this.descriptor.stride, this.byteOffset);
    } else {
      this.gl.vertexAttribPointer(
        location,
        components,
        type,
        this.descriptor.normalized,
        this.descriptor.stride,
        this.byteOffset,
      );
      this.state.call(
        'vertexAttribPointer',
        location,
        components,
        type,
        this.descriptor.normalized,
        this.descriptor.stride,
        this.byteOffset,
      );
    }

    if (!this.pointerEnabled) {
      this.gl.enableVertexAttribArray(location);
      this.state.call('enableVertexAttribArray', location);
      this.pointerEnabled = true;
    }
    this.applyDivisor();
    this.pointerApplied = true;
    return true;
  }

  /** 关闭该属性。缓冲区被解绑时必须显式关闭，否则会读到旧指针。 */
  disable(): boolean {
    if (!this.pointerEnabled) return false;
    this.assertAlive('disable');
    this.gl.disableVertexAttribArray(this.location);
    this.state.call('disableVertexAttribArray', this.location);
    this.pointerEnabled = false;
    this.pointerApplied = false;
    return true;
  }

  private applyDivisor(): void {
    const divisor = this.descriptor.divisor;
    if (this.appliedDivisor === divisor) return;
    if (this.webgl2) {
      gl2(this.gl).vertexAttribDivisor(this.location, divisor);
      this.state.call('vertexAttribDivisor', this.location, divisor);
    } else if (divisor > 0) {
      const extension = this.extensions.instancedArrays;
      if (!extension) {
        throw unsupported(
          `WebGL1 缺少 ANGLE_instanced_arrays 扩展，属性 ${this.name} 无法使用 divisor=${divisor} 的逐实例取值`,
        );
      }
      extension.vertexAttribDivisorANGLE(this.location, divisor);
      this.state.call('vertexAttribDivisorANGLE', this.location, divisor);
    }
    // divisor 为 0 且无扩展时，默认值本就是 0，无需原生调用但仍记录已生效
    this.appliedDivisor = divisor;
  }

  protected override onDestroy(): void {
    // 无 VAO 扩展的 WebGL1 下属性是全局状态，销毁后必须让缓存重新同步
    if (this.state.currentVertexArray === null) this.pointerEnabled = false;
    this.source = null;
    this.pointerApplied = false;
    this.appliedDivisor = null;
  }
}
