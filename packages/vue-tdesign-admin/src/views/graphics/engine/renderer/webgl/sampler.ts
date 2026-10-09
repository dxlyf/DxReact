import type { Context } from "./context"
import type { IResource } from "./resource"
import type { ComparisonFunc, TextureMagFilter, TextureMinFilter, TextureWrap } from "./types"

/** 采样器整数参数名（对应 gl.samplerParameteri 的 pname） */
export type SamplerParameterName = 'TEXTURE_MIN_FILTER'
    | 'TEXTURE_MAG_FILTER'
    | 'TEXTURE_WRAP_S'
    | 'TEXTURE_WRAP_T'
    | 'TEXTURE_WRAP_R'
    | 'TEXTURE_COMPARE_MODE'
    | 'TEXTURE_COMPARE_FUNC'

/** 采样器初始化参数，只需写关心的字段 */
export type SamplerOptions = {
    minFilter?: TextureMinFilter
    magFilter?: TextureMagFilter
    wrapS?: TextureWrap
    wrapT?: TextureWrap
    /** 环绕方式（仅立方体贴图等使用 3D 采样的场景有效） */
    wrapR?: TextureWrap
    /** 比较函数，配合 compareMode 用于阴影采样 */
    compareFunc?: ComparisonFunc
    /** 开启后作为阴影比较采样器（TEXTURE_COMPARE_MODE = COMPARE_REF_TO_TEXTURE） */
    compareMode?: boolean
}

/**
 * 采样器对象（Sampler，WebGL2）
 * 把「纹理采样参数」从纹理对象里独立出来，多个纹理可共享同一组采样参数。
 * 通过 bind(unit) 绑定到某个纹理单元，该单元上采样的纹理即按本采样器的参数执行。
 * - 参数会记录下来，上下文恢复后自动重放
 */
export class Sampler implements IResource {
    static uid = 0

    isDisposed = false
    readonly uid: number
    ctx: Context
    sampler: WebGLSampler | null = null
    /** 已设置的采样参数，上下文恢复后重放 */
    params = new Map<SamplerParameterName, number>()

    constructor(ctx: Context, options: SamplerOptions = {}) {
        this.ctx = ctx
        this.uid = Sampler.uid++
        this.createSampler()
        this.ctx.on('contextlost', () => { this.deleteSampler() })
        this.ctx.on('contextrestored', () => {
            this.createSampler()
            // 采样器参数随上下文丢失，需重新设置
            this.applyParams()
        })
        this.ctx.addDisposable(this)
        this.applyOptions(options)
    }

    protected get gl() {
        return this.ctx.gl
    }

    createSampler() {
        if (this.sampler !== null) { return }
        this.sampler = this.gl.createSampler()
    }
    deleteSampler() {
        if (this.sampler === null) { return }
        this.gl.deleteSampler(this.sampler)
        this.sampler = null
    }
    /** 绑定到指定纹理单元 */
    bind(unit: number) {
        this.ctx.bindSampler(unit, this.sampler)
    }
    /** 解绑指定纹理单元的采样器 */
    unbind(unit: number) {
        this.ctx.bindSampler(unit, null)
    }
    /** 设置单个整数采样参数（param 为 GL 枚举值） */
    setParameter(pname: SamplerParameterName, param: number) {
        this.params.set(pname, param)
        const gl = this.gl
        gl.samplerParameteri(this.sampler, gl[pname], param)
    }
    setMinFilter(filter: TextureMinFilter) {
        this.setParameter('TEXTURE_MIN_FILTER', this.gl[filter])
    }
    setMagFilter(filter: TextureMagFilter) {
        this.setParameter('TEXTURE_MAG_FILTER', this.gl[filter])
    }
    setWrapS(wrap: TextureWrap) {
        this.setParameter('TEXTURE_WRAP_S', this.gl[wrap])
    }
    setWrapT(wrap: TextureWrap) {
        this.setParameter('TEXTURE_WRAP_T', this.gl[wrap])
    }
    setWrapR(wrap: TextureWrap) {
        this.setParameter('TEXTURE_WRAP_R', this.gl[wrap])
    }
    setCompareFunc(func: ComparisonFunc) {
        this.setParameter('TEXTURE_COMPARE_FUNC', this.gl[func])
    }
    setCompareMode(enabled: boolean) {
        this.setParameter('TEXTURE_COMPARE_MODE', enabled ? this.gl.COMPARE_REF_TO_TEXTURE : this.gl.NONE)
    }
    protected applyOptions(options: SamplerOptions) {
        if (options.minFilter !== undefined) { this.setMinFilter(options.minFilter) }
        if (options.magFilter !== undefined) { this.setMagFilter(options.magFilter) }
        if (options.wrapS !== undefined) { this.setWrapS(options.wrapS) }
        if (options.wrapT !== undefined) { this.setWrapT(options.wrapT) }
        if (options.wrapR !== undefined) { this.setWrapR(options.wrapR) }
        if (options.compareFunc !== undefined) { this.setCompareFunc(options.compareFunc) }
        if (options.compareMode !== undefined) { this.setCompareMode(options.compareMode) }
    }
    /** 重放全部采样参数 */
    protected applyParams() {
        const gl = this.gl
        this.params.forEach((value, pname) => {
            gl.samplerParameteri(this.sampler, gl[pname], value)
        })
    }
    dispose(): void {
        if (this.isDisposed) { return }
        this.isDisposed = true
        this.params.clear()
        this.deleteSampler()
        this.ctx.resources.delete(this)
    }
}
