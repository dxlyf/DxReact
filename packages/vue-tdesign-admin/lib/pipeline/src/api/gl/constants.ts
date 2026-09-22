/**
 * WebGL / WebGL2 的枚举映射表。
 *
 * 这是整个库里唯一允许出现 GLenum 的地方：核心层只使用 types.ts 的统一枚举，
 * 由本文件负责把统一枚举翻译成各后端能理解的原生常量。
 *
 * 三个映射原则：
 *  1. 一一对应优先：能直接映射的绝不引入中间层
 *  2. 差异显式化：WebGL2 独有能力（整数属性指针、sized internal format）单独判断，
 *     WebGL1 下不支持的能力直接抛 Unsupported，而不是悄悄换成别的语义
 *  3. 不猜：映射表查不到就是错误，不做默认值兜底
 */
import { unsupported } from '../../core/errors.js';
import {
  BlendFactor,
  BlendOperation,
  CompareFunction,
  CullMode,
  FilterMode,
  FrontFace,
  GraphicsApi,
  PrimitiveTopology,
  ShaderDataType,
  StencilOperation,
  TextureDimension,
  TextureFormat,
  WrapMode,
} from '../../core/types.js';

/** 上下文与扩展的公共父类型。 */
export type GLContext = WebGLRenderingContext | WebGL2RenderingContext;

/** 把上下文窄化为 WebGL2。仅在 `webgl2 === true` 的分支里调用。 */
export function gl2(gl: GLContext): WebGL2RenderingContext {
  return gl as WebGL2RenderingContext;
}

/**
 * 运行期判定是否为 WebGL2 上下文。
 * 用 WebGL2 独有的方法做特征检测，不受构造参数影响，便于工具函数独立使用。
 */
export function isWebGL2(gl: GLContext): gl is WebGL2RenderingContext {
  return typeof (gl as WebGL2RenderingContext).createVertexArray === 'function';
}

/** WebGL1 的实例化绘制扩展。 */
export interface InstancedArraysExtension {
  vertexAttribDivisorANGLE(index: number, divisor: number): void;
  drawArraysInstancedANGLE(mode: number, first: number, count: number, primcount: number): void;
  drawElementsInstancedANGLE(mode: number, count: number, type: number, offset: number, primcount: number): void;
}

/** WebGL1 的 VAO 扩展。 */
export interface VertexArrayObjectExtension {
  createVertexArrayOES(): WebGLVertexArrayObject | null;
  bindVertexArrayOES(array: WebGLVertexArrayObject | null): void;
  deleteVertexArrayOES(array: WebGLVertexArrayObject | null): void;
}

/** 设备启动时一次性探测出的扩展集合。 */
export interface GLExtensions {
  instancedArrays: InstancedArraysExtension | null;
  vertexArrayObject: VertexArrayObjectExtension | null;
  elementIndexUint: boolean;
  floatTextures: boolean;
  depthTextures: boolean;
  anisotropy: { TEXTURE_MAX_ANISOTROPY_EXT: number; MAX_TEXTURE_MAX_ANISOTROPY_EXT: number } | null;
  names: string[];
}

// ---------------------------------------------------------------------------
// 顶点属性格式
// ---------------------------------------------------------------------------

export interface VertexFormatInfo {
  /** vertexAttribPointer 的 type 参数 */
  type: number;
  components: number;
  /** 是否必须走 vertexAttribIPointer（WebGL2 的整数属性） */
  integer: boolean;
}

interface VertexFormatEntry {
  /** 常量名字，取值时统一从 WebGL2 上下文上取（它包含全部 WebGL1 常量） */
  glType: keyof WebGL2RenderingContext;
  components: number;
  /** 是否必须走 vertexAttribIPointer（WebGL2 的整数属性） */
  integer: boolean;
  /** 是否只有 WebGL2 支持 */
  webgl2Only?: boolean;
}

const VERTEX_FORMATS: Record<ShaderDataType, VertexFormatEntry> = {
  [ShaderDataType.F32]: { glType: 'FLOAT', components: 1, integer: false },
  [ShaderDataType.F32x2]: { glType: 'FLOAT', components: 2, integer: false },
  [ShaderDataType.F32x3]: { glType: 'FLOAT', components: 3, integer: false },
  [ShaderDataType.F32x4]: { glType: 'FLOAT', components: 4, integer: false },
  [ShaderDataType.I32]: { glType: 'INT', components: 1, integer: true, webgl2Only: true },
  [ShaderDataType.I32x2]: { glType: 'INT', components: 2, integer: true, webgl2Only: true },
  [ShaderDataType.I32x3]: { glType: 'INT', components: 3, integer: true, webgl2Only: true },
  [ShaderDataType.I32x4]: { glType: 'INT', components: 4, integer: true, webgl2Only: true },
  [ShaderDataType.U32]: { glType: 'UNSIGNED_INT', components: 1, integer: true, webgl2Only: true },
  [ShaderDataType.U32x2]: { glType: 'UNSIGNED_INT', components: 2, integer: true, webgl2Only: true },
  [ShaderDataType.U32x3]: { glType: 'UNSIGNED_INT', components: 3, integer: true, webgl2Only: true },
  [ShaderDataType.U32x4]: { glType: 'UNSIGNED_INT', components: 4, integer: true, webgl2Only: true },
  [ShaderDataType.U8x2]: { glType: 'UNSIGNED_BYTE', components: 2, integer: false },
  [ShaderDataType.U8x4]: { glType: 'UNSIGNED_BYTE', components: 4, integer: false },
  [ShaderDataType.U16x2]: { glType: 'UNSIGNED_SHORT', components: 2, integer: false },
  [ShaderDataType.U16x4]: { glType: 'UNSIGNED_SHORT', components: 4, integer: false },
  [ShaderDataType.F16x2]: { glType: 'HALF_FLOAT', components: 2, integer: false, webgl2Only: true },
  [ShaderDataType.F16x4]: { glType: 'HALF_FLOAT', components: 4, integer: false, webgl2Only: true },
  [ShaderDataType.Mat2]: { glType: 'FLOAT', components: 2, integer: false },
  [ShaderDataType.Mat3]: { glType: 'FLOAT', components: 3, integer: false },
  [ShaderDataType.Mat4]: { glType: 'FLOAT', components: 4, integer: false },
};

export function vertexFormatInfo(format: ShaderDataType, gl: GLContext): VertexFormatInfo {
  const info = VERTEX_FORMATS[format];
  if (!info) throw unsupported(`WebGL 不支持顶点属性格式 ${format}`);
  if (info.webgl2Only && !isWebGL2(gl)) {
    throw unsupported(`WebGL1 不支持顶点属性格式 ${format}`, {
      api: GraphicsApi.WebGL,
      call: 'vertexAttribPointer',
      hint: '整数属性与半精度顶点属性需要 WebGL2；WebGL1 请改用 F32 系或 U8/U16 归一化格式。',
    });
  }
  return {
    type: gl2(gl)[info.glType] as number,
    components: info.components,
    integer: info.integer,
  };
}

// ---------------------------------------------------------------------------
// 管线固定状态
// ---------------------------------------------------------------------------

const TOPOLOGY: Record<PrimitiveTopology, keyof WebGLRenderingContext> = {
  [PrimitiveTopology.PointList]: 'POINTS',
  [PrimitiveTopology.LineList]: 'LINES',
  [PrimitiveTopology.LineStrip]: 'LINE_STRIP',
  [PrimitiveTopology.TriangleList]: 'TRIANGLES',
  [PrimitiveTopology.TriangleStrip]: 'TRIANGLE_STRIP',
};

export function glTopology(topology: PrimitiveTopology, gl: GLContext): number {
  return gl[TOPOLOGY[topology]] as number;
}

const COMPARE: Record<CompareFunction, keyof WebGLRenderingContext> = {
  [CompareFunction.Never]: 'NEVER',
  [CompareFunction.Less]: 'LESS',
  [CompareFunction.Equal]: 'EQUAL',
  [CompareFunction.LessEqual]: 'LEQUAL',
  [CompareFunction.Greater]: 'GREATER',
  [CompareFunction.NotEqual]: 'NOTEQUAL',
  [CompareFunction.GreaterEqual]: 'GEQUAL',
  [CompareFunction.Always]: 'ALWAYS',
};

export function glCompare(compare: CompareFunction, gl: GLContext): number {
  return gl[COMPARE[compare]] as number;
}

const BLEND_FACTOR: Record<BlendFactor, keyof WebGLRenderingContext> = {
  [BlendFactor.Zero]: 'ZERO',
  [BlendFactor.One]: 'ONE',
  [BlendFactor.SrcColor]: 'SRC_COLOR',
  [BlendFactor.OneMinusSrcColor]: 'ONE_MINUS_SRC_COLOR',
  [BlendFactor.SrcAlpha]: 'SRC_ALPHA',
  [BlendFactor.OneMinusSrcAlpha]: 'ONE_MINUS_SRC_ALPHA',
  [BlendFactor.DstColor]: 'DST_COLOR',
  [BlendFactor.OneMinusDstColor]: 'ONE_MINUS_DST_COLOR',
  [BlendFactor.DstAlpha]: 'DST_ALPHA',
  [BlendFactor.OneMinusDstAlpha]: 'ONE_MINUS_DST_ALPHA',
  [BlendFactor.SrcAlphaSaturated]: 'SRC_ALPHA_SATURATE',
};

export function glBlendFactor(factor: BlendFactor, gl: GLContext): number {
  return gl[BLEND_FACTOR[factor]] as number;
}

const BLEND_OPERATION: Record<BlendOperation, keyof WebGL2RenderingContext> = {
  [BlendOperation.Add]: 'FUNC_ADD',
  [BlendOperation.Subtract]: 'FUNC_SUBTRACT',
  [BlendOperation.ReverseSubtract]: 'FUNC_REVERSE_SUBTRACT',
  // MIN / MAX 只有 WebGL2（或 EXT_blend_minmax）才有，调用方需自行判断
  [BlendOperation.Min]: 'MIN',
  [BlendOperation.Max]: 'MAX',
};

export function glBlendOperation(operation: BlendOperation, gl: GLContext): number {
  return gl2(gl)[BLEND_OPERATION[operation]] as number;
}

/** Min / Max 混合在 WebGL1 下需要 EXT_blend_minmax，返回 false 表示当前后端不可用。 */
export function blendOperationSupported(operation: BlendOperation, webgl2: boolean): boolean {
  if (webgl2) return true;
  return operation !== BlendOperation.Min && operation !== BlendOperation.Max;
}

const STENCIL_OPERATION: Record<StencilOperation, keyof WebGLRenderingContext> = {
  [StencilOperation.Keep]: 'KEEP',
  [StencilOperation.Zero]: 'ZERO',
  [StencilOperation.Replace]: 'REPLACE',
  [StencilOperation.Invert]: 'INVERT',
  [StencilOperation.IncrementClamp]: 'INCR',
  [StencilOperation.DecrementClamp]: 'DECR',
  [StencilOperation.IncrementWrap]: 'INCR_WRAP',
  [StencilOperation.DecrementWrap]: 'DECR_WRAP',
};

export function glStencilOperation(operation: StencilOperation, gl: GLContext): number {
  return gl[STENCIL_OPERATION[operation]] as number;
}

const CULL_FACE: Record<CullMode, keyof WebGLRenderingContext> = {
  [CullMode.None]: 'BACK',
  [CullMode.Front]: 'FRONT',
  [CullMode.Back]: 'BACK',
};

/** CullMode.None 由调用方映射为 disable(CULL_FACE)，这里只返回可用的面。 */
export function glCullFace(mode: CullMode, gl: GLContext): number {
  return gl[CULL_FACE[mode]] as number;
}

export function glFrontFace(face: FrontFace, gl: GLContext): number {
  return (face === FrontFace.CCW ? gl.CCW : gl.CW) as number;
}

// ---------------------------------------------------------------------------
// 纹理
// ---------------------------------------------------------------------------

const WRAP: Record<WrapMode, keyof WebGLRenderingContext> = {
  [WrapMode.ClampToEdge]: 'CLAMP_TO_EDGE',
  [WrapMode.Repeat]: 'REPEAT',
  [WrapMode.MirroredRepeat]: 'MIRRORED_REPEAT',
};

export function glWrapMode(mode: WrapMode, gl: GLContext): number {
  return gl[WRAP[mode]] as number;
}

export function glMagFilter(filter: FilterMode, gl: GLContext): number {
  return (filter === FilterMode.Linear ? gl.LINEAR : gl.NEAREST) as number;
}

/** minFilter 同时决定 mipmap 策略，因此需要 magFilter + mipmapFilter 两个输入。 */
export function glMinFilter(filter: FilterMode, mipmapFilter: FilterMode, gl: GLContext, hasMipmaps: boolean): number {
  if (!hasMipmaps) return (filter === FilterMode.Linear ? gl.LINEAR : gl.NEAREST) as number;
  if (filter === FilterMode.Linear) {
    return (mipmapFilter === FilterMode.Linear ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR_MIPMAP_NEAREST) as number;
  }
  return (mipmapFilter === FilterMode.Linear ? gl.NEAREST_MIPMAP_LINEAR : gl.NEAREST_MIPMAP_NEAREST) as number;
}

/**
 * 纹理目标。
 * `layers > 1` 的 2D 纹理在 WebGL2 里就是 TEXTURE_2D_ARRAY，这里显式区分，
 * 而不是把它当成普通 2D 纹理静默忽略层数。
 */
export function glTextureTarget(dimension: TextureDimension, gl: GLContext, layers = 1): number {
  switch (dimension) {
    case TextureDimension.Cube:
      return gl.TEXTURE_CUBE_MAP;
    case TextureDimension.D3:
      if (!isWebGL2(gl)) throw unsupported('WebGL1 不支持 3D 纹理');
      return gl2(gl).TEXTURE_3D;
    default:
      if (layers > 1) {
        if (!isWebGL2(gl)) throw unsupported('WebGL1 不支持纹理数组');
        return gl2(gl).TEXTURE_2D_ARRAY;
      }
      return gl.TEXTURE_2D;
  }
}

export interface GLTextureFormatInfo {
  /** texImage2D 的 internalFormat */
  internalFormat: number;
  /** texImage2D 的 format */
  format: number;
  /** texImage2D 的 type */
  type: number;
}

/**
 * 纹理格式映射。
 *
 * WebGL2 使用 sized internal format（R8 / RGBA16F ...），WebGL1 只有 unsized 的
 * 通道布局，因此部分格式在 WebGL1 下直接判定为不支持 —— 这是原生能力的真实差异，
 * 库不做"悄悄换成 RGBA8"这类兜底。
 */
export function glTextureFormat(format: TextureFormat, gl: GLContext, webgl2: boolean): GLTextureFormatInfo {
  if (webgl2) {
    const g = gl2(gl);
    switch (format) {
      case TextureFormat.R8Unorm:
        return { internalFormat: g.R8, format: g.RED, type: g.UNSIGNED_BYTE };
      case TextureFormat.RG8Unorm:
        return { internalFormat: g.RG8, format: g.RG, type: g.UNSIGNED_BYTE };
      case TextureFormat.RGBA8Unorm:
        return { internalFormat: g.RGBA8, format: g.RGBA, type: g.UNSIGNED_BYTE };
      case TextureFormat.RGBA8UnormSrgb:
        return { internalFormat: g.SRGB8_ALPHA8, format: g.RGBA, type: g.UNSIGNED_BYTE };
      case TextureFormat.RGBA16Float:
        return { internalFormat: g.RGBA16F, format: g.RGBA, type: g.HALF_FLOAT };
      case TextureFormat.RGBA32Float:
        return { internalFormat: g.RGBA32F, format: g.RGBA, type: g.FLOAT };
      case TextureFormat.Depth16Unorm:
        return { internalFormat: g.DEPTH_COMPONENT16, format: g.DEPTH_COMPONENT, type: g.UNSIGNED_SHORT };
      case TextureFormat.Depth24Plus:
        return { internalFormat: g.DEPTH_COMPONENT24, format: g.DEPTH_COMPONENT, type: g.UNSIGNED_INT };
      case TextureFormat.Depth24PlusStencil8:
        return { internalFormat: g.DEPTH24_STENCIL8, format: g.DEPTH_STENCIL, type: g.UNSIGNED_INT_24_8 };
      case TextureFormat.Depth32Float:
        return { internalFormat: g.DEPTH_COMPONENT32F, format: g.DEPTH_COMPONENT, type: g.FLOAT };
      default:
        throw unsupported(`WebGL2 不支持纹理格式 ${format}`);
    }
  }

  switch (format) {
    case TextureFormat.R8Unorm:
      return { internalFormat: gl.LUMINANCE, format: gl.LUMINANCE, type: gl.UNSIGNED_BYTE };
    case TextureFormat.RG8Unorm:
      return { internalFormat: gl.LUMINANCE_ALPHA, format: gl.LUMINANCE_ALPHA, type: gl.UNSIGNED_BYTE };
    case TextureFormat.RGBA8Unorm:
    case TextureFormat.RGBA8UnormSrgb:
      return { internalFormat: gl.RGBA, format: gl.RGBA, type: gl.UNSIGNED_BYTE };
    default:
      throw unsupported(`WebGL1 不支持纹理格式 ${format}`, {
        hint: 'WebGL1 只有 unsized 的 RGBA/LUMINANCE 格式；浮点与深度格式需要 WebGL2。',
      });
  }
}

// ---------------------------------------------------------------------------
// 其它
// ---------------------------------------------------------------------------

/** 索引格式 -> GL 类型。Uint32 需要 OES_element_index_uint（WebGL1）或 WebGL2。 */
export function glIndexType(bytesPerElement: number, gl: GLContext, webgl2: boolean, elementIndexUint: boolean): number {
  if (bytesPerElement === 1) return gl.UNSIGNED_BYTE;
  if (bytesPerElement === 2) return gl.UNSIGNED_SHORT;
  if (bytesPerElement === 4) {
    if (!webgl2 && !elementIndexUint) {
      throw unsupported('当前 WebGL1 上下文缺少 OES_element_index_uint，无法使用 32 位索引');
    }
    return gl.UNSIGNED_INT;
  }
  throw unsupported(`不支持的索引元素字节数 ${bytesPerElement}`);
}

/** WebGL1 的 TEXTURE0 常量不存在，需要手动加上纹理单元偏移。 */
export function glTextureUnit(unit: number, gl: GLContext): number {
  return (gl.TEXTURE0 as number) + unit;
}
