import { unref,toValue,type MaybeRefOrGetter, computed, shallowReactive} from 'vue'
import type {DialogProps} from 'tdesign-vue-next'
export type UseDialogProps={
}&Partial<DialogProps>

export const useDialog=(props:MaybeRefOrGetter<UseDialogProps>)=>{
    const state=shallowReactive({
        visible:false,
        data:null
    })
    const open=(data:any=null)=>{
        state.visible=!state.visible
        state.data=data
    }
    const close=()=>{
        state.data=null
        state.visible=false
    }
    const handleCancel=()=>{
        close()
    }
    const dialogProps=computed(()=>{
        const {...restDialogProps}= toValue(props)

        return {
            width:'60%',
            attach:'body',
            visible:state.visible,
            closeOnEscKeydown:false,
            closeOnOverlayClick:false,
            closeBtn:false,
            
            destroyOnClose:true,
            onCancel:handleCancel,
            onClose:handleCancel,
            ...restDialogProps
        } as DialogProps
    })
    return [dialogProps,{open,close}] as const
}
