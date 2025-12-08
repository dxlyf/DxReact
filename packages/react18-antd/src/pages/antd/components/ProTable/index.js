import { EditableProTable,ProTable as AntdProTable,useMountMergeState } from '@ant-design/pro-components'
import React,{ useCallback, useMemo, useRef, useState } from 'react'
import { Row, Col, Button, Space,Table as AntTable } from 'antd'
import { useMemoizedFn } from 'ahooks'
import classNames from 'classnames'
import { useColumnSetting } from './ColumnSetting'
import styles from './index.module.css'
import {useTableEdit,TableEdit} from './TableEdit'
import stylesBase from '../BaseTable/index.module.css'
import TableBtnAction from './TableBtnAction'
/***
 * type ToolBarRender<T> = Extract<EditableProTableProps<T, any>['toolbar'], Function>;

type ActionBtn = {
    key: string
    label: React.ReactNode
    onClick: () => void
}
type UseTableProps = {
    columnStorageKey?: string
    schemaForm?: FormInstance
    defaultPageSize?: number
    showColumnSetting?: boolean
    serialNumberColumn?:ProColumns
    scrollY?: number
    leftHeaderSlot?:React.ReactNode
    rightHeaderSlot?:React.ReactNode
} & TableProps<any, any>
type TableProps<T, U extends ParamsType, ValueType = 'text'> = {
    renderHeaderSlot?: (defaultDom: React.ReactNode) => React.ReactNode
    renderFooterSlot?: (defaultDom: React.ReactNode) => React.ReactNode

} & EditableProTableProps<T, U, ValueType>
export type {
    ProColumns as TableColumn,
    ActionType
}
 */

/**
 * 
 * @param {() => ProColumns[]} factory 
 * @param {unknown[]} deps 
 * @returns {ProColumns[]}
 */
const useProTableColumns = (factory, deps=[]) => {
    return useMemo(factory, deps)
}
/**
 * 
 * @param {NonNullable<EditableProTableProps<any, any>['request']>} request 
 * @param {*} deps 
 * @returns {Promise<{data:any[],total:number,success:boolean}>}
 */
const useProTableRequest = (request, deps=[]) => {
    return useCallback(request, deps)
} 


const defaultEmptyObject={}
/**
 * 
 * @param {UseTableProps} props 
 * @returns 
 */
const useProTable = (props) => {
    const {schemaForm,schemaFormRef,rowSelection,manualRequest=true,leftHeaderSlot,rightHeaderSlot, renderHeaderSlot, renderFooterSlot,serialNumberColumn=true,columns:propColumns, columnStorageKey, showColumnSetting = true, scrollY = 300, className, request, ...restProps } = props
    const [loading,setLoading]=useState(false)
    const innerStateRef=useRef({startIndex:0})
    const [selectedRows,setSelectedRows]=useState([])
    const handleRequest = useMemoizedFn(async (params, sorter, filters) => {
        const formFilterParams = schemaFormRef&&schemaFormRef.current?schemaFormRef.current.getFieldsFormatValue():(schemaForm ? schemaForm.getFieldsValue() : {})
        const newParams = {
            ...formFilterParams,
            ...params
        }
        setLoading(true)
        if(params.current===1){
            setSelectedRows([])
        }
        if(params.current&&params.pageSize){
            innerStateRef.current.startIndex=params.current*params.pageSize-params.pageSize
        }
        let result={success:true,data:[],total:0}
        try{
            result = await request(newParams, sorter, filters)
        }catch(e){
            console.log('[UseProTable]请求时发生异常:',e)
            result={success:true,data:[],total:0}
        }finally{
            setLoading(false)
        }
 
        return result
    })
    const { children, columns } = useColumnSetting({ columns: propColumns, storageKey: showColumnSetting&&columnStorageKey ? columnStorageKey : undefined })
    const defaultHeaderDom = showColumnSetting&&columnStorageKey&&children
    
    const handleRowSelectChange=useCallback((rowKeys,rows)=>{
        setSelectedRows([...rows])
    },[])
    const clearRowSelection=useCallback(()=>{
        setSelectedRows([])
    },[])
    const rowKey=restProps.rowKey||'id'
    const selectedRowKeys=useMemo(()=>{
        return selectedRows.map(d=>d[rowKey])
    },[selectedRows])
    const proTableProps= {
        //loading,
        manualRequest,
        rowKey: rowKey,
        bordered: true,
        size: 'middle',
        className: classNames(styles.table, className),
        scroll: { x: '100%', y: `calc(100vh - ${scrollY}px)` },
        showSorterTooltip:false,
        renderHeaderSlot: () => {
            if(renderHeaderSlot===null||(!leftHeaderSlot&&!rightHeaderSlot&&!defaultHeaderDom)){
                return null
            }
            if(renderHeaderSlot){
                return renderHeaderSlot(defaultHeaderDom)
            }
            return (<Row justify={'space-between'} align="middle"  style={{paddingBottom:10}}>
                <Col flex={'none'}>
                    {leftHeaderSlot}
                </Col>
                <Col flex={'none'}>
                <Space>
                    {typeof rightHeaderSlot==='function'?rightHeaderSlot({selectedRowKeys,selectedRows}):rightHeaderSlot}
                    {defaultHeaderDom}
                </Space>
                </Col>
            </Row>)
        },
        renderFooterSlot: () => {
            if (renderFooterSlot) {
                return renderFooterSlot()
            }
            return <></>
        },
        columns: useMemo(()=>{
            let nextColumns=[...columns]
            if(serialNumberColumn){
                nextColumns.unshift({
                    title:'序號',
                    width:60,
                    fixed:'left',
                    render:(text,record,index)=>{
                        return innerStateRef.current.startIndex+(index+1)
                    },
                    ...serialNumberColumn
                })
            }
           // nextColumns=nextColumns.map(col=>({...col,align:'center'}))
            return nextColumns
        },[serialNumberColumn,columns]),
        request: handleRequest,
        rowSelection:rowSelection!=undefined&&rowSelection!==false?{
            selectedRowKeys:selectedRowKeys,
            onChange:handleRowSelectChange,
            ...rowSelection
        }:rowSelection,
        pagination:{
            defaultPageSize:10,
        },
        ...restProps
    }
    return {
        loading,
        selectedRowKeys,
        selectedRows,
        setSelectedRows,
        proTableProps
    }
}
const orderMap = {
    'ascend': 'asc',
    'descend': 'desc',
}
const transformTableSorter=(sorter)=>{
    return Object.entries(sorter).map(d=>({field:d[0],order:orderMap[d[1]]||d[1]}))
}
const ProTable = (props) => {
    const { renderHeaderSlot,pagination:propPagination,tableWrapperClass, renderFooterSlot,className,columns:propColumns, ...restProps } = props
    const columns=useMemo(()=>propColumns.map(col=>({...col,align:'center'})),[propColumns])
    const pagination=propPagination!==false?{
        defaultPageSize:10,
        showQuickJumper: true,
        showSizeChanger: true,
        showTotal: d => `共 ${d} 條`,
        size: 'default',
        className: stylesBase['box-table-pagination'],
        ...(propPagination||{}),

    }:propPagination
    const headerSlotDom=renderHeaderSlot?renderHeaderSlot(null):null
    return <div className={classNames(styles.tableWrapper,tableWrapperClass)}>
        {headerSlotDom?<div className={styles.tableHeaderWrapper}>{headerSlotDom}</div>:null}
        <AntdProTable  columns={columns} pagination={pagination} className={classNames(styles.table,className)}  showSorterTooltip={false}  search={false} options={false} tableAlertRender={false} {...restProps}></AntdProTable>
       {renderFooterSlot?renderFooterSlot(null):null}
    </div>
}
const ProEditTable = (props) => {
    const { renderHeaderSlot, renderFooterSlot,tableWrapperClass, ...restProps } = props
    return <div className={classNames(styles.tableWrapper,tableWrapperClass)}>
        {renderHeaderSlot?<div className={styles.tableHeaderWrapper}>{renderHeaderSlot(null)}</div>:null}
        <EditableProTable recordCreatorProps={false} showSorterTooltip={false}  search={false} options={false} tableAlertRender={false} {...restProps}></EditableProTable>
       {renderFooterSlot?renderFooterSlot(null):null}
    </div>
}
const Table=(props)=>{
    const {className,...restProps}=props
    return <AntTable className={classNames(styles.table,className)} {...restProps}></AntTable>
}
Object.assign(Table,AntTable)
export {
    ProEditTable,
    ProTable,
    Table,
    transformTableSorter,
    useProTable,
    useProTableColumns,
    useProTableRequest,
    useMountMergeState,
    TableEdit,
    useTableEdit,
    TableBtnAction
}