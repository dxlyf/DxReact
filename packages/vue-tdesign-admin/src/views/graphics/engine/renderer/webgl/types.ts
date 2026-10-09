
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
    | 'STENCIL_TEST'
    | 'RASTERIZER_DISCARD';
/** 查询对象目标（Query 的 target 参数） */
type QueryTarget = 'ANY_SAMPLES_PASSED'
    | 'ANY_SAMPLES_PASSED_CONSERVATIVE'
    | 'TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN';
/** 变换反馈捕获的图元类型 */
type TransformFeedbackMode = 'POINTS' | 'LINES' | 'TRIANGLES';
/** 渲染上下文类型（WebGL1/2 共用） */
type GLContext = WebGLRenderingContext | WebGL2RenderingContext;
/** 上下文版本 */
type GLVersion = 'webgl1' | 'webgl2';

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
/** 纹理缩小过滤（含 mipmap 变体，使用 mipmap 时不能为 NEAREST/LINEAR） */
type TextureMinFilter = 'NEAREST'
    | 'LINEAR'
    | 'NEAREST_MIPMAP_NEAREST'
    | 'LINEAR_MIPMAP_NEAREST'
    | 'NEAREST_MIPMAP_LINEAR'
    | 'LINEAR_MIPMAP_LINEAR';
/** 纹理放大过滤 */
type TextureMagFilter = 'NEAREST' | 'LINEAR';
/** 纹理环绕方式（wrapR 仅立方体贴图有效） */
type TextureWrap = 'REPEAT' | 'CLAMP_TO_EDGE' | 'MIRRORED_REPEAT';
/** 上传/读取时客户端像素数据格式 */
type TextureFormat = 'RED'
    | 'RG'
    | 'RGB'
    | 'RGBA'
    | 'ALPHA'
    | 'LUMINANCE'
    | 'LUMINANCE_ALPHA'
    | 'DEPTH_COMPONENT'
    | 'DEPTH_STENCIL';
/** 像素数据类型 */
type TextureType = 'UNSIGNED_BYTE'
    | 'BYTE'
    | 'UNSIGNED_SHORT'
    | 'SHORT'
    | 'UNSIGNED_INT'
    | 'INT'
    | 'HALF_FLOAT'
    | 'FLOAT'
    | 'UNSIGNED_SHORT_5_6_5'
    | 'UNSIGNED_SHORT_4_4_4_4'
    | 'UNSIGNED_SHORT_5_5_5_1'
    | 'UNSIGNED_INT_2_10_10_10_REV'
    | 'UNSIGNED_INT_10F_11F_11F_REV'
    | 'UNSIGNED_INT_24_8'
    | 'FLOAT_32_UNSIGNED_INT_24_8_REV';
/** 显存内部格式 */
type TextureInternalFormat = 'R8'
    | 'R16F'
    | 'R32F'
    | 'RG8'
    | 'RG16F'
    | 'RG32F'
    | 'RGB8'
    | 'RGB16F'
    | 'RGB32F'
    | 'RGBA8'
    | 'RGBA16F'
    | 'RGBA32F'
    | 'SRGB8_ALPHA8'
    | 'DEPTH_COMPONENT16'
    | 'DEPTH_COMPONENT24'
    | 'DEPTH_COMPONENT32F'
    | 'DEPTH24_STENCIL8'
    | 'DEPTH32F_STENCIL8';
/** 帧缓冲（渲染目标）附件点 */
type FramebufferAttachment = 'COLOR_ATTACHMENT0'
    | 'COLOR_ATTACHMENT1'
    | 'COLOR_ATTACHMENT2'
    | 'COLOR_ATTACHMENT3'
    | 'COLOR_ATTACHMENT4'
    | 'COLOR_ATTACHMENT5'
    | 'COLOR_ATTACHMENT6'
    | 'COLOR_ATTACHMENT7'
    | 'DEPTH_ATTACHMENT'
    | 'STENCIL_ATTACHMENT'
    | 'DEPTH_STENCIL_ATTACHMENT';
type ShaderType = 'FRAGMENT_SHADER' | 'VERTEX_SHADER';
type CullFaceMode = 'FRONT' | 'BACK' | 'FRONT_AND_BACK';
/** 正面三角形绕序 */
type FrontFaceMode = 'CW' | 'CCW';
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

export type {
    DrawMode,
    ArrayType,
    TexImage2DTarget,
    ShaderType,
    CullFaceMode,
    FrontFaceMode,
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
    BlendOptions,
    Capability,
    TextureMinFilter,
    TextureMagFilter,
    TextureWrap,
    TextureFormat,
    TextureType,
    TextureInternalFormat,
    FramebufferAttachment,
    QueryTarget,
    TransformFeedbackMode,
    GLContext,
    GLVersion
}