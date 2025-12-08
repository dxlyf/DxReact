import { Select, Space,DatePicker } from 'antd';
import React, { useCallback } from 'react';
import useControllerValue from '../../../hooks/useControllerValue'
const options=[
        {
            value:'year',
            label:'年度'
        },{
            value:'quarter',
            label:'季度'
        },{
            value:'month',
            label:'月度'
        }
]
export default function YearQuarterMonthSelect(props){
   const [value={type:'year',value:undefined},setValue]=useControllerValue({
      defaultValue:props.defaultValue,
      value:props.value,
      onChange:props.onChange
   })
   const handleType=useCallback((type)=>{
      setValue({
        type:type,
        value:undefined
      })
   },[])
   const handleDate=useCallback((value)=>{
     setValue((prev)=>({type:prev.type,value}))
 },[])
    return    <Space>
      <Select options={options} value={value.type} onChange={handleType}>
      </Select>
      <DatePicker key={value.type} value={value.value} onChange={handleDate} picker={value.type}  />
    </Space>
}