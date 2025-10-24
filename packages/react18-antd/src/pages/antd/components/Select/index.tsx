import {Select} from 'antd'
import type {SelectProps,GetProp,GetProps,GetRef} from 'antd'

type ProSelectProps=SelectProps&{

}
const ProSelect=(props:ProSelectProps)=>{
    const {...restProps}=props
    return <Select {...restProps}></Select>
}

export default ProSelect