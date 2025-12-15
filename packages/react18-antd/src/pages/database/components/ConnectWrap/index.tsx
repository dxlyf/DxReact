
import { BetaSchemaForm } from '@ant-design/pro-components'
import { Button, message, Spin } from 'antd'
import React, { useEffect, useState } from 'react'
import request from 'src/utils/request'


export default function ConnectDB(props: { children?: React.ReactNode }) {
    const { } = props
    const [loading, setLoading] = useState(true)
    const [connectLoading,setConnectLoading]= useState(false)
    const [connection, setConnection] = useState(false)
    useEffect(() => {
        request.get<boolean>('/db/connectionState').then((res) => {
            if (res.data) {
                setConnection(true)
            }
        }).finally(()=>{
            setLoading(false)
        })
    }, [])
    if (loading){
         return <Spin>加载中...</Spin>
    }
    
    if (connection) {
        if (props.children) {
            return props.children
        }
        return <div>已连接<Button onClick={() => {
            request.post('/db/close').then(() => {
                setConnection(false)
            })
        }}>退出</Button></div>
    }
    return <BetaSchemaForm onFinish={async (values: any) => {
        setConnectLoading(true)
        request.post('/db/connection', {
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