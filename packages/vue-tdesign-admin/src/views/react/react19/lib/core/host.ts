// ============================================================
// reconcilerConfig（HostConfig）—— 核心 reconciler 与宿主环境解耦的接口
// 核心层只依赖本接口，不直接操作 DOM；
// DOM 渲染器（host/dom.ts）为其默认实现，可替换为其他宿主
// ============================================================
import type { HostInstance } from './types'

export interface HostContext {
  // 容器实例（如 DOM 根节点）
  container: HostInstance
  // 是否进行事件委托（DOM 需要）
  rootEventDelegation?: boolean
}

export interface HostConfig {
  // ---------- 创建 ----------
  /** 创建宿主元素实例 */
  createInstance(type: string, props: Record<string, any>, rootContainer: HostInstance): HostInstance
  /** 创建文本实例 */
  createTextInstance(text: string, rootContainer: HostInstance): HostInstance

  // ---------- 插入 ----------
  /** 父实例插入子实例 */
  appendChild(parentInstance: HostInstance, child: HostInstance): void
  /** 容器直接插入（HostRoot 的容器没有 fiber 节点） */
  appendChildToContainer(container: HostInstance, child: HostInstance): void
  /** 父实例在 before 前插入 child */
  insertBefore(parentInstance: HostInstance, child: HostInstance, beforeChild: HostInstance): void
  /** 容器在 before 前插入 child */
  insertInContainerBefore(container: HostInstance, child: HostInstance, beforeChild: HostInstance): void

  // ---------- 删除 ----------
  removeChild(parentInstance: HostInstance, child: HostInstance): void
  removeChildFromContainer(container: HostInstance, child: HostInstance): void

  // ---------- 更新 ----------
  /** 更新宿主元素属性（commit 阶段调用） */
  commitUpdate(
    instance: HostInstance,
    type: string,
    oldProps: Record<string, any>,
    newProps: Record<string, any>,
  ): void
  /** 更新文本内容 */
  commitTextUpdate(textInstance: HostInstance, oldText: string, newText: string): void

  // ---------- 事件 ----------
  /** 挂载/卸载时通知事件系统（DOM 用事件委托注册） */
  addEventListener?: (rootContainer: HostInstance, props: Record<string, any>) => void
  removeEventListener?: (rootContainer: HostInstance, oldProps: Record<string, any>) => void

  // ---------- 宿主能力 ----------
  /** 文本内容判定：children 为纯字符串时是否可作为文本子节点 */
  shouldSetTextContent?: (type: string, props: Record<string, any>) => boolean
  /** 是否为文本实例（commit 阶段区分文本更新） */
  isTextInstance?: (instance: HostInstance) => boolean
  /** 把 fiber 引用挂到实例上（事件委托依赖，DOM 需要） */
  attachInstanceMeta?: (instance: HostInstance, fiber: unknown) => void
}

/** 全局当前宿主配置（默认 DOM，可在 createRoot 时替换） */
export const HostConfigRegistry: { current: HostConfig | null } = { current: null }

export function setHostConfig(config: HostConfig): void {
  HostConfigRegistry.current = config
}

export function getHostConfig(): HostConfig {
  if (HostConfigRegistry.current === null) {
    throw new Error('HostConfig 未设置，请先注册 DOM 渲染器或自定义宿主')
  }
  return HostConfigRegistry.current
}
