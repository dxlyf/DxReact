import { useMemoizedFn } from 'ahooks'
import { Modal,ConfigProvider, Row, Col, Space } from 'antd'
import type { GetProps, GetProp } from 'antd'
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react'
import {FullscreenOutlined,FullscreenExitOutlined} from '@ant-design/icons'
type ModalProps = GetProps<typeof Modal>
type RenderModal = (dom: React.ReactNode, props?: ModalProps) => React.ReactElement
type UseModalProps = Omit<ModalProps, 'children'> & {
    noWrap?: boolean
    children?: (instance: ModalInstance) => React.ReactElement
    onSubmit?: (values: any) => void
    getModalStageProps?: (istance: ModalInstance) => ModalProps
    fullScreen?:boolean
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
    const { getModalStageProps, noWrap = false,fullScreen, onSubmit, children, okButtonProps, cancelButtonProps, visible: propsVisible = false, ...restModalProps } = props
    const [visible, setVisible] = useState(() => propsVisible)
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
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
    const titleDom=<Row>
        <Col></Col>
        <Col>
            <Space>
                
            </Space>
        </Col>
    </Row>
    const modalStateProps = getModalStageProps ? getModalStageProps(modalInstance.current!) : {}
    const modalProps: ModalProps = {
        open: visible,
        title:titleDom,
        onCancel: handleCancel,
        onOk: handleOk,
        destroyOnHidden: true,
        
        okButtonProps: {
            loading,
            ...(okButtonProps ? okButtonProps : {})
        },
        cancelButtonProps: {
            loading,
            ...(cancelButtonProps ? cancelButtonProps : {})
        },
        ...restModalProps,
        ...modalStateProps,
    }
    useLayoutEffect(() => {
        if (!visible) {
            modalInstance.current!.callbacks = {}
        }
    }, [visible])

    const renderModal = (dom: React.ReactNode, props: ModalProps = {}) => {
        return <Modal {...modalProps} {...props}>{dom}</Modal>
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

    return [render(), modalInstance.current, modalProps] as [React.ReactNode, ModalInstance, ModalProps]
}
export {
    useModal
}