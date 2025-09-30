

import { useCallback, useMemo, useRef } from 'react'
import {SchemaForm,useSchemaForm,useSchemaFormColumns} from '../components/SchemaForm'
import {Table,useTable,useTableRequest,useTableColumns,type TableColumn,type ActionType} from '../components/Table'
import {request} from 'src/utils/request'
import {SettingOutlined} from '@ant-design/icons'
import { Button,Col,Dropdown,Input,Popover, Row, Space,Form, Radio} from 'antd'


export default ()=>{
    const actionRef=useRef<ActionType>(null)
    const {searchFormProps,form:schemaForm,formFieldValues}=useSchemaForm({
        // submitterColSpanProps:{
        //     offset:0,
        //     span:2
        // },
       // layout:'inline',
        defaultColsNumber:4,
        searchGutter:4,
        colProps:{
            flex:"none"
        },
        labelWidth:0,
        rowProps:{gutter:4},
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
        columns:useSchemaFormColumns(()=>[
        {
                dataIndex:'name',
                fieldProps:{
                    placeholder:'请输入名称'
                },
                formItemProps:{
                    
                }
            },{
               // title:'日期',
                dataIndex:'date',
                valueType:'date'
            },{
                 dataIndex:'city',
                // title:'城市',
                 valueType:'select',
                 fieldProps:{
                    mode:'multiple',
                   // allowClear:true,
                 },
                 transform:(value)=>{
                     return Array.isArray(value)?value.join(','):undefined
                 },
                 request:async ()=>{
                    return  [{value:'郴州',label:'郴州'},{value:'长沙',label:'长沙'}]
                 }

            },
                {
                order:101,
            
                dataIndex:'是否已上锁',
                valueType:'radioButton',
                fieldProps:{
                    buttonStyle:'solid',
                    options:[{label:'已上锁',value:'a'},{label:'已解锁',value:'b'}],
                    onChange(v){
                        schemaForm.submit()
                      // actionRef.current?.reset()
                    }
                },
                //ignoreFormItem:true,
                // renderFormItem(schema){
                //     return <Form.Item>
                //        <Radio.Group buttonStyle='solid'>
                //             <Radio.Button value={'已上锁'}>已上锁</Radio.Button>
                //             <Radio.Button value={'已解锁'}>已解锁</Radio.Button>
                //        </Radio.Group>
                //     </Form.Item>
                // }
                
            }
        ],[])
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
            console.log('pa',params,'sort',sorter,'filter',filter)
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
                sorter:true,
                defaultSortOrder:'descend',
                width:100,
                
            },{
                title:'创建时间',
                dataIndex:'createTime',
                
            },{
                title:'操作',
                width:120,
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