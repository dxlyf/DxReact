
import { Select,Spin } from 'antd';
import React, { useCallback } from 'react';
import useControllerValue from '../../../hooks/useControllerValue'
import {useRequest,usePage} from '../../ProPage'
import useDebounceFn from '../../../hooks/useDebounceFn'


const UserSelect=(props)=>{
    const page=usePage()
    const {debounceTimeout=500,form,value:propValue,defaultValue:propDefaultValue,options:propOptions,onChange,...restProps}=props
    const [value,setValue]=useControllerValue({
        defaultValue:propDefaultValue,
        value:propValue,
        onChange:onChange
     })
     const previousValue=useRef(null)
     const isValueChanged=value!==previousValue.current
     if(isValueChanged){
        previousValue.current=value
     }

     const {data,setData,loading,request}=useRequest({
        defaultValue:[],
        manualRequest:true,
        service:async (params)=>{
            const {keyword}=params
            const query = keyword ? `searchKey=${encodeURIComponent(keyword)}` : '';
            const res=await page.request({
                url:page.getServiceUrl(`/main/systemManagement/findalluser?${query}`),

            })
            return res;
        },
        onTransform(res){
            const data=res.data.data??[];
            return data.map(user=>{
                return {
                    value: user.username,
                    label: `${user.name}（${user.username}）`,
                    email: user.email,
                    department: user.data1,
                    name: user.name,
                    userId: user.id,
                }
            })
        }
     })
     const handleChange=useCallback((value)=>{
        previousValue.current=value
        setValue(value)
     },[])
     const debounceFetcher=useDebounceFn((keyword)=>{
            setData([])
            request({keyword})
     },debounceTimeout)
     const mergeOptions=useMemo(()=>{
        return data
     },[data])
     useEffect(()=>{
        if(isValueChanged &&value){
            if(form){

            }
            request({keyword:value})
        }
     },[isValueChanged])
    return <Select  filterOption={false}
      onSearch={debounceFetcher}
      notFoundContent={loading ? <Spin size="small" /> : '未找到用户'} options={mergeOptions} value={value} onChange={handleChange} {...restProps}></Select>
}
export default UserSelect