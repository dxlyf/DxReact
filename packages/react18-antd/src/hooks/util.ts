

export type RefObjectOrFunc<T>= React.RefObject<T> | (() => T)

export const mergeRef=<T>(...refs:Array<React.RefCallback<T>|React.MutableRefObject<T>>)=>{
    return (node:T)=>{
        refs.forEach((ref)=>{
            if(typeof ref==='function'){
                ref(node)
            }else{
                ref.current=node
            }
        })
    }
}
export const getRefOrFuncObject=<T>(el:RefObjectOrFunc<T>)=>{
    if(typeof el==='function'){
        return el()
    }
    return el.current
}
