import type { Device } from "./device";
import type { IResource } from "./resource";
import { Sampler } from "./sampler";

/**
 * GPU 纹理封装（对应 GPUTexture）
 * - 尺寸/格式等元数据从原生对象回读，避免解析 descriptor.size 联合类型
 * - 默认创建一个覆盖全部子资源的 view，便于直接用于绑定
 * - 提供 fromData 一步建纹理并上传、computeMipLevelCount / generateMipmaps 处理 mip 链
 */

/** 各纹素格式的字节大小（未压缩常见格式；未列出的按 4 字节估算） */
const TEXTURE_FORMAT_BYTE_SIZE: Partial<Record<GPUTextureFormat, number>> = {
    r8unorm: 1, r8snorm: 1, r8uint: 1, r8sint: 1,
    r16unorm: 2, r16snorm: 2, r16uint: 2, r16sint: 2, r16float: 2,
    rg8unorm: 2, rg8snorm: 2, rg8uint: 2, rg8sint: 2,
    r32uint: 4, r32sint: 4, r32float: 4,
    rg16unorm: 4, rg16snorm: 4, rg16uint: 4, rg16sint: 4, rg16float: 4,
    rgba8unorm: 4, 'rgba8unorm-srgb': 4, rgba8snorm: 4, rgba8uint: 4, rgba8sint: 4,
    bgra8unorm: 4, 'bgra8unorm-srgb': 4,
    rgb9e5ufloat: 4, rgb10a2uint: 4, rgb10a2unorm: 4, rg11b10ufloat: 4,
    rg32uint: 8, rg32sint: 8, rg32float: 8,
    rgba16unorm: 8, rgba16snorm: 8, rgba16uint: 8, rgba16sint: 8, rgba16float: 8,
    rgba32uint: 16, rgba32sint: 16, rgba32float: 16,
}

/** 查询纹素格式的字节大小 */
export function computeTexelByteSize(format: GPUTextureFormat): number {
    return TEXTURE_FORMAT_BYTE_SIZE[format] ?? 4
}

export interface TextureFromDataOptions {
    data: GPUAllowSharedBufferSource
    width: number
    height: number
    /** 纹理格式，缺省 rgba8unorm */
    format?: GPUTextureFormat
    /** 用途位掩码，缺省 TEXTURE_BINDING | COPY_DST | RENDER_ATTACHMENT */
    usage?: GPUFlagsConstant
    /** mip 级数，缺省 1；大于 1 时可调用 generateMipmaps 生成 */
    mipLevelCount?: number
    label?: string
}

/** 生成 mipmap 用的全屏三角形着色器：从上一级线性采样写入下一级 */
const MIPMAP_WGSL = `
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@vertex
fn vs(@builtin(vertex_index) index: u32) -> VertexOutput {
  var positions = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f( 3.0, -1.0),
    vec2f(-1.0,  3.0),
  );
  let p = positions[index];
  var output: VertexOutput;
  output.position = vec4f(p, 0.0, 1.0);
  output.uv = vec2f((p.x + 1.0) * 0.5, (1.0 - p.y) * 0.5);
  return output;
}

@group(0) @binding(0) var srcSampler: sampler;
@group(0) @binding(1) var srcTexture: texture_2d<f32>;

@fragment
fn fs(@location(0) uv: vec2f) -> @location(0) vec4f {
  return textureSample(srcTexture, srcSampler, uv);
}
`

export class Texture implements IResource {
    static uid = 0

    isDisposed = false
    readonly uid: number
    device: Device
    texture: GPUTexture
    /** 默认视图（覆盖全部 mip / 层） */
    view: GPUTextureView
    readonly width: number
    readonly height: number
    readonly depthOrArrayLayers: number
    readonly mipLevelCount: number
    readonly sampleCount: number
    readonly dimension: GPUTextureDimension
    readonly format: GPUTextureFormat
    readonly usage: GPUFlagsConstant

    /** 逐 mip 级视图缓存（generateMipmaps 复用，保证绑定键稳定） */
    protected mipViews: (GPUTextureView | undefined)[] = []
    /** 逐 mip 级内部 bind group 缓存（不注册进 Device，随纹理一起被回收） */
    protected mipBindGroups: (GPUBindGroup | undefined)[] = []

    constructor(device: Device, descriptor: GPUTextureDescriptor) {
        this.device = device
        this.uid = Texture.uid++
        this.texture = device.gpu.createTexture(descriptor)
        this.view = this.texture.createView()
        this.width = this.texture.width
        this.height = this.texture.height
        this.depthOrArrayLayers = this.texture.depthOrArrayLayers
        this.mipLevelCount = this.texture.mipLevelCount
        this.sampleCount = this.texture.sampleCount
        this.dimension = this.texture.dimension
        this.format = this.texture.format
        this.usage = this.texture.usage
        device.addDisposable(this)
    }

    protected get gpu() {
        return this.device.gpu
    }

    /** 计算覆盖 width×height 的完整 mip 链级数 */
    static computeMipLevelCount(width: number, height: number): number {
        return Math.floor(Math.log2(Math.max(width, height))) + 1
    }

    /** 一步创建 2D 纹理并上传像素数据 */
    static fromData(device: Device, options: TextureFromDataOptions): Texture {
        const format = options.format ?? 'rgba8unorm'
        const texture = new Texture(device, {
            size: { width: options.width, height: options.height },
            format,
            usage: options.usage ?? (GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT),
            mipLevelCount: options.mipLevelCount ?? 1,
            label: options.label,
        })
        texture.write(
            options.data,
            { texture: texture.texture },
            { bytesPerRow: options.width * computeTexelByteSize(format), rowsPerImage: options.height },
            { width: options.width, height: options.height, depthOrArrayLayers: 1 },
        )
        return texture
    }

    createView(descriptor?: GPUTextureViewDescriptor) {
        return this.texture.createView(descriptor)
    }
    /** 通过队列写入纹理数据（对应 GPUQueue.writeTexture） */
    write(data: GPUAllowSharedBufferSource, destination: GPUTexelCopyTextureInfo, dataLayout: GPUTexelCopyBufferLayout, size: GPUExtent3DStrict) {
        this.gpu.queue.writeTexture(destination, data, dataLayout, size)
    }

    /** 取某个 mip 级的单级视图（缓存复用，保证对象身份稳定） */
    getMipView(level: number): GPUTextureView {
        let view = this.mipViews[level]
        if (!view) {
            view = this.texture.createView({ baseMipLevel: level, mipLevelCount: 1 })
            this.mipViews[level] = view
        }
        return view
    }

    /**
     * 生成完整 mip 链：逐级把上一级经线性采样渲染到下一级
     * 要求纹理具备 TEXTURE_BINDING 与 RENDER_ATTACHMENT 用途，且 mipLevelCount > 1
     */
    generateMipmaps() {
        if (this.mipLevelCount <= 1) {
            return
        }
        if (!(this.usage & GPUTextureUsage.TEXTURE_BINDING) || !(this.usage & GPUTextureUsage.RENDER_ATTACHMENT)) {
            throw new Error('generateMipmaps 需要纹理具备 TEXTURE_BINDING 与 RENDER_ATTACHMENT 用途')
        }
        const device = this.device
        const module = device.createShaderModule({ code: MIPMAP_WGSL })
        const pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: { module: module.module, entryPoint: 'vs' },
            fragment: { module: module.module, entryPoint: 'fs', targets: [{ format: this.format }] },
        })
        const sampler = Sampler.linear(device)
        const bindGroupLayout = pipeline.getBindGroupLayout(0)
        for (let level = 1; level < this.mipLevelCount; level++) {
            let bindGroup = this.mipBindGroups[level]
            if (!bindGroup) {
                bindGroup = this.gpu.createBindGroup({
                    layout: bindGroupLayout,
                    entries: [
                        { binding: 0, resource: sampler.sampler },
                        { binding: 1, resource: this.getMipView(level - 1) },
                    ],
                })
                this.mipBindGroups[level] = bindGroup
            }
            const encoder = device.createCommandEncoder()
            const pass = encoder.beginRenderPass({
                colorAttachments: [{
                    view: this.getMipView(level),
                    loadOp: 'clear',
                    storeOp: 'store',
                }],
            })
            pass.setPipeline(pipeline.pipeline)
            pass.setBindGroup(0, bindGroup)
            pass.draw(3)
            pass.end()
            device.submit([encoder.finish()])
            encoder.dispose()
        }
    }

    destroy() {
        this.texture.destroy()
    }
    dispose(): void {
        if (this.isDisposed) { return }
        this.isDisposed = true
        this.texture.destroy()
        this.mipViews.length = 0
        this.mipBindGroups.length = 0
        this.device.resources.delete(this)
    }
}
