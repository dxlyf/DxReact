import type { GLContext, GLVersion } from "./types"
import type { ExtensionName } from "./extensions"
import type { Extensions } from "./extensions"

/** 引擎关心的能力特性名 */
export type FeatureName =
    /** 顶点数组对象（WebGL2 原生 / OES_vertex_array_object） */
    | 'VERTEX_ARRAY_OBJECT'
    /** 实例化绘制（WebGL2 原生 / ANGLE_instanced_arrays） */
    | 'INSTANCED_ARRAYS'
    /** Uniform 缓冲对象（仅 WebGL2） */
    | 'UNIFORM_BUFFER_OBJECT'
    /** 变换反馈（仅 WebGL2） */
    | 'TRANSFORM_FEEDBACK'
    /** 遮挡/计时查询（WebGL2 原生 / EXT_disjoint_timer_query 等） */
    | 'QUERY'
    /** 采样器对象（仅 WebGL2） */
    | 'SAMPLER_OBJECT'
    /** 多渲染目标（WebGL2 原生 / WEBGL_draw_buffers） */
    | 'MULTIPLE_RENDER_TARGETS'
    /** 深度纹理（WebGL2 原生 / WEBGL_depth_texture） */
    | 'DEPTH_TEXTURE'
    /** 浮点纹理（WebGL2 原生 / OES_texture_float） */
    | 'FLOAT_TEXTURE'
    /** 半浮点纹理（WebGL2 原生 / OES_texture_half_float） */
    | 'HALF_FLOAT_TEXTURE'
    /** 标准导数 dFdx/dFdy（WebGL2 原生 / OES_standard_derivatives） */
    | 'STANDARD_DERIVATIVES'
    /** 32 位索引（WebGL2 原生 / OES_element_index_uint） */
    | 'ELEMENT_INDEX_UINT'
    /** 浮点颜色缓冲渲染目标 */
    | 'COLOR_BUFFER_FLOAT'
    /** 三维纹理（仅 WebGL2） */
    | 'TEXTURE_3D'
    /** 纹理数组（仅 WebGL2） */
    | 'TEXTURE_ARRAY'
    /** GPU 计时查询（EXT_disjoint_timer_query(_webgl2)） */
    | 'TIMER_QUERY'
    /** 各向异性过滤（EXT_texture_filter_anisotropic） */
    | 'ANISOTROPIC_FILTERING'

/** 特性开关表 */
export type FeatureFlags = Record<FeatureName, boolean>

/** 特性支持条件：达到 core 版本为原生支持，否则（WebGL1）需命中 extensions 中任一扩展 */
type FeatureRequirement = {
    core?: GLVersion
    extensions?: ExtensionName[]
}

const VERSION_RANK: Record<GLVersion, number> = { webgl1: 1, webgl2: 2 }

/** 各特性在 WebGL1/WebGL2 下的支持来源 */
const REQUIREMENTS: Record<FeatureName, FeatureRequirement> = {
    VERTEX_ARRAY_OBJECT: { core: 'webgl2', extensions: ['OES_vertex_array_object'] },
    INSTANCED_ARRAYS: { core: 'webgl2', extensions: ['ANGLE_instanced_arrays'] },
    UNIFORM_BUFFER_OBJECT: { core: 'webgl2' },
    TRANSFORM_FEEDBACK: { core: 'webgl2' },
    QUERY: { core: 'webgl2', extensions: ['EXT_disjoint_timer_query', 'EXT_occlusion_query_boolean'] },
    SAMPLER_OBJECT: { core: 'webgl2' },
    MULTIPLE_RENDER_TARGETS: { core: 'webgl2', extensions: ['WEBGL_draw_buffers'] },
    DEPTH_TEXTURE: { core: 'webgl2', extensions: ['WEBGL_depth_texture'] },
    FLOAT_TEXTURE: { core: 'webgl2', extensions: ['OES_texture_float'] },
    HALF_FLOAT_TEXTURE: { core: 'webgl2', extensions: ['OES_texture_half_float'] },
    STANDARD_DERIVATIVES: { core: 'webgl2', extensions: ['OES_standard_derivatives'] },
    ELEMENT_INDEX_UINT: { core: 'webgl2', extensions: ['OES_element_index_uint'] },
    COLOR_BUFFER_FLOAT: { extensions: ['WEBGL_color_buffer_float', 'EXT_color_buffer_float'] },
    TEXTURE_3D: { core: 'webgl2' },
    TEXTURE_ARRAY: { core: 'webgl2' },
    TIMER_QUERY: { extensions: ['EXT_disjoint_timer_query_webgl2', 'EXT_disjoint_timer_query'] },
    ANISOTROPIC_FILTERING: { extensions: ['EXT_texture_filter_anisotropic'] },
}

/** 由上下文实例判定版本：存在 createVertexArray 即 WebGL2 */
export function detectVersion(gl: GLContext): GLVersion {
    return typeof (gl as WebGL2RenderingContext).createVertexArray === 'function' ? 'webgl2' : 'webgl1'
}

/** 依据版本与已探测扩展，生成全部特性开关 */
export function getFeatures(version: GLVersion, extensions: Extensions): FeatureFlags {
    const flags = {} as FeatureFlags
    for (const name of Object.keys(REQUIREMENTS) as FeatureName[]) {
        flags[name] = isFeatureSupported(name, version, extensions)
    }
    return flags
}

function isFeatureSupported(name: FeatureName, version: GLVersion, extensions: Extensions) {
    const requirement = REQUIREMENTS[name]
    if (requirement.core && VERSION_RANK[version] >= VERSION_RANK[requirement.core]) {
        return true
    }
    if (requirement.extensions) {
        return requirement.extensions.some(extension => extensions.has(extension))
    }
    return false
}
