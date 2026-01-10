

import { useCallback, useMemo, useRef } from 'react'
import { SchemaForm, useSchemaForm, useSchemaFormColumns } from '../components/SchemaForm'
import { Table, useTable, useTableRequest, useTableColumns, type TableColumn, type ActionType } from '../components/Table'
import { request } from 'src/utils/request'
import { SettingOutlined } from '@ant-design/icons'
import { Button,Modal, Col, Dropdown, Input, Popover, Row, Space, Form, Radio, Flex, Typography } from 'antd'
import dayjs from 'dayjs'
import { ProTable } from '@ant-design/pro-components'
import {useModal} from 'src/pages/antd/hooks/useModal2'
import Mock from 'mockjs'
const list = Mock.mock({
    'list|100': [{
        'id|+1': 1,
        'name': '@name',
        'createBy': '@name',
        'createTime': '@date'
    }]
}).list
async function getList(params: any) {
    const current = params.current
    const pageSize = params.pageSize


    return {
        data: list.slice(current * pageSize - pageSize, current * pageSize).map(d=>({...d,name:'fd城FDAFDA城工工工城于可FDA'.repeat(100)})),
        total: list.length
    }
}
export default () => {
    const actionRef = useRef<ActionType>(null)

    const { searchFormProps, form: schemaForm, formFieldValues } = useSchemaForm({
        delayInitTime:200,
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
        initialValues: {
            name: '李三',
        },
        columns: useSchemaFormColumns(() => Array.from({
            length: 5,
        }, (v, i) => {
            return {
                dataIndex: 'name' + i,
                fieldProps: {
                    placeholder: '请输入名称'
                }
            }
        }), [])
    })
    const handleNewAdd = useCallback(() => {

    }, [])
    const { tableProps } = useTable({
        
        actionRef: actionRef,
        // schemaForm:schemaForm,
        params: formFieldValues,
        columnStorageKey: 'table2',
        //manualRequest,
        rightHeaderSlot: <><Button type='primary' onClick={handleNewAdd}>新增</Button><Button>新增</Button></>,
        // toolBarRender(){
        //     return [<Button>新增</Button>,<Button><SettingOutlined></SettingOutlined></Button>]
        // },
        // optionsRender:(props,defaultDom)=>{
        //     return [<Button>新增2</Button>]
        // },
        // options:{
        //     search:true
        // },
        request: useTableRequest(async (params, sorter, filter) => {
          //  console.log('params', params, 'sorter', sorter, 'filter', filter)
           // await (new Promise((resolve) => setTimeout(resolve, 2000)))
            const ret = await getList({
                ...params
            })
        //    console.log('fff',ret)
            return {
                total: ret.total,
                data: ret.data,
                success: true
            }
        }, []),
        columns: useTableColumns(() => {
            return [{
                title: '名称',
                dataIndex: 'name',
                //   sorter:true,
                defaultSortOrder: 'descend',
                width: 400,
                ellipsis:true,
                // tooltip:{
                //     styles:{
                //         root:{
                //             maxWidth:600
                //         }
                //     }
                // },
                renderText(text){
                    return <Typography.Text  ellipsis={{
                        tooltip:{
                            title:text,
                            styles:{
                                root:{
                                    maxWidth:600,
                                }
                            },
                           
                        }
                    }}>{text}</Typography.Text>
                }
              //  valueType:'dateRange'

            }, {
                title: '创建时间',
                dataIndex: 'createTime',
                width: 200,
                sorter: true,
                defaultSortOrder: 'descend'

            }, {
                title: '操作',
                width: 120,
                render: () => {
                    return <></>
                }
            }]
        }, [])
    })
  const { tableProps:tableProps2 } = useTable({
        manualRequest:false,
        // schemaForm:schemaForm,
        params: formFieldValues,
        columnStorageKey: 'table2',
        //manualRequest,
        //rightHeaderSlot: <><Button type='primary' onClick={handleNewAdd}>新增</Button><Button>新增</Button></>,
        // toolBarRender(){
        //     return [<Button>新增</Button>,<Button><SettingOutlined></SettingOutlined></Button>]
        // },
        // optionsRender:(props,defaultDom)=>{
        //     return [<Button>新增2</Button>]
        // },
        // options:{
        //     search:true
        // },
        request: useTableRequest(async (params, sorter, filter) => {
          //  console.log('params', params, 'sorter', sorter, 'filter', filter)
           // await (new Promise((resolve) => setTimeout(resolve, 2000)))
            const ret = await getList({
                ...params
            })
        //    console.log('fff',ret)
            return {
                total: ret.total,
                data: ret.data,
                success: true
            }
        }, []),
        columns: useTableColumns(() => {
            return [{
                title: '名称',
                dataIndex: 'name',
                //   sorter:true,
                defaultSortOrder: 'descend',
                width: 400,
                ellipsis:true,
                // tooltip:{
                //     styles:{
                //         root:{
                //             maxWidth:600
                //         }
                //     }
                // },
                renderText(text){
                    return <Typography.Text  ellipsis={{
                        tooltip:{
                            title:text,
                            
                            styles:{
                                root:{
                                    overflow:'auto',
                                    maxHeight:400
                                 //   maxWidth:600,
                                }
                            },
                           
                        }
                    }}>{text}</Typography.Text>
                }
              //  valueType:'dateRange'

            }, {
                title: '创建时间',
                dataIndex: 'createTime',
                width: 200,
                sorter: true,
                defaultSortOrder: 'descend'

            }, {
                title: '操作',
                width: 120,
                render: () => {
                    return <></>
                }
            }]
        }, [])
    })
    const [modalDom,modal]=useModal({
        title:'新增',
        width:'70%',
        children(){
            return <Table {...tableProps2}></Table>
        }
    })
    return <>
        <div className='bg-white'>
            <SchemaForm {...searchFormProps}></SchemaForm>
        </div>
        <div className='mt-4 px-2 pt-2 pb-4 bg-white shadow-md rounded-md'>
            <Table toolBarRender={()=>[<Button onClick={()=>{
                modal.open()
            }}>新增</Button>]}  {...tableProps}></Table>
        </div>
        {modalDom}
    </>
}