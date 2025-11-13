import { Table } from "antd"
import {useTableEdit,type UseTableEditProps} from '../../hooks/useEditTable'

const TableEdit=(props:UseTableEditProps)=>{
    const [tableProps]=useTableEdit({
        alwarysEdit:true,
        ...props
    })
    return <Table {...tableProps}></Table>
}
export default TableEdit