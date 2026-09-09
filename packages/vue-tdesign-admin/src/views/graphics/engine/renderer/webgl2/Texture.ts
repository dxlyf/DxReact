/**
 * Texture —— WebGL2 纹理（TEXTURE_2D）
 *
 * - 支持从图片 / ImageBitmap / canvas / 原始像素数据 创建。
 * - mipmap、环绕、过滤、flipY 等参数化。
 * - 上传走 GLState 缓存绑定，保持状态一致、减少冗余调用。
 */
import { GL } from './types';
import { GLState } from './GLState';

export type TextureSource =
    | ImageBitmap
    | HTMLImageElement
    | HTMLCanvasElement
    | HTMLVideoElement
    | ImageData
    | OffscreenCanvas;

export interface TextureOptions {
    /** 显式尺寸（纯数据 / render target 时必填；图片可省略） */
    width?: number;
    height?: number;
    /** 内部格式，默认 GL.RGBA8 */
    internalFormat?: number;
    /** 源格式，默认按 internalFormat 推断 */
    format?: number;
    /** 源数据类型，默认 GL.UNSIGNED_BYTE */
    type?: number;
    minFilter?: number;
    magFilter?: number;
    wrapS?: number;
    wrapT?: number;
    /** 生成 mipmap（默认 false；使用 mipmap 过滤时应开启） */
    generateMipmaps?: boolean;
    /** 图片/视频源翻转 Y 轴（贴图坐标习惯 0 在上时用） */
    flipY?: boolean;
    /** 原始像素数据（同时需 width/height） */
    data?: ArrayBufferView | null;
    /** 每行字节对齐，默认 4 */
    unpackAlignment?: number;
}

export class Texture {
    readonly gl: WebGL2RenderingContext;
    readonly texture: WebGLTexture;
    readonly target = GL.TEXTURE_2D;

    width = 0;
    height = 0;

    internalFormat: number;
    format: number;
    type: number;
    minFilter: number;
    magFilter: number;
    wrapS: number;
    wrapT: number;
    flipY: boolean;
    mipmaps: boolean;

    private disposed = false;

    constructor(gl: WebGL2RenderingContext, options?: TextureOptions) {
        this.gl = gl;
        const tex = gl.createTexture();
        if (!tex) throw new Error('WebGL: 无法创建 Texture');
        this.texture = tex;
        this.internalFormat = options?.internalFormat ?? GL.RGBA8;
        this.format = options?.format ?? inferFormat(this.internalFormat);
        this.type = options?.type ?? inferType(this.internalFormat);
        this.minFilter = options?.minFilter ?? (options?.generateMipmaps ? GL.LINEAR_MIPMAP_LINEAR : GL.LINEAR);
        this.magFilter = options?.magFilter ?? GL.LINEAR;
        this.wrapS = options?.wrapS ?? GL.CLAMP_TO_EDGE;
        this.wrapT = options?.wrapT ?? GL.CLAMP_TO_EDGE;
        this.flipY = options?.flipY ?? false;
        this.mipmaps = options?.generateMipmaps ?? false;
    }

    // ---- 创建入口 -----------------------------------------------------------

    /** 从图片元素创建（需已加载完成） */
    static fromImage(gl: WebGL2RenderingContext, image: TextureSource, options?: TextureOptions): Texture {
        const t = new Texture(gl, options);
        t.setImage(image, options);
        return t;
    }

    /** 从 URL 加载图片后创建 */
    static fromURL(gl: WebGL2RenderingContext, url: string, options?: TextureOptions): Promise<Texture> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(Texture.fromImage(gl, img, options));
            img.onerror = () => reject(new Error(`图片加载失败: ${url}`));
            img.src = url;
        });
    }

    /** 用原始像素数据创建（RGBA/RGB/单通道等） */
    static fromData(
        gl: WebGL2RenderingContext,
        width: number,
        height: number,
        data: ArrayBufferView | null,
        options?: TextureOptions,
    ): Texture {
        const t = new Texture(gl, { width, height, ...options });
        t.allocate(data);
        return t;
    }

    /** 创建空白纹理（render target 或之后 upload） */
    static empty(gl: WebGL2RenderingContext, width: number, height: number, options?: TextureOptions): Texture {
        return Texture.fromData(gl, width, height, null, options);
    }

    // ---- 上传 ---------------------------------------------------------------

    private prepareUpload(): void {
        const gl = this.gl;
        const st = GLState.for(gl);
        st.setActiveTextureUnit(0);
        st.bindTextureTarget(GL.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.flipY);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    }

    /** 为内部格式分配存储（不提供数据则创建空白） */
    allocate(data?: ArrayBufferView | null, width?: number, height?: number): void {
        const gl = this.gl;
        const w = width ?? this.width;
        const h = height ?? this.height;
        if (w <= 0 || h <= 0) throw new Error(`Texture 尺寸无效: ${w}x${h}`);
        this.width = w;
        this.height = h;
        this.prepareUpload();
        gl.texImage2D(
            GL.TEXTURE_2D,
            0,
            this.internalFormat,
            w,
            h,
            0,
            this.format,
            this.type,
            data ?? null,
        );
        this.applySamplerParams();
        this.endUpload();
    }

    /** 用图片 / 画布内容作为 level 0 */
    setImage(source: TextureSource, options?: TextureOptions): void {
        const gl = this.gl;
        if (options?.flipY !== undefined) this.flipY = options.flipY;
        const w = options?.width ?? (source as { width: number }).width;
        const h = options?.height ?? (source as { height: number }).height;
        this.width = w;
        this.height = h;
        this.prepareUpload();
        gl.texImage2D(GL.TEXTURE_2D, 0, this.internalFormat, this.format, this.type, source as TexImageSource);
        this.applySamplerParams();
        this.endUpload();
    }

    /** 更新某区域像素（GPU 上传路径，用于动态纹理） */
    setSubData(x: number, y: number, w: number, h: number, data: ArrayBufferView): void {
        const gl = this.gl;
        this.prepareUpload();
        gl.texSubImage2D(GL.TEXTURE_2D, 0, x, y, w, h, this.format, this.type, data);
    }

    private applySamplerParams(): void {
        const gl = this.gl;
        gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, this.minFilter);
        gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, this.magFilter);
        gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, this.wrapS);
        gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, this.wrapT);
    }

    private endUpload(): void {
        if (this.mipmaps) {
            const gl = this.gl;
            const st = GLState.for(gl);
            st.bindTextureTarget(GL.TEXTURE_2D, this.texture);
            gl.generateMipmap(GL.TEXTURE_2D);
        }
    }

    // ---- 绑定 ---------------------------------------------------------------

    /** 绑定到指定纹理单元 */
    bind(unit = 0): void {
        GLState.for(this.gl).bindTexture2D(this.texture, unit);
    }

    /**
     * 改变过滤参数后重建采样参数（不重新上传）。
     * minFilter 使用 mipmap 系列时请先确保数据非单层且已 generateMipmap。
     */
    updateSamplerParams(params: { minFilter?: number; magFilter?: number; wrapS?: number; wrapT?: number }): void {
        if (params.minFilter !== undefined) this.minFilter = params.minFilter;
        if (params.magFilter !== undefined) this.magFilter = params.magFilter;
        if (params.wrapS !== undefined) this.wrapS = params.wrapS;
        if (params.wrapT !== undefined) this.wrapT = params.wrapT;
        this.prepareUpload();
        this.applySamplerParams();
    }

    dispose(): void {
        if (!this.disposed) {
            this.disposed = true;
            this.gl.deleteTexture(this.texture);
        }
    }
}

// ---------------------------------------------------------------------------
// 内部格式 -> 源格式/类型推断
// ---------------------------------------------------------------------------

function inferFormat(internalFormat: number): number {
    switch (internalFormat) {
        case GL.R8:
        case GL.R16F:
        case GL.R32F:
            return GL.RED;
        case GL.RG8:
        case GL.RG16F:
        case GL.RG32F:
            return GL.RG;
        case GL.RGB8:
        case GL.SRGB8:
        case GL.RGB16F:
        case GL.RGB32F:
        case GL.R11F_G11F_B10F:
        case GL.RGB9_E5:
            return GL.RGB;
        case GL.RGB10_A2:
        case GL.RGBA8:
        case GL.SRGB8_ALPHA8:
        case GL.RGBA16F:
        case GL.RGBA32F:
            return GL.RGBA;
        case GL.DEPTH_COMPONENT16:
        case GL.DEPTH_COMPONENT24:
        case GL.DEPTH_COMPONENT32F:
            return GL.DEPTH_COMPONENT;
        case GL.DEPTH24_STENCIL8:
        case GL.DEPTH32F_STENCIL8:
            return GL.DEPTH_STENCIL;
        default:
            return GL.RGBA;
    }
}

function inferType(internalFormat: number): number {
    switch (internalFormat) {
        case GL.R16F:
        case GL.RG16F:
        case GL.RGB16F:
        case GL.RGBA16F:
        case GL.R11F_G11F_B10F:
        case GL.RGB9_E5:
        case GL.R32F:
        case GL.RG32F:
        case GL.RGB32F:
        case GL.RGBA32F:
        case GL.DEPTH_COMPONENT32F:
        case GL.DEPTH32F_STENCIL8:
            return GL.FLOAT;
        case GL.DEPTH_COMPONENT24:
        case GL.DEPTH24_STENCIL8:
            return GL.UNSIGNED_INT;
        case GL.DEPTH_COMPONENT16:
            return GL.UNSIGNED_SHORT;
        case GL.RGB10_A2:
            return GL.UNSIGNED_INT_2_10_10_10_REV;
        default:
            return GL.UNSIGNED_BYTE;
    }
}
