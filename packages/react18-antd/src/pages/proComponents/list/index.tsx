

import { useCallback, useMemo, useRef } from 'react'
import {SchemaForm,useSchemaForm,useSchemaFormColumns} from '../components/SchemaForm'
import {Table,useTable,useTableRequest,useTableColumns,type TableColumn,type ActionType} from '../components/Table'
import {request} from 'src/utils/request'
import {SettingOutlined} from '@ant-design/icons'
import { Button,Col,Dropdown,Input,Popover, Row, Space,Form, Radio, Flex} from 'antd'
import dayjs from 'dayjs'
import { ProTable } from '@ant-design/pro-components'


export default ()=>{
    const actionRef=useRef<ActionType>(null)
    
    const {searchFormProps,form:schemaForm,formFieldValues}=useSchemaForm({
        // submitterColSpanProps:{
        //     offset:0,
        //     span:2
        // },
       // layout:'inline',
        
        // submitterColSpanProps:{
        //     flex:'none',
        // },
      //  layout:'inline',
      //  searchGutter:4,
       // span:6,
       // defaultFormItemsNumber:10,
      // collapsed:false,
        // colProps:{
        //     flex:"none"
        // },
        // labelWidth:0,
        // wrapperCol:{
        //     flex:200
        // },
       // rowProps:{gutter:4},
        // span:{
        //    xs: 24, sm: 12, md: 8, lg: 6, xl: 6, xxl: 6 
        // },
        actionRef,
        // useProFormInstanceOptions:{
        //     transformFieldsValue(values){
        //         return {
        //             ...values,
        //             city:values?.city?.join(',')
        //         }
        //     }
        // },
        initialValues:{
            name:'李三',
        },
        columns:useSchemaFormColumns(()=>Array.from({
            length:5,
        },(v,i)=>{
            return {
                dataIndex:'name'+i,
                fieldProps:{
                    placeholder:'请输入名称'
                }
            }
        }),[])
    })
    const handleNewAdd=useCallback(()=>{

    },[])
    const {tableProps}=useTable({
        actionRef:actionRef,
       // schemaForm:schemaForm,
        params:formFieldValues,
        columnStorageKey:'table2',
        //manualRequest,
        rightHeaderSlot:<><Button type='primary' onClick={handleNewAdd}>新增</Button><Button>新增</Button></>,
        // toolBarRender(){
        //     return [<Button>新增</Button>,<Button><SettingOutlined></SettingOutlined></Button>]
        // },
        // optionsRender:(props,defaultDom)=>{
        //     return [<Button>新增2</Button>]
        // },
        // options:{
        //     search:true
        // },
        request:useTableRequest(async (params,sorter,filter)=>{
            console.log('params',params,'sorter',sorter,'filter',filter)
            await (new Promise((resolve)=>setTimeout(resolve,2000)))
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
                sorter:{
                    multiple:1
                },
                defaultSortOrder:'descend',
                width:100
                
                
            },{
                title:'创建时间',
                dataIndex:'createTime',
                width:200,
                sorter:{
                    multiple:2
                },
                defaultSortOrder:'descend'
                
            },{
                title:'操作',
                width:120,
                render:()=>{
                    return <></>
                }
            }]
        },[])
    })
    console.log('tableProps',tableProps.columns)
    return <>
    <div className='bg-white'>
        <SchemaForm {...searchFormProps}></SchemaForm>
    </div>
    <div className='mt-4 px-2 pt-2 pb-4 bg-white shadow-md rounded-md'>
        <ProTable options={false} search={false} {...tableProps}></ProTable>
    </div>
    </>
}