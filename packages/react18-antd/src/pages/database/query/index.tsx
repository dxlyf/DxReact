
import {BetaSchemaForm} from '@ant-design/pro-components'
import { Button, message } from 'antd/lib'
import { useEffect, useState } from 'react'
import * as dbServices from 'src/services/db'
import ConnectWrap from '../components/ConnectWrap'


export default function Query(){
    const [loading, setLoading] = useState(false)

    return <ConnectWrap>
        <BetaSchemaForm initialValues={{type:dbServices.QueryTypes.SELECT}} onFinish={async (values: any) => {
            setLoading(true)
        dbServices.query(values.sql,values.type).then(() => {

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
            },{
                title:'类型',
                dataIndex:'type',
                valueType:'select',
                valueEnum:dbServices.QueryTypes
            }
        ]}></BetaSchemaForm>
    </ConnectWrap>
}