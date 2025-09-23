import React, { useCallback, useMemo, useState } from 'react'
import {Table,Select,InputNumber,DatePicker,Form,Row,Col,Space,Button} from 'antd'
import type {GetProps,GetRef,GetProp} from 'antd'
import { InfoCircleOutlined, MinusOutlined, PlusOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons'
import {useControllableValue, useMemoizedFn} from 'ahooks'

type TableProps=GetProps<typeof Table>
type EditableTableProps=Omit<TableProps,'columns'|'onChange'|'dataSource'|'rowKey'>&{
    rowKey?:string
    onSaveRow?:(record:any)=>void
    columns:ColumnType[]
    onChange:(data:any[])=>void
    dataSource:any[]
}
type RowSelection=GetProp<typeof Table,'rowSelection'>

type EditTableCellProps={
    editing:boolean
    editable?:boolean
    dataIndex?:string
    record?:any
    renderFormItem?:(record:any,editing:boolean)=>React.ReactNode
    renderText?:(record:any,editing:boolean)=>React.ReactNode
}
type ColumnType=GetProp<typeof Table,'columns'>[number]&Omit<EditTableCellProps,'editting'>

const EditTableCell=(props:EditTableCellProps)=>{
    const {editable,editing,dataIndex,record,renderFormItem,renderText}=props
    const dom=editing?renderFormItem?.(record,editing):renderText?.(record,editing)
    return <td>{dom}</td>
}
const components:GetProp<typeof Table,'components'>={
    body:{
        cell:EditTableCell
    }
}
let rowId=0
const EditableTable=(props:EditableTableProps)=>{
    const {columns,rowKey='key',dataSource,onChange,...restProps}=props

    const []=useState([])
    const [selectedRowKeys,setSelectedRowKeys]=useState<string[]>([])
    const [editRows,setEditRows]=useState<string[]>([])
    const getPrimaryValue=useCallback((record:any,index?:any)=>{
        return  record[rowKey] as string
    },[rowKey])
    const isEditing=useCallback((record:any)=>{
        return editRows.includes(getPrimaryValue(record))
    },[getPrimaryValue,editRows])

    const mergeColumns=useMemo<ColumnType[]>(()=>[{
        title:'序号',
        render(value,record,index){
            return index+1
        }
    } as ColumnType].concat(columns).map(col=>{
         if(!col.editable){
            return col
         }
         return {
            ...col,
            onCell:(record,index)=>{
                return {
                    editing:isEditing(record),
                    dataIndex:col.dataIndex,
                    editable:col.editable,
                    record:record
                }
            },
         } as ColumnType
    }),[columns,isEditing])
    const handleRowSelectionChange=useCallback<NonNullable<RowSelection['onChange']>>((selectedRowKeys, selectedRows)=>{
       // setSelectedRows(selectedRows as any[])
    },[])
    const onRow=useMemoizedFn((record,index)=>{
        return {
            onMouseDown:()=>{
                setSelectedRowKeys(Array.from(new Set(selectedRowKeys.concat(getPrimaryValue(record)))))
            }
        }
    })
    const insertRows=(record:any,index:number)=>{
         let newdataSource=[...dataSource]
         newdataSource.splice(index,0,record)
         onChange(newdataSource)
    }
    const handInsert=()=>{
        let index=dataSource.length
        if(selectedRowKeys.length){
             index=dataSource.findIndex(d=>getPrimaryValue(d)===selectedRowKeys[0])
        }
        insertRows({
            [rowKey]:rowId++
        },index)
    }
    return <Form component={false}>
           <Row justify={'end'} style={{marginBottom:6}}>
                                <Col flex={'none'}>
                                    <Space size={'small'}>
                                        <Button size={'small'} icon={<PlusOutlined></PlusOutlined>} onClick={handInsert}>插入行</Button>
                                        <Button size={'small'} icon={<CopyOutlined></CopyOutlined>}>複製行</Button>
                                        <Button size={'small'} icon={<DeleteOutlined></DeleteOutlined>}>刪除行</Button>
                                    </Space>
                                </Col>
                            </Row>
            <Table onRow={onRow} components={components} size='small' dataSource={dataSource} bordered  columns={mergeColumns} {...restProps}>
            </Table>
    </Form>
}

export {
    EditableTable
}