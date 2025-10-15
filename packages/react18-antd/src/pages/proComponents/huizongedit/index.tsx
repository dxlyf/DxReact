import { Button, Card, Collapse, Form, Input, Modal, Space, Tabs, Popover, Popconfirm, Select, DatePicker, Table } from 'antd'
import type { CollapseProps, GetProps, GetProp } from 'antd'
import { useMountMergeState, ProForm, EditableProTable, ProFormItem, ProFormDependency, ProFormSelect, ProTable, ProFormText, ProFormGroup, ProFormDatePicker, ProFormDateRangePicker, BetaSchemaForm } from '@ant-design/pro-components'
import type { ActionType, EditableFormInstance, ProFormProps, ProColumns, ProFormInstance, ProFormItemProps, ProFormFieldProps } from '@ant-design/pro-components'
import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import { uniqueId } from 'lodash-es'
import mockjs from 'mockjs'
import { useMemoizedFn, useControllableValue } from 'ahooks'
import type { FormInstance } from 'antd/lib'

const data = mockjs.mock({
    'list|100': [{
        'id|+1': 0,
        'jxmc': '@word'
    }]
}).list;


type ProEditTableProps = Omit<GetProps<typeof EditableProTable>, 'columns' | 'rowKey'> & {
    rowKey?: string
    columns: ProColumns[]
    recordCreator?: () => any
    form2:FormInstance
}
let rowUid = 1
const ProEditTable = (props: ProEditTableProps) => {
    const {  columns,form2, rowKey = 'id', recordCreator, onChange, ...restTableProps } = props
    const [form]=[form2]
    const name=props.name
    const latestProps = useRef<ProEditTableProps>(props)
    latestProps.current = props
    
    // const [value, setValue] = useControllableValue(props, {
    //     defaultValue: []
    // })
    const actionRef = useRef<ActionType>()
    const editableFormRef = useRef<EditableFormInstance>()
    const [editableKeys, setEditableKeys] = useState([])
    const getRowKey = useCallback((record: any) => {
        return record[rowKey]
    }, [rowKey])
    const getData=useCallback(()=>{
        return form.getFieldValue(name)
    },[name,form])
    const setData=useCallback((data:any)=>{
        if(typeof data==='function'){
            let oldData=getData()
            form.setFieldValue(name,data(oldData))
        }else{
        form.setFieldValue(name,data)
        }
    },[getData])
    const mergeColumns = useMemo(() => {
        return columns.concat([{
            title: '操作',
            valueType: 'option',
            width: 200,
            fixed: 'right',
            render(dom, record, index, action) {
                //const editing=actionRef.current?.isEditable(record)
                return <Space>
                    <a onClick={() => {
                        actionRef.current!.startEditable(getRowKey(record))
                    }}>编辑</a>
                    <a onClick={() => {

                        actionRef.current?.addEditRecord({
                              'id': uniqueId('__new__')
                        }, {
                            position: 'bottom',
                            newRecordType:'cache',
                           // parentKey: getRowKey(record)

                        })
                    }}>插入行</a>
                    <Popconfirm title='确定删除？' onConfirm={() => {
                       //setData([])
                        setData((value:any[])=>value.filter(d => getRowKey(d) !== getRowKey(record)))
                    }}><a >删除</a></Popconfirm>
                </Space>
            }
        }])
    }, [columns, actionRef, getRowKey,setData,getData])
    const handleAddRow = useCallback(() => {
        actionRef.current?.addEditRecord({
             'id': uniqueId('__new__')
        }, {
            position: 'bottom',
            newRecordType: 'cache'
        })
    }, [])
    const handleSelectionEditableRows = useCallback((editableKeys: any) => {
        console.log('editableKeys', editableKeys)
        setEditableKeys(editableKeys)
    }, [setEditableKeys])
    const handleDelete = useCallback(() => {
        Modal.confirm({
            title: '温馨提示',
            content: '确定删除所有行？',
            onOk: () => {
              setData([])
            }
        })
    }, [])
    const handleChange = useCallback((value: any[]) => {
        console.log('handleChange', value)
    }, [])
 
    return <>
        <EditableProTable name={name} summary={(data) => {

            return <Table.Summary.Row>
                <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
          <Table.Summary.Cell index={1}></Table.Summary.Cell>
          <Table.Summary.Cell index={2}></Table.Summary.Cell>
          <Table.Summary.Cell index={3}></Table.Summary.Cell>
            <Table.Summary.Cell index={4}></Table.Summary.Cell>
            </Table.Summary.Row>
        }}  rowSelection={{
            type: 'radio'
        }} editableFormRef={editableFormRef} actionRef={actionRef} bordered size='small' toolbar={{
            settings: [],
            actions: [<Button onClick={handleAddRow}>添加行</Button>, <Popconfirm onConfirm={handleDelete} title='确定要删除全部?'><Button>删除全部</Button></Popconfirm>]
        }}  editable={{
            type:'multiple',
            onChange(keys,rows){
                console.log('editable:onChange','keys',keys,'rows',rows)
            },
            onValuesChange(record,data){
                console.log('editable:onValuesChange','record',record,'data',data)
            },
            onSave(key,record,originRow){
                
                const data=editableFormRef.current?.getRowData(key)
                console.log('editable:onSave','key',key,'record',record,'originRow',originRow,'data',data)
                 
                
            }
        }}   onChange={handleChange} recordCreatorProps={false} rowKey={rowKey} columns={mergeColumns} {...restTableProps}></EditableProTable>
    </>
}
const EditPage = () => {

    const [form] = ProForm.useForm()
    const [dataSource, setDataSource] = useState<any[]>([])
    const columns: ProColumns[] = [
        {
            title: '序号',
            editable: false,
            renderText(text, record, index, action) {
                return index + 1
            },
        }, {
            title: '评审月份',
            dataIndex: 'psyf',
            valueType: 'date',
            // transform: (value, namePath, allValues) => {
            //     console.log('transform')
            //     return value.format("YYYY-MM-DD")
            // },
            // convertValue(value) {
            //     console.log('convertValue2', value)
            //     return dayjs(value).isValid() ? dayjs(value) : undefined
            // },
            fieldProps:{
              //  format:'YYYY-MM-DD'
            },
            formItemProps: {
                rules: [{
                    required: true,
                    type: 'string',
                    message: '请选择${label}'
                }],
                getValueFromEvent(e){
                    return e?e.format('YYYY-MM-DD'):e
                }
                // normalize(value){
                //     return dayjs(value).isValid()?dayjs(value):undefined
                // }      
            }
        

        },{
            title:'分区',
            children:[
                {
                    title:'分区1',
                    dataIndex:'fenqu1',
                    width:120
                },  {
                    title:'分区2',
                    dataIndex:'fenqu2',
                    width:120
                }
            ]
        },
        {
            title: '工程公司',
            dataIndex: 'gcgs',
            valueType: 'text'
        },
        {
            title: '地盘名称',
            dataIndex: 'dpmc',
            valueType: 'select',
            request: async () => {
                return [{ label: '地盘1', value: '地盘1' }, { label: '地盘2', value: '地盘2' }]
            }
        }

    ]
    useEffect(() => {
        setTimeout(() => {
            form.setFieldsValue({
                list: [{
                    "id": "32",
                    "psyf": "2025-10-11",
                    "gcgs": "43",
                    "dpmc": "地盘2",
                }]
            })
        }, 200)
    }, [])
    //const list=ProForm.useWatch('list',form)||[]
    return <>
        <ProForm form={form} submitter={false} initialValues={{ list: [],person:['张三','李四'] }} onFinish={(values) => {
            console.log('onFinish', values)
        }}>
            <Button htmlType='submit'>提交</Button>
            <Form.Item name='month' >
                <DatePicker picker='month' format={'M'}></DatePicker>
            </Form.Item>
            <Form.Item name='name' label='獎項名稱' rules={[{ required: true, message: '請填寫' }]}>
                <Input></Input>
            </Form.Item>
             <Form.Item name='person' label='人员多选' rules={[{ required: true, message: '請填寫' }]}>
                <Select filterOption={(inputValue,option)=>{
                    return option?.label.includes(inputValue)
                }} onSelect={(value,option)=>{
                    console.log('onSelect','value',value,'option',option)
                }} onSearch={(value)=>{
                        console.log('onSearch',value)
                }} onChange={(value,option)=>{
                    console.log('onChange','value',value,'option',option)  
                }} mode='multiple' options={[{label:'张三',value:'张三',age:43},{label:'李四',value:'李四',age:18},{label:'王五',value:'王五',age:19},{label:'赵六',value:'赵六',age:28}]} ></Select>
            </Form.Item>

            <ProEditTable form2={form} rowKey={'id'}  name={'list'} columns={columns}></ProEditTable>
        </ProForm>

    </>
}

export default EditPage