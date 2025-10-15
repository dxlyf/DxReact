const hasOwnProperty = Object.prototype.hasOwnProperty

type ReactElement={
    ref:any,
    key:any,
    type:any,
    props:any
}
function createElement(type: any, config: any, ...children: any[]) {
    const props: any = {}
    let key: any = null, ref: any = null
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
let nextUnitOfWork: any = null
let wipRoot: any = null
let currentRoot: any = null
let deletions: any = null
let nextUnitOfWorkRoot: any = null
let isPerformingWork = false
let workInProgressHook: any = null
let workInProgress:any=null


function schedulerUpdate(){

}
function performUnitOfWork(){

}
function workLoop(deadline: IdleDeadline){
    while(deadline.timeRemaining()>5){

    }
    requestIdleCallback(workLoop)
}
function render(element:ReactElement,container:HTMLElement){


}

export {
    createElement
}