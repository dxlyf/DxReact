import { Button, Col, Form, Input, Popover, Row, Space, Table } from 'antd'
import { useTableEdit } from '../hooks/useEditTable'
import { useLayoutEffect, useMemo, useState } from 'react'
import React from 'react'

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
const TableEdit = (props: any) => {
    const {children,renderAction,...restProps } = props
    const [tableProps, editableInstance] = useTableEdit({
        ...restProps,
        size: 'small',
       //alwarysEdit: true,
        columns: useMemo(() => {
            return [
                {
                    title:'序号',
                    width:80,
                    onCell(record){
                        const editing=editableInstance.isEditing(record)
                        console.log('editing',editing,'s',editableInstance)
                        return {
                            style:{
                                background:editing?'blue':'#fff'
                            }
                        }
                    },
                    render(text,r,i){
                        return i+1
                    }
                },
                {
                    title: 'name',
                    dataIndex: 'name',
                    editable: true,
                    renderFormItem: (editInfo) => {
                        return <ProFormItem noStyle name={editInfo.name} rules={[
                            {
                                required: true,
                                message: '不能为空'
                            }
                        ]}>
                            <Input size='small'></Input>

                        </ProFormItem>
                    }
                },
                {
                    title: 'age',
                    dataIndex: 'age',
                    editable: false,
                    renderFormItem: (editInfo) => {
                        return <ProFormItem noStyle name={editInfo.name} rules={[
                            {
                                required: true,
                                message: '不能为空'
                            }
                        ]}>
                            <Input></Input>
                        </ProFormItem>
                    }
                }
            ]
        }, []),
        rowSelection: {
            getTitleCheckboxProps() {
                return {
                    style: {
                        display: 'none'
                    }
                }
            }
        },
        onRow:(record,index)=>{
            return {
                onMouseDown:()=>{
                   // editableInstance.setEditRowKeys([index])
                }
            }
        }
    })
    const handleBatchDelete=()=>{
             editableInstance.removeRowKeys(editableInstance.selectedRowKeys)
    }
    const handleAdd=()=>{
         editableInstance.insertRow({})
        editableInstance.setEditRowKeys([editableInstance.dataSource.length])
    }
    let okText
    const hiddenLabel=false,label='表格',hiddenAddButton=false
    const selectedRowKeys=editableInstance.selectedRowKeys
    const actionDom=<Space>
                            <Button type="primary" danger size="small" onClick={handleBatchDelete} disabled={!selectedRowKeys.length}>
                                刪除{selectedRowKeys.length ? ` ${selectedRowKeys.length} 條數據` : ''}
                            </Button>
                            <Button type="primary" size="small" onClick={handleAdd}>新增{okText || label}</Button>
                        </Space>
    const tableDom= <Table  {...tableProps}></Table>
    return <>
        {typeof children==='function'?children({
            tableDom,
            actionDom
        }):<>
             {actionDom}
            {tableDom}
        </>}
    </>
}

const Demo = (props: TableEditProps) => {


    return <div>
        <Form layout='vertical' onFinish={(values) => {
            console.log('onFinish', values)
        }}>
            <Form.Item noStyle   name='list' valuePropName='dataSource'>
                <TableEdit name='list'>{({tableDom,actionDom})=>{
                    return <Form.Item label={<><Row justify={'space-between'}>
                            <Col>表格</Col>
                             <Col>{actionDom}</Col>
                        </Row></>}  >
                        {tableDom}
                    </Form.Item>
                }}</TableEdit>
            </Form.Item>
            <Button htmlType='submit'>提交</Button>
        </Form>
    </div>
}
export default Demo