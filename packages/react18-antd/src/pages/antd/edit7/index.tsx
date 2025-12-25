import {Tabs,Collapse, Form, Input, Button, Row, Col, Space,Card,Upload, InputNumber} from 'antd'
import type {GetProp,GetProps,GetRef,FormInstance} from 'antd'
import { debounce } from 'lodash-es'
import React, { useCallback, useEffect, useMemo ,useState,useImperativeHandle} from 'react'
import {chunk} from 'src/utils/utils'
import {ProFormItemField} from '../components/Form/Item'
import MixUpload, { type CustomUploadFile } from '../components/MixUpload'
 import {request} from 'src/utils/request'
import { SimpleUpload ,CustomeRequest} from '../components/SimpleUpload'
import imageUrl from 'src/assets/images/image.jpg?url'
 function delay(wait:number) {
    return new Promise((resolve)=>{
        setTimeout(resolve,wait)
    })
}

const BasicForm=({form:propForm})=>{
 const [form]=Form.useForm(propForm)
 useEffect(()=>{
      form.setFieldValue('sum_a',10)
        form.setFieldValue('sum_b',10)
     console.log(Object.keys(form.getFieldsValue()))
 },[])
    return <Form onValuesChange={(changedValues,values)=>{
       console.log('onValuesChange',changedValues)
       if(Object.hasOwn(changedValues,'sum_a')||Object.hasOwn(changedValues,'sum_b')){
              const a=values.sum_a
              const b=values.sum_b
              const sum=Number.isFinite(a)&&Number.isFinite(b)?a+b:0
              form.setFieldValue('sum_d',sum)
       }
    }} onFieldsChange={(changedFields)=>{
       console.log('onFieldsChange',changedFields)
    }} layout='vertical' name='basic' form={form} onFinish={(values)=>{
        console.log('basicform',values,'allValues',form.getFieldsValue(true))
    }}>
        <Button htmlType='submit'>提交</Button>
        <ProFormItemField valueType='text' label='名称'  name={'name'}></ProFormItemField>
      <Row>
        <Col span={8}>
          <Form.Item name='sum_a' label='a'>
        <InputNumber></InputNumber>
          </Form.Item>
  
          </Col>
          <Col span={8}>
           <Form.Item name='sum_b' label='b'>
                    <InputNumber></InputNumber>
          </Form.Item></Col>
          <Col span={8}>
          <Form.Item name='sum_d' label='sum_d'>
            <InputNumber disabled></InputNumber>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prevValues,nextValues)=>{
            return prevValues.sum_a!==nextValues.sum_a||prevValues.sum_b!==nextValues.sum_b
          }}>
            {(form)=>{
            
              const a=form.getFieldValue('sum_a')
              const b=form.getFieldValue('sum_b')
              const sum=Number.isFinite(a)&&Number.isFinite(b)?a+b:0
              console.log('sum',a,b,sum)
              return <Form.Item  label='sum' name={'sum_c'}>
              <FormItemText form={form} name='sum_c' updateValue={sum}>{()=><InputNumber disabled value={sum}></InputNumber>}</FormItemText>
          </Form.Item>
            }}
          </Form.Item>
          </Col>
      </Row>
    
    </Form>
}

const AttachmentForm=({form:propForm})=>{
    const [form]=Form.useForm(propForm)
    const [fileList, setFileList] = useState<CustomUploadFile[]>([]);

  const handleChange = (files: CustomUploadFile[]) => {
    setFileList(files);
  };

  // 自定义上传前处理
  const customBeforeUpload = (file: File) => {
    // 可以添加额外的验证逻辑
    console.log('自定义验证:', file.name);
    return true;
  };
  useEffect(()=>{
        form.setFieldValue('file_simple',[
            {
                url:imageUrl,
                name:'image.png',
                status:'error',
                percent:80
            },{
              url:'fd.docx',
              name:'嚅全哈奔工.docx',
              status:'done',
              percent:100
            }
        ])
  },[])
    return <Form layout='vertical' name='attach' form={form}>
        <Button htmlType='submit'>提交</Button>
 <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
         <Card title='原生'>
             <Upload listType='picture-card' customRequest={CustomeRequest}>上传</Upload>
        </Card>
        <Card title='SimpleUpload'>
            <Form.Item label='文件上传' name={'file_simple'}>
                  <SimpleUpload extensions={['png','jpg']}></SimpleUpload>
            </Form.Item>
        </Card>
        <Card title="严格限制的文件上传" size="small">
          <MixUpload
            value={fileList}
            onChange={handleChange}
            listType="picture-card"
            maxCount={3}
            maxSize={2} // 2MB
            accept=".jpg,.jpeg,.png,.pdf"
            fileTypeErrorMsg="只支持 JPG, PNG, PDF 格式"
            fileSizeErrorMsg="文件太大"
            fileCountErrorMsg="最多上传3个文件"
            beforeUpload={customBeforeUpload}
          />
        </Card>
        <Card title="严格限制的文件上传" size="small">
          <MixUpload
            value={fileList}
            onChange={handleChange}
            listType="picture-card"
            maxCount={3}
            maxSize={2} // 2MB
            accept=".jpg,.jpeg,.png,.pdf"
            fileTypeErrorMsg="只支持 JPG, PNG, PDF 格式"
            fileSizeErrorMsg="文件太大"
            fileCountErrorMsg="最多上传3个文件"
            beforeUpload={customBeforeUpload}
          />
        </Card>

        <Card title="宽松的文件上传" size="small">
          <MixUpload
            value={fileList}
            onChange={handleChange}
            listType="text"
            maxCount={10}
            maxSize={50} // 50MB
            accept="*"
          />
        </Card>

        <Card title="当前文件列表" size="small">
          <div>
            {fileList.map(file => (
              <div key={file.uid} style={{ marginBottom: '8px' }}>
                {file.name} - {file.status}
              </div>
            ))}
          </div>
          <Button 
            onClick={() => setFileList([])} 
            style={{ marginTop: '16px' }}
          >
            清空列表
          </Button>
        </Card>
      </Space>
    </div>
  );
    </Form>
}
type FormItemTextProps={
  name:any
  updateValue?:any
  form?:FormInstance
  onChange?:(value:any)=>void;
  children:(props:FormItemTextProps)=>React.ReactNode;
}

const FormItemText=(props:FormItemTextProps)=>{
  const {name,updateValue,form:propForm,onChange}=props
 
  const _form=Form.useFormInstance()
  const form=propForm||_form
   useEffect(()=>{
     //form.setFieldValue(name,updateValue)
     onChange?.(updateValue)
   },[updateValue])
                   console.log('依赖：',updateValue)
   return props.children(props)
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
    </Form.Provider>
    </>
}


export default Demo 