/**
 * Buffer —— WebGL2 Buffer 封装
 *
 * 自动区分 TypedArray / number[] 计算字节数；
 * 更新时若容量不足自动 realloc，否则走 bufferSubData（避免 GPU 侧重建）。
 */
import { GL, type BufferData } from './types';
import { GLState } from './GLState';

export class Buffer {
    readonly gl: WebGL2RenderingContext;
    readonly target: number;
    readonly handle: WebGLBuffer;
    usage: number;

    /** 已分配的字节数 */
    byteLength = 0;

    constructor(
        gl: WebGL2RenderingContext,
        target: number = GL.ARRAY_BUFFER,
        data?: BufferData,
        usage: number = GL.STATIC_DRAW,
    ) {
        this.gl = gl;
        this.target = target;
        this.usage = usage;
        const handle = gl.createBuffer();
        if (!handle) throw new Error('WebGL: 无法创建 Buffer');
        this.handle = handle;
        if (data !== undefined) this.upload(data, usage);
    }

    // ---- 静态便捷工厂 ------------------------------------------------------

    static array(gl: WebGL2RenderingContext, data?: BufferData, usage?: number): Buffer {
        return new Buffer(gl, GL.ARRAY_BUFFER, data, usage ?? GL.STATIC_DRAW);
    }

    static element(gl: WebGL2RenderingContext, data?: BufferData, usage?: number): Buffer {
        return new Buffer(gl, GL.ELEMENT_ARRAY_BUFFER, data, usage ?? GL.STATIC_DRAW);
    }

    // ---- 上传 ---------------------------------------------------------------

    private bind(): void {
        GLState.for(this.gl).bindBuffer(this.target, this.handle);
    }

    /** 整体上传（必要时扩容重建） */
    upload(data: BufferData, usage = this.usage): this {
        const byteLength = byteSizeOf(data);
        this.usage = usage;
        this.bind();
        const gl = this.gl;
        if (ArrayBuffer.isView(data)) {
            gl.bufferData(this.target, data as ArrayBufferView, usage);
        } else {
            gl.bufferData(this.target, new Float32Array(data), usage);
        }
        this.byteLength = byteLength;
        return this;
    }

    /** 部分更新 [offset, offset+length)。容量不足时自动整体重建 */
    update(data: BufferData, offset = 0): this {
        const byteLength = byteSizeOf(data);
        const gl = this.gl;
        if (offset + byteLength > this.byteLength) {
            this.upload(data);
            return this;
        }
        this.bind();
        if (ArrayBuffer.isView(data)) {
            gl.bufferSubData(this.target, offset, data as ArrayBufferView);
        } else {
            gl.bufferSubData(this.target, offset, new Float32Array(data));
        }
        return this;
    }

    dispose(): void {
        this.gl.deleteBuffer(this.handle);
        this.byteLength = 0;
    }
}

/** 计算数据字节数；纯 number[] 按 Float32(4 字节) 处理 */
function byteSizeOf(data: BufferData): number {
    if (ArrayBuffer.isView(data)) return data.byteLength;
    return data.length * 4;
}
