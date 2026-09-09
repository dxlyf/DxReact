/**
 * Geometry —— 顶点集合 + 索引 + VAO 管理
 *
 * - VAO 按 (geometry, program) 惰性构建并缓存，天然兼容不同 program
 *   的属性 location 不一致的情况。
 * - 支持实例化属性（divisor>0）、索引 / 非索引、动态更新。
 */
import { GL, type BufferData, type GeometryOptions } from './types';
import { Buffer } from './Buffer';
import { GLState } from './GLState';
import type { Program } from './Program';

interface Attr {
    name: string;
    size: number;
    type: number;
    normalized: boolean;
    stride: number;
    offset: number;
    divisor: number;
    buffer: Buffer;
}

export class Geometry {
    readonly gl: WebGL2RenderingContext;
    readonly attrs: Attr[] = [];
    indexBuffer: Buffer | null = null;
    indexType: number = GL.UNSIGNED_SHORT;
    indexCount = 0;
    /** 顶点数（非索引绘制） */
    vertexCount = 0;
    /** 索引数（索引绘制） */
    mode: number = GL.TRIANGLES;

    private indexMode = false;
    private vaoCache = new Map<Program, WebGLVertexArrayObject>();

    constructor(gl: WebGL2RenderingContext, options: GeometryOptions) {
        this.gl = gl;
        if (options.mode !== undefined) this.mode = options.mode;

        let firstByteLength = 0;
        for (const input of options.attributes) {
            const size = input.size ?? guessSize(input.name);
            if (!size) {
                throw new Error(`Geometry 属性 "${input.name}" 无法推断 size，请显式指定 size。`);
            }
            const type = input.type ?? GL.FLOAT;
            const normalized = input.normalized ?? false;
            const compBytes = bytesPerComponent(type);
            const stride = input.stride ?? 0;
            const offset = input.offset ?? 0;

            let buffer = input.buffer;
            if (!buffer) {
                if (!input.data) throw new Error(`Geometry 属性 "${input.name}" 缺少 data 或 buffer。`);
                buffer = new Buffer(gl, GL.ARRAY_BUFFER, input.data, input.usage ?? GL.STATIC_DRAW);
            }

            const attr: Attr = {
                name: input.name,
                size,
                type,
                normalized,
                stride: stride === 0 ? size * compBytes : stride,
                offset,
                divisor: input.divisor ?? 0,
                buffer,
            };
            this.attrs.push(attr);
            if (firstByteLength === 0) firstByteLength = buffer.byteLength;
        }

        if (options.indices !== undefined) {
            const { typed, type } = toIndexArray(options.indices, options.indicesType);
            this.indexBuffer = new Buffer(gl, GL.ELEMENT_ARRAY_BUFFER, typed, GL.STATIC_DRAW);
            this.indexType = type;
            this.indexCount = typed.length;
            this.indexMode = true;
        }

        if (options.count !== undefined) {
            this.vertexCount = options.count;
        } else if (this.indexMode) {
            this.vertexCount = this.indexCount;
        } else if (this.attrs.length > 0 && this.attrs[0].divisor === 0) {
            const a = this.attrs[0];
            const stride = a.stride || a.size * bytesPerComponent(a.type);
            this.vertexCount = stride > 0 ? Math.floor(a.buffer.byteLength / stride) : 0;
        }
    }

    // ---- 查询 ---------------------------------------------------------------

    isIndexed(): boolean {
        return this.indexMode;
    }

    /** 默认 draw 顶点/索引个数 */
    drawCount(): number {
        return this.indexMode ? this.indexCount : this.vertexCount;
    }

    attribute(name: string): Attr | undefined {
        return this.attrs.find((a) => a.name === name);
    }

    // ---- 动态更新 -----------------------------------------------------------

    /**
     * 更新顶点数据；数据总长（size*count*字节数）变化会导致 realloc，
     * 未变化时走 bufferSubData。
     */
    setAttributeData(name: string, data: BufferData): this {
        const attr = this.attribute(name);
        if (!attr) throw new Error(`Geometry 不存在属性 "${name}"`);
        const oldLen = attr.buffer.byteLength;
        attr.buffer.upload(data, attr.buffer.usage);
        if (!this.indexMode && attr.divisor === 0 && oldLen !== attr.buffer.byteLength) {
            const stride = attr.stride || attr.size * bytesPerComponent(attr.type);
            this.vertexCount = stride > 0 ? Math.floor(attr.buffer.byteLength / stride) : 0;
        }
        return this;
    }

    updateIndices(data: BufferData): this {
        const { typed, type } = toIndexArray(data, this.indexType);
        if (!this.indexBuffer) {
            this.indexBuffer = new Buffer(this.gl, GL.ELEMENT_ARRAY_BUFFER, typed, GL.STATIC_DRAW);
        } else {
            this.indexBuffer.upload(typed, this.indexBuffer.usage);
        }
        this.indexType = type;
        this.indexCount = typed.length;
        this.indexMode = true;
        if (this.attrs.length && this.attrs[0].divisor === 0) {
            this.vertexCount = this.indexCount;
        }
        return this;
    }

    // ---- VAO 绑定 -----------------------------------------------------------

    /** 绑定（含按需构建）该几何体配合指定 program 的 VAO */
    bind(program: Program, state?: GLState): WebGLVertexArrayObject {
        const gl = this.gl;
        const st = state ?? GLState.for(gl);
        let vao = this.vaoCache.get(program);
        if (!vao) {
            vao = this.buildVAO(program, st);
            this.vaoCache.set(program, vao);
        }
        st.bindVertexArray(vao);
        return vao;
    }

    private buildVAO(program: Program, st: GLState): WebGLVertexArrayObject {
        const gl = this.gl;
        const vao = gl.createVertexArray();
        if (!vao) throw new Error('WebGL: 无法创建 VAO');
        st.bindVertexArray(vao);

        for (const attr of this.attrs) {
            const loc = program.getAttribLocation(attr.name);
            if (loc < 0) continue; // 该 program 未使用此属性
            st.bindBuffer(GL.ARRAY_BUFFER, attr.buffer.handle);
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, attr.size, attr.type, attr.normalized, attr.stride, attr.offset);
            if (attr.divisor > 0) gl.vertexAttribDivisor(loc, attr.divisor);
        }

        if (this.indexBuffer) {
            // ELEMENT_ARRAY_BUFFER 属于 VAO 状态，必须在 VAO 绑定时指定
            st.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indexBuffer.handle);
        }
        return vao;
    }

    dispose(): void {
        const gl = this.gl;
        for (const vao of this.vaoCache.values()) gl.deleteVertexArray(vao);
        this.vaoCache.clear();
        for (const attr of this.attrs) attr.buffer.dispose();
        this.indexBuffer?.dispose();
    }

    // -----------------------------------------------------------------------
    // 常用图元构建器（返回全新 Geometry）
    // -----------------------------------------------------------------------

    /** 中心在原点、法线 +Z 的 XY 平面 quad（做 billboard / 全屏贴图很方便） */
    static quad(gl: WebGL2RenderingContext, opts?: { width?: number; height?: number }): Geometry {
        const w = (opts?.width ?? 1) / 2;
        const h = (opts?.height ?? 1) / 2;
        const positions = [-w, -h, 0, w, -h, 0, -w, h, 0, w, h, 0];
        const normals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
        const uvs = [0, 0, 1, 0, 0, 1, 1, 1];
        return new Geometry(gl, {
            attributes: [
                { name: 'a_position', size: 3, data: positions },
                { name: 'a_normal', size: 3, data: normals },
                { name: 'a_uv', size: 2, data: uvs },
            ],
            indices: [0, 1, 3, 0, 3, 2],
            mode: GL.TRIANGLES,
        });
    }

    /** 中心在原点、法线 +Y 的 XZ 平面（地面/水面），width×depth */
    static plane(
        gl: WebGL2RenderingContext,
        opts?: { width?: number; depth?: number; segments?: number },
    ): Geometry {
        const w = opts?.width ?? 1;
        const d = opts?.depth ?? 1;
        const seg = opts?.segments ?? 1;
        const cols = seg;
        const rows = seg;
        const positions: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];
        for (let r = 0; r <= rows; r++) {
            const z = -d / 2 + (r / rows) * d;
            for (let c = 0; c <= cols; c++) {
                const x = -w / 2 + (c / cols) * w;
                positions.push(x, 0, z);
                uvs.push(c / cols, 1 - r / rows);
            }
        }
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const a = r * (cols + 1) + c;
                const b = a + 1;
                const cc = a + cols + 1;
                const dd = cc + 1;
                // 法线 +Y 需逆时针
                indices.push(a, cc, b, cc, dd, b);
            }
        }
        return new Geometry(gl, {
            attributes: [
                { name: 'a_position', size: 3, data: positions },
                { name: 'a_uv', size: 2, data: uvs },
            ],
            indices,
            mode: GL.TRIANGLES,
        });
    }

    /** 中心在原点、各面独立顶点的 box（法线平滑正确） */
    static box(
        gl: WebGL2RenderingContext,
        opts?: { width?: number; height?: number; depth?: number },
    ): Geometry {
        const hw = (opts?.width ?? 1) / 2;
        const hh = (opts?.height ?? 1) / 2;
        const hd = (opts?.depth ?? 1) / 2;
        const positions: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];
        // 6 个面：轴 + 符号（half 分量 = ±半长），其余两轴遍历 4 角
        const faces = [
            { axis: 0, sign: 1, a: 1, b: 2 },
            { axis: 0, sign: -1, a: 2, b: 1 },
            { axis: 1, sign: 1, a: 0, b: 2 },
            { axis: 1, sign: -1, a: 2, b: 0 },
            { axis: 2, sign: 1, a: 0, b: 1 },
            { axis: 2, sign: -1, a: 1, b: 0 },
        ];
        const half = [hw, hh, hd];
        for (const f of faces) {
            const base = positions.length / 3;
            const n = [0, 0, 0];
            n[f.axis] = f.sign;
            const hA = half[f.a];
            const hB = half[f.b];
            const corners = [
                [1, 1],
                [-1, 1],
                [-1, -1],
                [1, -1],
            ];
            for (const [sa, sb] of corners) {
                const p = [0, 0, 0];
                p[f.axis] = f.sign * half[f.axis];
                p[f.a] = sa * hA;
                p[f.b] = sb * hB;
                positions.push(p[0], p[1], p[2]);
                normals.push(n[0], n[1], n[2]);
            }
            uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
            // 默认按 CCW 分割（对角线 0-2），随后统一校正为朝外
            indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }
        ensureOutward(positions, indices);
        return new Geometry(gl, {
            attributes: [
                { name: 'a_position', size: 3, data: positions },
                { name: 'a_normal', size: 3, data: normals },
                { name: 'a_uv', size: 2, data: uvs },
            ],
            indices,
            mode: GL.TRIANGLES,
        });
    }

    /** 中心在原点的经纬球；宽度=经线段数，高度=纬线段数 */
    static sphere(
        gl: WebGL2RenderingContext,
        opts?: { radius?: number; widthSegments?: number; heightSegments?: number },
    ): Geometry {
        const radius = opts?.radius ?? 1;
        const ws = Math.max(3, Math.floor(opts?.widthSegments ?? 32));
        const hs = Math.max(2, Math.floor(opts?.heightSegments ?? 16));
        const positions: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];
        for (let r = 0; r <= hs; r++) {
            const phi = (r / hs) * Math.PI; // 0(顶部) .. PI(底部)
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);
            for (let c = 0; c <= ws; c++) {
                const theta = (c / ws) * Math.PI * 2;
                const nx = sinPhi * Math.cos(theta);
                const ny = cosPhi;
                const nz = sinPhi * Math.sin(theta);
                positions.push(nx * radius, ny * radius, nz * radius);
                normals.push(nx, ny, nz);
                uvs.push(c / ws, 1 - r / hs);
            }
        }
        const stride = ws + 1;
        for (let r = 0; r < hs; r++) {
            for (let c = 0; c < ws; c++) {
                const a = r * stride + c;
                const b = a + 1;
                const cc = a + stride;
                const dd = cc + 1;
                indices.push(a, cc, b, b, cc, dd);
            }
        }
        ensureOutward(positions, indices);
        return new Geometry(gl, {
            attributes: [
                { name: 'a_position', size: 3, data: positions },
                { name: 'a_normal', size: 3, data: normals },
                { name: 'a_uv', size: 2, data: uvs },
            ],
            indices,
            mode: GL.TRIANGLES,
        });
    }

    /** 线段集合：每两个顶点连一条线（属性 a_position/a_color 可选） */
    static lines(
        gl: WebGL2RenderingContext,
        positions: number[],
        colors?: number[],
    ): Geometry {
        const attrs: GeometryOptions['attributes'] = [{ name: 'a_position', size: 3, data: positions }];
        if (colors) attrs.push({ name: 'a_color', size: colors.length / (positions.length / 3), data: colors });
        return new Geometry(gl, { attributes: attrs, mode: GL.LINES });
    }

    /** 点集合 */
    static points(gl: WebGL2RenderingContext, positions: number[], colors?: number[]): Geometry {
        const attrs: GeometryOptions['attributes'] = [{ name: 'a_position', size: 3, data: positions }];
        if (colors) attrs.push({ name: 'a_color', size: colors.length / (positions.length / 3), data: colors });
        return new Geometry(gl, { attributes: attrs, mode: GL.POINTS });
    }
}

/**
 * 将全部三角形校正为“从原点看向三角形中心的方向为法线方向”：
 * 适合球体、box 等中心在原点且为凸体的模型，防止绕序出错导致面被剔除。
 */
function ensureOutward(positions: number[], indices: number[]): void {
    for (let i = 0; i < indices.length; i += 3) {
        const i0 = indices[i];
        const i1 = indices[i + 1];
        const i2 = indices[i + 2];
        const ax = positions[i0 * 3];
        const ay = positions[i0 * 3 + 1];
        const az = positions[i0 * 3 + 2];
        const bx = positions[i1 * 3];
        const by = positions[i1 * 3 + 1];
        const bz = positions[i1 * 3 + 2];
        const cx = positions[i2 * 3];
        const cy = positions[i2 * 3 + 1];
        const cz = positions[i2 * 3 + 2];
        // cross((b-a),(c-a))
        const e1x = bx - ax;
        const e1y = by - ay;
        const e1z = bz - az;
        const e2x = cx - ax;
        const e2y = cy - ay;
        const e2z = cz - az;
        const nx = e1y * e2z - e1z * e2y;
        const ny = e1z * e2x - e1x * e2z;
        const nz = e1x * e2y - e1y * e2x;
        // 朝外参考方向：三角形中心向量
        const ox = ax + bx + cx;
        const oy = ay + by + cy;
        const oz = az + bz + cz;
        if (nx * ox + ny * oy + nz * oz < 0) {
            indices[i + 1] = i2;
            indices[i + 2] = i1;
        }
    }
}

// ---------------------------------------------------------------------------
// 辅助函数
// ---------------------------------------------------------------------------

function bytesPerComponent(type: number): number {
    switch (type) {
        case GL.BYTE:
        case GL.UNSIGNED_BYTE:
            return 1;
        case GL.SHORT:
        case GL.UNSIGNED_SHORT:
        case GL.HALF_FLOAT:
            return 2;
        case GL.INT:
        case GL.UNSIGNED_INT:
        case GL.FLOAT:
        default:
            return 4;
    }
}

/** 按通用命名猜测 size（2D uv / 3D position 等） */
function guessSize(name: string): number {
    const lower = name.toLowerCase();
    if (/(uv|texcoord|tex_coord|st|xy$)/.test(lower)) return 2;
    if (/(color|colour|rgba|bgra)/.test(lower)) return 4;
    if (/(pos|position|normal|vertex|xyz)/.test(lower)) return 3;
    return 0;
}

/** 把任意索引数据规整为无符号整型数组 */
function toIndexArray(data: BufferData, preferredType?: number): { typed: Uint8Array | Uint16Array | Uint32Array; type: number } {
    if (ArrayBuffer.isView(data) && data instanceof Uint16Array) return { typed: data, type: GL.UNSIGNED_SHORT };
    if (ArrayBuffer.isView(data) && data instanceof Uint32Array) return { typed: data, type: GL.UNSIGNED_INT };
    if (ArrayBuffer.isView(data) && data instanceof Uint8Array) return { typed: data, type: GL.UNSIGNED_BYTE };
    const nums = Array.isArray(data) ? data : Array.from(data as ArrayLike<number>);
    const max = nums.length ? Math.max(...nums) : 0;
    if (preferredType === GL.UNSIGNED_INT || max > 65535) {
        return { typed: Uint32Array.from(nums), type: GL.UNSIGNED_INT };
    }
    if (preferredType === GL.UNSIGNED_BYTE || max <= 255) {
        return { typed: Uint8Array.from(nums), type: GL.UNSIGNED_BYTE };
    }
    return { typed: Uint16Array.from(nums), type: GL.UNSIGNED_SHORT };
}
