/**
 * 纹理与采样器资源。
 *
 * 差异保留：
 *  - WebGL 把采样状态存在纹理对象上（gl.texParameteri），WEBGL2 还有 sampler object
 *  - WebGPU 的 GPUTexture 与 GPUSampler 是两个独立对象，必须成对绑定
 * 因此 Texture 上提供 sampler 视图：WebGL 直接写纹理参数，WebGPU 挂一个内部 GPUSampler。
 */
import { ResourceKind } from './handle.js';
import { Resource, type ResourceOwner } from './resource.js';
import {
  CompareFunction,
  FilterMode,
  TextureDimension,
  TextureFormat,
  TextureUsage,
  WrapMode,
} from './types.js';

export interface TextureDescriptor {
  label?: string;
  format: TextureFormat;
  width: number;
  height?: number;
  depthOrArrayLayers?: number;
  dimension?: TextureDimension;
  mipLevelCount?: number;
  sampleCount?: number;
  usage?: TextureUsage;
  /**
   * 初始像素数据。
   * 直接传 TypedArray 时，库按格式推导每像素字节数并算出宽高；
   * 需要更精细控制时传 region 列表。
   */
  data?: ArrayBufferView | readonly TextureSourceRegion[];
  /** 是否翻转 Y 轴，默认 true（匹配图片坐标系）。WebGPU 侧由库在写入时处理 */
  flipY?: boolean;
  /** 创建后是否生成 mipmap 链 */
  generateMipmaps?: boolean;
  sampler?: SamplerDescriptor;
}

export interface TextureSourceRegion {
  data: ArrayBufferView;
  width: number;
  height?: number;
  x?: number;
  y?: number;
  mipLevel?: number;
}

export interface TextureUpdateRegion {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  mipLevel?: number;
}

export interface SamplerDescriptor {
  label?: string;
  magFilter?: FilterMode;
  minFilter?: FilterMode;
  mipmapFilter?: FilterMode;
  wrapU?: WrapMode;
  wrapV?: WrapMode;
  wrapW?: WrapMode;
  anisotropy?: number;
  /** 阴影采样比较函数 */
  compare?: CompareFunction;
}

export interface ResolvedSamplerDescriptor {
  magFilter: FilterMode;
  minFilter: FilterMode;
  mipmapFilter: FilterMode;
  wrapU: WrapMode;
  wrapV: WrapMode;
  wrapW: WrapMode;
  anisotropy: number;
  compare?: CompareFunction;
}

export function resolveSamplerDescriptor(descriptor: SamplerDescriptor = {}): ResolvedSamplerDescriptor {
  return {
    magFilter: descriptor.magFilter ?? FilterMode.Linear,
    minFilter: descriptor.minFilter ?? FilterMode.Linear,
    mipmapFilter: descriptor.mipmapFilter ?? FilterMode.Nearest,
    wrapU: descriptor.wrapU ?? WrapMode.ClampToEdge,
    wrapV: descriptor.wrapV ?? WrapMode.ClampToEdge,
    wrapW: descriptor.wrapW ?? WrapMode.ClampToEdge,
    anisotropy: descriptor.anisotropy ?? 1,
    compare: descriptor.compare,
  };
}

/** 每个像素的字节数（未压缩格式）。 */
export function bytesPerPixel(format: TextureFormat): number {
  switch (format) {
    case TextureFormat.R8Unorm:
      return 1;
    case TextureFormat.RG8Unorm:
      return 2;
    case TextureFormat.RGBA8Unorm:
    case TextureFormat.RGBA8UnormSrgb:
    case TextureFormat.Bgra8Unorm:
    case TextureFormat.Bgra8UnormSrgb:
    case TextureFormat.Depth24Plus:
    case TextureFormat.Depth24PlusStencil8:
    case TextureFormat.Depth32Float:
      return 4;
    case TextureFormat.RGBA16Float:
    case TextureFormat.Depth16Unorm:
      return 8;
    case TextureFormat.RGBA32Float:
      return 16;
    default:
      return 4;
  }
}

export function isDepthFormat(format: TextureFormat): boolean {
  return format.startsWith('depth');
}

const DEFAULT_TEXTURE_USAGE =
  TextureUsage.TextureBinding | TextureUsage.CopyDst | TextureUsage.CopySrc | TextureUsage.RenderAttachment;

export abstract class Texture extends Resource {
  readonly format: TextureFormat;
  readonly width: number;
  readonly height: number;
  readonly depthOrArrayLayers: number;
  readonly dimension: TextureDimension;
  readonly mipLevelCount: number;
  readonly sampleCount: number;
  readonly usage: TextureUsage;
  readonly flipY: boolean;

  protected constructor(owner: ResourceOwner, descriptor: TextureDescriptor) {
    super(owner, ResourceKind.Texture, descriptor.label ?? 'texture');
    if (!(descriptor.width > 0)) {
      throw new TypeError(`${this.label}: width 必须为正数`);
    }
    this.format = descriptor.format;
    this.width = descriptor.width;
    this.height = descriptor.height ?? 1;
    this.depthOrArrayLayers = descriptor.depthOrArrayLayers ?? 1;
    this.dimension = descriptor.dimension ?? TextureDimension.D2;
    this.mipLevelCount = descriptor.mipLevelCount ?? 1;
    this.sampleCount = descriptor.sampleCount ?? 1;
    this.usage = descriptor.usage ?? DEFAULT_TEXTURE_USAGE;
    this.flipY = descriptor.flipY ?? true;
  }

  /** 原生句柄：WebGL 为 WebGLTexture，WebGPU 为 GPUTexture。 */
  abstract get native(): WebGLTexture | GPUTexture;

  /** 采样状态视图。WebGPU 下是内部 GPUSampler，WebGL 下就是纹理自身。 */
  abstract get sampler(): Sampler | null;

  /** 替换采样参数。传入 Sampler 资源则直接复用。 */
  abstract setSampler(sampler: SamplerDescriptor | Sampler): void;

  /**
   * 写入像素数据。
   *
   * 便捷之处：不需要区分 texSubImage2D / writeTexture / unpack 对齐设置，
   * 也不需要先绑定纹理；只描述"写到哪块区域"。
   */
  abstract update(data: ArrayBufferView, region?: TextureUpdateRegion): void;

  abstract generateMipmaps(): void;

  /** 估算显存占用（字节），用于调试与容量评估。 */
  get byteSize(): number {
    return this.width * this.height * this.depthOrArrayLayers * bytesPerPixel(this.format);
  }
}

export abstract class Sampler extends Resource {
  readonly descriptor: ResolvedSamplerDescriptor;

  protected constructor(owner: ResourceOwner, descriptor: SamplerDescriptor = {}) {
    super(owner, ResourceKind.Sampler, descriptor.label ?? 'sampler');
    this.descriptor = resolveSamplerDescriptor(descriptor);
  }

  /** 原生句柄：WebGL2 为 WebGLSampler，WebGPU 为 GPUSampler，WebGL1 为 null（参数写在纹理上）。 */
  abstract get native(): WebGLSampler | GPUSampler | null;
}
