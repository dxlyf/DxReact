
import {BetaSchemaForm} from '@ant-design/pro-components'
import { Button, message } from 'antd/lib'
import { useEffect, useState } from 'react'
import request from 'src/utils/request'
import ConnectWrap from '../components/ConnectWrap'


export default function Query(){
    const [loading, setLoading] = useState(false)

    return <ConnectWrap>
        <BetaSchemaForm onFinish={async (values: any) => {
            setLoading(true)
        request.post('/db/query', {
            sql: values.sql
        }).then(() => {

        }, (e) => {
            //message.error('连接失败',e.message)
        }).finally(()=>{
            setLoading(false)
        })
    }} submitter={{
        submitButtonProps:{
            loading:loading
        },
        searchConfig: {
            submitText: loading?'查询中...':'查询'
        }
    }} columns={[
            {
                title:'sql',
                dataIndex:'sql',
                valueType:'textarea'
            }
        ]}></BetaSchemaForm>
    </ConnectWrap>
}