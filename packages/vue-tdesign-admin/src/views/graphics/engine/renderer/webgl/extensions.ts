import type { GLContext } from "./types"

/** 引擎会探测/使用的扩展名（按需扩充） */
export type ExtensionName =
    | 'OES_vertex_array_object'
    | 'ANGLE_instanced_arrays'
    | 'OES_element_index_uint'
    | 'OES_standard_derivatives'
    | 'OES_texture_float'
    | 'OES_texture_float_linear'
    | 'OES_texture_half_float'
    | 'OES_texture_half_float_linear'
    | 'WEBGL_depth_texture'
    | 'WEBGL_draw_buffers'
    | 'WEBGL_color_buffer_float'
    | 'EXT_color_buffer_float'
    | 'EXT_color_buffer_half_float'
    | 'EXT_sRGB'
    | 'EXT_blend_minmax'
    | 'EXT_frag_depth'
    | 'EXT_shader_texture_lod'
    | 'EXT_texture_filter_anisotropic'
    | 'EXT_disjoint_timer_query'
    | 'EXT_disjoint_timer_query_webgl2'
    | 'EXT_occlusion_query_boolean'
    | 'WEBGL_debug_renderer_info'
    | 'WEBGL_debug_shaders'
    | 'WEBGL_lose_context'
    | 'WEBGL_compressed_texture_s3tc'
    | 'WEBGL_compressed_texture_s3tc_srgb'
    | 'WEBGL_compressed_texture_etc'
    | 'WEBGL_compressed_texture_etc1'
    | 'WEBGL_compressed_texture_astc'
    | 'WEBGL_compressed_texture_pvrtc'
    | 'WEBGL_compressed_texture_atc'

/**
 * 扩展探测与缓存
 * getExtension 结果会被缓存；上下文丢失后扩展对象失效，需调用 reset() 重新探测。
 */
export class Extensions {
    protected gl: GLContext
    protected cache = new Map<string, any>()

    constructor(gl: GLContext) {
        this.gl = gl
    }
    /** 获取扩展对象（不支持返回 null），结果被缓存 */
    get<T = any>(name: ExtensionName): T | null {
        if (this.cache.has(name)) {
            return this.cache.get(name) as T | null
        }
        const extension = this.gl.getExtension(name) as T | null
        this.cache.set(name, extension)
        return extension
    }
    /** 是否支持该扩展 */
    has(name: ExtensionName) {
        return this.get(name) !== null
    }
    /** 上下文恢复后扩展对象失效，清空缓存以便下次重新探测 */
    reset() {
        this.cache.clear()
    }
}
