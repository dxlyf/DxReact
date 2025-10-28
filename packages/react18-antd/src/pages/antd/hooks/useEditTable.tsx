import { useMap, useMemoizedFn } from 'ahooks';
import { Table, Row, Col, Button ,Input,Select,DatePicker,InputNumber, Form} from 'antd'
import type { GetProp, GetProps, GetRef, TableProps, TableColumnType } from 'antd'
import React, { useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
type DataIndex = Exclude<TableColumnType['dataIndex'], undefined>

type EditColInfo={
    valueType?:string
    title?:any
    index:number,
    record:any
    name:any[]
    dataIndex:DataIndex
    rowKey:number
    fieldProps:any,
    formItemProps:GetProps<typeof Form.Item>
    col:TableColumnType
} 
type TableEditColumnType = Omit<TableColumnType, 'children'> & {
    renderFormItem?: (info:EditColInfo) => React.ReactElement
    valueType?:string
    children?: TableEditColumnType[]
    editable?: boolean
    fieldProps?:any|((record:any,index:number)=>any),
    formItemProps?:GetProps<typeof Form.Item>|((record:any,index:number)=>GetProps<typeof Form.Item>),
}
type UseTableEditProps = Omit<TableProps, 'columns' | 'onChange'> & {
    fieldComponents:Record<string,React.ComponentType>
    name?:DataIndex
    columns?: TableEditColumnType[]
    alwarysEdit?:boolean
    renderHeader?: () => React.ReactNode
    renderFooter?: () => React.ReactNode,
    onChange?: (data: any[]) => void
    onTableChange?: TableProps['onChange']
}
const tableRowKey = 'table_rowIndex'
const dataIndexFlat=(dataIndex:DataIndex)=>{
    return Array.isArray(dataIndex)?dataIndex.join('_'):dataIndex
}
const getNamePath = (dataIndex?: DataIndex) => {
    if(dataIndex===undefined||dataIndex===null){
        return []
    }
    if (Array.isArray(dataIndex)) {
        return dataIndex
    }
    return [dataIndex]
}
const FormFieldComponentsMap={
    text:Input,
    integer:InputNumber,
    date:DatePicker
}

const useTableEdit = (props: UseTableEditProps) => {
    const {name,alwarysEdit,rowSelection,dataSource: propDataSurce,onTableChange, columns, onChange, renderHeader, renderFooter, ...restProps } = props;
    const [innerDataSource, setInnerDataSource] = useState<any[]>([])
    const [editRowKeys, setEditRowKeys] = useState<number[]>([])
    const [selectedRows,setSelectedRows]=useState<any[]>([])
    const isController = propDataSurce !== undefined
    const dataSource = isController ? propDataSurce : innerDataSource
    const latestProps=useRef(props)
    latestProps.current=props
    const prefixName=useMemo(()=>{
        return getNamePath(name)
    },[name])
    const getRowKey = useCallback((record: any) => {
        return record[tableRowKey] as number
    }, [])
    const isEditing = useCallback((record: any) => {
        return alwarysEdit?alwarysEdit:editRowKeys.includes(getRowKey(record))
    }, [getRowKey,editRowKeys,alwarysEdit])

    const getFieldComponent=useCallback((type:string)=>{
         const _FormFieldComponentsMap=latestProps.current.fieldComponents||FormFieldComponentsMap
        return _FormFieldComponentsMap[type]||FormFieldComponentsMap.text
    },[])

    const defaultRenderFormItem=useCallback((editInfo:EditColInfo)=>{
        const {valueType='text',name,fieldProps,formItemProps}=editInfo
        const FieldComponent=getFieldComponent(valueType)
        const dom=<Form.Item name={name} {...formItemProps}>
            <FieldComponent {...fieldProps}></FieldComponent>
        </Form.Item>
      
        return dom
    },[getFieldComponent]);
    const transformColumn = useCallback((col: TableEditColumnType,parentCol?:TableColumnType) => {
        if (col.editable) {
            const { render, editable,valueType,fieldProps={},formItemProps={}, renderFormItem,dataIndex, ...restCol } = col
            return {
                ...restCol,
                dataIndex,
                render: (text, record, index) => {
                    const editing = isEditing(record)
                    if (editing) {
                        const rowKey=getRowKey(record)
                        const editInfo:Partial<EditColInfo>={
                            col:col,
                            valueType,
                            title:col.title,
                            index,
                            record,
                            rowKey,
                            dataIndex:dataIndex!,
                            name:prefixName.length>0?[...prefixName,rowKey,...getNamePath(dataIndex)]:getNamePath(dataIndex)
                        }
                        const _filedProps=typeof fieldProps==='function'?fieldProps(record,index):fieldProps
                        const {dependencies,shouldUpdate,..._formItemProps}=typeof formItemProps==='function'?formItemProps(record,index):formItemProps
                        editInfo.fieldProps=_filedProps
                        editInfo.formItemProps=_formItemProps
                        let dom:React.ReactNode
                        if(renderFormItem){
                            dom= renderFormItem(editInfo as EditColInfo)
                        }else{
                            dom= defaultRenderFormItem(editInfo as EditColInfo)
                        }
                        if(shouldUpdate){
                           return <Form.Item noStyle shouldUpdate={shouldUpdate}>{dom}</Form.Item>
                        }
                        if(dependencies){
                            return <Form.Item noStyle dependencies={dependencies}>{dom}</Form.Item>
                        }
                        return dom
                    }
                    return render ? render(text, record, index) : text
                }
            } as TableEditColumnType
        }
        if (col.children && Array.isArray(col.children)) {
            col.children = col.children.map(childCol => transformColumn(childCol,col))
        }
        return col
    }, [isEditing,getRowKey,prefixName,defaultRenderFormItem])
    const mergeColumns = useMemo<TableEditColumnType[]>(() => {
        return (Array.isArray(columns) ? columns.map((col, index) => {
            return transformColumn(col)
        }) : []) as TableEditColumnType[]
    }, [columns, transformColumn])
    const mergeDataSource = useMemo(() => {
        return dataSource ? dataSource.map((record, index) => {
            return {
                [tableRowKey]: index,
                ...record
            }
        }) : []
    }, [dataSource])
    const setMergeDataSource = useMemoizedFn((data: any[]|((data:any[])=>any[])) => {
        const pureData = typeof data==='function'?data(mergeDataSource):data.map(record => {
            const newRecord: any = {}
            Object.keys(record).forEach((key: string) => {
                if (key !== tableRowKey) {
                    newRecord[key] = record[key]
                }
            })
            return newRecord
        })
        if (!isController) {
            setInnerDataSource(pureData)
        }
        onChange?.(pureData);
    })
    const selectedRowKeys=useMemo(()=>selectedRows.map(d=>getRowKey(d)),[selectedRows,getRowKey])
    const tableProps: TableProps = {
        ...restProps,
        pagination:false,
        rowSelection:rowSelection!==undefined?{
            selectedRowKeys:selectedRowKeys,
            onChange:(selectedRowKeys,selectedRows)=>{
                setSelectedRows(selectedRows)
            },  
            ...rowSelection,
        }:undefined,
        rowKey: tableRowKey,
        dataSource: mergeDataSource,
        columns: mergeColumns,
        onChange:onTableChange
    }
    const editableInstance=useMemo(() => ({
        removeRowKeys: (keys:number[]) => {
            const newData = mergeDataSource.filter(d =>!keys.includes(getRowKey(d)))
            setMergeDataSource(newData)
        },
        removeRows: (records:any[]) => {
            const keys=records.map(d=>getRowKey(d))
            const newData = mergeDataSource.filter(d =>!keys.includes(getRowKey(d)))
            setMergeDataSource(newData)
        },
        removeRow: (record: any) => {
            const newData = mergeDataSource.filter(d => getRowKey(d) !== getRowKey(record))
            setMergeDataSource(newData)
        },
        insertRow: (record: any, index?: number) => {
            const newData = [...mergeDataSource]
            if (typeof index === 'number') {
                newData.splice(index, record)
            } else {
                newData.push(record)
            }
            setMergeDataSource(newData)
        },
        mergeDataSource,
        dataSource,
        editRowKeys,
        selectedRowKeys,
        selectedRows,
        setSelectedRows,
        setEditRowKeys,
        setDataSource:setMergeDataSource,
        getRowKey,
        isEditing
    }), [mergeDataSource,isEditing,setInnerDataSource,getRowKey, dataSource, editRowKeys,setEditRowKeys,selectedRowKeys,selectedRows,setSelectedRows])

    return [tableProps, editableInstance] as [TableProps,typeof editableInstance]
}
export {
    useTableEdit
}
