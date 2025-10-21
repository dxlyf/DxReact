import { useMap, useMemoizedFn } from 'ahooks';
import { Table, Row, Col, Button } from 'antd'
import type { GetProp, GetProps, GetRef, TableProps, TableColumnType } from 'antd'
import React, { useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
type DataIndex = Exclude<TableColumnType['dataIndex'], undefined>

type EditColInfo={
    title?:any
    index:number,
    record:any
    name:any[]
    dataIndex:DataIndex
    rowKey:number
} 
type TableEditColumnType = Omit<TableColumnType, 'children'> & {
    renderFormItem?: (info:EditColInfo) => React.ReactElement
    children?: TableEditColumnType[]
    editable?: boolean
}
type UseTableEditProps = Omit<TableProps, 'columns' | 'onChange'> & {
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
const useTableEdit = (props: UseTableEditProps) => {
    const {name,alwarysEdit,rowSelection,dataSource: propDataSurce,onTableChange, columns, onChange, renderHeader, renderFooter, ...restProps } = props;
    const [innerDataSource, setInnerDataSource] = useState<any[]>([])
    const [editRowKeys, setEditRowKeys] = useState<number[]>([])
    const [selectedRows,setSelectedRows]=useState<any[]>([])
    const isController = propDataSurce !== undefined
    const dataSource = isController ? propDataSurce : innerDataSource
    const prefixName=useMemo(()=>{
        return [...getNamePath(name)] 
    },[name])
    const getRowKey = useCallback((record: any) => {
        return record[tableRowKey] as number
    }, [])
    const isEditing = useCallback((record: any) => {
        return alwarysEdit?alwarysEdit:editRowKeys.includes(getRowKey(record))
    }, [getRowKey,editRowKeys,alwarysEdit])

 
    const transformColumn = useCallback((col: TableEditColumnType,parentCol?:TableColumnType) => {
        if (col.editable) {
            const { render, editable, renderFormItem,dataIndex, ...restCol } = col
            return {
                ...restCol,
                dataIndex,
                render: (text, record, index) => {
                    const editing = isEditing(record)
                    if (editing) {
                        const rowKey=getRowKey(record)
                        const eidtInfo:EditColInfo={
                            title:col.title,
                            index,
                            record,
                            rowKey,
                            dataIndex:dataIndex!,
                            name:[...prefixName,rowKey,...getNamePath(dataIndex)]
                        }
                        return renderFormItem?.(eidtInfo)
                    }
                    return render ? render(text, record, index) : text
                }
            } as TableEditColumnType
        }
        if (col.children && Array.isArray(col.children)) {
            col.children = col.children.map(childCol => transformColumn(childCol,col))
        }
        return col
    }, [isEditing,getRowKey,prefixName])
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
