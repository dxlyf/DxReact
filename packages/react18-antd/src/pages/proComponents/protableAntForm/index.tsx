

import { useCallback, useMemo, useRef, useState } from 'react'
import { SchemaForm, useSchemaForm, useSchemaFormColumns } from '../components/SchemaForm'
import { Table, useTable, useTableRequest, useTableColumns, type TableColumn, type ActionType } from '../components/Table'
import { request } from 'src/utils/request'
import { SettingOutlined } from '@ant-design/icons'
import { Button, Col, Dropdown, Input, Popover, Row, Space, Form, Radio, Flex } from 'antd'
import dayjs from 'dayjs'
import { ProTable,type ProColumnType } from '@ant-design/pro-components'
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
        data: list.slice(current * pageSize - pageSize, current * pageSize),
        total: list.length
    }
}
export default () => {
    const actionRef = useRef<ActionType>(null)
    const [data, setData] = useState<any[]>(()=>[{id:1,name:'',sex:'男',age:43},{
        id:2,name:'',sex:'女',age:43
    }])
    const [form]=Form.useForm()
    const columns=useMemo<ProColumnType[]>(()=>[
        {
            title:'名称',
            dataIndex:'name',
            editable:()=>true,
            valueType:'text',
            formItemProps:{
                rules:[{required:true}]
            }
        },
        {
            title:'性别',
            dataIndex:'sex',
            editable:()=>true,
            valueType:'select',
            valueEnum:{
                '男':{text:'男'},
                '女':{text:'女'}
            }
        },
        {
            title:'年龄',
            dataIndex:'age',
            editable:false
        }
    ],[])
    return <>
        <Form form={form}  onFinish={(values)=>{
                console.log(values)

        }}>
    
            <Row align="middle" justify='center'></Row>
        <Button htmlType='submit' type='primary'>提交</Button>
        <ProTable editable={{
            tableName:'bb',
            form:form,
            editableKeys:['1']
        }} search={false} options={false} rowKey={'id'} name='list'  dataSource={data} columns={columns}></ProTable>
    </Form>
    </>
}