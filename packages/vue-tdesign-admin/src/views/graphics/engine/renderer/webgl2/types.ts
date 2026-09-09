/**
 * WebGL2 引擎公共类型与常量
 *
 * GL 常量全部是 WebGL2 规定的固定数值，因此可以在没有 gl 上下文时静态引用，
 * 从而让 Buffer/Texture/Program 的 API 直观且零依赖。
 */
import type { Mat4, Vec2, Vec3, Vec4 } from './math';
import type { Buffer } from './Buffer';
import type { Texture } from './Texture';

// ---------------------------------------------------------------------------
// GL 常量
// ---------------------------------------------------------------------------

/** 引擎用到的全部 WebGL2 枚举常量 */
export const GL = {
    // 绘制图元
    POINTS: 0x0000,
    LINES: 0x0001,
    LINE_LOOP: 0x0002,
    LINE_STRIP: 0x0003,
    TRIANGLES: 0x0004,
    TRIANGLE_STRIP: 0x0005,
    TRIANGLE_FAN: 0x0006,

    // 能力开关
    BLEND: 0x0be2,
    CULL_FACE: 0x0b44,
    DEPTH_TEST: 0x0b71,
    DITHER: 0x0bd0,
    POLYGON_OFFSET_FILL: 0x8037,
    SAMPLE_ALPHA_TO_COVERAGE: 0x809e,
    SCISSOR_TEST: 0x0c11,
    STENCIL_TEST: 0x0b90,

    // 面剔除
    FRONT: 0x0404,
    BACK: 0x0405,
    FRONT_AND_BACK: 0x0408,
    CW: 0x0900,
    CCW: 0x0901,

    // 混合因子
    ZERO: 0,
    ONE: 1,
    SRC_COLOR: 0x0300,
    ONE_MINUS_SRC_COLOR: 0x0301,
    SRC_ALPHA: 0x0302,
    ONE_MINUS_SRC_ALPHA: 0x0303,
    DST_ALPHA: 0x0304,
    ONE_MINUS_DST_ALPHA: 0x0305,
    DST_COLOR: 0x0306,
    ONE_MINUS_DST_COLOR: 0x0307,
    SRC_ALPHA_SATURATE: 0x0308,
    CONSTANT_COLOR: 0x8001,
    ONE_MINUS_CONSTANT_COLOR: 0x8002,
    CONSTANT_ALPHA: 0x8003,
    ONE_MINUS_CONSTANT_ALPHA: 0x8004,

    // 深度/模板
    NEVER: 0x0200,
    LESS: 0x0201,
    EQUAL: 0x0202,
    LEQUAL: 0x0203,
    GREATER: 0x0204,
    NOTEQUAL: 0x0205,
    GEQUAL: 0x0206,
    ALWAYS: 0x0207,

    // 缓冲
    ARRAY_BUFFER: 0x8892,
    ELEMENT_ARRAY_BUFFER: 0x8893,
    UNIFORM_BUFFER: 0x8a11,
    STREAM_DRAW: 0x88e0,
    STATIC_DRAW: 0x88e4,
    DYNAMIC_DRAW: 0x88e8,

    // 数据类型
    BYTE: 0x1400,
    UNSIGNED_BYTE: 0x1401,
    SHORT: 0x1402,
    UNSIGNED_SHORT: 0x1403,
    INT: 0x1404,
    UNSIGNED_INT: 0x1405,
    FLOAT: 0x1406,
    HALF_FLOAT: 0x140b,
    UNSIGNED_SHORT_5_6_5: 0x8363,
    UNSIGNED_SHORT_4_4_4_4: 0x8033,
    UNSIGNED_SHORT_5_5_5_1: 0x8034,
    UNSIGNED_INT_2_10_10_10_REV: 0x8368,
    UNSIGNED_INT_10F_11F_11F_REV: 0x8c3b,

    // 采样器目标 / 过滤器 / 环绕
    TEXTURE_2D: 0x0de1,
    TEXTURE_3D: 0x806f,
    TEXTURE_CUBE_MAP: 0x8513,
    TEXTURE_2D_ARRAY: 0x8c1a,
    NEAREST: 0x2600,
    LINEAR: 0x2601,
    NEAREST_MIPMAP_NEAREST: 0x2700,
    LINEAR_MIPMAP_NEAREST: 0x2701,
    NEAREST_MIPMAP_LINEAR: 0x2702,
    LINEAR_MIPMAP_LINEAR: 0x2703,
    REPEAT: 0x2901,
    CLAMP_TO_EDGE: 0x812f,
    MIRRORED_REPEAT: 0x8370,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    TEXTURE_WRAP_R: 0x8072,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_MAG_FILTER: 0x2800,
    TEXTURE_BASE_LEVEL: 0x813c,
    TEXTURE_MAX_LEVEL: 0x813d,

    // 像素格式
    RED: 0x1903,
    RG: 0x8227,
    RGB: 0x1907,
    RGBA: 0x1908,
    LUMINANCE: 0x1909,
    LUMINANCE_ALPHA: 0x190a,
    DEPTH_COMPONENT: 0x1902,
    DEPTH_STENCIL: 0x84f9,

    // 内部格式
    R8: 0x8229,
    RG8: 0x822b,
    RGB8: 0x8051,
    RGBA8: 0x8058,
    SRGB8: 0x8c41,
    SRGB8_ALPHA8: 0x8c43,
    R16F: 0x822d,
    RG16F: 0x822f,
    RGB16F: 0x881b,
    RGBA16F: 0x881a,
    R32F: 0x822e,
    RG32F: 0x8230,
    RGB32F: 0x8815,
    RGBA32F: 0x8814,
    R11F_G11F_B10F: 0x8c3a,
    RGB9_E5: 0x8c1d,
    RGB10_A2: 0x8059,
    DEPTH_COMPONENT16: 0x81a5,
    DEPTH_COMPONENT24: 0x81a6,
    DEPTH_COMPONENT32F: 0x8cac,
    DEPTH24_STENCIL8: 0x88f0,
    DEPTH32F_STENCIL8: 0x8cad,

    // 纹理单元
    TEXTURE0: 0x84c0,

    // Framebuffer / Renderbuffer
    FRAMEBUFFER: 0x8d40,
    RENDERBUFFER: 0x8d41,
    COLOR_ATTACHMENT0: 0x8ce0,
    DEPTH_ATTACHMENT: 0x8d00,
    STENCIL_ATTACHMENT: 0x8d20,
    DEPTH_STENCIL_ATTACHMENT: 0x821a,
    FRAMEBUFFER_COMPLETE: 0x8cd5,
    COLOR_BUFFER_BIT: 0x00004000,
    DEPTH_BUFFER_BIT: 0x00000100,
    STENCIL_BUFFER_BIT: 0x00000400,

    // VAO
    VERTEX_ARRAY_BINDING: 0x85b5,

    // 错误码
    NO_ERROR: 0,
    INVALID_ENUM: 0x0500,
    INVALID_VALUE: 0x0501,
    INVALID_OPERATION: 0x0502,
    OUT_OF_MEMORY: 0x0505,
} as const;

// ---------------------------------------------------------------------------
// 类型别名
// ---------------------------------------------------------------------------

/** uniform 可接受值：标量 / 布尔 / 向量 / 矩阵 / 原生数组 */
export type UniformValue =
    | number
    | boolean
    | Vec2
    | Vec3
    | Vec4
    | Mat4
    | number[]
    | Float32Array
    | Int32Array;

/** 顶点数据载荷 */
export type BufferData =
    | number[]
    | Float32Array
    | Int32Array
    | Uint8Array
    | Uint16Array
    | Uint32Array
    | ArrayBufferView;

/** 顶点属性描述（构建 Geometry 使用） */
export interface AttributeInput {
    /** shader 中 attribute 名称 */
    name: string;
    /** 每顶点分量数；缺省按名称推断：position→3、normal→3、uv→2、color→4 */
    size?: number;
    /** 分量类型，默认 GL.FLOAT */
    type?: number;
    normalized?: boolean;
    /** 顶点间字节步长（紧凑数据可不填） */
    stride?: number;
    /** 首元素字节偏移 */
    offset?: number;
    /** >0 表示实例化属性（instancing），值为每实例步长 */
    divisor?: number;
    /** 数据；或直接复用已创建的 Buffer（同时传入时以 buffer 为准） */
    data?: BufferData;
    buffer?: Buffer;
    /** 动态数据建议 DYNAMIC_DRAW */
    usage?: number;
}

/** Geometry 构建参数 */
export interface GeometryOptions {
    attributes: AttributeInput[];
    /** 索引数据（缺省则按顺序绘制） */
    indices?: BufferData;
    /** 索引数据类型，默认 UNSIGNED_SHORT（>65535 顶点自动切换 UNSIGNED_INT） */
    indicesType?: number;
    /** 显式覆盖顶点个数（一般无需传） */
    count?: number;
    /** 默认绘制图元，默认 GL.TRIANGLES */
    mode?: number;
}

/** 单次 draw call 的管线状态覆盖（省略字段 = 使用 Renderer 默认状态） */
export interface DrawState {
    depthTest?: boolean;
    depthMask?: boolean;
    depthFunc?: number;
    /** 背面剔除 */
    cull?: boolean;
    cullFace?: number;
    frontFace?: number;
    blend?: boolean;
    blendSrc?: number;
    blendDst?: number;
    blendSrcAlpha?: number;
    blendDstAlpha?: number;
    /** RGBA 各通道写入开关 */
    colorMask?: readonly [boolean, boolean, boolean, boolean];
    lineWidth?: number;
    /** [factor, units] 多边形偏移 */
    polygonOffset?: readonly [number, number];
}

/** 单次 draw call 参数 */
export interface DrawOptions {
    /** 名称 -> uniform 值，自动做类型分发 */
    uniforms?: Record<string, UniformValue>;
    /** 名称 -> 贴图；渲染器自动分配纹理单元并写入采样器 uniform */
    textures?: Record<string, Texture>;
    /** >0 时执行 instanced draw */
    instances?: number;
    /** 覆盖 Geometry 默认图元 */
    mode?: number;
    /** 从第几个顶点/索引开始 */
    offset?: number;
    /** 覆盖绘制数量（默认整份 geometry） */
    count?: number;
    /** 管线状态覆盖（相对 Renderer.state 默认值） */
    state?: DrawState;
}

/** Renderer 创建参数 */
export interface RendererOptions {
    /** 默认 false（自实现无多余分配）；如需原生 MSAA 请置 true */
    antialias?: boolean;
    depth?: boolean;
    stencil?: boolean;
    alpha?: boolean;
    premultipliedAlpha?: boolean;
    preserveDrawingBuffer?: boolean;
    powerPreference?: 'default' | 'high-performance' | 'low-power';
    /** 自动跟随 canvas CSS 尺寸（默认 true，经 ResizeObserver） */
    autoResize?: boolean;
    /** 设备像素比上限，默认 Math.min(devicePixelRatio, 2) */
    pixelRatio?: number;
    /** 开发期打印警告（属性缺失等） */
    debug?: boolean;
}
