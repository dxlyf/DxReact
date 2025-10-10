import { Button, Col, Form, Modal, Row, Space, Table,type TableProps,Input } from "antd"
import { useCallback, useEffect, useMemo } from "react"
import {useAntdTable} from 'ahooks'
import {useModal,type ModalInstance} from '../hooks/useModal2'

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
    const columns=useMemo<NonNullable<TableProps['columns']>>(()=>[
        {
            title:'名称',
            dataIndex:'name'
        }
    ],[])
    const {tableProps,search}=useAntdTable(async (params,filters)=>{
        console.log('filters',filters)
         return {
            total:0,
            list:[]
         }
    },{
        form
    })

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
    <Form form={form}>
        <Form.Item label='名称' name={'name'}>
            <Input></Input>
        </Form.Item>
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
    <Table rowKey='id' columns={columns} {...tableProps}></Table> 
    </>
}