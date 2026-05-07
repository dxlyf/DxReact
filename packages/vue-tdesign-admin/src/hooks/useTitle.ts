import {type MaybeRefOrGetter,ref,onMounted,onUnmounted,toValue,watch, Ref, MaybeRef, unref,toRaw} from 'vue'

export type UseTitleOptions={
    restoreOnUnmount?:boolean
}
export const useTitle2=(title:MaybeRefOrGetter<string>,options:UseTitleOptions={restoreOnUnmount:true})=>{
    const {restoreOnUnmount=true}=options
    const titleRef=ref(document.title)
    const updatePageTitle=()=>{
        document.title=toValue(title)
    }
    onMounted(updatePageTitle)
    watch(()=>toValue(title),()=>{
        updatePageTitle()
    },{
        flush:'post'
    })
    onUnmounted(()=>{
        if(restoreOnUnmount){
            document.title=titleRef.value
        }
    })
}

export const useTitle=(title:MaybeRef<string>,options:UseTitleOptions={})=>{
    const {restoreOnUnmount=true}=options
    const titleRef=ref(document.title)
    const updatePageTitle=()=>{
        document.title=unref(title)
    }
    
    onMounted(updatePageTitle)
    watch(()=>unref(title),()=>{
        updatePageTitle()
    },{
        flush:'post'
    })
    onUnmounted(()=>{
        if(restoreOnUnmount){
            document.title=titleRef.value
        }
    })

}