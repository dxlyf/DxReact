import { unref,toValue,type MaybeRefOrGetter, computed, shallowReactive} from 'vue'
import type {DialogProps} from 'tdesign-vue-next'
export type UseDialogProps={
    autoHeight?:boolean
    enableMaxHeight?:boolean
    margin?:[number,number]
}&Partial<DialogProps>

export const useDialog=(props:()=>UseDialogProps)=>{
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
        const {autoHeight=true,top,margin=[50,50],dialogStyle={},enableMaxHeight=true,...restDialogProps}= toValue(props)

        return {
           //600 width:'60%',
            attach:'body',
            dialogClassName:autoHeight?'f-dialog-wrap f-dialog-ah-wrap':'f-dialog-wrap',
            dialogStyle:autoHeight?{
                [enableMaxHeight?'maxHeight':'height']:`calc(100vh - ${Math.floor(margin[0]+margin[1])}px)`,
                display:'flex',
                flexDirection:'column',
                ...dialogStyle
                
            }:{
                ...dialogStyle
            },
            top:autoHeight?margin[0]:top,
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
