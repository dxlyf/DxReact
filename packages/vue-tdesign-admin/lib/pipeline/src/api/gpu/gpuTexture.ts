/**
 * WebGPU 的纹理与采样器实现。
 *
 * 与 GL 侧的差异（保留，不做抹平）：
 *  - GPUTexture 与 GPUSampler 是两个独立原生对象，必须成对绑定；WebGL 那种把采样状态
 *    写在纹理上（gl.texParameteri）的做法在 WebGPU 不存在，因此 Texture.sampler 返回的
 *    是本类内部持有的 GPUSampler（恒非 null），setSampler 负责重建或复用它。
 *  - 上传只有一条路径：queue.writeTexture。它带一条 WebGL 没有的硬约束 ——
 *    bytesPerRow 必须是 256 的倍数（COPY_BYTES_PER_ROW_ALIGNMENT）。行字节数不对齐时，
 *    本类先把数据重排进「行对齐」的临时缓冲再上传，调用方不必关心。
 *  - WebGPU 没有 unpackFlipY 之类的像素存储开关，flipY 由本类在整块上传时按行做上下翻转。
 *  - WebGPU 没有自动 mipmap 生成（WebGL 侧由 gl.generateMipmap 完成），
 *    因此 generateMipmaps() 明确抛 unsupported，而不是静默无效。
 *
 * 注意：本文件导出的类名 GPUTexture / GPUSampler 会遮蔽 @webgpu/types 的同名全局类型，
 * 因此原生句柄类型统一用 ReturnType<GPUDevice['createXxx']> 表达，既避免遮蔽也跟随类型版本。
 */
import type { Device } from '../../core/device.js';
import { invalidDescriptor, unsupported } from '../../core/errors.js';
import {
  bytesPerPixel,
  Sampler,
  Texture,
  type SamplerDescriptor,
  type TextureDescriptor,
  type TextureSourceRegion,
  type TextureUpdateRegion,
} from '../../core/texture.js';
import { TextureDimension } from '../../core/types.js';
import {
  gpuCompare,
  gpuFilterMode,
  gpuTextureAspect,
  gpuTextureDimension,
  gpuTextureFormat,
  gpuTextureUsage,
  gpuWrapMode,
} from './format.js';

/** WebGPU 规定 writeTexture 的 bytesPerRow 必须是该常量的倍数。 */
const COPY_BYTES_PER_ROW_ALIGNMENT = 256;
/** cube 纹理在 WebGPU 下就是 6 个数组层。 */
const CUBE_FACE_COUNT = 6;

/** 原生纹理句柄（全局 GPUTexture，绕开本文件同名类的遮蔽）。 */
type NativeTexture = ReturnType<GPUDevice['createTexture']>;
/** 原生采样器句柄（全局 GPUSampler）。 */
type NativeSampler = ReturnType<GPUDevice['createSampler']>;

/** 由裸 TypedArray 推导高度；已显式给出 height 或传 region 列表时不做推导。 */
function deriveHeight(descriptor: TextureDescriptor): number {
  if (descriptor.height !== undefined) return descriptor.height;
  const data = descriptor.data;
  if (!data || Array.isArray(data)) return 1;
  const view = data as ArrayBufferView;
  const pixels = Math.floor(view.byteLength / bytesPerPixel(descriptor.format));
  if (pixels <= 0) return 1;
  return Math.max(1, Math.floor(pixels / descriptor.width));
}

function isRegionList(data: TextureDescriptor['data']): data is readonly TextureSourceRegion[] {
  return Array.isArray(data);
}

/** 把行字节数向上取整到 256 的倍数（WebGPU 的 COPY_BYTES_PER_ROW_ALIGNMENT）。 */
function alignToRowAlignment(byteLength: number): number {
  return Math.ceil(byteLength / COPY_BYTES_PER_ROW_ALIGNMENT) * COPY_BYTES_PER_ROW_ALIGNMENT;
}

// ---------------------------------------------------------------------------
// 采样器
// ---------------------------------------------------------------------------

export class GPUSampler extends Sampler {
  private readonly device: Device;
  private readonly nativeSampler: NativeSampler;

  constructor(device: Device, descriptor: SamplerDescriptor | undefined, gpuDevice: GPUDevice) {
    // 基类 Sampler 内部已用 resolveSamplerDescriptor 补齐默认值，这里的 this.descriptor 即解析结果
    super(device, descriptor ?? {});
    this.device = device;

    const resolved = this.descriptor;
    // 差异保留：WebGPU 采样器没有 anisotropy。它属于可选画质优化而非功能，
    // 因此这里选择「忽略并继续」，而不是让整条纹理创建失败。
    this.nativeSampler = gpuDevice.createSampler({
      label: this.label,
      magFilter: gpuFilterMode(resolved.magFilter),
      minFilter: gpuFilterMode(resolved.minFilter),
      mipmapFilter: gpuFilterMode(resolved.mipmapFilter),
      addressModeU: gpuWrapMode(resolved.wrapU),
      addressModeV: gpuWrapMode(resolved.wrapV),
      addressModeW: gpuWrapMode(resolved.wrapW),
      compare: resolved.compare !== undefined ? gpuCompare(resolved.compare) : undefined,
    });
    device.commands.record('gpu', 'createSampler', [this.label]);
  }

  override get native(): NativeSampler {
    return this.nativeSampler;
  }

  /** 与 native 同义，便于按后端命名下探。 */
  get gpuSampler(): NativeSampler {
    return this.nativeSampler;
  }

  protected override onDestroy(): void {
    // GPUSampler 没有 destroy()：原生采样器由 GC 回收，这里只记录一次释放意图
    this.device.commands.record('gpu', 'releaseSampler', [this.label]);
  }
}

// ---------------------------------------------------------------------------
// 纹理
// ---------------------------------------------------------------------------

export class GPUTexture extends Texture {
  private readonly device: Device;
  private readonly gpuDevice: GPUDevice;
  private readonly nativeTexture: NativeTexture;

  /** 内部采样器视图，恒非 null（WebGPU 必须成对绑定，这里始终给出一套默认采样状态）。 */
  private samplerResource: GPUSampler;
  /** true 表示采样器由本纹理创建并持有，销毁 / 替换时需要一并释放。 */
  private ownsSampler: boolean;
  /** 默认视图按需创建并缓存，绑定组会反复取用。 */
  private cachedView: GPUTextureView | null = null;

  constructor(device: Device, descriptor: TextureDescriptor, gpuDevice: GPUDevice) {
    super(device, { ...descriptor, height: deriveHeight(descriptor) });
    this.device = device;
    this.gpuDevice = gpuDevice;

    if (this.dimension === TextureDimension.Cube && this.depthOrArrayLayers !== CUBE_FACE_COUNT) {
      throw invalidDescriptor(
        `${this.describe()}: cube 纹理需要 ${CUBE_FACE_COUNT} 层，实际 ${this.depthOrArrayLayers}`,
        { hint: 'WebGPU 的 cube 视图要求 depthOrArrayLayers 恰为 6。' },
      );
    }

    this.nativeTexture = gpuDevice.createTexture({
      label: this.label,
      size: {
        width: this.width,
        height: this.height,
        depthOrArrayLayers: this.depthOrArrayLayers,
      },
      format: gpuTextureFormat(this.format),
      // cube 是「视图维度」，原生纹理维度只有 2d / 3d
      dimension: this.dimension === TextureDimension.D3 ? '3d' : '2d',
      mipLevelCount: this.mipLevelCount,
      sampleCount: this.sampleCount,
      usage: gpuTextureUsage(this.usage),
    });
    device.commands.record('gpu', 'createTexture', [this.label, this.width, this.height]);

    const created = new GPUSampler(device, descriptor.sampler, gpuDevice);
    this.samplerResource = created;
    this.ownsSampler = true;

    // 初始数据：region 列表逐个写入，裸 TypedArray 视为整块
    const regions = isRegionList(descriptor.data) ? descriptor.data : null;
    if (regions) {
      for (const region of regions) {
        this.update(region.data, {
          x: region.x,
          y: region.y,
          width: region.width,
          height: region.height,
          mipLevel: region.mipLevel,
        });
      }
    } else if (descriptor.data !== undefined) {
      this.update(descriptor.data as ArrayBufferView);
    }

    if (descriptor.generateMipmaps) this.generateMipmaps();
  }

  override get native(): NativeTexture {
    return this.nativeTexture;
  }

  /** 与 native 同义，便于按后端命名下探。 */
  get gpuTexture(): NativeTexture {
    return this.nativeTexture;
  }

  /**
   * 采样状态视图：恒为内部持有的 GPUSampler。
   * WebGPU 的采样状态不在纹理上，因此这里不会返回 null，绑定组直接取它配对即可。
   */
  override get sampler(): GPUSampler {
    return this.samplerResource;
  }

  /**
   * 替换采样参数。
   * 传 SamplerDescriptor 会新建一个内部 GPUSampler（并释放上一个由本纹理持有的采样器）；
   * 传 Sampler 资源则直接复用，所有权随之转移给调用方。
   */
  override setSampler(sampler: SamplerDescriptor | Sampler): void {
    this.assertAlive('setSampler');
    const previous = this.samplerResource;
    const ownedPreviously = this.ownsSampler;

    if (sampler instanceof Sampler) {
      this.samplerResource = sampler as GPUSampler;
      this.ownsSampler = false;
    } else {
      this.samplerResource = new GPUSampler(this.device, sampler, this.gpuDevice);
      this.ownsSampler = true;
    }

    // previous !== 新对象 才释放，避免「把内部采样器传回来」时重复销毁
    if (ownedPreviously && previous !== this.samplerResource) previous.destroy();
  }

  /** 默认视图（2D / 3D / cube），按需创建并缓存；深度模板格式会自动取 depth-only aspect。 */
  get view(): GPUTextureView {
    this.assertAlive('view');
    if (!this.cachedView) {
      this.cachedView = this.nativeTexture.createView({
        label: `${this.label}-view`,
        dimension: this.viewDimension,
        aspect: gpuTextureAspect(this.format),
        mipLevelCount: this.mipLevelCount,
      });
      this.device.commands.record('gpu', 'createTextureView', [this.label]);
    }
    return this.cachedView;
  }

  /** 与纹理维度对应的视图维度。 */
  get viewDimension(): GPUTextureViewDimension {
    return gpuTextureDimension(this.dimension);
  }

  /**
   * WebGPU 没有自动 mipmap 生成：createTexture 只分配层级，不会填充内容
   * （WebGL 侧对应 gl.generateMipmap）。
   * 这里明确报错而不是静默无效，避免调用方以为链已生成却采样到黑图。
   */
  override generateMipmaps(): void {
    this.assertAlive('generateMipmaps');
    throw unsupported(`${this.describe()}: WebGPU 没有自动 mipmap 生成`, {
      hint: '请用「采样式 blit 管线」逐层降采样自行生成 mip 链，或直接以 mipLevelCount=1 创建纹理。',
    });
  }

  /**
   * 写入像素数据。
   *
   * 差异保留：
   *  - 只走 queue.writeTexture，不需要先「绑定纹理」。
   *  - bytesPerRow 受 256 字节对齐硬约束：行字节数不对齐且有多个行时，
   *    先把数据重排进行对齐的临时缓冲，再交给原生接口（见 packRows）。
   *  - WebGPU 没有 unpackFlipY：flipY 且整块上传时，在重排过程中顺带按行上下翻转。
   */
  override update(data: ArrayBufferView, region?: TextureUpdateRegion): void {
    this.assertAlive('update');
    const level = region?.mipLevel ?? 0;
    if (!Number.isInteger(level) || level < 0 || level >= this.mipLevelCount) {
      throw invalidDescriptor(
        `${this.describe()}.update: mipLevel ${level} 超出 [0, ${this.mipLevelCount})`,
      );
    }

    const pixelBytes = bytesPerPixel(this.format);
    const levelWidth = Math.max(1, this.width >> level);
    const levelHeight = Math.max(1, this.height >> level);
    const isCube = this.dimension === TextureDimension.Cube;
    const is3d = this.dimension === TextureDimension.D3;
    // cube / 3D / 数组纹理都是「分层」的：整块写入覆盖全部层，指定区域时只写单层
    const layered = isCube || is3d || this.depthOrArrayLayers > 1;
    const whole = region === undefined;

    let x = region?.x ?? 0;
    let y = 0;
    let z = 0;
    let width = region?.width ?? levelWidth;
    let height = region?.height ?? levelHeight;
    let depth = 1;

    if (isCube) {
      y = region?.y ?? 0;
      depth = CUBE_FACE_COUNT;
    } else if (layered) {
      // 数组 / 3D 纹理没有独立的层字段，沿用 GL 侧习惯：region.y 表示层号（映射到 origin.z）
      z = region?.y ?? 0;
      depth = whole ? this.depthOrArrayLayers : 1;
    } else {
      y = region?.y ?? 0;
    }

    assertRegion(this.describe(), x, y, width, height, levelWidth, levelHeight);
    if (z < 0 || z + depth > this.depthOrArrayLayers) {
      throw invalidDescriptor(
        `${this.describe()}.update: 层区间 [${z}, ${z + depth}) 超出 ${this.depthOrArrayLayers} 层`,
      );
    }

    const expected = pixelBytes * width * height * depth;
    if (data.byteLength !== expected) {
      throw invalidDescriptor(
        `${this.describe()}.update: 需要 ${expected} 字节，实际收到 ${data.byteLength} 字节`,
        {
          hint:
            '按格式推导：宽 x 高 x 层数 x 每像素字节数；若只更新子区域，请显式给出 width / height（分层纹理用 y 表示层号）。',
        },
      );
    }

    // 仅在整块上传时翻转：子区域写入的坐标系由调用方自行保证
    const flip = this.flipY && whole && !layered && height > 1;
    const layout = packRows(data, width, height, depth, pixelBytes, flip);

    this.gpuDevice.queue.writeTexture(
      { texture: this.nativeTexture, mipLevel: level, origin: { x, y, z } },
      // writeTexture 只接受非共享的 ArrayBuffer 视图；与 gpuBuffer 的 writeBuffer 同款处理
      layout.source as BufferSource,
      { bytesPerRow: layout.bytesPerRow, rowsPerImage: layout.rowsPerImage },
      { width, height, depthOrArrayLayers: depth },
    );
    this.device.commands.record('gpu', 'writeTexture', [this.label, x, y, z, width, height, depth]);
    this.device.stats.textureUploads++;
  }

  protected override onDestroy(): void {
    this.cachedView = null;
    if (this.ownsSampler) this.samplerResource.destroy();
    this.device.commands.record('gpu', 'destroyTexture', [this.label]);
    this.nativeTexture.destroy();
  }
}

/** writeTexture 的数据布局：行对齐后的字节视图与对应的 dataLayout。 */
interface UploadLayout {
  source: ArrayBufferView;
  bytesPerRow: number | undefined;
  rowsPerImage: number | undefined;
}

/**
 * 把紧密排列的像素数据重排成 WebGPU 能接受的布局。
 *
 * WebGPU 的硬约束：bytesPerRow 必须是 256 的倍数（COPY_BYTES_PER_ROW_ALIGNMENT）。
 * 因此当一行字节数不是 256 的倍数且存在多行时，必须先把每行搬到对齐后的起始位置。
 * flipY 也在这里顺手完成 —— WebGPU 没有 unpackFlipY，只能自己按行倒序搬运。
 * 单行数据（height * depth === 1）无对齐要求，可省略 bytesPerRow，避免无谓拷贝。
 */
function packRows(
  data: ArrayBufferView,
  width: number,
  height: number,
  depth: number,
  pixelBytes: number,
  flip: boolean,
): UploadLayout {
  const rowBytes = width * pixelBytes;
  const rowCount = height * depth;
  const multipleRows = rowCount > 1;
  const alignedRowBytes = multipleRows ? alignToRowAlignment(rowBytes) : rowBytes;
  const bytesPerRow = multipleRows ? alignedRowBytes : undefined;
  const rowsPerImage = depth > 1 ? height : undefined;

  if (alignedRowBytes === rowBytes && !flip) {
    return { source: data, bytesPerRow, rowsPerImage };
  }

  const src = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const dst = new Uint8Array(alignedRowBytes * rowCount);
  for (let row = 0; row < rowCount; row++) {
    const from = (flip ? rowCount - 1 - row : row) * rowBytes;
    dst.set(src.subarray(from, from + rowBytes), row * alignedRowBytes);
  }
  return { source: dst, bytesPerRow, rowsPerImage };
}

function assertRegion(
  where: string,
  x: number,
  y: number,
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): void {
  if (width <= 0 || height <= 0) {
    throw invalidDescriptor(`${where}.update: 区域尺寸必须为正数（${width}x${height}）`);
  }
  if (x < 0 || y < 0 || x + width > maxWidth || y + height > maxHeight) {
    throw invalidDescriptor(
      `${where}.update: 区域 [${x},${y} ${width}x${height}] 超出纹理范围 ${maxWidth}x${maxHeight}`,
    );
  }
}