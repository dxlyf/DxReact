/**
 * 统一类型系统。
 *
 * 这里的枚举是三种图形 API 的"共同语言"：每个枚举成员都能映射到 WebGL 的 GLenum，
 * 也能映射到 WebGPU 的 GPUVertexFormat / GPUBlendFactor / GPUCompareFunction 等。
 *
 * 映射表只允许出现在适配层（api/gl/constants.ts、api/gpu/format.ts），
 * 核心层不引用任何具体 API 的全局对象，保证类型系统在三种 API 间共用。
 */

/** 图形后端标识。库不抹平三者的差异，只提供统一入口。 */
export enum GraphicsApi {
  WebGL = 'webgl',
  WebGL2 = 'webgl2',
  WebGPU = 'webgpu',
}

/**
 * 顶点属性 / uniform 的数据格式。
 *
 * 矩阵类型（Mat2/Mat3/Mat4）只允许用于 uniform：
 * WebGPU 没有 mat3 顶点格式，WebGL 的矩阵属性又要求按列分别指定指针，
 * 两者语义无法统一承载，因此属性侧请拆成若干 F32x4 列。
 */
export enum ShaderDataType {
  F32 = 'f32',
  F32x2 = 'f32x2',
  F32x3 = 'f32x3',
  F32x4 = 'f32x4',
  I32 = 'i32',
  I32x2 = 'i32x2',
  I32x3 = 'i32x3',
  I32x4 = 'i32x4',
  U32 = 'u32',
  U32x2 = 'u32x2',
  U32x3 = 'u32x3',
  U32x4 = 'u32x4',
  /** 8 位无符号，默认按归一化（0..1）解释 */
  U8x2 = 'u8x2',
  U8x4 = 'u8x4',
  /** 16 位无符号，默认按归一化（0..1）解释 */
  U16x2 = 'u16x2',
  U16x4 = 'u16x4',
  /** 半精度浮点，仅 WebGPU 原生支持（WebGL 需 OES_texture_half_float 之外的扩展，属性侧不支持） */
  F16x2 = 'f16x2',
  F16x4 = 'f16x4',
  Mat2 = 'mat2',
  Mat3 = 'mat3',
  Mat4 = 'mat4',
}

const COMPONENT_COUNT: Record<ShaderDataType, number> = {
  [ShaderDataType.F32]: 1,
  [ShaderDataType.F32x2]: 2,
  [ShaderDataType.F32x3]: 3,
  [ShaderDataType.F32x4]: 4,
  [ShaderDataType.I32]: 1,
  [ShaderDataType.I32x2]: 2,
  [ShaderDataType.I32x3]: 3,
  [ShaderDataType.I32x4]: 4,
  [ShaderDataType.U32]: 1,
  [ShaderDataType.U32x2]: 2,
  [ShaderDataType.U32x3]: 3,
  [ShaderDataType.U32x4]: 4,
  [ShaderDataType.U8x2]: 2,
  [ShaderDataType.U8x4]: 4,
  [ShaderDataType.U16x2]: 2,
  [ShaderDataType.U16x4]: 4,
  [ShaderDataType.F16x2]: 2,
  [ShaderDataType.F16x4]: 4,
  [ShaderDataType.Mat2]: 4,
  [ShaderDataType.Mat3]: 9,
  [ShaderDataType.Mat4]: 16,
};

const COMPONENT_BYTES: Record<ShaderDataType, number> = {
  [ShaderDataType.F32]: 4,
  [ShaderDataType.F32x2]: 4,
  [ShaderDataType.F32x3]: 4,
  [ShaderDataType.F32x4]: 4,
  [ShaderDataType.I32]: 4,
  [ShaderDataType.I32x2]: 4,
  [ShaderDataType.I32x3]: 4,
  [ShaderDataType.I32x4]: 4,
  [ShaderDataType.U32]: 4,
  [ShaderDataType.U32x2]: 4,
  [ShaderDataType.U32x3]: 4,
  [ShaderDataType.U32x4]: 4,
  [ShaderDataType.U8x2]: 1,
  [ShaderDataType.U8x4]: 1,
  [ShaderDataType.U16x2]: 2,
  [ShaderDataType.U16x4]: 2,
  [ShaderDataType.F16x2]: 2,
  [ShaderDataType.F16x4]: 2,
  [ShaderDataType.Mat2]: 4,
  [ShaderDataType.Mat3]: 4,
  [ShaderDataType.Mat4]: 4,
};

/** 逻辑分量个数（Mat3 为 9，Mat4 为 16）。 */
export function componentCount(type: ShaderDataType): number {
  return COMPONENT_COUNT[type];
}

/** 单个分量的字节数。 */
export function componentByteSize(type: ShaderDataType): number {
  return COMPONENT_BYTES[type];
}

/** 紧密排列（无 std140 填充）时的字节大小。 */
export function byteSize(type: ShaderDataType): number {
  return COMPONENT_COUNT[type] * COMPONENT_BYTES[type];
}

export function isMatrixType(type: ShaderDataType): boolean {
  return type === ShaderDataType.Mat2 || type === ShaderDataType.Mat3 || type === ShaderDataType.Mat4;
}

/** 矩阵列数，非矩阵返回 0。 */
export function matrixColumns(type: ShaderDataType): number {
  if (type === ShaderDataType.Mat2) return 2;
  if (type === ShaderDataType.Mat3) return 3;
  if (type === ShaderDataType.Mat4) return 4;
  return 0;
}

export function isFloatType(type: ShaderDataType): boolean {
  return type.startsWith('f');
}

export function isIntegerType(type: ShaderDataType): boolean {
  return !isFloatType(type) && !isMatrixType(type);
}

export function isSignedIntegerType(type: ShaderDataType): boolean {
  return type.startsWith('i32');
}

/** U8x* / U16x* 在 WebGL 中默认以 normalized 方式解释，与 WebGPU 的 unorm 格式对齐。 */
export function isNormalizedIntegerType(type: ShaderDataType): boolean {
  return type.startsWith('u8') || type.startsWith('u16');
}

/** 属性只接受非矩阵、且非半精度类型，与 WebGPU 顶点格式的覆盖面保持一致。 */
export function assertAttributeType(type: ShaderDataType, where: string): void {
  if (isMatrixType(type)) {
    throw new TypeError(
      `${where}: 矩阵类型 ${type} 不能作为顶点属性；` +
        `WebGPU 无 mat3 顶点格式，WebGL 的矩阵属性需按列分别指定指针，请拆成 N 个 F32x4 列。`,
    );
  }
  if (type === ShaderDataType.F16x2 || type === ShaderDataType.F16x4) {
    throw new TypeError(`${where}: 属性不支持半精度类型 ${type}，请改用 F32x2 / F32x4。`);
  }
}

/** 顶点数据的取用方式：逐顶点或逐实例。 */
export enum VertexStepMode {
  Vertex = 'vertex',
  Instance = 'instance',
}

/** 图元拓扑。与 WebGPU 的 GPUPrimitiveTopology 一一对应，WebGL 侧映射到 gl.draw* 的 mode。 */
export enum PrimitiveTopology {
  PointList = 'point-list',
  LineList = 'line-list',
  LineStrip = 'line-strip',
  TriangleList = 'triangle-list',
  TriangleStrip = 'triangle-strip',
}

/** 索引缓冲的数据格式。 */
export enum IndexFormat {
  Uint16 = 'uint16',
  Uint32 = 'uint32',
}

/** 缓冲用途，位掩码。一张缓冲可同时承载多种用途。 */
export enum BufferUsage {
  None = 0,
  Vertex = 1 << 0,
  Index = 1 << 1,
  Uniform = 1 << 2,
  Storage = 1 << 3,
  CopySrc = 1 << 4,
  CopyDst = 1 << 5,
  Indirect = 1 << 6,
}

/** 更新频率，决定库采用哪种上传策略（见 api/gl/glBuffer.ts 与 api/gpu/gpuBuffer.ts）。 */
export enum BufferFrequency {
  /** 一次写入多次使用：整块上传，之后不再上传 */
  Static = 'static',
  /** 多次局部更新：按脏区间做 bufferSubData / writeBuffer */
  Dynamic = 'dynamic',
  /** 每帧重写：orphaning（丢弃旧块）+ 整块写入，避免 GPU 等待 */
  Stream = 'stream',
}

export function hasUsage(usage: BufferUsage, flag: BufferUsage): boolean {
  return (usage & flag) !== 0;
}

/** 纹理像素格式。 */
export enum TextureFormat {
  R8Unorm = 'r8unorm',
  RG8Unorm = 'rg8unorm',
  RGBA8Unorm = 'rgba8unorm',
  RGBA8UnormSrgb = 'rgba8unorm-srgb',
  /** WebGPU 画布的常用首选格式（GL 侧不支持，用 glTextureFormat 查询会明确报错） */
  Bgra8Unorm = 'bgra8unorm',
  Bgra8UnormSrgb = 'bgra8unorm-srgb',
  RGBA16Float = 'rgba16float',
  RGBA32Float = 'rgba32float',
  Depth16Unorm = 'depth16unorm',
  Depth24Plus = 'depth24plus',
  Depth24PlusStencil8 = 'depth24plus-stencil8',
  Depth32Float = 'depth32float',
}

/** 纹理用途，位掩码。 */
export enum TextureUsage {
  None = 0,
  CopySrc = 1 << 0,
  CopyDst = 1 << 1,
  TextureBinding = 1 << 2,
  StorageBinding = 1 << 3,
  RenderAttachment = 1 << 4,
}

export enum TextureDimension {
  D2 = '2d',
  D3 = '3d',
  Cube = 'cube',
}

export enum FilterMode {
  Nearest = 'nearest',
  Linear = 'linear',
}

export enum WrapMode {
  ClampToEdge = 'clamp-to-edge',
  Repeat = 'repeat',
  MirroredRepeat = 'mirror-repeat',
}

export enum CompareFunction {
  Never = 'never',
  Less = 'less',
  Equal = 'equal',
  LessEqual = 'less-equal',
  Greater = 'greater',
  NotEqual = 'not-equal',
  GreaterEqual = 'greater-equal',
  Always = 'always',
}

export enum BlendFactor {
  Zero = 'zero',
  One = 'one',
  SrcColor = 'src',
  OneMinusSrcColor = 'one-minus-src',
  SrcAlpha = 'src-alpha',
  OneMinusSrcAlpha = 'one-minus-src-alpha',
  DstColor = 'dst',
  OneMinusDstColor = 'one-minus-dst',
  DstAlpha = 'dst-alpha',
  OneMinusDstAlpha = 'one-minus-dst-alpha',
  SrcAlphaSaturated = 'src-alpha-saturated',
}

export enum BlendOperation {
  Add = 'add',
  Subtract = 'subtract',
  ReverseSubtract = 'reverse-subtract',
  Min = 'min',
  Max = 'max',
}

export enum StencilOperation {
  Keep = 'keep',
  Zero = 'zero',
  Replace = 'replace',
  Invert = 'invert',
  IncrementClamp = 'increment-clamp',
  DecrementClamp = 'decrement-clamp',
  IncrementWrap = 'increment-wrap',
  DecrementWrap = 'decrement-wrap',
}

export enum CullMode {
  None = 'none',
  Front = 'front',
  Back = 'back',
}

export enum FrontFace {
  CCW = 'ccw',
  CW = 'cw',
}

export enum ShaderStage {
  Vertex = 1 << 0,
  Fragment = 1 << 1,
  Compute = 1 << 2,
}

/** 采样器绑定形态。WebGL 用组合采样器，WebGPU 需要拆成 texture + sampler 两个绑定。 */
export enum SamplerBindingKind {
  /** WebGL: sampler2D；WebGPU: texture_2d + sampler（两个绑定） */
  Sampler2D = 'sampler2D',
  /** WebGL: samplerCube；WebGPU: texture_cube + sampler */
  SamplerCube = 'samplerCube',
  /** 仅 WebGPU：texture_2d（不带采样器，如 storage 读取） */
  Texture2D = 'texture2D',
  /** 仅 WebGPU：独立的 filtering sampler */
  Sampler = 'sampler',
}

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScissorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function rgba(r: number, g: number, b: number, a = 1): Color {
  return { r, g, b, a };
}

/** 深度/模板状态。三端都支持，默认关闭以保证"零状态即最省"的初始状态。 */
export interface DepthStencilState {
  depthTest?: boolean;
  depthWrite?: boolean;
  depthCompare?: CompareFunction;
  stencilTest?: boolean;
  stencilWriteMask?: number;
  stencilReadMask?: number;
  stencilFront?: StencilFaceState;
  stencilBack?: StencilFaceState;
}

export interface StencilFaceState {
  compare?: CompareFunction;
  failOp?: StencilOperation;
  depthFailOp?: StencilOperation;
  passOp?: StencilOperation;
}

/** 颜色混合状态。 */
export interface BlendState {
  enabled?: boolean;
  color?: BlendComponent;
  alpha?: BlendComponent;
}

export interface BlendComponent {
  srcFactor?: BlendFactor;
  dstFactor?: BlendFactor;
  operation?: BlendOperation;
}

/** 光栅化状态。 */
export interface RasterizerState {
  cullMode?: CullMode;
  frontFace?: FrontFace;
  /** WebGL 侧映射到 gl.polygonOffset，WebGPU 映射到 depthBias */
  depthBias?: number;
  depthBiasSlopeScale?: number;
  depthBiasClamp?: number;
}

/** 管线持有的默认渲染状态。合并到一次状态比对中，减少 draw 前的冗余调用。 */
export interface PipelineState {
  topology?: PrimitiveTopology;
  rasterizer?: RasterizerState;
  depthStencil?: DepthStencilState;
  blend?: BlendState;
}

export interface DeviceLimits {
  /** 每个属性的最大分量数，WebGL 保证 >= 4 */
  maxVertexAttributes: number;
  maxTextureSize: number;
  maxTextureUnits: number;
  maxUniformBufferBindings: number;
  maxUniformBlockSize: number;
  maxBindGroups: number;
  maxVertexBuffers: number;
  maxBufferSize: number;
}

/** 运行期能力探测结果。库只暴露"能不能用"，不做降级决策。 */
export interface DeviceCapabilities {
  api: GraphicsApi;
  /** 是否支持原生 VAO（WebGL2 / OES_vertex_array_object） */
  vertexArrayObjects: boolean;
  /** 是否支持实例化绘制（WebGL2 / ANGLE_instanced_arrays / WebGPU） */
  instancing: boolean;
  /** 是否支持 UBO（WebGL2 / WebGPU）。WebGL1 为 false，UBO 会被降级为逐个 uniform 上传 */
  uniformBuffers: boolean;
  /** 是否支持 storage buffer（WebGPU only） */
  storageBuffers: boolean;
  computeShaders: boolean;
  /** 是否支持 32 位整数索引（WebGL1 需 OES_element_index_uint） */
  elementIndexUint: boolean;
  /** 是否支持 32 位浮点纹理 */
  floatTextures: boolean;
  /** 是否支持深度纹理 */
  depthTextures: boolean;
  anisotropy: boolean;
  /** 后端扩展名列表（WebGPU 无扩展概念时为空） */
  extensions: string[];
}
