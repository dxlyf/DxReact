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
