
import { useMemo } from 'react'
import {useTable,type TableColumn} from 'src/pages/antd/hooks/useTable'
import {Table} from 'antd'
import {groupBy} from 'lodash-es'
import type { CallbacksResult } from 'src/hooks/useCallbacks'
import { delay } from 'src/utils/utils'

export default function WLTJList(props:{callbacks:CallbacksResult<['onExport']>}){
    const {callbacks}=props
    const [tableProps]=useTable({
        showSerialNumber:false,
        columns:useMemo(()=>[
            {
                title:'工程公司',
                dataIndex:'company',
                onCell:(record,index:number)=>{
                    return {
                        rowSpan:record.rowSpan
                    }
                }
            },
            {title:'地盘编码',dataIndex:'siteCode'},
            {title:'地盘名称',dataIndex:'siteName'},
            {
                title:'合计',
                dataIndex:'total',
                onCell:(record,index:number)=>{

                    return {
                        rowSpan:record.rowSpan

                    }
                }
            }
        ] as TableColumn[],[]),
        request:async ()=>{
            const data=[
                {
                    company:'房屋工程部',
                    siteCode:'地盘编码1',
                    siteName:'地盘名称1'
                },{
                    company:'房屋工程部',
                    siteCode:'地盘编码3',
                    siteName:'地盘名称3'
                },
                 {
                    company:'医疗公司',
                    siteCode:'地盘编码1',
                    siteName:'地盘名称1'
                },                {
                    company:'医疗公司',
                    siteCode:'地盘编码3',
                    siteName:'地盘名称3'
                },                {

                    company:'土木工程',
                    siteCode:'地盘编码3',
                    siteName:'地盘名称3'
                },
                 {
                    company:'房屋工程部',
                    siteCode:'地盘编码2',
                    siteName:'地盘名称2'
                },
                                {
    
                    company:'医疗公司',
                    siteCode:'地盘编码2',
                    siteName:'地盘名称2'
                }
            ].map((d,i)=>{
                return {
                    id:i,
                    ...d,
                    siteCode:d.company+'_'+d.siteCode,
                    siteName:d.company+'_'+d.siteName,
                }
            })
        
            const groupData=groupBy(data,d=>d.company)
            const newData=Object.keys(groupData).flatMap((key,i)=>{
                return groupData[key].map((child,i,arr)=>{
                    return {
                        ...child,
                        rowSpan:i===0?arr.length:0,
                        total:i===0?19:0,
                    }
                })
            })

            const total=data.length
             return {data:newData,total:total}
        }
    })

    callbacks.onExport(async (id)=>{
         await delay(2000)
         console.log('导出数据',id)
         
    })
    return <>
    <Table {...tableProps}></Table>
    </>
}