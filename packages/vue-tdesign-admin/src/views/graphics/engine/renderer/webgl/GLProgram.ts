import {Option} from '@dxyl/math2'
// ============================================
// 1. std140 对齐规则定义
// ============================================

/**
 * std140 布局规则：
 * 
 * 1. 标量（float, int, uint, bool）：按 4 字节对齐
 * 2. 向量：
 *    - vec2/ivec2/uvec2/bvec2：按 8 字节对齐
 *    - vec3/ivec3/uvec3/bvec3：按 16 字节对齐（⚠️ 重要：不是 12 字节！）
 *    - vec4/ivec4/uvec4/bvec4：按 16 字节对齐
 * 3. 矩阵：
 *    - 列优先存储，每列按向量规则对齐
 *    - mat2：2 列，每列 vec2（8字节对齐），整体 16 字节
 *    - mat3：3 列，每列 vec3（16字节对齐），整体 48 字节
 *    - mat4：4 列，每列 vec4（16字节对齐），整体 64 字节
 * 4. 结构体：
 *    - 整体对齐 = 最大成员的对齐值
 *    - 大小会补齐到对齐值的倍数
 * 5. 数组：
 *    - 元素按 16 字节对齐（vec3 数组每个元素也是 16 字节对齐）
 *    - 整体大小 = 元素大小 × 元素数量（已对齐）
 * 6. Uniform Block：
 *    - 整体对齐 = 最大成员的对齐值
 *    - 总大小会补齐到对齐值的倍数（通常为 16 的倍数）
 */

// ============================================
// 2. std140 对齐值映射
// ============================================

/**
 * 获取 std140 布局下类型的对齐值（alignment）
 * 对齐值 = 该类型在内存中必须起始于的字节偏移倍数
 */
export const GL_STD140_ALIGNMENT: Record<string, number> = {
    // ---------- 标量 ----------
    'float': 4,
    'int': 4,
    'uint': 4,
    'bool': 4,
    'double': 8,      // 需要扩展支持

    // ---------- 浮点向量 ----------
    'vec2': 8,
    'vec3': 16,       // ⚠️ 关键：vec3 对齐到 16 字节
    'vec4': 16,

    // ---------- 整数向量 ----------
    'ivec2': 8,
    'ivec3': 16,      // ⚠️ 关键：ivec3 对齐到 16 字节
    'ivec4': 16,

    // ---------- 无符号整数向量 ----------
    'uvec2': 8,
    'uvec3': 16,      // ⚠️ 关键：uvec3 对齐到 16 字节
    'uvec4': 16,

    // ---------- 布尔向量 ----------
    'bvec2': 8,
    'bvec3': 16,      // ⚠️ 关键：bvec3 对齐到 16 字节
    'bvec4': 16,

    // ---------- 双精度向量 ----------
    'dvec2': 16,
    'dvec3': 32,
    'dvec4': 32,

    // ---------- 矩阵（对齐 = 列向量的对齐值） ----------
    // mat2: 2列 × vec2（8字节对齐）→ 对齐 8
    'mat2': 8,
    // mat3: 3列 × vec3（16字节对齐）→ 对齐 16
    'mat3': 16,
    // mat4: 4列 × vec4（16字节对齐）→ 对齐 16
    'mat4': 16,

    // ---------- 非方阵矩阵 ----------
    // mat2x3: 2列 × vec3（16字节对齐）→ 对齐 16
    'mat2x3': 16,
    // mat2x4: 2列 × vec4（16字节对齐）→ 对齐 16
    'mat2x4': 16,
    // mat3x2: 3列 × vec2（8字节对齐）→ 对齐 8
    'mat3x2': 8,
    // mat3x4: 3列 × vec4（16字节对齐）→ 对齐 16
    'mat3x4': 16,
    // mat4x2: 4列 × vec2（8字节对齐）→ 对齐 8
    'mat4x2': 8,
    // mat4x3: 4列 × vec3（16字节对齐）→ 对齐 16
    'mat4x3': 16,

    // ---------- 双精度矩阵 ----------
    'dmat2': 16,
    'dmat3': 32,
    'dmat4': 32,
    'dmat2x3': 32,
    'dmat2x4': 32,
    'dmat3x2': 16,
    'dmat3x4': 32,
    'dmat4x2': 16,
    'dmat4x3': 32,

    // ---------- 采样器/图像（指针大小，通常 4 字节） ----------
    'sampler2D': 4,
    'sampler3D': 4,
    'samplerCube': 4,
    'sampler2DArray': 4,
    'samplerCubeArray': 4,
    'sampler2DShadow': 4,
    'samplerCubeShadow': 4,
    'sampler2DArrayShadow': 4,
    'sampler2DMS': 4,
    'sampler2DMSArray': 4,
    'isampler2D': 4,
    'isampler3D': 4,
    'isamplerCube': 4,
    'isampler2DArray': 4,
    'isamplerCubeArray': 4,
    'isampler2DMS': 4,
    'isampler2DMSArray': 4,
    'usampler2D': 4,
    'usampler3D': 4,
    'usamplerCube': 4,
    'usampler2DArray': 4,
    'usamplerCubeArray': 4,
    'usampler2DMS': 4,
    'usampler2DMSArray': 4,
    'image2D': 4,
    'image3D': 4,
    'imageCube': 4,
    'image2DArray': 4,
    'imageCubeArray': 4,
    'image2DMS': 4,
    'image2DMSArray': 4,

    // ---------- 原子类型 ----------
    'atomic_uint': 4,
}

// ============================================
// 3. std140 类型大小映射
// ============================================

/**
 * 获取 std140 布局下类型的大小（size）
 * 注意：这里返回的是逻辑大小，实际内存大小需要对齐到对齐值的倍数
 */
export const GL_STD140_SIZE: Record<string, number> = {
    // ---------- 标量 ----------
    'float': 4,
    'int': 4,
    'uint': 4,
    'bool': 4,
    'double': 8,

    // ---------- 向量 ----------
    'vec2': 8, 'vec3': 12, 'vec4': 16,
    'ivec2': 8, 'ivec3': 12, 'ivec4': 16,
    'uvec2': 8, 'uvec3': 12, 'uvec4': 16,
    'bvec2': 8, 'bvec3': 12, 'bvec4': 16,
    'dvec2': 16, 'dvec3': 24, 'dvec4': 32,

    // ---------- 矩阵（实际内存大小） ----------
    // mat2: 2列 × vec2(8字节) = 16
    'mat2': 16,
    // mat3: 3列 × vec3(12字节) = 36 → 但每列对齐到16，所以实际是 48
    'mat3': 48,
    // mat4: 4列 × vec4(16字节) = 64
    'mat4': 64,

    // ---------- 非方阵矩阵 ----------
    'mat2x3': 32,  // 2列 × vec3(16对齐) = 32（⚠️ 注意：不是24！）
    'mat2x4': 32,  // 2列 × vec4(16) = 32
    'mat3x2': 24,  // 3列 × vec2(8) = 24
    'mat3x4': 48,  // 3列 × vec4(16) = 48
    'mat4x2': 32,  // 4列 × vec2(8) = 32
    'mat4x3': 64,  // 4列 × vec3(16对齐) = 64（⚠️ 不是48！）

    // ---------- 双精度矩阵 ----------
    'dmat2': 32,
    'dmat3': 144,  // 3列 × dvec3(24) → 每列对齐到32 → 96? 实际复杂
    'dmat4': 128,

    // ---------- 采样器/图像 ----------
    'sampler2D': 4,
    'sampler3D': 4,
    'samplerCube': 4,
    // ... 所有 sampler/image 都是 4 字节
}

// ============================================
// 4. std140 完整对齐规则类
// ============================================

export interface GL_STD140Field {
    name: string
    type: string
    offset: number
    alignment: number
    size: number
    isArray?: boolean
    arraySize?: number
    isStruct?: boolean
    fields?: GL_STD140Field[]  // 嵌套结构体
}

/**
 * std140 对齐计算器
 */
export class STD140Calculator {
    /**
     * 获取类型的对齐值
     */
    static getAlignment(type: string): number {
        return GL_STD140_ALIGNMENT[type] || 4  // 默认 4 字节对齐
    }

    /**
     * 获取类型的大小（逻辑大小）
     */
    static getSize(type: string): number {
        return GL_STD140_SIZE[type] || 4
    }

    /**
     * 计算结构体的内存布局
     */
    static calculateStructLayout(fields: Array<{ name: string, type: string, arraySize?: number }>): {
        fields: GL_STD140Field[]
        totalSize: number
        alignment: number
    } {
        let currentOffset = 0
        let maxAlignment = 0
        const resultFields: GL_STD140Field[] = []

        for (const field of fields) {
            let alignment = this.getAlignment(field.type)
            let size = this.getSize(field.type)

            // 处理数组
            if (field.arraySize && field.arraySize > 0) {
                // 数组元素对齐到 16 字节（std140 规则）
                const elementAlignment = Math.max(alignment, 16)
                const elementSize = this.alignSize(size, elementAlignment)
                size = elementSize * field.arraySize
                alignment = elementAlignment
            }

            // 对齐当前偏移
            currentOffset = this.alignOffset(currentOffset, alignment)

            resultFields.push({
                name: field.name,
                type: field.type,
                offset: currentOffset,
                alignment: alignment,
                size: size,
                isArray: !!field.arraySize,
                arraySize: field.arraySize,
            })

            currentOffset += size
            maxAlignment = Math.max(maxAlignment, alignment)
        }

        // 结构体整体对齐 = 最大成员对齐值
        const structAlignment = maxAlignment
        // 结构体总大小 = 对齐到对齐值的倍数
        const totalSize = this.alignOffset(currentOffset, structAlignment)

        return {
            fields: resultFields,
            totalSize: totalSize,
            alignment: structAlignment,
        }
    }

    /**
     * 将偏移量对齐到指定的对齐值
     */
    static alignOffset(offset: number, alignment: number): number {
        return Math.ceil(offset / alignment) * alignment
    }

    /**
     * 将大小对齐到指定的对齐值
     */
    static alignSize(size: number, alignment: number): number {
        return Math.ceil(size / alignment) * alignment
    }

    /**
     * 计算 Uniform Block 的总大小
     */
    static calculateUniformBlockSize(fields: Array<{ name: string, type: string, arraySize?: number }>): {
        totalSize: number
        alignment: number
        fields: GL_STD140Field[]
    } {
        return this.calculateStructLayout(fields)
    }
}
// ============================================
// 1. 基础标量类型（Scalar Types）
// ============================================
export type GLSLScalar =
    | 'void'
    | 'bool'
    | 'int'
    | 'uint'
    | 'float'
    | 'double'

// ============================================
// 2. 向量类型（Vector Types）
// ============================================
export type GLSLFloatVector = 'vec2' | 'vec3' | 'vec4'
export type GLSLIntVector = 'ivec2' | 'ivec3' | 'ivec4'
export type GLSLUintVector = 'uvec2' | 'uvec3' | 'uvec4'
export type GLSLBoolVector = 'bvec2' | 'bvec3' | 'bvec4'
export type GLSLDoubleVector = 'dvec2' | 'dvec3' | 'dvec4'

export type GLSLVector =
    | GLSLFloatVector
    | GLSLIntVector
    | GLSLUintVector
    | GLSLBoolVector
    | GLSLDoubleVector

// ============================================
// 3. 矩阵类型（Matrix Types）
// ============================================
export type GLSLFloatMatrix =
    | 'mat2'
    | 'mat3'
    | 'mat4'
    | 'mat2x3'
    | 'mat2x4'
    | 'mat3x2'
    | 'mat3x4'
    | 'mat4x2'
    | 'mat4x3'

export type GLSLDoubleMatrix =
    | 'dmat2'
    | 'dmat3'
    | 'dmat4'
    | 'dmat2x3'
    | 'dmat2x4'
    | 'dmat3x2'
    | 'dmat3x4'
    | 'dmat4x2'
    | 'dmat4x3'

export type GLSLMatrix = GLSLFloatMatrix | GLSLDoubleMatrix

// ============================================
// 4. 纹理采样器类型（Sampler Types）
// ============================================
export type GLSLStandardSampler =
    | 'sampler2D'
    | 'sampler3D'
    | 'samplerCube'
    | 'sampler2DArray'
    | 'samplerCubeArray'

export type GLSLShadowSampler =
    | 'sampler2DShadow'
    | 'samplerCubeShadow'
    | 'sampler2DArrayShadow'

export type GLSLMSSampler =
    | 'sampler2DMS'
    | 'sampler2DMSArray'

export type GLSLIntSampler =
    | 'isampler2D'
    | 'isampler3D'
    | 'isamplerCube'
    | 'isampler2DArray'
    | 'isamplerCubeArray'
    | 'isampler2DMS'
    | 'isampler2DMSArray'

export type GLSLUintSampler =
    | 'usampler2D'
    | 'usampler3D'
    | 'usamplerCube'
    | 'usampler2DArray'
    | 'usamplerCubeArray'
    | 'usampler2DMS'
    | 'usampler2DMSArray'

export type GLSLSampler =
    | GLSLStandardSampler
    | GLSLShadowSampler
    | GLSLMSSampler
    | GLSLIntSampler
    | GLSLUintSampler

// ============================================
// 5. 图像类型（Image Types）
// ============================================
export type GLSLStandardImage =
    | 'image2D'
    | 'image3D'
    | 'imageCube'
    | 'image2DArray'
    | 'imageCubeArray'
    | 'image2DMS'
    | 'image2DMSArray'

export type GLSLIntImage =
    | 'iimage2D'
    | 'iimage3D'
    | 'iimageCube'
    | 'iimage2DArray'
    | 'iimageCubeArray'
    | 'iimage2DMS'
    | 'iimage2DMSArray'

export type GLSLUintImage =
    | 'uimage2D'
    | 'uimage3D'
    | 'uimageCube'
    | 'uimage2DArray'
    | 'uimageCubeArray'
    | 'uimage2DMS'
    | 'uimage2DMSArray'

export type GLSLImage =
    | GLSLStandardImage
    | GLSLIntImage
    | GLSLUintImage

// ============================================
// 6. 原子类型（Atomic Types）
// ============================================
export type GLSLAtomic = 'atomic_uint'

// ============================================
// 7. 所有原始字符串类型的联合（用于 Record 的键）
// ============================================
export type GLSLPrimitiveType =
    | GLSLScalar
    | GLSLVector
    | GLSLMatrix
    | GLSLSampler
    | GLSLImage
    | GLSLAtomic

// ============================================
// 8. 完整类型（包括自定义类型，但不能用于 Record）
// ============================================
export type GLSLType = GLSLPrimitiveType | 'struct' | 'array'

// ============================================
// 9. 精度限定符
// ============================================
export type GLSLPrecision = 'highp' | 'mediump' | 'lowp'

// ============================================
// 10. 存储限定符
// ============================================
export type GLSLStorage =
    | 'const'
    | 'in'
    | 'out'
    | 'inout'
    | 'uniform'
    | 'buffer'
    | 'shared'
    | 'coherent'
    | 'volatile'
    | 'restrict'

// ============================================
// 11. 布局限定符
// ============================================
export type GLSLLayout =
    | 'std140'
    | 'std430'
    | 'shared'
    | 'packed'
    | 'row_major'
    | 'column_major'

// ============================================
// 12. 插值限定符
// ============================================
export type GLSLInterpolation =
    | 'flat'
    | 'noperspective'
    | 'centroid'
    | 'sample'
    | 'smooth'

// ============================================
// 13. 结构体定义
// ============================================
export interface GLSLStruct {
    name: string
    fields: {
        name: string
        type: GLSLType | string
        precision?: GLSLPrecision
        layout?: GLSLLayout
        arraySize?: number | 'dynamic'
    }[]
    layout?: GLSLLayout
    binding?: number
}

// ============================================
// 14. Uniform Block 定义
// ============================================
export interface GLSLUniformBlock {
    name: string
    layout: GLSLLayout
    binding: number
    members: {
        name: string
        type: GLSLType | string
        arraySize?: number
        precision?: GLSLPrecision
    }[]
}

// ============================================
// 15. 函数参数类型
// ============================================
export interface GLSLFunctionParameter {
    name: string
    type: GLSLType | string
    storage: 'in' | 'out' | 'inout'
    precision?: GLSLPrecision
}

// ============================================
// 16. 着色器接口定义
// ============================================
export interface GLSLShaderInterface {
    attributes: {
        name: string
        type: GLSLVector | 'float' | 'int' | 'uint'
        location: number
        precision?: GLSLPrecision
    }[]
    uniforms: {
        name: string
        type: GLSLType | string
        precision?: GLSLPrecision
        binding?: number
    }[]
    uniformBlocks: GLSLUniformBlock[]
    outputs: {
        name: string
        type: GLSLType | string
        location?: number
        interpolation?: GLSLInterpolation
    }[]
    structs: GLSLStruct[]
}

// ============================================
// 17. 内置变量类型
// ============================================
export type GLSLVertexBuiltIn =
    | 'gl_Position'
    | 'gl_PointSize'
    | 'gl_VertexID'
    | 'gl_InstanceID'
    | 'gl_DrawID'
    | 'gl_BaseVertex'
    | 'gl_BaseInstance'

export type GLSLFragmentBuiltIn =
    | 'gl_FragCoord'
    | 'gl_FrontFacing'
    | 'gl_PointCoord'
    | 'gl_FragDepth'
    | 'gl_SampleID'
    | 'gl_SamplePosition'
    | 'gl_SampleMask'
    | 'gl_HelperInvocation'
    | 'gl_LastFragData'

export type GLSLComputeBuiltIn =
    | 'gl_NumWorkGroups'
    | 'gl_WorkGroupID'
    | 'gl_LocalInvocationID'
    | 'gl_GlobalInvocationID'
    | 'gl_LocalInvocationIndex'
    | 'gl_WorkGroupSize'

// ============================================
// 18. 类型工具函数
// ============================================
export function isVectorType(type: string): type is GLSLVector {
    return /^(vec|ivec|uvec|bvec|dvec)[234]$/.test(type)
}

export function isMatrixType(type: string): type is GLSLMatrix {
    return /^mat(2|3|4)(x[234])?$/.test(type)
}

export function isSamplerType(type: string): type is GLSLSampler {
    return /^sampler/.test(type)
}

export function isScalarType(type: string): type is GLSLScalar {
    return ['void', 'bool', 'int', 'uint', 'float', 'double'].includes(type)
}

// ============================================
// 19. 类型大小映射（修复版）
// ============================================
// 🔑 关键修复：使用 as const 断言 + 显式类型标注
export const GLSLTypeSize: Record<GLSLPrimitiveType, number> = {
    // 标量
    'void': 0,
    'bool': 4,
    'int': 4,
    'uint': 4,
    'float': 4,
    'double': 8,

    // 浮点向量
    'vec2': 8, 'vec3': 12, 'vec4': 16,
    // 整数向量
    'ivec2': 8, 'ivec3': 12, 'ivec4': 16,
    // 无符号整数向量
    'uvec2': 8, 'uvec3': 12, 'uvec4': 16,
    // 布尔向量
    'bvec2': 8, 'bvec3': 12, 'bvec4': 16,
    // 双精度向量
    'dvec2': 16, 'dvec3': 24, 'dvec4': 32,

    // 浮点矩阵
    'mat2': 16, 'mat3': 36, 'mat4': 64,
    'mat2x3': 24, 'mat2x4': 32,
    'mat3x2': 24, 'mat3x4': 48,
    'mat4x2': 32, 'mat4x3': 48,
    // 双精度矩阵
    'dmat2': 32, 'dmat3': 72, 'dmat4': 128,
    'dmat2x3': 48, 'dmat2x4': 64,
    'dmat3x2': 48, 'dmat3x4': 96,
    'dmat4x2': 64, 'dmat4x3': 96,

    // 标准采样器
    'sampler2D': 4, 'sampler3D': 4, 'samplerCube': 4,
    'sampler2DArray': 4, 'samplerCubeArray': 4,
    // 阴影采样器
    'sampler2DShadow': 4, 'samplerCubeShadow': 4,
    'sampler2DArrayShadow': 4,
    // 多重采样采样器
    'sampler2DMS': 4, 'sampler2DMSArray': 4,
    // 整数采样器
    'isampler2D': 4, 'isampler3D': 4, 'isamplerCube': 4,
    'isampler2DArray': 4, 'isamplerCubeArray': 4,
    'isampler2DMS': 4, 'isampler2DMSArray': 4,
    // 无符号整数采样器
    'usampler2D': 4, 'usampler3D': 4, 'usamplerCube': 4,
    'usampler2DArray': 4, 'usamplerCubeArray': 4,
    'usampler2DMS': 4, 'usampler2DMSArray': 4,

    // 标准图像
    'image2D': 4, 'image3D': 4, 'imageCube': 4,
    'image2DArray': 4, 'imageCubeArray': 4,
    'image2DMS': 4, 'image2DMSArray': 4,
    // 整数图像
    'iimage2D': 4, 'iimage3D': 4, 'iimageCube': 4,
    'iimage2DArray': 4, 'iimageCubeArray': 4,
    'iimage2DMS': 4, 'iimage2DMSArray': 4,
    // 无符号整数图像
    'uimage2D': 4, 'uimage3D': 4, 'uimageCube': 4,
    'uimage2DArray': 4, 'uimageCubeArray': 4,
    'uimage2DMS': 4, 'uimage2DMSArray': 4,

    // 原子类型
    'atomic_uint': 4,
}


export type GLProgramOptions = {
    vertexShader: string
    fragmentShader: string
    uniforms?: Record<string, number>
    attributes?: Record<string, number>
}
export type AttributeMate = {
    name: string
    location: number
    type: number
    size: number
}
export type UnifromBlcokMemberMate = {
    name: string
    type: number
    size: number
    offset: number
}
export type UnifromMate = {
    king: string //'uniform' | 'block' | 'array' | 'struct'
    name: string
    location: WebGLUniformLocation | null // unifrom block null
    type?: number
    size?: number
    index?: number // array index
    blockIndex?: number | null // unifrom block null
    binding?: number | null // unifrom block null
    members?: UnifromBlcokMemberMate[]
}
export class MagicString {
    static template = (function () {
        const invert = function (obj: Record<string, any>) {
            var result: Record<string, any> = {};
            for (var name in obj) {
                if (obj.hasOwnProperty(name)) {
                    result[obj[name]] = name;
                }
            }
            return result;
        }
        // List of HTML entities for escaping.
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '`': '&#x60;'
        };
        const unescapeMap = invert(escapeMap);

        // Functions for escaping and unescaping strings to/from HTML interpolation.
        const createEscaper = function (map: Record<string, any>) {
            const escaper = function (match: string) {
                return map[match];
            };
            // Regexes for identifying a key that needs to be escaped
            const source = '(?:' + Object.keys(map).join('|') + ')';
            const testRegexp = RegExp(source);
            const replaceRegexp = RegExp(source, 'g');
            return function (string: string) {
                string = string == null ? '' : '' + string;
                return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
            };
        };
        const defaultUtil = {
            escape: createEscaper(escapeMap),
            unescape: createEscaper(unescapeMap)
        }
        const parseTemplate = function (str: string, util?: any) {
            util = Object.assign({}, defaultUtil, util || {})
            let err = "";
            try {
                let func: any;
                const strFunc = `const __t_=[];
                with(obj){
                    __t_.push(\`${str
                        .replace(/<%=([\s\S]+?)%>/g, "`,$1,`")
                        .replace(/<%-([\s\S]+?)%>/g, "`,_.escape($1),`")
                        .split("<%").join("`);")
                        .split("%>").join("__t_.push(`")}
                    \`);
                }
                return __t_.join('');`
                func = new Function("obj", '_', strFunc);
                return function (this: any, data: any = {}) {
                    return func.call(this, data, util)
                }
            } catch (e: any) { err = e.message; }
            return () => {
                return "< # ERROR: " + err + " # >";
            }
        }
        return parseTemplate;
    })();
    source: string
    constructor(source: string = '') {
        this.source = source
    }
    private format(format: string, ...args: any[]) {
        return format.replace(/\{(\d+)\}/g, (match, index) => args[index])
    }
    appendFormat(format: string, ...args: any[]) {
        this.append(this.format(format, ...args))
    }
    appendLineFormat(format: string, ...args: any[]) {
        this.appendLine(this.format(format, ...args))
    }
    prependFormat(format: string, ...args: any[]) {
        this.prepend(this.format(format, ...args))
    }
    append(source: string) {
        this.source += source
    }
    appendLine(source: string) {
        if (this.source.length) {
            this.source += '\n' + source
        } else {
            this.source = source
        }
    }
    lineBreak() {
        this.append('\n')
    }
    prepend(source: string) {
        this.source = source + this.source
    }
    prependLine(source: string) {
        if (this.source.length) {
            this.source = '\n' + source + this.source
        } else {
            this.source = source + this.source
        }
    }
    replace(start: number, end: number, source: string) {
        this.source = this.source.slice(0, start) + source + this.source.slice(end)
    }
    insert(index: number, source: string) {
        this.source = this.source.slice(0, index) + source + this.source.slice(index)
    }
    toString() {
        return this.source
    }
    template(data: any, util?: any) {
        return MagicString.template(this.source, util)(data);
    }
}
/**
 * #version 300 es

// ============================================
// 精度声明
// ============================================
precision highp float;
precision highp int;

// ============================================
// 1. layout 用于 attribute (in) - 指定位置
// ============================================
// 显式指定 attribute 的位置索引，方便与 JavaScript 绑定
layout(location = 0) in vec3 aPosition;   // 位置索引 0
layout(location = 1) in vec3 aNormal;     // 位置索引 1
layout(location = 2) in vec2 aUv;         // 位置索引 2
layout(location = 3) in vec4 aColor;      // 位置索引 3
layout(location = 4) in int aIndex;       // 位置索引 4（整型也支持）

// 如果不指定 location，编译器会自动分配
// in vec3 aTangent;  // 自动分配 location

// ============================================
// 2. layout 用于 uniform block - 绑定点 + 内存布局
// ============================================

// 2.1 最常用的写法：指定绑定点 + std140 布局
layout(std140, binding = 0) uniform TransformBlock {
    mat4 model;
    mat4 view;
    mat4 projection;
    mat3 normalMatrix;
} transforms;  // 实例名

// 2.2 也可以只指定布局，不指定绑定（在 JavaScript 中通过 uniformBlockBinding 设置）
layout(std140) uniform MaterialBlock {
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    float shininess;
} material;

// 2.3 使用 std430 布局（更紧凑，适合大量数据）
layout(std430, binding = 1) uniform LightBlock {
    vec4 positions[100];  // 100 盏灯的位置
    vec4 colors[100];     // 100 盏灯的颜色
    float intensities[100];
} lights;

// 2.4 无实例名的 uniform block（直接访问成员名）
layout(std140, binding = 2) uniform ConfigBlock {
    float uTime;
    vec3 uCameraPosition;
    int uMaxLights;
};  // 注意没有实例名，直接使用 uTime, uCameraPosition 等

// ============================================
// 3. layout 用于 struct 内的成员（很少用，但支持）
// ============================================
struct LightData {
    layout(offset = 0) vec3 position;   // 指定偏移量（字节）
    layout(offset = 16) vec3 color;     // 手动对齐
    layout(offset = 32) float intensity;
    layout(offset = 36) bool enabled;
};  // 总大小会按 std140 规则自动补齐

// 在 uniform block 中使用这个结构体
layout(std140, binding = 3) uniform SceneBlock {
    LightData mainLight;
    LightData fillLight;
};

// ============================================
// 4. layout 用于 out（输出变量）- 指定位置
// ============================================
// 顶点着色器的输出变量可以指定位置，用于与片元着色器的输入匹配
layout(location = 0) out vec3 vNormal;        // 输出位置 0
layout(location = 1) out vec2 vUv;            // 输出位置 1
layout(location = 2) out vec4 vColor;         // 输出位置 2
layout(location = 3) out vec3 vWorldPosition; // 输出位置 3
layout(location = 4) out vec3 vViewPosition;  // 输出位置 4
layout(location = 5) out float vIntensity;    // 输出位置 5

// 也可以不指定 location，编译器自动分配
// out vec3 vTangent;  // 自动分配

// ============================================
// 5. layout 用于常量数组（指定字节对齐）
// ============================================
// 部分实现支持在全局常量上使用 layout（较少用）
layout(offset = 0) const float PI = 3.14159265359;

// ============================================
// 6. layout 用于共享/隔离的接口（较少用）
// ============================================
// 在多个着色器阶段间共享变量
// layout(shared) uniform SharedBlock { ... };
// layout(packed) uniform PackedBlock { ... };

// ============================================
// 结构体定义（不包含 layout）
// ============================================
struct Light {
    vec3 position;
    vec3 color;
    float intensity;
};

// 使用结构体的数组（在 uniform block 中）
layout(std140, binding = 4) uniform LightArrayBlock {
    Light lights[10];  // 结构体数组
    int activeCount;
};

// ============================================
// 普通 uniform（不含 layout）
// ============================================
uniform float uTime;
uniform int uFrameCount;

// ============================================
// 数组的多种用法
// ============================================
// 基本类型数组
uniform vec3 uPositions[8];

// 结构体数组（已在上面展示）
// Light uLights[4];

// ============================================
// 函数定义
// ============================================
vec3 calculateNormal(vec3 normal) {
    return normalize(normal);
}

// ============================================
// main 函数
// ============================================
void main() {
    // ---- 使用普通 uniform ----
    float time = uTime;
    
    // ---- 使用 uniform block（带实例名） ----
    mat4 modelMatrix = transforms.model;
    mat4 viewMatrix = transforms.view;
    mat4 projectionMatrix = transforms.projection;
    mat3 normalMat = transforms.normalMatrix;
    
    // ---- 使用 uniform block（无实例名） ----
    vec3 cameraPos = uCameraPosition;  // 直接使用
    float deltaTime = uTime;           // 直接使用
    
    // ---- 计算世界坐标 ----
    vec4 worldPos = modelMatrix * vec4(aPosition, 1.0);
    vWorldPosition = worldPos.xyz;
    
    // ---- 计算视图坐标 ----
    vec4 viewPos = viewMatrix * worldPos;
    vViewPosition = viewPos.xyz;
    
    // ---- 计算法线 ----
    vNormal = normalize(normalMat * aNormal);
    
    // ---- 传递 UV 和颜色 ----
    vUv = aUv;
    vColor = aColor;
    
    // ---- 使用结构体数组（LightArrayBlock） ----
    float totalIntensity = 0.0;
    for (int i = 0; i < activeCount && i < 10; i++) {
        totalIntensity += lights.lights[i].intensity;
    }
    vIntensity = totalIntensity;
    
    // ---- 使用 LightBlock（std430 布局的 block） ----
    // 注意：std430 布局访问方式与 std140 相同
    vec3 lightPos = lights.positions[0].xyz;
    vec3 lightColor = lights.colors[0].xyz;
    
    // ---- 使用 SceneBlock 中的结构体 ----
    vec3 mainLightPos = mainLight.position;
    vec3 fillLightPos = fillLight.position;
    
    // ---- 计算最终位置 ----
    gl_Position = projectionMatrix * viewMatrix * worldPos;
    
    // ---- 设置点大小（如果需要） ----
    gl_PointSize = 2.0;
}

分类	类型列表
标量	bool, int, uint, float, double
向量	vec2/3/4, ivec2/3/4, uvec2/3/4, bvec2/3/4, dvec2/3/4
矩阵	mat2/3/4, mat2x3/4, mat3x2/4, mat4x2/3, dmat2/3/4
纹理	sampler2D/3D/Cube/2DArray/2DShadow/2DMS, isampler*, usampler*
图像	image2D/3D/Cube, iimage*, uimage*
结构体	struct Name { ... }
数组	Type name[size]
其他	void, atomic_uint
 */

export class GLSLShaderSource {
    static shareSources: Map<string, GLSLShaderSource> = new Map()
    name: string = ''
    source = new MagicString()
    glslVersion: number = 300

    constructor(name: string) {
        this.name = name
        GLSLShaderSource.shareSources.set(name, this)
    }
    version(version: number) {
        this.glslVersion = version
        this.source.appendLine(`<%=defineVersion(${version})%>`)
        return this
    }
    include(name: string) {
        this.source.appendLine(`<%=include('${name}')%>`)
        return this
    }
    definePrecision(type: string, precision: 'highp' | 'mediump' | 'lowp') {
        this.source.appendLine(`<%=definePrecision('${precision}','${type}')%>`)
        return this
    }
    defineMacro(name: string, value?: string) {
        this.source.appendLine(`<%=defineMacro('${name}',${value === undefined ? undefined : JSON.stringify(value)})%>`)
        return this
    }
    defineAttribute(type: GLSLPrimitiveType | string, name: string, location?: number) {
        this.source.appendLine(`<%=defineAttribute('${type}','${name}',${location})%>`)
        return this
    }
    defineUniform<T extends string>(type: T, name: string) {
        this.source.appendLine(`<%=defineUniform('${type}','${name}')%>`)
        return this
    }
    //// 内存布局限定符（std140 / std430 / shared / packed）
    defineUniformBlock(name: string, members: [type: string, name: string][], binding?: number, layout?: 'std140' | 'std430' | 'shared' | 'packed') {
        this.source.appendLine(`<%=defineUniformBlock('${name}',${JSON.stringify(members)},${binding},${layout !== undefined ? JSON.stringify(layout) : undefined})%>`)
        return this
    }
    defineUniformStruct(name: string, members: [type: string, name: string][], varName: string) {
        this.source.appendLine(`<%=defineUniformStruct('${name}',${JSON.stringify(members)},'${varName}')%>`)
        return this
    }
    defineStruct(name: string, members: ([type: string, name: string])[]) {
        this.source.appendLine(`<%=defineStruct('${name}',${JSON.stringify(members)})%>`)
        return this
    }
    defineVarying(type: string, name: string) {
        this.source.appendLine(`<%=defineVarying('${type}','${name}')%>`)
        return this
    }
    defineMain(body: string) {
        this.source.appendLine(`<%=defineMain(\`${body}\`)%>`)
        return this
    }
    defineVariable(type: string, name: string) {
        this.source.appendLine(`<%=defineVariable('${type}','${name}')%>`)
        return this
    }
    defineUniformSampler(type: GLSLStandardSampler, name: string) {
        this.source.appendLine(`<%=defineUniformSampler('${type}','${name}')%>`)
        return this
    }
    append(source: string) {
        this.source.append(source)
        return this
    }
    appendLine(source: string) {
        this.source.appendLine(source)
        return this
    }
    toString() {
        return this.source.template({
            defineVersion: (version: number) => {
                return `#version ${version} es`
            },
            definePrecision: (precision: string, type: string) => {
                return `precision ${precision} ${type};`
            },
            defineMacro: (name: string, value?: string) => {
                return `define ${name}${value !== undefined ? ` ${value}` : ''}`
            },
            include: (name: string) => {
                return GLSLShaderSource.shareSources.get(name)?.toString() || ''
            },
            defineAttribute: (type: string, name: string, location: number) => {
                if (this.glslVersion >= 300) {
                    return `${location !== undefined ? `layout(location = ${location}) ` : ''}in ${type} ${name};`
                } else {
                    return `attribute ${type} ${name};`
                }
            },
            defineUniform: (type: string, name: string) => {
                return `uniform ${type} ${name};`
            },
            defineUniformBlock: (name: string, members: [type: string, name: string][], binding?: number, layout?: 'std140' | 'std430' | 'shared' | 'packed') => {
                return [`layout(${layout !== undefined ? layout : 'std140'}${binding !== undefined ? ',binding = ' + binding : ''}) uniform ${name} {`,
                `${members.map(([type, name]) => `${type} ${name};`).join('\n')}`
                    , `};`].join('\n');
            },
            defineUniformStruct: (name: string, members: [type: string, name: string][], varName: string) => {
                return [`uniform struct ${name} {`,
                `${members.map(([type, name]) => `${type} ${name};`).join('\n')}`
                    , `} ${varName};`].join('\n');
            },
            defineStruct: (name: string, members: [type: string, name: string][]) => {
                return `struct ${name} {
                    ${members.map(([type, name]) => `${type} ${name};`).join('\n')}
                };`
            },
            defineVarying: (type: string, name: string) => {
                if (this.glslVersion >= 300) {
                    return `out ${type} ${name};`
                } else {
                    return `varying ${type} ${name};`
                }
            },
            defineVariable: (type: string, name: string) => {
                return `${type} ${name};`
            },
            defineUniformSampler: (type: GLSLStandardSampler, name: string) => {
                return `uniform ${type} ${name};`
            },
            defineMain: (body: string) => {
                return ['void main() {', body.replace(/^\n+/, ''), '}'].join('\n')
            },
        })
    }
}
export type AttributeBuffer = {

}
export type UnifromData = {

}
export type GLDrawObject = {
    attributes: {
        [key: string]: AttributeBuffer
    },
    uniforms: {
        [key: string]: UnifromData
    },
    uniformBlocks: {
        [key: string]: UnifromData
    }
}
export interface IDisposable {
    dispose(): void
}


export class GLContext implements IDisposable {
    gl: WebGL2RenderingContext
    resources: Record<string, Set<IDisposable>>
    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl
        this.resources = {
            programs: new Set(),
            attributes: new Set(),
            uniforms: new Set(),
            uniformBlocks: new Set(),
        }
       
    }
    dispose(): void {
        Object.values(this.resources).forEach(resources => {
            resources.forEach(resource => resource.dispose())
        })
    }

}
export class GLProgram implements IDisposable {
    static programs: Map<string, GLProgram> = new Map()
    static getProgram(gl: WebGL2RenderingContext, options: GLProgramOptions) {
        const key = JSON.stringify(options.vertexShader + ':' + options.fragmentShader)
        if (!this.programs.has(key)) {
            this.programs.set(key, new GLProgram(gl, options))
        }
        return this.programs.get(key)
    }
    program: WebGLProgram
    gl: WebGL2RenderingContext
    attributes: Map<string, AttributeMate>
    uniforms: Map<string, UnifromMate>
    options: GLProgramOptions
    constructor(gl: WebGL2RenderingContext, options?: GLProgramOptions) {
        this.gl = gl
        this.options = { vertexShader: '', fragmentShader: '', ...(options || {}) }
        this.program = this.gl.createProgram()
        this.attributes = new Map()
        this.uniforms = new Map()
        this.compile()
        this.fetchActiveProgram()
    }
    use() {
        this.gl.useProgram(this.program)
    }
    createShader(type: number, source: string) {
        const shader = this.gl.createShader(type)
        this.gl.shaderSource(shader, source)
        this.gl.compileShader(shader)
        return shader
    }
    compile() {
        const vertexShader = this.options.vertexShader
        const fragmentShader = this.options.fragmentShader
        const vertexShaderObj = this.createShader(this.gl.VERTEX_SHADER, vertexShader)
        const fragmentShaderObj = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShader)
        this.gl.attachShader(this.program, vertexShaderObj)
        this.gl.attachShader(this.program, fragmentShaderObj)
        this.gl.linkProgram(this.program)
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('Program link failed:', this.gl.getProgramInfoLog(this.program))
            console.error('Vertex shader:', this.gl.getShaderInfoLog(vertexShaderObj))
            console.error('Fragment shader:', this.gl.getShaderInfoLog(fragmentShaderObj))
            return
        }
        this.gl.deleteShader(vertexShaderObj)
        this.gl.deleteShader(fragmentShaderObj)
    }
    fetchActiveProgram() {
        this.fetchActiveAttributes()
        this.fetchActiveUniforms()
    }
    fetchActiveAttributes() {
        const count = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_ATTRIBUTES)
        for (let i = 0; i < count; i++) {
            const info = this.gl.getActiveAttrib(this.program, i)
            const location = this.gl.getAttribLocation(this.program, info.name)
            this.attributes.set(info.name, { location, type: info.type, name: info.name, size: info.size })
        }
    }
    fetchActiveUniforms() {
        const gl = this.gl, program = this.program
        const count = gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS)
        const activeUniformsParameters = [
            ['UNIFORM_TYPE', 'type'],
            ['UNIFORM_SIZE', 'size'],
            ['UNIFORM_BLOCK_INDEX', 'blockIndex'],
            ['UNIFORM_OFFSET', 'offset'],
            ['UNIFORM_ARRAY_STRIDE', 'arrayStride'],
            ['UNIFORM_MATRIX_STRIDE', 'matrixStride'],
            ['UNIFORM_IS_ROW_MAJOR', 'isRowMajor'],
        ]
        const activeUniformBlockParameters = [
            ['UNIFORM_BLOCK_BINDING'],
            ['UNIFORM_BLOCK_DATA_SIZE'],
            ['UNIFORM_BLOCK_ACTIVE_UNIFORMS'],
            ['UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES'], //
            ['UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER'],
            ['UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER']
        ]
        const indecis: number[] = []
        const uniformBlocks: UnifromBlcokMemberMate[] = []
        for (let i = 0; i < count; i++) {
            indecis.push(i)
            const info = gl.getActiveUniform(program, i)
            let uniformName = info.name
            const location = gl.getUniformLocation(program, info.name)
            if (location) {
                let king = 'uniform'
                const isArray = uniformName.indexOf('[') !== -1
                const isStruct = uniformName.indexOf('.') !== -1
                if (isStruct) {
                    king = 'struct'
                }
                if (isArray) {
                    king = 'array'
                }
                if (isArray) {
                    uniformName = uniformName.substring(0, uniformName.indexOf('['))
                    for (let j = 0; j < info.size; j++) {
                        const uniformArrayName = uniformName + '[' + j + ']'
                        const location = gl.getUniformLocation(program, uniformArrayName)
                        this.uniforms.set(uniformArrayName, {
                            king: 'array',
                            name: uniformArrayName,
                            location,
                            type: info.type,
                            size: info.size,
                            index: j
                        })
                    }

                } else {
                    this.uniforms.set(uniformName, {
                        king,
                        name: uniformName,
                        location,
                        type: info.type,
                        size: info.size,
                        index: i
                    })
                }
            }
        }
        const blockCount = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_UNIFORM_BLOCKS)
        for (let i = 0; i < blockCount; i++) {
            const blockName = gl.getActiveUniformBlockName(program, i)
            const blockIndex = gl.getUniformBlockIndex(program, blockName)
            const binding = gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_BINDING)
            const blockIndices = gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES)
            const uniformMate: UnifromMate = {
                name: blockName,
                king: 'block',
                binding,
                blockIndex,
                location: null
            }
            this.uniforms.set(blockName, uniformMate)
            if (blockIndices) {

                const types = gl.getActiveUniforms(program, blockIndices, gl.UNIFORM_TYPE)
                const sizes = gl.getActiveUniforms(program, blockIndices, gl.UNIFORM_SIZE)
                const offsets = gl.getActiveUniforms(program, blockIndices, gl.UNIFORM_OFFSET)
                uniformMate.members = Array.from(blockIndices).map((i: number, index: number) => {
                    const info = gl.getActiveUniform(program, i)
                    //   const location = gl.getUniformLocation(program, info.name)
                    return {
                        name: info.name,
                        king: 'uniform',
                        //  location,
                        blockIndex,
                        index: i,
                        type: types[index],
                        size: sizes[index],
                        offset: offsets[index],
                    }
                })
            }

        }
    }
   
    getAttributeLocation(name: string) {
        const info = this.attributes.get(name)
        if(info){
            return info.location
        }
        return -1
    }
    getUniformLocation(name: string) {
        const info = this.uniforms.get(name)
        if(info){
            return info.location
        }
        return null
    }
    dispose(): void {
        this.gl.deleteProgram(this.program)
    }

}