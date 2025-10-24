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
    const {name,children,renderAction,newAddBtnText='',...restProps } = props
    const [tableProps, editableInstance] = useTableEdit({
        ...restProps,
        size: 'small',
        alwarysEdit: true,
        columns: useMemo(() => {
            return [
                {
                    title: 'name',
                    dataIndex: 'name',
                    editable: true,
                    colSpan:2,
                    valueType:'text',
                    width:100,
                    onCell(){
                        return {
                            colSpan:2,
                        }
                    }
                },{
                    title:'address',
                    colSpan:0,
                    dataIndex:'a',
                     onCell(){
                        return {
                            colSpan:0,
                        }
                    }
                },
                {
                    title: 'age',
                    dataIndex: 'age',
                    editable: true,
                    width:100,
                    valueType:'integer'
                }
            ]
        }, []),
        rowSelection: {
            getTitleCheckboxProps(){
                return {
                    disabled:true
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
        editableInstance.setSelectedRows([])
    }
    const handleAdd=()=>{
         editableInstance.insertRow({})
        editableInstance.setEditRowKeys([editableInstance.dataSource.length])
    }
    const selectedRowKeys=editableInstance.selectedRowKeys
    Table.Summary.Cell
    const actionDom=<Space>
                            <Button type="primary" danger size="small" onClick={handleBatchDelete} disabled={!selectedRowKeys.length}>
                                刪除{selectedRowKeys.length ? ` ${selectedRowKeys.length} 條數據` : ''}
                            </Button>
                            <Button type="primary" size="small" onClick={handleAdd}>新增{newAddBtnText}</Button>
                        </Space>
    const tableDom= <Table tableLayout='fixed' summary={(data)=>{
        let index=0
        return <Table.Summary.Row>
            <Table.Summary.Cell index={index++}></Table.Summary.Cell>
              <Table.Summary.Cell  index={index++} style={{width:100}}>次数</Table.Summary.Cell>
                <Table.Summary.Cell  index={index++}>34</Table.Summary.Cell>
                      <Table.Summary.Cell index={index++}>34</Table.Summary.Cell>
        </Table.Summary.Row>
    }}  bordered {...tableProps}></Table>
    return <>
        {typeof children==='function'?children({
            tableDom,
            actionDom
        }):<>
             <Row justify={'space-between'} style={{marginBottom:8}}>
                <Col flex='none'>
                <span>應急演習</span>
                </Col>
                <Col flex='none'>{actionDom}</Col>
             </Row>
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
                <TableEdit name='list'></TableEdit>
            </Form.Item>
            <Button htmlType='submit'>提交</Button>
        </Form>
    </div>
}
export default Demo