/**
 * WebGL 全局状态缓存（脏标记系统的落点）。
 *
 * WebGL 的状态是全局的：每次 set 都会穿越 JS→原生边界，重复设置同一状态纯属浪费。
 * 本类把"库认为当前生效的状态"记录下来，命中缓存就跳过原生调用，并计入
 * stats.stateSkips；未命中则调用原生并计入 stats.nativeCalls。
 *
 * 三条纪律：
 *  1. 只跳过"值完全相同"的设置，不做近似判断
 *  2. 任何绕过本类直接操作原生上下文的行为都会让缓存失真 —— 因此适配层内部
 *     所有状态设置必须走这里；确需绕过时调用 invalidate() 让缓存整体失效
 *  3. 上下文丢失后必须 invalidate()，因为原生状态已被重置为默认值
 */
import { unsupported } from '../../core/errors.js';
import { GraphicsApi } from '../../core/types.js';
import type { DeviceStats } from '../../core/stats.js';
import type { CommandRecorder, DebugConfig } from '../../core/debug.js';
import { gl2, type GLExtensions, type GLContext, type VertexArrayObjectExtension } from './constants.js';

export class GLStateCache {
  readonly gl: GLContext;
  readonly webgl2: boolean;
  readonly extensions: GLExtensions;

  readonly stats: DeviceStats;
  private readonly debug: DebugConfig;
  private readonly commands: CommandRecorder;

  // 缓存值统一用 undefined 表示"未知/从未设置"，null 表示"已设置为空绑定"
  private program: WebGLProgram | null | undefined;
  private vao: WebGLVertexArrayObject | null | undefined;
  private activeUnit: number | undefined;
  /** viewport / scissor 用字符串快照比较，避免 4 个数字各自建缓存 */
  private lastViewport = '';
  private lastScissor = '';

  private readonly buffers = new Map<number, WebGLBuffer | null>();
  private readonly indexed = new Map<string, WebGLBuffer | null>();
  private readonly textures = new Map<string, WebGLTexture | null>();
  private readonly samplers = new Map<number, WebGLSampler | null>();
  private readonly caps = new Map<number, boolean>();
  private readonly blendFunc = new Map<string, number>();
  private readonly blendEquation = new Map<string, number>();
  private readonly stencilFunc = new Map<number, string>();
  private readonly stencilOp = new Map<number, string>();
  private readonly stencilMask = new Map<number, number>();
  private readonly depth = new Map<string, number | boolean>();
  private readonly raster = new Map<string, number>();
  private readonly pixels = new Map<number, number>();
  private readonly misc = new Map<string, number>();

  constructor(
    gl: GLContext,
    webgl2: boolean,
    extensions: GLExtensions,
    stats: DeviceStats,
    debug: DebugConfig,
    commands: CommandRecorder,
  ) {
    this.gl = gl;
    this.webgl2 = webgl2;
    this.extensions = extensions;
    this.stats = stats;
    this.debug = debug;
    this.commands = commands;
  }

  // -------------------------------------------------------------------------
  // 原生调用记账
  // -------------------------------------------------------------------------

  /**
   * 记录一次即将落到原生的调用。公开给适配层内部共用：像 bufferData 这类
   * 不属于"状态"、因而不经过缓存判定的调用，也需要计入 nativeCalls 与
   * 命令日志，否则统计与调试信息会漏掉一半。
   */
  call(name: string, ...args: unknown[]): void {
    this.stats.nativeCalls++;
    if (this.debug.logCommands) this.commands.record('gl', name, args);
  }

  /**
   * 记录一次"因状态已相同而跳过"的调用。公开给适配层内部共用：
   * 顶点属性指针这类不属于本类管理、但同样按脏标记跳过的状态需要计到这里，
   * 否则 stateSkips 会漏掉整块最值得优化的开销。
   */
  skip(name: string): void {
    this.stats.skipState(name);
  }

  /** 让整份缓存失效，下一次设置必然落到原生调用。上下文丢失后调用。 */
  invalidate(): void {
    this.program = undefined;
    this.vao = undefined;
    this.activeUnit = undefined;
    this.lastViewport = '';
    this.lastScissor = '';
    this.buffers.clear();
    this.indexed.clear();
    this.textures.clear();
    this.samplers.clear();
    this.caps.clear();
    this.blendFunc.clear();
    this.blendEquation.clear();
    this.stencilFunc.clear();
    this.stencilOp.clear();
    this.stencilMask.clear();
    this.depth.clear();
    this.raster.clear();
    this.pixels.clear();
    this.misc.clear();
  }

  // -------------------------------------------------------------------------
  // 删除对象后同步缓存
  // -------------------------------------------------------------------------

  /**
   * 原生对象被 delete 之后，GL 会自动把它从所有绑定点上摘掉。
   * 如果不清理缓存，缓存里仍留着已删除的对象，后续"同对象跳过"会导致
   * 实际绑定点为空却以为已绑好。这里把这些条目删掉（删除后 get 返回
   * undefined 表示未知，下次设置必然落到原生调用）。
   */
  forgetBuffer(buffer: WebGLBuffer): void {
    for (const [target, bound] of this.buffers) if (bound === buffer) this.buffers.delete(target);
    for (const [key, bound] of this.indexed) if (bound === buffer) this.indexed.delete(key);
  }

  forgetTexture(texture: WebGLTexture): void {
    for (const [key, bound] of this.textures) if (bound === texture) this.textures.delete(key);
  }

  forgetSampler(sampler: WebGLSampler): void {
    for (const [unit, bound] of this.samplers) if (bound === sampler) this.samplers.delete(unit);
  }

  forgetVertexArray(vao: WebGLVertexArrayObject): void {
    if (this.vao === vao) this.vao = undefined;
  }

  forgetProgram(program: WebGLProgram): void {
    if (this.program === program) this.program = undefined;
  }

  // -------------------------------------------------------------------------
  // 对象绑定
  // -------------------------------------------------------------------------

  get currentProgram(): WebGLProgram | null {
    return this.program ?? null;
  }

  get currentVertexArray(): WebGLVertexArrayObject | null {
    return this.vao ?? null;
  }

  bindBuffer(target: number, buffer: WebGLBuffer | null): boolean {
    if (this.buffers.get(target) === buffer) {
      this.skip('bindBuffer');
      return false;
    }
    this.buffers.set(target, buffer);
    this.call('bindBuffer', target, buffer);
    this.gl.bindBuffer(target, buffer);
    return true;
  }

  /** 把缓冲绑定到索引化绑定点（UBO 的 bindBufferBase）。仅 WebGL2。 */
  bindBufferBase(target: number, index: number, buffer: WebGLBuffer | null): boolean {
    const key = `${target}:${index}`;
    if (this.indexed.get(key) === buffer) {
      this.skip('bindBufferBase');
      return false;
    }
    this.indexed.set(key, buffer);
    this.call('bindBufferBase', target, index, buffer);
    gl2(this.gl).bindBufferBase(target, index, buffer);
    return true;
  }

  useProgram(program: WebGLProgram | null): boolean {
    if (this.program === program) {
      this.skip('useProgram');
      return false;
    }
    this.program = program;
    this.call('useProgram', program);
    this.gl.useProgram(program);
    return true;
  }

  bindVertexArray(vao: WebGLVertexArrayObject | null): boolean {
    if (this.vao === vao) {
      this.skip('bindVertexArray');
      return false;
    }
    if (!this.webgl2 && !this.extensions.vertexArrayObject) {
      throw unsupported('WebGL1 缺少 OES_vertex_array_object 扩展，无法绑定 VAO', {
        api: GraphicsApi.WebGL,
        call: 'bindVertexArray',
        hint: '先检查 device.capabilities.vertexArrayObject；不可用时请使用不依赖 VAO 的属性重放路径。',
      });
    }
    this.vao = vao;
    this.call('bindVertexArray', vao);
    if (this.webgl2) gl2(this.gl).bindVertexArray(vao);
    else (this.extensions.vertexArrayObject as VertexArrayObjectExtension).bindVertexArrayOES(vao);
    return true;
  }

  // -------------------------------------------------------------------------
  // 纹理与采样器
  // -------------------------------------------------------------------------

  activeTexture(unit: number): boolean {
    if (this.activeUnit === unit) {
      this.skip('activeTexture');
      return false;
    }
    this.activeUnit = unit;
    this.call('activeTexture', unit);
    this.gl.activeTexture((this.gl.TEXTURE0 as number) + unit);
    return true;
  }

  /**
   * 把纹理绑定到指定单元与目标。
   * 注意即使 `activeUnit` 已是目标单元，也只有在同一 (unit, target) 上绑过
   * 同一纹理时才跳过 —— 绑定点是按单元隔离的，与 activeTexture 是两件事。
   */
  bindTexture(unit: number, target: number, texture: WebGLTexture | null): boolean {
    const key = `${unit}:${target}`;
    if (this.textures.get(key) === texture) {
      this.skip('bindTexture');
      return false;
    }
    this.activeTexture(unit);
    this.textures.set(key, texture);
    this.call('bindTexture', target, texture);
    this.gl.bindTexture(target, texture);
    return true;
  }

  /** 绑定独立采样器对象（WebGL2）。 */
  bindSampler(unit: number, sampler: WebGLSampler | null): boolean {
    if (this.samplers.get(unit) === sampler) {
      this.skip('bindSampler');
      return false;
    }
    this.samplers.set(unit, sampler);
    this.call('bindSampler', unit, sampler);
    gl2(this.gl).bindSampler(unit, sampler);
    return true;
  }

  /** 取得某个 (单元, 目标) 上当前绑定的纹理，供"临时绑定后恢复"的场景使用。 */
  textureAt(unit: number, target: number): WebGLTexture | null {
    return this.textures.get(`${unit}:${target}`) ?? null;
  }

  // -------------------------------------------------------------------------
  // 开关型能力
  // -------------------------------------------------------------------------

  setCapability(cap: number, enabled: boolean, name: string): boolean {
    if (this.caps.get(cap) === enabled) {
      this.skip(name);
      return false;
    }
    this.caps.set(cap, enabled);
    if (enabled) {
      this.call('enable', cap);
      this.gl.enable(cap);
    } else {
      this.call('disable', cap);
      this.gl.disable(cap);
    }
    return true;
  }

  // -------------------------------------------------------------------------
  // 混合 / 深度 / 模板
  // -------------------------------------------------------------------------

  blendFuncSeparate(srcRGB: number, dstRGB: number, srcAlpha: number, dstAlpha: number): boolean {
    if (
      this.blendFunc.get('srcRGB') === srcRGB &&
      this.blendFunc.get('dstRGB') === dstRGB &&
      this.blendFunc.get('srcAlpha') === srcAlpha &&
      this.blendFunc.get('dstAlpha') === dstAlpha
    ) {
      this.skip('blendFuncSeparate');
      return false;
    }
    this.blendFunc.set('srcRGB', srcRGB).set('dstRGB', dstRGB).set('srcAlpha', srcAlpha).set('dstAlpha', dstAlpha);
    this.call('blendFuncSeparate', srcRGB, dstRGB, srcAlpha, dstAlpha);
    this.gl.blendFuncSeparate(srcRGB, dstRGB, srcAlpha, dstAlpha);
    return true;
  }

  blendEquationSeparate(modeRGB: number, modeAlpha: number): boolean {
    if (this.blendEquation.get('rgb') === modeRGB && this.blendEquation.get('alpha') === modeAlpha) {
      this.skip('blendEquationSeparate');
      return false;
    }
    this.blendEquation.set('rgb', modeRGB).set('alpha', modeAlpha);
    this.call('blendEquationSeparate', modeRGB, modeAlpha);
    this.gl.blendEquationSeparate(modeRGB, modeAlpha);
    return true;
  }

  depthFunc(func: number): boolean {
    return this.setNumber(this.depth, 'func', func, 'depthFunc', (v) => this.gl.depthFunc(v));
  }

  depthMask(flag: boolean): boolean {
    if (this.depth.get('mask') === flag) {
      this.skip('depthMask');
      return false;
    }
    this.depth.set('mask', flag);
    this.call('depthMask', flag);
    this.gl.depthMask(flag);
    return true;
  }

  stencilFuncSeparate(face: number, func: number, ref: number, mask: number): boolean {
    const value = `${func}:${ref}:${mask}`;
    if (this.stencilFunc.get(face) === value) {
      this.skip('stencilFuncSeparate');
      return false;
    }
    this.stencilFunc.set(face, value);
    this.call('stencilFuncSeparate', face, func, ref, mask);
    this.gl.stencilFuncSeparate(face, func, ref, mask);
    return true;
  }

  stencilOpSeparate(face: number, fail: number, zfail: number, zpass: number): boolean {
    const value = `${fail}:${zfail}:${zpass}`;
    if (this.stencilOp.get(face) === value) {
      this.skip('stencilOpSeparate');
      return false;
    }
    this.stencilOp.set(face, value);
    this.call('stencilOpSeparate', face, fail, zfail, zpass);
    this.gl.stencilOpSeparate(face, fail, zfail, zpass);
    return true;
  }

  stencilMaskSeparate(face: number, mask: number): boolean {
    if (this.stencilMask.get(face) === mask) {
      this.skip('stencilMaskSeparate');
      return false;
    }
    this.stencilMask.set(face, mask);
    this.call('stencilMaskSeparate', face, mask);
    this.gl.stencilMaskSeparate(face, mask);
    return true;
  }

  // -------------------------------------------------------------------------
  // 光栅化与输出合并
  // -------------------------------------------------------------------------

  cullFace(mode: number): boolean {
    return this.setNumber(this.raster, 'cullFace', mode, 'cullFace', (v) => this.gl.cullFace(v));
  }

  frontFace(mode: number): boolean {
    return this.setNumber(this.raster, 'frontFace', mode, 'frontFace', (v) => this.gl.frontFace(v));
  }

  colorMask(r: boolean, g: boolean, b: boolean, a: boolean): boolean {
    const value = (r ? 1 : 0) | (g ? 2 : 0) | (b ? 4 : 0) | (a ? 8 : 0);
    if (this.misc.get('colorMask') === value) {
      this.skip('colorMask');
      return false;
    }
    this.misc.set('colorMask', value);
    this.call('colorMask', r, g, b, a);
    this.gl.colorMask(r, g, b, a);
    return true;
  }

  viewport(x: number, y: number, width: number, height: number): boolean {
    const key = `${x},${y},${width},${height}`;
    if (this.lastViewport === key) {
      this.skip('viewport');
      return false;
    }
    this.lastViewport = key;
    this.call('viewport', x, y, width, height);
    this.gl.viewport(x, y, width, height);
    return true;
  }

  scissor(x: number, y: number, width: number, height: number): boolean {
    const key = `${x},${y},${width},${height}`;
    if (this.lastScissor === key) {
      this.skip('scissor');
      return false;
    }
    this.lastScissor = key;
    this.call('scissor', x, y, width, height);
    this.gl.scissor(x, y, width, height);
    return true;
  }

  polygonOffset(factor: number, units: number): boolean {
    const value = factor * 1000 + units;
    if (this.misc.get('polygonOffset') === value) {
      this.skip('polygonOffset');
      return false;
    }
    this.misc.set('polygonOffset', value);
    this.call('polygonOffset', factor, units);
    this.gl.polygonOffset(factor, units);
    return true;
  }

  // -------------------------------------------------------------------------
  // 像素存储
  // -------------------------------------------------------------------------

  unpackAlignment(alignment: number): boolean {
    if (this.pixels.get(this.gl.UNPACK_ALIGNMENT) === alignment) {
      this.skip('pixelStorei');
      return false;
    }
    this.pixels.set(this.gl.UNPACK_ALIGNMENT, alignment);
    this.call('pixelStorei', this.gl.UNPACK_ALIGNMENT, alignment);
    this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, alignment);
    return true;
  }

  unpackFlipY(flip: boolean): boolean {
    const pname = this.gl.UNPACK_FLIP_Y_WEBGL;
    const value = flip ? 1 : 0;
    if (this.pixels.get(pname) === value) {
      this.skip('pixelStorei');
      return false;
    }
    this.pixels.set(pname, value);
    this.call('pixelStorei', pname, flip);
    this.gl.pixelStorei(pname, flip);
    return true;
  }

  private setNumber(
    store: Map<string, number | boolean>,
    key: string,
    value: number,
    name: string,
    apply: (v: number) => void,
  ): boolean {
    if (store.get(key) === value) {
      this.skip(name);
      return false;
    }
    store.set(key, value);
    this.call(name, value);
    apply(value);
    return true;
  }
}
