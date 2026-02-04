import { unref,toValue,type MaybeRefOrGetter, computed, shallowReactive} from 'vue'
import type {DialogProps} from 'tdesign-vue-next'
export type UseDialogProps={
}&Partial<DialogProps>

export const useDialog=(props:MaybeRefOrGetter<UseDialogProps>)=>{
    const propsRef=computed(()=>toValue(props))
    const state=shallowReactive({
        visible:false,
        data:null
    })
    const open=(data:any=null)=>{
        state.visible=!state.visible
        state.data=data
    }
    const close=()=>{
        state.visible=false
    }
    const handleCancel=()=>{
        close()
    }
    const dialogProps=computed(()=>{
        const {...restDialogProps}= propsRef.value

        return {
            width:'60%',
            visible:state.visible,
            onCancel:handleCancel,
            onClose:handleCancel,
            ...restDialogProps
        }
    })
    return [dialogProps,{open,close}] as const
}
