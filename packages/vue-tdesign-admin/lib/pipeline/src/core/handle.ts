/**
 * 统一资源标识符系统。
 *
 * 每个图形资源在创建时都会拿到一个全局自增的 ResourceId，并被打上 ResourceKind 标签。
 * 标签让标识符在运行期可自校验（kind 不符时立刻报错），
 * 而不是像裸 WebGL 句柄那样只能靠调用方自觉。
 *
 * 资源类型与具体对象的对应关系：
 *   attribute      -> Attribute      （顶点属性槽，绑定到某个 VBO 的一段区间）
 *   uniform        -> Uniform        （标量/向量/矩阵 uniform 槽）
 *   uniformblock   -> UniformBlock   （std140 布局的 uniform 块）
 *   VAO            -> VertexArray    （顶点数组对象；WebGPU 下等价于顶点缓冲绑定集合）
 *   VBO            -> Buffer(role=Vertex)
 *   EBO            -> Buffer(role=Index)
 *   UBO            -> Buffer(role=Uniform)
 *   bindgroup      -> BindGroup      （WebGPU 原生绑定组，WebGL 侧为 uniform 槽的组合视图）
 *
 * 注意 VBO/EBO/UBO 与 Buffer 是同一实体：WebGPU 的 usage 是位掩码，一张缓冲可以
 * 同时是 VBO+UBO。因此用 kind=Buffer + role 组合表达，role 见 BufferRole。
 */
import type { Resource } from './resource.js';

/** 全局唯一、单调递增的资源编号。 */
export type ResourceId = number;

export enum ResourceKind {
  Pipeline = 'pipeline',
  Shader = 'shader',
  Buffer = 'buffer',
  VertexArray = 'vertexArray',
  Attribute = 'attribute',
  Uniform = 'uniform',
  UniformBlock = 'uniformBlock',
  Texture = 'texture',
  Sampler = 'sampler',
  BindGroup = 'bindGroup',
  Framebuffer = 'framebuffer',
  RenderPass = 'renderPass',
}

/** 缓冲在管线中承担的角色，用于区分 VBO / EBO / UBO。 */
export enum BufferRole {
  Vertex = 'VBO',
  Index = 'EBO',
  Uniform = 'UBO',
  Storage = 'SSBO',
}

/** 统一的资源标识符。可安全地跨层传递、序列化到日志、用于 Map 的键。 */
export interface Handle<K extends ResourceKind = ResourceKind> {
  readonly id: ResourceId;
  readonly kind: K;
  readonly label: string;
}

export function isHandle(value: unknown): value is Handle {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Handle>;
  return typeof candidate.id === 'number' && typeof candidate.kind === 'string';
}

/** 判断两个标识符是否指向同一个资源。 */
export function isSameHandle(a: Handle | null | undefined, b: Handle | null | undefined): boolean {
  if (!a || !b) return false;
  return a.id === b.id && a.kind === b.kind;
}

/** 可读的标识符文本，形如 `buffer#12(mesh.positions)`。 */
export function formatHandle(handle: Handle): string {
  return `${handle.kind}#${handle.id}${handle.label ? `(${handle.label})` : ''}`;
}

/** 校验标识符的 kind，不符时抛出带上下文的 TypeError。 */
export function assertKind<K extends ResourceKind>(handle: Handle, kind: K, where: string): asserts handle is Handle<K> {
  if (handle.kind !== kind) {
    throw new TypeError(`${where}: 期望 ${kind} 标识符，实际收到 ${formatHandle(handle)}`);
  }
}

/** 从资源对象上取回标识符（便于在 API 层做窄化）。 */
export function handleOf(resource: Resource): Handle {
  return resource.handle;
}
