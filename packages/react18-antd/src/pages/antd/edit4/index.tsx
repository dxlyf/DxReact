import { ConfigProvider, Form, Collapse, Tabs, Row, Space, Col, Input, Select, Upload, Checkbox, DatePicker, Table, Descriptions, Grid, Button, InputNumber, Popover, Alert, message, Switch, Modal, Typography, Radio } from 'antd'
import type { FormItemProps, TabsProps, CollapseProps, GetProp, GetProps, GetRef, FormListOperation } from 'antd'
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import styles from './index.module.scss'
import { InfoCircleOutlined, MinusOutlined, PlusOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons'
import { useMemoizedFn, useLatest, useUpdateEffect, useClickAway } from 'ahooks'
import classNames from 'classnames'
import { ProUpload } from '../components/ProUpload'
import Decimal from 'decimal.js'
import { chain, pick } from 'lodash-es'
import AntTableEditDemo from './AntTableEditDemo'
import { useModal } from '../hooks/useModal2'
import { EditableProTable, ProTable,useMountMergeState} from '@ant-design/pro-components'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
const CategoryOptions=[
    {
        value:'綠色環保創優獎項',
        label:'綠色環保創優獎項',
        children:[{
            value:'聯合國工業髮展組織全球方案徵集倡議全球冠軍',
            label:'聯合國工業髮展組織全球方案徵集倡議全球冠軍'
        },{
            value:'香港傑出環境管理獎',
            label:'香港傑出環境管理獎'
        },{
            value:'香港環境卓越大獎',
            label:'香港環境卓越大獎'
        },{
            value:'香港建造業議會可持續建築大獎',
            label:'香港建造業議會可持續建築大獎'
        },{
            value:'香港環保建築大獎',
            label:'香港環保建築大獎'
        }]
    },
    {
        value:'安全生産創優獎項',
        label:'安全生産創優獎項',
        children:[
            {
                value:'香港公德地盤獎',
                label:'香港公德地盤獎'
            },
            {
                value:'香港建造業安全獎勵計劃',
                label:'香港建造業安全獎勵計劃'
            },
                        {
                value:'香港良好工作場所整理活動',
                label:'香港良好工作場所整理活動'
            },
            {
                value:'香港創意工程安全獎',
                label:'香港創意工程安全獎'
            },
            {
                value:'香港建造業安全大獎',
                label:'香港建造業安全大獎'
            },
            {
                value:'香港職業安全健康安全大獎',
                label:'香港職業安全健康安全大獎'
            },
            {
                value:'ISA國際安全獎',
                label:'ISA國際安全獎'
            },
            {
                value:'香港職業健康大獎',
                label:'香港職業健康大獎'
            }
        ]
    }
]

const Detail=()=>{
    return <ProTable columns={[{
        title:'员工编号',
    }]}></ProTable>
}
const DianPanList = ({modal,selectedRows:propsselectedRows}) => {

    const [detailModalDom,detailModal]=useModal({
        title:'查看奖金分配明细',
        footer:null,
        width:'60%'
    })
    
    const [selectedRows,setSelectedrows]=useState(()=>propsselectedRows)
    const actionRef=useRef<ActionType>()
    const columns = useMemo(() => {
        return [ {
            title: '地盤編碼',
            dataIndex: 'siteCode',
            width: 120,
            fixed: 'left',
            search: false,
        }, {
            title: '地盤名稱',
            dataIndex: 'siteName',
            width: 160,
            search: false,
        }, {
            title: '工程公司',
            dataIndex: 'company',
            width: 160,
            search: false,
        }, {
            title: '獎項名稱',
            dataIndex: 'awardName',
            search: true,
            width: 140
        },{
            title:'填表日期',
            dataIndex:'reportDate',
            valueType:'dateRange',
            width:200,
            search:true,
        }, {
            title: '類別',
            dataIndex: 'type',
            search: true,
            valueType:'select',
            fieldProps:{
                options:CategoryOptions
            },
            width: 120,
        }, {
            title: '獎別',
            dataIndex: 'awardCategory',
            search: false,
            width: 120,
        }, {
            title: '獲獎單位',
            dataIndex: 'awardUnit',
            search: false,
            width: 140,
        }, {
            title: '獲獎日期',
            dataIndex: 'awardDate',
            search: false,
            width: 140,
            // render: (text) => getDateTime(text,false),
        }, {
            title: '檔次',
            dataIndex: 'rank',
            search: false,
            width: 120,
        }, {
            title: '申請金額',
            dataIndex: 'applicationAmount',
            search: false,
            width: 120,
        }, {
            title: '狀態',
            dataIndex: 'approvalStatus',
            search: false,
            width: 120
        },{
            title:'操作',
            fixed:'right',
            width:120,
            valueType:'option',
            render(){
                return <a onClick={()=>{
                    detailModal.open()
                }}>查看明细</a>
            }
        }]
    }, [])

    modal.onSubmit(()=>{
       if(selectedRows.length<=0){
        message.info('请选择要添加的项')
        return
       }
       modal.submit(selectedRows)
    })
    return <><ProTable scroll={{x:'max-content'}} rowKey={'id'} tableAlertRender={false} options={false}  actionRef={actionRef} rowSelection={{
        alwaysShowAlert:false, 
        selectedRowKeys:selectedRows.map(d=>d.id),
        onChange(selectedRowKeys, selectedRows, info) {
            console.log('selectedRows',selectedRows)
            setSelectedrows(selectedRows)
        },
    }} columns={columns} request={async (params) => {
        const { current, pageSize, ...restParams } = params
        console.log('restParams',restParams)
        return {
            data: [{id:1,siteCode:'fd'}],
            total: 1,
            success: true
        }
    }}>

    </ProTable>
    {detailModalDom}
    </>
}
const Summary=Table.Summary
const EditPage = () => {
    const [form] = Form.useForm()
    const [data, setData] = useState([])
    const columns = useMemo<ProColumns[]>(() => {
        return [
            {
                title: '序号',
                render(text, record, index) {
                    return index + 1
                }
            },
            {
                title: '奖项名称',
                name: 'awardName',
                width: 160
            }, {
                title: '主办方',
                name: 'organizer',
                width: 160,
                sorter:true
            }, {
                title: '申请人',
                name: 'applicant',
                width: 160
            }, {
                title: '申请日期',
                name: 'applyDate',
                
                width: 160
            }, {
                title: '申请奖金总额',
                name: 'totalBonus'
            },
            {
                title: '操作',
                render(text, record, index) {
                    return <Space>
                        <a>查看明细</a>
                    </Space>
                }
            }
        ]
    }, [])
    const rowSelection: GetProp<typeof Table, 'rowSelection'> = {
        type: 'checkbox'
    }
    const [modalDom, modal] = useModal({
        title: '选择获奖地盘',
        okButtonProps: {},
        width: '80%',
        children: () => {
            return <DianPanList selectedRows={data}></DianPanList>
        },
        onSubmit(values) {
            setData([...values])
        },
    })
    return <>
        {modalDom}
        
        <Row justify={'end'}>
            <Col flex="none">
                <Space>
                    <Button size='small' onClick={() => {
                        modal.open()
                    }}>添加</Button>
                    <Button size='small'>删除</Button>
                </Space>
            </Col>
        </Row>
        <EditableProTable recordCreatorProps={false}></EditableProTable>
        <ProTable  showSorterTooltip={false} search={false} options={false} tableAlertRender={false} bordered size='small' columns={columns} dataSource={data} rowSelection={rowSelection} rowKey={'id'}></ProTable>
                    <Table summary={()=>{
                        return <Summary.Row>
                                <Summary.Cell index={0}></Summary.Cell>
                                   <Summary.Cell index={0}></Summary.Cell>
                                      <Summary.Cell index={0}></Summary.Cell>
                                         <Summary.Cell colSpan={5} index={0}></Summary.Cell>
                        </Summary.Row>
                    }}></Table>
    </>
}

export default EditPage