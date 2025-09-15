import type {ProColumns} from '@ant-design/pro-components'
import { useMemo } from 'react'

type UseColumnsOptions={
    showSerialNumber?:boolean
    serialNumberProps?:ProColumns
    deps?:any[]
}
export const useColumns=(factory:()=>ProColumns[],options:UseColumnsOptions={})=>{
    const {showSerialNumber=true,serialNumberProps,deps=[]}=options
    const propColumns=useMemo(factory,deps)
    const columns=useMemo(()=>{
        const newColumns=[...propColumns]
        if(showSerialNumber){
            newColumns.unshift({
                title:'序号',
                render:(dom,record,index)=>{
                    return index+1
                },
                ...(serialNumberProps||{})
            })
        }
    },[propColumns])

    return columns
}