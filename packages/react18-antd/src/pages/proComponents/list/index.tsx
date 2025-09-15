

import { useCallback, useMemo } from 'react'
import {SchemaForm,useSchemaForm,useSchemaFormColumns} from '../components/SchemaForm'
import {Table,useTable,useTableRequest,useTableColumns,type TableColumn} from '../components/Table'
import {request} from 'src/utils/request'
export default ()=>{

    const {searchFormProps,formFieldValues}=useSchemaForm({
        columns:useSchemaFormColumns(()=>[
            {
                dataIndex:'name',
                initialValue:'李三',
                fieldProps:{
                    placeholder:'请输入名称'
                }
            }
        ],[])
    })
    const {tableProps}=useTable({
        manualRequest:true,
        params:formFieldValues,
        request:useTableRequest(async (params,sorter,filter)=>{
            console.log('pa',params,'sort',sorter,'filter',filter)
                const ret=await request<{data:any[],total:number}>({
                    url:'list',
                    method:'post',
                    data:{
                        ...params
                    }
                })
                return {
                    total:ret.data.total,
                    data:ret.data.data,
                    success:true
                }
        },[]),
        columns:useTableColumns(()=>{
            return [{
                title:'名称',
                dataIndex:'name',
                sorter:true,
                sortOrder:'descend'
            },{
                title:'操作',
                render:()=>{
                    return <></>
                }
            }]
        },[])
    })
    return <>
    <div className='bg-white'>
        <SchemaForm {...searchFormProps}></SchemaForm>
    </div>
    <div className='mt-4 px-2 pt-2 pb-4 bg-white shadow-md rounded-md'>
        <Table {...tableProps}></Table>
    </div>
    </>
}