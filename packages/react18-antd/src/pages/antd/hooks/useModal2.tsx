import { useMemoizedFn } from 'ahooks'
import { Modal,ConfigProvider, Row, Col, Space, Button } from 'antd'
import type { GetProps, GetProp } from 'antd'
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react'
import {FullscreenOutlined,FullscreenExitOutlined,CloseOutlined} from '@ant-design/icons'
// import {useFullscreen} from 'rooks'
import  classNames from 'classnames'
import useFullScreen from 'src/hooks/useFullScreen'
import useKeyboard from 'src/hooks/useKeyboard'
import {useDraggable} from 'src/hooks/useDraggable'
type ModalProps = GetProps<typeof Modal>
type RenderModal = (dom: React.ReactNode, props?: ModalProps) => React.ReactElement
type UseModalProps = Omit<ModalProps, 'children'> & {
    noWrap?: boolean
    children?: (instance: ModalInstance) => React.ReactElement
    onSubmit?: (values: any) => void
    getModalStageProps?: (istance: ModalInstance) => ModalProps
    showFullScreen?:boolean
    draggable?:boolean
    hideCancelButton?:boolean

}
export type ModalInstance = {
    callbacks: {
        onSubmit?: () => void
    }
    visible: boolean
    data: any
    loading: boolean
    open: (data?: any) => void
    close: () => void
    setLoading: (loading: boolean) => void
    onSubmit: (callback: () => void) => void
    submit: (values: any, autoClose?: boolean) => void
}

const useModal = (props: UseModalProps = {}) => {
    const { getModalStageProps,hideCancelButton=false,draggable=true, noWrap = false,showFullScreen=true, onSubmit, children, okButtonProps, cancelButtonProps, visible: propsVisible = false, ...restModalProps } = props
    const [visible, setVisible] = useState(() => propsVisible)
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const panelRef=useRef<HTMLDivElement>(null)
    const [fullScreen,{toggleFullscreen}]=useFullScreen(panelRef)
    const { dragHandlers,style:dragStyle,dragHandlerStyle } = useDraggable({
        onDragEnd(){
            console.log('拖拽结束')
        }
    })
    const modalInstance = useRef<ModalInstance>()
    if (!modalInstance.current) {
        modalInstance.current = {
            data: null,
            callbacks: {},
            loading: false,
            visible: visible,
            open: (data: any = {}) => {
                setVisible(true)
                setData(data)
            },
            close: () => {
                setVisible(false)
                setData(null)
            },
            setLoading: setLoading,
            onSubmit: (callback: () => void) => {
                modalInstance.current!.callbacks.onSubmit = callback
            },
            submit: (values: any, autoColose = true) => {

            }
        }
    }
    modalInstance.current!.loading = loading
    modalInstance.current!.data = data
    modalInstance.current!.visible = visible
    modalInstance.current!.submit = useCallback((values: any, autoColose = true) => {
        if (autoColose) {
            modalInstance.current!.close()
        }
        onSubmit?.(values)
    }, [onSubmit])
    const handleOk = useMemoizedFn(() => {
        modalInstance.current!.callbacks.onSubmit?.()
    })
    const handleCancel = useMemoizedFn(() => {
       if(!loading){
         modalInstance.current!.close()
       }
    })
    const modalStateProps = getModalStageProps ? getModalStageProps(modalInstance.current!) : {}
    const {title,closable,className,...finalModalProps}:ModalProps={
        ...restModalProps,
        ...modalStateProps,
    }
    const rnederFullScreen=()=>{
        if(!showFullScreen){
            return null
        }
        if(fullScreen){
            return <FullscreenExitOutlined onClick={()=>toggleFullscreen()}></FullscreenExitOutlined>
        }
        return <FullscreenOutlined onClick={()=>toggleFullscreen()}></FullscreenOutlined>
    }
    const titleDom=<Row   justify={'space-between'} align={'middle'}>
       <Col flex={'auto'} {...(draggable?{...dragHandlers,style:dragHandlerStyle}:{})}>
        {title}
       </Col>
        <Col flex='none'>
            <div style={{position:'relative'}}>
                <Space style={{position:'absolute',top:-23,right:-15}}>
             {rnederFullScreen()}
             {closable!==false&&<Button type='text' >
                <CloseOutlined></CloseOutlined>    
            </Button>}
            </Space>
            </div>
        </Col>
    </Row>
   
    const modalProps: ModalProps = {
        open: visible,
        title:titleDom,
        closable:false,
        onCancel: handleCancel,
        onOk: handleOk,
        style:{
            ...(draggable?dragStyle:{})
        },
        destroyOnHidden: true,
        
        okButtonProps: {
            loading,
            ...(okButtonProps ? okButtonProps : {})
        },
        cancelButtonProps: {
            loading,
            ...(cancelButtonProps ? cancelButtonProps : {})
        },
        className:classNames(className,fullScreen?'modal-full-screen':''),
        footer:(originDom,{OkBtn,CancelBtn})=>{
            if(hideCancelButton){
                return <OkBtn></OkBtn>
            }
            return originDom
        },
        ...finalModalProps
    }
    useLayoutEffect(() => {
        if (!visible) {
            modalInstance.current!.callbacks = {}
        }
    }, [visible])

    const renderModal = (dom: React.ReactNode, props: ModalProps = {}) => {
        return <Modal panelRef={panelRef} {...modalProps} {...props}>{dom}</Modal>
    }
    const render = () => {
        const childrenDom = children ? React.cloneElement(children(modalInstance.current!), {
            modal: modalInstance.current,
            renderModal: renderModal
        }) : null
        if (noWrap) {
            return <>{childrenDom}</>
        }
        return renderModal(childrenDom)
    }
    useKeyboard({
        onKeyPress:(key,e)=>{
             if(visible&&key==='f11'){
                if(!fullScreen){
                    toggleFullscreen()
                }
                e.preventDefault()
             }
        }
    })
    return [render(), modalInstance.current, modalProps] as [React.ReactNode, ModalInstance, ModalProps]
}
export {
    useModal
}