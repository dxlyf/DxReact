/**
 * WebGL / WebGL2 的渲染管线实现。
 *
 * 管线对象 = 已链接的 WebGLProgram + 着色器反射出的入参位置表（见 WebGLPipeline）。
 * 这一层把"用起来最烦的部分"做掉：
 *  - 编译 / 链接 / 错误日志收集：编译失败时把 info log 原样带进 GraphicsError
 *  - 属性 location：链接前用 bindAttribLocation 按布局写死，避免依赖驱动分配顺序
 *  - uniform location：链接后用 getActiveUniform 反射，声明里不需要再写 location
 *  - uniform 块：WebGL2 走 getUniformBlockIndex + uniformBlockBinding（创建时绑定一次），
 *    WebGL1 进降级模式（成员退化为同名 loose uniform）
 *  - 固定状态：depth/stencil/blend/cull 全部走 GLStateCache，重复设置被跳过
 *
 * 差异保留：native 返回 WebGLProgram；需要下探时用 pipeline.gl 拿到位置表与上下文。
 * WebGPU 侧的 gpu 访问器在本后端恒为 null。
 */
import type { Device } from '../../core/device.js';
import { ErrorCode, GraphicsError, invalidDescriptor, unsupported } from '../../core/errors.js';
import type { UniformBlock } from '../../core/uniformBlock.js';
import type { Uniform } from '../../core/uniform.js';
import {
  Pipeline,
  type PipelineDescriptor,
  type WebGLPipeline,
  type WebGPUPipeline,
} from '../../core/pipeline.js';
import type { UniformValue, UniformBlockMember } from '../../core/data.js';
import { CullMode, type GraphicsApi } from '../../core/types.js';
import {
  blendOperationSupported,
  gl2,
  glBlendFactor,
  glBlendOperation,
  glCompare,
  glCullFace,
  glFrontFace,
  glStencilOperation,
  isWebGL2,
  type GLContext,
} from './constants.js';
import type { GLStateCache } from './glState.js';
import { GLUniform } from './glUniform.js';
import { GLUniformBlock } from './glUniformBlock.js';

/** 反射结果：声明名 -> 原生位置 / 序号，以及链接后被判定为失活的声明名。 */
interface ProgramReflection {
  attributeLocations: Map<string, number>;
  uniformLocations: Map<string, WebGLUniformLocation>;
  blockIndices: Map<string, number>;
  inactive: string[];
}

function compileShader(
  gl: GLContext,
  state: GLStateCache,
  type: number,
  source: string,
  label: string,
  api: GraphicsApi,
): WebGLShader {
  const shader = gl.createShader(type);
  state.call('createShader', label);
  if (!shader) {
    throw new GraphicsError(`${label}: createShader 返回空对象，上下文可能已丢失`, {
      code: ErrorCode.ShaderCompileError,
      api,
      resource: label,
    });
  }
  gl.shaderSource(shader, source);
  state.call('shaderSource', label);
  gl.compileShader(shader);
  state.call('compileShader', label);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const infoLog = gl.getShaderInfoLog(shader) ?? '(驱动未返回编译日志)';
    gl.deleteShader(shader);
    throw new GraphicsError(`${label}: 着色器编译失败`, {
      code: ErrorCode.ShaderCompileError,
      api,
      resource: label,
      details: infoLog,
      hint: '检查 GLSL 版本声明（#version）与 attribute/uniform 声明是否与管线描述符一致。',
    });
  }
  return shader;
}

/**
 * 链接程序。
 *
 * 关键一步是链接前用 bindAttribLocation 写死属性位置：GLSL ES 3.0 虽有 layout(location)，
 * 但 1.0 没有，靠驱动分配的顺序在跨平台时并不稳定。位置来自管线布局推导，两端一致。
 */
function linkProgram(
  gl: GLContext,
  state: GLStateCache,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
  attributes: readonly { location: number; name: string }[],
  label: string,
  api: GraphicsApi,
): WebGLProgram {
  const program = gl.createProgram();
  state.call('createProgram', label);
  if (!program) {
    throw new GraphicsError(`${label}: createProgram 返回空对象，上下文可能已丢失`, {
      code: ErrorCode.ProgramLinkError,
      api,
      resource: label,
    });
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  state.call('attachShader', label);
  for (const attribute of attributes) {
    gl.bindAttribLocation(program, attribute.location, attribute.name);
    state.call('bindAttribLocation', attribute.name, attribute.location);
  }
  gl.linkProgram(program);
  state.call('linkProgram', label);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const infoLog = gl.getProgramInfoLog(program) ?? '(驱动未返回链接日志)';
    gl.deleteProgram(program);
    throw new GraphicsError(`${label}: 程序链接失败`, {
      code: ErrorCode.ProgramLinkError,
      api,
      resource: label,
      details: infoLog,
      hint: '顶点与片元着色器的 varying 名称/类型必须完全一致；uniform 块名需与描述符一致。',
    });
  }
  // 链接完成后着色器对象即可释放，程序已持有编译结果
  gl.detachShader(program, vertexShader);
  gl.detachShader(program, fragmentShader);
  return program;
}

/**
 * 反射程序的入参位置。
 *
 * 分三类处理：
 *  - 属性：按声明名取 location，未取到的不记录（顶点数组会据此跳过）
 *  - uniform：游离 uniform 与纹理采样器都按声明名取 location，取不到即视为失活
 *  - uniform 块：只有 WebGL2 有块序号；WebGL1 下块走降级路径，这里不记录
 */
function reflectProgram(
  gl: GLContext,
  state: GLStateCache,
  program: WebGLProgram,
  names: {
    attributes: readonly string[];
    uniforms: readonly string[];
    samplers: readonly string[];
    blocks: readonly string[];
  },
): ProgramReflection {
  const attributeLocations = new Map<string, number>();
  for (const name of names.attributes) {
    const location = gl.getAttribLocation(program, name);
    state.call('getAttribLocation', name);
    if (location >= 0) attributeLocations.set(name, location);
  }

  const uniformLocations = new Map<string, WebGLUniformLocation>();
  const inactive: string[] = [];
  for (const name of names.uniforms) {
    const location = gl.getUniformLocation(program, name);
    state.call('getUniformLocation', name);
    if (location) uniformLocations.set(name, location);
    else inactive.push(name);
  }
  // 采样器失活由 buildSamplers 记录，这里只负责取 location
  for (const name of names.samplers) {
    const location = gl.getUniformLocation(program, name);
    state.call('getUniformLocation', name);
    if (location) uniformLocations.set(name, location);
  }

  const blockIndices = new Map<string, number>();
  if (isWebGL2(gl)) {
    const context = gl2(gl);
    for (const name of names.blocks) {
      const index = context.getUniformBlockIndex(program, name);
      state.call('getUniformBlockIndex', name);
      if (index !== context.INVALID_INDEX) blockIndices.set(name, index);
    }
  }

  return { attributeLocations, uniformLocations, blockIndices, inactive };
}

export class GLPipeline extends Pipeline {
  private readonly glState: GLStateCache;
  private readonly program: WebGLProgram;
  private readonly vertexShader: WebGLShader;
  private readonly fragmentShader: WebGLShader;

  private readonly uniformMap = new Map<string, GLUniform>();
  private readonly blockMap = new Map<string, GLUniformBlock>();
  private readonly uniformList: GLUniform[] = [];
  private readonly blockList: GLUniformBlock[] = [];
  private readonly samplerLocations = new Map<string, WebGLUniformLocation>();
  private readonly view: WebGLPipeline;

  constructor(device: Device, descriptor: PipelineDescriptor, state: GLStateCache) {
    super(device, descriptor);
    this.glState = state;
    const glsl = descriptor.shaders.glsl;
    if (!glsl) {
      throw invalidDescriptor(`${this.label}: WebGL 后端需要 shaders.glsl，未提供`, {
        hint: 'WebGPU 后端请用 shaders.wgsl；同一份管线声明可以同时提供两者。',
      });
    }
    const api = device.api as GraphicsApi;
    const gl = state.gl;
    this.vertexShader = compileShader(gl, state, gl.VERTEX_SHADER, glsl.vertex, `${this.label}.vs`, api);
    this.fragmentShader = compileShader(gl, state, gl.FRAGMENT_SHADER, glsl.fragment, `${this.label}.fs`, api);
    this.program = linkProgram(
      gl,
      state,
      this.vertexShader,
      this.fragmentShader,
      this.layout.attributeList.map((attribute) => ({ location: attribute.location, name: attribute.name })),
      this.label,
      api,
    );

    const { attributeLocations, uniformLocations, blockIndices, inactive } = reflectProgram(gl, state, this.program, {
      attributes: this.layout.attributeList.map((attribute) => attribute.name),
      uniforms: [...this.layout.uniforms.keys()],
      samplers: [...this.layout.textures.keys()],
      blocks: [...this.layout.blocks.values()].filter((block) => !block.synthesized).map((block) => block.name),
    });

    this.buildUniforms(device, uniformLocations);
    this.buildBlocks(device, blockIndices, inactive);
    this.buildSamplers(uniformLocations, inactive);
    this.validateState();

    this.view = {
      program: this.program,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      attributeLocations,
      uniformLocations,
      blockIndices,
      inactive,
      context: gl,
      webgl2: state.webgl2,
    };
  }

  override get native(): WebGLProgram {
    return this.program;
  }

  override get gl(): WebGLPipeline {
    return this.view;
  }

  override get gpu(): WebGPUPipeline | null {
    return null;
  }

  override uniform(name: string): Uniform | undefined {
    return this.uniformMap.get(name);
  }

  override block(name: string): UniformBlock {
    const block = this.blockMap.get(name);
    if (!block) {
      throw invalidDescriptor(`${this.label}: 未声明名为 ${name} 的 uniform 块`, {
        hint: `已声明的块: ${[...this.blockMap.keys()].join(', ') || '(空)'}`,
      });
    }
    return block;
  }

  override get blocks(): readonly UniformBlock[] {
    return this.blockList;
  }

  override setUniform(name: string, value: UniformValue): void {
    this.assertAlive('setUniform');
    const uniform = this.uniformMap.get(name);
    if (!uniform) {
      throw invalidDescriptor(`${this.label}: 未声明名为 ${name} 的游离 uniform`, {
        hint: `已声明: ${[...this.uniformMap.keys()].join(', ') || '(空)'}；纹理请用 bindGroup 绑定。`,
      });
    }
    uniform.set(value);
  }

  override setUniforms(values: Record<string, UniformValue>): void {
    for (const [name, value] of Object.entries(values)) this.setUniform(name, value);
  }

  /** 是否有待提交的 uniform（渲染通道据此决定绘制前是否需要回写程序）。 */
  get hasPendingUniforms(): boolean {
    return this.uniformList.some((uniform) => uniform.dirty);
  }

  /**
   * 把待提交的 uniform 与 uniform 块写进程序。调用者须已由本方法绑定程序，
   * 因此这里先 useProgram 再回写 —— uniform 是程序级状态，绑错程序会静默失效。
   */
  flushUniforms(): void {
    this.assertAlive('flushUniforms');
    this.glState.useProgram(this.program);
    for (const uniform of this.uniformList) uniform.flush();
    for (const block of this.blockList) block.flush();
  }

  /** 供渲染通道在切换管线时调用：绑定程序、提交 uniform、应用固定状态。 */
  apply(): void {
    this.flushUniforms();
    this.applyState();
  }

  /** 纹理声明对应的 sampler uniform location；失活时为 null。 */
  samplerLocation(name: string): WebGLUniformLocation | null {
    return this.samplerLocations.get(name) ?? null;
  }

  /**
   * 把纹理单元号写进 sampler uniform。
   * WebGL 的采样器参数写在纹理对象上，因此这里只负责"告诉着色器读哪个单元"。
   */
  setSamplerUnit(name: string, unit: number): boolean {
    const location = this.samplerLocations.get(name);
    if (!location) return false;
    this.glState.gl.uniform1i(location, unit);
    this.glState.call('uniform1i', name, unit);
    return true;
  }

  protected override onDestroy(): void {
    for (const uniform of this.uniformList) uniform.destroy();
    for (const block of this.blockList) block.destroy();
    this.uniformMap.clear();
    this.blockMap.clear();
    this.samplerLocations.clear();
    const gl = this.glState.gl;
    this.glState.forgetProgram(this.program);
    gl.deleteProgram(this.program);
    gl.deleteShader(this.vertexShader);
    gl.deleteShader(this.fragmentShader);
  }

  // -------------------------------------------------------------------------
  // 构造期：反射结果 -> 入参对象
  // -------------------------------------------------------------------------

  private buildUniforms(device: Device, locations: ReadonlyMap<string, WebGLUniformLocation>): void {
    let index = 0;
    for (const [name, descriptor] of this.layout.uniforms) {
      const uniform = new GLUniform(device, descriptor, this.glState, locations.get(name) ?? null, index++);
      this.uniformMap.set(name, uniform);
      this.uniformList.push(uniform);
    }
  }

  private buildBlocks(
    device: Device,
    blockIndices: ReadonlyMap<string, number>,
    inactive: string[],
  ): void {
    const webgl2 = this.glState.webgl2;
    for (const [name, blockLayout] of this.layout.blocks) {
      // 合成块是 WebGPU 侧的概念，GL 侧不创建对应 UBO
      if (blockLayout.synthesized) continue;
      const members: UniformBlockMember[] = blockLayout.layout.members.map((member) => ({
        name: member.name,
        type: member.type,
        count: member.count,
      }));
      const nativeIndex = blockIndices.get(name) ?? -1;
      const block = new GLUniformBlock(
        device,
        {
          name,
          members,
          binding: blockLayout.binding,
          group: blockLayout.group,
          frequency: blockLayout.frequency,
          size: blockLayout.layout.size,
          label: `${this.label}.${name}`,
        },
        this.glState,
        nativeIndex,
      );

      if (webgl2) {
        if (nativeIndex >= 0) {
          // 链接后绑定一次即可，块 binding 是程序级状态，无需每帧重设
          gl2(this.glState.gl).uniformBlockBinding(this.program, nativeIndex, blockLayout.binding);
          this.glState.call('uniformBlockBinding', name, blockLayout.binding);
        } else {
          inactive.push(name);
        }
      } else {
        this.attachDegradedMembers(device, block, name, members, inactive);
      }

      this.blockMap.set(name, block);
      this.blockList.push(block);
    }
  }

  /** WebGL1 降级：为块的每个成员建同名 loose uniform，并把它们并入统一回写列表。 */
  private attachDegradedMembers(
    device: Device,
    block: GLUniformBlock,
    blockName: string,
    members: readonly UniformBlockMember[],
    inactive: string[],
  ): void {
    const gl = this.glState.gl;
    const memberUniforms: GLUniform[] = [];
    let index = 0;
    for (const member of members) {
      const location = gl.getUniformLocation(this.program, member.name);
      this.glState.call('getUniformLocation', `${blockName}.${member.name}`);
      if (!location) inactive.push(`${blockName}.${member.name}`);
      memberUniforms.push(
        new GLUniform(
          device,
          { name: member.name, type: member.type, count: member.count },
          this.glState,
          location,
          index++,
        ),
      );
    }
    block.attachMembers(memberUniforms);
    this.uniformList.push(...memberUniforms);
  }

  private buildSamplers(locations: ReadonlyMap<string, WebGLUniformLocation>, inactive: string[]): void {
    for (const name of this.layout.textures.keys()) {
      const location = locations.get(name);
      if (location) this.samplerLocations.set(name, location);
      else inactive.push(name);
    }
  }

  private validateState(): void {
    const { blendColor, blendAlpha } = this.state;
    const webgl2 = this.glState.webgl2;
    for (const [label, operation] of [
      ['blend.color', blendColor.operation],
      ['blend.alpha', blendAlpha.operation],
    ] as const) {
      if (!blendOperationSupported(operation, webgl2)) {
        throw unsupported(`${this.label}: ${label} 使用了当前上下文不支持的混合运算 ${operation}`, {
          hint: 'Min/Max 混合需要 WebGL2（EXT_blend_minmax 在 WebGL1 需扩展支持）。',
        });
      }
    }
  }

  /**
   * 应用固定状态。全部经过 GLStateCache，因此"同一状态重复设置"不会产生原生调用。
   *
   * 注意模板参考值（glStencilFunc 的 ref）不属于管线状态而是每次绘制的外部状态，
   * 库不做管理；切管线时它会被重置为 0，需要非零参考值的调用方请在切管线之后再设置。
   */
  private applyState(): void {
    const gl = this.glState.gl;
    const state = this.glState;
    const s = this.state;

    state.setCapability(gl.CULL_FACE, s.cullMode !== CullMode.None, 'cullFace');
    if (s.cullMode !== CullMode.None) state.cullFace(glCullFace(s.cullMode, gl));
    state.frontFace(glFrontFace(s.frontFace, gl));

    state.setCapability(gl.DEPTH_TEST, s.depthTest, 'depthTest');
    if (s.depthTest) state.depthFunc(glCompare(s.depthCompare, gl));
    state.depthMask(s.depthWrite);

    state.setCapability(gl.STENCIL_TEST, s.stencilTest, 'stencilTest');
    if (s.stencilTest) {
      state.stencilOpSeparate(
        gl.FRONT,
        glStencilOperation(s.stencilFront.failOp, gl),
        glStencilOperation(s.stencilFront.depthFailOp, gl),
        glStencilOperation(s.stencilFront.passOp, gl),
      );
      state.stencilOpSeparate(
        gl.BACK,
        glStencilOperation(s.stencilBack.failOp, gl),
        glStencilOperation(s.stencilBack.depthFailOp, gl),
        glStencilOperation(s.stencilBack.passOp, gl),
      );
      state.stencilFuncSeparate(gl.FRONT, glCompare(s.stencilFront.compare, gl), 0, s.stencilReadMask);
      state.stencilFuncSeparate(gl.BACK, glCompare(s.stencilBack.compare, gl), 0, s.stencilReadMask);
      state.stencilMaskSeparate(gl.FRONT, s.stencilWriteMask);
      state.stencilMaskSeparate(gl.BACK, s.stencilWriteMask);
    }

    state.setCapability(gl.BLEND, s.blendEnabled, 'blend');
    if (s.blendEnabled) {
      state.blendFuncSeparate(
        glBlendFactor(s.blendColor.srcFactor, gl),
        glBlendFactor(s.blendColor.dstFactor, gl),
        glBlendFactor(s.blendAlpha.srcFactor, gl),
        glBlendFactor(s.blendAlpha.dstFactor, gl),
      );
      state.blendEquationSeparate(
        glBlendOperation(s.blendColor.operation, gl),
        glBlendOperation(s.blendAlpha.operation, gl),
      );
    }

    const writeMask = this.targets[0]?.writeMask;
    if (writeMask !== undefined) {
      state.colorMask((writeMask & 1) !== 0, (writeMask & 2) !== 0, (writeMask & 4) !== 0, (writeMask & 8) !== 0);
    }

    if (s.depthBias !== 0 || s.depthBiasSlopeScale !== 0) {
      state.polygonOffset(s.depthBiasSlopeScale, s.depthBias);
    }
  }
}
