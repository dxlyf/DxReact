import { Button, Collapse, Row, Tabs } from 'antd'
import type { CollapseProps,GetProps,GetProp } from 'antd'
import { ProForm, EditableProTable, ProFormItem, ProFormDependency, ProFormSelect,ProTable, ProFormText, ProFormGroup, ProFormDatePicker, ProFormDateRangePicker, BetaSchemaForm } from '@ant-design/pro-components'
import type { ProFormProps, ProFormInstance, ProFormItemProps, ProFormFieldProps } from '@ant-design/pro-components'
import React, { useImperativeHandle, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { uniqueId } from 'lodash-es'
import mockjs from 'mockjs'

const data=mockjs.mock({
    'list|100':[{
        'id|+1':0,
        'jxmc':'@word'
    }]
}).list;
async function queryList(params:any) {
    const size=params.current*params.pageSize
    return {
        total:data.length,
        data:data.slice(size-params.pageSize,size),
        success:true
    }
}
const EditPage = (props) => {
    
    const [dataSource,setDataSource]=useState<any[]>([])
    const columns:GetProp<typeof ProTable,'columns'>=[
        {
            title:'序号',
            search:false,
            renderText(text,record,index){
                return index+1
            }
        },
        {
            title:'奖项名称',
            dataIndex:'jxmc',
        },
        {
            title:'主办单位',
            dataIndex:'zbdw'
        },
        {
            title:'申请奖金总额',
            dataIndex:'sqjjze'
        },
        {
            title:'申请人',
            dataIndex:'sqr'
        },
        {
            title:'申请时间',
            dataIndex:'sqsj'
        },
        {
            title:'状态',
            dataIndex:'zt'
        },
        {
            title:'最后更新人',
            dataIndex:'zhgxr'
        },
        {
            title:'最后更新时间',
            dataIndex:'zhgxsj'
        },
        {
            title:'操作',
            fixed:'right',
            valueType:'option',
            width:110,
            render(){
                 return <>
                 <a>编辑</a>
                 </>
            }
        }
    ]
    return <>

    <ProTable  toolbar={{
        settings:[],
        search:{},
        tabs:{
            items:[{key:'a',tab:'工城'}]
        },
        menu:{
            type:'tab',
            items:[{key:'a',label:'列表'},{key:'b',label:'明细'}]
        },
        actions:[<Button type='primary'>新增</Button>]
    }}  rowKey={'id'} onLoad={(data)=>{
        setDataSource(data)
        console.log('onLoad')
    }} request={queryList}  columns={columns}></ProTable>
    
    
    </>
}

export default EditPage