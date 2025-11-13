import { RightOutlined } from "@ant-design/icons"
import { useMemoizedFn } from "ahooks"
import { Button, Dropdown, Space, Modal, Popconfirm } from "antd"
import type { ButtonProps, PopconfirmProps, ModalFuncProps } from 'antd'
import React, { useMemo, useRef } from "react"
import { useCallback } from "react"

type ModalConfirmProps = ModalFuncProps & {
    stateProps?: (status: 'idle' | 'confirm' | 'fail') => ModalFuncProps
}
type ActionItem = {
    key: string
    icon?: React.ReactNode
    label: React.ReactNode
    children?: React.ReactElement
    disabled?: boolean
    props?: ButtonProps
    popconfirmProps?: PopconfirmProps
    modalConfirmProps?: ModalConfirmProps
    permissionCode?: string|string[]
    order?: number
    onClick?: (item: ActionItem, e: React.MouseEvent) => boolean | Promise<boolean>
}
type TableBtnActionProps = {
    size?: 'small' | 'middle' | 'large';
    disabled?: boolean
    maxShowCount?: number
    items?:ActionItem[]
    moreTrigger?: ('click' | 'hover' | 'contextMenu')[]
    transformItem?: (item: ActionItem) => ActionItem
    onItemClick?: (item: ActionItem, e: React.MouseEvent) => boolean | Promise<boolean>

}
const defaultMoreTrigger: TableBtnActionProps['moreTrigger'] = ['hover']
const defaultBtnStyle = { margin: 0, padding: 0, fontSize: 12 }
const TableBtnAction = (props: React.PropsWithChildren<TableBtnActionProps>) => {
    const { maxShowCount = 3, transformItem, moreTrigger = defaultMoreTrigger, size = 'small', disabled, children, items:propItems=TableBtnAction.GeneralListAction, onItemClick } = props
    const latestProps=useRef(props)
    latestProps.current=props

    const handleItemClick = useMemoizedFn(async (item: ActionItem, e: React.MouseEvent) => {
        if(disabled||item.disabled){
            return
        }
        const handleCallback = async () => {
            if (item.onClick) {
                return await item.onClick?.(item, e)
            } else {
                return await onItemClick?.(item, e)
            }
        }
        if (item.modalConfirmProps) {
            const { onCancel, stateProps, ...restModalProps } = item.modalConfirmProps
            const newProps: ModalFuncProps = {
                ...(stateProps ? stateProps('idle') : {}),
                onOk: async () => {
                    modal.update({
                        ...newProps,
                        ...(stateProps ? stateProps('confirm') : {}),
                    })
                    try {
                        let res = await handleCallback()
                        if (res === false) {
                            throw 'cancel'
                        }
                    } catch (e) {
                        // console.log(e)
                        modal.update({
                            ...newProps,
                            ...(stateProps ? stateProps('fail') : {}),
                        })
                        throw e
                    } finally {
                    }
                },
                onCancel: () => {
                    onCancel?.()
                },
                ...restModalProps,
            }
            const modal = Modal.confirm(newProps)
        } else {
            await handleCallback()
        }

    })
    const items=useMemo(()=>{
        return propItems.filter(item=>{
             if (latestProps.current.transformItem) {
                item = latestProps.current.transformItem(item)
            }
            if(item.permissionCode){
                return true
            }
            return true
        }).sort((a,b)=>{
            return (b.order || 0) - (a.order || 0)
        })
    },[propItems])
    // 普通样式按丑
    const { normalItems, moreItems } = useMemo(() => {
        const normalItems: ActionItem[] = [], moreItems: ActionItem[] = []
        const curMaxShowCount = items.length > maxShowCount ? maxShowCount - 1 : maxShowCount
        items.forEach((item, index) => {
            if (index < curMaxShowCount) {
                normalItems.push(item)
            } else {
                moreItems.push(item)
            }
        })
        return {
            normalItems,
            moreItems
        }
    }, [items])
    const renderNormalItem = (item: ActionItem) => {
        const curDisabled = disabled || item.disabled || false
        let { style = defaultBtnStyle, ...restProps } = item.props || {}
        if (style !== defaultBtnStyle) {
            style = {
                ...defaultBtnStyle,
                ...style
            }
        }
        if (item.children) {
            return React.cloneElement(item.children, { key: item.key, disabled: curDisabled, onClick: handleItemClick.bind(null, item), ...props })
        } else {
            return <Button size={size} key={item.key} disabled={curDisabled} style={style} type='link' onClick={handleItemClick.bind(null, item)} {...restProps}>{item.label}</Button>
        }
    }
    const renderNormalItems = (items: ActionItem[]) => {
        return items.map((item) => {
            return renderNormalItem(item)
        })
    }
    const renderMoreItems = (items: ActionItem[]) => {
        return <Dropdown
            menu={{
                items: items.map(item => {
                    return {
                        key: item.key,
                        icon: item.icon,
                        label: item.label,
                        disabled:item.disabled,
                        onClick: handleItemClick.bind(null, item)
                    }
                }) as any
            }}
            trigger={moreTrigger}
        >
            <Button size={size} type="text" style={defaultBtnStyle}>
                更多<RightOutlined />
            </Button>
        </Dropdown>
    }
    const renderDom = () => {
        if (children) {
            return children
        }

        return <>
            {normalItems.length > 0 && renderNormalItems(normalItems)}
            {moreItems.length > 0 && renderMoreItems(moreItems)}
        </>
    }
    return <Space>
        {renderDom()}
    </Space>
}
const OPERATION_ACTIONS = {
    EDIT: {
        key: 'edit',
        label: '編輯',
        order:101,
    } as ActionItem,
    DELETE: {
        key: 'del',
        label: '删除',
        order:100,
        props: {
            danger: true
        },
        modalConfirmProps: {
            type: 'confirm',
            title: '確認刪除',
            content: '是否確認刪除？',
            okText: '確定',
            cancelText: '取消',
            okButtonProps: { loading: false, danger: false },
            cancelButtonProps: { disabled: false },
            stateProps(status) {
                if (status === 'confirm') {
                    return {
                        title: '删除中',
                        content: '正在刪除，請稍候...',
                        okText: '删除中',
                        okButtonProps: { loading: true, danger: false },
                        cancelButtonProps: { disabled: true },
                    }
                } else if (status === 'fail') {
                    return {
                        title: '刪除失敗',
                        content: '刪除失敗，請重試',
                        okText: '重試',
                        okButtonProps: { loading: false, danger: false },
                        cancelButtonProps: { disabled: false },
                    }
                }
                return {}
            }
        }
    } as ActionItem,
    SUBMIT: {
        key: 'submit',
        label: '提交'
    } as ActionItem,
    DETAIL: {
        key: 'detail',
        label: '詳情'
    } as ActionItem,
    COPY: {
        key: 'copy',
        label: '複製'
    } as ActionItem,
}
TableBtnAction.ACTIONS = OPERATION_ACTIONS
// 一般列表操作按钮
TableBtnAction.GeneralListAction = [
    OPERATION_ACTIONS.DETAIL,
    OPERATION_ACTIONS.EDIT,
    OPERATION_ACTIONS.DELETE,
    OPERATION_ACTIONS.COPY,
    OPERATION_ACTIONS.SUBMIT,
]
export default TableBtnAction