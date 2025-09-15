import { Form, Table,type TableProps } from "antd"
import { useCallback, useMemo } from "react"
import {useAntdTable} from 'ahooks'
import { Input } from "antd/lib"


export default ()=>{
    const [form]=Form.useForm()
    const columns=useMemo<NonNullable<TableProps['columns']>>(()=>[
        {
            title:'名称',
            dataIndex:'name'
        }
    ],[])
    const {tableProps,search}=useAntdTable(async (params,filters)=>{
        console.log('filters',filters)
         return {
            total:0,
            list:[]
         }
    },{
        form
    })
    const SearchFormItems=useMemo(()=>[{
        dataIndex:'name',
        Component:Input
    }],[])
    return <>
    <Form form={form}>
        <Form.Item label='名称' name={'name'}>
            <Input></Input>
        </Form.Item>
    </Form>
    <Table rowKey='id' columns={columns} {...tableProps}></Table> 
    </>
}