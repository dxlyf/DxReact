import type {TableProps,TablePaginationConfig,TableColumnType,TableColumnProps} from 'antd'
import { useMemo } from 'react'

type ColumnType<D>=TableColumnType<D>&{
    formItemRender?:()=>React.ReactElement
    order?:number
    editable?:boolean
}
type UseTableProps<D=Record<string,any>>=Omit<TableProps<D>,'columns'>&{
    columns:ColumnType<D>[]
}
const useTable=(props:UseTableProps)=>{
    const {columns:propColumns,onChange,pagination,rowSelection,...restTableProps}=props
    const mergeColumns=useMemo(()=>{
        const newColumns= [...propColumns]
        newColumns.sort((a,b)=>{
            const aOrder=a.order??0
            const bOrder=b.order??0
            return bOrder-aOrder
        })
        return newColumns
    },[propColumns])
    const request=()=>{

    }

    const tableProps:TableProps={
        columns,
        onChange:handleChange,
        ...restTableProps
    }
     
}