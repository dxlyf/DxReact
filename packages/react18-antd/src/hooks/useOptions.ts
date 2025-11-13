import { useMemo } from 'react'
import useRequest,{type UseRequestOptions} from './useRequest'
type UseOptionsProps<D>=UseRequestOptions<D>&{
    labelPropName?:string
    valuePropName?:string
    value?:any
}

const useOptions=<D>(props:UseOptionsProps<D[]>)=>{
    const {valuePropName='value',value:propValue,labelPropName='label',...restRequestOptions}=props
    const {data}=useRequest(restRequestOptions)
     
    const options=useMemo(()=>{
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