import { DatePicker, Select, Space, TimePicker } from 'antd';
import React, { useCallback, useState } from 'react';
import useControllerValue from 'src/pages/antd/hooks/useControllerValue'
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
export default function YearQuarterMonthSelect(props:any){
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
   console.log('value.value',value)
    return    <Space>
      <Select options={options} value={value.type} onChange={handleType}>
      </Select>
        <DatePicker key={value.type} value={value.value} picker={value.type}  />
    </Space>
}