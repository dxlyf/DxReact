import { shallowReactive } from 'vue'
import type { FieldUI } from './DataUI'

/**
 * DataUI 的节点不是响应式的。这里为每个节点建立一份响应式状态，
 * 渲染层读取需要的版本号，即可建立节点级（而非全树级）的刷新依赖。
 */
export type NodeState = {
    version: number
    subtreeVersion: number
}

const nodeStates = new WeakMap<FieldUI, NodeState>()

export const getNodeState = (node: FieldUI): NodeState => {
    const cached = nodeStates.get(node)
    if (cached) return cached

    const state = shallowReactive({
        version: node.version,
        subtreeVersion: node.subtreeVersion,
    })
    nodeStates.set(node, state)
    // 节点变更（含后代冒泡）时同步版本号，触发对应 computed 失效
    node.subscribe(() => {
        state.version = node.version
        state.subtreeVersion = node.subtreeVersion
    })
    return state
}
