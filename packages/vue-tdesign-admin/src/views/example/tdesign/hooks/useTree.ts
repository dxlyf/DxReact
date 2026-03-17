import type { TdTreeProps } from 'tdesign-vue-next'
import {computed, type MaybeRefOrGetter,unref,reactive,ref,shallowRef, h} from 'vue'
export type UseTreeProps<T,P=any>={
   request:(params:P)=>Promise<T>
   treeProps?:MaybeRefOrGetter<TdTreeProps>
}

export const useTree=<T,P=any>(props:UseTreeProps<T,P>)=>{

     const loading=shallowRef(false)
     const treeData=shallowRef<T>([] as T)
     const flatTreeData=new Map()
     const actived=shallowRef([])
     const treeProps=computed<TdTreeProps>(()=>{
        const propTreeProps=unref(props.treeProps)
        return {
            data:treeData.value,
            activable:true,
            actived:actived.value,
            draggable:true,
            hover:true,
            allowFoldNodeOnFilter:true,
            filter(node){
                return true
            },
            allowDrop:({dragNode,dropNode,dropPosition})=>{
                return true
            },
            onDragStart:({e,node})=>{
               console.log('onDragStart',node)
            },
            onDragEnd:({e,node})=>{
               console.log('onDragEnd',node)
            },
            onDragOver:({e,node})=>{
               console.log('onDragOver',node)
            },
            onDragLeave:({e,node})=>{
               console.log('onDragLeave',node)
            },
            onDrop:({e,dragNode,dropNode,dropPosition})=>{
              // console.log('onDrop',dragNode,dropNode,dropPosition)
               
            },
            'onUpdate:actived':(val:any[])=>{
                actived.value=val
            },
            ...(propTreeProps?propTreeProps:{})
        }
     })
     const flatTree=(data:T)=>{
        const traverse=(nodes:T)=>{
            for(const node of nodes){
                flatTreeData.set(node.id,node)
                if(node.nodes&&Array.isArray(node.nodes)){
                    traverse(node.nodes)
                }
            }
        }
        traverse(data)
     }
     const request=async (params:any={})=>{
        loading.value=true
        try{
            const res=await props.request(params)
            treeData.value=res as T
            flatTree(res as T)
        }finally{
            loading.value=false
        }
     }
     return [treeProps,{request,treeData,loading}] as const
}