import { Button, Col, Form, Modal, Row, Space, Table,type TableProps,Input } from "antd"
import { useCallback, useEffect, useMemo } from "react"
import {useAntdTable} from 'ahooks'
import {useModal,ModalStore} from '../hooks/useModal'

const EditDetail=(props:{modal:ModalStore})=>{
    const {modal}=props
    const [form]=Form.useForm()
    modal.register({
        onSubmit:async ()=>{
           return form.validateFields().then((res)=>res,()=>false)

        },
        onCancel:async()=>{
           return form.validateFields().then((res)=>res,()=>false)
        }
    })
    useEffect(()=>{
        console.log('modal.modalStore',)
    },[modal])
    const handleFinish=useCallback(async (values:any)=>{
        console.log('handleFinish',values)
    },[])
      const handleFinishFailed=useCallback(async (values:any)=>{
        console.log('handleFinishFailed',values)
    },[])
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

    const [modalProps,modal]=useModal({
        title:'工人原因',
        getModalStageProps(store){
            return {
                title:store.data?.title
            }
        },
        children:(istance)=><EditDetail modal={istance}></EditDetail>
    })
    return <>
    <Modal {...modalProps}></Modal>
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