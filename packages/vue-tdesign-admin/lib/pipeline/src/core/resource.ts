/**
 * 资源基类与注册表。
 *
 * 所有图形资源（buffer / texture / pipeline / attribute / uniform / VAO / bindgroup ...）
 * 都继承 Resource，从而共享同一套生命周期、标识符与泄漏检测。
 * 资源只做三件事：拿到标识符、登记到注册表、destroy 时反登记。
 */
import { disposedError } from './errors.js';
import { formatHandle, ResourceKind, type Handle, type ResourceId } from './handle.js';
import type { GraphicsApi } from './types.js';

/** 资源的宿主（Device）。用窄接口而非具体 Device 类型，避免循环依赖。 */
export interface ResourceOwner {
  readonly api: GraphicsApi;
  readonly label: string;
  registerResource(resource: Resource): void;
  unregisterResource(resource: Resource): void;
}

let nextResourceId: ResourceId = 1;

export abstract class Resource {
  readonly handle: Handle;
  readonly owner: ResourceOwner;
  label: string;

  #disposed = false;

  protected constructor(owner: ResourceOwner, kind: ResourceKind, label = '') {
    this.owner = owner;
    this.label = label;
    this.handle = Object.freeze({ id: nextResourceId++, kind, label }) as Handle;
    owner.registerResource(this);
  }

  get id(): ResourceId {
    return this.handle.id;
  }

  get kind(): ResourceKind {
    return this.handle.kind;
  }

  get disposed(): boolean {
    return this.#disposed;
  }

  /** 形如 `buffer#3(positions)`，用于日志与错误信息。 */
  describe(): string {
    return formatHandle(this.handle);
  }

  destroy(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.onDestroy();
    this.owner.unregisterResource(this);
  }

  /** 子类在此释放原生句柄。只在首次 destroy 时被调用一次。 */
  protected abstract onDestroy(): void;

  /** 每次访问原生句柄前调用，避免"销毁后仍被绘制"这类难以定位的问题。 */
  protected assertAlive(call: string): void {
    if (this.#disposed) throw disposedError(this.describe(), call);
  }
}

/** 资源注册表。按 id 索引，支持按 kind 过滤，提供泄漏报告。 */
export class ResourceRegistry {
  private readonly entries = new Map<ResourceId, Resource>();
  private peak = 0;

  add(resource: Resource): void {
    this.entries.set(resource.id, resource);
    if (this.entries.size > this.peak) this.peak = this.entries.size;
  }

  remove(id: ResourceId): void {
    this.entries.delete(id);
  }

  resolve(handle: Handle): Resource | undefined {
    return this.entries.get(handle.id);
  }

  /** 取回资源并校验类型，失败即抛错。 */
  require<T extends Resource>(handle: Handle, kind: ResourceKind, where: string): T {
    if (handle.kind !== kind) {
      throw new TypeError(`${where}: 期望 ${kind} 资源，实际收到 ${formatHandle(handle)}`);
    }
    const resource = this.entries.get(handle.id);
    if (!resource) {
      throw new TypeError(`${where}: 资源 ${formatHandle(handle)} 不存在或已销毁`);
    }
    return resource as T;
  }

  all(): Resource[] {
    return [...this.entries.values()];
  }

  filter(kind: ResourceKind): Resource[] {
    return this.all().filter((resource) => resource.kind === kind);
  }

  count(kind?: ResourceKind): number {
    return kind ? this.filter(kind).length : this.entries.size;
  }

  /** 历史峰值，用于判断批量创建是否失控。 */
  get peakCount(): number {
    return this.peak;
  }

  /** 按 kind 汇总存活资源，调试泄漏时直接打印即可。 */
  report(): string {
    if (this.entries.size === 0) return 'resources: 0';
    const buckets = new Map<ResourceKind, string[]>();
    for (const resource of this.entries.values()) {
      const list = buckets.get(resource.kind) ?? [];
      list.push(resource.describe());
      buckets.set(resource.kind, list);
    }
    const lines = [`resources: ${this.entries.size}`];
    for (const [kind, list] of buckets) lines.push(`  ${kind} x${list.length}: ${list.join(', ')}`);
    return lines.join('\n');
  }

  /** 销毁全部存活资源。Device.destroy() 的最后一步。 */
  destroyAll(): void {
    for (const resource of this.all()) resource.destroy();
  }
}
