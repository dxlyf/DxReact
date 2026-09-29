
type ComparisonFunc = 'NEVER'
    | 'LESS'
    | 'EQUAL'
    | 'LEQUAL'
    | 'GREATER'
    | 'NOTEQUAL'
    | 'GEQUAL'
    | 'ALWAYS';
type DepthOptions = {
    func?: ComparisonFunc;
    mask?: boolean;
    range?: [number, number];
}
type Capability = 'BLEND'
    | 'CULL_FACE'
    | 'DEPTH_TEST'
    | 'DITHER'
    | 'POLYGON_OFFSET_FILL'
    | 'SAMPLE_ALPHA_TO_COVERAGE'
    | 'SAMPLE_COVERAGE'
    | 'SCISSOR_TEST'
    | 'STENCIL_TEST';

type ClearOptions = {
    color?: [r: number, g: number, b: number, a: number];
    depth?: number;
    stencil?: number;
    colorMask?: [r: boolean, g: boolean, b: boolean, a: boolean];
}
type TextureTarget = 'TEXTURE_2D' | 'TEXTURE_CUBE_MAP';
type BlendEquationMode = 'FUNC_ADD' | 'FUNC_SUBTRACT' | 'FUNC_REVERSE_SUBTRACT';
type BlendFuncDstFactorNoConstant = 'ZERO'
    | 'ONE'
    | 'SRC_COLOR'
    | 'ONE_MINUS_SRC_COLOR'
    | 'DST_COLOR'
    | 'ONE_MINUS_DST_COLOR'
    | 'SRC_ALPHA'
    | 'ONE_MINUS_SRC_ALPHA'
    | 'DST_ALPHA'
    | 'ONE_MINUS_DST_ALPHA';
type BlendFuncDstFactorNoConstantColor = BlendFuncDstFactorNoConstant
    | 'CONSTANT_ALPHA'
    | 'ONE_MINUS_CONSTANT_ALPHA';
type BlendFuncDstFactorNoConstantAlpha = BlendFuncDstFactorNoConstant
    | 'CONSTANT_COLOR'
    | 'ONE_MINUS_CONSTANT_COLOR';
type BlendFuncDstFactor = BlendFuncDstFactorNoConstantAlpha | BlendFuncDstFactorNoConstantColor;
type BlendFuncSrcFactor = BlendFuncDstFactor | 'SRC_ALPHA_SATURATE';
type BufferDataUsage = 'STREAM_DRAW' | 'STATIC_DRAW' | 'DYNAMIC_DRAW';
type CubeMapFaces = 'TEXTURE_CUBE_MAP_POSITIVE_X'
    | 'TEXTURE_CUBE_MAP_NEGATIVE_X'
    | 'TEXTURE_CUBE_MAP_POSITIVE_Y'
    | 'TEXTURE_CUBE_MAP_NEGATIVE_Y'
    | 'TEXTURE_CUBE_MAP_POSITIVE_Z'
    | 'TEXTURE_CUBE_MAP_NEGATIVE_Z';
type TexImage2DTarget = 'TEXTURE_2D' | CubeMapFaces;
type ShaderType = 'FRAGMENT_SHADER' | 'VERTEX_SHADER';
type CullFaceMode = 'FRONT' | 'BACK' | 'FRONT_AND_BACK';
type DrawMode = 'POINTS'
    | 'LINE_STRIP'
    | 'LINE_LOOP'
    | 'LINES'
    | 'TRIANGLE_STRIP'
    | 'TRIANGLE_FAN'
    | 'TRIANGLES';
type ArrayType = 'BYTE'
    | 'UNSIGNED_BYTE'
    | 'SHORT'
    | 'UNSIGNED_SHORT'
    | 'FLOAT'


type BlendOptions = {
    equation?: BlendEquationMode;
    color?: [r: number, g: number, b: number, a: number];
    src?: BlendFuncSrcFactor;
    dst?: BlendFuncDstFactor;
    srcAlpha?: BlendFuncSrcFactor;
    dstAlpha?: BlendFuncDstFactor;
}
type BufferTarget = 'ARRAY_BUFFER' | 'ELEMENT_ARRAY_BUFFER' | 'COPY_READ_BUFFER'
    | 'COPY_WRITE_BUFFER'
    | 'TRANSFORM_FEEDBACK_BUFFER'
    | 'UNIFORM_BUFFER'
    | 'PIXEL_PACK_BUFFER'
    | 'PIXEL_UNPACK_BUFFER';
type BufferDataUsage = 'STREAM_DRAW' | 'STATIC_DRAW' | 'DYNAMIC_DRAW';
export type {
    DrawMode,
    ArrayType,
    TexImage2DTarget,
    ShaderType,
    CullFaceMode,
    BlendFuncSrcFactor,
    BlendFuncDstFactor,
    BufferTarget,
    ClearOptions,
    DepthOptions,
    BlendEquationMode,
    TextureTarget,
    BufferDataUsage,
    ComparisonFunc,
    CubeMapFaces,
    BlendOptions
}