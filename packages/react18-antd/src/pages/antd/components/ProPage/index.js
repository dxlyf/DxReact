import { RightOutlined } from "@ant-design/icons";
import useMemoizedFn from "../../hooks/useMemoizedFn";
import { Button, Dropdown, Space, Modal } from "antd";
import React, { useMemo, useRef } from "react";
import { usePermission } from '../ProPage'
import { approvalStatusEnum } from '../ApprovalStatusSelect'
const defaultMoreTrigger = ['hover'];
const defaultBtnStyle = { margin: 0, padding: 0 };
const TableBtnAction = (props) => {
    const { items = TableBtnAction.GeneralListAction, maxShowCount = 3, pageCode, transformItem, moreTrigger = defaultMoreTrigger, size = 'small', disabled, children, onItemClick } = props;
    const latestProps = useRef(props)
    const { hasAnyPermissions, pagePermissionInfo } = usePermission(pageCode)

    const handleItemClick = useMemoizedFn(async (item, e) => {
        if (disabled || item.disabled) {
            return;
        }
        const handleCallback = async () => {
            if (item.onClick) {
                return await item.onClick?.(item, e);
            }
            else {
                return await onItemClick?.(item, e);
            }
        };
        if (item.modalConfirmProps) {
            const { onCancel, stateProps, ...restModalProps } = item.modalConfirmProps;
            const newProps = {
                ...(stateProps ? stateProps('idle') : {}),
                onOk: async () => {
                    modal.update({
                        ...newProps,
                        ...(stateProps ? stateProps('confirm') : {}),
                    });
                    try {
                        let res = await handleCallback();
                        if (res === false) {
                            throw 'cancel';
                        }
                    }
                    catch (e) {
                        // console.log(e)
                        modal.update({
                            ...newProps,
                            ...(stateProps ? stateProps('fail') : {}),
                        });
                        throw e;
                    }
                },
                onCancel: () => {
                    onCancel?.();
                },
                ...restModalProps,
            };
            const modal = Modal.confirm(newProps);
        }
        else {
            await handleCallback();
        }
    });
    const permissionItems = useMemo(() => {
        return items.filter(oldItem => {
            let item = { ...oldItem }
            if (latestProps.current.transformItem) {
                item = latestProps.current.transformItem(item);
            }
            if (pagePermissionInfo && item.permissionCode) {
                return hasAnyPermissions(item.permissionCode)
            }
            return true
        }).sort((a, b) => {
            return (b.order ?? 0) - (a.order ?? 0)
        })
    }, [items, pagePermissionInfo])
    // 普通样式按丑
    const { normalItems, moreItems } = useMemo(() => {
        const normalItems = [], moreItems = [];
        const curMaxShowCount = permissionItems.length > maxShowCount ? maxShowCount - 1 : maxShowCount;
        permissionItems.forEach((item, index) => {
            if (index < curMaxShowCount) {
                normalItems.push(item);
            }
            else {
                moreItems.push(item);
            }
        });
        return {
            normalItems,
            moreItems
        };
    }, [permissionItems]);
    const renderNormalItem = (item) => {
        const curDisabled = disabled || item.disabled || false;
        let { style = defaultBtnStyle, ...restProps } = item.props || {};
        if (style !== defaultBtnStyle) {
            style = {
                ...defaultBtnStyle,
                ...style
            };
        }
        if (item.children) {
            return React.cloneElement(item.children, { key: item.key, disabled: curDisabled, onClick: handleItemClick.bind(null, item), ...props });
        }
        else {
            return <Button size={size} key={item.key} disabled={curDisabled} style={style} type='link' onClick={handleItemClick.bind(null, item)} {...restProps}>{item.label}</Button>;
        }
    };
    const renderNormalItems = (items) => {
        return items.map((item) => {
            return renderNormalItem(item);
        });
    };
    const renderMoreItems = (items) => {
        return <Dropdown menu={{
            items: items.map(item => {
                return {
                    key: item.key,
                    icon: item.icon,
                    label: item.label,
                    disabled: item.disabled,
                    onClick: handleItemClick.bind(null, item)
                };
            })
        }} trigger={moreTrigger}>
            <Button size={size} type="text" style={defaultBtnStyle}>
                更多<RightOutlined />
            </Button>
        </Dropdown>;
    };
    const renderDom = () => {
        if (children) {
            return children;
        }
        return <>
            {normalItems.length > 0 && renderNormalItems(normalItems)}
            {moreItems.length > 0 && renderMoreItems(moreItems)}
        </>;
    };
    return <Space>
        {renderDom()}
    </Space>;
};
const OPERATION_ACTIONS = {
    EDIT: {
        key: 'EDIT',
        label: '编辑',
        order: 100,
        permissionCode: 'edit'
    },
    DELETE: {
        key: 'DEL',
        label: '删除',
        order: 99,
        props: {
            danger: true
        },
        permissionCode: 'del',
        modalConfirmProps: {
            type: 'confirm',
            title: '確認刪除',
            content: '是否確認刪除？',
            okText: '確定',
            cancelText: '取消',
            className: 'ah-confirm-modal',
            okButtonProps: { loading: false, danger: false },
            cancelButtonProps: { disabled: false },
            stateProps(status) {
                if (status === 'confirm') {
                    return {
                        title: '删除中',
                        content: '正在删除，請稍候...',
                        okText: '删除中',
                        okButtonProps: { loading: true, danger: false },
                        cancelButtonProps: { disabled: true },
                    };
                }
                else if (status === 'fail') {
                    return {
                        title: '删除失败',
                        content: '删除失败，請重試',
                        okText: '重試',
                        okButtonProps: { loading: false, danger: false },
                        cancelButtonProps: { disabled: false },
                    };
                }
                return {};
            }
        }
    },
    DETAIL: {
        key: 'DETAIL',
        label: '詳情',
        permissionCode: 'detail'
    },
    COPY: {
        key: 'COPY',
        label: '複製',
        permissionCode: ['edit']
    },
    SUBMIT: {
        key: 'SUBMIT',
        label: '提交',
        permissionCode: ['edit','submit']
    },
    BJLGS: {
        key: 'BJLGS',
        label: '不計入工傷',
        permissionCode: ['BJLGS']
    },
    JLGS: {
        key: 'JLGS',
        label: '計入工傷',
        permissionCode: ['BJLGS']
    },
};
TableBtnAction.ACTIONS = OPERATION_ACTIONS;

// 一般列表操作按钮
TableBtnAction.GeneralListAction = [
    OPERATION_ACTIONS.EDIT,
    OPERATION_ACTIONS.DELETE,
    OPERATION_ACTIONS.DETAIL,
    OPERATION_ACTIONS.COPY,
];
// 工伤意外
TableBtnAction.GSYWlListAction =(record)=>{
    // 工伤判断
    if(record.status==1){
        return  [
            OPERATION_ACTIONS.EDIT,
            OPERATION_ACTIONS.DETAIL,
            OPERATION_ACTIONS.JLGS,
        ];
    }else{
        return  [
            OPERATION_ACTIONS.EDIT,
            OPERATION_ACTIONS.DETAIL,
            OPERATION_ACTIONS.BJLGS,
        ];
    }
}
// 审批状态显示按钮
TableBtnAction.ApprovalStatusAction = (record) => {
    let status=record!==null&&typeof record==='object'?record.approvalStatus:record
    switch (status) {
        case approvalStatusEnum.DRAFT:
            return [OPERATION_ACTIONS.DETAIL,OPERATION_ACTIONS.EDIT,OPERATION_ACTIONS.DELETE,OPERATION_ACTIONS.SUBMIT,OPERATION_ACTIONS.COPY];
        case approvalStatusEnum.APPROVING:
        case approvalStatusEnum.APPROVED:
        case approvalStatusEnum.STOPPED:
             return [OPERATION_ACTIONS.DETAIL, OPERATION_ACTIONS.COPY];
        default:
            return [];
    }
}
export default TableBtnAction;
