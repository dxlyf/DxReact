import { onBeforeUnmount, onMounted, shallowReactive, shallowRef, type ShallowRef } from "vue"
import { debounce } from "lodash-es"

export type ElementSizeState={
    initialized:boolean
    width:number
    height:number
    top:number
    left:number
    previous:DOMRect|null
}
export type ElementSizeOptions={
    element?:ShallowRef<HTMLElement | null>
    onResize?:(state:ElementSizeState,rect:DOMRect)=>void
    mutationTarget?:HTMLElement
    enabledMutationObserver?:boolean
    enabledResizeObserver?:boolean
    enabledResize?:boolean
}
export const useElementSize = (options:ElementSizeOptions={}) => {
    const {enabledMutationObserver=true,enabledResizeObserver=true,enabledResize=true,mutationTarget}=options
    const elementRef=options.element??shallowRef<HTMLElement | null>(null)
    const state=shallowReactive<ElementSizeState>({
        initialized:false,
        width:0,
        height:0,
        top:0,
        left:0,
        previous:null,
    })
    const updateElementSize=debounce(()=>{
        if(!elementRef.value) return
        const rect=elementRef.value.getBoundingClientRect()
        state.left=rect.left+window.scrollX
        state.top=rect.top+window.scrollY
        state.width=rect.width
        state.height=rect.height
        state.initialized=true
        options.onResize?.(state,rect)
        state.previous=rect
    },50)
    let clearObserver:any=null
    const setupObserver=()=>{
        if(!elementRef.value) return
        let observer:ResizeObserver|null=null;
        let mutationObserver:MutationObserver|null;
        
        if(enabledMutationObserver){
            mutationObserver=new MutationObserver(updateElementSize)
            mutationObserver.observe(mutationTarget||document.body,{
                childList:true,
                subtree:true,
            })
        }
        if(enabledResizeObserver){
           observer=new ResizeObserver(updateElementSize)
           observer.observe(elementRef.value)
        }
        if(enabledResize){
            window.addEventListener('resize',updateElementSize)
        }
        return ()=>{
            window.removeEventListener('resize',updateElementSize)
            observer&&observer.disconnect()
            mutationObserver&&mutationObserver.disconnect()
        }
    }
    onMounted(()=>{
        clearObserver=setupObserver()
    })
    onBeforeUnmount(()=>{
        clearObserver&&clearObserver()
    })

    return [elementRef,state] as const
}
   