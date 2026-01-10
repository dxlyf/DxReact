
import {useMemo,useLayoutEffect,useCallback, useState} from 'react'
import styles from './index.module.scss'
import { Card,Col, Row,Space,Typography,Descriptions, Select, DatePicker, Radio, Button, Table} from 'antd'
import classNames from 'classnames'
import WLTJList from './WLTJList'
import useCallbacks from 'src/hooks/useCallbacks'
import { ExportOutlined } from '@ant-design/icons'
import { useTable } from '../../hooks/useTable'
import { delay } from 'src/utils/utils'
import exportImage from 'src/assets/images/export.png?url'

export default function Detail(){
    const callbacks=useCallbacks(['onExport'] as const)
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

    return <div className={styles.page}>
        <div className={styles.wrap}>
        <div className={classNames(styles.head)}>
         <div className={styles.headContent}>
               <Row className={styles.toolbar} justify={'space-between'}>
                <Col flex={'auto'}>
                <span className={styles.subTitle}>中建香港</span>
                <span className={styles.subText}> 总数量：30宗&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;安全违例：10宗&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;环保违例：5宗</span>
                </Col>
                <Col flex={'none'}>
                    <Space>
                        <Select size='small' placeholder='年度'></Select>
                        <DatePicker size='small' picker="year" placeholder='年度'></DatePicker>
                    </Space>
                </Col>
            </Row>
            <div className={styles.updateTime2}>数据统计规则：以上违例数据均按事发日期统计&nbsp;&nbsp;数据更新时间：2025-10-28 06:00:00</div>
         </div>
          <div className={styles.dividingLine}></div>
            <div className={styles.headContent}>
            <Row justify={'end'}>
                <Col>
                    <Button icon={<img src={exportImage} />}>导出数据</Button>
                </Col>
            </Row>
             <div style={{marginTop:20}}>
             <Table size='small' {...tableProps}></Table>
             </div>
            </div>
        </div>
    </div>
    </div>
}