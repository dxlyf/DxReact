import { Button, Col, Form, Modal, Row, Space, Table,type TableProps,Input } from "antd"
import { useCallback, useEffect, useMemo } from "react"
import {useAntdTable} from 'ahooks'
import {useModal,type UseModalInstance} from '../hooks/useModal'

const EditDetail=(props:{modal:UseModalInstance})=>{
    const {modal}=props
    const [form]=Form.useForm()
    modal.modalStore.register({
        onSubmit:async ()=>{
            try{
                console.log('ffff')
                await form.validateFields()
                
            }catch {
                return false
            }

        }
    })
    useEffect(()=>{
        console.log('modal.modalStore',)
    },[modal.modalStore])
    const handleFinish=useCallback(async (values:any)=>{
        console.log('handleFinish',values)
    },[])
    return <Form form={form}  onFinish={handleFinish}>
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
                    modal.current.open()
                }} type="primary">新增</Button>
            </Space>
        </Col> 
    </Row>
    <Table rowKey='id' columns={columns} {...tableProps}></Table> 
    </>
}