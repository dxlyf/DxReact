
import { BetaSchemaForm,ProForm } from '@ant-design/pro-components'
import { Button, message, Spin } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import * as dbServices from 'src/services/db'
import type {TableDescribe} from 'src/services/db'
type ConnectDBAPI = {
    database:string
    tables:string[]
    tableDescribe:(table:string)=>Promise<TableDescribe>
}
type ConnectDBProps = {
    children?: React.ReactNode|((api:ConnectDBAPI)=>React.ReactNode)
}

export default function ConnectDB(props: ConnectDBProps) {
    const { } = props
    const [form]=ProForm.useForm()
    const [loading, setLoading] = useState(true)
    const [connectLoading,setConnectLoading]= useState(false)
    const [connection, setConnection] = useState(false)
    const [tables,setTables]=useState<string[]>([])

    useEffect(() => {
        dbServices.isConnection().then((res) => {
            if (res.data) {
                setConnection(true)
            }
        }).finally(()=>{
            setLoading(false)
        })
    }, [])
    useEffect(()=>{
        if(connection){
            dbServices.currentTables().then((res)=>{
                setTables(res.data)
            })
        }
    },[connection])
    const api=useMemo<ConnectDBAPI>(()=>{
        const database=form.getFieldValue('database')
        return {
            database:database,
            tables,
            tableDescribe:(table:string)=>dbServices.tableDescribe(table).then(d=>d.data)
        }
    },[tables])
    if (loading){
         return <Spin>加载中...</Spin>
    }
    
    if (connection) {
        if (props.children) {
            return typeof props.children==='function'?props.children(api):props.children

        }
        return <div>已连接<Button onClick={() => {
            dbServices.close().then(() => {
                setConnection(false)
            })
        }}>退出</Button></div>
    }
    return <BetaSchemaForm form={form} onFinish={async (values: any) => {
        setConnectLoading(true)
        dbServices.connection({
            database: values.database,
            username: values.username,
            password: values.password,
            host: values.host,
            port: values.port,
            type: values.type,

        }).then(() => {
            message.success('连接成功')
            setConnection(true)
        }, (e) => {
            //message.error('连接失败',e.message)
        }).finally(()=>{
            setConnectLoading(false)
        })
    }} submitter={{
        submitButtonProps:{
            loading:connectLoading
        },
        searchConfig: {
            
            submitText: connectLoading?'连接中...':'连接'
        }
    }} initialValues={{ type: 'mysql', port: '3306', database: '20250909150940qrknakmd', host: '10.148.26.41', username: 'qrknakmd_474', password: 'XtUb_4251940' }} layout='horizontal' title={'数据库连接'} columns={[
        {
            title: '数据库服务器地址',
            dataIndex: 'host',
            valueType: 'text',
            formItemProps: {
                required: true,
            }
        }, {
            title: '端口号',
            dataIndex: 'port',
            valueType: 'text',
            formItemProps: {
                required: true,
            }
        }, {
            title: '数据库类型',
            dataIndex: 'type',
            valueType: 'select',
            fieldProps: {
                options: [
                    {
                        label: 'MySQL', value: 'mysql'
                    },
                    {
                        label: 'PostgreSQL', value: 'postgres'
                    },
                    {
                        label: 'SQLite', value: 'sqlite'
                    }, {
                        label: 'SqlServer', value: 'sqlserver'
                    }, {
                        label: 'Oracle', value: 'oracle'
                    }
                ]
            }
        }, {
            title: '数据库名称',
            dataIndex: 'database',
            valueType: 'text',
        },
        {
            title: '用户名',
            dataIndex: 'username',
            valueType: 'text'
        },
        {
            title: '密码',
            dataIndex: 'password',
            valueType: 'password'
        }
    ]}>

    </BetaSchemaForm>
}