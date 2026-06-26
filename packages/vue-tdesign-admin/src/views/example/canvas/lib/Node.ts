import { EventTarget } from './EventTarget'
import { deepMerge } from './util'
export const NODE_DRITY_FALGS={
    NONE:0,
    SHAPE:1,
    TRANSFORM:2,
    SYSLE:4,

}
export type NodeEventHandles = {
    beforeUpdate:{}
    afterUpdate:{}
    update:{delta:number}
}
export interface NodeProps {
    id: string
}
export abstract class Node<Props extends NodeProps> extends EventTarget<NodeEventHandles> {
    declare props: Props
    declare parent: Node<Props> | null
    flags:number = NODE_DRITY_FALGS.NONE
    subtreeFlags:number = NODE_DRITY_FALGS.NONE
    constructor(props: Props) {
        super()
        this.props = deepMerge({},...this.getDefaultProps(), props)
    }
    getDefaultProps():Props[]{
        return [this.props]
    }
    beforeUpdate():void{
        // 在处理副作用更新前触发
        this.emit('beforeUpdate')
    }
    update(delta:number):void{
        // 处理节点更新
        this.emit('update',{delta})
    }
    afterUpdate():void{
        // 处理节点更新后触发
        this.emit('afterUpdate')
    }
}