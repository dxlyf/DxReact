import React, { useEffect, useState,useContext } from 'react';
import { Select,Form } from 'antd';
import { getShopList } from '@/services/shop';
import {useControllableValue} from 'ahooks'
import {FilterContext} from '../FilterContext'

const ShopSelect = React.memo(React.forwardRef((props:any, ref) => {
    let {field,selectedIndex=-1,isFirstAll=true,...restProps}=props
    let {form,addMiddleware}=useContext(FilterContext)
    let [data, setData] = useState<any>([{ id: -1, name: '全部' }]);
    useEffect(() => { 
      let p=new Promise((resolve,reject)=>{
           getShopList().then(resolve)
      })
      p.then((data: any) => { 
        if(isFirstAll){
          data=[{ id: -1, name: '全部' }].concat(data)
        }
        if(data.length>selectedIndex&&selectedIndex!==-1){ 
          form.setFieldsValue({
            [field.fieldName]:data[selectedIndex].id
          })
        }
        setData(data);
      });
      let removeMiddleware=addMiddleware({
        onQuery:()=>p
      })
      return ()=>{
        removeMiddleware()
      }
    }, []);

    return (
      <Select {...restProps}>
        {data.map((d: any) => (
          <Select.Option key={d.id} value={d.id}>
            {d.name}
          </Select.Option>
        ))}
      </Select>
    );
  }),
);
export default ShopSelect;
