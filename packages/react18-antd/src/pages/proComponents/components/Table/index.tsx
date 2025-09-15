import {EditableProTable} from '@ant-design/pro-components'
import type {ProColumns,EditableProTableProps,ParamsType} from '@ant-design/pro-components'
import type {FormInstance, TablePaginationConfig} from 'antd'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import classNames from 'classnames'
import   './index.css'
type UseTableProps={
    schemaForm?:FormInstance
    defaultPageSize?:number
    scrollY?:number
}&EditableProTableProps<any,any>
export type {
    ProColumns as TableColumn
}
export const useTableColumns=(factory:()=>ProColumns[],deps:readonly unknown[])=>{
    return useMemo(factory,deps)
}
export const useTableRequest=(request:NonNullable<EditableProTableProps<any,any>['request']>,deps:readonly unknown[])=>{
    return useCallback(request,deps)
}
export const useTable=(props:UseTableProps)=>{
    const {schemaForm,defaultPageSize=10,scrollY=300,pagination:propPagination,className,request,...restProps}=props
    const needPagination=propPagination!==false
    const [pagination,setPagination]=useState<TablePaginationConfig>({
        current:1,
        pageSize:defaultPageSize,
        defaultPageSize:defaultPageSize
    })
    const handleTableChange=useCallback<NonNullable<EditableProTableProps<any,any>['onTableChange']>>((pagination,filters,sorter)=>{
            setPagination({
                current:pagination.current,
                pageSize:pagination.pageSize,
                total:pagination.total
            })
           
    },[])
    const handleRequest=useMemoizedFn(async (params,sorter,filters)=>{
        const formFilterParams=schemaForm?schemaForm.getFieldsValue():{}
        const newParams={
            ...formFilterParams,
            ...params
        }
        const result=await request!(newParams,sorter,filters)
        return result
    })
    const tableProps:EditableProTableProps<any,any>={
        rowKey:'id',
        bordered:true,
        size:'middle',
        className:classNames('table-cust989',className),
        scroll:{ x: 'max-content', y: `calc(100vh - ${scrollY}px)` },
        request:handleRequest,
        onTableChange:handleTableChange,
        pagination:needPagination?{
            ...pagination,
            ...(propPagination||{})
        }:false,
        ...restProps
    }
    return {
        tableProps
    }
}
export const Table=<T, U extends ParamsType, ValueType = 'text'>(props:EditableProTableProps<T,U,ValueType>)=>{
    return <EditableProTable  recordCreatorProps={false}  {...(props as any)}></EditableProTable>
}