/**
 * UniformBuffer —— UBO 封装（相机等每帧共享数据）
 *
 * 数据以 Float32Array 形式维护，支持局部更新 + 上传，避免每帧全量传输。
 * 需要 std140 内存布局时请参考对应块定义（见 Camera.ts 中 SceneCamera 布局）。
 */
import { GL } from './types';
import { GLState } from './GLState';

export class UniformBuffer {
    readonly gl: WebGL2RenderingContext;
    readonly handle: WebGLBuffer;
    data: Float32Array;

    constructor(gl: WebGL2RenderingContext, elementCountOrData: number | ArrayLike<number>, usage: number = GL.DYNAMIC_DRAW) {
        this.gl = gl;
        const handle = gl.createBuffer();
        if (!handle) throw new Error('WebGL: 无法创建 UniformBuffer');
        this.handle = handle;
        const initial =
            typeof elementCountOrData === 'number'
                ? new Float32Array(elementCountOrData)
                : Float32Array.from(elementCountOrData);
        this.data = initial;
        const state = GLState.for(gl);
        state.bindBuffer(GL.UNIFORM_BUFFER, handle);
        gl.bufferData(GL.UNIFORM_BUFFER, initial, usage);
    }

    /** 上传整块数据 */
    upload(usage?: number): this {
        const state = GLState.for(this.gl);
        state.bindBuffer(GL.UNIFORM_BUFFER, this.handle);
        this.gl.bufferData(GL.UNIFORM_BUFFER, this.data, usage ?? this.usageHint);
        return this;
    }

    private usageHint = GL.DYNAMIC_DRAW;

    /** 部分更新（字节偏移） */
    updateSubData(data: Float32Array | ArrayLike<number>, byteOffset: number): this {
        const state = GLState.for(this.gl);
        state.bindBuffer(GL.UNIFORM_BUFFER, this.handle);
        this.gl.bufferSubData(GL.UNIFORM_BUFFER, byteOffset, Float32Array.from(data));
        return this;
    }

    /** 整体（或子区间）同步后上传。sameRange=true 时走 subData，更快 */
    commit(byteOffset = 0, byteLength?: number): this {
        const state = GLState.for(this.gl);
        state.bindBuffer(GL.UNIFORM_BUFFER, this.handle);
        if (byteOffset === 0 && (byteLength === undefined || byteLength === this.data.byteLength)) {
            this.gl.bufferData(GL.UNIFORM_BUFFER, this.data, this.usageHint);
        } else {
            const len = byteLength ?? this.data.byteLength - byteOffset;
            this.gl.bufferSubData(GL.UNIFORM_BUFFER, byteOffset, this.data, byteOffset / 4, len / 4);
        }
        return this;
    }

    /** 绑定到指定绑定点（供 gl.uniformBlockBinding 索引使用） */
    bindBase(index: number): this {
        GLState.for(this.gl).bindUBOBase(index, this.handle);
        return this;
    }

    dispose(): void {
        this.gl.deleteBuffer(this.handle);
    }
}
