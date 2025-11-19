import { Button, Col, Form, Modal, Row, Space, Table,type TableProps,Input, Checkbox } from "antd"
import { useCallback, useEffect, useMemo } from "react"
import {useAntdTable} from 'ahooks'
import {useModal,type ModalInstance} from '../hooks/useModal2'
import useRequest from "src/hooks/useRequest"
import request from "src/utils/request"
import TableBtnAction from "../components/TableBtnAction"

function delay(wait:number){
    return new Promise(resolve=>setTimeout(()=>resolve(''),wait))
}
const EditDetail=(props:{modal:ModalInstance})=>{
    const {modal}=props
    const [form]=Form.useForm()
    
    const handleFinish=useCallback(async (values:any)=>{
        console.log('handleFinish',values)
        modal.setLoading(true)
        //modal.submit(values,true)
    },[])
      const handleFinishFailed=useCallback(async (values:any)=>{
        console.log('handleFinishFailed',values)
    },[])
    modal.onSubmit(()=>{
         form.submit()
    })
    return <Form form={form} layout='vertical'  onFinish={handleFinish} onFinishFailed={handleFinishFailed}>
        <Form.Item label='名称' name='name' required rules={[{type:'string',whitespace:true,required:true,message:'请输入名称'}]}>
            <Input></Input>
        </Form.Item>
              <Form.Item label='名称' name='age' required rules={[{type:'string',whitespace:true,required:true,message:'请输入名称'}]}>
            <Input></Input>
        </Form.Item>
        <Button onClick={()=>{
            form.submit()
        }}>add</Button>

    </Form>
}
export default ()=>{
    const [form]=Form.useForm()
    const {data,pagationInfo,setPagationInfo,read}=useRequest({
        defaultData:[],
        pagation:{
            pageSize:10,
            current:1,
        },
        request:async (params)=>{  
             const res=await request.post<{records:any[],total:number}>('/list',params)
             const records=res.data.records
             const total=res.data.total
             return {data:records,total}
        }
    })
    const columns=useMemo<NonNullable<TableProps['columns']>>(()=>[
        {
            title:'姓名与年龄',
            children:[
                {
                    dataIndex:'name',
                    width:120
                },
                {
                    dataIndex:'age',
                    width:120
                }
            ]
        },{
            title:'名称',
            dataIndex:'name',
            align:'center',
            width:200
        } ,   {
            title:'age',
            dataIndex:'age'
        },{
            width:200,
            title:'操作',
            fixed:'right',
            render(_,record){
                return <TableBtnAction onItemClick={async (item)=>{
                    if(item.key=='del'){
                        await delay(2000)
                        return false
                    }else{
                        console.log(item.key)
                    }
                }}></TableBtnAction>
            }
        }
    ],[])
    
    const SearchFormItems=useMemo(()=>[{
        dataIndex:'name',
        Component:Input
    }],[])

    const [modalDom,modal]=useModal({
        title:'工人原因',
        destroyOnHidden:false,
        getModalStageProps(store){
            return {
                title:store.data?.title
            }
        },
        onSubmit(values){
            console.log('values',values)
        },
        children:(istance)=><EditDetail></EditDetail>
    })
    return <>
    {modalDom}
    <Form form={form} onFinish={(values)=>{
        setPagationInfo({current:1})
        read({name:values.name})   
    }}>
        <Form.Item label='名称' name={'name'}>
            <Input></Input>
        </Form.Item>
        <Button htmlType="submit">查询</Button>
    </Form>
    <Row justify={'end'}>
        <Col flex={'none'}>
            <Space>
                <Button onClick={()=>{
                    modal.open({title:'新增'})
                }} type="primary">新增</Button>
            </Space>
        </Col> 
    </Row>

    <Table rowKey='id'  onChange={(pagationInfo)=>{
            setPagationInfo((v)=>({...v,pageSize:pagationInfo.pageSize,current:pagationInfo.current}))
            read({},true)
    }} pagination={{
        current:pagationInfo.current,
        pageSize:pagationInfo.pageSize,
        total:pagationInfo.total,
    
    }} dataSource={data} scroll={{x:'100%'}} columns={columns} ></Table> 
    </>
}