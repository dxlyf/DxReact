import {Tabs,Collapse, Form, Input, Button, Row, Col} from 'antd'
import type {GetProp,GetProps,GetRef} from 'antd'
import { debounce } from 'lodash-es'
import { useCallback, useEffect, useMemo } from 'react'
import {chunk} from 'src/utils/utils'
import {ProFormItemField} from '../components/Form/Item'
import ProSelect from '../components/Select'
 import {request} from 'src/utils/request'
 function delay(wait:number) {
    return new Promise((resolve)=>{
        setTimeout(resolve,wait)
    })
}
const BasicForm=({form:propForm})=>{
 const [form]=Form.useForm(propForm)
    return <Form layout='vertical' name='basic' form={form} onFinish={(values)=>{
        console.log('basicform',values)
    }}>
        <ProFormItemField valueType='text' label='名称' required name={'name'}></ProFormItemField>
    </Form>
}
const AttachmentForm=({form:propForm})=>{
    const [form]=Form.useForm(propForm)
    return <Form layout='vertical' name='attach' form={form}>
        <ProFormItemField valueType='text' label='附件' required name={'file'}></ProFormItemField>
    </Form>
}
const Demo=()=>{

    const [basicform]=Form.useForm()
  const [attachform]=Form.useForm()
 
    const tabItems=useMemo<GetProp<typeof Tabs,'items'>>(()=>{

        return [{
            key:'a',
            label:'基本信息',
            children:<BasicForm form={basicform}></BasicForm>
        },{
            key:'a2',
            label:'附件信息',
            children:<AttachmentForm form={attachform}></AttachmentForm>
        }]
    },[])
    const handleFinish=useCallback<GetProp<typeof Form.Provider,'onFormFinish'>>((name,info)=>{
        const {values,forms}=info   
        console.log('name',name,'submit',values)
    },[])
    useEffect(()=>{
        // form.setFieldsValue({
        //     user:26,

        // })
    },[])
    return <>
    <Form.Provider  onFormFinish={handleFinish}>
        <Tabs items={tabItems} defaultActiveKey={tabItems[0].key}  style={{ background: '#fff' }}></Tabs>
        <Button onClick={()=>{
            basicform.submit()
        }}>提交</Button>
    </Form.Provider>
    </>
}


export default Demo 