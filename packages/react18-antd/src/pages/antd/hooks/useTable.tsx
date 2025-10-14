
import { current } from '@reduxjs/toolkit'
import { useMemoizedFn } from 'ahooks'
import { Table } from 'antd'
import type { TableProps, TableColumnType,PaginationProps } from 'antd'
import type { ColumnsType, FilterValue, SorterResult } from 'antd/es/table/interface';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'

type RequestResult<D> = { data: D[], total?: number }
type UseTableProps<D> = Omit<TableProps,'rowKey'|'onChange'> & {
    rowKey?:string
    showSerialNumber?: boolean
    manualRequest?: boolean
    requestDeps?: any[]
    onChange?:(data:D[])=>D[]
    onTableChange?:TableProps['onChange']
    request?: (params: any, sorter: any, filter: any) => (RequestResult<D> | Promise<RequestResult<D>>)
}
type TableColumn = Omit<TableColumnType, 'children'> & {
    children?: TableColumn[]
    order?: number
}
type RequiredTableProps = Required<TableProps>

const setPath=(obj:any,path:string[]|string,value:any)=>{
    if(!Array.isArray(path)){
        path=[path]
    }
    let cur=obj,len=path.length-1,key=path[len]
    for(let i=0;i<len;i++){
        cur=cur[path[i]]
        if(!cur){
            cur[path[i]]={}
        }
    }
    cur[key]=value
}
const isLocalSort=(sorter:any)=>{
    return sorter&&typeof sorter.compare==='function'
}
const useTable = <D = any>(props: UseTableProps<D>) => {
    const {rowKey='id',columns, showSerialNumber = true, request: propRequest,onChange, onTableChange,rowSelection:propRowSelection, manualRequest = false, requestDeps = [], pagination={}, ...restTableProps } = props
    const [data, setData] = useState<D[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedRows,setSelectedRows]=useState([])
    // const [paginationInfo,setPaginationInfo]=useState<Exclude<RequiredTableProps['pagination'],boolean>>({})
    const mountRef = useRef(false)
    const lastParams = useRef<any>({})
    const [filteredInfo, setFilteredInfo] = useState<Record<string, FilterValue | null>>({});
    const [sortedInfo, setSortedInfo] = useState<any>(()=>{
        const sorter={}
        columns?.forEach(col=>{
            if(col.sorter&&!isLocalSort(col.sorter)&&col.sortOrder){
                sorter[col.dataIndex]=col.sortOrder
            }
        })
        return sorter
    });
    const [paginationInfo,setPaginationInfo]=useState<PaginationProps>(()=>{
        return {
            pageSize:10,
            current:1,
            ...(pagination?pagination:{})
        }
    })
    

    const mergeColumns = useMemo<TableColumn[]>(() => {
        return [showSerialNumber && {
            title: '序號',
            render(t, record, index) {
                return (index + 1) + ((paginationInfo.current! - 1) * paginationInfo.pageSize!)
            }
        }].concat(columns).map(c=>{
            if(c.sorter&&!isLocalSort(c.sorter)){
                return {
                    ...c,
                    sortOrder:sortedInfo[c.dataIndex]
                }
            }
            return c
        }) as TableColumn[]
    }, [columns, showSerialNumber,sortedInfo])
    const request = useMemoizedFn(async (params: any = {}, refresh: boolean = true) => {
        if(!propRequest){
            return
        }
        const newParams = {
            ...params,
        }
        if (pagination) {
            newParams.current = refresh ? 1 : paginationInfo.current,
                newParams.pageSize = paginationInfo.pageSize
        }
        const sorter = sortedInfo
        const filters = filteredInfo
        setLoading(true)

        lastParams.current = newParams
        
        const res = await Promise.resolve().then(()=> propRequest(newParams, sorter, filters)).catch(() => ({ data: [], total: 0 }))
        if (pagination) {
            setPaginationInfo(p=>({...p,total:res.total!}))
        }
        setData(res.data)
        setLoading(false)
        return res

    })

    const handleChange = useMemoizedFn<Exclude<TableProps['onChange'], undefined>>((pagination, filters, sorter, extra) => {
        setPaginationInfo(pagination)
        setFilteredInfo(filters)
        if(!Array.isArray(sorter)){
            sorter=[sorter]
        }
        const newSortedInfo={}
        sorter.forEach((c)=>{
            if(c.column?.sorter&&!isLocalSort(c.column?.sorter)){
                newSortedInfo[c.field]=c.order
            }
        })
        setSortedInfo(newSortedInfo)
        request(lastParams.current, false)
        onTableChange?.(pagination, filters, sorter, extra)

    })
   
    const selectedRowKeys=useMemo(()=>selectedRows.map(d=>d[rowKey]),[selectedRows,rowKey])
    const tableProps: TableProps<any> = {
        rowKey: rowKey,
        scroll: { x: 'max-content' },
        columns: mergeColumns,
        dataSource: data,
        onChange: handleChange,
        loading: loading,
        rowSelection:propRowSelection?{
            selectedRowKeys:selectedRowKeys,
            onChange:(selectedRowKeys,selectedRows)=>{
                setSelectedRows(selectedRows)
            },
            ...propRowSelection
        }:undefined,
        pagination: (pagination ? {
            ...paginationInfo,
            ...pagination
        } : undefined),
        ...restTableProps
    }
    useLayoutEffect(() => {
        if (mountRef.current) {
            request()
        }
    }, requestDeps)
    useLayoutEffect(() => {
        if (!manualRequest) {
            request()
        }
        mountRef.current = true
    }, [])
    const result=[tableProps, {
        data,
        setData,
        loading,
        lastParams,
        selectedRowKeys,
        selectedRows,
        request
    }]
    return result as typeof result
}
export {
    useTable
}