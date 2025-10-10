import { useMemoizedFn } from 'ahooks'
import {Modal} from 'antd'
import type {GetProps,GetProp} from 'antd'
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react'

type ModalProps=GetProps<typeof Modal>

type UseModalProps=Omit<ModalProps,'onOk'|'onCancel'|'children'>&{
    children?:(instance:ModalStore)=>React.ReactNode
    onOk?(result?:any):any|Promise<any>
    onCancel?(result?:any):any|Promise<any>
    getModalStageProps?:(istance:ModalStore)=>ModalProps
}

type CallbackHandle=()=>(any|Promise<any>)
type ModalCallbacks={
    onSubmit?:CallbackHandle
    onCancel?:CallbackHandle
}
export class ModalStore{
    callbacks:ModalCallbacks={}
    data:any=null
    visible=false
    loading=false
    updateCallback:()=>void
    constructor(update:()=>void){
        this.updateCallback=update
    }
    register(callbacks:ModalCallbacks){
        this.callbacks=callbacks
    }
    forceUpdate=()=>{
        this.updateCallback?.()
    }
    open(data={}){
      this.data=data
      this.visible=true
      this.forceUpdate()
    }
    close(){
        this.visible=false
        this.data=null
        this.forceUpdate()
    }
    setLoading(loading:boolean){
        this.loading=loading
        this.forceUpdate()
    }
    async cancel(){
        this.setLoading(true)
         try{
            let res=await this.callbacks.onCancel?.()
            return res
         }catch{
            return false
         }finally{
            this.setLoading(false)
         }
    }
    async submit(){
         this.setLoading(true)
         try{
            let res=await this.callbacks.onSubmit?.()
            return res
         }catch{
            return false
         }finally{
            this.setLoading(false)
         }
    }
    destroy(){
        this.callbacks={}
    }
}
const useModal=(props:UseModalProps={})=>{
    const {getModalStageProps,children,...restModalProps}=props
    const [,forceUpdate]=useReducer(v=>v+1,0)
    const [modalStore]=useState(()=>new ModalStore(forceUpdate))

    const handleOk=useMemoizedFn(async (e)=>{
         try{
            let res=await modalStore.submit()
            if(res!==false){
                modalStore.close()
            }
         }catch{

         }
    })
    const handleCancel=useMemoizedFn(async (e)=>{
        try{
            let res=await modalStore.cancel()
            if(res!==false){
                modalStore.close()
            }
        }catch{

        }
    })
    const modalStateProps=getModalStageProps?getModalStageProps(modalStore):{}
    const modalProps:ModalProps={
        okButtonProps:{
            loading:modalStore.loading
        },
        cancelButtonProps:{
            loading:modalStore.loading
        },
        onOk:handleOk,
        onCancel:handleCancel,
        open:modalStore.visible,
        children:children?children(modalStore):null,
        ...restModalProps,
        ...modalStateProps,
    }
    useLayoutEffect(()=>{
        return ()=>{
             modalStore.destroy()
        }
    },[])
    return [modalProps,modalStore] as [ModalProps,ModalStore]
}
export {
    useModal
}