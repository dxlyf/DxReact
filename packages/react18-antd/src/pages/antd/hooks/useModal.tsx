import { useMemoizedFn } from 'ahooks'
import {Modal} from 'antd'
import type {GetProps,GetProp} from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type ModalProps=GetProps<typeof Modal>

type UseModalProps=Omit<ModalProps,'onOk'|'onCancel'|'children'>&{
    children?:React.ReactNode|((instance:UseModalInstance)=>React.ReactNode)
    onOk?(result?:any):any|Promise<any>
    onCancel?():any|Promise<any>
    getStageProps?:(istance:UseModalInstance)=>ModalProps
}
export type UseModalInstance={
    loading:boolean
    modalStore:ModalStore
    data:any
    open(data?:any):void
    close(data?:any):void
}
type SubmitHandle=()=>(any|Promise<any>)
type ModalCallbacks={
    onSubmit?:SubmitHandle
}
class ModalStore{
    callbacks:ModalCallbacks={}
    constructor(){

    }
    register(callbacks:ModalCallbacks){
        this.callbacks=callbacks
    }
    close(){
        this.callbacks={}
    }
}
const useModal=(props:UseModalProps={})=>{
    const {getStageProps,onCancel,onOk,children,...restModalProps}=props
    const [state,setState]=useState<any>({visible:false})
    const [data,setData]=useState<any>(null)
    const [loading,setLoading]=useState(false)
    const [modalStore]=useState(()=>new ModalStore())
    const open=useCallback((data:any=null)=>{
            setState({visible:true})
            setData(data)
    },[])
    const close=useCallback((data:any=null)=>{
            setState({visible:false})
            setData(data)
    },[])
    const handleOk=useMemoizedFn(async (e)=>{
         setLoading(true)
         try{
            let res=await modalStore.callbacks.onSubmit?.()
            if(onOk){
                res=onOk(res)
            }
            if(res!==false){
                close()
            }
         }catch{

         }finally{
            setLoading(false)
         }
            // Promise.resolve().then(()=>modalStore.callbacks.onSubmit?.()).then((ret)=>onOk?onOk():ret).then(result=>{
            //     if(result!==false){
            //         close()
            //     }
            // }).finally(()=>{
            //     setLoading(false)
            // })
            //modalStore.callbacks.onSubmit?.()
    })
    const handleCancel=useMemoizedFn((e)=>{
       if(onCancel){
            Promise.resolve().then(()=>onCancel()).then(result=>{
                if(result!==false){
                    close()
                }
            })
        }else{
             close()
        }
    })
   
    const modalInstance=useRef<UseModalInstance>()
     modalInstance.current= {
            loading,
            modalStore,
            data,
            open,
            close
    }
    const modalStateProps=getStageProps?getStageProps(modalInstance.current):{}
    const modalProps:ModalProps={
        okButtonProps:{
            loading:loading
        },
        cancelButtonProps:{
            loading:loading
        },
        onOk:handleOk,
        onCancel:handleCancel,
        open:state.visible,
        children:typeof children==='function'?children(modalInstance.current):children,
        ...restModalProps,
        ...modalStateProps,
    }
    useEffect(()=>{
        if(!state.visible){
            modalStore.close()
        }
    },[state.visible])
    return [modalProps,modalInstance] as [ModalProps,React.MutableRefObject<UseModalInstance>]
}
export {
    useModal
}