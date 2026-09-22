/**
 * WebGPU 的枚举与格式映射表。
 *
 * 与 api/gl/constants.ts 对应：这里同样只做"统一枚举 -> 原生枚举"的翻译。
 * 大量取值与 WebGPU 规范同名（拓扑、比较函数、混合因子、采样器寻址模式……），
 * 但仍然逐条写出映射表，以保证"查不到就是错误"，不做默认值兜底。
 */
import { unsupported } from '../../core/errors.js';
import {
  BlendFactor,
  BlendOperation,
  BufferUsage,
  CompareFunction,
  CullMode,
  FilterMode,
  FrontFace,
  IndexFormat,
  PrimitiveTopology,
  ShaderDataType,
  StencilOperation,
  TextureDimension,
  TextureFormat,
  TextureUsage,
  WrapMode,
} from '../../core/types.js';

// ---------------------------------------------------------------------------
// 顶点属性格式
// ---------------------------------------------------------------------------

/** 顶点格式表。矩阵与半精度之外的类型都能直接对应到 GPUVertexFormat。 */
const VERTEX_FORMATS: Record<ShaderDataType, GPUVertexFormat | null> = {
  [ShaderDataType.F32]: 'float32',
  [ShaderDataType.F32x2]: 'float32x2',
  [ShaderDataType.F32x3]: 'float32x3',
  [ShaderDataType.F32x4]: 'float32x4',
  [ShaderDataType.I32]: 'sint32',
  [ShaderDataType.I32x2]: 'sint32x2',
  [ShaderDataType.I32x3]: 'sint32x3',
  [ShaderDataType.I32x4]: 'sint32x4',
  [ShaderDataType.U32]: 'uint32',
  [ShaderDataType.U32x2]: 'uint32x2',
  [ShaderDataType.U32x3]: 'uint32x3',
  [ShaderDataType.U32x4]: 'uint32x4',
  // 归一化与否决定 unorm / uint 两套格式：与 WebGL 侧"U8/U16 默认 normalized"的语义一致
  [ShaderDataType.U8x2]: 'unorm8x2',
  [ShaderDataType.U8x4]: 'unorm8x4',
  [ShaderDataType.U16x2]: 'unorm16x2',
  [ShaderDataType.U16x4]: 'unorm16x4',
  [ShaderDataType.F16x2]: 'float16x2',
  [ShaderDataType.F16x4]: 'float16x4',
  [ShaderDataType.Mat2]: null,
  [ShaderDataType.Mat3]: null,
  [ShaderDataType.Mat4]: null,
};

/** 属性格式 -> GPUVertexFormat。normalized 只影响 8/16 位无符号类型。 */
export function gpuVertexFormat(type: ShaderDataType, normalized: boolean): GPUVertexFormat {
  if ((type === ShaderDataType.U8x2 || type === ShaderDataType.U8x4) && !normalized) {
    return type === ShaderDataType.U8x2 ? 'uint8x2' : 'uint8x4';
  }
  if ((type === ShaderDataType.U16x2 || type === ShaderDataType.U16x4) && !normalized) {
    return type === ShaderDataType.U16x2 ? 'uint16x2' : 'uint16x4';
  }
  const format = VERTEX_FORMATS[type];
  if (!format) {
    throw unsupported(`WebGPU 没有与属性类型 ${type} 对应的顶点格式`, {
      hint: '矩阵属性请按列拆成若干 F32x4，见 types.ts 的 assertAttributeType。',
    });
  }
  return format;
}

/** 顶点步进模式 -> GPUVertexStepMode。 */
export function gpuStepMode(instanced: boolean): GPUVertexStepMode {
  return instanced ? 'instance' : 'vertex';
}

// ---------------------------------------------------------------------------
// 拓扑 / 索引
// ---------------------------------------------------------------------------

const TOPOLOGY: Record<PrimitiveTopology, GPUPrimitiveTopology> = {
  [PrimitiveTopology.PointList]: 'point-list',
  [PrimitiveTopology.LineList]: 'line-list',
  [PrimitiveTopology.LineStrip]: 'line-strip',
  [PrimitiveTopology.TriangleList]: 'triangle-list',
  [PrimitiveTopology.TriangleStrip]: 'triangle-strip',
};

export function gpuTopology(topology: PrimitiveTopology): GPUPrimitiveTopology {
  const value = TOPOLOGY[topology];
  if (!value) throw unsupported(`WebGPU 不支持拓扑 ${topology}`);
  return value;
}

/** 索引元素字节数 -> GPUIndexFormat。 */
export function gpuIndexFormat(bytesPerElement: number): GPUIndexFormat {
  if (bytesPerElement === 2) return 'uint16';
  if (bytesPerElement === 4) return 'uint32';
  throw unsupported(`WebGPU 不支持 ${bytesPerElement} 字节的索引元素`, {
    hint: 'GPUIndexFormat 只有 uint16 与 uint32 两种。',
  });
}

export function gpuIndexFormatOf(format: IndexFormat): GPUIndexFormat {
  return format === IndexFormat.Uint32 ? 'uint32' : 'uint16';
}

// ---------------------------------------------------------------------------
// 固定状态
// ---------------------------------------------------------------------------

const COMPARE: Record<CompareFunction, GPUCompareFunction> = {
  [CompareFunction.Never]: 'never',
  [CompareFunction.Less]: 'less',
  [CompareFunction.Equal]: 'equal',
  [CompareFunction.LessEqual]: 'less-equal',
  [CompareFunction.Greater]: 'greater',
  [CompareFunction.NotEqual]: 'not-equal',
  [CompareFunction.GreaterEqual]: 'greater-equal',
  [CompareFunction.Always]: 'always',
};

export function gpuCompare(compare: CompareFunction): GPUCompareFunction {
  const value = COMPARE[compare];
  if (!value) throw unsupported(`WebGPU 不支持比较函数 ${compare}`);
  return value;
}

const BLEND_FACTOR: Record<BlendFactor, GPUBlendFactor> = {
  [BlendFactor.Zero]: 'zero',
  [BlendFactor.One]: 'one',
  [BlendFactor.SrcColor]: 'src',
  [BlendFactor.OneMinusSrcColor]: 'one-minus-src',
  [BlendFactor.SrcAlpha]: 'src-alpha',
  [BlendFactor.OneMinusSrcAlpha]: 'one-minus-src-alpha',
  [BlendFactor.DstColor]: 'dst',
  [BlendFactor.OneMinusDstColor]: 'one-minus-dst',
  [BlendFactor.DstAlpha]: 'dst-alpha',
  [BlendFactor.OneMinusDstAlpha]: 'one-minus-dst-alpha',
  [BlendFactor.SrcAlphaSaturated]: 'src-alpha-saturated',
};

export function gpuBlendFactor(factor: BlendFactor): GPUBlendFactor {
  const value = BLEND_FACTOR[factor];
  if (!value) throw unsupported(`WebGPU 不支持混合因子 ${factor}`);
  return value;
}

const BLEND_OPERATION: Record<BlendOperation, GPUBlendOperation> = {
  [BlendOperation.Add]: 'add',
  [BlendOperation.Subtract]: 'subtract',
  [BlendOperation.ReverseSubtract]: 'reverse-subtract',
  [BlendOperation.Min]: 'min',
  [BlendOperation.Max]: 'max',
};

export function gpuBlendOperation(operation: BlendOperation): GPUBlendOperation {
  const value = BLEND_OPERATION[operation];
  if (!value) throw unsupported(`WebGPU 不支持混合运算 ${operation}`);
  return value;
}

const STENCIL_OPERATION: Record<StencilOperation, GPUStencilOperation> = {
  [StencilOperation.Keep]: 'keep',
  [StencilOperation.Zero]: 'zero',
  [StencilOperation.Replace]: 'replace',
  [StencilOperation.Invert]: 'invert',
  [StencilOperation.IncrementClamp]: 'increment-clamp',
  [StencilOperation.DecrementClamp]: 'decrement-clamp',
  [StencilOperation.IncrementWrap]: 'increment-wrap',
  [StencilOperation.DecrementWrap]: 'decrement-wrap',
};

export function gpuStencilOperation(operation: StencilOperation): GPUStencilOperation {
  const value = STENCIL_OPERATION[operation];
  if (!value) throw unsupported(`WebGPU 不支持模板操作 ${operation}`);
  return value;
}

const CULL_MODE: Record<CullMode, GPUCullMode> = {
  [CullMode.None]: 'none',
  [CullMode.Front]: 'front',
  [CullMode.Back]: 'back',
};

export function gpuCullMode(mode: CullMode): GPUCullMode {
  const value = CULL_MODE[mode];
  if (!value) throw unsupported(`WebGPU 不支持剔除模式 ${mode}`);
  return value;
}

const FRONT_FACE: Record<FrontFace, GPUFrontFace> = {
  [FrontFace.CCW]: 'ccw',
  [FrontFace.CW]: 'cw',
};

export function gpuFrontFace(face: FrontFace): GPUFrontFace {
  const value = FRONT_FACE[face];
  if (!value) throw unsupported(`WebGPU 不支持正面朝向 ${face}`);
  return value;
}

// ---------------------------------------------------------------------------
// 采样器与纹理
// ---------------------------------------------------------------------------

const FILTER: Record<FilterMode, GPUFilterMode> = {
  [FilterMode.Nearest]: 'nearest',
  [FilterMode.Linear]: 'linear',
};

export function gpuFilterMode(filter: FilterMode): GPUFilterMode {
  const value = FILTER[filter];
  if (!value) throw unsupported(`WebGPU 不支持过滤模式 ${filter}`);
  return value;
}

const WRAP: Record<WrapMode, GPUAddressMode> = {
  [WrapMode.ClampToEdge]: 'clamp-to-edge',
  [WrapMode.Repeat]: 'repeat',
  [WrapMode.MirroredRepeat]: 'mirror-repeat',
};

export function gpuWrapMode(wrap: WrapMode): GPUAddressMode {
  const value = WRAP[wrap];
  if (!value) throw unsupported(`WebGPU 不支持寻址模式 ${wrap}`);
  return value;
}

const TEXTURE_FORMATS = new Set<string>([
  TextureFormat.R8Unorm,
  TextureFormat.RG8Unorm,
  TextureFormat.RGBA8Unorm,
  TextureFormat.RGBA8UnormSrgb,
  TextureFormat.Bgra8Unorm,
  TextureFormat.Bgra8UnormSrgb,
  TextureFormat.RGBA16Float,
  TextureFormat.RGBA32Float,
  TextureFormat.Depth16Unorm,
  TextureFormat.Depth24Plus,
  TextureFormat.Depth24PlusStencil8,
  TextureFormat.Depth32Float,
]);

/**
 * 纹理格式 -> GPUTextureFormat。
 * 统一枚举的取值本就取自 WebGPU 规范，这里只做一次白名单校验。
 */
export function gpuTextureFormat(format: TextureFormat): GPUTextureFormat {
  if (!TEXTURE_FORMATS.has(format)) throw unsupported(`WebGPU 不支持纹理格式 ${format}`);
  return format as GPUTextureFormat;
}

export function gpuTextureDimension(dimension: TextureDimension): GPUTextureViewDimension {
  switch (dimension) {
    case TextureDimension.D2:
      return '2d';
    case TextureDimension.D3:
      return '3d';
    case TextureDimension.Cube:
      return 'cube';
    default:
      throw unsupported(`WebGPU 不支持纹理维度 ${dimension}`);
  }
}

/** 深度模板格式的默认 view aspect：与 WebGL 的深度附件语义对齐。 */
export function gpuTextureAspect(format: TextureFormat): GPUTextureAspect {
  return format === TextureFormat.Depth24PlusStencil8 ? 'depth-only' : 'all';
}

export function gpuTextureUsage(usage: TextureUsage): GPUTextureUsageFlags {
  let flags = 0;
  if ((usage & TextureUsage.CopySrc) !== 0) flags |= GPUTextureUsage.COPY_SRC;
  if ((usage & TextureUsage.CopyDst) !== 0) flags |= GPUTextureUsage.COPY_DST;
  if ((usage & TextureUsage.TextureBinding) !== 0) flags |= GPUTextureUsage.TEXTURE_BINDING;
  if ((usage & TextureUsage.StorageBinding) !== 0) flags |= GPUTextureUsage.STORAGE_BINDING;
  if ((usage & TextureUsage.RenderAttachment) !== 0) flags |= GPUTextureUsage.RENDER_ATTACHMENT;
  return flags;
}

export function gpuBufferUsage(usage: BufferUsage): GPUBufferUsageFlags {
  let flags = 0;
  if ((usage & BufferUsage.Vertex) !== 0) flags |= GPUBufferUsage.VERTEX;
  if ((usage & BufferUsage.Index) !== 0) flags |= GPUBufferUsage.INDEX;
  if ((usage & BufferUsage.Uniform) !== 0) flags |= GPUBufferUsage.UNIFORM;
  if ((usage & BufferUsage.Storage) !== 0) flags |= GPUBufferUsage.STORAGE;
  if ((usage & BufferUsage.CopySrc) !== 0) flags |= GPUBufferUsage.COPY_SRC;
  if ((usage & BufferUsage.Indirect) !== 0) flags |= GPUBufferUsage.INDIRECT;
  // queue.writeBuffer 需要 COPY_DST：库的更新路径一律依赖它，因此不依赖调用方声明
  return flags | GPUBufferUsage.COPY_DST;
}

/** 纹理绑定的采样类型 -> GPUTextureSampleType。 */
export function gpuSampleType(sampleType: string): GPUTextureSampleType {
  if (
    sampleType === 'float' ||
    sampleType === 'unfilterable-float' ||
    sampleType === 'depth' ||
    sampleType === 'sint' ||
    sampleType === 'uint'
  ) {
    return sampleType;
  }
  throw unsupported(`WebGPU 不支持纹理采样类型 ${sampleType}`);
}

/** 采样器绑定的类型：比较采样器必须声明为 comparison。 */
export function gpuSamplerBindingType(comparison: boolean): GPUSamplerBindingType {
  return comparison ? 'comparison' : 'filtering';
}
