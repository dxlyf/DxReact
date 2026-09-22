/**
 * WebGL / WebGL2 的缓冲实现（VBO / EBO / UBO / SSBO 共用一份实现）。
 *
 * 上传策略由 BufferFrequency 决定，使用方不需要关心 bufferData / bufferSubData 的区别：
 *  - Static：创建时整块写入，之后只用 bufferSubData 做局部修正
 *  - Dynamic：局部更新走 bufferSubData
 *  - Stream：每次更新先 orphaning（bufferData(null)）再写入，避免 GPU 等待旧数据用完
 *
 * 另外提供两条更新路径：
 *  - update(data)：立即上传，适合"一次性写入"，不占 CPU 内存镜像
 *  - writer() + markDirty() + flush()：CPU 侧镜像 + 脏区间合并，适合频繁改小块数据
 *    两者共用同一份镜像，混用时不会失配。
 */
import { Buffer, type BufferDescriptor, type BufferRange, type BufferUpdateOptions } from '../../core/buffer.js';
import { DataWriter, packUniformValue, type UniformValue } from '../../core/data.js';
import { ErrorCode, GraphicsError, invalidDescriptor } from '../../core/errors.js';
import { BufferRole } from '../../core/handle.js';
import { BufferFrequency, type ShaderDataType } from '../../core/types.js';
import type { Device } from '../../core/device.js';
import { gl2, type GLContext } from './constants.js';
import type { GLStateCache } from './glState.js';

function glDrawUsage(frequency: BufferFrequency, gl: GLContext): number {
  switch (frequency) {
    case BufferFrequency.Static:
      return gl.STATIC_DRAW;
    case BufferFrequency.Dynamic:
      return gl.DYNAMIC_DRAW;
    default:
      return gl.STREAM_DRAW;
  }
}

export class GLBuffer extends Buffer {
  readonly target: number;
  private readonly gl: GLContext;
  private readonly state: GLStateCache;
  private readonly device: Device;
  private readonly nativeBuffer: WebGLBuffer;
  private readonly drawUsage: number;

  /** CPU 侧镜像，仅在 writer() / markDirty() 被使用时才分配 */
  private staging: DataWriter | null = null;
  private dirtyStart = 0;
  private dirtyEnd = 0;

  constructor(device: Device, descriptor: BufferDescriptor, state: GLStateCache) {
    super(device, descriptor, 'buffer');
    this.device = device;
    const { gl, webgl2 } = state;
    this.gl = gl;
    this.state = state;

    if (this.role === BufferRole.Storage) {
      // WebGL（含 WebGL2）没有 shader storage block，SSBO 是 ES 3.1 的能力
      throw new GraphicsError('WebGL 不支持 storage buffer', {
        code: ErrorCode.Unsupported,
        api: device.api,
        resource: this.describe(),
        hint: 'storage buffer 仅 WebGPU 可用；WebGL 侧请改用 uniform buffer 或纹理。',
      });
    }
    if (this.role === BufferRole.Uniform && !webgl2) {
      throw new GraphicsError('WebGL1 不支持 uniform buffer', {
        code: ErrorCode.Unsupported,
        api: device.api,
        resource: this.describe(),
        hint: 'WebGL1 的 uniform 会被降级为逐成员上传，请不要直接创建 UBO。',
      });
    }

    this.target = bufferTarget(this.role, state);
    this.drawUsage = glDrawUsage(this.frequency, gl);

    const buffer = gl.createBuffer();
    if (!buffer) {
      throw new GraphicsError('gl.createBuffer 返回 null', {
        code: ErrorCode.NativeAPIError,
        api: device.api,
        call: 'createBuffer',
      });
    }
    this.nativeBuffer = buffer;

    // 创建时一次性把初始数据交出去，省掉后续一次绑定 + 上传
    this.state.bindBuffer(this.target, buffer);
    if (descriptor.data) {
      this.state.call('bufferData', this.target, descriptor.data, this.drawUsage);
      gl.bufferData(this.target, descriptor.data as ArrayBufferView, this.drawUsage);
    } else {
      this.state.call('bufferData', this.target, this.size, this.drawUsage);
      gl.bufferData(this.target, this.size, this.drawUsage);
    }
  }

  override get native(): WebGLBuffer {
    return this.nativeBuffer;
  }

  /** 与 native 同义，便于按后端命名下探。 */
  get glBuffer(): WebGLBuffer {
    return this.nativeBuffer;
  }

  update(data: ArrayBufferView | ArrayBuffer, options: BufferUpdateOptions = {}): void {
    this.assertAlive('update');
    const offset = options.offset ?? 0;
    const bytes = data instanceof ArrayBuffer ? data.byteLength : data.byteLength;
    this.assertRange(offset, bytes, 'update');

    if (this.staging) {
      // 保持 CPU 镜像与 GPU 一致，避免后续 writer() 写入时把这里的改动覆盖回去
      copyInto(this.staging, offset, data);
    }
    this.upload(offset, data);
  }

  updateValue(type: ShaderDataType, values: UniformValue, offset: number): void {
    this.assertAlive('updateValue');
    const packed = packUniformValue(type, values, 1, `buffer#${this.id}.updateValue`);
    this.assertRange(offset, packed.byteLength, 'updateValue');
    if (this.staging) copyInto(this.staging, offset, packed);
    this.upload(offset, packed);
  }

  writer(): DataWriter {
    this.assertAlive('writer');
    if (!this.staging) this.staging = new DataWriter(this.size);
    return this.staging;
  }

  markDirty(offset: number, byteLength: number): void {
    this.assertAlive('markDirty');
    if (byteLength <= 0) return;
    if (!this.staging) this.staging = new DataWriter(this.size);
    this.assertRange(offset, byteLength, 'markDirty');
    this.mergeDirty(offset, offset + byteLength);
  }

  get dirtyRange(): BufferRange | null {
    if (this.dirtyEnd <= this.dirtyStart) return null;
    return { offset: this.dirtyStart, byteLength: this.dirtyEnd - this.dirtyStart };
  }

  flush(): void {
    this.assertAlive('flush');
    const range = this.dirtyRange;
    if (!range || !this.staging) return;
    const view = new Uint8Array(this.staging.buffer, range.offset, range.byteLength);
    this.upload(range.offset, view);
    this.dirtyStart = 0;
    this.dirtyEnd = 0;
  }

  replace(data: ArrayBufferView | ArrayBuffer): void {
    this.assertAlive('replace');
    const bytes = data instanceof ArrayBuffer ? data.byteLength : data.byteLength;
    if (bytes !== this.size) {
      throw invalidDescriptor(
        `${this.describe()}: replace 需要 ${this.size} 字节，实际收到 ${bytes} 字节`,
        { hint: '整块替换要求大小一致；大小会变请销毁后重建缓冲。' },
      );
    }
    if (this.staging) copyInto(this.staging, 0, data);
    this.dirtyStart = 0;
    this.dirtyEnd = 0;
    this.state.bindBuffer(this.target, this.nativeBuffer);
    this.state.call('bufferData', this.target, data, this.drawUsage);
    this.gl.bufferData(this.target, data as ArrayBufferView, this.drawUsage);
    this.device.stats.bufferUploads++;
    this.device.stats.bufferUploadBytes += bytes;
  }

  protected override onDestroy(): void {
    this.staging = null;
    this.state.forgetBuffer(this.nativeBuffer);
    this.gl.deleteBuffer(this.nativeBuffer);
  }

  // -------------------------------------------------------------------------

  private upload(offset: number, data: ArrayBufferView | ArrayBuffer): void {
    this.state.bindBuffer(this.target, this.nativeBuffer);
    if (this.frequency === BufferFrequency.Stream) {
      // orphaning：先丢弃整块旧存储，再写入新数据，避免驱动同步等待
      this.state.call('bufferData', this.target, this.size, this.drawUsage);
      this.gl.bufferData(this.target, this.size, this.drawUsage);
    }
    this.state.call('bufferSubData', this.target, offset, data);
    this.gl.bufferSubData(this.target, offset, data as ArrayBufferView);
    this.device.stats.bufferUploads++;
    this.device.stats.bufferUploadBytes += data instanceof ArrayBuffer ? data.byteLength : data.byteLength;
  }

  private mergeDirty(start: number, end: number): void {
    if (this.dirtyEnd <= this.dirtyStart) {
      this.dirtyStart = start;
      this.dirtyEnd = end;
      return;
    }
    if (start < this.dirtyStart) this.dirtyStart = start;
    if (end > this.dirtyEnd) this.dirtyEnd = end;
  }

  private assertRange(offset: number, byteLength: number, call: string): void {
    if (offset < 0 || byteLength < 0 || offset + byteLength > this.size) {
      throw invalidDescriptor(
        `${this.describe()}.${call}: 区间 [${offset}, ${offset + byteLength}) 越界，缓冲共 ${this.size} 字节`,
      );
    }
  }
}

function bufferTarget(role: BufferRole, state: GLStateCache): number {
  const { gl, webgl2 } = state;
  switch (role) {
    case BufferRole.Vertex:
      return gl.ARRAY_BUFFER;
    case BufferRole.Index:
      return gl.ELEMENT_ARRAY_BUFFER;
    case BufferRole.Uniform:
      return webgl2 ? gl2(gl).UNIFORM_BUFFER : gl.ARRAY_BUFFER;
    default:
      // Storage 在构造器里已被拒绝，这里的兜底只为穷尽 switch
      return gl.ARRAY_BUFFER;
  }
}

function copyInto(writer: DataWriter, offset: number, data: ArrayBufferView | ArrayBuffer): void {
  const bytes =
    data instanceof ArrayBuffer
      ? new Uint8Array(data)
      : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  new Uint8Array(writer.buffer, offset, bytes.byteLength).set(bytes);
}
