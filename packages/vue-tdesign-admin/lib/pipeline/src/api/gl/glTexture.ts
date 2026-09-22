/**
 * WebGL / WebGL2 的纹理与采样器实现。
 *
 * 差异保留：
 *  - WebGL1 没有独立的采样器对象，采样参数只能写在纹理上（gl.texParameteri），
 *    因此 GLSampler 在 WebGL1 下 native 返回 null，参数由 GLTexture 代为施加。
 *  - WebGL2 有原生 WebGLSampler，一个纹理可以配多套采样状态
 *    （同一张纹理既做 repeat 又做 clamp 时不需要复制纹理）。
 *
 * 便捷之处：格式映射、mipmap 链分配、像素存储对齐、翻转 Y 都在这里一次做完，
 * update() 只需要描述"写到哪块区域"，不必先绑定纹理再算 UNPACK_ALIGNMENT。
 */
import type { Device } from '../../core/device.js';
import { ErrorCode, GraphicsError, invalidDescriptor } from '../../core/errors.js';
import {
  bytesPerPixel,
  resolveSamplerDescriptor,
  Sampler,
  Texture,
  type ResolvedSamplerDescriptor,
  type SamplerDescriptor,
  type TextureDescriptor,
  type TextureSourceRegion,
  type TextureUpdateRegion,
} from '../../core/texture.js';
import { TextureDimension } from '../../core/types.js';
import {
  gl2,
  glCompare,
  glMagFilter,
  glMinFilter,
  glTextureFormat,
  glTextureTarget,
  glWrapMode,
  type GLContext,
  type GLExtensions,
  type GLTextureFormatInfo,
} from './constants.js';
import type { GLStateCache } from './glState.js';

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

// ---------------------------------------------------------------------------
// 采样器
// ---------------------------------------------------------------------------

export class GLSampler extends Sampler {
  private readonly gl: GLContext;
  private readonly state: GLStateCache;
  private readonly webgl2: boolean;
  private readonly extensions: GLExtensions;
  private readonly nativeSampler: WebGLSampler | null;

  constructor(device: Device, descriptor: SamplerDescriptor, state: GLStateCache) {
    super(device, descriptor);
    this.gl = state.gl;
    this.state = state;
    this.webgl2 = state.webgl2;
    this.extensions = state.extensions;

    if (!state.webgl2) {
      // WebGL1 无采样器对象：参数必须落在纹理上，由 GLTexture 代为施加
      this.nativeSampler = null;
      return;
    }

    const sampler = gl2(state.gl).createSampler();
    if (!sampler) {
      throw new GraphicsError('gl.createSampler 返回 null', {
        code: ErrorCode.NativeAPIError,
        api: device.api,
        call: 'createSampler',
        resource: this.describe(),
      });
    }
    this.nativeSampler = sampler;
    this.state.call('samplerParameteri', sampler);
    // 独立采样器对象不绑定具体纹理，按"可能带 mip 链"的常规语义设置；
    // 纹理自有的采样器会在 GLTexture 构造期用真实 mip 状态覆盖。
    applySamplerParameters(gl2(this.gl), this.extensions, sampler, this.descriptor, true);
  }

  override get native(): WebGLSampler | null {
    return this.nativeSampler;
  }

  /**
   * WebGL1 降级路径：把采样参数写到纹理对象上。
   * WebGL2 有原生采样器时不需要走这里 —— 但默认参数仍会写到纹理上，
   * 这样"没有显式绑定采样器"的绘制也能得到与描述符一致的采样行为。
   */
  applyToTexture(target: number, hasMipmaps: boolean): void {
    if (this.webgl2) return;
    this.state.call('texParameteri', target, 'sampler');
    applySamplerParameters(gl2(this.gl), this.extensions, target, this.descriptor, hasMipmaps);
  }

  protected override onDestroy(): void {
    if (!this.nativeSampler) return;
    this.state.forgetSampler(this.nativeSampler);
    gl2(this.gl).deleteSampler(this.nativeSampler);
  }
}

/**
 * 把采样描述符施加到一个"采样参数目标"上。
 * WebGL2 传 WebGLSampler（samplerParameteri），WebGL1 传纹理目标（texParameteri）。
 * `hasMipmaps` 必须显式传入：为 false 时必须用非 mipmap 类 minFilter，
 * 否则只有 level 0 的纹理会被判定为"不完整"，采样恒返回黑。
 */
function applySamplerParameters(
  gl: WebGL2RenderingContext,
  extensions: GLExtensions,
  target: WebGLSampler | number,
  resolved: ResolvedSamplerDescriptor,
  hasMipmaps: boolean,
): void {
  const set = (pname: number, param: number): void => {
    if (typeof target === 'number') gl.texParameteri(target, pname, param);
    else gl.samplerParameteri(target, pname, param);
  };

  set(gl.TEXTURE_MAG_FILTER, glMagFilter(resolved.magFilter, gl));
  set(gl.TEXTURE_MIN_FILTER, glMinFilter(resolved.minFilter, resolved.mipmapFilter, gl, hasMipmaps));
  set(gl.TEXTURE_WRAP_S, glWrapMode(resolved.wrapU, gl));
  set(gl.TEXTURE_WRAP_T, glWrapMode(resolved.wrapV, gl));
  set(gl.TEXTURE_WRAP_R, glWrapMode(resolved.wrapW, gl));

  if (resolved.anisotropy > 1 && extensions.anisotropy) {
    const limit = gl.getParameter(extensions.anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number;
    set(extensions.anisotropy.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(resolved.anisotropy, limit));
  }

  if (resolved.compare !== undefined) {
    // 阴影采样：需要 texture compare + 深度格式纹理
    set(gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    set(gl.TEXTURE_COMPARE_FUNC, glCompare(resolved.compare, gl));
  }
}

// ---------------------------------------------------------------------------
// 纹理
// ---------------------------------------------------------------------------

export class GLTexture extends Texture {
  private readonly gl: GLContext;
  private readonly state: GLStateCache;
  private readonly device: Device;
  private readonly nativeTexture: WebGLTexture;
  private readonly target: number;
  private readonly formatInfo: GLTextureFormatInfo;
  private readonly extensions: GLExtensions;
  private readonly webgl2: boolean;

  /** 当前采样状态视图。WebGL2 下是真实 WebGLSampler，WebGL1 下是参数搬运工。 */
  private samplerResource: GLSampler;
  /** 内部创建的采样器随纹理一起销毁；外部传入的由调用方负责 */
  private ownsSampler: boolean;

  constructor(device: Device, descriptor: TextureDescriptor, state: GLStateCache) {
    const normalized: TextureDescriptor = { ...descriptor, height: deriveHeight(descriptor) };
    super(device, normalized);

    this.device = device;
    this.gl = state.gl;
    this.state = state;
    this.webgl2 = state.webgl2;
    this.extensions = state.extensions;
    this.target = glTextureTarget(this.dimension, state.gl, this.depthOrArrayLayers);
    this.formatInfo = glTextureFormat(this.format, state.gl, state.webgl2);

    const texture = state.gl.createTexture();
    if (!texture) {
      throw new GraphicsError('gl.createTexture 返回 null', {
        code: ErrorCode.NativeAPIError,
        api: device.api,
        call: 'createTexture',
        resource: this.describe(),
      });
    }
    this.nativeTexture = texture;

    // glTextureTarget 已对 WebGL1 的 3D / 数组纹理抛过 unsupported，这里只需处理 cube 面数
    if (this.dimension === TextureDimension.Cube && this.depthOrArrayLayers !== 1 && this.depthOrArrayLayers !== 6) {
      throw invalidDescriptor(`${this.describe()}: cube 纹理需要 6 层，实际 ${this.depthOrArrayLayers}`);
    }

    this.state.bindTexture(0, this.target, texture);
    this.allocateLevels(descriptor);

    // 默认采样参数直接落在纹理上，保证未知采样器时行为可预期
    this.state.call('texParameteri', this.target, 'defaults');
    applySamplerParameters(
      gl2(this.gl),
      this.extensions,
      this.target,
      resolveSamplerDescriptor(descriptor.sampler),
      this.mipLevelCount > 1,
    );

    const created = new GLSampler(device, descriptor.sampler ?? {}, state);
    this.samplerResource = created;
    this.ownsSampler = true;
    if (this.webgl2 && created.native) {
      // WebGL2 上把描述符同步到独立采样器对象；必须带纹理真实的 mip 状态，
      // 否则 mipmap 类 minFilter 会让只有 level 0 的纹理变成"不完整纹理"（采样恒为黑）
      applySamplerParameters(gl2(this.gl), this.extensions, created.native as WebGLSampler, created.descriptor, this.mipLevelCount > 1);
    }

    if (descriptor.generateMipmaps) this.generateMipmaps();
  }

  override get native(): WebGLTexture {
    return this.nativeTexture;
  }

  /** 与 native 同义，便于按后端命名下探。 */
  get glTexture(): WebGLTexture {
    return this.nativeTexture;
  }

  get sampler(): Sampler {
    return this.samplerResource;
  }

  setSampler(sampler: SamplerDescriptor | Sampler): void {
    this.assertAlive('setSampler');
    if (sampler instanceof Sampler) {
      if (this.ownsSampler) this.samplerResource.destroy();
      this.samplerResource = sampler as GLSampler;
      this.ownsSampler = false;
      if (!this.webgl2) (this.samplerResource as GLSampler).applyToTexture(this.target, this.mipLevelCount > 1);
      return;
    }
    this.samplerResource = new GLSampler(this.device, sampler, this.state);
    this.ownsSampler = true;
    this.samplerResource.applyToTexture(this.target, this.mipLevelCount > 1);
  }

  update(data: ArrayBufferView, region: TextureUpdateRegion = {}): void {
    this.assertAlive('update');
    const level = region.mipLevel ?? 0;
    const x = region.x ?? 0;
    const y = region.y ?? 0;
    const width = region.width ?? this.width;
    const height = region.height ?? this.height;
    assertRegion(this.describe(), x, y, width, height, this.width, this.height);

    this.state.bindTexture(0, this.target, this.nativeTexture);
    this.state.unpackFlipY(this.flipY && this.dimension !== TextureDimension.D3 && this.depthOrArrayLayers === 1);
    this.state.unpackAlignment(alignmentFor(this.formatInfo.type, width));

    if (this.dimension === TextureDimension.Cube) {
      for (let face = 0; face < 6; face++) {
        this.state.call('texSubImage2D', level, x, y, width, height);
        this.gl.texSubImage2D(
          this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + face,
          level,
          x,
          y,
          width,
          height,
          this.formatInfo.format,
          this.formatInfo.type,
          data,
        );
      }
      this.device.stats.textureUploads++;
      return;
    }

    if (this.dimension === TextureDimension.D3 || this.depthOrArrayLayers > 1) {
      const layer = region.y ?? 0;
      const depth = this.dimension === TextureDimension.D3 ? this.depthOrArrayLayers : 1;
      const target = this.dimension === TextureDimension.D3 ? gl2(this.gl).TEXTURE_3D : gl2(this.gl).TEXTURE_2D_ARRAY;
      this.state.call('texSubImage3D', level, x, layer, width, height);
      gl2(this.gl).texSubImage3D(target, level, x, layer, 0, width, height, depth, this.formatInfo.format, this.formatInfo.type, data);
      this.device.stats.textureUploads++;
      return;
    }

    if (width !== this.width || height !== this.height) {
      throw invalidDescriptor(
        `${this.describe()}.update: 不允许改变尺寸（${width}x${height}），纹理为 ${this.width}x${this.height}`,
        { hint: '改变尺寸请销毁后重建纹理；update 只做子区域写入。' },
      );
    }

    this.state.call('texSubImage2D', level, x, y, width, height);
    this.gl.texSubImage2D(this.target, level, x, y, width, height, this.formatInfo.format, this.formatInfo.type, data);
    this.device.stats.textureUploads++;
  }

  generateMipmaps(): void {
    this.assertAlive('generateMipmaps');
    if (!this.formatInfo) return;
    this.state.bindTexture(0, this.target, this.nativeTexture);
    this.state.call('generateMipmap', this.target);
    this.gl.generateMipmap(this.target);
  }

  /** 用于把纹理绑定到指定单元（供 BindGroup / RenderPass 使用，避免各自重复绑定逻辑）。 */
  bindToUnit(unit: number): void {
    this.state.bindTexture(unit, this.target, this.nativeTexture);
    if (this.webgl2 && this.samplerResource.native) {
      this.state.bindSampler(unit, this.samplerResource.native);
    } else if (!this.webgl2) {
      this.samplerResource.applyToTexture(this.target, this.mipLevelCount > 1);
    }
  }

  get glTarget(): number {
    return this.target;
  }

  protected override onDestroy(): void {
    if (this.ownsSampler) this.samplerResource.destroy();
    this.state.forgetTexture(this.nativeTexture);
    this.gl.deleteTexture(this.nativeTexture);
  }

  // -------------------------------------------------------------------------

  private allocateLevels(descriptor: TextureDescriptor): void {
    const regions = isRegionList(descriptor.data) ? descriptor.data : null;
    const initial = regions ? null : ((descriptor.data as ArrayBufferView | undefined) ?? null);

    this.state.unpackFlipY(this.flipY && this.dimension !== TextureDimension.D3 && this.depthOrArrayLayers === 1);
    this.state.unpackAlignment(alignmentFor(this.width, bytesPerPixel(this.format)));

    for (let level = 0; level < this.mipLevelCount; level++) {
      const width = Math.max(1, this.width >> level);
      const height = Math.max(1, this.height >> level);
      const depth = Math.max(1, this.depthOrArrayLayers >> (this.dimension === TextureDimension.D3 ? level : 0));
      this.allocateLevel(this.target, level, width, height, depth, level === 0 ? initial : null);
    }

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
    }
  }

  private allocateLevel(
    target: number,
    level: number,
    width: number,
    height: number,
    depth: number,
    data: ArrayBufferView | null,
  ): void {
    const { internalFormat, format, type } = this.formatInfo;

    if (this.dimension === TextureDimension.Cube) {
      if (level > 0) return; // cube 的 mip 链由 generateMipmap 生成，不逐个面预分配
      for (let face = 0; face < 6; face++) {
        this.state.call('texImage2D', level, face, width, height);
        this.gl.texImage2D(
          this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + face,
          level,
          internalFormat,
          width,
          height,
          0,
          format,
          type,
          data,
        );
      }
      return;
    }

    if (this.dimension === TextureDimension.D3 || this.depthOrArrayLayers > 1) {
      this.state.call('texImage3D', level, width, height, depth);
      gl2(this.gl).texImage3D(target, level, internalFormat, width, height, depth, 0, format, type, data);
      return;
    }

    this.state.call('texImage2D', target, level, width, height);
    this.gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, data);
  }
}

/**
 * UNPACK_ALIGNMENT 必须与实际每行字节数匹配，否则窄格式（R8/RG8）会读错行。
 * 取能整除行字节数的最大可用对齐值（8 / 4 / 2 / 1）。
 */
function alignmentFor(width: number, pixelBytes: number): number {
  const rowBytes = width * pixelBytes;
  if (rowBytes % 8 === 0) return 8;
  if (rowBytes % 4 === 0) return 4;
  if (rowBytes % 2 === 0) return 2;
  return 1;
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
