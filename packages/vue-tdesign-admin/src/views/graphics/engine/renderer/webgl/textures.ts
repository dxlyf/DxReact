import type { Context } from "./context"
import type { IResource } from "./resource"
import type {
    CubeMapFaces,
    TextureFormat,
    TextureInternalFormat,
    TextureMagFilter,
    TextureMinFilter,
    TextureTarget,
    TextureType,
    TextureWrap
} from "./types"

/** 纹理通用参数：过滤、环绕与像素存储状态 */
export type TextureOptions = {
    minFilter?: TextureMinFilter
    magFilter?: TextureMagFilter
    wrapS?: TextureWrap
    wrapT?: TextureWrap
    /** 仅立方体贴图有效 */
    wrapR?: TextureWrap
    /** 上传数据后是否自动生成 mipmap */
    generateMipmaps?: boolean
    /** UNPACK_FLIP_Y_WEBGL */
    flipY?: boolean
    /** UNPACK_PREMULTIPLY_ALPHA_WEBGL */
    premultiplyAlpha?: boolean
    /** UNPACK_ALIGNMENT，默认 4 */
    unpackAlignment?: number
}

/** 单次上传的可选参数，未指定时使用默认值 */
export type TextureUploadOptions = {
    /** mipmap 层级，默认 0 */
    level?: number
    /** 显存内部格式，默认 RGBA8 */
    internalFormat?: TextureInternalFormat
    /** 客户端像素格式，默认 RGBA */
    format?: TextureFormat
    /** 像素数据类型，默认 UNSIGNED_BYTE */
    type?: TextureType
    /** 覆盖构造时的 flipY */
    flipY?: boolean
    /** 覆盖构造时的 premultiplyAlpha */
    premultiplyAlpha?: boolean
}

/** 立方体贴图六个面的上传顺序：+X -X +Y -Y +Z -Z */
const CUBE_FACE_ORDER: CubeMapFaces[] = [
    'TEXTURE_CUBE_MAP_POSITIVE_X',
    'TEXTURE_CUBE_MAP_NEGATIVE_X',
    'TEXTURE_CUBE_MAP_POSITIVE_Y',
    'TEXTURE_CUBE_MAP_NEGATIVE_Y',
    'TEXTURE_CUBE_MAP_POSITIVE_Z',
    'TEXTURE_CUBE_MAP_NEGATIVE_Z'
]

/**
 * 纹理基类
 * 负责纹理对象的生命周期（创建/删除/上下文丢失重建）、过滤与环绕参数，
 * 以及绑定到指定纹理单元。具体上传逻辑由子类实现。
 */
export class Texture implements IResource {
    isDisposed = false
    ctx: Context
    target: TextureTarget
    texture: WebGLTexture | null = null
    /** 纹理宽度（像素） */
    width = 0
    /** 纹理高度（像素） */
    height = 0

    minFilter: TextureMinFilter = 'LINEAR'
    magFilter: TextureMagFilter = 'LINEAR'
    wrapS: TextureWrap = 'CLAMP_TO_EDGE'
    wrapT: TextureWrap = 'CLAMP_TO_EDGE'
    wrapR: TextureWrap = 'CLAMP_TO_EDGE'
    generateMipmaps = false
    flipY = false
    premultiplyAlpha = false
    unpackAlignment = 4

    /** 是否已经上传过数据，用于判断能否生成 mipmap */
    protected hasData = false
    /** 是否已生成过 mipmap，用于上下文恢复后重建（如立方体贴图需 6 面齐全后再生成） */
    protected mipmapGenerated = false

    constructor(ctx: Context, target: TextureTarget = 'TEXTURE_2D', options: TextureOptions = {}) {
        this.ctx = ctx
        this.target = target
        this.applyOptions(options)
        this.createTexture()
        this.ctx.on('contextlost', () => { this.deleteTexture() })
        this.ctx.on('contextrestored', () => {
            this.createTexture()
            // 显存中的像素数据同样丢失，交给子类重放上传
            this.reupload()
        })
        this.ctx.addDisposable(this)
    }

    /** 上下文恢复后重放此前的数据上传，由子类实现 */
    protected reupload() { }

    protected get gl() {
        return this.ctx.gl
    }

    protected applyOptions(options: TextureOptions) {
        if (options.minFilter !== undefined) { this.minFilter = options.minFilter }
        if (options.magFilter !== undefined) { this.magFilter = options.magFilter }
        if (options.wrapS !== undefined) { this.wrapS = options.wrapS }
        if (options.wrapT !== undefined) { this.wrapT = options.wrapT }
        if (options.wrapR !== undefined) { this.wrapR = options.wrapR }
        if (options.generateMipmaps !== undefined) { this.generateMipmaps = options.generateMipmaps }
        if (options.flipY !== undefined) { this.flipY = options.flipY }
        if (options.premultiplyAlpha !== undefined) { this.premultiplyAlpha = options.premultiplyAlpha }
        if (options.unpackAlignment !== undefined) { this.unpackAlignment = options.unpackAlignment }
    }

    createTexture() {
        this.deleteTexture()
        this.texture = this.gl.createTexture()
        this.hasData = false
        // 上下文恢复后重新写入过滤/环绕参数，避免退回默认值
        if (this.texture) {
            this.applyParameters()
        }
    }
    deleteTexture() {
        if (this.texture) {
            this.gl.deleteTexture(this.texture)
            this.texture = null
        }
    }
    /** 把当前的过滤与环绕参数写入显存纹理对象 */
    applyParameters() {
        const gl = this.gl
        this.bind()
        const t = gl[this.target]
        gl.texParameteri(t, gl.TEXTURE_MIN_FILTER, gl[this.minFilter])
        gl.texParameteri(t, gl.TEXTURE_MAG_FILTER, gl[this.magFilter])
        gl.texParameteri(t, gl.TEXTURE_WRAP_S, gl[this.wrapS])
        gl.texParameteri(t, gl.TEXTURE_WRAP_T, gl[this.wrapT])
        if (this.target === 'TEXTURE_CUBE_MAP') {
            gl.texParameteri(t, gl.TEXTURE_WRAP_R, gl[this.wrapR])
        }
    }
    setMinFilter(filter: TextureMinFilter) {
        if (this.minFilter === filter) { return }
        this.minFilter = filter
        const gl = this.gl
        this.bind()
        gl.texParameteri(gl[this.target], gl.TEXTURE_MIN_FILTER, gl[filter])
    }
    setMagFilter(filter: TextureMagFilter) {
        if (this.magFilter === filter) { return }
        this.magFilter = filter
        const gl = this.gl
        this.bind()
        gl.texParameteri(gl[this.target], gl.TEXTURE_MAG_FILTER, gl[filter])
    }
    setWrapS(wrap: TextureWrap) {
        if (this.wrapS === wrap) { return }
        this.wrapS = wrap
        const gl = this.gl
        this.bind()
        gl.texParameteri(gl[this.target], gl.TEXTURE_WRAP_S, gl[wrap])
    }
    setWrapT(wrap: TextureWrap) {
        if (this.wrapT === wrap) { return }
        this.wrapT = wrap
        const gl = this.gl
        this.bind()
        gl.texParameteri(gl[this.target], gl.TEXTURE_WRAP_T, gl[wrap])
    }
    setWrapR(wrap: TextureWrap) {
        if (this.wrapR === wrap) { return }
        this.wrapR = wrap
        const gl = this.gl
        this.bind()
        gl.texParameteri(gl[this.target], gl.TEXTURE_WRAP_R, gl[wrap])
    }
    /** 依据已上传的数据生成 mipmap 链 */
    updateMipmaps() {
        if (!this.texture || !this.hasData) { return }
        this.bind()
        this.gl.generateMipmap(this.gl[this.target])
        this.mipmapGenerated = true
    }
    /** 绑定到指定纹理单元（从 0 开始，内部会转换为 TEXTURE0 + unit） */
    bind(unit = 0) {
        this.ctx.activeTexture(unit)
        this.ctx.bindTexture(this.target, this.texture)
    }
    /** 解绑当前纹理单元上的纹理 */
    unbind(unit = 0) {
        this.ctx.activeTexture(unit)
        this.ctx.bindTexture(this.target, null)
    }
    /** 上传前设置像素存储状态 */
    protected applyUnpackState(options: { flipY?: boolean; premultiplyAlpha?: boolean }) {
        const gl = this.gl
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, (options.flipY ?? this.flipY) ? 1 : 0)
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, (options.premultiplyAlpha ?? this.premultiplyAlpha) ? 1 : 0)
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, this.unpackAlignment)
    }
    /** 依据 DOM 源自动记录纹理尺寸 */
    protected updateSizeFromSource(source: TexImageSource) {
        const s = source as any
        if (s.videoWidth !== undefined) {
            this.width = s.videoWidth
            this.height = s.videoHeight
        }
        else if (s.naturalWidth !== undefined) {
            this.width = s.naturalWidth
            this.height = s.naturalHeight
        }
        else {
            this.width = s.width ?? 0
            this.height = s.height ?? 0
        }
    }
    /** 上传完成后的收尾：按需生成 mipmap */
    protected finishUpload() {
        if (this.generateMipmaps) {
            this.updateMipmaps()
        }
    }
    dispose(): void {
        if (this.isDisposed) { return }
        this.isDisposed = true
        this.deleteTexture()
        this.ctx.resources.delete(this)
    }
}

/** 二维纹理：支持 DOM 源（图片/视频/画布）、空尺寸分配与原始像素数据 */
export class Texture2D extends Texture {
    /** 最近一次以 DOM 源上传的图片，上下文恢复时重放 */
    protected imageSource: TexImageSource | null = null
    protected imageOptions: TextureUploadOptions = {}
    /** 最近一次以尺寸分配的空纹理，上下文恢复时重放 */
    protected sizeAllocation: { width: number; height: number; options: TextureUploadOptions } | null = null

    constructor(ctx: Context, options: TextureOptions = {}) {
        super(ctx, 'TEXTURE_2D', options)
    }

    /** 上传图片 / 视频 / ImageBitmap / Canvas 等 DOM 源 */
    setImage(source: TexImageSource, options: TextureUploadOptions = {}) {
        this.imageSource = source
        this.imageOptions = options
        this.sizeAllocation = null
        this.uploadImage()
    }
    protected uploadImage() {
        const source = this.imageSource
        if (!source) { return }
        const gl = this.gl
        const options = this.imageOptions
        const level = options.level ?? 0
        const internalFormat = options.internalFormat ?? 'RGBA8'
        const format = options.format ?? 'RGBA'
        const type = options.type ?? 'UNSIGNED_BYTE'
        this.bind()
        this.applyUnpackState(options)
        gl.texImage2D(gl.TEXTURE_2D, level, gl[internalFormat], gl[format], gl[type], source)
        this.updateSizeFromSource(source)
        this.hasData = true
        this.finishUpload()
    }

    /** 按尺寸分配一张空纹理（可作为渲染目标的颜色附件） */
    setSize(width: number, height: number, options: TextureUploadOptions = {}) {
        this.sizeAllocation = { width, height, options }
        this.imageSource = null
        this.uploadSize()
    }
    protected uploadSize() {
        const allocation = this.sizeAllocation
        if (!allocation) { return }
        const gl = this.gl
        const options = allocation.options
        const level = options.level ?? 0
        const internalFormat = options.internalFormat ?? 'RGBA8'
        const format = options.format ?? 'RGBA'
        const type = options.type ?? 'UNSIGNED_BYTE'
        this.bind()
        this.applyUnpackState(options)
        gl.texImage2D(gl.TEXTURE_2D, level, gl[internalFormat], allocation.width, allocation.height, 0, gl[format], gl[type], null)
        this.width = allocation.width
        this.height = allocation.height
        this.hasData = true
        this.finishUpload()
    }

    protected reupload() {
        if (this.imageSource) {
            this.uploadImage()
        } else {
            this.uploadSize()
        }
    }
}

/** 数据纹理：直接从 ArrayBufferView 上传像素数据 */
export class DataTexture extends Texture2D {
    /** 最近一次上传的像素数据，上下文恢复时重放 */
    protected pixelData: ArrayBufferView | null = null
    protected pixelWidth = 0
    protected pixelHeight = 0
    protected pixelOptions: TextureUploadOptions = {}

    constructor(ctx: Context, data: ArrayBufferView | null, width: number, height: number, options: TextureUploadOptions & TextureOptions = {}) {
        super(ctx, options)
        this.setData(data, width, height, options)
    }

    /** 上传/更新像素数据，data 为 null 时按尺寸分配空纹理 */
    setData(data: ArrayBufferView | null, width: number, height: number, options: TextureUploadOptions = {}) {
        this.pixelData = data
        this.pixelWidth = width
        this.pixelHeight = height
        this.pixelOptions = options
        this.uploadPixelData()
    }
    protected uploadPixelData() {
        const gl = this.gl
        const options = this.pixelOptions
        const level = options.level ?? 0
        const internalFormat = options.internalFormat ?? 'RGBA8'
        const format = options.format ?? 'RGBA'
        const type = options.type ?? 'UNSIGNED_BYTE'
        this.bind()
        this.applyUnpackState(options)
        gl.texImage2D(gl.TEXTURE_2D, level, gl[internalFormat], this.pixelWidth, this.pixelHeight, 0, gl[format], gl[type], this.pixelData)
        this.width = this.pixelWidth
        this.height = this.pixelHeight
        this.hasData = true
        this.finishUpload()
    }

    protected reupload() {
        this.uploadPixelData()
    }
}

/** 立方体贴图：6 个面可分别上传 DOM 源或像素数据 */
export class TextureCubeMap extends Texture {
    /** 每个面最近一次的上传参数，上下文恢复时重放 */
    protected faceState = new Map<CubeMapFaces, { source?: TexImageSource; data?: ArrayBufferView | null; size?: number; options: TextureUploadOptions }>()

    constructor(ctx: Context, options: TextureOptions = {}) {
        super(ctx, 'TEXTURE_CUBE_MAP', options)
    }

    /** 上传单张立方体面 */
    setFace(face: CubeMapFaces, source: TexImageSource, options: TextureUploadOptions = {}) {
        this.faceState.set(face, { source, options })
        this.uploadFaceSource(face)
    }
    protected uploadFaceSource(face: CubeMapFaces) {
        const state = this.faceState.get(face)
        const source = state && state.source
        if (!source) { return }
        const gl = this.gl
        const options = state.options
        const level = options.level ?? 0
        const internalFormat = options.internalFormat ?? 'RGBA8'
        const format = options.format ?? 'RGBA'
        const type = options.type ?? 'UNSIGNED_BYTE'
        this.bind()
        this.applyUnpackState(options)
        gl.texImage2D(gl[face], level, gl[internalFormat], gl[format], gl[type], source)
        this.updateSizeFromSource(source)
        this.hasData = true
        this.finishUpload()
    }

    /** 按 +X -X +Y -Y +Z -Z 的顺序依次上传 6 个面 */
    setFaces(sources: TexImageSource[], options: TextureUploadOptions = {}) {
        CUBE_FACE_ORDER.forEach((face, i) => {
            const source = sources[i]
            if (source) {
                this.setFace(face, source, options)
            }
        })
    }

    /** 上传单张面的像素数据，data 为 null 时按尺寸分配 */
    setFaceData(face: CubeMapFaces, data: ArrayBufferView | null, size: number, options: TextureUploadOptions = {}) {
        this.faceState.set(face, { data, size, options })
        this.uploadFaceData(face)
    }
    protected uploadFaceData(face: CubeMapFaces) {
        const state = this.faceState.get(face)
        if (!state) { return }
        const gl = this.gl
        const options = state.options
        const level = options.level ?? 0
        const internalFormat = options.internalFormat ?? 'RGBA8'
        const format = options.format ?? 'RGBA'
        const type = options.type ?? 'UNSIGNED_BYTE'
        const size = state.size ?? this.width
        this.bind()
        this.applyUnpackState(options)
        gl.texImage2D(gl[face], level, gl[internalFormat], size, size, 0, gl[format], gl[type], state.data ?? null)
        this.width = size
        this.height = size
        this.hasData = true
        this.finishUpload()
    }

    protected reupload() {
        CUBE_FACE_ORDER.forEach(face => {
            const state = this.faceState.get(face)
            if (!state) { return }
            if (state.source) {
                this.uploadFaceSource(face)
            } else {
                this.uploadFaceData(face)
            }
        })
        // 6 面全部重放完成后，若此前生成过 mipmap 需要重建（单面上传时生成会因不完整而失败）
        if (this.mipmapGenerated) { this.updateMipmaps() }
    }
}

export { CUBE_FACE_ORDER }
