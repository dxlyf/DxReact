import {Select} from 'antd'
import type {SelectProps} from 'antd'
import useSelect,{type UseSelectProps} from '../../hooks/useSelect'


const ProSelect=(props:UseSelectProps)=>{
    const [selectProps]=useSelect(props)
    return <Select {...selectProps}></Select>
}


export default ProSelect