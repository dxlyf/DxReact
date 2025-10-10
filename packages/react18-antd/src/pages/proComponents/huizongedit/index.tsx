import { Button, Card, Collapse, Form, Input, Modal, Space, Tabs,Popover,Popconfirm } from 'antd'
import type { CollapseProps,GetProps,GetProp } from 'antd'
import { useMountMergeState,ProForm, EditableProTable, ProFormItem, ProFormDependency, ProFormSelect,ProTable, ProFormText, ProFormGroup, ProFormDatePicker, ProFormDateRangePicker, BetaSchemaForm } from '@ant-design/pro-components'
import type {ActionType,EditableFormInstance, ProFormProps,ProColumns, ProFormInstance, ProFormItemProps, ProFormFieldProps } from '@ant-design/pro-components'
import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import { uniqueId } from 'lodash-es'
import mockjs from 'mockjs'
import { useMemoizedFn,useControllableValue } from 'ahooks'

const data=mockjs.mock({
    'list|100':[{
        'id|+1':0,
        'jxmc':'@word'
    }]
}).list;


type ProEditTableProps=Omit<GetProps<typeof EditableProTable>,'columns'|'rowKey'>&{
rowKey?:string
columns:ProColumns[]
recordCreator?:()=>any

}
let rowUid=1
const ProEditTable=(props:ProEditTableProps)=>{
    const {name,columns,rowKey='id',recordCreator,value:propValue,onChange,...restTableProps}=props
    const latestProps=useRef<ProEditTableProps>(props)
    latestProps.current=props
    const [value,setValue]=useControllableValue(props,{
        defaultValue:[]
    })
    const actionRef=useRef<ActionType>()
    const editableFormRef=useRef<EditableFormInstance>()
    const [editableKeys,setEditableKeys]=useState([])
    const getRowKey=useCallback((record:any)=>{
         return record[rowKey]
    },[rowKey])
    const mergeColumns=useMemo(()=>{
        return columns.concat([{
            title:'操作',
            valueType:'option',
            width:200,
            fixed:'right',
            render(dom,record,index,action){
                //const editing=actionRef.current?.isEditable(record)
                return   <Space>
                    <a onClick={()=>{
                        actionRef.current!.startEditable(getRowKey(record))
                    }}>编辑</a>
                    <a onClick={()=>{
                        
                     actionRef.current?.addEditRecord({
                            [rowKey]:'__new__'+(rowUid++),
                            ...(latestProps.current.recordCreator?latestProps.current.recordCreator():{}),
                        },{
                            position:'bottom',
                            newRecordType:'cache',
                            parentKey:getRowKey(record)

                        })
                    }}>插入行</a>
                   <Popconfirm title='确定删除？' onConfirm={()=>{
                    setValue(value.filter(d=>getRowKey(d)!==getRowKey(record)))
                   }}><a >删除</a></Popconfirm>
                    </Space>
            }
        }])
    },[columns,actionRef,getRowKey,value])
    const handleAddRow=useCallback(()=>{
       actionRef.current?.addEditRecord({
        [rowKey]:'__new__'+(rowUid++),
        ...(latestProps.current.recordCreator?latestProps.current.recordCreator():{}),
       },{
        position:'bottom',
        newRecordType:'cache'
       })
    },[])
    const handleSelectionEditableRows=useCallback((editableKeys:any)=>{
        console.log('editableKeys',editableKeys)
        setEditableKeys(editableKeys)
    },[setEditableKeys])
    const handleDelete=useCallback(()=>{
        Modal.confirm({
            title:'温馨提示',
            content:'确定删除所有行？',
            onOk:()=>{
                    setValue([])
            }
        })
    },[])
    const handleChange=useCallback((value:any[])=>{
        console.log('handleChange',value)
        setValue(value)
    },[])
    return <>
    <EditableProTable summary={(data)=>{

        return <tr>
            <td>合计</td>
            <td></td>
        </tr>
    }} rowSelection={{
        type:'radio'
    }}  editableFormRef={editableFormRef} actionRef={actionRef} bordered size='small' toolbar={{
        settings:[],
        actions:[<Button onClick={handleAddRow}>添加行</Button>,<Popconfirm onConfirm={handleDelete} title='确定要删除全部?'><Button>删除全部</Button></Popconfirm>]
    }}  value={value}  onChange={handleChange}  recordCreatorProps={false} rowKey={rowKey} columns={mergeColumns} {...restTableProps}></EditableProTable>
    </>
}
const EditPage = () => {
    
    const [form]=ProForm.useForm()
    const [dataSource,setDataSource]=useState<any[]>([])
    const columns:ProColumns[]=[
        {
            title:'序号',
            editable:false,
            renderText(text, record, index, action) {
                return index+1
            },
        },{
            title:'评审月份',
            dataIndex:'psyf',
            valueType:'date',
            fieldProps:{
                transform:(value,namePath,allValues)=>{
                    console.log('transform')
                    return value.format("YYYY-MM-DD")
                },
                  convertValue(value){
                    console.log('convertValue',value)
                     return dayjs(value).isValid()?dayjs(value):undefined 
                }
            },
            proFieldProps:{
                transform:(value,namePath,allValues)=>{
                    console.log('transform')
                    return value.format("YYYY-MM-DD")
                },
                convertValue(value){
                    console.log('convertValue1',value)
                     return dayjs(value).isValid()?dayjs(value):undefined 
                }
            },
                transform:(value,namePath,allValues)=>{
                    console.log('transform')
                    return value.format("YYYY-MM-DD")
                },
              convertValue(value){
                    console.log('convertValue2',value)
                     return dayjs(value).isValid()?dayjs(value):undefined 
                },
                
            formItemProps:{
                rules:[{
                    required:true,
                    type:'object',
                    message:'请选择${label}'
                }],
                // normalize(value){
                //     return dayjs(value).isValid()?dayjs(value):undefined
                // }      
            }
            // transform(value){
            //     console.log('value',value)
            //     return value.format('YYYY-MM-DD')
            // }
            
        },
        {
            title:'工程公司',
            dataIndex:'gcgs',
            valueType:'text'
        },
        {
            title:'地盘名称',
            dataIndex:'dpmc',
            valueType:'select',
            request:async ()=>{
                return [{label:'地盘1',value:'地盘1'},{label:'地盘2',value:'地盘2'}]
            }
        }
        
    ]
    useEffect(()=>{
        setTimeout(()=>{
form.setFieldsValue({
    list:[{
    "id": "32",
    "psyf": "2025-10-11 00:00:00",
    "gcgs": "43",
    "dpmc": "地盘2",
}]
})
        },200)
    },[])
    //const list=ProForm.useWatch('list',form)||[]
    return <>
    <ProForm  form={form} submitter={false} initialValues={{list:[]}} onFinish={(values)=>{
        console.log('onFinish',values)
    }}>
        <Button htmlType='submit'>提交</Button>
        <Form.Item name='name' label='獎項名稱' rules={[{required:true,message:'請填寫'}]}>
            <Input></Input>
        </Form.Item>
        <Card title='奖金明细'>
            <ProEditTable name={'list'} recordCreator={()=>{
                 return {
                    'id':uniqueId('__new__')
                 }
            }} columns={columns}></ProEditTable>
        </Card>
    </ProForm>
    
    </>
}

export default EditPage