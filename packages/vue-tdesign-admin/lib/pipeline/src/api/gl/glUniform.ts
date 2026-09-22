/**
 * WebGL / WebGL2 的 uniform 实现。
 *
 * 差异保留：
 *  - uniform 是"程序的一部分"，赋值前必须已 useProgram。因此 set() 只做
 *    打包与比对，真正的原生调用推迟到 flush()，由管线在绑定程序之后触发。
 *    这样既避免"对着未绑定程序设 uniform"这类静默失效，也把同一帧内对同一
 *    uniform 的多次设置压缩成一次。
 *  - 类型决定调用族：浮点/矩阵走 uniform{f}，i32 走 uniform{i}，u32 走
 *    uniform{u}（WebGL2 专有，WebGL1 下构造期直接抛 unsupported）。
 *  - 数组 uniform 用"整段赋值"提交（uniform4fv(loc0, 全部元素)），
 *    不做逐元素循环，也不为每个元素取 location。
 *
 * 脏标记：值与前一次完全相同时跳过（packedEquals 逐字节比较），
 * 计入 stats.uniformSkips —— 这是"每帧重设同一颜色"这类浪费的落点。
 */
import { packUniformValue, packedEquals, type PackedValue, type UniformValue } from '../../core/data.js';
import { invalidDescriptor, unsupported } from '../../core/errors.js';
import type { ResourceOwner } from '../../core/resource.js';
import { componentCount, isFloatType, isMatrixType, matrixColumns, ShaderDataType } from '../../core/types.js';
import { Uniform, type UniformDescriptor } from '../../core/uniform.js';
import { gl2, type GLContext } from './constants.js';
import type { GLStateCache } from './glState.js';

export class GLUniform extends Uniform {
  private readonly gl: GLContext;
  private readonly state: GLStateCache;

  /** 着色器反射得到的真实 location；null 表示该 uniform 未被着色器使用（失活）。 */
  private readonly webglLocation: WebGLUniformLocation | null;
  /** 程序内序号，供 Uniform.location 使用（WebGL 的 location 是对象，不是数字） */
  private readonly index: number;

  private readonly columns: number;
  private readonly components: number;
  private readonly integer: boolean;
  private readonly signed: boolean;

  /** 已提交到原生的值 */
  private current: PackedValue | null = null;
  /** 待提交的值 */
  private pending: PackedValue | null = null;

  constructor(
    owner: ResourceOwner,
    descriptor: UniformDescriptor,
    state: GLStateCache,
    location: WebGLUniformLocation | null,
    index = descriptor.location ?? -1,
  ) {
    super(owner, descriptor);
    if (!isFloatType(descriptor.type) && !isMatrixType(descriptor.type) && !state.webgl2) {
      throw unsupported(
        `WebGL1 不支持整数 uniform ${descriptor.name}(${descriptor.type})，请改用浮点或在 WebGL2 下运行`,
      );
    }
    if (descriptor.type === ShaderDataType.F16x2 || descriptor.type === ShaderDataType.F16x4) {
      throw invalidDescriptor(`uniform ${descriptor.name} 不能使用顶点属性专用的 ${descriptor.type}`);
    }
    this.gl = state.gl;
    this.state = state;
    this.webglLocation = location;
    this.index = index;
    this.columns = isMatrixType(descriptor.type) ? matrixColumns(descriptor.type) : 0;
    this.components = componentCount(descriptor.type);
    this.integer = this.columns === 0 && !isFloatType(descriptor.type);
    this.signed = descriptor.type.startsWith('i32');
  }

  override get location(): number {
    return this.index;
  }

  /** 原生 WebGLUniformLocation。为 null 说明该 uniform 已被着色器优化掉。 */
  get nativeLocation(): WebGLUniformLocation | null {
    return this.webglLocation;
  }

  /** 该 uniform 是否真的存在于已链接的程序中。 */
  get active(): boolean {
    return this.webglLocation !== null;
  }

  get dirty(): boolean {
    return this.pending !== null;
  }

  get value(): PackedValue | undefined {
    return this.pending ?? this.current ?? undefined;
  }

  /** 每个元素的字节数（数组 uniform 需乘以 count） */
  get elementByteSize(): number {
    return this.components * (this.columns > 0 ? this.columns : 1) * 4;
  }

  set(value: UniformValue): void {
    this.assertAlive('set');
    const packed = packUniformValue(this.type, value, this.count, `uniform ${this.name}`);
    if (packedEquals(this.pending ?? undefined, packed)) {
      this.recordSkip();
      return;
    }
    if (packedEquals(this.current ?? undefined, packed)) {
      // 回到已提交的旧值：撤掉待提交内容，同样不需要原生调用
      this.pending = null;
      this.recordSkip();
      return;
    }
    this.pending = packed;
  }

  /** 值未变化，记一次跳过并累加 uniform 专属计数。 */
  private recordSkip(): void {
    this.state.skip('uniform');
    this.state.stats.uniformSkips++;
  }

  markDirty(): void {
    this.pending = this.current;
  }

  /**
   * 把待提交的值写进原生程序。调用者必须已 useProgram(this 所属程序)。
   * 返回 true 表示发生了原生调用。
   */
  flush(): boolean {
    const value = this.pending;
    if (value === null) return false;
    this.assertAlive('flush');
    if (this.webglLocation === null) {
      // 失活的 uniform：着色器里根本不存在，静默丢弃但清掉待提交标记
      this.pending = null;
      return false;
    }
    this.applyNative(value);
    this.current = value;
    this.pending = null;
    this.state.stats.uniformSets++;
    return true;
  }

  protected override onDestroy(): void {
    this.current = null;
    this.pending = null;
  }

  private applyNative(value: PackedValue): void {
    const location = this.webglLocation as WebGLUniformLocation;
    const gl = this.gl;

    if (this.columns > 0) {
      const data = value as Float32Array;
      if (this.columns === 2) {
        gl.uniformMatrix2fv(location, false, data);
        this.state.call('uniformMatrix2fv', this.name);
      } else if (this.columns === 3) {
        gl.uniformMatrix3fv(location, false, data);
        this.state.call('uniformMatrix3fv', this.name);
      } else {
        gl.uniformMatrix4fv(location, false, data);
        this.state.call('uniformMatrix4fv', this.name);
      }
      return;
    }

    if (!this.integer) {
      const data = value as Float32Array;
      switch (this.components) {
        case 1:
          gl.uniform1fv(location, data);
          this.state.call('uniform1fv', this.name);
          break;
        case 2:
          gl.uniform2fv(location, data);
          this.state.call('uniform2fv', this.name);
          break;
        case 3:
          gl.uniform3fv(location, data);
          this.state.call('uniform3fv', this.name);
          break;
        default:
          gl.uniform4fv(location, data);
          this.state.call('uniform4fv', this.name);
          break;
      }
      return;
    }

    if (this.signed) {
      const data = value as Int32Array;
      switch (this.components) {
        case 1:
          gl.uniform1iv(location, data);
          this.state.call('uniform1iv', this.name);
          break;
        case 2:
          gl.uniform2iv(location, data);
          this.state.call('uniform2iv', this.name);
          break;
        case 3:
          gl.uniform3iv(location, data);
          this.state.call('uniform3iv', this.name);
          break;
        default:
          gl.uniform4iv(location, data);
          this.state.call('uniform4iv', this.name);
          break;
      }
      return;
    }

    // u32 系：WebGL2 专有，构造期已确认
    const context = gl2(gl);
    const data = value as Uint32Array;
    switch (this.components) {
      case 1:
        context.uniform1uiv(location, data);
        this.state.call('uniform1uiv', this.name);
        break;
      case 2:
        context.uniform2uiv(location, data);
        this.state.call('uniform2uiv', this.name);
        break;
      case 3:
        context.uniform3uiv(location, data);
        this.state.call('uniform3uiv', this.name);
        break;
      default:
        context.uniform4uiv(location, data);
        this.state.call('uniform4uiv', this.name);
        break;
    }
  }
}
