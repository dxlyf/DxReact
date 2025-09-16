import { EditableProTable } from '@ant-design/pro-components'
import type { ProColumns, EditableProTableProps, ParamsType,ActionType } from '@ant-design/pro-components'
import type { FormInstance, TablePaginationConfig } from 'antd'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Row, Col, Button, Space } from 'antd'
import { useMemoizedFn } from 'ahooks'
import classNames from 'classnames'
import { useColumnSetting } from './components/ColumnSetting'
import styles from './index.module.css'
type ToolBarRender<T> = Extract<EditableProTableProps<T, any>['toolbar'], Function>;

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
    scrollY?: number
    // 表单右上角的下拉菜单操作按钮,完全覆盖
    menuActions?: ActionBtn;
    // 表单右上角的操作按钮,完全覆盖
    actions?: ActionBtn[];
    leftHeaderSlot?:React.ReactNode
    rightHeaderSlot?:React.ReactNode
    serialNumberColumn?:ProColumns
} & TableProps<any, any>
type TableProps<T, U extends ParamsType, ValueType = 'text'> = {
    renderHeaderSlot?: (defaultDom: React.ReactNode) => React.ReactNode
    renderFooterSlot?: (defaultDom: React.ReactNode) => React.ReactNode

} & EditableProTableProps<T, U, ValueType>
export type {
    ProColumns as TableColumn,
    ActionType
}
const useTableColumns = (factory: () => ProColumns[], deps: readonly unknown[]) => {
    return useMemo(factory, deps)
}
const useTableRequest = (request: NonNullable<EditableProTableProps<any, any>['request']>, deps: readonly unknown[]) => {
    return useCallback(request, deps)
}
const useSerialNumberColumn=(config:ProColumns={})=>{
    return {
        title:'序號',
        dataIndex:'_serialNo',
        render:(text,record,index)=>{
            return index+1
        },
        ...config
    }
}
const defaultEmptyObject={}
const useTable = (props: UseTableProps) => {
    const { schemaForm,leftHeaderSlot,rightHeaderSlot, renderHeaderSlot, renderFooterSlot,serialNumberColumn=defaultEmptyObject,columns:propColumns, columnStorageKey, showColumnSetting = true, actions, toolBarRender, defaultPageSize = 10, scrollY = 300, className, request, ...restProps } = props

    const [loading,setLoading]=useState(false)

    const handleRequest = useMemoizedFn(async (params, sorter, filters) => {
        const formFilterParams = schemaForm ? schemaForm.getFieldsValue() : {}
        const newParams = {
            ...formFilterParams,
            ...params
        }
        setLoading(true)
        let result={success:true,data:[],total:0}
        try{
            result = await request!(newParams, sorter, filters) as any
        }catch(e){
            result={success:true,data:[],total:0}
        }finally{
            setLoading(false)
        }
        return result
    })
    const { children, columns } = useColumnSetting({ columns: propColumns, storageKey: showColumnSetting ? columnStorageKey : undefined })
    const defaultHeaderDom = showColumnSetting&&children
    const tableProps: TableProps<any, any> = {
        //loading,
        rowKey: 'id',
        bordered: true,
        size: 'middle',
        className: classNames(styles.table, className),
        scroll: { x: 'max-content', y: `calc(100vh - ${scrollY}px)` },
        showSorterTooltip:false,
        renderHeaderSlot: () => {
            return (<Row justify={'space-between'} style={{paddingBottom:10}}>
                <Col flex={'none'}>
                    {leftHeaderSlot}
                </Col>
                <Col flex={'none'}>
                <Space>
                    {rightHeaderSlot}
                    {renderHeaderSlot?renderHeaderSlot(defaultHeaderDom):defaultHeaderDom}
                </Space>
                </Col>
            </Row>)
        },
        renderFooterSlot: () => {
            if (renderHeaderSlot) {
                return renderHeaderSlot(defaultHeaderDom)
            }
            return <></>
        },
        columns: useMemo(()=>{
            if(serialNumberColumn){
                return [useSerialNumberColumn(serialNumberColumn)].concat(columns as any)
            }
            return columns
        },[serialNumberColumn,columns]),
        request: handleRequest,
        pagination:{
            defaultPageSize:20
        },
        ...restProps
    }
    return {
        loading,
        tableProps
    }
}
const Table = <T, U extends ParamsType, ValueType = 'text'>(props: TableProps<T, U, ValueType>) => {
    const { renderHeaderSlot, renderFooterSlot, ...restProps } = props
    return <>
        {renderHeaderSlot?renderHeaderSlot(null):null}
        <EditableProTable recordCreatorProps={false}  {...(restProps as any)}></EditableProTable>
       {renderFooterSlot?renderFooterSlot(null):null}
    </>
}
export {
    Table,
    useTable,
    useTableColumns,
    useTableRequest,
    useSerialNumberColumn
}