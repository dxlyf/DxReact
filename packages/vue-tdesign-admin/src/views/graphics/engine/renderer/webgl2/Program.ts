/**
 * Program —— WebGL2 着色器程序
 *
 * 特点：
 * - 编译链接 + 完整诊断信息。
 * - 自动收集 uniform 类型元数据，setUniform 按 GLSL 类型自动分发，
 *   无需用户区分 uniform1f / uniformMatrix4fv。
 * - uniform location 缓存，避免每帧重复 getUniformLocation。
 * - 自动识别 SceneCamera uniform block，供 Renderer 绑定相机 UBO。
 * - 自动为 fragment shader 补充精度声明（若缺失）。
 */
import type { Mat4, Vec2, Vec3, Vec4 } from './math';
import { GL } from './types';

export type UniformInput =
    | number
    | boolean
    | Vec2
    | Vec3
    | Vec4
    | Mat4
    | number[]
    | Float32Array
    | Int32Array;

export interface UniformMeta {
    /** shader 中声明的名字（去掉 [0] 后缀） */
    name: string;
    type: number;
    /** 元素个数（>1 表示数组） */
    size: number;
    location: WebGLUniformLocation | null;
}

interface Kind {
    /** 分量数：1=标量，2..4=向量 */
    c?: number;
    /** [列, 行] */
    mat?: [number, number];
    isInt?: boolean;
    isBool?: boolean;
    isSampler?: boolean;
}

const KIND: Record<number, Kind> = {
    [GL.FLOAT]: { c: 1 },
    [GL.INT]: { c: 1, isInt: true },
    [GL.UNSIGNED_INT]: { c: 1, isInt: true },
    0x8b50: { c: 2 }, // FLOAT_VEC2
    0x8b51: { c: 3 }, // FLOAT_VEC3
    0x8b52: { c: 4 }, // FLOAT_VEC4
    0x8b53: { c: 2, isInt: true }, // INT_VEC2
    0x8b54: { c: 3, isInt: true },
    0x8b55: { c: 4, isInt: true },
    0x8b56: { c: 1, isBool: true }, // BOOL
    0x8b57: { c: 2, isBool: true },
    0x8b58: { c: 3, isBool: true },
    0x8b59: { c: 4, isBool: true },
    0x8b5a: { mat: [2, 2] }, // FLOAT_MAT2
    0x8b5b: { mat: [3, 3] }, // FLOAT_MAT3
    0x8b5c: { mat: [4, 4] }, // FLOAT_MAT4
    // 其余非方阵 [列, 行]：FLOAT_MAT2x3 即 2 列 3 行
    0x8b65: { mat: [2, 3] },
    0x8b66: { mat: [2, 4] },
    0x8b67: { mat: [3, 2] },
    0x8b68: { mat: [3, 4] },
    0x8b69: { mat: [4, 2] },
    0x8b6a: { mat: [4, 3] },
    0x8b5e: { c: 1, isInt: true, isSampler: true }, // SAMPLER_2D
    0x8b5f: { c: 1, isInt: true, isSampler: true }, // SAMPLER_3D
    0x8b60: { c: 1, isInt: true, isSampler: true }, // SAMPLER_CUBE
    0x8dc1: { c: 1, isInt: true, isSampler: true }, // SAMPLER_2D_ARRAY
    0x8dc2: { c: 1, isInt: true, isSampler: true }, // SAMPLER_2D_ARRAY_SHADOW
    0x8dc3: { c: 1, isInt: true, isSampler: true }, // SAMPLER_CUBE_SHADOW
    0x8dc4: { c: 1, isInt: true, isSampler: true }, // INT_SAMPLER_2D
    0x8dca: { c: 1, isInt: true, isSampler: true }, // UNSIGNED_INT_SAMPLER_2D
    0x8ddd: { c: 1, isInt: true, isSampler: true }, // SAMPLER_2D_SHADOW
};

const SAMPLER_UNIFORM_BLOCK = 'SceneCamera';

export class Program {
    readonly gl: WebGL2RenderingContext;
    readonly program: WebGLProgram;

    private vertex: WebGLShader;
    private fragment: WebGLShader;

    /** name(base) -> meta */
    private uniforms = new Map<string, UniformMeta>();
    private samplerUniforms: UniformMeta[] = [];
    private attribLocations = new Map<string, number>();

    /** SceneCamera uniform block 的索引，-1 表示未使用 */
    cameraBlockIndex = -1;

    /** 已绑定的相机 UBO 绑定点（由 Renderer 负责上传） */
    cameraBindingPoint = 0;

    constructor(
        gl: WebGL2RenderingContext,
        vertexSource: string,
        fragmentSource: string,
        options?: { debug?: boolean },
    ) {
        this.gl = gl;
        this.vertex = Program.compileShader(gl, gl.VERTEX_SHADER, vertexSource);
        this.fragment = Program.compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

        const program = gl.createProgram();
        if (!program) throw new Error('WebGL: 无法创建 Program');
        this.program = program;
        gl.attachShader(program, this.vertex);
        gl.attachShader(program, this.fragment);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const log = gl.getProgramInfoLog(program) ?? 'unknown error';
            gl.deleteShader(this.vertex);
            gl.deleteShader(this.fragment);
            gl.deleteProgram(program);
            throw new Error(`Program 链接失败:\n${log}`);
        }
        gl.deleteShader(this.vertex);
        gl.deleteShader(this.fragment);

        this.collectUniforms();
        this.cameraBlockIndex = gl.getUniformBlockIndex(program, SAMPLER_UNIFORM_BLOCK);
        if (this.cameraBlockIndex !== -1) {
            gl.uniformBlockBinding(program, this.cameraBlockIndex, this.cameraBindingPoint);
        }
        void options;
    }

    // ---- 编译 ---------------------------------------------------------------

    static compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
        let src = source;
        // 为 fragment shader 补充精度（WebGL2 下 fragment 无默认 float 精度）
        if (type === gl.FRAGMENT_SHADER && !/precision\s+(?:highp|mediump|lowp)/.test(src)) {
            const idx = src.indexOf('\n');
            const insertAt = idx === -1 ? 0 : idx + 1;
            src = src.slice(0, insertAt) + 'precision highp float;\nprecision highp int;\n' + src.slice(insertAt);
        }
        const shader = gl.createShader(type);
        if (!shader) throw new Error('WebGL: 无法创建 shader');
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const log = gl.getShaderInfoLog(shader) ?? 'unknown error';
            gl.deleteShader(shader);
            const kind = type === gl.VERTEX_SHADER ? 'vertex' : 'fragment';
            throw new Error(`${kind} shader 编译失败:\n${log}`);
        }
        return shader;
    }

    /** 便捷：一键从源码创建 Program */
    static create(gl: WebGL2RenderingContext, vertex: string, fragment: string, debug?: boolean): Program {
        return new Program(gl, vertex, fragment, { debug });
    }

    // ---- 元数据 -------------------------------------------------------------

    private collectUniforms(): void {
        const gl = this.gl;
        const count = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS) as number;
        for (let i = 0; i < count; i++) {
            const info = gl.getActiveUniform(this.program, i);
            if (!info) continue;
            if (info.name.startsWith('gl_')) continue;
            // 数组活动名形如 "u_colors[0]"，统一用基础名记录
            const base = info.name.replace(/\[\d+\]$/, '');
            if (this.uniforms.has(base)) continue;
            const location = gl.getUniformLocation(this.program, base);
            const kind = KIND[info.type] ?? { c: 1, isInt: true };
            const meta: UniformMeta = {
                name: base,
                type: info.type,
                size: info.size,
                location,
            };
            this.uniforms.set(base, meta);
            if (kind.isSampler) this.samplerUniforms.push(meta);
        }
    }

    hasUniform(name: string): boolean {
        return this.uniforms.has(name);
    }

    getUniform(name: string): UniformMeta | null {
        return this.uniforms.get(name) ?? null;
    }

    /** 所有 sampler uniform（按声明顺序），Renderer 据此分配纹理单元 */
    samplers(): readonly UniformMeta[] {
        return this.samplerUniforms;
    }

    /** attribute location（带缓存） */
    getAttribLocation(name: string): number {
        const hit = this.attribLocations.get(name);
        if (hit !== undefined) return hit;
        const loc = this.gl.getAttribLocation(this.program, name);
        this.attribLocations.set(name, loc);
        return loc;
    }

    // ---- Uniform -----------------------------------------------------------

    /**
     * 设置 uniform。类型自动分发：
     * number/bool → 按 GLSL 声明决定 int 或 float；
     * 数组/向量 → 自动展开；Mat4 → uniformMatrix4fv。
     */
    setUniform(name: string, value: UniformInput): void {
        const meta = this.uniforms.get(name);
        if (!meta || !meta.location) return;
        const kind = KIND[meta.type] ?? { c: 1, isInt: true };
        const arr = toNumberArray(value);
        const gl = this.gl;
        const loc = meta.location;

        if (kind.isSampler || kind.isInt || kind.isBool) {
            const intArr = arr.map((v) => (v ? 1 : 0));
            if (kind.c === 1) gl.uniform1iv(loc, intArr);
            else if (kind.c === 2) gl.uniform2iv(loc, intArr);
            else if (kind.c === 3) gl.uniform3iv(loc, intArr);
            else gl.uniform4iv(loc, intArr);
            return;
        }

        if (kind.mat) {
            const cols = kind.mat[0];
            const rows = kind.mat[1];
            if (cols === 2 && rows === 2) gl.uniformMatrix2fv(loc, false, arr);
            else if (cols === 3 && rows === 3) gl.uniformMatrix3fv(loc, false, arr);
            else if (cols === 4 && rows === 4) gl.uniformMatrix4fv(loc, false, arr);
            else if (cols === 2 && rows === 3) gl.uniformMatrix2x3fv(loc, false, arr);
            else if (cols === 3 && rows === 2) gl.uniformMatrix3x2fv(loc, false, arr);
            else if (cols === 2 && rows === 4) gl.uniformMatrix2x4fv(loc, false, arr);
            else if (cols === 4 && rows === 2) gl.uniformMatrix4x2fv(loc, false, arr);
            else if (cols === 3 && rows === 4) gl.uniformMatrix3x4fv(loc, false, arr);
            else if (cols === 4 && rows === 3) gl.uniformMatrix4x3fv(loc, false, arr);
            return;
        }

        const c = kind.c ?? 1;
        if (c === 1) gl.uniform1fv(loc, arr);
        else if (c === 2) gl.uniform2fv(loc, arr);
        else if (c === 3) gl.uniform3fv(loc, arr);
        else if (c === 4) gl.uniform4fv(loc, arr);
    }

    dispose(): void {
        this.gl.deleteProgram(this.program);
    }
}

/** 把各类 uniform 值规整为纯数字数组 */
function toNumberArray(v: UniformInput): number[] {
    if (typeof v === 'number') return [v];
    if (typeof v === 'boolean') return [v ? 1 : 0];
    if (ArrayBuffer.isView(v)) return Array.from(v as Float32Array);
    if (Array.isArray(v)) return v;
    const obj = v as { e?: ArrayLike<number>; toArray?: (out?: number[]) => number[] };
    if (obj?.toArray) return obj.toArray();
    if (obj?.e) return Array.from(obj.e);
    return [Number(v)];
}
