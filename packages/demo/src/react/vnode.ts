import type {VNode,VNodeChild} from './types'
const hasOwnProperty = Object.prototype.hasOwnProperty


function h(type:VNode['type'], config: any, ...children: VNodeChild[]):VNode {
    const props: any = {}
    let key:string = null, ref: any = null
    if (config) {
        for (let name of Object.keys(config)) {
            if (name === 'key') {
                key = config[name] + ''
            } else if (name === 'ref') {
                key = config[name]
            } else {
                props[name] = config[name]
            }
        }
    }
    if (children.length === 1) {
        props.children = children[0]
    } else if (children.length > 1) {
        props.children = children
    }
    return {
        type,
        props,
        key,
        ref
    }
}


export {
    h
}