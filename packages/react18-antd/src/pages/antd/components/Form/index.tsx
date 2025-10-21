import {Form, Popover} from 'antd'
import type {GetProp,GetProps,GetRef,FormProps} from 'antd'
import styles from './index.module.scss'
import classNames from 'classnames'
import { useLayoutEffect, useState } from 'react'
import React from 'react'
type ProFormProps=FormProps&{

}

const ProFormItemInner = (props: any) => {
    const { children, ...restProps } = props
    const [open, setOpen] = useState(false)
    const { errors } = Form.Item.useStatus()
    const popoverContent = (
        <>
            <div style={{ color: '#ff4d4f', fontSize: '12px' }}>
                {errors.map((error, index) => (
                    <div key={index}>{error}</div>
                ))}
            </div>
        </>
    );
    const hasError = errors.length > 0
    useLayoutEffect(()=>{
        setOpen(hasError)
    },[hasError])
    return <>
        <Popover onOpenChange={(open) => {
            if(!open){
                setOpen(open)
            }
        }}
            content={popoverContent}
            trigger='click' // 获得焦点时显示（例如点击或 tab 聚焦）
            open={open} // 有错误且字段被操作过时才打开
            placement='top' // 提示出现的位置
        >
            {React.cloneElement(children, restProps)}
        </Popover>
    </>
}
const ProFormItem = (props: any) => {
    const { children, ...restProps } = props
    return <Form.Item noStyle {...restProps}>
        <ProFormItemInner {...(children?.props ?? {})}>{children}</ProFormItemInner>
    </Form.Item>
}
const ProForm=(props:ProFormProps)=>{

    return <div className={classNames(styles.proForm)}>
    </div>
}

export default ProForm