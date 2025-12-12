import {Tabs,Collapse, Form, Input, Button, Row, Col, Space,Card,Upload} from 'antd'
import type {GetProp,GetProps,GetRef} from 'antd'
import { debounce } from 'lodash-es'
import { useCallback, useEffect, useMemo ,useState,useImperativeHandle} from 'react'
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

     console.log(Object.keys(form.getFieldsValue()))
 },[])
    return <Form layout='vertical' name='basic' form={form} onFinish={(values)=>{
        console.log('basicform',values)
    }}>
        <ProFormItemField valueType='text' label='名称' required name={'name'}></ProFormItemField>
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