import { useMemo } from 'react'
import type {SelectProps} from 'antd'
import useRequest,{type UseRequestOptions} from 'src/hooks/useRequest'
type UseOptionsProps<D>=UseRequestOptions<D>&{
    labelPropName?:string
    valuePropName?:string
    value?:any
}

const useOptions=<D>(props:UseOptionsProps<D[]>)=>{
    const {valuePropName='value',value:propValue,labelPropName='label',...restRequestOptions}=props
    const {data}=useRequest(restRequestOptions)
     
    const options=useMemo<SelectProps['options']>(()=>{
        return data.map((d:any)=>{
            return {
                ...d,
                value:d[valuePropName],
                label:d[labelPropName],         
            }
        })
    },[data,valuePropName,labelPropName])
    return [options] as const
}

export default useOptions