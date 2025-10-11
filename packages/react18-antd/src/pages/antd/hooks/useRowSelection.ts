import  {Table} from 'antd'
import type {GetProps,GetProp} from 'antd'
import { useCallback, useMemo, useState } from 'react'

type TableRowSelection=GetProp<typeof Table,'rowSelection'>
type UseRowSelectionProps=TableRowSelection&{
    disabled?:boolean
    rowKey?:string
}
const useRowSelection=(props:UseRowSelectionProps)=>{
    const {rowKey='id',disabled=false,...restRowSelectionProps}=props
    const [selectedRows,setSelectedRows]=useState<any[]>([])
    const handleChange=useCallback<NonNullable<TableRowSelection['onChange']>>((selectedRowKeys, selectedRows, info)=>{
        setSelectedRows(selectedRows)
    },[])
    const selectedRowKeys=useMemo(()=>selectedRows.map(d=>d[rowKey]),[rowKey,selectedRows])
    const rowSelectionProps:TableRowSelection={
        selectedRowKeys:selectedRowKeys,
        onChange:handleChange,
        getCheckboxProps(record){
            return {
                disabled:disabled
            }
        },
        ...restRowSelectionProps
    }
    return [rowSelectionProps]
}
export {
    useRowSelection
}