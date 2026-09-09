/**
 * Framebuffer —— 离屏渲染目标（render-to-texture / 后处理）
 *
 * - 颜色附件使用 Texture（可直接当采样贴图用）。
 * - 深度：默认 RBO；depthType='texture' 时创建可采样的深度贴图（阴影用）。
 * - resize 会重建附件，但持有 colorTexture / depthTexture 的对象引用不变。
 */
import { GL } from './types';
import { GLState } from './GLState';
import { Texture } from './Texture';

export interface FramebufferOptions {
    width: number;
    height: number;
    /** 颜色内部格式，默认 GL.RGBA8；HDR 后处理可用 GL.RGBA16F */
    colorInternalFormat?: number;
    /** 是否/如何创建深度附件：false 无，'rbo'（默认 true）或 'texture' */
    depth?: boolean | 'texture';
    /** 深度内部格式（depthType='texture' 时默认 DEPTH_COMPONENT24） */
    depthInternalFormat?: number;
}

export class Framebuffer {
    readonly gl: WebGL2RenderingContext;
    readonly fbo: WebGLFramebuffer;

    width: number;
    height: number;

    /** 颜色附件（离屏渲染结果，绑定前请先 texture.bind） */
    colorTexture: Texture;
    depthTexture: Texture | null = null;
    private depthRbo: WebGLRenderbuffer | null = null;

    constructor(gl: WebGL2RenderingContext, options: FramebufferOptions) {
        this.gl = gl;
        this.width = options.width;
        this.height = options.height;
        const fbo = gl.createFramebuffer();
        if (!fbo) throw new Error('WebGL: 无法创建 Framebuffer');
        this.fbo = fbo;

        this.colorTexture = Texture.empty(gl, this.width, this.height, {
            internalFormat: options.colorInternalFormat ?? GL.RGBA8,
            minFilter: GL.LINEAR,
            magFilter: GL.LINEAR,
            wrapS: GL.CLAMP_TO_EDGE,
            wrapT: GL.CLAMP_TO_EDGE,
        });

        const st = GLState.for(gl);
        st.bindFramebuffer(fbo);

        gl.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, this.colorTexture.texture, 0);

        const wantDepth = options.depth ?? true;
        if (wantDepth === 'texture') {
            this.depthTexture = Texture.empty(gl, this.width, this.height, {
                internalFormat: options.depthInternalFormat ?? GL.DEPTH_COMPONENT24,
                minFilter: GL.NEAREST,
                magFilter: GL.NEAREST,
            });
            gl.framebufferTexture2D(
                GL.FRAMEBUFFER,
                GL.DEPTH_ATTACHMENT,
                GL.TEXTURE_2D,
                this.depthTexture.texture,
                0,
            );
        } else if (wantDepth) {
            this.depthRbo = gl.createRenderbuffer();
            gl.bindRenderbuffer(GL.RENDERBUFFER, this.depthRbo);
            gl.renderbufferStorage(GL.RENDERBUFFER, GL.DEPTH_COMPONENT24, this.width, this.height);
            gl.framebufferRenderbuffer(GL.FRAMEBUFFER, GL.DEPTH_ATTACHMENT, GL.RENDERBUFFER, this.depthRbo);
        }

        this.checkStatus();
        // 还原到默认缓冲，避免影响后续操作
        st.bindFramebuffer(null);
    }

    private checkStatus(): void {
        const gl = this.gl;
        const status = gl.checkFramebufferStatus(GL.FRAMEBUFFER);
        if (status !== GL.FRAMEBUFFER_COMPLETE) {
            throw new Error(`Framebuffer 不完整: 0x${status.toString(16)}`);
        }
    }

    /** 绑定为渲染目标（之后所有绘制写入它） */
    bind(): void {
        const st = GLState.for(this.gl);
        st.bindFramebuffer(this.fbo);
        st.viewport(0, 0, this.width, this.height);
    }

    /** 解绑回到屏幕默认缓冲（调用方需自行设置 viewport） */
    unbind(): void {
        GLState.for(this.gl).bindFramebuffer(null);
    }

    /**
     * 调整尺寸并重建附件。
     * 传入的 colorTexture 是内部对象，重建后同引用仍可用。
     */
    resize(width: number, height: number): void {
        if (width === this.width && height === this.height) return;
        this.width = width;
        this.height = height;
        const gl = this.gl;
        const st = GLState.for(gl);
        st.bindFramebuffer(this.fbo);

        // 重建颜色附件
        this.colorTexture.allocate(null, width, height);
        gl.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, this.colorTexture.texture, 0);

        if (this.depthTexture) {
            this.depthTexture.allocate(null, width, height);
            gl.framebufferTexture2D(GL.FRAMEBUFFER, GL.DEPTH_ATTACHMENT, GL.TEXTURE_2D, this.depthTexture.texture, 0);
        } else if (this.depthRbo) {
            gl.bindRenderbuffer(GL.RENDERBUFFER, this.depthRbo);
            gl.renderbufferStorage(GL.RENDERBUFFER, GL.DEPTH_COMPONENT24, width, height);
        }
        this.checkStatus();
    }

    /** 读取像素（RGBA / UNSIGNED_BYTE），返回 Uint8Array */
    readPixels(x = 0, y = 0, width = this.width, height = this.height): Uint8Array {
        const gl = this.gl;
        const st = GLState.for(gl);
        st.bindFramebuffer(this.fbo);
        const out = new Uint8Array(width * height * 4);
        gl.readPixels(x, y, width, height, GL.RGBA, GL.UNSIGNED_BYTE, out);
        st.bindFramebuffer(null);
        return out;
    }

    dispose(): void {
        const gl = this.gl;
        if (this.depthRbo) gl.deleteRenderbuffer(this.depthRbo);
        this.depthTexture?.dispose();
        this.colorTexture.dispose();
        gl.deleteFramebuffer(this.fbo);
    }
}
