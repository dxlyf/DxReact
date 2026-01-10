import {Form} from 'antd'
import type {GetProp,GetProps,GetRef} from 'antd'
const Item=Form.Item
type  ItemProps=GetProps<typeof Item>
export type FormItemProps=ItemProps&{
    
}
const FormItem=(props:FormItemProps)=>{

    return 
}